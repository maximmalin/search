const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE = "https://radiodetali.com.ua";

interface AjaxItem {
  id: string;
  name: string;
}

interface LiveProduct {
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

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractShortItems(html: string): LiveProduct[] {
  const products: LiveProduct[] = [];
  const itemRegex = /<div class="short-item[^"]*"[^>]*>([\s\S]*?)(?=<div class="short-item|<div class="pagination|$)/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(html)) !== null) {
    const block = match[1];

    const idMatch = block.match(/data-id="(\d+)"/);
    const id = idMatch ? idMatch[1] : "";

    const codeMatch = block.match(/Код товару:\s*<\/b>\s*(\d+)/) || block.match(/Код товару:\s*(\d+)/);
    const code = codeMatch ? codeMatch[1] : "";

    const linkMatch = block.match(/href="\/ua\/product\/([^"]+)"/);
    const urlSlug = linkMatch ? linkMatch[1] : "";
    const url = linkMatch ? `${BASE}/ua/product/${urlSlug}` : "";

    const imgMatch = block.match(/src="([^"]*thumb\.jpg)"/);
    const image = imgMatch ? `${BASE}${imgMatch[1]}` : null;

    const titleMatch = block.match(/<h3 class="short-title">([\s\S]*?)<\/h3>/);
    let name = "";
    let cleanName = "";
    if (titleMatch) {
      name = stripTags(titleMatch[1]).trim();
      cleanName = name;
    }

    const brandMatch = block.match(/<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>/);
    const brand = brandMatch ? stripTags(brandMatch[1]).trim() : null;
    const description = brandMatch && brandMatch[2] ? stripTags(brandMatch[2]).trim() : null;

    const notAvailable = block.includes("not-available");
    const buyMatch = block.match(/<span class="buy-action">\s*([\s\S]*?)\s*<\/span>/);
    const statusText = buyMatch ? stripTags(buyMatch[1]).trim() : null;
    const available = !notAvailable && statusText !== null && !statusText.toLowerCase().includes("запитати");

    const prices: { qty: string; price: string }[] = [];
    const qtyRegex = /<td>(\d+шт\.)<\/td>/g;
    const priceRegex = /<td>([\d.]+)<span class="grey-text">(\d+)<\/span>грн\.<\/td>/g;
    let qtyMatch: RegExpExecArray | null;
    let priceMatch: RegExpExecArray | null;
    const qtys: string[] = [];
    while ((qtyMatch = qtyRegex.exec(block)) !== null) {
      qtys.push(qtyMatch[1]);
    }
    while ((priceMatch = priceRegex.exec(block)) !== null) {
      prices.push({
        qty: qtys[prices.length] ?? "",
        price: `${priceMatch[1]}.${priceMatch[2]} грн`,
      });
    }

    if (id || code || urlSlug) {
      products.push({
        id,
        code,
        name,
        cleanName,
        url,
        image,
        brand,
        description,
        available,
        statusText,
        prices,
        urlSlug,
      });
    }
  }

  return products;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") ?? "";
    const action = url.searchParams.get("action") ?? "search";

    if (action === "detail" && path) {
      const detailUrl = `${BASE}/ua/product/${path}`;
      const resp = await fetch(detailUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RadioDetaliApp/1.0)",
          "Accept": "text/html",
        },
      });

      if (!resp.ok) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch product page (${resp.status})` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const html = await resp.text();

      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      const title = titleMatch ? stripTags(titleMatch[1]).trim() : "";

      const codeMatch = html.match(/Код товару:\s*(\d+)/);
      const code = codeMatch ? codeMatch[1] : "";

      const descMatch = html.match(/<div class="product-description[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      const description = descMatch ? stripTags(descMatch[1]).trim() : null;

      const imgMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*alt="[^"]*"/);
      const image = imgMatch && imgMatch[1].includes("/products/") ? `${BASE}${imgMatch[1]}` : null;

      const prices: { qty: string; price: string }[] = [];
      const qtyRegex = /<td>(\d+шт\.)<\/td>/g;
      const priceRegex = /<td>([\d.]+)<span class="grey-text">(\d+)<\/span>грн\.<\/td>/g;
      let qM: RegExpExecArray | null;
      let pM: RegExpExecArray | null;
      const qtys: string[] = [];
      while ((qM = qtyRegex.exec(html)) !== null) qtys.push(qM[1]);
      while ((pM = priceRegex.exec(html)) !== null) {
        prices.push({ qty: qtys[prices.length] ?? "", price: `${pM[1]}.${pM[2]} грн` });
      }

      const breadcrumbs: string[] = [];
      const bcRegex = /<span>([^<]+)<\/span>/g;
      let bcM: RegExpExecArray | null;
      while ((bcM = bcRegex.exec(html)) !== null) {
        const t = bcM[1].trim();
        if (t.length > 1 && !t.includes("Каталог")) breadcrumbs.push(t);
      }

      return new Response(
        JSON.stringify({
          id: code,
          code,
          title,
          description,
          image,
          prices,
          breadcrumbs: breadcrumbs.slice(0, 5),
          url: detailUrl,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const term = url.searchParams.get("q") ?? "";

    if (!term) {
      return new Response(
        JSON.stringify({ products: [], suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Get quick suggestions from AJAX endpoint
    let suggestions: AjaxItem[] = [];
    try {
      const ajaxResp = await fetch(`${BASE}/ua/ajax/productsearch2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (compatible; RadioDetaliApp/1.0)",
        },
        body: `term=${encodeURIComponent(term)}`,
      });

      if (ajaxResp.ok) {
        const ajaxData = await ajaxResp.json();
        if (ajaxData && Array.isArray(ajaxData.items)) {
          suggestions = ajaxData.items.slice(0, 10);
        }
      }
    } catch {
      // AJAX endpoint may fail; continue with full search
    }

    // 2. Get full search results via POST form
    let products: LiveProduct[] = [];
    try {
      const searchResp = await fetch(`${BASE}/ua/product/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (compatible; RadioDetaliApp/1.0)",
          "Accept": "text/html",
        },
        body: `q=${encodeURIComponent(term)}`,
      });

      if (searchResp.ok) {
        const searchHtml = await searchResp.text();
        products = extractShortItems(searchHtml);
      }
    } catch {
      // Full search may fail; return what we have
    }

    return new Response(
      JSON.stringify({ products, suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
