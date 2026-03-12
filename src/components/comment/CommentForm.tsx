'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CommentForm({ recipeId }: { recipeId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to comment.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('comments')
      .insert({ recipe_id: recipeId, author_id: user.id, body })

    if (error) {
      setError(error.message)
    } else {
      setBody('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Leave a comment..."
        rows={3}
        required
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-semibold transition"
      >
        {loading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  )
}
