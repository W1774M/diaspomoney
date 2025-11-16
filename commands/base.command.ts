/**
 * Command Pattern - Base Implementation
 * 
 * Encapsule les requêtes comme objets pour permettre :
 * - Historique d'actions
 * - Undo/Redo
 * - Transactions
 * - Queue de commandes
 */

import { logger } from '@/lib/logger';

/**
 * Interface de base pour toutes les commandes
 */
export interface Command<T = any> {
  /**
   * Exécuter la commande
   */
  execute(): Promise<T>;
  
  /**
   * Annuler la commande (optionnel)
   */
  undo?(): Promise<void>;
  
  /**
   * Nom de la commande pour le logging
   */
  getName(): string;
  
  /**
   * Données de la commande pour le logging
   */
  getData(): Record<string, any>;
  
  /**
   * Vérifier si la commande peut être annulée
   */
  canUndo(): boolean;
}

/**
 * Résultat d'exécution d'une commande
 */
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  commandName: string;
  timestamp: Date;
}

/**
 * Handler pour exécuter et gérer les commandes
 */
export class CommandHandler {
  private history: Command[] = [];
  private maxHistorySize: number = 100;
  private isExecuting: boolean = false;

  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Exécuter une commande
   */
  async execute<T>(command: Command<T>): Promise<CommandResult<T>> {
    if (this.isExecuting) {
      throw new Error('Une commande est déjà en cours d\'exécution');
    }

    this.isExecuting = true;
    const startTime = Date.now();

    try {
      logger.debug({
        command: command.getName(),
        data: command.getData(),
      }, `Executing command: ${command.getName()}`);

      const result = await command.execute();
      const executionTime = Date.now() - startTime;

      // Ajouter à l'historique si la commande peut être annulée
      if (command.canUndo()) {
        this.addToHistory(command);
      }

      logger.info({
        command: command.getName(),
        executionTime,
      }, `Command executed successfully: ${command.getName()}`);

      return {
        success: true,
        data: result,
        commandName: command.getName(),
        timestamp: new Date(),
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      logger.error({
        command: command.getName(),
        error: error.message,
        executionTime,
      }, `Command execution failed: ${command.getName()}`);

      return {
        success: false,
        error: error.message || 'Unknown error',
        commandName: command.getName(),
        timestamp: new Date(),
      };
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Annuler la dernière commande
   */
  async undo(): Promise<CommandResult<void>> {
    const command = this.history.pop();
    
    if (!command) {
      return {
        success: false,
        error: 'Aucune commande à annuler',
        commandName: 'undo',
        timestamp: new Date(),
      };
    }

    if (!command.canUndo() || !command.undo) {
      return {
        success: false,
        error: 'Cette commande ne peut pas être annulée',
        commandName: command.getName(),
        timestamp: new Date(),
      };
    }

    try {
      logger.debug({
        command: command.getName(),
      }, `Undoing command: ${command.getName()}`);

      await command.undo();

      logger.info({
        command: command.getName(),
      }, `Command undone successfully: ${command.getName()}`);

      return {
        success: true,
        commandName: command.getName(),
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error({
        command: command.getName(),
        error: error.message,
      }, `Failed to undo command: ${command.getName()}`);

      // Remettre la commande dans l'historique en cas d'échec
      this.history.push(command);

      return {
        success: false,
        error: error.message || 'Failed to undo command',
        commandName: command.getName(),
        timestamp: new Date(),
      };
    }
  }

  /**
   * Obtenir l'historique des commandes
   */
  getHistory(): Command[] {
    return [...this.history];
  }

  /**
   * Vider l'historique
   */
  clearHistory(): void {
    this.history = [];
    logger.info('Command history cleared');
  }

  /**
   * Obtenir le nombre de commandes dans l'historique
   */
  getHistorySize(): number {
    return this.history.length;
  }

  /**
   * Ajouter une commande à l'historique
   */
  private addToHistory(command: Command): void {
    this.history.push(command);

    // Limiter la taille de l'historique
    if (this.history.length > this.maxHistorySize) {
      this.history.shift(); // Retirer la plus ancienne commande
    }
  }
}

/**
 * Command abstraite de base avec implémentation par défaut
 */
export abstract class BaseCommand<T = any> implements Command<T> {
  protected abstract commandName: string;
  protected abstract commandData: Record<string, any>;

  abstract execute(): Promise<T>;
  
  getName(): string {
    return this.commandName;
  }

  getData(): Record<string, any> {
    return this.commandData;
  }

  canUndo(): boolean {
    return 'undo' in this && typeof (this as any).undo === 'function';
  }
}

