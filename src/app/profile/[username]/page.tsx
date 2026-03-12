import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Props = {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: Props) {
  const resolvedParams = await params
  const username = resolvedParams.username

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title, slug, description, cover_image_url, prep_time_mins, cook_time_mins, servings, created_at')
    .eq('author_id', profile.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 flex items-center gap-6">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.username}
            className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-3xl">
            👤
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">@{profile.username}</h1>
          {profile.full_name && (
            <p className="text-gray-500 mt-1">{profile.full_name}</p>
          )}
          {profile.bio && (
            <p className="text-gray-600 mt-2">{profile.bio}</p>
          )}
          <p className="text-sm text-gray-400 mt-2">
            {recipes?.length || 0} recipes shared
          </p>
        </div>
      </div>

      {/* Recipes Grid */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Recipes by @{profile.username}</h2>
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
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🍳</p>
          <p className="text-lg">No recipes yet.</p>
        </div>
      )}
    </div>
  )
}
