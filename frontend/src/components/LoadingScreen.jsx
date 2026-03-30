import React from 'react'
import { Zap, RefreshCw } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="z-10 animate-in zoom-in-95 duration-500 flex flex-col items-center">
        <div className="relative group mb-10 h-24 w-24 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center shadow-xl shadow-slate-200/50 hover:scale-105 transition-all">
          <Zap className="h-10 w-10 text-lumina-primary fill-current transition-colors" />
          <div className="absolute inset-0 rounded-[2rem] border-2 border-lumina-primary/10 border-t-lumina-primary animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-[0.2em] leading-none">
            Neural Handshake
          </h3>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-400">
              Synchronizing Data Streams
            </p>
          </div>
        </div>
      </div>
      <div className="absolute top-1/3 left-1/4 h-64 w-64 bg-lumina-primary/5 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-indigo-50/50 rounded-full blur-3xl opacity-40" />
      <p className="absolute bottom-12 text-[9px] font-black uppercase tracking-[0.8em] text-slate-200">
        v4.2.Lumina Core
      </p>
    </div>
  )
}
