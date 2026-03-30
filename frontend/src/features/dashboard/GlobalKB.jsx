import React from 'react'
import { FileText, ArrowRight, Zap, ShieldCheck, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function GlobalKB({ bots, onSelectBot }) {
  const allDocs = bots.flatMap(
    (b) =>
      b.documents?.map((d) => ({
        ...d,
        botName: b.name,
        botId: b.id,
        color: b.theme?.primaryColor || '#4f46e5',
      })) || [],
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 xl:gap-8">
        {allDocs.map((doc, i) => (
          <div
            key={i}
            className="group relative p-6 xl:p-8 rounded-[2rem] xl:rounded-[2.5rem] border border-slate-200 bg-white hover:border-lumina-primary/30 transition-all duration-700 hover:shadow-2xl hover:shadow-lumina-primary/5 hover:-translate-y-1.5 overflow-hidden"
          >
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 xl:mb-8">
                <div className="h-12 w-12 xl:h-14 xl:w-14 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 group-hover:scale-110 shadow-sm transition-all">
                  <FileText className="h-6 w-6 xl:h-7 xl:w-7 group-hover:text-lumina-primary transition-colors" />
                </div>
                <Badge
                  variant="outline"
                  className="border-slate-100 text-[8px] uppercase font-black tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5"
                >
                  V_IDX
                </Badge>
              </div>

              <div className="space-y-3 xl:space-y-4 mb-8 xl:mb-10">
                <h3 className="line-clamp-2 text-sm font-black text-slate-900 tracking-tight leading-snug group-hover:text-lumina-primary transition-colors pr-2">
                  {doc.original_name}
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className="h-4.5 w-4.5 rounded-lg flex items-center justify-center shadow-lg shadow-lumina-primary/10 shrink-0"
                    style={{ backgroundColor: doc.color }}
                  >
                    <Zap className="h-2.5 w-2.5 text-white fill-current" />
                  </div>
                  <p className="text-[9px] xl:text-[10px] font-black uppercase tracking-widest text-slate-400 truncate pr-4">
                    {doc.botName}
                  </p>
                  <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 xl:pt-6 border-t border-slate-50 relative group/link mt-auto">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[8px] xl:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    LAYER_SECURE
                  </span>
                </div>
                <button
                  onClick={() => onSelectBot(doc.botId)}
                  className="h-9 w-9 xl:h-10 xl:w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-lumina-primary hover:text-white transition-all shadow-sm group-hover/link:scale-105"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Background blur elements */}
            <div className="absolute top-0 right-0 h-32 w-32 bg-slate-50/40 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700 blur-3xl opacity-50" />
          </div>
        ))}
        {allDocs.length === 0 && (
          <div className="col-span-full py-24 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/20 flex flex-col items-center justify-center shadow-inner group">
            <div className="h-20 w-20 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-all duration-700">
              <Database className="h-8 w-8 text-slate-200" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
              Repository Null State
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
