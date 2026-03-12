import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: recipes } = await supabase
    .from('recipes')
    .select(`
      id, title, slug, description, cover_image_url,
      prep_time_mins, cook_time_mins, servings, country_of_origin,
      created_at, profiles!recipes_author_id_fkey(username, avatar_url)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Discover Delicious Recipes 🍽️
        </h1>
        <p className="text-gray-500 text-lg mb-6">
          Explore thousands of recipes shared by our community
        </p>
        <Link
          href="/recipes"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          Browse All Recipes
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Latest Recipes</h2>
      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe: any) => (
            <Link href={`/recipes/${recipe.slug}`} key={recipe.id}>
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">
                {recipe.cover_image_url ? (
                  <img
                    src={recipe.cover_image_url}
                    alt={recipe.title}
                    className="w-full h-48 object-cover"
                  />
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
                  {recipe.profiles && (
                    <p className="text-xs text-orange-500 mt-2">
                      by @{(recipe.profiles as any).username}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🍳</p>
          <p className="text-lg">No recipes yet. Be the first to share one!</p>
          <Link href="/recipes/new" className="text-orange-500 hover:underline mt-2 inline-block">
            Create a recipe →
          </Link>
        </div>
      )}
    </div>
  )
}
