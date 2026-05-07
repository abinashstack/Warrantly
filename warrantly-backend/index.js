import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import Tesseract from "tesseract.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const app = express();
const port = 5000;

app.use(cors());

const upload = multer({ dest: "upload/" });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const extractFieldsFromOCR = async (ocrText) => {
  const prompt = `
Extract the following fields as JSON from the OCR text:
- product_name
- brand (must be the product's manufacturer or label, not the seller/shop name. If not obvious, infer from email addresses, product codes, will be there in the email address)
- invoice_date (format as YYYY-MM-DD)
- total_amount
- serial_number
- category
- product description (from the product name)
- Category (infer from product description if not explicitly mentioned like Electronics, Appliance, Furniture, Hob, Cooktop, Refrigerator, Washing Machine, TV, Laptop, Mobile, etc.)

OCR text:
${ocrText}

Return ONLY valid JSON.
`;

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  text = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();

  try {
    console.log("Gemini extracted fields:", JSON.parse(text));
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini response was not valid JSON:", text);
    throw new Error("Failed to parse Gemini response as JSON");
  }
};

const extractTextFromImage = async (imagePath) => {
  const {
    data: { text },
  } = await Tesseract.recognize(imagePath, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        process.stdout.write(`\rProgress: ${(m.progress * 100).toFixed(1)}%`);
      }
    },
  });
  return text;
};

const pickBestWarranty = async (product, warrantyData) => {
  const prompt = `
You are given a product and a list of warranty rules for a brand.
Pick the ONE warranty rule that best matches the product's category.

Product:
${JSON.stringify(product, null, 2)}

Warranty rules (array of objects):
${JSON.stringify(warrantyData, null, 2)}

Return ONLY valid JSON with this format:
{
  "id": "...",
  "category": "...",
  "product_type": "...",
  "base_warranty": <number of months>,
  "notes": "..."
}
  `;

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  text = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini warranty selection failed:", text);
    throw new Error("Failed to parse Gemini warranty JSON");
  }
};


app.post("/upload", upload.single("invoiceImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.decode(token);

  const userId = decoded.sub;

  if (!userId) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const filePath = path.resolve(req.file.path);

    //Upload the image into supabase bucket
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const bucketPath = `invoices/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(bucketPath, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("invoices")
      .getPublicUrl(bucketPath);

    const publicUrl = publicUrlData.publicUrl;

    const text = await extractTextFromImage(filePath);

    const { data: invoiceInsertData, error: dbInvoiceError } = await supabase.from("invoices").insert([
      {
        user_id: userId,
        storage_path: bucketPath,
        public_url: publicUrl,
        ocr_text: text,
        created_at: new Date().toISOString(),
      },
    ]).select('id')
      .maybeSingle();

    if (dbInvoiceError) {
      throw new Error(`DB insert failed: ${dbInvoiceError.message}`);
    }

    // // TODO - Integrate with chatGPT API to generate the JSON object of the relevant fields
    // const parsedFields = {
    //     product_brand_name: 'Glen',
    //     store_name: 'PRIYA KITCHEN WORLD',
    //     product_name: 'CT-1054 UT SS Al',
    //     product_description: 'Glen Cooktop model 1054 with Auto Ignition, Stainless Steel body, and Aluminium alloy components',
    //     invoice_date: '10-Nov-2024',
    //     total_amount: 11500.00,
    //     category: 'Hob'
    // }

    const parsedFields = await extractFieldsFromOCR(text);

    console.log(parsedFields);

    const brandName = parsedFields.brand?.trim().toLowerCase();
    const { data: brandData, error: brandError } = await supabase
      .from("brands")
      .select("brand_id")
      .ilike("brand_name", `%${brandName}%`)
      .limit(1)
      .maybeSingle();

    if (brandError) {
      throw new Error(`DB insert failed: ${brandError.message}`);
    }

    if (!brandData) {
      console.warn(`No brand found for: ${parsedFields.product_brand_name}`);
      return res.status(404).json({ error: "Brand not found in DB" });
    }

    //Fetch all the entries for a given brand, and then let AI decide the best match for the category
    const { data: warrantyData, error: dbWarrantyError } = await supabase
      .from('warranty_lookup')
      .select('id, category, base_warranty, notes')
      .eq('brand_id', brandData.brand_id);

    if (dbWarrantyError) {
      throw new Error(`DB warranty failed: ${dbWarrantyError.message}`);
    }

    const warrantyRow = await pickBestWarranty(parsedFields, warrantyData);

    if (!warrantyRow) {
      throw new Error(`No warranty match found for brand_id ${brandData.brand_id}`);
    }

    console.log(warrantyRow)
    const invoiceDate = new Date(parsedFields.invoice_date);
    const isoDate = invoiceDate.toISOString().split('T')[0];

    const expiryDate = new Date(isoDate);
    expiryDate.setMonth(expiryDate.getMonth() + warrantyRow.base_warranty);

    // Clean up total_amount
    const amount = parsedFields.total_amount ? parseFloat(parsedFields.total_amount.replace(/,/g, "")) : null;

    const { data: productInsertedData, error: dbProductError } = await supabase
      .from("products")
      .insert([
        {
          invoice_id: invoiceInsertData.id,
          product_brand_id: brandData?.brand_id || null,
          product_name: parsedFields.product_name,
          product_description: parsedFields.product_description,
          store_name: parsedFields.store_name,
          invoice_date: isoDate,
          total_amount: amount,
          warranty_duration: warrantyRow.base_warranty,
          warranty_expiry: expiryDate.toISOString().split("T")[0],
        },
      ])
      .select();

    if (dbProductError) {
      throw new Error(`DB insert failed: ${dbProductError.message}`);
    }

    // Fetch all products
    const { data: allProducts, error: allProductsError } = await supabase
      .from("products")
      .select("*");

    if (allProductsError) {
      console.error("Error fetching products:", allProductsError.message);
    } else {
      console.log("Fetched products:", allProducts);
    }

    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete temp file: ", err);
    });

    console.log(productInsertedData)
    res.status(200).json({ product: productInsertedData[0], publicUrl: publicUrl, warrantyRow: warrantyRow, products: allProducts });
  } catch (err) {
    console.error("OCR failed", err);
    res.status(500).json({ error: "OCR processing failed" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});