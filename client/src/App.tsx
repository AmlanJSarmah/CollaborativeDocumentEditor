import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { ArrowRight, Check, Eye, EyeOff, FileText, Layers3, LockKeyhole, Mail, Sparkles, Users } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { API_BASE } from "@/lib/api"
import { AuthProvider, useAuth } from "@/lib/auth"
import { NoteEditor } from "@/pages/note-editor"
import { WorkspaceHome } from "@/pages/workspace"

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 font-semibold tracking-tight ${light ? "text-white" : "text-foreground"}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Layers3 className="size-5" />
      </span>
      <span className="text-[17px]">folio<span className="text-primary">.</span></span>
    </Link>
  )
}

function AuthLayout({ children, mode }: { children: ReactNode; mode: "signin" | "signup" }) {
  return (
    <main className="min-h-svh bg-[#f7f7f5] lg:grid lg:grid-cols-[1fr_0.9fr]">
      <section className="relative hidden min-h-svh overflow-hidden bg-[#17172c] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-32 -top-36 size-[34rem] rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute -bottom-48 -left-32 size-[32rem] rounded-full bg-indigo-500/20 blur-[110px]" />
        <div className="relative"><Brand light /></div>
        <div className="relative max-w-xl pb-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-white/75">
            <Sparkles className="size-3.5 text-violet-300" /> A calmer way to create together
          </div>
          <h1 className="text-5xl leading-[1.08] font-medium tracking-[-0.055em] xl:text-6xl">Make room for<br />your best work.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/55">Bring your team and your ideas into one thoughtful workspace. Write, share, and move forward together.</p>
          <div className="mt-12 grid max-w-lg grid-cols-3 gap-3">
            {[
              { icon: FileText, label: "Shared docs" },
              { icon: Users, label: "In sync" },
              { icon: LockKeyhole, label: "Private by design" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-4">
                <Icon className="mb-3 size-4 text-violet-300" />
                <p className="text-xs text-white/65">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center justify-between text-xs text-white/35"><span>© 2025 Folio Workspace</span><span>Thoughtful work, together.</span></div>
      </section>

      <section className="flex min-h-svh flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden"><Brand /></div>
          <p className="text-sm text-muted-foreground">{mode === "signin" ? "New to Folio?" : "Already have an account?"} <Link className="font-semibold text-foreground underline-offset-4 hover:underline" to={mode === "signin" ? "/signup" : "/signin"}>{mode === "signin" ? "Create account" : "Sign in"}</Link></p>
        </header>
        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-12">{children}</div>
        <footer className="flex items-center justify-between text-xs text-muted-foreground"><span>© 2025 Folio</span><div className="flex gap-5"><a href="#privacy" className="hover:text-foreground">Privacy</a><a href="#terms" className="hover:text-foreground">Terms</a></div></footer>
      </section>
    </main>
  )
}

function friendlyError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") return payload.message
  return fallback
}

async function readError(response: Response, fallback: string) {
  try { return friendlyError(await response.json(), fallback) } catch { return fallback }
}

function SignInPage() {
  const { token, signIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const notice = (location.state as { notice?: string } | null)?.notice

  if (token) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (!response.ok) throw new Error(await readError(response, "We couldn't sign you in. Check your details and try again."))
      const data = await response.json() as { token?: string }
      if (!data.token) throw new Error("The server did not return an authentication token.")

      const health = await fetch(`${API_BASE}/`, { headers: { Authorization: `Bearer ${data.token}` } })
      if (!health.ok) throw new Error(await readError(health, "We couldn't verify your session. Please try again."))
      signIn(data.token)
      navigate("/", { replace: true })
    } catch (cause) {
      setError(cause instanceof TypeError ? "Can't reach Folio right now. Make sure the server is running on port 8080." : cause instanceof Error ? cause.message : "Something went wrong. Please try again.")
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout mode="signin">
      <div className="mb-8">
        <p className="mb-3 text-sm font-medium text-primary">Welcome back</p>
        <h2 className="text-3xl font-semibold tracking-[-0.045em]">Sign in to your account</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Pick up right where you left off.</p>
      </div>
      <Card className="border-border/70 bg-white shadow-[0_18px_55px_-38px_rgba(34,31,68,0.28)]">
        <CardHeader className="sr-only"><CardTitle>Sign in</CardTitle><CardDescription>Enter your account details</CardDescription></CardHeader>
        <CardContent className="p-6 sm:p-7">
          {notice && <Alert className="mb-5 border-emerald-200 bg-emerald-50 text-emerald-900"><AlertDescription>{notice}</AlertDescription></Alert>}
          {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="signin-email">Email address</Label><div className="relative"><Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="signin-email" type="email" autoComplete="email" placeholder="you@example.com" className="h-11 pl-10" value={email} onChange={event => setEmail(event.target.value)} required /></div></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="signin-password">Password</Label><a href="#forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</a></div><div className="relative"><LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="signin-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="h-11 pr-11 pl-10" value={password} onChange={event => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
            <Button type="submit" size="lg" className="h-11 w-full gap-2" disabled={loading}>{loading ? "Signing in…" : <>Sign in <ArrowRight className="size-4" /></>}</Button>
          </form>
          <div className="my-6 flex items-center gap-3"><Separator className="flex-1" /><span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">A better way to work</span><Separator className="flex-1" /></div>
          <p className="text-center text-xs leading-5 text-muted-foreground">By continuing, you agree to our <a href="#terms" className="text-foreground underline underline-offset-2">Terms of Service</a> and <a href="#privacy" className="text-foreground underline underline-offset-2">Privacy Policy</a>.</p>
        </CardContent>
      </Card>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" /> Your workspace is private and secure</p>
    </AuthLayout>
  )
}

function SignUpPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      })
      if (!response.ok) throw new Error(await readError(response, "We couldn't create your account. Please try again."))
      navigate("/signin", { replace: true, state: { notice: "Your account is ready. Sign in to open your workspace." } })
    } catch (cause) {
      setError(cause instanceof TypeError ? "Can't reach Folio right now. Make sure the server is running on port 8080." : cause instanceof Error ? cause.message : "Something went wrong. Please try again.")
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout mode="signup">
      <div className="mb-8">
        <p className="mb-3 text-sm font-medium text-primary">Start collaborating</p>
        <h2 className="text-3xl font-semibold tracking-[-0.045em]">Create your account</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">A little space for big ideas. Get started for free.</p>
      </div>
      <Card className="border-border/70 bg-white shadow-[0_18px_55px_-38px_rgba(34,31,68,0.28)]">
        <CardHeader className="sr-only"><CardTitle>Create an account</CardTitle><CardDescription>Enter your details to join Folio</CardDescription></CardHeader>
        <CardContent className="p-6 sm:p-7">
          {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="signup-name">Your name</Label><Input id="signup-name" autoComplete="name" placeholder="Alex Morgan" className="h-11" value={username} onChange={event => setUsername(event.target.value)} required minLength={2} /></div>
            <div className="space-y-2"><Label htmlFor="signup-email">Email address</Label><div className="relative"><Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" className="h-11 pl-10" value={email} onChange={event => setEmail(event.target.value)} required /></div></div>
            <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="signup-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" className="h-11 pr-11 pl-10" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div><p className="text-xs text-muted-foreground">Use at least 8 characters.</p></div>
            <Button type="submit" size="lg" className="mt-2 h-11 w-full gap-2" disabled={loading}>{loading ? "Creating account…" : <>Create account <ArrowRight className="size-4" /></>}</Button>
          </form>
          <div className="my-5 flex items-center gap-3"><Separator className="flex-1" /><span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Made for teams</span><Separator className="flex-1" /></div>
          <ul className="space-y-2 text-xs text-muted-foreground"><li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" />Keep every project in one shared space</li><li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" />Invite your team whenever you&apos;re ready</li></ul>
        </CardContent>
      </Card>
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">By creating an account, you agree to our <a href="#terms" className="text-foreground underline underline-offset-2">Terms</a> and <a href="#privacy" className="text-foreground underline underline-offset-2">Privacy Policy</a>.</p>
    </AuthLayout>
  )
}

function AppRoutes() {
  return <Routes><Route path="/" element={<WorkspaceHome />} /><Route path="/notes/:noteId" element={<NoteEditor />} /><Route path="/signin" element={<SignInPage />} /><Route path="/signup" element={<SignUpPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>
}

export function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>
}

export default App
