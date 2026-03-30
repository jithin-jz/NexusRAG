import React, { useEffect, useState, useRef } from 'react'
import { Zap, RefreshCw, ShieldCheck, ArrowRight, Fingerprint } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useDispatch, useSelector } from 'react-redux'
import { setSession, devLogin, setAuthConfig } from './authSlice'
import { API_BASE } from '../../services/api'
import { Badge } from '@/components/ui/badge'

export function AuthScreen() {
  const dispatch = useDispatch()
  const { config: authConfig } = useSelector((state) => state.auth)
  const [tempEmail, setTempEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const gInitRef = useRef(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/config`)
      .then((res) => res.json())
      .then((config) => dispatch(setAuthConfig(config)))
  }, [dispatch])

  useEffect(() => {
    if (authConfig?.google_client_id && window.google && !gInitRef.current) {
      gInitRef.current = true
      window.google.accounts.id.initialize({
        client_id: authConfig.google_client_id,
        callback: async (response) => {
          try {
            const res = await fetch(`${API_BASE}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            })
            const data = await res.json()
            if (res.ok) dispatch(setSession(data.session_token))
          } catch (e) {
            console.error(e)
          }
        },
      })
      window.google.accounts.id.renderButton(document.getElementById('google-btn'), {
        theme: 'outline',
        size: 'large',
        width: 340,
        shape: 'pill',
      })
    }
  }, [authConfig, dispatch])

  async function handleDevLogin(e) {
    if (e) e.preventDefault()
    if (!tempEmail || loading) return
    setLoading(true)
    await dispatch(devLogin(tempEmail))
    setLoading(false)
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 overflow-hidden relative selection:bg-lumina-primary/10">
      <div className="z-10 w-full max-w-sm px-6 animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10 group">
          <div className="h-16 w-16 rounded-[1.5rem] bg-lumina-primary text-white flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-lumina-primary/30 group-hover:scale-110 transition-all duration-500">
            <Zap className="h-8 w-8 fill-current" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-slate-900 uppercase tracking-widest">
            NexusRAG
          </h1>
          <div className="flex items-center justify-center gap-3">
            <Badge
              variant="outline"
              className="border-slate-200 text-[10px] uppercase font-black tracking-widest text-slate-400 bg-white px-3 py-0.5"
            >
              Neural_Core
            </Badge>
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="p-10 rounded-[3rem] border border-slate-200 bg-white shadow-2xl relative overflow-hidden group/card shadow-slate-200/50">
          <div className="space-y-8 relative z-10">
            <div id="google-btn" className="flex justify-center" />

            {authConfig?.allow_dev_auth && (
              <div className="space-y-8">
                <div className="relative py-2 flex items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                    Auth_Override
                  </span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <form onSubmit={handleDevLogin} className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-1">
                      <Fingerprint className="h-3.5 w-3.5 text-lumina-primary/40" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">
                        Access Identifier
                      </Label>
                    </div>
                    <Input
                      placeholder="admin@nexusrag.core"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="h-14 bg-slate-50 border-slate-200 rounded-2xl focus:border-lumina-primary/30 focus:bg-white text-sm font-bold shadow-inner px-5 transition-all outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !tempEmail}
                    className="w-full h-16 bg-lumina-primary text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-lumina-primary/20 flex items-center justify-center gap-4 disabled:opacity-30"
                  >
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        <span>Enter Stream</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 h-32 w-32 bg-lumina-primary/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-0 group-hover/card:opacity-100 transition-all duration-700" />
        </div>

        <div className="mt-10 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
              Secure Link
            </p>
          </div>
          <div className="h-1 w-1 rounded-full bg-slate-200" />
          <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] leading-none">
            v0.4.2 LUMINA
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-white to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 h-64 w-64 bg-lumina-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-indigo-50/50 rounded-full blur-3xl opacity-40 pointer-events-none" />
    </div>
  )
}
