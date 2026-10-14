export class CreateSubscriptionDto {
  name!: string;
  amount!: number;
  billingCycle?: string;
  nextChargeDate!: string;
  active?: boolean;
  accountId?: string;
  categoryId?: string;
}