import {
  ACCOUNT_STATUSES,
  assertCanAuthenticate,
  canTransitionAccountStatus,
  type AccountStatus,
} from './AccountStatus';
import { Email } from './Email';
import { RoleSet } from './RoleSet';

export interface UserAccountProps {
  id?: string;
  email: Email;
  firstName: string;
  lastName: string;
  status: AccountStatus;
  roles: RoleSet;
  passwordLength?: number;
}

export class UserAccount {
  private props: UserAccountProps;

  private constructor(props: UserAccountProps) {
    this.props = props;
  }

  static register(input: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    roles?: string[];
  }): UserAccount {
    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      throw new Error('firstName and lastName are required');
    }
    if (input.password !== undefined && input.password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    return new UserAccount({
      email: Email.of(input.email),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      status: ACCOUNT_STATUSES.PENDING,
      roles: input.roles?.length
        ? RoleSet.of(input.roles)
        : RoleSet.defaultClient(),
      passwordLength: input.password?.length,
    });
  }

  static rehydrate(props: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    roles: string[];
  }): UserAccount {
    return new UserAccount({
      id: props.id,
      email: Email.of(props.email),
      firstName: props.firstName,
      lastName: props.lastName,
      status: props.status as AccountStatus,
      roles: RoleSet.of(props.roles),
    });
  }

  get email(): string {
    return this.props.email.value;
  }

  get status(): AccountStatus {
    return this.props.status;
  }

  get roles(): string[] {
    return this.props.roles.toArray();
  }

  get displayName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  activate(): void {
    this.transitionTo(ACCOUNT_STATUSES.ACTIVE);
  }

  suspend(): void {
    this.transitionTo(ACCOUNT_STATUSES.SUSPENDED);
  }

  assertCanLogin(): void {
    assertCanAuthenticate(this.props.status);
  }

  private transitionTo(to: AccountStatus): void {
    if (!canTransitionAccountStatus(this.props.status, to)) {
      throw new Error(
        `Invalid account status transition: ${this.props.status} → ${to}`,
      );
    }
    this.props.status = to;
  }

  toRegistrationSnapshot(): {
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    roles: string[];
    status: AccountStatus;
  } {
    return {
      email: this.email,
      name: this.displayName,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      roles: this.roles,
      status: this.status,
    };
  }
}
