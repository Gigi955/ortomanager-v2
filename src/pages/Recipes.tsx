import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Recipe } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, ChefHat, Clock, Users, Heart, ChevronDown, ChevronUp, CheckSquare, ShoppingCart
} from 'lucide-react';
import { getSeasonName } from '@/lib/utils';
import ShoppingListDialog from '@/components/ShoppingListDialog';

export default function RecipesPage() {
  const recipes = useLiveQuery(() => db.recipes.toArray());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [shoppingRecipe, setShoppingRecipe] = useState<Recipe | null>(null);

  const filteredRecipes = recipes?.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = filterDifficulty === 'all' || recipe.difficulty === filterDifficulty;
    const matchesFavorites = !showFavorites || recipe.isFavorite;
    return matchesSearch && matchesDifficulty && matchesFavorites;
  });

  const getDifficultyColor = (d: Recipe['difficulty']) => ({
    easy: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  })[d];
  const getDifficultyLabel = (d: Recipe['difficulty']) => ({ easy: 'Facile', medium: 'Media', hard: 'Difficile' })[d];

  const toggleFavorite = async (id: number, isFav: boolean) => {
    await db.recipes.update(id, { isFavorite: !isFav });
  };
  const toggleExpand = (id: number) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-garden-terracotta to-garden-sun text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Ricette</h1>
            <p className="text-orange-100">{recipes?.length || 0} ricette con i tuoi prodotti</p>
          </div>
          <Button size="icon" className="bg-white text-garden-terracotta hover:bg-orange-50 rounded-full w-12 h-12">
            <Plus className="w-6 h-6" />
          </Button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca ricette..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { label: 'Preferiti', filter: null, icon: <Heart className={`w-4 h-4 mr-1 ${showFavorites ? 'fill-current' : ''}`} />, active: showFavorites, action: () => setShowFavorites(v => !v) },
            { label: 'Tutte', filter: 'all', icon: null, active: filterDifficulty === 'all', action: () => setFilterDifficulty('all') },
            { label: 'Facili', filter: 'easy', icon: null, active: filterDifficulty === 'easy', action: () => setFilterDifficulty('easy') },
            { label: 'Medie', filter: 'medium', icon: null, active: filterDifficulty === 'medium', action: () => setFilterDifficulty('medium') },
            { label: 'Difficili', filter: 'hard', icon: null, active: filterDifficulty === 'hard', action: () => setFilterDifficulty('hard') },
          ].map(({ label, icon, active, action }) => (
            <Button key={label} variant={active ? 'default' : 'outline'} size="sm" onClick={action}
              className="rounded-full bg-white/20 hover:bg-white/30 border-white/40 whitespace-nowrap">
              {icon}{label}
            </Button>
          ))}
        </div>
      </div>

      {/* Recipes */}
      <div className="px-4 mt-6 space-y-3">
        {filteredRecipes && filteredRecipes.length > 0 ? (
          filteredRecipes.map(recipe => {
            const isExpanded = expandedId === recipe.id;
            return (
              <Card key={recipe.id} className="overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-0">
                  {/* Image area */}
                  <div className="h-32 bg-gradient-to-br from-garden-terracotta/20 to-garden-sun/20 dark:from-orange-900/30 dark:to-yellow-900/30 flex items-center justify-center relative">
                    <ChefHat className="w-12 h-12 text-garden-terracotta/40" />
                    <button
                      onClick={() => recipe.id && toggleFavorite(recipe.id, recipe.isFavorite)}
                      className="absolute top-3 right-3 bg-white/90 dark:bg-gray-700/90 backdrop-blur rounded-full p-2 hover:bg-white dark:hover:bg-gray-600 transition-colors"
                    >
                      <Heart className={`w-5 h-5 ${recipe.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </button>
                    {recipe.season.map(s => (
                      <Badge key={s} variant="outline" className="absolute bottom-2 left-2 text-xs bg-white/80 dark:bg-gray-700/80">{getSeasonName(s)}</Badge>
                    )).slice(0,2)}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg flex-1 dark:text-white">{recipe.title}</h3>
                      <Badge className={getDifficultyColor(recipe.difficulty)}>{getDifficultyLabel(recipe.difficulty)}</Badge>
                    </div>
                    {recipe.description && <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Prep: {recipe.prepTime} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span>Cottura: {recipe.cookTime} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{recipe.servings} {recipe.servings === 1 ? 'pers.' : 'pers.'}</span>
                      </div>
                    </div>

                    {recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {recipe.tags.slice(0, 4).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">{tag}</Badge>
                        ))}
                      </div>
                    )}

                    <Button
                      className="w-full rounded-xl"
                      variant="outline"
                      onClick={() => recipe.id && toggleExpand(recipe.id)}
                    >
                      {isExpanded ? (
                        <><ChevronUp className="w-4 h-4 mr-2" />Nascondi ricetta</>
                      ) : (
                        <><ChevronDown className="w-4 h-4 mr-2" />Visualizza ricetta</>
                      )}
                    </Button>

                    {/* Dettaglio ricetta espandibile */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t dark:border-gray-600 pt-4">
                        {/* Ingredienti */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-sm uppercase tracking-wide text-garden-leaf">Ingredienti</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 border-garden-leaf/30 text-garden-leaf hover:bg-garden-leaf/10"
                              onClick={() => setShoppingRecipe(recipe)}
                            >
                              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                              Lista spesa
                            </Button>
                          </div>
                          <ul className="space-y-1">
                            {recipe.ingredients.map((ing, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm dark:text-gray-300">
                                <span className="text-garden-leaf mt-0.5">-</span>
                                <span>{ing}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Preparazione */}
                        <div>
                          <h4 className="font-bold text-sm uppercase tracking-wide text-garden-terracotta mb-2">
                            <CheckSquare className="w-4 h-4 inline mr-1" />Preparazione
                          </h4>
                          <ol className="space-y-3">
                            {recipe.instructions.map((step, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm dark:text-gray-300">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-garden-terracotta/20 dark:bg-orange-900/40 text-garden-terracotta dark:text-orange-300 flex items-center justify-center text-xs font-bold">
                                  {i + 1}
                                </span>
                                <span className="pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">Nessuna ricetta trovata</p>
            <p className="text-sm text-gray-400 mb-4">
              {showFavorites ? 'Non hai ancora ricette preferite' : 'Prova con un altro filtro'}
            </p>
          </div>
        )}
      </div>

      <ShoppingListDialog
        recipe={shoppingRecipe}
        open={shoppingRecipe !== null}
        onOpenChange={(o) => { if (!o) setShoppingRecipe(null); }}
      />
    </div>
  );
}
