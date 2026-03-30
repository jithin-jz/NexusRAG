import React from 'react'

export function StatCard({ label, value, icon, color = 'indigo' }) {
  const colors = {
    indigo:
      'from-indigo-600 to-indigo-700 shadow-indigo-600/20 text-indigo-100 bg-indigo-50 border-indigo-100',
    emerald:
      'from-emerald-600 to-emerald-700 shadow-emerald-600/20 text-emerald-100 bg-emerald-50 border-emerald-100',
    rose: 'from-rose-600 to-rose-700 shadow-rose-600/20 text-rose-100 bg-rose-50 border-rose-100',
    slate:
      'from-slate-600 to-slate-700 shadow-slate-600/20 text-slate-100 bg-slate-50 border-slate-100',
  }

  const selectedColor = colors[color] || colors.slate

  return (
    <div className="relative group p-6 xl:p-8 rounded-[2rem] bg-white border border-slate-200 overflow-hidden shadow-sm hover:border-slate-300 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-6 xl:mb-8 relative z-10">
        <div
          className={`h-12 w-12 xl:h-14 xl:w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${selectedColor} transition-transform group-hover:scale-110 shadow-xl`}
        >
          {React.cloneElement(icon, {
            className: 'h-6 w-6 xl:h-7 xl:w-7 text-white fill-current/10',
          })}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none group-hover:scale-105 transition-transform origin-right">
            {value}
          </span>
          <div className="h-1 w-10 xl:w-12 bg-slate-100 rounded-full mt-2.5 xl:mt-3 group-hover:bg-slate-200 transition-colors" />
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-[9px] xl:text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-slate-500 transition-colors">
          {label}
        </h3>
      </div>
      <div className="absolute top-0 right-0 h-32 w-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 blur-2xl opacity-50" />
    </div>
  )
}
