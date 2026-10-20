/**
 * Agrégat Beneficiary — ownership Client (Identity), pas UserService.
 */

export interface BeneficiaryProps {
  id?: string;
  ownerClientId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  active: boolean;
}

export class Beneficiary {
  private props: BeneficiaryProps;

  private constructor(props: BeneficiaryProps) {
    this.props = props;
  }

  static create(input: {
    ownerClientId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  }): Beneficiary {
    if (!input.ownerClientId?.trim()) {
      throw new Error('Beneficiary requires ownerClientId (Client)');
    }
    if (!input.firstName?.trim() || !input.lastName?.trim()) {
      throw new Error('Beneficiary firstName and lastName are required');
    }
    return new Beneficiary({
      ownerClientId: input.ownerClientId.trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      active: true,
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
    });
  }

  get ownerClientId(): string {
    return this.props.ownerClientId;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  assertOwnedBy(clientId: string): void {
    if (this.props.ownerClientId !== clientId) {
      throw new Error('Beneficiary does not belong to this Client');
    }
  }

  deactivate(): void {
    this.props.active = false;
  }

  activate(): void {
    this.props.active = true;
  }

  get isActive(): boolean {
    return this.props.active;
  }

  /** Snapshot pour Booking (ACL) */
  toBookingSnapshot(): {
    firstName: string;
    lastName: string;
    phone: string;
  } {
    return {
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      phone: this.props.phone || '',
    };
  }
}
