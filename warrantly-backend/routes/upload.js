import { createClient } from "@supabase/supabase-js";
import express from "express";
import { requireAuth } from '../auth/requireAuth.js';
import { createUserProductByDealer } from '../services/user-product.js';
import { calculateGST } from '../utils/calculateGST.js';
import { generateInvoiceNumber } from '../utils/generateInvoiceNumber.js';
import { generatePDF } from '../utils/generatePDF.js';


const router = express.Router();
// const upload = multer({ dest: "upload/" });

/* ---------- Gemini ---------- */
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/* ---------- Helpers ---------- */

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// const createUserSupabase = (token) => {
//     return createClient(
//         process.env.SUPABASE_URL,
//         process.env.SUPABASE_ANON_KEY,
//         {
//             global: {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             },
//         }
//     );
// };

// const extractTextFromImage = async (imagePath) => {
//     const {
//         data: { text },
//     } = await Tesseract.recognize(imagePath, "eng");
//     console.log("Text extracted from Invoice: ", text);
//     return text;
// };

// const CATEGORIES = [
//     "Air Conditioner",
//     "Washing Machine",
//     "Refrigerator",
//     "TV",
//     "Laptop",
//     "Mobile"
// ];

// const ITEMS = {
//     "Air Conditioner": [
//         "Split AC",
//         "Window AC"
//     ],
//     "Washing Machine": [
//         "Front Load",
//         "Top Load"
//     ]
// };

// const extractFieldsFromOCR = async (ocrText) => {
//     const prompt = `
// You are extracting structured data from an invoice.

// VERY IMPORTANT RULES:
// - You MUST choose category ONLY from this list:
//   ${JSON.stringify(CATEGORIES)}

// - You MUST choose item ONLY from the list corresponding to the chosen category:
//   ${JSON.stringify(ITEMS)}

// - If the product does NOT clearly match any category or item above,
//   return null for that field.
// - DO NOT invent new categories or items.
// - DO NOT return similar or approximate values.

// Return JSON with EXACTLY these fields:
// {
//   "product_name": string | null,
//   "brand": string | null,
//   "invoice_date": "YYYY-MM-DD" | null,
//   "total_amount": number | null,
//   "serial_number": string | null,
//   "category": string | null,
//   "item": string | null,
//   "product_description": string | null
// }

// OCR text:
// ${ocrText}

// Return ONLY valid JSON.
// `;


//     const result = await geminiModel.generateContent(prompt);
//     let text = result.response.text();
//     text = text.replace(/```json\n?|```/g, "").trim();
//     console.log("Fields extracted from OCR: ", text);
//     return JSON.parse(text);
// };

// /* ---------- Route ---------- */

// router.post(
//     "/",
//     requireAuth,
//     upload.single("invoiceImage"),
//     async (req, res) => {
//         try {
//             console.log("Upload endpoint triggered");

//             console.log("req.file:", req.file);
//             console.log("req.body:", req.body);


//             const token = req.headers.authorization.replace("Bearer ", "");
//             const supabase = createUserSupabase(token);
//             const userId = req.user.sub;

//             if (!req.file) {
//                 return res.status(400).json({ error: "No file uploaded" });
//             }

//             /* ---------- Upload invoice image ---------- */
//             const filePath = path.resolve(req.file.path);
//             const fileBuffer = fs.readFileSync(filePath);
//             const fileName = `${Date.now()}-${req.file.originalname}`;
//             const bucketPath = `invoices/${fileName}`;

//             const { error: uploadError } = await supabaseService.storage
//                 .from("invoices")
//                 .upload(bucketPath, fileBuffer, {
//                     contentType: req.file.mimetype,
//                 });

//             if (uploadError) throw uploadError;

//             const { data: publicUrlData } = supabaseService.storage
//                 .from("invoices")
//                 .getPublicUrl(bucketPath);

//             /* ---------- OCR ---------- */
//             const ocrText = await extractTextFromImage(filePath);
//             // const parsed = await extractFieldsFromOCR(ocrText);
//             const parsed = {
//                 product_name: "Samsung Split Air Conditioner",
//                 brand: "Samsung",
//                 invoice_date: "2023-07-15",
//                 total_amount: 37000,
//                 serial_number: "AR18CYSZAPGXNA",
//                 category: "Air Conditioners",
//                 item: "Split AC",
//                 product_description: "Samsung Split AC model AR18CYSZAPGXNA"
//             };


//             if (!parsed.category || !parsed.item) {
//                 return res.status(422).json({
//                     error: "Unsupported product",
//                     reason: "Could not classify category/item",
//                 });
//             }

//             /* ---------- Resolve brand ---------- */
//             const { data: brand } = await supabase
//                 .from("brands")
//                 .select("brand_id, brand_name")
//                 .ilike("brand_name", `%${parsed.brand}%`)
//                 .maybeSingle();

//             console.log("BRAND: ", brand)

//             if (!brand) {
//                 return res.status(404).json({ error: "Brand not found" });
//             }

//             /* ---------- Resolve category ---------- */
//             const { data: category } = await supabase
//                 .from("categories")
//                 .select("category_id, category_name")
//                 .eq("category_name", parsed.category)
//                 .maybeSingle();

//             console.log("CATEGORY: ", category);

//             if (!category) {
//                 return res.status(404).json({ error: "Category not found" });
//             }

//             /* ---------- Resolve item ---------- */
//             const { data: item } = await supabase
//                 .from("items")
//                 .select("item_id, item_name, item_image_url")
//                 .eq("item_name", parsed.item)
//                 .eq("category_id", category.category_id)
//                 .single();

//             console.log("ITEM: ", item);

//             if (!item) {
//                 return res.status(404).json({ error: "Item not found" });
//             }

//             /* ---------- Resolve catalog product ---------- */
//             const { data: product } = await supabase
//                 .from("products")
//                 .select("product_id, product_name")
//                 .eq("brand_id", brand.brand_id)
//                 .eq("item_id", item.item_id)
//                 .maybeSingle();

//             console.log("PRODUCT: ", product);

//             if (!product) {
//                 return res.status(404).json({ error: "Catalog product not found" });
//             }

//             /* ---------- Warranty preview ---------- */
//             const warrantyStart = parsed.invoice_date
//                 ? new Date(parsed.invoice_date)
//                 : null;

//             const warrantyEnd =
//                 warrantyStart
//                     ? new Date(
//                         new Date(warrantyStart).setMonth(
//                             warrantyStart.getMonth() + 12
//                         )
//                     )
//                     : null;

//             /* ---------- Cleanup ---------- */
//             fs.unlinkSync(filePath);

//             /* ---------- FINAL RESPONSE ---------- */
//             return res.status(200).json({
//                 product_preview: {
//                     product_id: product.product_id,
//                     product_name: parsed.product_name,
//                     brand: brand.brand_name,
//                     category: category.category_name,
//                     item: item.item_name,
//                     item_url: item.item_image_url,
//                     serial_number: parsed.serial_number,
//                     description: parsed.product_description,
//                 },
//                 invoice_preview: {
//                     invoice_date: parsed.invoice_date,
//                     total_amount: parsed.total_amount,
//                     invoice_url: publicUrlData.publicUrl,
//                 },
//                 warranty_preview: {
//                     warranty_start_date: warrantyStart,
//                     warranty_end_date: warrantyEnd,
//                     duration_months: 12,
//                 },
//                 raw_ocr_text: ocrText,
//             });
//         } catch (err) {
//             console.error("Upload failed:", err);
//             res.status(500).json({ error: "Upload processing failed" });
//         }
//     }
// );

router.post('/dealer', requireAuth, async (req, res) => {
    try {

        const userId = req.user.sub;

        const {
            owner_id,
            customer_name,
            customer_phone,
            customer_address,
            dealer_product_id,
            dealer_product_model_id,
            serial_number,
            purchase_date,
            base_price,
            product_name,
            model_number
        } = req.body;

        /* ===============================
           1️⃣ RESOLVE DEALER PROFILE
        =============================== */
        console.log('Resolving dealer for user:', userId);
        const { data, error } = await supabaseAdmin
            .from('dealer_user')
            .select(`dealer_id`)
            .eq('profile_id', userId)
            .single();

        if (error || !data) {
            return res.status(403).json({ error: 'Dealer not found for user' });
        }

        console.log('Resolved dealer:', data.dealer_id);

        const { data: dealer, error: dealerError } = await supabaseAdmin
            .from('dealer')
            .select(`dealer_name, dealer_address, gst_number`)
            .eq('dealer_id', data.dealer_id)
            .single();

        if (dealerError || !dealer) {
            return res.status(403).json({ error: 'Dealer info not found', dealerError });
        }

        console.log('Resolved dealer:', dealer);

        /* ===============================
           2️⃣ CREATE USER PRODUCT
        =============================== */

        console.log('Resolving dealer product for ID:', dealer_product_id);

        const { data: dealerProduct, error: dealerProductError } =
            await supabaseAdmin
                .from('dealer_product')
                .select(`product_id`)
                .eq('dealer_product_id', dealer_product_id)
                .single();

        if (dealerProductError || !dealerProduct) {
            throw new Error('Product not found');
        }

        console.log('Resolved dealer product:', dealerProduct);

        const { data: globalProduct, error: globalProductError } =
            await supabaseAdmin
                .from('product')
                .select(`product_name`)
                .eq('product_id', dealerProduct.product_id)
                .single();

        const productName = globalProduct.product_name;

        console.log('Resolved product:', productName);

        const { data: model, error: modelError } =
            await supabaseAdmin
                .from('dealer_product_model')
                .select('model_name, model_number')
                .eq('dealer_product_model_id', dealer_product_model_id)
                .single();

        if (modelError || !model) {
            throw new Error('Model not found');
        }

        console.log('Resolved model:', model.model_name);

        const result = await createUserProductByDealer(
            supabaseAdmin,
            data.dealer_id,
            req.body
        );

        console.log('Created user product:', result);

        /* ===============================
           3️⃣ CALCULATE GST
        =============================== */

        const gst = calculateGST(base_price);
        const invoiceNumber = generateInvoiceNumber();

        /* ===============================
           4️⃣ CREATE INVOICE
        =============================== */

        const { data: invoice, error: invoiceError } =
            await supabaseAdmin
                .from('invoices')
                .insert({
                    user_product_id: result.user_product.user_product_id,
                    invoice_number: invoiceNumber,
                    invoice_date: purchase_date,

                    dealer_id: data.dealer_id,
                    dealer_name: dealer.dealer_name,
                    dealer_address: dealer.dealer_address,
                    dealer_gstin: dealer.gst_number,

                    customer_name,
                    customer_phone,
                    customer_address,

                    product_name: productName,
                    model_number: model.model_number,
                    serial_number,

                    taxable_amount: gst.taxable_amount,
                    gst_percentage: gst.gst_percentage,
                    cgst_amount: gst.cgst_amount,
                    sgst_amount: gst.sgst_amount,
                    igst_amount: 0,

                    total_amount: gst.total_amount,
                    currency: 'INR',

                    source_type: 'DEALER',
                    is_verified: true,
                    verification_method: 'SYSTEM'
                })
                .select()
                .single();

        if (invoiceError) throw invoiceError;

        console.log('Created invoice:', invoice);

        /* ===============================
           5️⃣ GENERATE PDF
        =============================== */

        const pdfBuffer = await generatePDF(invoice);

        const filePath = `invoices/${invoice.invoice_id}.pdf`;

        const { data: uploadData, error: uploadError } =
            await supabaseAdmin.storage
                .from('invoices')
                .upload(filePath, pdfBuffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

        console.log("Upload data:", uploadData);
        console.log("Upload error:", uploadError);

        const { data: publicUrlData } =
            supabaseAdmin.storage
                .from('invoices')
                .getPublicUrl(filePath);

        console.log('Generated PDF and uploaded to storage. Public URL:', publicUrlData.publicUrl);

        /* ===============================
           6️⃣ UPDATE INVOICE URL
        =============================== */

        await supabaseAdmin
            .from('invoices')
            .update({ invoice_url: publicUrlData.publicUrl })
            .eq('invoice_id', invoice.invoice_id);

        return res.json({
            success: true,
            user_product_id: result.user_product.user_product_id,
            invoice_id: invoice.invoice_id,
            invoice_number: invoice.invoice_number,
            invoice_url: publicUrlData.publicUrl
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: 'Dealer upload failed'
        });
    }
});


export default router;
