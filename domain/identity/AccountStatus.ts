export const ACCOUNT_STATUSES = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type AccountStatus =
  (typeof ACCOUNT_STATUSES)[keyof typeof ACCOUNT_STATUSES];

const ALLOWED: Record<AccountStatus, ReadonlyArray<AccountStatus>> = {
  PENDING: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
  ACTIVE: ['SUSPENDED', 'INACTIVE'],
  INACTIVE: ['ACTIVE', 'SUSPENDED'],
  SUSPENDED: ['ACTIVE', 'INACTIVE'],
};

export function canTransitionAccountStatus(
  from: AccountStatus,
  to: AccountStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertCanAuthenticate(status: AccountStatus): void {
  if (status !== ACCOUNT_STATUSES.ACTIVE) {
    throw new Error(
      `Account cannot authenticate with status ${status} (ACTIVE required)`,
    );
  }
}
