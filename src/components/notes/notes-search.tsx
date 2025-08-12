'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useNotesStore } from '@/store/notes-supabase'

export function NotesSearch() {
  const { currentSearch, setSearch } = useNotesStore()

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search notes by title or content..."
        value={currentSearch}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}