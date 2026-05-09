import { createClient } from "@supabase/supabase-js";
import express from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { createUserProductByDealer } from "../services/user-product.js";
import { calculateGST } from "../utils/calculateGST.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";
import { generatePDF } from "../utils/generatePDF.js";

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

router.post("/dealer", requireAuth, async (req, res) => {
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
      model_number,
    } = req.body;

    /* ===============================
           1. RESOLVE DEALER PROFILE
        =============================== */
    const { data, error } = await supabaseAdmin
      .from("dealer_user")
      .select(`dealer_id`)
      .eq("profile_id", userId)
      .single();

    if (error || !data) {
      return res.status(403).json({ error: "Dealer not found for user" });
    }

    const { data: dealer, error: dealerError } = await supabaseAdmin
      .from("dealer")
      .select(`dealer_name, dealer_address, gst_number`)
      .eq("dealer_id", data.dealer_id)
      .single();

    if (dealerError || !dealer) {
      return res.status(403).json({ error: "Dealer info not found" });
    }

    /* ===============================
           2. CREATE USER PRODUCT
        =============================== */
    const { data: dealerProduct, error: dealerProductError } =
      await supabaseAdmin
        .from("dealer_product")
        .select(`product_id`)
        .eq("dealer_product_id", dealer_product_id)
        .single();

    if (dealerProductError || !dealerProduct) {
      throw new Error("Product not found");
    }

    const { data: globalProduct, error: globalProductError } =
      await supabaseAdmin
        .from("product")
        .select(`product_name`)
        .eq("product_id", dealerProduct.product_id)
        .single();

    const productName = globalProduct.product_name;

    const { data: model, error: modelError } = await supabaseAdmin
      .from("dealer_product_model")
      .select("model_name, model_number")
      .eq("dealer_product_model_id", dealer_product_model_id)
      .single();

    if (modelError || !model) {
      throw new Error("Model not found");
    }

    const result = await createUserProductByDealer(
      supabaseAdmin,
      data.dealer_id,
      req.body,
    );

    /* ===============================
           3. CALCULATE GST
        =============================== */
    const gst = calculateGST(base_price);
    const invoiceNumber = generateInvoiceNumber();

    /* ===============================
           4. CREATE INVOICE
        =============================== */
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
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
        currency: "INR",

        source_type: "DEALER",
        is_verified: true,
        verification_method: "SYSTEM",
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    /* ===============================
           5. GENERATE PDF
        =============================== */
    const pdfBuffer = await generatePDF(invoice);

    const filePath = `invoices/${invoice.invoice_id}.pdf`;

    await supabaseAdmin.storage.from("invoices").upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("invoices")
      .getPublicUrl(filePath);

    /* ===============================
           6. UPDATE INVOICE URL
        =============================== */
    await supabaseAdmin
      .from("invoices")
      .update({ invoice_url: publicUrlData.publicUrl })
      .eq("invoice_id", invoice.invoice_id);

    return res.json({
      success: true,
      user_product_id: result.user_product.user_product_id,
      invoice_id: invoice.invoice_id,
      invoice_number: invoice.invoice_number,
      invoice_url: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Dealer upload failed",
    });
  }
});

export default router;
