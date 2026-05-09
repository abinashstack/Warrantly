import { createClient } from "@supabase/supabase-js";
import express from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { getDealerByProfileId } from "../services/dealer.js";
import { calculateGST } from "../utils/calculateGST.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";
import { generatePDF } from "../utils/generatePDF.js";

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

router.post("/", requireAuth, async (req, res) => {
  console.log("Invoice creation endpoint hit with body: ", req.body);
  try {
    const {
      user_product_id,
      sale_price,
      customer_name,
      customer_phone,
      customer_address,
      dealer_name,
      dealer_address,
      dealer_gstin,
      product_name,
      model_number,
      serial_number,
    } = req.body;

    //Calculate GST
    const gst = calculateGST(sale_price);

    //Generate Invoice Number
    const invoiceNumber = generateInvoiceNumber();

    // 3️⃣ Insert Invoice Row
    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .insert({
        user_product_id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split("T")[0],

        dealer_name,
        dealer_address,
        dealer_gstin,

        customer_name,
        customer_phone,
        customer_address,

        product_name,
        model_number,
        serial_number,

        taxable_amount: gst.taxable_amount,
        gst_percentage: gst.gst_percentage,
        cgst_amount: gst.cgst_amount,
        sgst_amount: gst.sgst_amount,
        igst_amount: 0,

        total_amount: sale_price,
        currency: "INR",

        source_type: "DEALER",
        is_verified: true,
        verification_method: "SYSTEM",
      })
      .select()
      .single();

    if (error) throw error;

    // 4️⃣ Generate PDF
    const pdfBuffer = await generatePDF(invoice);

    // 5️⃣ Upload to Supabase Storage
    const filePath = `invoices/${invoice.invoice_id}.pdf`;

    await supabaseAdmin.storage.from("invoices").upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
    });

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("invoices")
      .getPublicUrl(filePath);

    //Update Invoice URL
    await supabaseAdmin
      .from("invoices")
      .update({ invoice_url: publicUrlData.publicUrl })
      .eq("invoice_id", invoice.invoice_id);

    return res.json({
      success: true,
      invoice_id: invoice.invoice_id,
      invoice_number: invoice.invoice_number,
      invoice_url: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Sale + invoice creation failed" });
  }
});

router.get("/:invoiceId", requireAuth, async (req, res) => {
  console.log(
    "Fetch invoice endpoint hit for invoice ID: ",
    req.params.invoiceId,
  );
  try {
    const { invoiceId } = req.params;
    const userId = req.user.sub;

    /* --------------------------------
           1️⃣ Resolve dealer from user
        --------------------------------- */
    const dealerUser = await getDealerByProfileId(supabaseAdmin, userId);

    if (!dealerUser) {
      return res.status(403).json({
        error: "Unauthorized",
      });
    }

    /* --------------------------------
           2️⃣ Fetch invoice
        --------------------------------- */
    const { data: invoice, error } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("invoice_id", invoiceId)
      .single();

    if (error || !invoice) {
      return res.status(404).json({
        error: "Invoice not found",
      });
    }

    /* --------------------------------
           3️⃣ Optional: Ensure dealer owns invoice
           (Highly Recommended)
        --------------------------------- */
    return res.json({
      success: true,
      invoice,
    });
  } catch (err) {
    console.error("Fetch invoice failed:", err);
    return res.status(500).json({
      error: "Failed to fetch invoice",
    });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;

    /* --------------------------------
           1️⃣ Resolve dealer from profile
        --------------------------------- */
    const dealerUser = await getDealerByProfileId(supabaseAdmin, userId);

    if (!dealerUser) {
      return res.status(403).json({
        error: "Unauthorized",
      });
    }

    /* --------------------------------
           2️⃣ Fetch invoices for dealer
        --------------------------------- */
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select(
        `
        invoice_id,
        invoice_number,
        invoice_date,
        customer_name,
        product_name,
        total_amount,
        invoice_url,
        created_at
      `,
      )
      .eq("dealer_id", dealerUser.dealer_id) // IMPORTANT
      .order("invoice_date", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      invoices: data,
    });
  } catch (err) {
    console.error("Fetch invoices failed:", err);
    return res.status(500).json({
      error: "Failed to fetch invoices",
    });
  }
});

export default router;
