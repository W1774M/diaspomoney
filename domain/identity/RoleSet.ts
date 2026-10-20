/**
 * Ensemble de rôles Identity.
 * CUSTOMER (persistence) = Client dans la langue ubiquitaire.
 */

export const DOMAIN_ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  PROVIDER: 'PROVIDER',
  CLIENT: 'CUSTOMER', // alias langage → valeur persistence
  BENEFICIARY: 'BENEFICIARY',
  CSM: 'CSM',
} as const;

export type DomainRole = (typeof DOMAIN_ROLES)[keyof typeof DOMAIN_ROLES];

const VALID = new Set<string>(Object.values(DOMAIN_ROLES));

export class RoleSet {
  private readonly roles: ReadonlySet<string>;

  private constructor(roles: string[]) {
    this.roles = new Set(roles);
  }

  static of(roles: string[]): RoleSet {
    if (!roles.length) {
      throw new Error('RoleSet requires at least one role');
    }
    for (const role of roles) {
      if (!VALID.has(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
    }
    return new RoleSet(roles);
  }

  static defaultClient(): RoleSet {
    return RoleSet.of([DOMAIN_ROLES.CLIENT]);
  }

  has(role: string): boolean {
    return this.roles.has(role);
  }

  toArray(): string[] {
    return [...this.roles];
  }

  primary(): string {
    const arr = this.toArray();
    return arr[0]!;
  }
}
