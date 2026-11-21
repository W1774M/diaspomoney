/**
 * Intention de notification — domaine Comms.
 * Les facades métier émettent ceci ; l'infra (Resend/push) reste dans les adapters.
 */

export type NotificationChannel = 'EMAIL' | 'PUSH' | 'SMS';

export interface NotificationIntentProps {
  recipient: string;
  template: string;
  channels: NotificationChannel[];
  payload: Record<string, unknown>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export class NotificationIntent {
  readonly recipient: string;
  readonly template: string;
  readonly channels: NotificationChannel[];
  readonly payload: Record<string, unknown>;
  readonly priority: 'LOW' | 'NORMAL' | 'HIGH';

  private constructor(props: NotificationIntentProps) {
    this.recipient = props.recipient;
    this.template = props.template;
    this.channels = props.channels;
    this.payload = props.payload;
    this.priority = props.priority || 'NORMAL';
  }

  static of(props: NotificationIntentProps): NotificationIntent {
    if (!props.recipient?.trim()) {
      throw new Error('NotificationIntent requires recipient');
    }
    if (!props.template?.trim()) {
      throw new Error('NotificationIntent requires template');
    }
    if (!props.channels?.length) {
      throw new Error('NotificationIntent requires at least one channel');
    }
    return new NotificationIntent({
      ...props,
      recipient: props.recipient.trim(),
      template: props.template.trim(),
    });
  }
}
