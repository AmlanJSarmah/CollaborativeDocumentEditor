import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Bot, LoaderCircle, MessageCircle, Send, Sparkles, Trash2, X } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiRequest } from "@/lib/api"

type ChatRole = "user" | "assistant"
type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  sources?: string[]
}

type NoteChatProps = {
  noteId: string
  userId: string
  token: string
  onClose: () => void
}

function historyKey(userId: string, noteId: string) {
  return `folio.chat-history.${userId}.${noteId}`
}

function loadHistory(key: string): ChatMessage[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]")
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is ChatMessage =>
      item && typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" && typeof item.id === "string"
    )
  } catch {
    return []
  }
}

export function NoteChat({ noteId, userId, token, onClose }: NoteChatProps) {
  const storageKey = historyKey(userId, noteId)
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory(storageKey))
  const [question, setQuestion] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, sending])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const currentQuestion = question.trim()
    if (!currentQuestion || sending) return
    setQuestion("")
    setSending(true)
    setError("")

    try {
      const result = await apiRequest<{
        response: { answer: string; source: string[] }
      }>(token, "/rag/query", {
        method: "POST",
        body: JSON.stringify({
          note_id: noteId,
          question: currentQuestion,
          chat_history: messages.slice(-24).map(({ role, content }) => ({ role, content })),
        }),
      })

      const nextMessages: ChatMessage[] = [
        ...messages,
        { id: crypto.randomUUID(), role: "user", content: currentQuestion },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.response.answer,
          sources: result.response.source,
        },
      ]
      setMessages(nextMessages)
    } catch (cause) {
      setQuestion(currentQuestion)
      setError(cause instanceof Error ? cause.message : "I couldn't answer that. Please try again.")
    } finally {
      setSending(false)
    }
  }

  function clearHistory() {
    if (!messages.length || !window.confirm("Clear this note's chat history?")) return
    setMessages([])
  }

  return (
    <>
      <button type="button" aria-label="Close chatbot" onClick={onClose} className="fixed inset-0 z-30 cursor-default bg-black/25 backdrop-blur-[1px] lg:bg-transparent lg:backdrop-blur-0" />
      <aside aria-label="Note chatbot" className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[440px] flex-col border-l border-border bg-[#fbfbfa] shadow-2xl">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-border/70 bg-white px-5">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Bot className="size-5" /></span><div><h2 className="text-sm font-semibold text-foreground">Note assistant</h2><p className="text-xs text-muted-foreground">Ask about this note</p></div></div>
          <div className="flex items-center gap-1"><Button variant="ghost" size="icon" aria-label="Clear chat history" title="Clear chat history" onClick={clearHistory} disabled={!messages.length}><Trash2 className="size-4" /></Button><Button variant="ghost" size="icon" aria-label="Close chatbot" onClick={onClose}><X className="size-4" /></Button></div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
          {!messages.length && <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-5" /></span><h3 className="mt-4 text-sm font-semibold text-foreground">Explore your note</h3><p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">Ask for a summary, find a detail, or think through an idea. Your chat stays saved in this browser.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{["Summarize this note", "What are the key points?"].map(suggestion => <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)} className="rounded-full border border-border bg-white px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-foreground">{suggestion}</button>)}</div></div>}

          {messages.map(message => (
            <div key={message.id} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-3.5" /></span>}
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-tl-md border border-border/70 bg-white text-foreground shadow-sm"}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.sources && message.sources.length > 0 && <details className="mt-3 border-t border-border/70 pt-2"><summary className="cursor-pointer text-xs font-medium text-primary">Sources ({message.sources.length})</summary><ul className="mt-2 space-y-2">{message.sources.map((source, index) => <li key={`${message.id}-${index}`} className="rounded-lg bg-muted/70 px-2.5 py-2 text-xs leading-5 text-muted-foreground">{source}</li>)}</ul></details>}
              </div>
            </div>
          ))}
          {sending && <div className="flex items-center gap-2.5"><span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-3.5" /></span><div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-white px-3.5 py-3 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Thinking…</div></div>}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-border/70 bg-white p-4 sm:p-5">
          {error && <Alert variant="destructive" className="mb-3"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={event => void sendMessage(event)} className="flex items-center gap-2 rounded-xl border border-input bg-background p-1.5 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20"><Input aria-label="Ask the note assistant" placeholder="Ask a question…" value={question} onChange={event => setQuestion(event.target.value)} disabled={sending} className="h-10 border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0" /><Button type="submit" size="icon" className="size-9 shrink-0 rounded-lg" aria-label="Send message" disabled={sending || !question.trim()}>{sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground"><MessageCircle className="mr-1 inline size-3" /> Chat history is saved on this device for this note</p>
        </div>
      </aside>
    </>
  )
}
