import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SavedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: saved } = await supabase
    .from('saved_recipes')
    .select(`
      saved_at,
      recipes(
        id, title, slug, description, cover_image_url,
        prep_time_mins, cook_time_mins, servings, country_of_origin,
        profiles!recipes_author_id_fkey(username)
      )
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Saved Recipes</h1>
      {saved && saved.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map((item: any) => {
            const recipe = item.recipes
            if (!recipe) return null
            return (
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
                    </div>
                    {recipe.profiles && (
                      <p className="text-xs text-orange-500 mt-2">
                        by @{(recipe.profiles as any).username}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔖</p>
          <p className="text-lg">No saved recipes yet.</p>
          <Link href="/recipes" className="text-orange-500 hover:underline mt-2 inline-block">
            Browse recipes →
          </Link>
        </div>
      )}
    </div>
  )
}
