import React, { useState } from 'react';
import { Product, Currency } from '../types';
import { formatPrice } from '../constants';

interface Recipe {
  name: string;
  description: string;
  extraIngredients: string[];
}

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  availableProducts: Product[];
  onAddProducts: (products: Product[]) => void;
  isLoading: boolean;
  currency?: Currency;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ 
  isOpen, 
  onClose, 
  recipes, 
  availableProducts, 
  onAddProducts,
  isLoading,
  currency = 'NGN'
}) => {
  const [addedRecipeIndex, setAddedRecipeIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAddIngredients = (recipe: Recipe, index: number) => {
    const productsToAdd: Product[] = [];
    
    recipe.extraIngredients.forEach(ing => {
      const lowerIng = ing.toLowerCase();
      const match = availableProducts.find(p => 
        lowerIng.includes(p.name.toLowerCase()) || 
        p.name.toLowerCase().includes(lowerIng) ||
        (p.subcategory && lowerIng.includes(p.subcategory.toLowerCase()))
      );
      if (match && !productsToAdd.some(p => p.id === match.id)) {
        productsToAdd.push(match);
      }
    });

    if (productsToAdd.length > 0) {
      onAddProducts(productsToAdd);
      setAddedRecipeIndex(index);
      setTimeout(() => setAddedRecipeIndex(null), 2500);
    } else {
      // If no direct matches, add first 2 staples
      const staples = availableProducts.slice(0, 3);
      onAddProducts(staples);
      setAddedRecipeIndex(index);
      setTimeout(() => setAddedRecipeIndex(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden z-10 animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-forest-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-warm-400 text-gray-900 rounded-2xl flex items-center justify-center shadow">
              <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">AI Recipe Kitchen & Meal Prep</h2>
              <p className="text-forest-200 text-xs font-medium">Auto-match recipes to fresh supermarket ingredients in Owerri</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 hide-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-bold animate-pulse text-sm">Consulting our Owerri Chef AI...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-gray-500 text-sm">No recipes found right now. Add items to your basket and try again!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recipes.map((recipe, idx) => (
                <div key={idx} className="flex flex-col bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-forest-200 transition-all group">
                  <span className="text-[10px] font-black uppercase tracking-widest text-forest-700 bg-forest-50 px-2 py-0.5 rounded w-max mb-2">
                    Chef's Suggestion #{idx + 1}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-forest-700 transition-colors">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-3 leading-relaxed">
                    {recipe.description}
                  </p>
                  
                  <div className="flex-1">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                      Ingredients in Store
                    </h4>
                    <ul className="space-y-1.5">
                      {recipe.extraIngredients.map((ing, i) => (
                        <li key={i} className="flex items-start text-xs text-gray-700">
                          <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5 mr-2 text-[10px]"></i>
                          <span className="line-clamp-1">{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleAddIngredients(recipe, idx)}
                    className={`mt-6 w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 shadow-sm ${
                      addedRecipeIndex === idx 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-forest-700 text-white hover:bg-forest-800 active:scale-95'
                    }`}
                  >
                    {addedRecipeIndex === idx ? (
                      <>
                        <i className="fa-solid fa-check"></i>
                        <span>Added to Basket!</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-cart-plus"></i>
                        <span>Add Ingredients to Basket</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
          * Ingredients are automatically matched to real items currently in stock in our Owerri store.
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
