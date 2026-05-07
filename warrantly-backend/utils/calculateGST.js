export function calculateGST(baseAmount, gstPercent = 18) {
    console.log(`Calculating GST Exclusive for base amount: ${baseAmount} with GST percentage: ${gstPercent}%`);
    const gstAmount = baseAmount * (gstPercent / 100);
    const halfGST = gstAmount / 2;

    return {
        taxable_amount: Number(baseAmount.toFixed(2)),
        gst_percentage: gstPercent,
        cgst_amount: Number(halfGST.toFixed(2)),
        sgst_amount: Number(halfGST.toFixed(2)),
        igst_amount: 0,
        total_amount: Number((baseAmount + gstAmount).toFixed(2))
    };
}
