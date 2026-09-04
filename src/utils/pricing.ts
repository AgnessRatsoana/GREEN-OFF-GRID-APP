export const BUSINESS_DISCOUNT_RATE = 0.05;
export const BUSINESS_DISCOUNT_MIN_QUANTITY = 10;

export function getBusinessPrice(price: number): number {
  return Math.round(price * (1 - BUSINESS_DISCOUNT_RATE) * 100) / 100;
}

/**
 * The 5% business discount only applies to lines of 10 or more units.
 * Below the threshold the original price is charged.
 */
export function getBusinessLineUnitPrice(price: number, quantity: number): number {
  return quantity >= BUSINESS_DISCOUNT_MIN_QUANTITY ? getBusinessPrice(price) : price;
}

export function isBusinessDiscountEligible(quantity: number): boolean {
  return quantity >= BUSINESS_DISCOUNT_MIN_QUANTITY;
}

export function getPriceForAccountType(price: number, accountType?: 'individual' | 'business'): number {
  return accountType === 'business' ? getBusinessPrice(price) : price;
}
