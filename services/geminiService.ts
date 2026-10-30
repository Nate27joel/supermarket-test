import { Product } from "../types";

/**
 * Client-side Gemini service calling backend API proxy routes.
 * Never imports @google/genai or handles secrets in the browser.
 */

export const getSmartSuggestions = async (
  query: string, 
  availableProducts: Product[]
): Promise<string[]> => {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch('/api/gemini/smart-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        availableProducts: availableProducts.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          description: p.description
        }))
      })
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data.recommendedIds) ? data.recommendedIds : [];
  } catch (err) {
    console.warn("Client fallback for smart suggestions:", err);
    // Instant fallback search on client if network request fails
    const q = query.toLowerCase();
    return availableProducts
      .filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      )
      .map(p => p.id);
  }
};

export const getRecipeSuggestions = async (ingredients: string[]): Promise<any[]> => {
  try {
    const res = await fetch('/api/gemini/recipe-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ingredients })
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data.recipes) ? data.recipes : [];
  } catch (err) {
    console.warn("Client fallback for recipe suggestions:", err);
    return [
      {
        name: "Classic Owerri Yam & Egg Porridge (Asaro)",
        description: "Tender chunks of Abuja white yam slow-cooked in rich red palm oil, fresh tomatoes, scotch bonnet, and topped with gently beaten eggs.",
        extraIngredients: [
          "Fresh Tuber of Abuja White Yam (Extra Large)",
          "Fresh Jos Roma Tomatoes Basket",
          "Pure Unadulterated Red Palm Oil (Traditional)",
          "Farm Fresh Large Brown Eggs (Crate of 30)",
          "Scotch Bonnet Hot Pepper (Ata Rodo)"
        ]
      },
      {
        name: "Authentic Smoky Party Jollof Rice",
        description: "Fragrant long-grain Mama Gold rice simmered in a concentrated reduced tomato & pepper base, seasoned with Knorr cubes, and paired with fried yellow plantains.",
        extraIngredients: [
          "Mama Gold Pure White Rice (Long Grain)",
          "Gino Magic Jollof Tomato Paste Mix (Pack of 10)",
          "Devon Kings Pure Vegetable Cooking Oil",
          "Sweet Ripe Yellow Plantains (Bunch)",
          "Knorr Chicken Flavor Seasoning Cubes"
        ]
      },
      {
        name: "Golden Penny Semovita with Rich Chicken Soup",
        description: "Smooth, velvety Semovita morsels paired with a deeply savory stew made with fresh dressed farm chicken, aromatic herbs, and sweet onions.",
        extraIngredients: [
          "Golden Penny Semovita Premium Wheat",
          "Fresh Dressed Whole Farm Chicken",
          "Fresh Jos Roma Tomatoes Basket",
          "Knorr Chicken Flavor Seasoning Cubes"
        ]
      }
    ];
  }
};
