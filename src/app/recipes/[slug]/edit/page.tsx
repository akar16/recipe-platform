'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Ingredient = { id?: string; amount: string; unit: string; name: string }
type Step = { id?: string; step_number: number; description: string }

type Props = {
  params: Promise<{ slug: string }>
}

export default function EditRecipePage({ params }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [recipeId, setRecipeId] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [country, setCountry] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [servings, setServings] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<Step[]>([])

  useEffect(() => {
    const loadRecipe = async () => {
      const resolvedParams = await params
      const slug = resolvedParams.slug

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: recipe } = await supabase
        .from('recipes')
        .select(`*, ingredients(id, amount, unit, name, order_index), steps(id, step_number, description)`)
        .eq('slug', slug)
        .single()

      if (!recipe || recipe.author_id !== user.id) {
        router.push('/')
        return
      }

      setRecipeId(recipe.id)
      setTitle(recipe.title)
      setDescription(recipe.description || '')
      setCountry(recipe.country_of_origin || '')
      setPrepTime(String(recipe.prep_time_mins))
      setCookTime(String(recipe.cook_time_mins))
      setServings(String(recipe.servings))
      setIngredients(recipe.ingredients?.sort((a: any, b: any) => a.order_index - b.order_index) || [])
      setSteps(recipe.steps?.sort((a: any, b: any) => a.step_number - b.step_number) || [])
      setLoading(false)
    }
    loadRecipe()
  }, [])

  const addIngredient = () => setIngredients([...ingredients, { amount: '', unit: '', name: '' }])
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i))
  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients]
    updated[i] = { ...updated[i], [field]: value }
    setIngredients(updated)
  }

  const addStep = () => setSteps([...steps, { step_number: steps.length + 1, description: '' }])
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i))
  const updateStep = (i: number, value: string) => {
    const updated = [...steps]
    updated[i] = { ...updated[i], description: value }
    setSteps(updated)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()

    const { error: recipeError } = await supabase
      .from('recipes')
      .update({
        title,
        description,
        country_of_origin: country,
        prep_time_mins: parseInt(prepTime) || 0,
        cook_time_mins: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 2,
      })
      .eq('id', recipeId)

    if (recipeError) { setError(recipeError.message); setSaving(false); return }

    // Replace ingredients
    await supabase.from('ingredients').delete().eq('recipe_id', recipeId)
    const ingredientsData = ingredients
      .filter(ing => ing.name.trim())
      .map((ing, idx) => ({ recipe_id: recipeId, order_index: idx, amount: ing.amount, unit: ing.unit, name: ing.name }))
    if (ingredientsData.length > 0) {
      await supabase.from('ingredients').insert(ingredientsData)
    }

    // Replace steps
    await supabase.from('steps').delete().eq('recipe_id', recipeId)
    const stepsData = steps
      .filter(s => s.description.trim())
      .map((s, idx) => ({ recipe_id: recipeId, step_number: idx + 1, description: s.description }))
    if (stepsData.length > 0) {
      await supabase.from('steps').insert(stepsData)
    }

    router.push(`/recipes/${await params.then(p => p.slug)}`)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe? This cannot be undone.')) return
    setDeleting(true)

    const supabase = createClient()
    await supabase.from('recipes').delete().eq('id', recipeId)
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Edit Recipe</h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          {deleting ? 'Deleting...' : '🗑 Delete Recipe'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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
        </div>

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
        <button type="submit" disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition text-lg">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
