import { prisma } from '@/lib/prisma';
import { getUserLocale, generateTransactionNotification } from '@/lib/notificationTranslations';

export interface TransactionData {
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency?: string;
  status?: 'completed' | 'pending' | 'failed';
  description: string;
  category: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Get or create wallet for a user
 */
export async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'XOF'
      }
    });
  }

  return wallet;
}

/**
 * Create a transaction and update wallet balance
 */
export async function createTransaction(data: TransactionData) {
  const {
    userId,
    type,
    amount,
    currency = 'XOF',
    status = 'completed',
    description,
    category,
    referenceId,
    metadata
  } = data;

  // Get or create wallet
  const wallet = await getOrCreateWallet(userId);

  // Calculate new balance
  let newBalance = wallet.balance;
  if (status === 'completed') {
    if (type === 'credit') {
      newBalance += amount;
    } else if (type === 'debit') {
      newBalance -= amount;
    }
  }

  // Create transaction and update wallet in a transaction
  const [transaction, updatedWallet] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId,
        type,
        amount,
        currency,
        status,
        description,
        category,
        referenceId,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    }),
    prisma.wallet.update({
      where: { userId },
      data: { balance: newBalance }
    })
  ]);

  // Create notification for the transaction (non-blocking)
  try {
    const locale = await getUserLocale(userId);
    const { title, message } = generateTransactionNotification(
      type,
      category,
      amount,
      currency,
      description,
      locale
    );
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'transaction',
        title,
        message,
        relatedId: transaction.id,
        isRead: false
      }
    });
  } catch (error) {
    // Don't fail the transaction if notification creation fails
    console.error('Failed to create transaction notification:', error);
  }

  return { transaction, wallet: updatedWallet };
}

/**
 * Credit user wallet (add money)
 */
export async function creditWallet(
  userId: string,
  amount: number,
  description: string,
  category: string,
  referenceId?: string,
  metadata?: Record<string, any>
) {
  return createTransaction({
    userId,
    type: 'credit',
    amount,
    description,
    category,
    referenceId,
    metadata
  });
}

/**
 * Debit user wallet (subtract money)
 */
export async function debitWallet(
  userId: string,
  amount: number,
  description: string,
  category: string,
  referenceId?: string,
  metadata?: Record<string, any>
) {
  const wallet = await getOrCreateWallet(userId);
  
  // Check if user has sufficient balance
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  return createTransaction({
    userId,
    type: 'debit',
    amount,
    description,
    category,
    referenceId,
    metadata
  });
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  return wallet.balance;
}

/**
 * Get user transactions
 */
export async function getUserTransactions(
  userId: string,
  options?: {
    type?: 'credit' | 'debit';
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { userId };
  
  if (options?.type) {
    where.type = options.type;
  }
  
  if (options?.status) {
    where.status = options.status;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0
  });

  return transactions;
}

/**
 * Get wallet stats
 */
export async function getWalletStats(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  
  const [creditTransactions, debitTransactions, pendingTransactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'credit', status: 'completed' },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'debit', status: 'completed' },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { userId, status: 'pending' },
      _sum: { amount: true }
    })
  ]);

  return {
    balance: wallet.balance,
    currency: wallet.currency,
    totalCredit: creditTransactions._sum.amount || 0,
    totalDebit: debitTransactions._sum.amount || 0,
    pendingAmount: pendingTransactions._sum.amount || 0
  };
}
