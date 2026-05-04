import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPACT_CARD_LAYOUT_KEY = 'settings.compactCardLayout.v1';

export async function getCompactCardLayoutEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(COMPACT_CARD_LAYOUT_KEY);
  return value === 'true';
}

export async function setCompactCardLayoutEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(COMPACT_CARD_LAYOUT_KEY, String(enabled));
}
