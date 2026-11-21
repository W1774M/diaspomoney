'use client';

import { TransactionsPage } from '@/components/transactions';
import { AuthorizedRoute } from '@/components/auth';

/**
 * Page Transactions
 * Implémente les design patterns :
 * - Authorization Pattern (via AuthorizedRoute aligné avec @Authorize decorator backend)
 */
export default function Transactions() {
  return (
    <AuthorizedRoute redirectTo="/login">
      <TransactionsPage />
    </AuthorizedRoute>
  );
}
