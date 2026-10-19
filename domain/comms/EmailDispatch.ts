/**
 * Port / intention d'envoi email (pas Resend).
 */

export interface EmailDispatchProps {
  to: string;
  subject: string;
  templateId?: string;
  html?: string;
  text?: string;
  idempotencyKey?: string;
}

export class EmailDispatch {
  readonly to: string;
  readonly subject: string;
  readonly templateId?: string;
  readonly html?: string;
  readonly text?: string;
  readonly idempotencyKey?: string;

  private constructor(props: EmailDispatchProps) {
    this.to = props.to;
    this.subject = props.subject;
    if (props.templateId !== undefined) this.templateId = props.templateId;
    if (props.html !== undefined) this.html = props.html;
    if (props.text !== undefined) this.text = props.text;
    if (props.idempotencyKey !== undefined) {
      this.idempotencyKey = props.idempotencyKey;
    }
  }

  static of(props: EmailDispatchProps): EmailDispatch {
    if (!props.to?.trim()) {
      throw new Error('EmailDispatch requires to');
    }
    if (!props.subject?.trim()) {
      throw new Error('EmailDispatch requires subject');
    }
    if (!props.html && !props.text && !props.templateId) {
      throw new Error('EmailDispatch requires html, text, or templateId');
    }
    return new EmailDispatch({
      ...props,
      to: props.to.trim(),
      subject: props.subject.trim(),
    });
  }
}
