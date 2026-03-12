import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CommentForm from '@/components/comment/CommentForm'
import SaveButton from '@/components/recipe/SaveButton'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function RecipePage({ params }: Props) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipe, error } = await supabase
    .from('recipes')
    .select(`
      *,
      profiles!recipes_author_id_fkey(username, avatar_url),
      ingredients(id, amount, unit, name, order_index),
      steps(id, step_number, description, image_url),
      comments(id, body, created_at, profiles!comments_author_id_fkey(username))
    `)
    .eq('slug', slug)
    .single()

  if (error || !recipe) notFound()

  const sortedIngredients = recipe.ingredients?.sort((a: any, b: any) => a.order_index - b.order_index)
  const sortedSteps = recipe.steps?.sort((a: any, b: any) => a.step_number - b.step_number)
  const isAuthor = user?.id === recipe.author_id

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {recipe.cover_image_url ? (
        <img src={recipe.cover_image_url} alt={recipe.title}
          className="w-full h-72 object-cover rounded-2xl mb-8" />
      ) : (
        <div className="w-full h-72 bg-orange-100 rounded-2xl flex items-center justify-center text-6xl mb-8">
          🍴
        </div>
      )}

      <div className="flex items-start justify-between mb-3 gap-4">
        <h1 className="text-4xl font-bold text-gray-800">{recipe.title}</h1>
        <div className="flex gap-2 flex-shrink-0">
          {isAuthor && (
            <Link href={`/recipes/${slug}/edit`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition">
              ✏️ Edit
            </Link>
          )}
          <SaveButton recipeId={recipe.id} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
        <span>⏱ Prep: {recipe.prep_time_mins} min</span>
        <span>🔥 Cook: {recipe.cook_time_mins} min</span>
        <span>👤 Serves: {recipe.servings}</span>
        {recipe.country_of_origin && <span>🌍 {recipe.country_of_origin}</span>}
      </div>

      {recipe.profiles && (
        <p className="text-sm text-orange-500 mb-4">
          by{' '}
          <Link href={`/profile/${(recipe.profiles as any).username}`} className="hover:underline">
            @{(recipe.profiles as any).username}
          </Link>
        </p>
      )}

      {recipe.description && (
        <p className="text-gray-600 text-lg mb-8">{recipe.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {sortedIngredients?.map((ing: any) => (
                <li key={ing.id} className="flex gap-2 text-sm text-gray-700 border-b border-gray-100 pb-2">
                  <span className="font-medium">{ing.amount} {ing.unit}</span>
                  <span>{ing.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Instructions</h2>
            <ol className="space-y-4">
              {sortedSteps?.map((step: any) => (
                <li key={step.id} className="flex gap-4">
                  <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {step.step_number}
                  </span>
                  <p className="text-gray-700 pt-1">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Comments ({recipe.comments?.length || 0})
        </h2>
        {recipe.comments?.length > 0 ? (
          <ul className="space-y-4">
            {recipe.comments.map((comment: any) => (
              <li key={comment.id} className="border-b border-gray-100 pb-4">
                <p className="text-sm font-medium text-orange-500">
                  @{(comment.profiles as any)?.username}
                </p>
                <p className="text-gray-700 mt-1">{comment.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(comment.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
        )}
        <CommentForm recipeId={recipe.id} />
      </div>
    </div>
  )
}
