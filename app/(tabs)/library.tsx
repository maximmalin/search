import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Heart, Search as SearchIcon, Clock, Trash2 } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, categoryColors } from '@/lib/theme';
import { ComponentCard } from '@/components/ComponentCard';
import { getFavorites, toggleFavorite, getHistory, clearHistory, addToHistory } from '@/lib/storage';
import { radioComponents } from '@/data/components';
import type { RadioComponent } from '@/data/components';

export default function FavoritesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'favorites' | 'history'>('favorites');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [favSet, setFavSet] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      getFavorites().then((f) => {
        setFavorites(f);
        setFavSet(f);
      });
      getHistory().then(setHistory);
    }, [])
  );

  const favComponents = favorites
    .map((id) => radioComponents.find((c) => c.id === id))
    .filter((c): c is RadioComponent => c !== undefined);

  const historyComponents = history
    .map((id) => radioComponents.find((c) => c.id === id))
    .filter((c): c is RadioComponent => c !== undefined);

  const handleToggleFav = useCallback(async (id: string) => {
    const updated = await toggleFavorite(id);
    setFavSet(updated);
    setFavorites(updated);
  }, []);

  const handleComponentPress = useCallback((component: RadioComponent) => {
    addToHistory(component.id);
    router.push(`/detail/${component.id}`);
  }, [router]);

  const handleClearHistory = useCallback(async () => {
    await clearHistory();
    setHistory([]);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Library</Text>
        <Text style={styles.subtitle}>Favorites and search history</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'favorites' && styles.tabActive]}
          onPress={() => setTab('favorites')}
        >
          <Heart
            size={16}
            color={tab === 'favorites' ? colors.primary[700] : colors.neutral[500]}
            fill={tab === 'favorites' ? colors.primary[500] : 'none'}
            strokeWidth={2}
          />
          <Text style={[styles.tabText, tab === 'favorites' && styles.tabTextActive]}>
            Favorites ({favComponents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Clock
            size={16}
            color={tab === 'history' ? colors.primary[700] : colors.neutral[500]}
            strokeWidth={2}
          />
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            History ({historyComponents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {tab === 'favorites' && favComponents.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Heart size={32} color={colors.neutral[300]} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart icon on any component{'\n'}to save it here for quick access.
            </Text>
          </View>
        )}

        {tab === 'favorites' && favComponents.length > 0 && (
          <View>
            {favComponents.map((c) => (
              <ComponentCard
                key={c.id}
                component={c}
                isFav={favSet.includes(c.id)}
                onPress={() => handleComponentPress(c)}
                onToggleFav={() => handleToggleFav(c.id)}
              />
            ))}
          </View>
        )}

        {tab === 'history' && historyComponents.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Clock size={32} color={colors.neutral[300]} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>No search history</Text>
            <Text style={styles.emptyText}>
              Components you view will appear{'\n'}here for easy access.
            </Text>
          </View>
        )}

        {tab === 'history' && historyComponents.length > 0 && (
          <View>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
              <Trash2 size={15} color={colors.error[500]} strokeWidth={2} />
              <Text style={styles.clearText}>Clear history</Text>
            </TouchableOpacity>
            {historyComponents.map((c) => (
              <ComponentCard
                key={c.id}
                component={c}
                isFav={favSet.includes(c.id)}
                onPress={() => handleComponentPress(c)}
                onToggleFav={() => handleToggleFav(c.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: fontSize.title,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.sm,
    color: colors.neutral[500],
  },
  tabTextActive: {
    color: colors.primary[700],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  empty: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.xl,
    color: colors.text,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  clearText: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.sm,
    color: colors.error[500],
  },
});
