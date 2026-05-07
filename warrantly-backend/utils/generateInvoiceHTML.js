export function generateInvoiceHTML(invoice) {
  const formatCurrency = (value) =>
    `₹ ${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
    body {
  font-family: Arial, sans-serif;
  padding: 40px;
  color: #000;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.top-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.box {
  width: 48%;
  border: 1px solid #dcdcdc;
  padding: 15px;
  box-sizing: border-box;
}

.invoice-meta {
  border: 1px solid #dcdcdc;
  padding: 10px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

table, th, td {
  border: 1px solid #dcdcdc;
}

th, td {
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f7f7f7;
}

.totals {
  width: 50%;
  margin-left: auto;
  border: 1px solid #dcdcdc;
  padding: 15px;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.bold {
  font-weight: bold;
}

.footer {
  margin-top: 40px;
  font-size: 12px;
  color: #888;
}

    </style>
  </head>
  <body>

    <h1>INVOICE</h1>

    <div class="top-section">
      <div class="box">
        <strong>Sold By</strong><br/>
        ${invoice.dealer_name || ""}<br/>
        ${invoice.dealer_address || ""}<br/><br/>
        GSTIN: ${invoice.dealer_gstin || ""}
      </div>

      <div class="box">
        <strong>Billed To</strong><br/>
        ${invoice.customer_name}<br/>
        ${invoice.customer_address || ""}<br/><br/>
        Phone: ${invoice.customer_phone}
      </div>
    </div>

    <div class="invoice-meta">
      <div>Invoice No: ${invoice.invoice_number}</div>
      <div>Invoice Date: ${invoice.invoice_date}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Sl No</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            ${invoice.product_name}<br/>
            Model: ${invoice.model_number}<br/>
            Serial: ${invoice.serial_number}
          </td>
          <td>1</td>
          <td>${formatCurrency(invoice.taxable_amount)}</td>
          <td>${formatCurrency(invoice.taxable_amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <div>Sub Total</div>
        <div>${formatCurrency(invoice.taxable_amount)}</div>
      </div>
      <div class="totals-row">
        <div>CGST</div>
        <div>${formatCurrency(invoice.cgst_amount)}</div>
      </div>
      <div class="totals-row">
        <div>SGST</div>
        <div>${formatCurrency(invoice.sgst_amount)}</div>
      </div>
      <div class="totals-row bold">
        <div>Total Amount Paid</div>
        <div>${formatCurrency(invoice.total_amount)}</div>
      </div>
    </div>

    <div class="footer">
      This invoice was generated via Warrantly for warranty and record purposes.
    </div>

  </body>
  </html>
  `;
}
