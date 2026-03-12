import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      profiles(username, avatar_url),
      ingredients(id, amount, unit, name, order_index),
      steps(id, step_number, description, image_url),
      comments(id, body, created_at, profiles(username))
    `)
    .eq('slug', 'menemen-1773349407910')
    .single()

  return NextResponse.json({ data, error })
}
