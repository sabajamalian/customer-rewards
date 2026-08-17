import type { Member, Reward, Tier, Transaction } from '../types/index.js';

export const TIERS: Tier[] = [
  {
    name: 'Bronze',
    threshold: 0,
    multiplier: 1,
    description: 'Entry tier. Earn 1 point per dollar spent.',
  },
  {
    name: 'Silver',
    threshold: 2500,
    multiplier: 1.25,
    description: 'Earn 25% bonus points and get free standard shipping.',
  },
  {
    name: 'Gold',
    threshold: 10000,
    multiplier: 1.5,
    description: 'Earn 50% bonus points, free shipping, and early access to seasonal drops.',
  },
  {
    name: 'Platinum',
    threshold: 25000,
    multiplier: 2,
    description: 'Double points, concierge support, and invitation-only member events.',
  },
];

export const MEMBERS: Member[] = [
  {
    id: 'mbr-1001',
    firstName: 'Amara',
    lastName: 'Okafor',
    email: 'amara.okafor@example.com',
    joinedAt: '2023-02-14T00:00:00.000Z',
    lifetimePoints: 0,
  },
  {
    id: 'mbr-1002',
    firstName: 'Diego',
    lastName: 'Ramirez',
    email: 'diego.ramirez@example.com',
    joinedAt: '2022-11-03T00:00:00.000Z',
    lifetimePoints: 0,
  },
  {
    id: 'mbr-1003',
    firstName: 'Priya',
    lastName: 'Raghavan',
    email: 'priya.raghavan@example.com',
    joinedAt: '2024-06-21T00:00:00.000Z',
    lifetimePoints: 0,
  },
  {
    id: 'mbr-1004',
    firstName: 'Jonas',
    lastName: 'Lindqvist',
    email: 'jonas.lindqvist@example.com',
    joinedAt: '2021-08-09T00:00:00.000Z',
    lifetimePoints: 0,
  },
  {
    id: 'mbr-1005',
    firstName: 'Mei',
    lastName: 'Tanaka',
    email: 'mei.tanaka@example.com',
    joinedAt: '2025-01-30T00:00:00.000Z',
    lifetimePoints: 0,
  },
  {
    id: 'mbr-1006',
    firstName: 'Tobias',
    lastName: 'Ferreira',
    email: 'tobias.ferreira@example.com',
    joinedAt: '2023-09-17T00:00:00.000Z',
    lifetimePoints: 0,
  },
  {
    id: 'mbr-1007',
    firstName: 'Hannah',
    lastName: 'Bergstrom',
    email: 'hannah.bergstrom@example.com',
    joinedAt: '2024-03-05T00:00:00.000Z',
    lifetimePoints: 0,
  },
  {
    id: 'mbr-1008',
    firstName: 'Kwame',
    lastName: 'Mensah',
    email: 'kwame.mensah@example.com',
    joinedAt: '2022-05-28T00:00:00.000Z',
    lifetimePoints: 0,
  },
];

export const REWARDS: Reward[] = [
  {
    id: 'rw-001',
    name: '$10 grocery credit',
    description: 'Ten dollars off any grocery order over $40.',
    category: 'Grocery',
    pointsCost: 1000,
    stock: 500,
    active: true,
  },
  {
    id: 'rw-002',
    name: '$25 grocery credit',
    description: 'Twenty five dollars off any grocery order over $80.',
    category: 'Grocery',
    pointsCost: 2400,
    stock: 300,
    active: true,
  },
  {
    id: 'rw-003',
    name: 'Reusable insulated tote',
    description: 'Branded insulated tote bag, keeps groceries cold for six hours.',
    category: 'Home',
    pointsCost: 3200,
    stock: 120,
    active: true,
  },
  {
    id: 'rw-004',
    name: 'Members-only hoodie',
    description: 'Heavyweight cotton hoodie available to Silver tier and above.',
    category: 'Apparel',
    pointsCost: 6000,
    stock: 60,
    active: true,
  },
  {
    id: 'rw-005',
    name: 'Ceramic cookware set',
    description: 'Five piece nonstick ceramic cookware set.',
    category: 'Home',
    pointsCost: 12000,
    stock: 25,
    active: true,
  },
  {
    id: 'rw-006',
    name: 'Seasonal tasting event',
    description: 'Two tickets to the quarterly members tasting event.',
    category: 'Experience',
    pointsCost: 15000,
    stock: 40,
    active: true,
  },
  {
    id: 'rw-007',
    name: 'Donate 1000 meals',
    description: 'We donate 1000 meals to a regional food bank on your behalf.',
    category: 'Charity',
    pointsCost: 5000,
    stock: 9999,
    active: true,
  },
  {
    id: 'rw-008',
    name: 'Chef knife',
    description: 'Eight inch forged chef knife with lifetime sharpening.',
    category: 'Home',
    pointsCost: 8500,
    stock: 0,
    active: true,
  },
  {
    id: 'rw-009',
    name: 'Winter parka',
    description: 'Discontinued seasonal parka.',
    category: 'Apparel',
    pointsCost: 14000,
    stock: 12,
    active: false,
  },
  {
    id: 'rw-010',
    name: 'Private shopping hour',
    description: 'Platinum exclusive: the store to yourself for one hour.',
    category: 'Experience',
    pointsCost: 30000,
    stock: 10,
    active: true,
  },
];

const PURCHASE_SOURCES = [
  'pos:store-114',
  'pos:store-208',
  'pos:store-331',
  'web:checkout',
  'app:checkout',
] as const;

const PURCHASE_DESCRIPTIONS = [
  'Weekly grocery run',
  'Household restock',
  'Seasonal apparel purchase',
  'Online order',
  'Bulk pantry order',
] as const;

/**
 * Deterministic pseudo random generator so seeded data is identical on every
 * boot. Tests and demos depend on stable balances.
 */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Builds a spread of historical earn transactions per member.
 *
 * Transactions are spread backwards from `referenceDate` across roughly three
 * years, so the data set intentionally contains both recent activity and
 * activity older than twelve months.
 */
export function buildTransactions(referenceDate = new Date()): Transaction[] {
  const random = createRandom(20260816);
  const transactions: Transaction[] = [];
  let sequence = 1;

  for (const member of MEMBERS) {
    const joined = new Date(member.joinedAt).getTime();
    const now = referenceDate.getTime();
    const span = Math.max(now - joined, 30 * 24 * 60 * 60 * 1000);
    const count = 8 + Math.floor(random() * 14);

    for (let i = 0; i < count; i += 1) {
      const offset = random() * span;
      const occurredAt = new Date(joined + offset).toISOString();
      const basePoints = 120 + Math.floor(random() * 900);
      const sourceIndex = Math.floor(random() * PURCHASE_SOURCES.length);
      const descriptionIndex = Math.floor(random() * PURCHASE_DESCRIPTIONS.length);

      transactions.push({
        id: `txn-${String(sequence).padStart(5, '0')}`,
        memberId: member.id,
        type: 'earn',
        points: basePoints,
        source: PURCHASE_SOURCES[sourceIndex] ?? 'web:checkout',
        description: PURCHASE_DESCRIPTIONS[descriptionIndex] ?? 'Purchase',
        occurredAt,
      });
      sequence += 1;
    }
  }

  return transactions.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}
