
import { Item, Condition } from './types';

export const INITIAL_ITEMS: Item[] = [
  {
    id: '1',
    title: 'Mid-Century Armchair',
    description: 'Super comfortable, original upholstery. Needs to go by Friday.',
    price: 0,
    condition: Condition.GOOD,
    status: 'AVAILABLE',
    images: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800'],
    interestedParties: [],
    createdAt: Date.now()
  },
  {
    id: '2',
    title: 'Monstera Deliciosa',
    description: 'Includes the terracotta pot. She is heavy!',
    price: 25,
    condition: Condition.NEW,
    status: 'RESERVED',
    images: ['https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=800'],
    // Fix: added missing 'type' property to satisfy the Interest interface
    interestedParties: [{ name: 'Sarah', timestamp: Date.now() - 10000, type: 'INTEREST' }],
    createdAt: Date.now() - 50000
  },
  {
    id: '3',
    title: 'Vintage Record Player',
    description: 'Works perfectly. Includes a few jazz records.',
    price: 80,
    condition: Condition.GOOD,
    status: 'AVAILABLE',
    images: ['https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=800'],
    // Fix: added missing 'type' property to satisfy the Interest interface
    interestedParties: [{ name: 'Mike', timestamp: Date.now() - 20000, type: 'INTEREST' }],
    createdAt: Date.now() - 100000
  }
];