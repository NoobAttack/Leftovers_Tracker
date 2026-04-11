import { LeftoverApiDetails, NutritionGrade } from '@/types/leftover';

interface OpenFoodFactsProduct {
  brands?: string;
  categories?: string;
  nutriscore_grade?: string;
}

interface OpenFoodFactsResponse {
  products?: OpenFoodFactsProduct[];
}

function buildSearchUrl(query: string): string {
  return `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=1`;
}

function normalizeGrade(raw?: string): NutritionGrade | undefined {
  if (!raw) {
    return undefined;
  }

  const value = raw.toLowerCase();
  if (value === 'a' || value === 'b' || value === 'c' || value === 'd' || value === 'e') {
    return value;
  }

  return undefined;
}

// Keep only API fields this app actually uses.
function mapProductToDetails(product?: OpenFoodFactsProduct): LeftoverApiDetails | null {
  if (!product) {
    return null;
  }

  const details: LeftoverApiDetails = {
    brand: product.brands,
    category: product.categories?.split(',')[0]?.trim(),
    nutritionGrade: normalizeGrade(product.nutriscore_grade),
  };

  if (!details.brand && !details.category && !details.nutritionGrade) {
    return null;
  }

  return details;
}

export async function lookupFoodFacts(query: string): Promise<LeftoverApiDetails | null> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return null;
  }

  // Get top match from OpenFoodFacts.
  const response = await fetch(buildSearchUrl(trimmedQuery));
  if (!response.ok) {
    throw new Error(`OpenFoodFacts request failed (${response.status})`);
  }

  // Convert API response shape to app shape.
  const payload = (await response.json()) as OpenFoodFactsResponse;
  return mapProductToDetails(payload.products?.[0]);
}
