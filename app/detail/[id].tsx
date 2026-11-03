import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Heart,
  ArrowLeft,
  Cpu,
  Zap,
  Package,
  Gauge,
  Calendar,
  Hash,
  RefreshCw,
  Search,
  Copy,
  Check,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, categoryColors } from '@/lib/theme';
import { getComponentById } from '@/lib/search';
import { getFavorites, toggleFavorite, addToHistory } from '@/lib/storage';
import { useEffect } from 'react';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const component = id ? getComponentById(id) : undefined;
  const [isFav, setIsFav] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getFavorites().then((favs) => setIsFav(favs.includes(id)));
      addToHistory(id);
    }
  }, [id]);

  const handleToggleFav = useCallback(async () => {
    if (!component) return;
    const updated = await toggleFavorite(component.id);
    setIsFav(updated.includes(component.id));
  }, [component]);

  const handleCopyName = useCallback(() => {
    if (!component) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [component]);

  if (!component) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Component not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catColor = categoryColors[component.category] ?? colors.primary[500];

  const specs = [
    { icon: Package, label: 'Package', value: component.package },
    { icon: Zap, label: 'Max Voltage', value: component.voltage },
    { icon: Gauge, label: 'Power', value: component.power },
    { icon: Calendar, label: 'Frequency', value: component.frequency },
    { icon: Hash, label: 'Pins', value: String(component.pinCount) },
    { icon: Cpu, label: 'Symbol', value: component.symbol },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleFav} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Heart
            size={24}
            color={isFav ? colors.error[500] : colors.neutral[400]}
            fill={isFav ? colors.error[500] : 'none'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroSection, { backgroundColor: catColor + '15' }]}>
          <View style={[styles.heroIcon, { backgroundColor: catColor + '25' }]}>
            <Cpu size={36} color={catColor} strokeWidth={2} />
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.heroName}>{component.name}</Text>
              <TouchableOpacity onPress={handleCopyName}>
                {copied ? (
                  <Check size={16} color={colors.success[500]} strokeWidth={2} />
                ) : (
                  <Copy size={16} color={colors.neutral[400]} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.heroNameRu}>{component.nameRu}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: catColor + '22' }]}>
              <Text style={[styles.categoryBadgeText, { color: catColor }]}>
                {component.category} / {component.categoryRu}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{component.description}</Text>
        <Text style={styles.descriptionRu}>{component.descriptionRu}</Text>

        <Text style={styles.sectionTitle}>Specifications</Text>
        <View style={styles.specsGrid}>
          {specs.map((spec, i) => {
            const Icon = spec.icon;
            return (
              <View key={i} style={[styles.specCard, i % 2 === 0 && { marginRight: spacing.sm }]}>
                <View style={styles.specHeader}>
                  <Icon size={16} color={colors.neutral[500]} strokeWidth={2} />
                  <Text style={styles.specLabel}>{spec.label}</Text>
                </View>
                <Text style={styles.specValue}>{spec.value}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Equivalent / Alternative</Text>
        <View style={styles.equivalentBox}>
          <RefreshCw size={18} color={colors.primary[500]} strokeWidth={2} />
          <Text style={styles.equivalentText}>{component.equivalent}</Text>
        </View>

        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.tagsRow}>
          {component.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Search size={18} color={colors.surface} strokeWidth={2} />
          <Text style={styles.searchButtonText}>Search for equivalents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.datasheetButton}
          onPress={() => {
            const url = `https://www.google.com/search?q=${encodeURIComponent(component.name + ' datasheet pdf')}`;
            Linking.openURL(url);
          }}
        >
          <Text style={styles.datasheetButtonText}>Find datasheet online</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroName: {
    fontFamily: 'Inter-Bold',
    fontSize: fontSize.xxl,
    color: colors.text,
    letterSpacing: -0.5,
  },
  heroNameRu: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  categoryBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.xs,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.lg,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  descriptionRu: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: 6,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  specHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  specLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  specValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.md,
    color: colors.text,
  },
  equivalentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  equivalentText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.md,
    color: colors.text,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  tagText: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.xs,
    color: colors.primary[700],
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[600],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.md,
    color: colors.surface,
  },
  datasheetButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datasheetButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.md,
    color: colors.primary[600],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.lg,
    color: colors.text,
  },
  backLink: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.md,
    color: colors.primary[600],
  },
});
