export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  prepTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    category: 'vegetable' | 'meat' | 'dairy' | 'spice' | 'other';
  }>;
  instructions: string[];
  tags: string[];
  season: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const recipes: Recipe[] = [
  {
    id: 'recipe-1',
    title: 'Bramborový guláš s mrkví',
    description: 'Tradiční český guláš s čerstvými bramborami a mrkví přímo z naší farmy.',
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
    prepTime: 45,
    difficulty: 'easy',
    servings: 4,
    ingredients: [
      { name: 'Brambory', amount: '800', unit: 'g', category: 'vegetable' },
      { name: 'Mrkev', amount: '300', unit: 'g', category: 'vegetable' },
      { name: 'Cibule', amount: '2', unit: 'ks', category: 'vegetable' },
      { name: 'Hovězí maso', amount: '500', unit: 'g', category: 'meat' },
      { name: 'Rajčata', amount: '400', unit: 'g', category: 'vegetable' },
      { name: 'Paprika sladká', amount: '2', unit: 'lžíce', category: 'spice' },
      { name: 'Kmín', amount: '1', unit: 'lžička', category: 'spice' },
      { name: 'Majoránka', amount: '1', unit: 'lžička', category: 'spice' }
    ],
    instructions: [
      'Brambory oloupejte a nakrájejte na větší kostky.',
      'Mrkev a cibuli nakrájejte na kolečka.',
      'Maso nakrájejte na kostky a orestujte na oleji.',
      'Přidejte cibuli a restujte dozlatova.',
      'Zasypte paprikou, přidejte rajčata a duste 10 minut.',
      'Přidejte brambory, mrkev a koření.',
      'Zalijte vodou a vařte 30 minut do měkka.',
      'Ochutnejte solí a pepřem.'
    ],
    tags: ['tradiční', 'zimní', 'výtivné', 'rodinné'],
    season: ['podzim', 'zima'],
    nutritionInfo: {
      calories: 320,
      protein: 25,
      carbs: 35,
      fat: 8
    }
  },
  {
    id: 'recipe-2',
    title: 'Salát s rajčaty a okurkou',
    description: 'Osvěžující letní salát s čerstvými rajčaty a křupavou okurkou.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    prepTime: 15,
    difficulty: 'easy',
    servings: 2,
    ingredients: [
      { name: 'Rajčata', amount: '4', unit: 'ks', category: 'vegetable' },
      { name: 'Okurka', amount: '1', unit: 'ks', category: 'vegetable' },
      { name: 'Cibule červená', amount: '1/2', unit: 'ks', category: 'vegetable' },
      { name: 'Salát ledový', amount: '1', unit: 'hlávka', category: 'vegetable' },
      { name: 'Olivový olej', amount: '3', unit: 'lžíce', category: 'other' },
      { name: 'Ocet balsamico', amount: '1', unit: 'lžíce', category: 'other' },
      { name: 'Bazalka', amount: '10', unit: 'lístků', category: 'spice' }
    ],
    instructions: [
      'Rajčata omyjte a nakrájejte na klínky.',
      'Okurku oloupejte a nakrájejte na kolečka.',
      'Červenou cibuli nakrájejte na tenké kroužky.',
      'Salát omyjte a natrhejte na kousky.',
      'Vše promíchejte v míse.',
      'Připravte zálivku z oleje, octa, soli a pepře.',
      'Salát zalijte zálivkou a ozdobte bazalkou.'
    ],
    tags: ['letní', 'lehké', 'zdravé', 'vegetariánské'],
    season: ['jaro', 'léto'],
    nutritionInfo: {
      calories: 85,
      protein: 2,
      carbs: 8,
      fat: 6
    }
  },
  {
    id: 'recipe-3',
    title: 'Pečená paprika s česnekem',
    description: 'Aromatická pečená paprika s česnekem a bylinkami.',
    image: 'https://images.unsplash.com/photo-1583171122860-bf62fdef12be?w=400',
    prepTime: 35,
    difficulty: 'medium',
    servings: 3,
    ingredients: [
      { name: 'Paprika červená', amount: '4', unit: 'ks', category: 'vegetable' },
      { name: 'Česnek', amount: '4', unit: 'stroužky', category: 'vegetable' },
      { name: 'Olivový olej', amount: '4', unit: 'lžíce', category: 'other' },
      { name: 'Tymián', amount: '1', unit: 'lžička', category: 'spice' },
      { name: 'Rozmarýn', amount: '1', unit: 'lžička', category: 'spice' },
      { name: 'Sůl mořská', amount: '1', unit: 'lžička', category: 'spice' }
    ],
    instructions: [
      'Troubu předehřejte na 200°C.',
      'Papriky omyjte, odstraňte semínka a nakrájejte na pásky.',
      'Česnek oloupejte a nakrájejte na plátky.',
      'Papriky pokladejte na plech, posypejte česnekem.',
      'Pokapejte olejem a posypejte bylinkami.',
      'Pečte 25 minut do zlatova.',
      'Podávejte teplé jako přílohu nebo studené k chlebu.'
    ],
    tags: ['pečené', 'bylinky', 'příloha', 'vegetariánské'],
    season: ['léto', 'podzim']
  },
  {
    id: 'recipe-4',
    title: 'Krémová polévka z mrkve',
    description: 'Jemná a výživná polévka z čerstvé mrkve s kořením.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    prepTime: 40,
    difficulty: 'easy',
    servings: 4,
    ingredients: [
      { name: 'Mrkev', amount: '600', unit: 'g', category: 'vegetable' },
      { name: 'Brambory', amount: '300', unit: 'g', category: 'vegetable' },
      { name: 'Cibule', amount: '1', unit: 'ks', category: 'vegetable' },
      { name: 'Zázvor', amount: '2', unit: 'cm', category: 'spice' },
      { name: 'Smetana', amount: '200', unit: 'ml', category: 'dairy' },
      { name: 'Kuřecí vývar', amount: '1', unit: 'l', category: 'other' },
      { name: 'Kokosové mléko', amount: '100', unit: 'ml', category: 'other' }
    ],
    instructions: [
      'Mrkev a brambory oloupejte a nakrájejte na kostky.',
      'Cibuli a zázvor nakrájejte najemno.',
      'V hrnci orestujte cibuli dozlatova.',
      'Přidejte mrkev, brambory a zázvor.',
      'Zalijte vývarem a vařte 25 minut.',
      'Polévku rozmixujte do hladka.',
      'Vmíchejte smetanu a kokosové mléko.',
      'Ochutnejte a podávejte s bylinkami.'
    ],
    tags: ['polévka', 'krémová', 'výživná', 'zdravá'],
    season: ['podzim', 'zima'],
    nutritionInfo: {
      calories: 165,
      protein: 4,
      carbs: 18,
      fat: 9
    }
  },
  {
    id: 'recipe-5',
    title: 'Cuketa na grilu s bylinkami',
    description: 'Rychlé a zdravé grilované cukety s aromatickými bylinkami.',
    image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400',
    prepTime: 20,
    difficulty: 'easy',
    servings: 2,
    ingredients: [
      { name: 'Cuketa', amount: '2', unit: 'ks', category: 'vegetable' },
      { name: 'Olivový olej', amount: '3', unit: 'lžíce', category: 'other' },
      { name: 'Česnek', amount: '2', unit: 'stroužky', category: 'vegetable' },
      { name: 'Bazalka', amount: '10', unit: 'lístků', category: 'spice' },
      { name: 'Oregano', amount: '1', unit: 'lžička', category: 'spice' },
      { name: 'Parmazán', amount: '50', unit: 'g', category: 'dairy' }
    ],
    instructions: [
      'Cukety omyjte a nakrájejte na plátky.',
      'Česnek prolisujte a smíchejte s olejem.',
      'Cukety potřete česnekovou směsí.',
      'Na grilovací pánvi grilujte 3-4 minuty z každé strany.',
      'Posypejte bylinkami a nastrouhaným parmazánem.',
      'Podávejte ihned dokud jsou teplé.'
    ],
    tags: ['grilované', 'rychlé', 'letní', 'vegetariánské'],
    season: ['léto']
  },
  {
    id: 'recipe-6',
    title: 'Pórková polévka s bramborem',
    description: 'Klasická francouzská polévka s pórem a bramborami.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    prepTime: 50,
    difficulty: 'medium',
    servings: 6,
    ingredients: [
      { name: 'Pórek', amount: '3', unit: 'ks', category: 'vegetable' },
      { name: 'Brambory', amount: '500', unit: 'g', category: 'vegetable' },
      { name: 'Máslo', amount: '30', unit: 'g', category: 'dairy' },
      { name: 'Smetana', amount: '150', unit: 'ml', category: 'dairy' },
      { name: 'Zeleninový vývar', amount: '1.2', unit: 'l', category: 'other' },
      { name: 'Pažitka', amount: '2', unit: 'lžíce', category: 'spice' }
    ],
    instructions: [
      'Pórek nakrájejte na kolečka a dobře omyjte.',
      'Brambory oloupejte a nakrájejte na kostky.',
      'V hrnci rozehřejte máslo a zpěňte pórek.',
      'Přidejte brambory a zalijte vývarem.',
      'Vařte 30 minut do změknutí.',
      'Polévku částečně rozmixujte.',
      'Vmíchejte smetanu a posypejte pažitkou.'
    ],
    tags: ['klasická', 'francouzská', 'polévka', 'sytá'],
    season: ['podzim', 'zima', 'jaro']
  }
];

/**
 * Find recipes that contain at least one ingredient from customer's order
 */
export function getRecommendedRecipes(orderedProducts: string[]): Recipe[] {
  const normalizedProducts = orderedProducts.map(p => p.toLowerCase().trim());
  
  const recommendedRecipes = recipes.filter(recipe => {
    return recipe.ingredients.some(ingredient => {
      const ingredientName = ingredient.name.toLowerCase();
      return normalizedProducts.some(product => {
        // Check if product name is contained in ingredient name or vice versa
        return ingredientName.includes(product) || product.includes(ingredientName);
      });
    });
  });

  // Sort by number of matching ingredients
  return recommendedRecipes.sort((a, b) => {
    const aMatches = a.ingredients.filter(ingredient => {
      const ingredientName = ingredient.name.toLowerCase();
      return normalizedProducts.some(product => 
        ingredientName.includes(product) || product.includes(ingredientName)
      );
    }).length;

    const bMatches = b.ingredients.filter(ingredient => {
      const ingredientName = ingredient.name.toLowerCase();
      return normalizedProducts.some(product => 
        ingredientName.includes(product) || product.includes(ingredientName)
      );
    }).length;

    return bMatches - aMatches;
  });
}

/**
 * Get all available recipes
 */
export function getAllRecipes(): Recipe[] {
  return recipes;
}

/**
 * Get recipe by ID
 */
export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find(recipe => recipe.id === id);
}

/**
 * Filter recipes by difficulty
 */
export function getRecipesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Recipe[] {
  return recipes.filter(recipe => recipe.difficulty === difficulty);
}

/**
 * Filter recipes by season
 */
export function getRecipesBySeason(season: string): Recipe[] {
  return recipes.filter(recipe => recipe.season.includes(season.toLowerCase()));
}
