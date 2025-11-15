import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { creditWallet } from '@/services/walletService';
import { checkBackofficeAuth, hasPermission } from '@/lib/backofficeAuth';

export async function POST(request: NextRequest) {
  try {
    const auth = await checkBackofficeAuth();
    
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to top up wallets
    if (!hasPermission(auth, 'topup')) {
      return NextResponse.json({ error: 'Forbidden - No topup permission' }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, amount, reason, adminId } = body;

    // Validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'No users selected' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0 || amount > 10000000) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Process top-up for each user
    const results = [];
    const referenceId = `TOPUP-${Date.now()}`;

    for (const userId of userIds) {
      try {
        // Use wallet service to credit wallet (this will also create the notification)
        const result = await creditWallet(
          userId,
          amount,
          `Wallet top-up from Bagami: ${reason}`,
          'Bonus',
          referenceId,
          {
            topupType: 'admin',
            adminId: adminId || auth.userId!,
            adminEmail: auth.email!,
            reason: reason.trim(),
            timestamp: new Date().toISOString()
          }
        );

        results.push({
          userId,
          success: true,
          transactionId: result.transaction.id,
          newBalance: result.wallet.balance
        });

        // Log admin action
        await prisma.adminAction.create({
          data: {
            adminId: adminId || auth.userId!,
            action: 'wallet_topup',
            targetType: 'User',
            targetId: userId,
            details: JSON.stringify({
              amount,
              reason: reason.trim(),
              referenceId,
              transactionId: result.transaction.id,
              newBalance: result.wallet.balance
            }),
            ipAddress: request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          }
        });

      } catch (error) {
        console.error(`Error processing top-up for user ${userId}:`, error);
        results.push({
          userId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Top-up completed: ${successCount} successful, ${failureCount} failed`,
      results,
      referenceId,
      totalAmount: amount * successCount
    });

  } catch (error) {
    console.error('Error processing top-up:', error);
    return NextResponse.json(
      { error: 'Failed to process top-up' },
      { status: 500 }
    );
  }
}
