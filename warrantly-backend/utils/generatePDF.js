import puppeteer from "puppeteer";
import { generateInvoiceHTML } from "../utils/generateInvoiceHTML.js";

export async function generatePDF(invoice) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = generateInvoiceHTML(invoice);
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
}
