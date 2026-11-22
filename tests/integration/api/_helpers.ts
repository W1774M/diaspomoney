/**
 * Aides partagées des tests d'intégration des routes API.
 */
import { MongoClient, ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';
import { vi } from 'vitest';

import { auth } from '@/auth';

export const db = () =>
  ((globalThis as any).__DIASPOMONEY_TEST_MONGO__ as MongoClient).db(process.env['MONGODB_DB']);

export interface TestUser {
  id: string;
  email: string;
  roles: string[];
}

/** Crée un utilisateur actif en base. */
export async function seedUser(roles: string[] = ['CUSTOMER'], extra: Record<string, unknown> = {}): Promise<TestUser> {
  const _id = new ObjectId();
  const email = `user-${_id.toString()}@test.fr`;
  await db().collection('users').insertOne({
    _id,
    email,
    firstName: 'Awa',
    lastName: 'Diallo',
    name: 'Awa Diallo',
    roles,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  });
  return { id: _id.toString(), email, roles };
}

/** Simule la session NextAuth de cet utilisateur (null : visiteur non connecté). */
export function signIn(user: TestUser | null): void {
  vi.mocked(auth).mockResolvedValue(
    (user ? { user: { id: user.id, email: user.email, roles: user.roles, role: user.roles[0] } } : null) as any,
  );
}

/** Paramètres de route utilisables en `await params` comme en `params.id`. */
export function routeParams<T extends Record<string, string>>(values: T): { params: any } {
  return { params: Object.assign(Promise.resolve(values), values) };
}

/** Construit une requête JSON. */
export function request(url: string, init: { method?: string; body?: unknown } = {}): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, {
    method: init.method ?? 'GET',
    ...(init.body !== undefined
      ? { body: JSON.stringify(init.body), headers: { 'content-type': 'application/json' } }
      : {}),
  });
}

/** Statut et corps JSON d'une réponse. */
export async function read(response: Response): Promise<{ status: number; body: any }> {
  const text = await response.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* corps non JSON */
  }
  return { status: response.status, body };
}
