import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, ChevronRight, Cpu } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, categoryColors } from '@/lib/theme';
import type { RadioComponent } from '@/data/components';

interface ComponentCardProps {
  component: RadioComponent;
  isFav: boolean;
  onPress: () => void;
  onToggleFav: () => void;
  matchInfo?: string;
}

export function ComponentCard({
  component,
  isFav,
  onPress,
  onToggleFav,
  matchInfo,
}: ComponentCardProps) {
  const catColor = categoryColors[component.category] ?? colors.primary[500];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: catColor + '20' }]}>
        <Cpu size={22} color={catColor} strokeWidth={2} />
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{component.name}</Text>
          <Text style={styles.nameRu}>{component.nameRu}</Text>
        </View>
        <View style={styles.tagRow}>
          <View style={[styles.categoryTag, { backgroundColor: catColor + '18' }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>
              {component.category}
            </Text>
          </View>
          <Text style={styles.package}>{component.package}</Text>
        </View>
        {matchInfo ? (
          <Text style={styles.matchInfo}>Matched: {matchInfo}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onToggleFav}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={20}
            color={isFav ? colors.error[500] : colors.neutral[400]}
            fill={isFav ? colors.error[500] : 'none'}
            strokeWidth={2}
          />
        </TouchableOpacity>
        <ChevronRight size={18} color={colors.neutral[300]} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.md,
    color: colors.text,
  },
  nameRu: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.xs,
  },
  package: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  matchInfo: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.xs,
    color: colors.primary[600],
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
