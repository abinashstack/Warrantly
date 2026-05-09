package pdf_test

import (
	"strings"
	"testing"

	invoicepdf "github.com/abinashstack/warrantly-go/internal/pdf"
)

func TestGenerateInvoicePDF(t *testing.T) {
	t.Run("generates valid PDF bytes", func(t *testing.T) {
		data := invoicepdf.InvoicePDFData{
			InvoiceNumber:   "WAR-INV-2026-1234",
			InvoiceDate:     "2026-05-09",
			DealerName:      "Tech Store",
			DealerAddress:   "MG Road, Bangalore",
			DealerGSTIN:     "29ABCDE1234F1Z5",
			CustomerName:    "Abinash Gogoi",
			CustomerPhone:   "+919876543210",
			CustomerAddress: "Guwahati, Assam",
			ProductName:     "iPhone 15 Pro",
			ModelNumber:     "A3090",
			SerialNumber:    "SN-ABC123",
			TaxableAmount:   49999.00,
			GSTPercentage:   18.0,
			CGSTAmount:      4499.91,
			SGSTAmount:      4499.91,
			TotalAmount:     58998.82,
			WarrantyEndDate: "2027-05-09",
		}

		pdfBytes, err := invoicepdf.GenerateInvoicePDF(data)
		if err != nil {
			t.Fatalf("PDF generation failed: %v", err)
		}

		if len(pdfBytes) == 0 {
			t.Fatal("PDF bytes are empty")
		}

		// Check PDF magic bytes
		if !strings.HasPrefix(string(pdfBytes), "%PDF") {
			t.Error("output does not start with PDF magic bytes")
		}
	})

	t.Run("handles empty fields gracefully", func(t *testing.T) {
		data := invoicepdf.InvoicePDFData{
			InvoiceNumber: "WAR-INV-2026-0001",
			// All other fields empty
		}

		pdfBytes, err := invoicepdf.GenerateInvoicePDF(data)
		if err != nil {
			t.Fatalf("PDF generation failed with empty fields: %v", err)
		}
		if len(pdfBytes) == 0 {
			t.Fatal("PDF bytes are empty")
		}
	})

	t.Run("handles very long product name", func(t *testing.T) {
		data := invoicepdf.InvoicePDFData{
			InvoiceNumber: "WAR-INV-2026-0002",
			ProductName:   strings.Repeat("A Very Long Product Name ", 20),
			ModelNumber:   strings.Repeat("MDL", 50),
			SerialNumber:  strings.Repeat("SN", 100),
		}

		pdfBytes, err := invoicepdf.GenerateInvoicePDF(data)
		if err != nil {
			t.Fatalf("PDF generation failed with long names: %v", err)
		}
		if len(pdfBytes) == 0 {
			t.Fatal("PDF bytes are empty")
		}
	})

	t.Run("handles special characters", func(t *testing.T) {
		data := invoicepdf.InvoicePDFData{
			InvoiceNumber:   "WAR-INV-2026-0003",
			DealerName:      "Store & Sons (Pvt.) Ltd.",
			CustomerName:    "O'Connor & Co.",
			CustomerAddress: "123 Main St., #4B\nNew Delhi",
			ProductName:     "Samsung Galaxy S24 Ultra (256GB)",
			DealerGSTIN:     "29ABCDE1234F1Z5",
			TaxableAmount:   100000,
			GSTPercentage:   18,
			CGSTAmount:      9000,
			SGSTAmount:      9000,
			TotalAmount:     118000,
		}

		pdfBytes, err := invoicepdf.GenerateInvoicePDF(data)
		if err != nil {
			t.Fatalf("PDF generation failed with special chars: %v", err)
		}
		if len(pdfBytes) == 0 {
			t.Fatal("PDF bytes are empty")
		}
	})

	t.Run("handles zero amounts", func(t *testing.T) {
		data := invoicepdf.InvoicePDFData{
			InvoiceNumber: "WAR-INV-2026-0004",
			ProductName:   "Free Sample",
			TaxableAmount: 0,
			GSTPercentage: 18,
			CGSTAmount:    0,
			SGSTAmount:    0,
			TotalAmount:   0,
		}

		pdfBytes, err := invoicepdf.GenerateInvoicePDF(data)
		if err != nil {
			t.Fatalf("PDF generation failed with zero amounts: %v", err)
		}
		if len(pdfBytes) == 0 {
			t.Fatal("PDF bytes are empty")
		}
	})

	t.Run("XSS payload in fields does not crash", func(t *testing.T) {
		data := invoicepdf.InvoicePDFData{
			InvoiceNumber: "WAR-INV-2026-0005",
			DealerName:    "<script>alert('xss')</script>",
			CustomerName:  "<img src=x onerror=alert(1)>",
			ProductName:   "Product\"><script>document.cookie</script>",
		}

		pdfBytes, err := invoicepdf.GenerateInvoicePDF(data)
		if err != nil {
			t.Fatalf("PDF generation crashed on XSS payload: %v", err)
		}
		if len(pdfBytes) == 0 {
			t.Fatal("PDF bytes are empty")
		}
	})
}
