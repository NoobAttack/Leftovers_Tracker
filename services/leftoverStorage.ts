import AsyncStorage from '@react-native-async-storage/async-storage';
import { LeftoverItem } from '@/types/leftover';

const STORAGE_KEY = 'leftovers.items.v1';

// Handle bad JSON safely.
function safeParseArray(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Keep only objects with the shape we expect.
function isLeftoverItem(item: unknown): item is LeftoverItem {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const maybeItem = item as Partial<LeftoverItem>;
  return (
    typeof maybeItem.id === 'string' &&
    typeof maybeItem.name === 'string' &&
    typeof maybeItem.expiryDate === 'string' &&
    typeof maybeItem.createdAt === 'string'
  );
}

export async function getLeftoverItems(): Promise<LeftoverItem[]> {
  const serialized = await AsyncStorage.getItem(STORAGE_KEY);
  if (!serialized) {
    return [];
  }

  // Read and clean stored data.
  return safeParseArray(serialized).filter(isLeftoverItem);
}

export async function saveLeftoverItems(items: LeftoverItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function addLeftoverItem(item: LeftoverItem): Promise<void> {
  // Put newest item first.
  const existing = await getLeftoverItems();
  await saveLeftoverItems([item, ...existing]);
}

export async function removeLeftoverItem(itemId: string): Promise<void> {
  const existing = await getLeftoverItems();
  const next = existing.filter((item) => item.id !== itemId);
  await saveLeftoverItems(next);
}
