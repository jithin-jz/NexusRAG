import React, { useState, useEffect, useRef } from 'react'
import { Send, Zap, Maximize2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { fetchWithAuth } from '../../services/api'

export function ChatTester({ bot }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Diagnostic link established. I can analyze and retrieve data from your active knowledge base. What is our objective today?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend(e) {
    if (e) e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetchWithAuth(`/api/bots/${bot.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question: userMsg }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'bot', text: data.reply || 'No response.' }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Error establishing neural link. Check backend state.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const primaryColor = bot.theme?.primaryColor || '#4f46e5'

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
            Neural Sandbox
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-slate-100 text-[9px] uppercase tracking-widest text-slate-400 font-black px-2 py-0.5"
          >
            v4.2.Lumina
          </Badge>
          <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 bg-slate-50/30 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar overflow-x-hidden"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] flex flex-col ${m.role === 'user' ? 'self-end items-end' : 'self-start items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            {m.role === 'bot' && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div
                  className="h-4 w-4 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Zap className="h-2.5 w-2.5 fill-current" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Response Unit
                </span>
              </div>
            )}
            <div
              className={`p-4 rounded-2xl text-[12px] leading-relaxed font-medium shadow-sm border ${
                m.role === 'user'
                  ? 'text-white border-transparent'
                  : 'bg-white text-slate-700 border-slate-100'
              }`}
              style={m.role === 'user' ? { backgroundColor: primaryColor } : {}}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="self-start">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div
                className="h-4 w-4 rounded-md flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Zap className="h-2.5 w-2.5 fill-current" />
              </div>
            </div>
            <div className="p-3 flex gap-1.5 items-center bg-white border border-slate-100 rounded-2xl shadow-sm">
              <span className="h-1.5 w-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0s]" />
              <span className="h-1.5 w-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-5 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="flex gap-3 relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Inquire the agent..."
            className="flex-1 h-12 bg-slate-50 rounded-xl border border-slate-200 px-5 outline-none focus:border-slate-300 focus:bg-white text-[12px] font-black text-slate-900 transition-all shadow-inner placeholder:text-slate-300"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              input.trim() ? 'text-white' : 'bg-slate-50 text-slate-300'
            }`}
            style={
              input.trim()
                ? { backgroundColor: primaryColor, boxShadow: `0 8px 16px -4px ${primaryColor}40` }
                : {}
            }
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
        <p className="text-[9px] font-black uppercase text-center mt-4 text-slate-300 tracking-[0.4em] leading-none">
          Powered by NexusRAG Core
        </p>
      </div>

      <div className="absolute top-0 right-0 h-40 w-40 bg-lumina-primary/5 rounded-full -mr-20 -mt-20 blur-3xl opacity-30 pointer-events-none" />
    </div>
  )
}
