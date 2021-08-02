/**
 * Model definition for Subscription
 */
export interface ISubscription {
  id: string;
  name: string;
  price?: number;
  for?: "Premium" | "PremiumPlus";
  stripePriceId?: string;
}