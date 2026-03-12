import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const { q: query = '' } = await searchParams

  let recipeQuery = supabase
    .from('recipes')
    .select('id, title, slug, description, cover_image_url, prep_time_mins, cook_time_mins, servings, country_of_origin, created_at, author_id')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (query) {
    recipeQuery = recipeQuery.ilike('title', `%${query}%`)
  }

  const { data: recipes, error } = await recipeQuery.limit(24)

  console.log('Recipes:', recipes, 'Error:', error)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Browse Recipes</h1>

      <form className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search recipes by title..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition">
            Search
          </button>
        </div>
      </form>

      {query && (
        <p className="text-gray-500 mb-4">
          Results for <span className="font-medium text-gray-800">"{query}"</span>
          {' '}— {recipes?.length || 0} found
        </p>
      )}

      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe: any) => (
            <Link href={`/recipes/${recipe.slug}`} key={recipe.id}>
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">
                {recipe.cover_image_url ? (
                  <img src={recipe.cover_image_url} alt={recipe.title}
                    className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-orange-100 flex items-center justify-center text-4xl">
                    🍴
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-1">
                    {recipe.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                    {recipe.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>⏱ {recipe.prep_time_mins + recipe.cook_time_mins} min</span>
                    <span>👤 {recipe.servings} servings</span>
                    {recipe.country_of_origin && (
                      <span>🌍 {recipe.country_of_origin}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">No recipes found{query ? ` for "${query}"` : ''}.</p>
        </div>
      )}
    </div>
  )
}
