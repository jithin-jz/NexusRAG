import React, { useEffect, useState, useRef, useCallback } from 'react'
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  Database, 
  Code, 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  LogOut, 
  Send,
  Upload,
  Globe,
  Settings2,
  CheckCircle2,
  RefreshCw,
  Palette,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Activity,
  Maximize2,
  Search,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const API_BASE = 'http://localhost:8000'

export default function App() {
  const [session, setSession] = useState(localStorage.getItem('session_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' or 'editor'
  const [selectedBotId, setSelectedBotId] = useState(null)
  const [bots, setBots] = useState([])

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${session}` }
      })
      if (res.ok) setUser(await res.json())
      else setSession(null)
    } finally {
      setLoading(false)
    }
  }, [session])

  const fetchBots = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bots`, {
        headers: { Authorization: `Bearer ${session}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBots(data.bots || [])
      }
    } catch(e) { console.error(e) }
  }, [session])

  // Auth initialization
  useEffect(() => {
    if (session) {
      localStorage.setItem('session_token', session)
      fetchUser()
      fetchBots()
    } else {
      localStorage.removeItem('session_token')
      setLoading(false)
    }
  }, [session, fetchUser, fetchBots])

  // Public view detection
  const path = window.location.pathname
  if (path.startsWith('/p/')) {
    const slug = path.split('/')[2]
    return <PublicBotView slug={slug} />
  }

  if (!session) return <AuthScreen setSession={setSession} />
  if (loading) return <LoadingScreen />

  const selectedBot = bots.find(b => b.id === selectedBotId)

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black text-white selection:bg-white/20 font-sans">
      {/* Top Navbar: Identity & Global Actions */}
      <nav className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-white/10 bg-black/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4 lg:gap-6">
          <div 
            onClick={() => setSelectedBotId(null)} 
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="h-8 w-8 rounded-md bg-white text-black flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-sm font-black tracking-tighter hidden sm:block">NexusRAG</span>
          </div>
          
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block mx-0 sm:mx-2" />
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedBotId(null)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all hidden md:block ${!selectedBotId ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              Suite Overview
            </button>
            <button 
              onClick={() => setSelectedBotId(null)}
              className={`p-1.5 rounded-md transition-all md:hidden ${!selectedBotId ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
            
            <div className="relative group/select">
              <button 
                className={`flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all max-w-[140px] sm:max-w-xs ${selectedBotId ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                <span className="truncate">{selectedBot ? selectedBot.name : 'Select Agent'}</span>
                <ChevronRight className="h-3 w-3 rotate-90 opacity-40 shrink-0" />
              </button>
              
              {/* Dropdown for Agents */}
              <div className="absolute top-full left-0 mt-2 w-64 bg-black border border-white/10 rounded-md shadow-2xl opacity-0 invisible group-hover/select:opacity-100 group-hover/select:visible transition-all p-2 z-[60]">
                <div className="px-3 py-2 mb-2 text-[9px] font-black uppercase tracking-widest text-white/20">Active Agents</div>
                <div className="flex flex-col gap-1 max-h-80 overflow-y-auto no-scrollbar">
                  {bots.map(bot => (
                    <button 
                      key={bot.id}
                      onClick={() => setSelectedBotId(bot.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold transition-all ${selectedBotId === bot.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                      <span className="truncate">{bot.name}</span>
                      <div className={`h-1.5 w-1.5 rounded-full ${bot.public_enabled ? 'bg-green-400' : 'bg-white/10'}`} />
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-white/10">
                   <button 
                     onClick={() => setView('create')}
                     className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                   >
                     <Plus className="h-3 w-3" />
                     <span>Instantiate New</span>
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-2 bg-white/5 px-2 py-1.5 rounded-md border border-white/10">
             <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
             <span className="text-[10px] font-black uppercase tracking-widest text-white/60">System Stable</span>
          </div>

          <div className="hidden lg:block h-4 w-[1px] bg-white/10 mx-0 sm:mx-2" />

          {user && (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                 <p className="text-[10px] font-black truncate leading-none">{user.name}</p>
                 <p className="text-[9px] text-white/20 truncate lowercase tracking-tighter">{user.email}</p>
              </div>
              <div className="relative group/user">
                <img 
                  src={user.picture} 
                  className="h-8 w-8 rounded-md border border-white/10 grayscale hover:grayscale-0 transition-all cursor-pointer" 
                  alt="U"
                />
                <div className="absolute top-full right-0 mt-2 w-48 bg-black border border-white/10 rounded-md shadow-2xl opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all p-1 z-[60]">
                   <button 
                     onClick={() => confirm('Disconnect neural link?') && setSession(null)}
                     className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
                   >
                     <span>Disconnect</span>
                     <LogOut className="h-3 w-3" />
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Primary Container: Content + Chat Tester */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Main Workspace */}
        <main className="flex-1 flex flex-col bg-black overflow-hidden relative">
          {/* Subtle Workspace Path Info */}
          <div className="h-10 flex shrink-0 items-center px-4 lg:px-8 text-[9px] font-black uppercase tracking-[0.4em] text-white/20 border-b border-white/5">
            {selectedBot ? `NEURAL_GATE / ${selectedBot.slug} /` : 'TOTAL_SYSTEM_OVERVIEW /'}
          </div>

          <section className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-12">
             {!selectedBot ? (
               <div className="max-w-6xl mx-auto flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <header>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">Neural Workspace</h1>
                    <p className="text-sm text-white/40 font-medium">Orchestrate and coordinate your distributed intelligence agents.</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <StatCard label="Total Entities" value={bots.length} icon={<Zap />} />
                     <StatCard label="Knowledge Layers" value={bots.reduce((a, b) => a + (b.documents?.length || 0), 0)} icon={<Database />} />
                     <StatCard label="Stream Density" value="98.2%" icon={<Activity />} />
                  </div>
                  
                  <div className="space-y-6">
                     <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Knowledge Persistence Stream</h2>
                     </div>
                     <GlobalKB bots={bots} onSelectBot={(id) => setSelectedBotId(id)} />
                  </div>
               </div>
             ) : (
               <div className="max-w-6xl mx-auto">
                 <BotEditor botId={selectedBotId} session={session} />
               </div>
             )}
          </section>
        </main>

        {/* Persistent Chat Sandbox (Docked Right) */}
        {selectedBot && (
          <aside className="w-full lg:w-[400px] h-[40vh] lg:h-auto shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-black flex flex-col animate-in lg:slide-in-from-right-2 slide-in-from-bottom-2 duration-300">
             <ChatTester bot={selectedBot} session={session} />
          </aside>
        )}
      </div>

      {/* Global Creation Modal */}
      {view === 'create' && (
        <CreateAgentModal onClose={() => setView('list')} onRefresh={fetchBots} session={session} />
      )}
    </div>
  )
}


function StatCard({ label, value, icon }) {
  return (
    <div className="p-6 rounded-lg border border-white/10 bg-black hover:border-white/20 transition-all">
       <div className="flex items-center justify-between mb-4">
          <div className="text-white/40">{React.cloneElement(icon, { className: 'h-4 w-4' })}</div>
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
       </div>
       <div className="text-2xl font-black tracking-tight mb-1">{value}</div>
       <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</div>
    </div>
  )
}


function AuthScreen({ setSession }) {
  const [tempEmail, setTempEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [authConfig, setAuthConfig] = useState(null)
  const gInitRef = useRef(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/config`)
      .then(res => res.json())
      .then(setAuthConfig)
  }, [])

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
              body: JSON.stringify({ credential: response.credential })
            })
            const data = await res.json()
            if (res.ok) setSession(data.session_token)
          } catch(e) { console.error(e) }
        }
      })
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: 340 }
      )
    }
  }, [authConfig, setSession])

  async function handleDevLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempEmail })
      })
      const data = await res.json()
      if (res.ok) setSession(data.session_token)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black overflow-hidden relative">
      <div className="z-10 w-full max-w-sm px-6">
        <div className="text-center mb-10">
           <Zap className="h-10 w-10 text-white mx-auto mb-6" />
           <h1 className="text-2xl font-black tracking-tight mb-2 text-white">NexusRAG</h1>
           <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Neural Intelligence Core</p>
        </div>

        <div className="p-8 rounded-lg border border-white/10 bg-black shadow-2xl">
          <div className="space-y-6">
            <div id="google-btn" className="flex justify-center" />
            
            {authConfig?.allow_dev_auth && (
              <>
                <div className="relative py-2 flex items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Developer Access</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <form onSubmit={handleDevLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Identifier</Label>
                    <Input 
                      placeholder="admin@nexusrag.core" 
                      value={tempEmail} 
                      onChange={e => setTempEmail(e.target.value)} 
                      className="h-11 bg-white/5 border-white/10 focus:border-white/20"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading || !tempEmail} 
                    className="w-full h-11 bg-white text-black text-xs font-black uppercase tracking-widest rounded-md hover:bg-white/90"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mx-auto text-black" /> : 'Enter System'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
        <p className="mt-8 text-center text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">Stable Alpha v0.4.2</p>
      </div>
    </div>
  )
}


function BotEditor({ botId, session }) {
  const [bot, setBot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [themePatch, setThemePatch] = useState({})
  const [activeTab, setActiveTab] = useState('knowledge')

  const fetchBot = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bots/${botId}`, {
        headers: { Authorization: `Bearer ${session}` }
      })
      const data = await res.ok ? await res.json() : null
      setBot(data)
    } finally {
      setLoading(false)
    }
  }, [botId, session])

  useEffect(() => {
    fetchBot()
  }, [botId, fetchBot])

  async function patchBot(fields) {
    try {
      const res = await fetch(`${API_BASE}/api/bots/${botId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`
        },
        body: JSON.stringify(fields)
      })
      if (res.ok) fetchBot()
    } catch(e) { console.error(e) }
  }

  async function updateTheme(patch) {
    try {
      const res = await fetch(`${API_BASE}/api/bots/${botId}/theme`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`
        },
        body: JSON.stringify(patch || themePatch)
      })
      if (res.ok) {
        fetchBot()
        setThemePatch({})
      }
    } catch(e) { console.error(e) }
  }

  if (loading || !bot) return null

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/10 pb-10">
        <div>
          <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">
             <div className={`h-2 w-2 rounded-full ${bot.public_enabled ? 'bg-green-400' : 'bg-white/10'}`} />
             <span>Agent Lifecycle: {bot.public_enabled ? 'Active' : 'Draft'}</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{bot.name}</h2>
          <p className="text-sm text-white/40 mt-1 font-mono tracking-tight">{bot.slug}</p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-md border border-white/10">
          <Label htmlFor="public-toggle" className="text-[9px] font-black uppercase tracking-widest text-white/30 px-2 leading-none">Global Deployment</Label>
          <div className="flex items-center h-8 gap-3 px-3 rounded-sm bg-black border border-white/5">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${!bot.public_enabled ? 'text-white' : 'text-white/20'}`}>Private</span>
            <Switch 
              id="public-toggle"
              checked={bot.public_enabled} 
              onCheckedChange={v => patchBot({ public_enabled: v })}
              className="scale-90 data-[state=checked]:bg-white"
            />
            <span className={`text-[9px] font-bold uppercase tracking-widest ${bot.public_enabled ? 'text-white' : 'text-white/20'}`}>Live</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        <div className="flex flex-col gap-8">
          <div className="w-full overflow-x-auto no-scrollbar pb-1">
            <div className="bg-white/5 p-1 rounded-md border border-white/10 inline-flex min-w-max">
              <TabTrigger active={activeTab === 'knowledge'} onClick={() => setActiveTab('knowledge')} icon={<Database className="h-4 w-4 shrink-0" />} label="Knowledge" />
              <TabTrigger active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={<Palette className="h-4 w-4 shrink-0" />} label="Design" />
              <TabTrigger active={activeTab === 'metadata'} onClick={() => setActiveTab('metadata')} icon={<Settings2 className="h-4 w-4 shrink-0" />} label="Identity" />
              <TabTrigger active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<Globe className="h-4 w-4 shrink-0" />} label="Integrate" />
            </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'knowledge' && <KnowledgeManager bot={bot} session={session} onRefresh={fetchBot} />}
            {activeTab === 'appearance' && <AppearanceEditor bot={bot} onUpdateTheme={updateTheme} />}
            {activeTab === 'metadata' && <MetadataEditor bot={bot} onPatch={patchBot} />}
            {activeTab === 'chat' && <IntegrationManager bot={bot} session={session} />}
          </div>
        </div>
        
        {/* Preview Panel is already handled by the side-panel in the App main layout */}
      </div>
    </div>
  )
}

function TabTrigger({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-sm transition-all text-[11px] font-black uppercase tracking-widest
        ${active ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function KnowledgeManager({ bot, session, onRefresh }) {
  const [uploading, setUploading] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const fileInputRef = useRef()

  async function handleFileUpload(e) {
    const files = e.target.files
    if (!files.length) return
    
    setUploading(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      const res = await fetch(`${API_BASE}/api/bots/${bot.id}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session}` },
        body: formData
      })
      if (res.ok) onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
      fileInputRef.current.value = ''
    }
  }

  async function handleRebuild() {
    setRebuilding(true)
    try {
      await fetch(`${API_BASE}/api/bots/${bot.id}/rebuild`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session}` }
      })
      onRefresh()
    } catch(e) { console.error(e) }
    finally { setRebuilding(false) }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-500">
      <div 
        className="group relative flex flex-col items-center justify-center min-h-[300px] border border-dashed border-white/10 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-all"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFileUpload({ target: { files: e.dataTransfer.files } }); }}
      >
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileUpload}
          accept=".pdf,.txt"
        />
        
        <div className={`
          flex h-16 w-16 items-center justify-center rounded-full mb-6 bg-black border border-white/10 transition-all
          ${uploading ? 'animate-pulse' : ''}
        `}>
          <Upload className="h-6 w-6 text-white" />
        </div>
        
        <h3 className="text-sm font-black text-white uppercase tracking-widest">Ingest Knowledge</h3>
        <p className="text-white/40 text-[10px] mt-2 tracking-widest uppercase font-bold">Archives: .pdf, .txt</p>
        
        <button 
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="mt-8 text-[11px] font-black uppercase tracking-widest bg-white text-black px-6 py-2.5 rounded-sm hover:bg-white/90"
        >
          {uploading ? 'Ingesting...' : 'Select Files'}
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Knowledge Layers</h4>
        <button 
          onClick={handleRebuild}
          disabled={rebuilding || bot.documents.length === 0}
          className="text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors flex items-center gap-2"
        >
          {rebuilding ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          Clear/Rebuild Index
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bot.documents.map((doc, i) => (
          <div key={i} className="p-4 rounded-md border border-white/10 bg-white/[0.02] flex items-center gap-4 group">
            <div className="h-10 w-10 flex items-center justify-center rounded-sm bg-black border border-white/10 text-white group-hover:bg-white group-hover:text-black transition-all">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{doc.original_name}</p>
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">LAYER_OK_200</span>
            </div>
            <button 
              onClick={async () => {
                if (confirm('Deconstruct layer?')) {
                  try {
                    await fetch(`${API_BASE}/api/bots/${bot.id}/documents/${doc.id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${session}` }
                    })
                    onRefresh()
                  } catch(e) { console.error(e) }
                }
              }}
              className="p-2 text-white/20 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppearanceEditor({ bot, onUpdateTheme }) {
  const [patch, setPatch] = useState({})
  const [saving, setSaving] = useState(false)
  const currentTheme = { ...bot.theme, ...patch }

  async function handleApply() {
    setSaving(true)
    try {
      await onUpdateTheme(patch)
      setPatch({})
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = Object.keys(patch).length > 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-right-2 duration-500">
      <div className="space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
             <LayoutDashboard className="h-4 w-4 text-white/40" />
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Interface Tokens</h4>
          </div>
          
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40">Widget Title</Label>
              <Input 
                value={currentTheme.botTitle} 
                onChange={e => setPatch({...patch, botTitle: e.target.value})} 
                className="h-10 bg-white/5 border-white/10 focus:border-white/20 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40">Welcome Transmission</Label>
              <textarea 
                value={currentTheme.welcomeMessage} 
                onChange={e => setPatch({...patch, welcomeMessage: e.target.value})} 
                className="w-full min-h-[100px] p-4 bg-white/5 border border-white/10 focus:border-white/20 outline-none transition-all text-sm resize-none rounded-md"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6 p-6 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <Settings2 className="h-4 w-4 text-white/40" />
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Branding System</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/20">Surface Chroma</Label>
              <div className="flex items-center gap-3 bg-black p-2 rounded-md border border-white/10">
                <input 
                  type="color" 
                  value={currentTheme.primaryColor} 
                  onChange={e => setPatch({...patch, primaryColor: e.target.value})} 
                  className="h-6 w-6 rounded-full bg-transparent cursor-pointer border-none"
                />
                <span className="font-mono text-[10px] uppercase text-white/40">{currentTheme.primaryColor}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/20">Data Glow</Label>
              <div className="flex items-center gap-3 bg-black p-2 rounded-md border border-white/10">
                <input 
                  type="color" 
                  value={currentTheme.accentColor} 
                  onChange={e => setPatch({...patch, accentColor: e.target.value})} 
                  className="h-6 w-6 rounded-full bg-transparent cursor-pointer border-none"
                />
                <span className="font-mono text-[10px] uppercase text-white/40">{currentTheme.accentColor}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex gap-4">
          <button 
            onClick={handleApply} 
            disabled={!hasChanges || saving} 
            className="flex-1 h-11 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-white/90 disabled:opacity-20 flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
            Commit Projection
          </button>
          
          {hasChanges && (
            <button onClick={() => setPatch({})} className="px-6 h-11 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Discard</button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Aesthetic Projection</h4>
        </div>
        
        <div className="bg-white/[0.02] rounded-lg border border-white/10 p-4 sm:p-12 flex flex-col items-center justify-center min-h-[500px]">
          {/* Chat Mockup */}
          <div className="w-full max-w-[300px] border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-black">
            <div className="p-4 flex items-center justify-between border-b border-white/10" style={{ background: (currentTheme.primaryColor || '#ffffff') + '10' }}>
               <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-sm flex items-center justify-center" style={{ backgroundColor: currentTheme.primaryColor || '#ffffff' }}>
                    <Zap className="h-3.5 w-3.5 text-black" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white tracking-tight">{currentTheme.botTitle || 'Assistant'}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-green-400">Online</p>
                  </div>
               </div>
            </div>
            <div className="p-5 h-72 flex flex-col gap-3 overflow-y-auto no-scrollbar">
               <div className="p-3 rounded-md text-[10px] leading-relaxed self-start bg-white/5 text-white/60 border border-white/10 max-w-[80%]">
                 {currentTheme.welcomeMessage || 'Establishing neural link... Transmit inquiry.'}
               </div>
               <div className="p-3 rounded-md text-[10px] font-bold text-black self-end max-w-[80%]" style={{ backgroundColor: currentTheme.primaryColor || '#ffffff' }}>
                 Query active knowledge stream.
               </div>
               <div className="p-3 rounded-md text-[10px] leading-relaxed self-start bg-white/5 text-white/60 border border-white/10 max-w-[80%]">
                 Synthesizing data from <span style={{ color: currentTheme.accentColor || '#ffffff' }}>Vector_Layers</span>. Success.
               </div>
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
               <div className="flex-1 h-9 bg-white/5 border border-white/10 rounded-sm"></div>
               <div className="h-9 w-9 rounded-sm flex items-center justify-center" style={{ backgroundColor: currentTheme.primaryColor || '#ffffff' }}>
                  <Send className="h-3.5 w-3.5 text-black" />
               </div>
            </div>
          </div>
        </div>
        <p className="text-[9px] font-black text-white/10 text-center uppercase tracking-[0.4em]">Real-time Surface Projection</p>
      </div>
    </div>
  )
}


function IntegrationManager({ bot, session }) {
  const [integration, setIntegration] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/bots/${bot.id}/integration`, {
      headers: { Authorization: `Bearer ${session}` }
    })
      .then(res => res.json())
      .then(setIntegration)
      .finally(() => setLoading(false))
  }, [bot.id, session])

  if (loading) return null

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    alert('Code transmitted to neural clipboard')
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-2 duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-6 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-4 w-4 text-white/40" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Global Endpoint</h4>
          </div>
          <p className="text-xs text-white/40 mb-6 leading-relaxed">Direct transmission portal for standalone neural access.</p>
          <div className="bg-black p-4 rounded-md border border-white/10 flex items-center gap-4">
            <input 
              readOnly 
              value={integration.widget_url} 
              className="flex-1 bg-transparent border-none outline-none font-mono text-[10px] text-white tracking-tight"
            />
            <button onClick={() => copy(integration.widget_url)} className="p-2 text-white/40 hover:text-white transition-all">
              <Code className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="p-6 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-4 w-4 text-white/40" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Native Component</h4>
          </div>
          <p className="text-xs text-white/40 mb-6 leading-relaxed">Inject intelligence directly into your application layers.</p>
          <div className="bg-black p-4 rounded-md border border-white/10 relative group">
             <pre className="font-mono text-[9px] text-white/40 leading-relaxed overflow-x-auto">
                {integration.react_component_code}
             </pre>
             <button 
              onClick={() => copy(integration.react_component_code)}
              className="absolute top-2 right-2 p-2 text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
             >
                <Code className="h-4 w-4" />
             </button>
          </div>
        </section>
      </div>
      
      <section className="p-8 rounded-lg border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5 text-white" />
            <h4 className="text-lg font-black text-white tracking-tight">Embed Protocol</h4>
          </div>
          <Badge variant="outline" className="border-white/10 text-[9px] uppercase tracking-widest text-white/40">Universal v1.0</Badge>
        </div>
        <p className="text-sm text-white/40 max-w-2xl mb-8 leading-relaxed">Copy this block into your HTML head to instantiate a floating diagnostic bubble.</p>
        <div className="bg-black p-6 rounded-md border border-white/10 mb-8">
           <pre className="font-mono text-xs text-white/20 overflow-x-auto">
             {integration.iframe_snippet}
           </pre>
        </div>
        <button 
          onClick={() => copy(integration.iframe_snippet)}
          className="w-full h-11 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-white/90 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="h-3 w-3" />
          <span>Copy Embed Script</span>
        </button>
      </section>
    </div>
  )
}

function CreateAgentModal({ onClose, onRefresh, session }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/bots`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`
        },
        body: JSON.stringify({ name, description: desc })
      })
      if (res.ok) {
        onRefresh()
        onClose()
      }
    } catch { console.error('Creation fault detected.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-black border border-white/10 rounded-lg shadow-2xl overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-sm font-black uppercase tracking-widest">Instantiate Neural Nexus</h3>
           <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><Plus className="h-5 w-5 rotate-45" /></button>
        </div>
        <form onSubmit={handleCreate} className="space-y-6">
           <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Neural Identifier</Label>
              <Input 
                placeholder="Product Knowledge" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="h-12 bg-white/5 border-white/10 rounded-md focus:border-white/20"
                autoFocus
              />
           </div>
           <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-white/40">Objective</Label>
              <textarea 
                placeholder="Training objective..." 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                className="w-full h-32 bg-white/5 border border-white/10 rounded-md p-4 outline-none focus:border-white/20 text-sm transition-all"
              />
           </div>
           <button type="submit" disabled={loading || !name} className="w-full h-12 bg-white text-black font-black uppercase tracking-widest rounded-md hover:bg-white/90 disabled:opacity-30 transition-all">
              {loading ? <RefreshCw className="h-5 w-5 animate-spin mx-auto text-black" /> : 'Instantiate'}
           </button>
        </form>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border border-white/10 border-t-white animate-spin" />
        <Zap className="h-6 w-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Neural Handshake</p>
    </div>
  )
}

function MetadataEditor({ bot, onPatch }) {
  const [name, setName] = useState(bot.name)
  const [desc, setDesc] = useState(bot.description)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onPatch({ name, description: desc })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = name !== bot.name || desc !== bot.description

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-2 duration-500">
      <div className="max-w-xl space-y-8">
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
             <Settings className="h-4 w-4 text-white/40" />
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Static Parameters</h4>
          </div>
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40">Nexus Designation</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="h-11 bg-white/5 border-white/10 focus:border-white/20 text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-white/40">Mission Profile</Label>
              <textarea 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                className="w-full min-h-[120px] p-4 bg-white/5 border border-white/10 focus:border-white/20 outline-none transition-all text-sm resize-none rounded-md"
              />
            </div>
          </div>
        </section>

        <button 
          onClick={handleSave} 
          disabled={!hasChanges || saving} 
          className="w-full h-11 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-white/90 disabled:opacity-20 flex items-center justify-center gap-2"
        >
          {saving && <RefreshCw className="h-3 w-3 animate-spin" />}
          Update Identity
        </button>
      </div>
    </div>
  )
}

function ChatTester({ bot, session }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Diagnostic link established. I can analyze and retrieve data from your active knowledge base. What is our objective today?' }
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
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch(`http://localhost:8000/api/bots/${bot.id}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`
        },
        body: JSON.stringify({ question: userMsg })
      })
      const data = await res.json()
      // Fix: backend returns data.reply
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || 'No response.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error establishing neural link. Check backend state.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Neural Sandbox</span>
        </div>
        <Badge variant="outline" className="border-white/10 text-[8px] uppercase tracking-[0.2em] text-white/20 px-1.5">v4.2.DEBUG</Badge>
      </div>
      
      <div ref={scrollRef} className="flex-1 bg-black p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[90%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
            <div className={`p-3 rounded-md text-[11px] leading-relaxed ${
              m.role === 'user' 
                ? 'bg-white text-black font-bold' 
                : 'bg-white/5 text-white/80 border border-white/10'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="self-start">
            <div className="p-2 flex gap-1 items-center bg-white/5 border border-white/10 rounded-md">
              <span className="h-1 w-1 bg-white/20 rounded-full animate-bounce [animation-delay:0s]" />
              <span className="h-1 w-1 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="h-1 w-1 bg-white/20 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/10 bg-black">
        <form onSubmit={handleSend} className="flex gap-2">
           <input 
             value={input}
             onChange={e => setInput(e.target.value)}
             placeholder="Inquire the agent..."
             className="flex-1 h-11 bg-white/[0.03] rounded-md border border-white/10 px-4 outline-none focus:border-white/20 text-[11px] text-white transition-all"
           />
           <button 
             type="submit" 
             disabled={!input.trim() || loading}
             className={`h-11 px-4 rounded-md flex items-center justify-center transition-all ${
               input.trim() ? 'bg-white text-black' : 'bg-white/5 text-white/20'
             }`}
           >
              <Send className="h-4 w-4" />
           </button>
        </form>
      </div>
    </>
  )
}

function PublicBotView({ slug }) {
  const [bot, setBot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    fetch(`http://localhost:8000/api/public/bots/${slug}/config`)
      .then(res => res.json())
      .then(data => {
        setBot(data)
        setMessages([{ role: 'bot', text: data.theme?.welcomeMessage || 'Establishing neural link... Transmit your query.' }])
      })
      .finally(() => setLoading(false))
  }, [slug])

  async function handleSend(e) {
    if (e) e.preventDefault()
    if (!input.trim() || chatLoading) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)

    try {
      const res = await fetch(`http://localhost:8000/api/public/bots/${bot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: msg })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error in transmission.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (!bot) return <div className="h-screen flex items-center justify-center text-white/20 font-mono text-[10px] uppercase tracking-[0.5em]">404: Link Severed</div>

  const theme = bot.theme || {}

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center p-4 lg:p-12 overflow-hidden">
      <div className="w-full max-w-2xl h-full flex flex-col bg-black border border-white/10 rounded-lg overflow-hidden shadow-2xl relative">
        <header className="p-6 border-b border-white/10 flex items-center gap-4" style={{ background: (theme.primaryColor || '#ffffff') + '05' }}>
           <div className="h-10 w-10 rounded-md flex items-center justify-center border border-white/10 shadow-sm" style={{ backgroundColor: theme.primaryColor || '#ffffff' }}>
              <Zap className="h-5 w-5 text-black" />
           </div>
           <div>
              <h1 className="text-lg font-black text-white tracking-tight">{bot.name}</h1>
              <div className="flex items-center gap-2">
                 <div className="h-1 w-1 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
                 <p className="text-[8px] font-black uppercase tracking-widest text-white/20">System Online</p>
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
           {messages.map((m, i) => (
             <div key={i} className={`max-w-[85%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
                <div 
                  className={`p-4 rounded-md text-[13px] leading-relaxed border ${
                    m.role === 'user' 
                      ? 'bg-white text-black font-medium border-transparent' 
                      : 'bg-white/[0.03] text-white/80 border-white/10'
                  }`}
                  style={m.role === 'user' ? { backgroundColor: theme.primaryColor } : {}}
                >
                  {m.text}
                </div>
             </div>
           ))}
           {chatLoading && (
              <div className="self-start">
                <div className="p-2 flex gap-1 items-center bg-white/5 border border-white/10 rounded-md">
                   <span className="h-1 w-1 bg-white/20 rounded-full animate-bounce [animation-delay:0s]" />
                   <span className="h-1 w-1 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                   <span className="h-1 w-1 bg-white/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
           )}
        </main>

        <footer className="p-6 border-t border-white/10">
           <form onSubmit={handleSend} className="flex gap-2">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={theme.placeholder || "Inquire the agent..."}
                className="flex-1 h-12 bg-white/5 rounded-md border border-white/10 px-4 outline-none focus:border-white/20 text-sm text-white transition-all shadow-inner"
              />
              <button 
                type="submit"
                disabled={chatLoading || !input.trim()}
                className="h-12 px-6 rounded-md bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-20"
                style={{ backgroundColor: theme.primaryColor }}
              >
                 <Send className="h-4 w-4" />
              </button>
           </form>
           <p className="mt-6 text-center text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">Powered by NexusRAG Intelligence</p>
        </footer>
      </div>
    </div>
  )
}

function GlobalKB({ bots, onSelectBot }) {
  const allDocs = bots.flatMap(b => b.documents?.map(d => ({ ...d, botName: b.name, botId: b.id })) || [])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allDocs.map((doc, i) => (
          <div key={i} className="p-6 rounded-lg border border-white/10 bg-white/[0.02] flex items-center justify-between transition-all group hover:bg-white/[0.04]">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-md bg-black border border-white/10 text-white group-hover:bg-white group-hover:text-black transition-all">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white tracking-tight">{doc.original_name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{doc.botName}</span>
                  <div className="h-1 w-1 rounded-full bg-green-400/40" />
                  <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">LAYER_ACTIVE</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onSelectBot(doc.botId)}
              className="p-2 text-white/20 hover:text-white transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {allDocs.length === 0 && (
          <div className="col-span-full py-20 border border-dashed border-white/10 rounded-lg bg-white/[0.01] flex flex-col items-center justify-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">Global Repository Void</p>
          </div>
        )}
      </div>
    </div>
  )
}
