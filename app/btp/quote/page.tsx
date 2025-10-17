/**
 * BTP Quote Page - DiaspoMoney
 * Page de demande de devis BTP
 */

import React from 'react';
import BTPQuoteForm from '@/components/btp/BTPQuoteForm';

export default function BTPQuotePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BTPQuoteForm />
    </div>
  );
}
