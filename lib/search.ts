import { create, insert, search } from '@orama/orama';
import type { AnyOrama } from '@orama/orama';
import { radioComponents, type RadioComponent } from '@/data/components';

const cyrillicToLatinMap: Record<string, string> = {
  'а': 'f', 'б': ',', 'в': 'd', 'г': 'u', 'д': 'l', 'е': 't', 'ё': '`',
  'ж': ';', 'з': 'p', 'и': 'b', 'й': 'q', 'к': 'r', 'л': 'k', 'м': 'v',
  'н': 'y', 'о': 'j', 'п': 'g', 'р': 'h', 'с': 'c', 'т': 'n', 'у': 'e',
  'ф': 'a', 'х': '[', 'ц': 'w', 'ч': 'x', 'ш': 'i', 'щ': 'o', 'ъ': ']',
  'ы': 's', 'ь': 'm', 'э': "'", 'ю': '.', 'я': 'z',
  'А': 'F', 'Б': '<', 'В': 'D', 'Г': 'U', 'Д': 'L', 'Е': 'T', 'Ё': '~',
  'Ж': ':', 'З': 'P', 'И': 'B', 'Й': 'Q', 'К': 'R', 'Л': 'K', 'М': 'V',
  'Н': 'Y', 'О': 'J', 'П': 'G', 'Р': 'H', 'С': 'C', 'Т': 'N', 'У': 'E',
  'Ф': 'A', 'Х': '{', 'Ц': 'W', 'Ч': 'X', 'Ш': 'I', 'Щ': 'O', 'Ъ': '}',
  'Ы': 'S', 'Ь': 'M', 'Э': '"', 'Ю': '>', 'Я': 'Z',
};

const latinToCyrillicMap: Record<string, string> = {
  'f': 'а', ',': 'б', 'd': 'в', 'u': 'г', 'l': 'д', 't': 'е', '`': 'ё',
  ';': 'ж', 'p': 'з', 'b': 'и', 'q': 'й', 'r': 'к', 'k': 'л', 'v': 'м',
  'y': 'н', 'j': 'о', 'g': 'п', 'h': 'р', 'c': 'с', 'n': 'т', 'e': 'у',
  'a': 'ф', '[': 'х', 'w': 'ц', 'x': 'ч', 'i': 'ш', 'o': 'щ', ']': 'ъ',
  's': 'ы', 'm': 'ь', "'": 'э', '.': 'ю', 'z': 'я',
  'F': 'А', 'D': 'В', 'U': 'Г', 'L': 'Д', 'T': 'Е', 'P': 'З', 'B': 'И',
  'Q': 'Й', 'R': 'К', 'K': 'Л', 'V': 'М', 'Y': 'Н', 'J': 'О', 'G': 'П',
  'H': 'Р', 'C': 'С', 'N': 'Т', 'E': 'У', 'A': 'Ф', 'W': 'Ц', 'X': 'Ч',
  'I': 'Ш', 'O': 'Щ', 'S': 'Ы', 'M': 'Ь', 'Z': 'Я',
};

function fixKeyboardLayoutCyrToLat(term: string): string {
  return term.split('').map((ch) => cyrillicToLatinMap[ch] ?? ch).join('');
}

function fixKeyboardLayoutLatToCyr(term: string): string {
  return term.split('').map((ch) => latinToCyrillicMap[ch] ?? ch).join('');
}

function hasCyrillic(text: string): boolean {
  return /[а-яА-ЯёЁ]/.test(text);
}

function hasLatin(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}

export interface SearchResult {
  component: RadioComponent;
  score: number;
  matchedQuery: string;
}

export interface Suggestion {
  text: string;
  type: 'component' | 'category' | 'tag';
  name: string;
}

let dbInstance: AnyOrama | null = null;
let initPromise: Promise<AnyOrama> | null = null;

async function getDb(): Promise<AnyOrama> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await create({
      schema: {
        name: 'string',
        nameRu: 'string',
        symbol: 'string',
        category: 'string',
        categoryRu: 'string',
        description: 'string',
        descriptionRu: 'string',
        equivalent: 'string',
        tags: 'string[]',
        package: 'string',
      },
    });

    const docs = radioComponents.map((c) => ({
      id: c.id,
      name: c.name,
      nameRu: c.nameRu,
      symbol: c.symbol,
      category: c.category,
      categoryRu: c.categoryRu,
      description: c.description,
      descriptionRu: c.descriptionRu,
      equivalent: c.equivalent,
      tags: c.tags,
      package: c.package,
    }));

    await insert(db, docs as any);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

function isAlreadyCyrillicMatch(query: string): boolean {
  return hasCyrillic(query);
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

function isNumericOrSymbolQuery(query: string): boolean {
  return /^[0-9А-Яа-яA-Za-z\-\s]+$/.test(query) && !query.includes(' ');
}

export async function searchComponents(query: string): Promise<SearchResult[]> {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const db = await getDb();
  const queryVariants: string[] = [normalized];

  if (hasCyrillic(normalized) && !hasLatin(normalized)) {
    const lat = fixKeyboardLayoutCyrToLat(normalized);
    if (lat !== normalized) queryVariants.push(lat);
  } else if (hasLatin(normalized) && !hasCyrillic(normalized)) {
    const cyr = fixKeyboardLayoutLatToCyr(normalized);
    if (cyr !== normalized) queryVariants.push(cyr);
  }

  const resultsMap = new Map<string, SearchResult>();
  let bestMatchedQuery = normalized;

  for (const variant of queryVariants) {
    try {
      const results = await search(db, {
        term: variant,
        tolerance: 2,
        limit: 20,
        properties: ['name', 'nameRu', 'symbol', 'category', 'categoryRu', 'equivalent', 'tags', 'description', 'descriptionRu', 'package'],
      });

      if (results.count > 0) {
        bestMatchedQuery = variant;
      }

      for (const hit of results.hits) {
        const doc = hit.document as any;
        const component = radioComponents.find((c) => c.id === doc.id);
        if (!component) continue;

        const existing = resultsMap.get(component.id);
        const score = (hit as any).score ?? 0;
        if (!existing || score > existing.score) {
          resultsMap.set(component.id, {
            component,
            score,
            matchedQuery: bestMatchedQuery,
          });
        }
      }
    } catch {
      // continue with next variant
    }
  }

  if (resultsMap.size === 0) {
    for (const variant of queryVariants) {
      try {
        const lowerVariant = variant.toLowerCase();
        const partialMatches = radioComponents.filter((c) => {
          const allText = [
            c.name, c.nameRu, c.equivalent, c.category, c.categoryRu,
            c.description, c.descriptionRu, ...c.tags,
          ].join(' ').toLowerCase();
          return allText.includes(lowerVariant);
        });
        for (const component of partialMatches.slice(0, 10)) {
          resultsMap.set(component.id, {
            component,
            score: 0.1,
            matchedQuery: variant,
          });
        }
        if (resultsMap.size > 0) break;
      } catch {
        // continue
      }
    }
  }

  if (resultsMap.size === 0 && isNumericOrSymbolQuery(normalized)) {
    const variants = [normalized.toLowerCase(), ...queryVariants.map((v) => v.toLowerCase())];
    for (const variant of variants) {
      const tokenMatches = radioComponents.filter((c) => {
        const allText = [
          c.name, c.nameRu, c.equivalent, ...c.tags,
        ].join(' ').toLowerCase();
        const tokens = allText.split(/[\s,\-]+/).filter(Boolean);
        return tokens.some((token) => {
          if (token.includes(variant) || variant.includes(token)) return true;
          const dist = levenshtein(token, variant);
          return dist <= 2 && dist > 0;
        });
      });
      for (const component of tokenMatches.slice(0, 10)) {
        if (!resultsMap.has(component.id)) {
          resultsMap.set(component.id, {
            component,
            score: 0.05,
            matchedQuery: variant,
          });
        }
      }
      if (resultsMap.size > 0) break;
    }
  }

  return Array.from(resultsMap.values()).sort((a, b) => b.score - a.score);
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export async function getSuggestions(query: string): Promise<Suggestion[]> {
  const normalized = normalizeQuery(query).toLowerCase();
  if (!normalized || normalized.length < 1) return [];

  const suggestions: Suggestion[] = [];
  const seen = new Set<string>();

  const queryVariants: string[] = [normalized];
  if (hasCyrillic(normalized) && !hasLatin(normalized)) {
    const lat = fixKeyboardLayoutCyrToLat(normalized).toLowerCase();
    if (lat !== normalized) queryVariants.push(lat);
  } else if (hasLatin(normalized) && !hasCyrillic(normalized)) {
    const cyr = fixKeyboardLayoutLatToCyr(normalized).toLowerCase();
    if (cyr !== normalized) queryVariants.push(cyr);
  }

  for (const variant of queryVariants) {
    for (const c of radioComponents) {
      const fields = [
        { text: c.name.toLowerCase(), type: 'component' as const, name: c.name },
        { text: c.nameRu.toLowerCase(), type: 'component' as const, name: c.nameRu },
      ];
      for (const f of fields) {
        if (f.text.startsWith(variant) && !seen.has(f.text)) {
          seen.add(f.text);
          suggestions.push({ text: f.name, type: f.type, name: c.name });
        }
        if (suggestions.length >= 8) break;
      }
      if (suggestions.length >= 8) break;
    }

    if (suggestions.length < 5) {
      for (const c of radioComponents) {
        const fields = [
          { text: c.name.toLowerCase(), type: 'component' as const, name: c.name },
          { text: c.nameRu.toLowerCase(), type: 'component' as const, name: c.nameRu },
        ];
        for (const f of fields) {
          if (f.text.includes(variant) && !seen.has(f.text)) {
            seen.add(f.text);
            suggestions.push({ text: f.name, type: f.type, name: c.name });
          }
          if (suggestions.length >= 8) break;
        }
        if (suggestions.length >= 8) break;
      }
    }

    if (suggestions.length < 8) {
      const categories = new Set<string>();
      radioComponents.forEach((c) => {
        categories.add(c.category);
        categories.add(c.categoryRu);
      });
      for (const cat of categories) {
        const catLower = cat.toLowerCase();
        if (catLower.includes(variant) && !seen.has(catLower)) {
          seen.add(catLower);
          suggestions.push({ text: cat, type: 'category', name: cat });
        }
        if (suggestions.length >= 10) break;
      }
    }

    if (suggestions.length >= 3) break;
  }

  return suggestions.slice(0, 8);
}

export function getCategories(): { en: string; ru: string; count: number }[] {
  const catMap = new Map<string, { en: string; ru: string; count: number }>();
  for (const c of radioComponents) {
    const key = c.category;
    const existing = catMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      catMap.set(key, { en: c.category, ru: c.categoryRu, count: 1 });
    }
  }
  return Array.from(catMap.values()).sort((a, b) => b.count - a.count);
}

export async function getComponentsByCategory(category: string): Promise<RadioComponent[]> {
  return radioComponents.filter(
    (c) => c.category === category || c.categoryRu === category
  );
}

export function getComponentById(id: string): RadioComponent | undefined {
  return radioComponents.find((c) => c.id === id);
}
