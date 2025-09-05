import type { SubscriptionItem, ReorderItem } from './types';


export const demoSubscriptions: SubscriptionItem[] = [
{ id: 's1', name: 'Netflix', cost: 15.99, nextPayment: '2025-09-15' },
{ id: 's2', name: 'Spotify', cost: 9.99, nextPayment: '2025-09-18' },
];


export const demoReorders: ReorderItem[] = [
{ id: 'r1', productName: 'Coffee beans', productUrl: 'https://amazon.com', vendor: 'Amazon', frequencyDays: 30, nextOrder: '2025-09-06', priceCeiling: 15 },
];


// ── lib/utils.ts ────────────────────────────────────────────────────────────
export function daysUntil(dateISO: string): number {
const now = new Date();
const target = new Date(dateISO);
const diff = target.getTime() - now.getTime();
return Math.ceil(diff / (1000 * 60 * 60 * 24));
}