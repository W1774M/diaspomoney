// @vitest-environment node
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  COMPONENT_NAME,
  isValidSignature,
  SIGNAL_NAME,
  toValidationEvent,
} from '../../docker/sentry-relay/relay.mjs';

const SECRET = 'client-secret-de-test';
const sign = (body: string) => createHmac('sha256', SECRET).update(body).digest('hex');

describe('relais Sentry → CircleCI', () => {
  it('accepte une signature valide et refuse le reste', () => {
    const body = Buffer.from('{"action":"critical"}');
    expect(isValidSignature(body, sign(body.toString()), SECRET)).toBe(true);
    expect(isValidSignature(body, sign('autre corps'), SECRET)).toBe(false);
    expect(isValidSignature(body, 'pas-hexa', SECRET)).toBe(false);
    expect(isValidSignature(body, undefined, SECRET)).toBe(false);
    expect(isValidSignature(body, sign(body.toString()), '')).toBe(false);
  });

  it('traduit une alerte métrique critique de production en signal « firing »', () => {
    const event = toValidationEvent('metric_alert', {
      action: 'critical',
      data: { metric_alert: { alert_rule: { environment: 'production' } } },
    });
    expect(event).toEqual({
      signal_name: SIGNAL_NAME,
      status: 'firing',
      tags: { component_name: COMPONENT_NAME, env: 'production' },
    });
  });

  it('traduit la résolution d’une alerte métrique en « resolved »', () => {
    const event = toValidationEvent('metric_alert', {
      action: 'resolved',
      data: { metric_alert: { alert_rule: { environment: 'staging' } } },
    });
    expect(event?.status).toBe('resolved');
    expect(event?.tags.env).toBe('staging');
  });

  it('lit l’environnement d’une alerte d’issue dans l’événement ou ses tags', () => {
    expect(
      toValidationEvent('event_alert', { action: 'triggered', data: { event: { environment: 'production' } } })?.tags.env,
    ).toBe('production');
    expect(
      toValidationEvent('event_alert', {
        action: 'triggered',
        data: { event: { tags: [['level', 'error'], ['environment', 'development']] } },
      })?.tags.env,
    ).toBe('development');
  });

  it('ignore les ressources, actions et environnements non pris en charge', () => {
    expect(toValidationEvent('installation', { action: 'created' })).toBeNull();
    expect(toValidationEvent('metric_alert', { action: 'critical', data: {} })).toBeNull();
    expect(
      toValidationEvent('metric_alert', {
        action: 'critical',
        data: { metric_alert: { alert_rule: { environment: 'prod' } } },
      }),
    ).toBeNull();
  });
});
