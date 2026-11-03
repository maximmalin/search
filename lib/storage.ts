import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'radiodetali_favorites';
const HISTORY_KEY = 'radiodetali_history';

export async function getFavorites(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(id: string): Promise<string[]> {
  const current = await getFavorites();
  const updated = current.includes(id)
    ? current.filter((f) => f !== id)
    : [id, ...current];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

export async function isFavorite(id: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.includes(id);
}

export async function getHistory(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addToHistory(id: string): Promise<void> {
  const current = await getHistory();
  const updated = [id, ...current.filter((h) => h !== id)].slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
