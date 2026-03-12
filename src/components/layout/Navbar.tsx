'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        setUsername(profile?.username || null)
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setUsername(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-orange-500">
          🍴 RecipeShare
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/recipes" className="text-gray-600 hover:text-orange-500 transition">
            Browse
          </Link>
          {user ? (
            <>
              <Link href="/recipes/new" className="text-gray-600 hover:text-orange-500 transition">
                + New Recipe
              </Link>
              <Link href="/saved" className="text-gray-600 hover:text-orange-500 transition">
                Saved
              </Link>
              {username && (
                <Link href={`/profile/${username}`}
                  className="text-gray-600 hover:text-orange-500 transition">
                  @{username}
                </Link>
              )}
              <Link href="/profile/settings"
                className="text-gray-600 hover:text-orange-500 transition text-sm">
                ⚙️
              </Link>
              <button
                onClick={handleLogout}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm transition"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-orange-500 transition">
                Log In
              </Link>
              <Link href="/signup"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm transition">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
