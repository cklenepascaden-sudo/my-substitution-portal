"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, AlertCircle, ShieldCheck, User, UserCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// 1. Validation Schema
const authSchema = z.object({
  email: z.string().email({ message: "Enter a valid school email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  fullName: z.string().min(2, { message: "Full name is required for registration." }).optional(),
})

type FormData = z.infer<typeof authSchema>

export default function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isAdminMode, setIsAdminMode] = React.useState(false)
  const [isSignUp, setIsSignUp] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(authSchema),
  })

  // 2. Main Submit Logic
  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)
    setMessage(null)
    const supabase = createClient()

    try {
      if (isSignUp) {
        // --- INSTANT SIGN UP (No Email Confirmation) ---
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role: 'teacher', // New accounts default to teacher
            },
          },
        })

        if (signUpError) throw signUpError

        // If auto-confirm is on, Supabase returns a session immediately
        if (signUpData.session) {
          setMessage("Account created successfully! Redirecting...")
          setTimeout(() => {
            window.location.href = "/teacher"
          }, 1500)
        } else {
          setMessage("Account created! You can now sign in.")
          setIsSignUp(false)
          reset()
        }

      } else {
        // --- LOGIN LOGIC ---
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

        if (authError) throw authError

        // Fetch user profile to check role
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (pError || !profile) throw new Error("Could not retrieve user profile.")

        // Access Guard: Ensure Admin toggle matches Database Role
        if (isAdminMode && profile.role !== 'admin') {
          await supabase.auth.signOut()
          throw new Error("Access Denied: You do not have Administrator privileges.")
        }

        // --- FINAL REDIRECT ---
        // Using window.location.href to ensure the Auth state is fresh across the app
        if (profile.role === 'admin') {
          window.location.href = "/admin"
        } else {
          window.location.href = "/teacher"
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {isSignUp ? "Join BCNSHS" : isAdminMode ? "Admin Access" : "Faculty Login"}
        </h1>
        <p className="text-slate-500">
          {isSignUp ? "Create your account for the substitution portal" : "Manage your classes and cover requests"}
        </p>
      </div>

      {/* Mode Toggle (Only for Login) */}
      {!isSignUp && (
        <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => { setIsAdminMode(false); setError(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all",
              !isAdminMode ? "bg-white shadow-md text-blue-600" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <User size={18} /> Teacher
          </button>
          <button
            type="button"
            onClick={() => { setIsAdminMode(true); setError(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all",
              isAdminMode ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ShieldCheck size={18} /> Admin
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isSignUp && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
            <input
              {...register("fullName")}
              type="text"
              placeholder="e.g. Jhet Tacalig"
              className={cn(
                "w-full h-12 rounded-xl border bg-slate-50 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none",
                errors.fullName ? "border-red-500" : "border-slate-200"
              )}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
          <input
            {...register("email")}
            type="email"
            placeholder="name@school.edu"
            className={cn(
              "w-full h-12 rounded-xl border bg-slate-50 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none",
              errors.email ? "border-red-500" : "border-slate-200"
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className={cn(
              "w-full h-12 rounded-xl border bg-slate-50 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none",
              errors.password ? "border-red-500" : "border-slate-200"
            )}
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {message && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700 text-sm">
            <UserCheck size={18} className="shrink-0" />
            <p className="font-medium">{message}</p>
          </div>
        )}

        <button
          disabled={isLoading}
          className={cn(
            "w-full h-12 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-2",
            isAdminMode ? "bg-slate-900 hover:bg-black" : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" size={24} />
          ) : (
            isSignUp ? "Create Account" : isAdminMode ? "Admin Login" : "Teacher Login"
          )}
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setIsAdminMode(false);
            setError(null);
            setMessage(null);
            reset();
          }}
          className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          {isSignUp ? "Already have an account? Log In" : "New here? Register as Faculty"}
        </button>
      </div>
    </div>
  )
}