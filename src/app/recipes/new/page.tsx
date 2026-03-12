'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Ingredient = { amount: string; unit: string; name: string }
type Step = { description: string }

export default function NewRecipePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [country, setCountry] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [servings, setServings] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { amount: '', unit: '', name: '' }
  ])
  const [steps, setSteps] = useState<Step[]>([{ description: '' }])

  const addIngredient = () => setIngredients([...ingredients, { amount: '', unit: '', name: '' }])
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i))
  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients]
    updated[i][field] = value
    setIngredients(updated)
  }

  const addStep = () => setSteps([...steps, { description: '' }])
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i))
  const updateStep = (i: number, value: string) => {
    const updated = [...steps]
    updated[i].description = value
    setSteps(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in.'); setLoading(false); return }

    // Generate slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()

    // Upload cover image if provided
    let coverImageUrl = null
    if (coverImage) {
      const fileExt = coverImage.name.split('.').pop()
      const filePath = `${user.id}/${slug}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('recipe-covers')
        .upload(filePath, coverImage)
      if (uploadError) { setError(uploadError.message); setLoading(false); return }
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-covers')
        .getPublicUrl(filePath)
      coverImageUrl = publicUrl
    }

    // Insert recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        author_id: user.id,
        title,
        slug,
        description,
        country_of_origin: country,
        prep_time_mins: parseInt(prepTime) || 0,
        cook_time_mins: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 2,
        cover_image_url: coverImageUrl,
      })
      .select()
      .single()

    if (recipeError) { setError(recipeError.message); setLoading(false); return }

    // Insert ingredients
    const ingredientsData = ingredients
      .filter(ing => ing.name.trim())
      .map((ing, idx) => ({ recipe_id: recipe.id, order_index: idx, ...ing }))
    if (ingredientsData.length > 0) {
      await supabase.from('ingredients').insert(ingredientsData)
    }

    // Insert steps
    const stepsData = steps
      .filter(s => s.description.trim())
      .map((s, idx) => ({ recipe_id: recipe.id, step_number: idx + 1, description: s.description }))
    if (stepsData.length > 0) {
      await supabase.from('steps').insert(stepsData)
    }

    router.push(`/recipes/${slug}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
              <input type="text" value={country} onChange={e => setCountry(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings *</label>
              <input type="number" value={servings} onChange={e => setServings(e.target.value)} required min={1}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (mins)</label>
              <input type="number" value={prepTime} onChange={e => setPrepTime(e.target.value)} min={0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cook Time (mins)</label>
              <input type="number" value={cookTime} onChange={e => setCookTime(e.target.value)} min={0}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            <input type="file" accept="image/*" onChange={e => setCoverImage(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Ingredients</h2>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" placeholder="Amount" value={ing.amount}
                onChange={e => updateIngredient(i, 'amount', e.target.value)}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input type="text" placeholder="Unit" value={ing.unit}
                onChange={e => updateIngredient(i, 'unit', e.target.value)}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <input type="text" placeholder="Ingredient name *" value={ing.name}
                onChange={e => updateIngredient(i, 'name', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              {ingredients.length > 1 && (
                <button type="button" onClick={() => removeIngredient(i)}
                  className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addIngredient}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium">
            + Add Ingredient
          </button>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Instructions</h2>
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-2">
                {i + 1}
              </span>
              <textarea placeholder={`Step ${i + 1} instructions...`} value={step.description}
                onChange={e => updateStep(i, e.target.value)} rows={2}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              {steps.length > 1 && (
                <button type="button" onClick={() => removeStep(i)}
                  className="text-red-400 hover:text-red-600 text-lg font-bold mt-2">×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addStep}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium">
            + Add Step
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition text-lg">
          {loading ? 'Publishing...' : 'Publish Recipe'}
        </button>
      </form>
    </div>
  )
}
