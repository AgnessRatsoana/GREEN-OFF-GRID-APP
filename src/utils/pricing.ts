export const BUSINESS_DISCOUNT_RATE = 0.05;

export function getBusinessPrice(price: number): number {
  return Math.round(price * (1 - BUSINESS_DISCOUNT_RATE) * 100) / 100;
}

export function getPriceForAccountType(price: number, accountType?: 'individual' | 'business'): number {
  return accountType === 'business' ? getBusinessPrice(price) : price;
}
