/**
 * Factures : « Modifier » et « Supprimer » n'apparaissent que si l'action est permise.
 * - non-admin : ni l'un ni l'autre (l'API répond 403) ;
 * - admin : « Modifier » partout, « Supprimer » sur les brouillons seulement (une facture
 *   émise garde son numéro et s'annule).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InvoicesTable from '@/components/invoices/InvoicesTable';

const invoice = (status: string, id = `inv-${status}`) => ({
  _id: id,
  invoiceNumber: `FAC-${status}`,
  customerId: 'c1',
  providerId: 'p1',
  amount: 50,
  currency: 'EUR',
  status,
  issueDate: new Date('2026-11-01'),
  dueDate: new Date('2026-12-01'),
  items: [],
});

const handlers = () => ({ onView: vi.fn(), onDownload: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() });

describe('Actions des factures', () => {
  it('non-admin : ni Modifier ni Supprimer', () => {
    const { onView, onDownload } = handlers();
    render(<InvoicesTable invoices={[invoice('DRAFT'), invoice('PAID')]} loading={false} onView={onView} onDownload={onDownload} />);
    expect(screen.queryByTitle('Modifier')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Supprimer')).not.toBeInTheDocument();
    expect(screen.getAllByTitle('Télécharger')).toHaveLength(2);
  });

  it('admin : Modifier partout, Supprimer sur le brouillon seulement', () => {
    const h = handlers();
    render(<InvoicesTable invoices={[invoice('DRAFT'), invoice('PAID'), invoice('PENDING')]} loading={false} {...h} />);
    expect(screen.getAllByTitle('Modifier')).toHaveLength(3);
    const deletes = screen.getAllByTitle('Supprimer');
    expect(deletes).toHaveLength(1);
    fireEvent.click(deletes[0]!);
    expect(h.onDelete).toHaveBeenCalledWith('inv-DRAFT');
  });
});
