import { useMemo } from 'react';
import type { Discount } from '../db/schema';

interface CalculationProps {
  subtotal: number;
  discount: Discount | null;
  taxRate?: number; // Default 11% (0.11)
}

export function usePosCalculations({
  subtotal,
  discount,
  taxRate = 0.11, // Bisa diambil dari settings nanti
}: CalculationProps) {
  const totals = useMemo(() => {
    let discountAmount = 0;

    // 1. Hitung Diskon
    if (discount) {
      if (discount.type === 'PERCENTAGE') {
        // Rumus: (Value / 100) * Subtotal
        const percentage = Number(discount.value);
        discountAmount = Math.round(subtotal * (percentage / 100));
      } else {
        // Rumus: Fixed Value
        discountAmount = Math.round(Number(discount.value));
      }
    }

    // Pastikan diskon tidak melebihi subtotal (cegah negatif)
    if (discountAmount > subtotal) discountAmount = subtotal;

    // 2. Hitung Pajak
    // Pajak dihitung SETELAH diskon (Taxable Amount)
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * taxRate);

    // 3. Grand Total
    const totalAmount = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    };
  }, [subtotal, discount, taxRate]);

  return totals;
}
