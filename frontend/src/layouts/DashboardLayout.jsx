import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Zap, LayoutDashboard, ChevronRight, Plus, LogOut, Menu, X } from 'lucide-react'
import { setSelectedBotId } from '../features/bots/botSlice'
import { logout } from '../features/auth/authSlice'

export function DashboardLayout({ children, onCreateAgent }) {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { list: bots, selectedId: selectedBotId } = useSelector((state) => state.bots)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const selectedBot = bots.find((b) => b.id === selectedBotId)

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-lumina-bg text-lumina-text font-sans">
      {/* Top Navigation */}
      <nav className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-md z-50 shrink-0">
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Logo */}
          <div
            onClick={() => {
              dispatch(setSelectedBotId(null))
              setIsMobileMenuOpen(false)
            }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="h-9 w-9 rounded-xl bg-lumina-primary text-white flex items-center justify-center group-hover:scale-105 transition-all shadow-lg shadow-lumina-primary/20">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="text-sm font-black tracking-tighter hidden sm:block uppercase">
              NexusRAG
            </span>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => dispatch(setSelectedBotId(null))}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!selectedBotId ? 'bg-slate-100 text-lumina-primary' : 'text-slate-400 hover:text-lumina-primary hover:bg-slate-50'}`}
            >
              Overview
            </button>

            <div className="relative group/select">
              <button
                className={`flex items-center justify-between gap-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-w-[160px] border ${selectedBotId ? 'bg-white border-lumina-primary/20 text-lumina-primary shadow-sm' : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}
              >
                <span className="truncate">
                  {selectedBot ? selectedBot.name : 'Select Neural Hub'}
                </span>
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${selectedBotId ? 'rotate-90' : 'opacity-40'}`}
                />
              </button>

              <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover/select:opacity-100 group-hover/select:visible transition-all p-2 z-[60] premium-shadow">
                <div className="px-3 py-2 mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Available Nexus Units
                </div>
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto no-scrollbar">
                  {bots.length > 0 ? (
                    bots.map((bot) => (
                      <button
                        key={bot.id}
                        onClick={() => dispatch(setSelectedBotId(bot.id))}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all ${selectedBotId === bot.id ? 'bg-lumina-primary/5 text-lumina-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <span className="truncate">{bot.name}</span>
                        <div
                          className={`h-2 w-2 rounded-full ${bot.public_enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-200'}`}
                        />
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-[10px] text-slate-400 font-medium">
                      No units instantiated
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={onCreateAgent}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-lumina-primary hover:bg-lumina-primary/5 rounded-xl transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Instantiate New</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              Core Online
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="flex flex-col items-end hidden sm:flex">
                <p className="text-[10px] font-black text-slate-900 leading-none">{user.name}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-tighter mt-1">
                  {user.email.split('@')[0]}
                </p>
              </div>
              <div className="relative group/user">
                <img
                  src={user.picture}
                  className="h-9 w-9 rounded-xl border border-slate-200 hover:border-lumina-primary/30 transition-all cursor-pointer shadow-sm"
                  alt="U"
                />
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all p-1.5 z-[60] premium-shadow">
                  <div className="px-3 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[11px] font-black text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => dispatch(logout())}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <span>Disconnect Neural</span>
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-white border-b border-slate-200 z-[49] animate-in slide-in-from-top-4 duration-300 shadow-xl">
          <div className="p-4 flex flex-col gap-2">
            <button
              onClick={() => {
                dispatch(setSelectedBotId(null))
                setIsMobileMenuOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!selectedBotId ? 'bg-lumina-primary/5 text-lumina-primary' : 'text-slate-500'}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Suite Overview</span>
            </button>
            <div className="h-[1px] bg-slate-100 my-1" />
            <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
              Neural Agents
            </div>
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
              {bots.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => {
                    dispatch(setSelectedBotId(bot.id))
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-bold ${selectedBotId === bot.id ? 'bg-lumina-primary/5 text-lumina-primary' : 'text-slate-600'}`}
                >
                  <span>{bot.name}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                onCreateAgent()
                setIsMobileMenuOpen(false)
              }}
              className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-lumina-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-lumina-primary/20"
            >
              <Plus className="h-4 w-4" />
              <span>Instantiate New</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">{children}</div>
    </div>
  )
}
