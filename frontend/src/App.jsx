import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUser } from './features/auth/authSlice'
import { fetchBots, setSelectedBotId } from './features/bots/botSlice'

// Components & Layouts
import { DashboardLayout } from './layouts/DashboardLayout'
import { AuthScreen } from './features/auth/AuthScreen'
import { LoadingScreen } from './components/LoadingScreen'
import { PublicBotView } from './pages/public/PublicBotView'
import { BotEditor } from './features/bots/BotEditor'
import { ChatTester } from './features/chat/ChatTester'
import { GlobalKB } from './features/dashboard/GlobalKB'
import { StatCard } from './components/StatCard'
import { CreateAgentModal } from './features/bots/CreateAgentModal'

// Icons
import { Zap, Database, Activity, LayoutDashboard, Search, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/p/:slug" element={<PublicBotView />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardRoutes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

function AuthPage() {
  const { session } = useSelector((state) => state.auth)
  if (session) return <Navigate to="/" />
  return <AuthScreen />
}

function ProtectedRoute({ children }) {
  const dispatch = useDispatch()
  const { session, user, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    if (session && !user) {
      dispatch(fetchUser())
    }
  }, [session, user, dispatch])

  if (!session) return <Navigate to="/auth" />
  if (loading) return <LoadingScreen />
  return children
}

function DashboardRoutes() {
  const dispatch = useDispatch()
  const { list: bots, selectedId: selectedBotId } = useSelector((state) => state.bots)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    dispatch(fetchBots())
  }, [dispatch])

  const selectedBot = bots.find((b) => b.id === selectedBotId)

  return (
    <DashboardLayout onCreateAgent={() => setShowCreateModal(true)}>
      <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-white/40 backdrop-blur-3xl">
        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden relative border-r border-slate-200/50">
          {/* Breadcrumbs / Status Bar */}
          <div className="h-10 flex shrink-0 items-center px-4 lg:px-10 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-100 bg-white/50 backdrop-blur-md">
            {selectedBot ? `NEURAL_GATE / ${selectedBot.slug} /` : 'TOTAL_SYSTEM_OVERVIEW /'}
          </div>

          <section className="flex-1 overflow-y-auto custom-scrollbar p-5 lg:p-10">
            {!selectedBotId ? (
              <div className="max-w-7xl mx-auto flex flex-col gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 mb-2">
                      Neural Workspace
                    </h1>
                    <p className="text-xs font-medium text-slate-500 max-w-lg">
                      Orchestrate and coordinate your distributed intelligence agents with Lumina
                      precision.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 transition-colors group-focus-within:text-lumina-primary" />
                      <input
                        placeholder="Find neural unit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-0 focus:border-lumina-primary/30 focus:bg-white transition-all w-[240px] shadow-sm"
                      />
                    </div>
                    <button className="h-11 w-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                      <Filter className="h-4 w-4" />
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard
                    label="Active Entities"
                    value={bots.length}
                    icon={<Zap />}
                    color="emerald"
                  />
                  <StatCard
                    label="Knowledge Layers"
                    value={bots.reduce((a, b) => a + (b.documents?.length || 0), 0)}
                    icon={<Database />}
                    color="indigo"
                  />
                  <StatCard label="Stream Density" value="98.2%" icon={<Activity />} color="rose" />
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="h-4 w-4 text-lumina-primary" />
                      <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                        Knowledge Persistence Stream
                      </h2>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[8px] border-slate-200 text-slate-400 tracking-widest uppercase"
                    >
                      Global Repo
                    </Badge>
                  </div>
                  <GlobalKB bots={bots} onSelectBot={(id) => dispatch(setSelectedBotId(id))} />
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto h-full">
                <BotEditor botId={selectedBotId} />
              </div>
            )}
          </section>
        </main>

        {/* Persistent Chat Sandbox (Docked Right) */}
        {selectedBot && (
          <aside className="w-full lg:w-[420px] h-[50vh] lg:h-auto shrink-0 border-t lg:border-t-0 bg-white/80 backdrop-blur-xl flex flex-col animate-in lg:slide-in-from-right-4 slide-in-from-bottom-4 duration-500">
            <ChatTester bot={selectedBot} />
          </aside>
        )}
      </div>

      {showCreateModal && (
        <CreateAgentModal
          onClose={() => setShowCreateModal(false)}
          onRefresh={() => dispatch(fetchBots())}
        />
      )}
    </DashboardLayout>
  )
}
