import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { FileText, Layers3, LoaderCircle, MoreHorizontal, Plus, Search, Users, X } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiRequest, type Note, type NoteCollection } from "@/lib/api"
import { useAuth } from "@/lib/auth"

type WorkspaceNote = { note: Note; owned: boolean }

function Brand() {
  return <Link to="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-foreground"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Layers3 className="size-5" /></span><span className="text-[17px]">folio<span className="text-primary">.</span></span></Link>
}

function displayDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recently updated"
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

export function WorkspaceHome() {
  const { token, signOut } = useAuth()
  const navigate = useNavigate()
  const [notes, setNotes] = useState<WorkspaceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let active = true
    apiRequest<{ notes: NoteCollection }>(token, "/notes/get-all-notes")
      .then(result => {
        if (!active) return
        setNotes([
          ...result.notes.createdNotes.map(note => ({ note, owned: true })),
          ...result.notes.grantedNotes.filter((note): note is Note => Boolean(note)).map(note => ({ note, owned: false })),
        ])
      })
      .catch(cause => {
        if (!active) return
        const message = cause instanceof Error ? cause.message : "Could not load your notes."
        if (/unauthorized|invalid token/i.test(message)) signOut()
        else setError(message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [signOut, token])

  async function createNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setCreating(true)
    setCreateError("")
    try {
      const result = await apiRequest<{ note: Note }>(token, "/notes/create", {
        method: "POST",
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      navigate(`/notes/${result.note.id}`)
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : "Could not create the note.")
    } finally {
      setCreating(false)
    }
  }

  async function deleteNote(note: Note) {
    if (!token || !window.confirm(`Delete “${note.title}”? This cannot be undone.`)) return
    setDeletingId(note.id)
    setError("")
    try {
      await apiRequest(token, `/notes/delete/${encodeURIComponent(note.id)}`, { method: "DELETE" })
      setNotes(current => current.filter(item => item.note.id !== note.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete the note.")
    } finally {
      setDeletingId(null)
    }
  }

  const filteredNotes = notes.filter(({ note }) => note.title.toLowerCase().includes(search.trim().toLowerCase()))

  if (!token) return <Navigate to="/signin" replace />

  return (
    <main className="min-h-svh bg-[#f7f7f5]">
      <header className="flex h-20 items-center justify-between border-b border-border/70 bg-white px-5 sm:px-10">
        <Brand />
        <div className="flex items-center gap-3"><span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 sm:inline-flex"><span className="size-1.5 rounded-full bg-emerald-500" /> Workspace ready</span><Button variant="outline" onClick={() => { signOut(); navigate("/signin", { replace: true }) }}>Sign out</Button></div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-10 sm:py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Your workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">Your notes</h1><p className="mt-2 text-sm text-muted-foreground">All the notes you created or your team shared with you.</p></div><Button onClick={() => { setCreateOpen(true); setCreateError("") }} className="h-10 gap-2"><Plus className="size-4" /> New note</Button></div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a note…" className="h-10 bg-white pl-9" aria-label="Search notes" /></div>{!loading && <p className="text-xs text-muted-foreground">{notes.length} {notes.length === 1 ? "note" : "notes"}</p>}</div>
        {error && <Alert variant="destructive" className="mt-5"><AlertDescription>{error}</AlertDescription></Alert>}
        {loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Loading your notes…</div> : filteredNotes.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredNotes.map(({ note, owned }) => (
            <Card key={note.id} className="group relative border-border/70 bg-white py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <Link to={`/notes/${note.id}`} className="absolute inset-0 z-0 rounded-xl" aria-label={`Open ${note.title}`} />
              <CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="size-5" /></div>
                {owned && <details className="relative z-10"><summary className="grid size-9 cursor-pointer list-none place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden" aria-label={`Options for ${note.title}`}><MoreHorizontal className="size-5" /></summary><div className="absolute top-10 right-0 z-20 w-40 rounded-lg border border-border bg-white p-1 shadow-lg"><button type="button" disabled={deletingId === note.id} onClick={() => void deleteNote(note)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/5 disabled:opacity-50">{deletingId === note.id ? <LoaderCircle className="size-4 animate-spin" /> : <X className="size-4" />} Delete note</button></div></details>}
              </div><h2 className="mt-5 truncate text-base font-semibold text-foreground">{note.title || "Untitled note"}</h2><p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{note.data.trim() || "A new blank note. Open it to start writing."}</p><div className="mt-5 flex items-center justify-between border-t border-border/70 pt-3.5 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5">{owned ? <Layers3 className="size-3.5" /> : <Users className="size-3.5" />}{owned ? "Created by you" : "Shared with you"}</span><span>{displayDate(note.updatedAt)}</span></div></CardContent>
            </Card>
          ))}</div>
        ) : <div className="mt-5 rounded-2xl border border-dashed border-border bg-white/75 px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><FileText className="size-5" /></div><h2 className="mt-4 font-semibold text-foreground">{search ? "No notes match your search" : "Your notes will live here"}</h2><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{search ? "Try a different title or clear your search." : "Create a note to capture an idea, or ask a teammate to share one with you."}</p>{!search && <Button className="mt-5 gap-2" onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Create your first note</Button>}</div>}
      </section>

      {createOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setCreateOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="new-note-title" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="new-note-title" className="text-lg font-semibold">Create a note</h2><p className="mt-1 text-sm text-muted-foreground">Give your new shared space a name.</p></div><button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="size-4" /></button></div>{createError && <Alert variant="destructive" className="mt-4"><AlertDescription>{createError}</AlertDescription></Alert>}<form className="mt-5 space-y-4" onSubmit={event => void createNote(event)}><Input autoFocus value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="e.g. Product ideas" aria-label="Note title" required maxLength={120} /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={creating || !newTitle.trim()}>{creating ? "Creating…" : "Create note"}</Button></div></form></section></div>}
    </main>
  )
}
