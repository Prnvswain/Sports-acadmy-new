import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma';
import { assertTenantMatch } from '../utils/tenantQuery';
import { NotFoundError } from '../utils/errors';

export async function generateReceiptPDF(paymentId: string, academyId: string): Promise<Buffer> {
  const payment = await prisma.feePayment.findUnique({
    where: { id: paymentId },
    include: {
      student: true,
      academy: { select: { name: true, email: true, phone: true, address: true, receiptTemplate: true } },
    },
  });

  if (!payment) throw new NotFoundError('Payment not found');
  assertTenantMatch(payment.academyId, academyId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const academy = payment.academy;
    const student = payment.student;

    doc.fontSize(20).text(academy.name, { align: 'center' });
    doc.fontSize(10).text(academy.address || '', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('FEE RECEIPT', { align: 'center', underline: true });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Receipt No: ${payment.receiptNumber}`);
    doc.text(`Date: ${payment.paidDate?.toLocaleDateString() || new Date().toLocaleDateString()}`);
    doc.text(`Status: ${payment.status}`);
    doc.moveDown();

    doc.text(`Student: ${student.firstName} ${student.lastName}`);
    if (student.guardianName) doc.text(`Guardian: ${student.guardianName}`);
    doc.moveDown();

    doc.text('Fee Breakdown:');
    doc.text(`  Sport Fee (×${payment.planMultiplier}): ₹${Number(payment.sportFee).toFixed(2)}`);
    doc.text(`  Registration Fee: ₹${Number(payment.registrationFee).toFixed(2)}`);
    doc.text(`  Additional Charges: ₹${Number(payment.additionalCharges).toFixed(2)}`);
    doc.text(`  Discount: -₹${Number(payment.discount).toFixed(2)}`);
    doc.moveDown();
    doc.fontSize(14).text(`Total Paid: ₹${Number(payment.amount).toFixed(2)}`, { underline: true });
    doc.moveDown();

    if (payment.paymentMethod) doc.text(`Payment Method: ${payment.paymentMethod}`);
    doc.text(`Period: ${payment.periodStart.toLocaleDateString()} — ${payment.periodEnd.toLocaleDateString()}`);

    if (academy.receiptTemplate) {
      doc.moveDown();
      doc.fontSize(9).text(academy.receiptTemplate, { align: 'center' });
    }

    doc.moveDown(2);
    doc.fontSize(9).text('This is a computer-generated receipt.', { align: 'center' });
    doc.end();
  });
}
