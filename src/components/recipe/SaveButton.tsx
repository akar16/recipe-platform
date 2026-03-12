'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SaveButton({ recipeId }: { recipeId: string }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSaved = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('saved_recipes')
        .select('recipe_id')
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
        .single()

      setSaved(!!data)
      setLoading(false)
    }
    checkSaved()
  }, [recipeId])

  const handleToggle = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setLoading(true)
    if (saved) {
      await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
      setSaved(false)
    } else {
      await supabase
        .from('saved_recipes')
        .insert({ user_id: user.id, recipe_id: recipeId })
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
        saved
          ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
          : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-500'
      }`}
    >
      {saved ? '🔖 Saved' : '🔖 Save Recipe'}
    </button>
  )
}
