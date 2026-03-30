import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Zap, Send, ShieldCheck, RefreshCw } from 'lucide-react'
import { LoadingScreen } from '../../components/LoadingScreen'
import { API_BASE } from '../../services/api'
import { Badge } from '@/components/ui/badge'

export function PublicBotView() {
  const { slug } = useParams()
  const [bot, setBot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const scrollRef = useRef()

  useEffect(() => {
    fetch(`${API_BASE}/api/public/bots/${slug}/config`)
      .then((res) => res.json())
      .then((data) => {
        setBot(data)
        setMessages([
          {
            role: 'bot',
            text: data.theme?.welcomeMessage || 'Establishing neural link... Transmit your query.',
          },
        ])
      })
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend(e) {
    if (e) e.preventDefault()
    if (!input.trim() || chatLoading) return
    const msg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/public/bots/${bot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: msg }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Error in transmission.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (!bot)
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden p-6 text-center">
        <div className="z-10 animate-in zoom-in-95 duration-500">
          <div className="h-20 w-20 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center mx-auto mb-8 shadow-xl">
            <ShieldCheck className="h-10 w-10 text-rose-500/20" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4 uppercase tracking-[0.2em]">
            Link Severed
          </h1>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
            The requested neural unit is no longer broadcasting on this global endpoint.
          </p>
        </div>
        <div className="absolute top-0 right-0 h-96 w-96 bg-rose-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20" />
      </div>
    )

  const theme = bot.theme || {}
  const primaryColor = theme.primaryColor || '#4f46e5'

  return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-0 sm:p-4 lg:p-12 overflow-hidden selection:bg-slate-200">
      <div className="w-full max-w-2xl h-full flex flex-col bg-white sm:border sm:border-slate-200 sm:rounded-[3rem] overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <header
          className="p-8 lg:p-10 border-b border-slate-100 flex items-center justify-between relative overflow-hidden"
          style={{ background: primaryColor + '05' }}
        >
          <div className="flex items-center gap-6 relative z-10">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-200/50"
              style={{ backgroundColor: primaryColor }}
            >
              <Zap className="h-7 w-7 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{bot.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 0 8px ${primaryColor}` }}
                />
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  System Online_Pulse
                </p>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-slate-200 text-[9px] uppercase font-black tracking-widest text-slate-400 bg-white px-3 py-1 relative z-10 sm:flex hidden"
          >
            v4.2.Lumina
          </Badge>
          <div
            className="absolute top-0 right-0 h-40 w-40 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"
            style={{ backgroundColor: primaryColor + '10' }}
          />
        </header>

        {/* Chat Feed */}
        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 lg:p-10 flex flex-col gap-6 no-scrollbar custom-scrollbar bg-slate-50/20"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] flex flex-col ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`p-5 rounded-[2.5rem] text-[13px] leading-relaxed shadow-sm border ${
                  m.role === 'user'
                    ? 'text-white border-transparent'
                    : 'bg-white text-slate-700 border-slate-100'
                }`}
                style={
                  m.role === 'user'
                    ? { backgroundColor: primaryColor, borderRadius: '2rem 0.5rem 2rem 2rem' }
                    : { borderRadius: '0.5rem 2rem 2rem 2rem' }
                }
              >
                {m.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="self-start animate-in fade-in duration-300">
              <div className="p-3 flex gap-2 items-center bg-white border border-slate-100 rounded-2xl shadow-sm">
                <span className="h-1.5 w-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0s]" />
                <span className="h-1.5 w-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </main>

        {/* Footer Input */}
        <footer className="p-8 lg:p-10 border-t border-slate-100 bg-white shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSend} className="flex gap-4 relative group">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={theme.placeholder || 'Inquire the agent...'}
              className="flex-1 h-16 bg-slate-50 rounded-2xl border border-slate-200 px-8 outline-none focus:border-slate-300 focus:bg-white text-sm font-bold text-slate-900 transition-all shadow-inner placeholder:text-slate-300 ring-0"
            />
            <button
              type="submit"
              disabled={chatLoading || !input.trim()}
              className="h-16 w-16 min-w-[64px] rounded-2xl text-white transition-all shadow-2xl active:scale-90 flex items-center justify-center disabled:opacity-20"
              style={
                input.trim()
                  ? {
                      backgroundColor: primaryColor,
                      boxShadow: `0 12px 24px -6px ${primaryColor}40`,
                    }
                  : { backgroundColor: '#f1f5f9', color: '#cbd5e1' }
              }
            >
              {chatLoading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <Send className="h-6 w-6" />
              )}
            </button>
          </form>
          <div className="mt-8 flex items-center justify-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
            <div className="h-[1px] w-8 bg-slate-100" />
            <span>Neural Engineering by NexusRAG</span>
            <div className="h-[1px] w-8 bg-slate-100" />
          </div>
        </footer>
      </div>
      <div className="absolute top-0 left-0 h-screen w-screen overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-1/4 h-96 w-96 bg-lumina-primary/5 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-1/4 h-[500px] w-[500px] bg-slate-100/50 rounded-full blur-3xl opacity-60" />
      </div>
    </div>
  )
}
