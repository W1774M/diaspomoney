/**
 * API Route - Undo Command
 * Endpoint pour annuler la dernière commande
 */

import { commandHandler } from '@/commands';
import { initializeDI } from '@/lib/di/initialize';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

// Initialiser le système DI au chargement du module
if (typeof window === 'undefined') {
  initializeDI();
}

export async function POST(req: NextRequest) {
  try {
    logger.info('Undo command requested');

    const result = await commandHandler.undo();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Commande annulée avec succès',
      commandName: result.commandName,
    });
  } catch (error: any) {
    logger.error({ error }, 'Error undoing command');
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de l\'annulation de la commande' },
      { status: 500 }
    );
  }
}

/**
 * GET - Obtenir l'historique des commandes
 */
export async function GET(req: NextRequest) {
  try {
    const history = commandHandler.getHistory();
    const historySize = commandHandler.getHistorySize();

    return NextResponse.json({
      success: true,
      historySize,
      commands: history.map(cmd => ({
        name: cmd.getName(),
        data: cmd.getData(),
        canUndo: cmd.canUndo(),
      })),
    });
  } catch (error: any) {
    logger.error({ error }, 'Error getting command history');
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    );
  }
}

