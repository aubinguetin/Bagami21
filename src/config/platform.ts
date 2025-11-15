/**
 * Platform Configuration
 * 
 * This file contains configurable platform settings that may change over time.
 * Update these values to adjust platform behavior without modifying core logic.
 * 
 * Note: The commission rate can be dynamically fetched from the database.
 * Use getPlatformConfig() or calculatePlatformFee() for the most up-to-date rate.
 */

import { prisma } from '@/lib/prisma';

// Default configuration (used as fallback if database is not available)
export const PLATFORM_CONFIG = {
  /**
   * Default platform fee rate (as a decimal)
   * 
   * This is the percentage of each transaction that the platform takes as a fee.
   * The fee is deducted from the amount the traveler/service provider receives.
   * 
   * Example: 0.175 = 17.5%
   * - If sender pays 100,000 XAF
   * - Platform fee: 100,000 × 0.175 = 17,500 XAF
   * - Traveler receives: 100,000 - 17,500 = 82,500 XAF
   * 
   * This is a fallback value. The actual rate is stored in the database.
   */
  FEE_RATE: 0.175, // 17.5% (default)

  /**
   * Minimum fee amount (in base currency units)
   * Set to 0 for no minimum
   */
  MIN_FEE: 0,

  /**
   * Maximum fee amount (in base currency units)
   * Set to Infinity for no maximum
   */
  MAX_FEE: Infinity,
} as const;

/**
 * Get the current platform configuration from the database
 * Falls back to default config if database is unavailable
 */
export async function getPlatformConfig() {
  try {
    const commissionSetting = await prisma.platformSettings.findUnique({
      where: { key: 'commission_rate' },
    });

    console.log('📊 Fetched commission setting from DB:', commissionSetting);

    const feeRate = commissionSetting 
      ? parseFloat(commissionSetting.value) 
      : PLATFORM_CONFIG.FEE_RATE;

    console.log('💰 Using fee rate:', feeRate, `(${(feeRate * 100).toFixed(1)}%)`);

    return {
      FEE_RATE: feeRate,
      MIN_FEE: PLATFORM_CONFIG.MIN_FEE,
      MAX_FEE: PLATFORM_CONFIG.MAX_FEE,
    };
  } catch (error) {
    console.error('Error fetching platform config from database:', error);
    console.log('⚠️ Falling back to default rate:', PLATFORM_CONFIG.FEE_RATE);
    return PLATFORM_CONFIG;
  }
}

/**
 * Calculate the platform fee for a given amount
 * This function fetches the current rate from the database
 * 
 * @param amount - The total payment amount
 * @returns Object containing fee and net amount (amount after fee)
 */
export async function calculatePlatformFee(amount: number) {
  const config = await getPlatformConfig();
  const feeAmount = Math.floor(amount * config.FEE_RATE);
  
  // Apply min/max constraints
  const constrainedFee = Math.max(
    config.MIN_FEE,
    Math.min(feeAmount, config.MAX_FEE)
  );
  
  const netAmount = amount - constrainedFee;
  
  return {
    grossAmount: amount,        // Original amount (what payer pays)
    feeAmount: constrainedFee,  // Platform fee
    netAmount: netAmount,       // Amount recipient receives
    feeRate: config.FEE_RATE,
    feePercentage: (config.FEE_RATE * 100).toFixed(1) + '%'
  };
}

/**
 * Synchronous version of calculatePlatformFee using default rate
 * Use this only when you cannot use async/await
 * For most accurate results, use the async version above
 * 
 * @param amount - The total payment amount
 * @param customRate - Optional custom rate to use instead of default
 * @returns Object containing fee and net amount
 */
export function calculatePlatformFeeSync(amount: number, customRate?: number) {
  const feeRate = customRate !== undefined ? customRate : PLATFORM_CONFIG.FEE_RATE;
  const feeAmount = Math.floor(amount * feeRate);
  
  // Apply min/max constraints
  const constrainedFee = Math.max(
    PLATFORM_CONFIG.MIN_FEE,
    Math.min(feeAmount, PLATFORM_CONFIG.MAX_FEE)
  );
  
  const netAmount = amount - constrainedFee;
  
  return {
    grossAmount: amount,        // Original amount (what payer pays)
    feeAmount: constrainedFee,  // Platform fee
    netAmount: netAmount,       // Amount recipient receives
    feeRate: feeRate,
    feePercentage: (feeRate * 100).toFixed(1) + '%'
  };
}

/**
 * Format platform fee for display
 * This function fetches the current rate from the database
 * 
 * @param amount - The total payment amount
 * @param currency - The currency code (e.g., 'XAF')
 * @returns Formatted string for display
 */
export async function formatPlatformFee(amount: number, currency: string = 'XAF') {
  const { feeAmount, netAmount, feePercentage } = await calculatePlatformFee(amount);
  
  return {
    feeText: `${feeAmount.toLocaleString()} ${currency} (${feePercentage} platform fee)`,
    netText: `${netAmount.toLocaleString()} ${currency}`,
    feeAmount,
    netAmount
  };
}

