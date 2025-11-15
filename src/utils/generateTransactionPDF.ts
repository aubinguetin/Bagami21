import jsPDF from 'jspdf';
import { formatAmount } from '@/utils/currencyFormatter';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  category: string;
  date: string;
  referenceId?: string;
  metadata?: any;
}

interface TranslationLabels {
  title: string;
  type: string;
  amount: string;
  status: string;
  description: string;
  category: string;
  dateTime: string;
  transactionId: string;
  referenceId: string;
  paymentBreakdown: string;
  walletPayment: string;
  directPayment: string;
  paymentMethod: string;
  additionalInfo: string;
  reason: string;
  received: string;
  sent: string;
  completed: string;
  pending: string;
  failed: string;
}

// Function to convert image to base64
const getImageBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return '';
  }
};

export const generateTransactionPDF = async (
  transaction: Transaction,
  labels: TranslationLabels,
  locale: string = 'en'
) => {
  const doc = new jsPDF();
  
  // Simple, Professional Color Palette - Only 2 colors
  const primaryColor: [number, number, number] = [255, 87, 34]; // Bagami Orange
  const textColor: [number, number, number] = [51, 51, 51]; // Dark Gray
  const lightGray: [number, number, number] = [245, 245, 245]; // Very light gray for backgrounds
  const creditGreen: [number, number, number] = [76, 175, 80]; // Green for credits
  const debitRed: [number, number, number] = [244, 67, 54]; // Red for debits
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  let yPos = 25;
  
  // ============================================
  // HEADER - Simple and Clean
  // ============================================
  
  // Load and add Bagami logo
  try {
    const logoData = await getImageBase64('/bagamilogo_transparent2.png');
    if (logoData) {
      doc.addImage(logoData, 'PNG', margin, yPos, 30, 30);
    }
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Company name
  doc.setTextColor(...textColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Bagami', margin + 35, yPos + 12);
  
  // Document title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(labels.title, margin + 35, yPos + 20);
  
  // Transaction ID on right
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${labels.transactionId}:`, pageWidth - margin - 60, yPos + 10, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(transaction.id.slice(0, 12), pageWidth - margin, yPos + 10, { align: 'right' });
  
  // Date on right
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  const headerDate = new Date(transaction.date).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );
  doc.text(headerDate, pageWidth - margin, yPos + 18, { align: 'right' });
  
  yPos += 45;
  
  // Horizontal line separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 20;
  
  // ============================================
  // TRANSACTION SUMMARY
  // ============================================
  
  // Type label
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(transaction.type === 'credit' ? labels.received.toUpperCase() : labels.sent.toUpperCase(), margin, yPos);
  
  yPos += 10;
  
  // Amount - Large and clear (Green for credit, Red for debit)
  const amountColor = transaction.type === 'credit' ? creditGreen : debitRed;
  doc.setTextColor(...amountColor);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  const amountText = `${transaction.type === 'credit' ? '+' : '-'}${formatAmount(transaction.amount)} ${transaction.currency === 'XOF' ? 'FCFA' : transaction.currency}`;
  doc.text(amountText, margin, yPos);
  
  yPos += 15;
  
  // Status
  const statusText = transaction.status === 'completed' 
    ? labels.completed 
    : transaction.status === 'pending' 
    ? labels.pending 
    : labels.failed;
  
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${labels.status}: `, margin, yPos);
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, margin + 20, yPos);
  
  yPos += 25;
  
  // ============================================
  // TRANSACTION DETAILS
  // ============================================
  
  // Section title
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.line(margin, yPos, margin + 30, yPos);
  
  yPos += 8;
  
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILS', margin, yPos);
  
  yPos += 12;
  
  // Helper function for detail rows
  const addDetailRow = (label: string, value: string, indent: number = 0) => {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin + indent, yPos);
    
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const maxWidth = pageWidth - margin - (margin + indent) - 5;
    const lines = doc.splitTextToSize(value, maxWidth);
    doc.text(lines, margin + indent, yPos + 5);
    
    yPos += 5 + (lines.length * 5) + 8;
  };
  
  // Description
  addDetailRow(labels.description, transaction.description);
  
  // Category
  addDetailRow(labels.category, transaction.category);
  
  // Date & Time
  const fullDate = new Date(transaction.date).toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  );
  addDetailRow(labels.dateTime, fullDate);
  
  // Transaction ID (full)
  addDetailRow(labels.transactionId, transaction.id);
  
  // Reference ID
  if (transaction.referenceId) {
    addDetailRow(labels.referenceId, transaction.referenceId);
  }
  
  // ============================================
  // PAYMENT BREAKDOWN (if applicable)
  // ============================================
  
  if (transaction.metadata?.paymentBreakdown) {
    yPos += 5;
    
    // Section title
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(margin, yPos, margin + 45, yPos);
    
    yPos += 8;
    
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(labels.paymentBreakdown.toUpperCase(), margin, yPos);
    
    yPos += 12;
    
    // Light background box
    const breakdownStartY = yPos - 5;
    const breakdownHeight = 
      (transaction.metadata.paymentBreakdown.walletAmount > 0 ? 15 : 0) +
      (transaction.metadata.paymentBreakdown.directPaymentAmount > 0 ? 15 : 0) + 10;
    
    doc.setFillColor(...lightGray);
    doc.rect(margin, breakdownStartY, pageWidth - 2 * margin, breakdownHeight, 'F');
    
    yPos += 5;
    
    if (transaction.metadata.paymentBreakdown.walletAmount > 0) {
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(labels.walletPayment, margin + 5, yPos);
      
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${formatAmount(transaction.metadata.paymentBreakdown.walletAmount)} FCFA`,
        pageWidth - margin - 5,
        yPos,
        { align: 'right' }
      );
      yPos += 15;
    }
    
    if (transaction.metadata.paymentBreakdown.directPaymentAmount > 0) {
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(labels.directPayment, margin + 5, yPos);
      
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${formatAmount(transaction.metadata.paymentBreakdown.directPaymentAmount)} FCFA`,
        pageWidth - margin - 5,
        yPos,
        { align: 'right' }
      );
      yPos += 15;
    }
    
    yPos += 10;
  }
  
  // Payment Method
  if (transaction.metadata?.paymentMethod) {
    addDetailRow(
      labels.paymentMethod,
      transaction.metadata.paymentMethod.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    );
  }
  
  // Additional Information
  if (transaction.metadata?.reason) {
    // Check if we have enough space for the reason section (need at least 50px before footer)
    const minFooterSpace = 50;
    const footerStartY = pageHeight - 20;
    const availableSpace = footerStartY - yPos - minFooterSpace;
    
    // Only add reason if there's enough space
    if (availableSpace > 30) {
      yPos += 5;
      
      // Section title
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(2);
      doc.line(margin, yPos, margin + 60, yPos);
      
      yPos += 8;
      
      doc.setTextColor(...textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(labels.additionalInfo.toUpperCase(), margin, yPos);
      
      yPos += 12;
      
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(labels.reason, margin, yPos);
      
      yPos += 5;
      
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Calculate how many lines we can fit
      const reasonLines = doc.splitTextToSize(transaction.metadata.reason, pageWidth - 2 * margin);
      const maxLinesAllowed = Math.floor((footerStartY - yPos - 30) / 5);
      const linesToShow = reasonLines.slice(0, maxLinesAllowed);
      
      doc.text(linesToShow, margin, yPos);
      
      // Add ellipsis if text was truncated
      if (reasonLines.length > maxLinesAllowed) {
        doc.text('...', margin, yPos + (linesToShow.length * 5));
      }
      
      yPos += linesToShow.length * 5 + 10;
    }
  }
  
  // ============================================
  // FOOTER
  // ============================================
  
  const footerY = pageHeight - 20;
  
  // Top line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  // Footer text
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const generatedText = locale === 'fr' 
    ? `Généré le ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}`
    : `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}`;
  
  doc.text(generatedText, margin, footerY);
  
  doc.text('Bagami - Your Trusted Delivery Partner', pageWidth - margin, footerY, { align: 'right' });
  
  // Security note
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(7);
  doc.text('This is an official transaction receipt', pageWidth / 2, footerY + 7, { align: 'center' });
  
  return doc;
};

export const shareTransactionPDF = async (
  transaction: Transaction,
  labels: TranslationLabels,
  locale: string = 'en'
) => {
  const doc = await generateTransactionPDF(transaction, labels, locale);
  const pdfBlob = doc.output('blob');
  const fileName = `Bagami_Transaction_${transaction.id.slice(0, 8)}.pdf`;
  
  // Check if Web Share API is available and supports files
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: labels.title,
          text: `${labels.title} - ${transaction.id}`,
          files: [file],
        });
        return true;
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
    }
  }
  
  // Fallback: Download the PDF
  doc.save(fileName);
  return false;
};
