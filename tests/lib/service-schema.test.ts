import { describe, expect, it } from 'vitest';

import { CreateServiceSchema, UpdateServiceSchema } from '../../lib/validations/service.schema';

describe('service schema', () => {
  it('accepte et normalise le flag service important', () => {
    const created = CreateServiceSchema.parse({
      id: 'consultation-prioritaire',
      category: 'HEALTH',
      label: 'Consultation prioritaire',
      description: 'Service à mettre en avant.',
      price: 29,
      isActive: true,
      important: true,
    });

    expect(created.important).toBe(true);
    expect(UpdateServiceSchema.parse({ important: false })).toEqual({ important: false });
  });
});
