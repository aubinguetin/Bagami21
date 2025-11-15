/**
 * Format a number with spaces between thousands
 * Example: 560000000 -> "560 000 000"
 */
export function formatAmount(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }
  
  // Convert to string and split by decimal point
  const parts = numAmount.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add spaces every 3 digits from the right
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Return with decimal part if it exists
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

/**
 * Format currency with amount and currency code
 * Example: formatCurrency(560000000, 'XOF') -> "560 000 000 FCFA"
 */
export function formatCurrency(amount: number | string | null | undefined, currency: string = 'XOF'): string {
  // Display FCFA instead of XOF for user-facing text
  const displayCurrency = currency === 'XOF' ? 'FCFA' : currency;
  return `${formatAmount(amount)} ${displayCurrency}`;
}
