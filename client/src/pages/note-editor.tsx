import { useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { io } from "socket.io-client"
import { ArrowLeft, Check, Circle, Cloud, FileText, Layers3, LoaderCircle, LockKeyhole, LockKeyholeOpen, Mail, Users, Wifi, WifiOff, X } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiRequest, getUserId, SOCKET_URL, type Note } from "@/lib/api"
import { useAuth } from "@/lib/auth"

type LockState = { lockedBy: string | null; message: string }

export function NoteEditor() {
  const { noteId = "" } = useParams()
  const navigate = useNavigate()
  const { token, signOut } = useAuth()
  const userId = useMemo(() => token ? getUserId(token) : null, [token])
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState("")
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [connected, setConnected] = useState(false)
  const [lock, setLock] = useState<LockState>({ lockedBy: null, message: "Connecting to the live workspace…" })
  const [claimPending, setClaimPending] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [shareBusy, setShareBusy] = useState(false)
  const [shareError, setShareError] = useState("")
  const [shareSuccess, setShareSuccess] = useState("")
  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  useEffect(() => {
    if (!token || !noteId) return
    let active = true
    apiRequest<{ note: Note }>(token, `/notes/get/${encodeURIComponent(noteId)}`)
      .then(result => {
        if (!active) return
        setNote(result.note)
        setContent(result.note.data ?? "")
        setDirty(false)
      })
      .catch(cause => {
        if (!active) return
        const message = cause instanceof Error ? cause.message : "Could not open this note."
        if (/unauthorized|invalid token/i.test(message)) signOut()
        setLoadError(message)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [noteId, signOut, token])

  useEffect(() => {
    if (!token || !note) return
    const socket = io(SOCKET_URL, { auth: { token: `Bearer ${token}` } })
    socketRef.current = socket
    const joinNote = () => {
      setConnected(true)
      setLoadError("")
      socket.emit("note:join", { noteId })
    }
    const handleDisconnect = () => {
      setConnected(false)
      setClaimPending(false)
      setLock(current => ({ ...current, message: "Connection lost. Rejoining the live workspace…" }))
    }
    const handleLockStatus = (payload: { noteId: string; isLocked: boolean; lockedBy: string | null }) => {
      if (payload.noteId !== noteId) return
      setClaimPending(false)
      setLock({ lockedBy: payload.isLocked ? payload.lockedBy : null, message: payload.isLocked ? "This note is being edited by a collaborator." : "Available to edit" })
    }
    const handleLockAcquired = (payload: { noteId: string; userId: string }) => {
      if (payload.noteId !== noteId) return
      setClaimPending(false)
      setLock({ lockedBy: payload.userId, message: payload.userId === userId ? "You have editing access." : "This note is being edited by a collaborator." })
    }
    const handleLockFailed = (payload: { noteId: string; message?: string }) => {
      if (payload.noteId !== noteId) return
      setClaimPending(false)
      setLock(current => ({ ...current, message: payload.message ?? "This note is already locked." }))
    }
    const handleLockReleased = (payload: { noteId: string }) => {
      if (payload.noteId === noteId) setLock({ lockedBy: null, message: "Available to edit" })
    }
    const handleRemoteUpdate = (payload: { noteId: string; content: string }) => {
      if (payload.noteId !== noteId) return
      setContent(payload.content)
      setDirty(false)
    }
    const handleUpdateFailed = (payload: { noteId: string }) => {
      if (payload.noteId !== noteId) return
      setLock({ lockedBy: null, message: "Your editing lock expired. Request the lock again to continue." })
      setDirty(false)
    }

    socket.on("connect", joinNote)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", () => setLoadError("Could not connect to live editing. Check that the server is running."))
    socket.on("lock:status", handleLockStatus)
    socket.on("lock:acquired", handleLockAcquired)
    socket.on("lock:failed", handleLockFailed)
    socket.on("lock:released", handleLockReleased)
    socket.on("note:updated", handleRemoteUpdate)
    socket.on("update:failed", handleUpdateFailed)

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      if (socketRef.current === socket) socketRef.current = null
    }
  }, [note, noteId, token, userId])

  const ownsLock = Boolean(userId && lock.lockedBy === userId)
  const canEdit = ownsLock && connected
  const isOwner = Boolean(note && userId && note.creatorId === userId)

  useEffect(() => {
    if (!canEdit) return
    const heartbeat = () => socketRef.current?.emit("lock:heartbeat", { noteId })
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        heartbeat()
        socketRef.current?.emit("note:join", { noteId })
      }
    }
    heartbeat()
    document.addEventListener("visibilitychange", onVisibilityChange)
    const timer = window.setInterval(heartbeat, 3000)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [canEdit, noteId])

  useEffect(() => {
    if (!connected || ownsLock) return
    const resyncLockStatus = () => socketRef.current?.emit("note:join", { noteId })
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") resyncLockStatus()
    }
    const timer = window.setInterval(resyncLockStatus, 5000)
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [connected, noteId, ownsLock])

  useEffect(() => {
    if (!canEdit || !dirty) return
    const timer = window.setTimeout(() => {
      socketRef.current?.emit("note:update", { noteId, content })
      setDirty(false)
    }, 180)
    return () => window.clearTimeout(timer)
  }, [canEdit, content, dirty, noteId])

  if (!token) return <Navigate to="/signin" replace />

  function requestLock() {
    if (!connected || claimPending) return
    setClaimPending(true)
    setLock(current => ({ ...current, message: "Requesting editing access…" }))
    socketRef.current?.emit("lock:claim", { noteId })
  }

  function releaseLock() {
    const socket = socketRef.current
    if (!socket || !ownsLock) return
    if (dirty) {
      socket.emit("note:update", { noteId, content })
      setDirty(false)
    }
    window.setTimeout(() => socket.emit("lock:release", { noteId }), 200)
  }

  async function shareNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !note) return
    setShareBusy(true)
    setShareError("")
    setShareSuccess("")
    try {
      const result = await apiRequest<{ message: string }>(token, "/notes/add/user/", {
        method: "PATCH",
        body: JSON.stringify({ userEmail: shareEmail.trim(), noteId: note.id }),
      })
      setShareSuccess(result.message || "Access granted.")
      setShareEmail("")
    } catch (cause) {
      setShareError(cause instanceof Error ? cause.message : "Could not share this note.")
    } finally {
      setShareBusy(false)
    }
  }

  return (
    <main className="min-h-svh bg-[#f7f7f5]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-white/95 px-4 backdrop-blur sm:px-8">
        <div className="flex min-w-0 items-center gap-4"><Button variant="ghost" size="icon" aria-label="Back to notes" onClick={() => navigate("/")}><ArrowLeft className="size-4" /></Button><span className="hidden h-7 w-px bg-border sm:block" /><Link to="/" className="hidden sm:block"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Layers3 className="size-4" /></span></Link><div className="min-w-0"><h1 className="truncate text-sm font-semibold text-foreground">{note?.title || "Opening note…"}</h1><p className="text-[11px] text-muted-foreground">{connected ? "Live collaboration" : "Connecting…"}</p></div></div>
        <div className="flex items-center gap-2 sm:gap-3"><div className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:inline-flex ${connected ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{connected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}{connected ? "Connected" : "Reconnecting"}</div>{isOwner && <Button variant="outline" className="h-9 gap-2" onClick={() => { setShareOpen(true); setShareError(""); setShareSuccess("") }}><Users className="size-4" /><span className="hidden sm:inline">Share</span></Button>}{ownsLock ? <Button variant="outline" className="h-9 gap-2 border-amber-300 text-amber-900 hover:bg-amber-50" onClick={releaseLock}><LockKeyholeOpen className="size-4" /><span className="hidden sm:inline">Release lock</span></Button> : <Button className="h-9 gap-2" onClick={requestLock} disabled={!connected || claimPending || Boolean(lock.lockedBy)}>{claimPending ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}{claimPending ? "Requesting…" : "Edit note"}</Button>}</div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><FileText className="size-3.5" /> Plain text note <span>·</span><span>{note ? `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(note.updatedAt))}` : ""}</span></div><div className="flex items-center gap-2 text-xs"><Cloud className="size-3.5 text-emerald-600" /><span className="text-muted-foreground">{canEdit ? dirty ? "Saving changes live…" : "Changes sync live" : "Read-only"}</span></div></div>
        {loadError && <Alert variant="destructive" className="mb-5"><AlertDescription>{loadError}</AlertDescription></Alert>}
        {loading ? <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> Loading note…</span></div> : note ? <>
          <div className={`mb-5 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${ownsLock ? "border-emerald-200 bg-emerald-50" : lock.lockedBy ? "border-amber-200 bg-amber-50" : "border-border bg-white"}`}><div className="flex min-w-0 items-center gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-full ${ownsLock ? "bg-emerald-100 text-emerald-800" : lock.lockedBy ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>{ownsLock ? <Check className="size-4" /> : lock.lockedBy ? <LockKeyhole className="size-4" /> : <Circle className="size-3.5" />}</span><div><p className="text-sm font-medium text-foreground">{ownsLock ? "You have the editing lock" : lock.lockedBy ? "This note is locked" : "This note is available"}</p><p className="mt-0.5 text-xs text-muted-foreground">{connected ? lock.message : "Reconnect to view and edit live changes."}</p></div></div>{lock.lockedBy && !ownsLock && <span className="hidden shrink-0 rounded-full bg-white/75 px-3 py-1 text-xs text-muted-foreground md:inline">Read only</span>}</div>
          <Card className="min-h-[65vh] border-border/70 bg-white shadow-sm"><CardContent className="p-0"><textarea value={content} onChange={event => { setContent(event.target.value); setDirty(true) }} readOnly={!canEdit} placeholder={canEdit ? "Start writing…" : "This note is read-only. Request the lock to edit."} aria-label="Note content" className={`min-h-[65vh] w-full resize-y rounded-xl bg-transparent px-6 py-7 text-[15px] leading-7 text-foreground outline-none placeholder:text-muted-foreground/70 sm:px-10 sm:py-9 ${canEdit ? "cursor-text" : "cursor-default"}`} /></CardContent></Card>
          <p className="mt-4 text-center text-xs text-muted-foreground">{canEdit ? "Only you can edit while you hold the lock. Your changes appear live to everyone in this note." : "You can see live updates while another collaborator holds the editing lock."}</p>
        </> : <div className="grid min-h-[50vh] place-items-center"><div className="text-center"><h2 className="font-semibold text-foreground">Could not open this note</h2><p className="mt-1 text-sm text-muted-foreground">{loadError || "This note may have been deleted or not shared with you."}</p><Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go back</Button></div></div>}
      </section>

      {shareOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setShareOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="share-note-title" className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="share-note-title" className="text-lg font-semibold text-foreground">Share this note</h2><p className="mt-1 text-sm text-muted-foreground">Invite a Folio user by their account email.</p></div><button type="button" onClick={() => setShareOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="size-4" /></button></div>{shareError && <Alert variant="destructive" className="mt-4"><AlertDescription>{shareError}</AlertDescription></Alert>}{shareSuccess && <Alert className="mt-4 border-emerald-200 bg-emerald-50 text-emerald-900"><AlertDescription>{shareSuccess}</AlertDescription></Alert>}<form className="mt-5 space-y-4" onSubmit={event => void shareNote(event)}><label className="relative block"><Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" autoFocus value={shareEmail} onChange={event => setShareEmail(event.target.value)} placeholder="teammate@example.com" aria-label="User email" className="h-11 pl-9" required /></label><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShareOpen(false)}>Done</Button><Button type="submit" disabled={shareBusy || !shareEmail.trim()}>{shareBusy ? "Sharing…" : "Grant access"}</Button></div></form></section></div>}
    </main>
  )
}
