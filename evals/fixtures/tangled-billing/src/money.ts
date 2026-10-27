export interface Money {
  amountCents: number;
  currency: string;
}

export function add(a: Money, b: Money): Money {
  return { amountCents: a.amountCents + b.amountCents, currency: a.currency };
}

export function negate(a: Money): Money {
  return { amountCents: -a.amountCents, currency: a.currency };
}
