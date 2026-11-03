export interface LiveProduct {
  id: string;
  code: string;
  name: string;
  cleanName: string;
  url: string;
  image: string | null;
  brand: string | null;
  description: string | null;
  available: boolean;
  statusText: string | null;
  prices: { qty: string; price: string }[];
  urlSlug: string;
}

export interface LiveSuggestion {
  id: string;
  name: string;
}

export interface LiveSearchResult {
  products: LiveProduct[];
  suggestions: LiveSuggestion[];
}

const EDGE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/radiodetali-search`;

export async function searchLive(term: string): Promise<LiveSearchResult> {
  if (!term.trim()) return { products: [], suggestions: [] };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      headers["Authorization"] = `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`;
    }

    const resp = await fetch(
      `${EDGE_FUNCTION_URL}?q=${encodeURIComponent(term)}&action=search`,
      { headers }
    );

    if (!resp.ok) {
      throw new Error(`Live search failed: ${resp.status}`);
    }

    const data = await resp.json();
    return {
      products: Array.isArray(data.products) ? data.products : [],
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    };
  } catch {
    return { products: [], suggestions: [] };
  }
}

export async function getLiveProductDetail(slug: string): Promise<{
  id: string;
  code: string;
  title: string;
  description: string | null;
  image: string | null;
  prices: { qty: string; price: string }[];
  breadcrumbs: string[];
  url: string;
} | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      headers["Authorization"] = `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`;
    }

    const resp = await fetch(
      `${EDGE_FUNCTION_URL}?action=detail&path=${encodeURIComponent(slug)}`,
      { headers }
    );

    if (!resp.ok) return null;

    const data = await resp.json();
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}
