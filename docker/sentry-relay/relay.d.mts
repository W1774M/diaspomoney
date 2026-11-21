/** Types du relais Sentry → CircleCI (implémentation : relay.mjs). */
export declare const SIGNAL_NAME: 'sentry-errors';
export declare const COMPONENT_NAME: 'diaspomoney';
export declare const ENVIRONMENTS: Set<string>;

export interface ValidationEvent {
  signal_name: string;
  status: 'firing' | 'resolved';
  tags: { component_name: string; env: string };
}

export declare function isValidSignature(
  rawBody: Buffer | string,
  signature: unknown,
  clientSecret: string | undefined,
): boolean;

export declare function toValidationEvent(resource: string, payload: unknown): ValidationEvent | null;
