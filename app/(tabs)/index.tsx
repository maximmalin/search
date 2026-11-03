import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Search, X, Search as SearchIcon, SlidersHorizontal, Zap, Mic, MicOff, Square } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, categoryColors } from '@/lib/theme';
import { searchComponents, getSuggestions, getCategories, type SearchResult, type Suggestion } from '@/lib/search';
import { ComponentCard } from '@/components/ComponentCard';
import { getFavorites, toggleFavorite, addToHistory } from '@/lib/storage';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import type { RadioComponent } from '@/data/components';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ en: string; ru: string; count: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      getFavorites().then(setFavorites);
      setCategories(getCategories());
    }, [])
  );

  const handleSearch = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const searchResults = await searchComponents(trimmed);
      setResults(searchResults);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSuggest = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    try {
      const sugg = await getSuggestions(text);
      setSuggestions(sugg);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleSuggestionPress = useCallback((suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setSuggestions([]);
    handleSearch(suggestion.text);
  }, [handleSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setResults([]);
    setHasSearched(false);
  }, []);

  const handleComponentPress = useCallback((component: RadioComponent) => {
    addToHistory(component.id);
    Keyboard.dismiss();
    router.push(`/detail/${component.id}`);
  }, [router]);

  const handleToggleFav = useCallback(async (id: string) => {
    const updated = await toggleFavorite(id);
    setFavorites(updated);
  }, []);

  const handleVoiceResult = useCallback((text: string) => {
    setQuery(text);
    setSuggestions([]);
    handleSearch(text);
  }, [handleSearch]);

  const { listening, supported, startListening, stopListening } = useVoiceSearch(handleVoiceResult);

  const handleMicPress = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, startListening, stopListening]);

  const filteredResults = activeCategory
    ? results.filter((r) => r.component.category === activeCategory)
    : results;

  const resultCategories = new Set(results.map((r) => r.component.category));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RadioDetali</Text>
        <Text style={styles.subtitle}>Search electronic components</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={20} color={colors.neutral[500]} strokeWidth={2} />
        <TextInput
          style={styles.input}
          placeholder="Search by name, symbol, category..."
          placeholderTextColor={colors.neutral[400]}
          value={query}
          onChangeText={handleSuggest}
          onSubmitEditing={() => {
            setSuggestions([]);
            handleSearch(query);
          }}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={colors.neutral[400]} strokeWidth={2} />
          </TouchableOpacity>
        )}
        {supported && (
          <TouchableOpacity
            onPress={handleMicPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.micButton, listening && styles.micButtonActive]}
          >
            {listening ? (
              <Square size={16} color={colors.surface} strokeWidth={2} fill={colors.surface} />
            ) : (
              <Mic size={20} color={colors.primary[600]} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {listening && (
        <View style={styles.voiceBanner}>
          <View style={styles.voiceDot} />
          <Text style={styles.voiceText}>Listening... speak a component name</Text>
        </View>
      )}

      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          <ScrollView style={styles.suggestionsScroll} keyboardShouldPersistTaps="handled">
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(s)}
              >
                <SearchIcon size={15} color={colors.neutral[400]} strokeWidth={2} />
                <Text style={styles.suggestionText}>{s.text}</Text>
                <View style={styles.suggestionBadge}>
                  <Text style={styles.suggestionBadgeText}>{s.type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {hasSearched && results.length > 0 && (
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} color={colors.primary[600]} strokeWidth={2} />
            <Text style={styles.filterText}>{filteredResults.length} results</Text>
          </TouchableOpacity>
          {showFilters && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
              <TouchableOpacity
                style={[styles.catChip, !activeCategory && styles.catChipActive]}
                onPress={() => setActiveCategory(null)}
              >
                <Text style={[styles.catChipText, !activeCategory && styles.catChipTextActive]}>All</Text>
              </TouchableOpacity>
              {Array.from(resultCategories).map((cat) => {
                const catColor = categoryColors[cat] ?? colors.primary[500];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, activeCategory === cat && { backgroundColor: catColor + '20', borderColor: catColor }]}
                    onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  >
                    <Text style={[styles.catChipText, activeCategory === cat && { color: catColor }]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.resultsContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {!hasSearched && suggestions.length === 0 && (
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeIconBox}>
              <Zap size={32} color={colors.primary[500]} strokeWidth={2} />
            </View>
            <Text style={styles.welcomeTitle}>Start searching</Text>
            <Text style={styles.welcomeText}>
              Type any component name, symbol, or category.{'\n'}
              Works with typos, wrong keyboard layouts,{'\n'}
              Russian, Ukrainian, or English.
            </Text>
            <Text style={styles.welcomeHint}>Try: тп4056, КТ315, NE555, lm358, irfz44</Text>

            <Text style={styles.categoriesTitle}>Browse by category</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => {
                const catColor = categoryColors[cat.en] ?? colors.primary[500];
                return (
                  <TouchableOpacity
                    key={cat.en}
                    style={[styles.categoryCard, { borderLeftColor: catColor }]}
                    onPress={() => {
                      setQuery(cat.en);
                      handleSearch(cat.en);
                    }}
                  >
                    <Text style={styles.categoryCardName}>{cat.en}</Text>
                    <Text style={styles.categoryCardNameRu}>{cat.ru}</Text>
                    <Text style={styles.categoryCardCount}>{cat.count} items</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {hasSearched && loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {hasSearched && !loading && filteredResults.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsTitle}>No exact matches</Text>
            <Text style={styles.noResultsText}>
              Could not find "{query}". Try a different spelling{'\n'}
              or check if your keyboard layout is correct.
            </Text>
            <Text style={styles.noResultsHint}>
              The search works with typos (up to 2 characters),{'\n'}
              Cyrillic/Latin layout mix-ups, and partial matches.
            </Text>
          </View>
        )}

        {hasSearched && !loading && filteredResults.length > 0 && (
          <View>
            {filteredResults.map((r) => (
              <ComponentCard
                key={r.component.id}
                component={r.component}
                isFav={favorites.includes(r.component.id)}
                onPress={() => handleComponentPress(r.component)}
                onToggleFav={() => handleToggleFav(r.component.id)}
                matchInfo={r.score > 0 && r.score < 1 ? r.matchedQuery : undefined}
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    height: 52,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.md,
    color: colors.text,
  },
  suggestionsBox: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    maxHeight: 260,
  },
  suggestionsScroll: {
    borderRadius: radius.lg,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.md,
    color: colors.text,
  },
  suggestionBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  suggestionBadgeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.primary[600],
    textTransform: 'uppercase',
  },
  micButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
  },
  micButtonActive: {
    backgroundColor: colors.error[500],
  },
  voiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.error[400] + '18',
    borderRadius: radius.md,
  },
  voiceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error[500],
  },
  voiceText: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.sm,
    color: colors.error[600],
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterText: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.sm,
    color: colors.primary[600],
  },
  categoryFilters: {
    marginLeft: spacing.md,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    backgroundColor: colors.surface,
  },
  catChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  catChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.xs,
    color: colors.neutral[600],
  },
  catChipTextActive: {
    color: colors.primary[700],
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  welcomeSection: {
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  welcomeTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.xl,
    color: colors.text,
  },
  welcomeText: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeHint: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.sm,
    color: colors.primary[600],
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
  },
  categoriesTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.lg,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  categoryCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryCardName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoryCardNameRu: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryCardCount: {
    fontFamily: 'Inter-Medium',
    fontSize: fontSize.xs,
    color: colors.primary[600],
    marginTop: spacing.xs,
  },
  loadingBox: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  noResults: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  noResultsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: fontSize.xl,
    color: colors.text,
  },
  noResultsText: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  noResultsHint: {
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
