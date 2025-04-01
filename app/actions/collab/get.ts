"use server"
import { createClient } from '@/lib/supabase/server'
import { QueryData } from '@supabase/supabase-js'

export async function getCollabData(collab_id: string) {
  const supabase = await createClient()
  
  // Define the query first (for TypeScript inference)
  const collabQuery = supabase
    .from("collabs")
    .select(`
      *,
      users:collab_users(username),
      columns:collab_column(*),
      items:collab_ite
    `)
    .eq('collab_id', collab_id)
    .single()
  
  // Define the type based on the query
  type CollabWithUsersAndColumns = QueryData<typeof collabQuery>
  
  // Execute the query
  const { data, error } = await collabQuery
  
  if (error) {
    console.error('Error fetching collab data:', error)
    throw error
  }
  
  // The data is now properly typed
  return data as CollabWithUsersAndColumns
}