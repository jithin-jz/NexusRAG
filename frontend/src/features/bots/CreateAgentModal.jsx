import React, { useState } from 'react'
import { Plus, RefreshCw, Zap, ShieldCheck, Database, Target } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { fetchWithAuth } from '../../services/api'
import { Badge } from '@/components/ui/badge'

export function CreateAgentModal({ onClose, onRefresh }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    if (e) e.preventDefault()
    if (!name || loading) return

    setLoading(true)
    try {
      const res = await fetchWithAuth(`/api/bots`, {
        method: 'POST',
        body: JSON.stringify({ name, description: desc }),
      })
      if (res.ok) {
        onRefresh()
        onClose()
      }
    } catch {
      console.error('Creation fault detected.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 relative">
        <header className="p-8 lg:p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50 relative overflow-hidden shrink-0">
          <div className="flex items-center gap-6 relative z-10">
            <div className="h-16 w-16 rounded-[1.5rem] bg-lumina-primary text-white flex items-center justify-center shadow-2xl shadow-lumina-primary/30">
              <Plus className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Instantiate Neural Nexus
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest leading-none">
                Initialization Protocol v4.2.Lumina
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-12 w-12 rounded-2xl flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-white transition-all shadow-sm relative z-10 border border-transparent hover:border-slate-100"
          >
            <Plus className="h-6 w-6 rotate-45" />
          </button>
          <div className="absolute top-0 right-0 h-40 w-40 bg-lumina-primary/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 pointer-events-none" />
        </header>

        <form onSubmit={handleCreate} className="p-8 lg:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Database className="h-4 w-4 text-lumina-primary" />
                <Label className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-400">
                  Neural Identifier
                </Label>
              </div>
              <Input
                placeholder="Product Intelligence"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 bg-slate-50 border-slate-200 rounded-2xl focus:border-lumina-primary/30 focus:bg-white text-sm font-bold shadow-inner px-5 transition-all outline-none"
                autoFocus
              />
              <p className="text-[9px] font-medium text-slate-300 uppercase tracking-widest px-2">
                Unique unit designation for global index
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-4 w-4 text-lumina-primary" />
                <Label className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-400">
                  Mission Parameters
                </Label>
              </div>
              <textarea
                placeholder="Awaiting primary mission objective..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-5 outline-none focus:border-lumina-primary/30 focus:bg-white text-sm font-bold shadow-inner transition-all resize-none placeholder:text-slate-200"
              />
              <div className="flex items-center justify-between px-2">
                <p className="text-[9px] font-medium text-slate-300 uppercase tracking-widest leading-none">
                  Defined core capabilities
                </p>
                <Badge
                  variant="outline"
                  className="text-[8px] border-slate-100 text-slate-300 tracking-widest uppercase px-1.5 py-0"
                >
                  Optional
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-1 items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">
                  Security Check_OK
                </p>
                <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">
                  Authorized Transmission
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name}
              className="w-full sm:w-auto min-w-[240px] h-16 bg-lumina-primary text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl hover:scale-[1.02] active:scale-95 shadow-2xl shadow-lumina-primary/30 disabled:opacity-30 transition-all flex items-center justify-center gap-4"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                <>
                  <span>Instantiate Unit</span>
                  <Zap className="h-4 w-4 fill-current/10" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
