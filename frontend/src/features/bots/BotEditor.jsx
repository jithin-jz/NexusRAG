import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  Plus,
  Database,
  Palette,
  Settings2,
  Globe,
  Trash2,
  FileText,
  RefreshCw,
  CheckCircle2,
  Zap,
  LayoutDashboard,
  Settings,
  Maximize2,
  Send,
  ShieldCheck,
  Code,
  Upload,
  ArrowRight,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { API_BASE, fetchWithAuth } from '../../services/api'

export function BotEditor({ botId }) {
  const [bot, setBot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [themePatch, setThemePatch] = useState({})
  const [activeTab, setActiveTab] = useState('knowledge')

  const fetchBot = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`/api/bots/${botId}`)
      const data = (await res.ok) ? await res.json() : null
      setBot(data)
    } finally {
      setLoading(false)
    }
  }, [botId])

  useEffect(() => {
    fetchBot()
  }, [botId, fetchBot])

  async function patchBot(fields) {
    try {
      const res = await fetchWithAuth(`/api/bots/${botId}`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      })
      if (res.ok) fetchBot()
    } catch (e) {
      console.error(e)
    }
  }

  async function updateTheme(patch) {
    try {
      const res = await fetchWithAuth(`/api/bots/${botId}/theme`, {
        method: 'PATCH',
        body: JSON.stringify(patch || themePatch),
      })
      if (res.ok) {
        fetchBot()
        setThemePatch({})
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading || !bot)
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-lumina-primary/30" />
      </div>
    )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
      <header className="mb-6 xl:mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-8 xl:pb-10">
        <div>
          <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <div
              className={`h-2 w-2 rounded-full ${bot.public_enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-200'}`}
            />
            <span>Agent Lifecycle: {bot.public_enabled ? 'Active Pulse' : 'Initialization'}</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight">
            {bot.name}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-lumina-primary/5 text-lumina-primary border-lumina-primary/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
              Neural_{bot.slug.toUpperCase()}
            </Badge>
            <span className="text-[10px] font-medium text-slate-400">
              UID: {bot.id.slice(0, 8)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shrink-0">
          <Label
            htmlFor="public-toggle"
            className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 leading-none hidden sm:block"
          >
            Status Projection
          </Label>
          <div className="flex items-center h-10 gap-4 px-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span
              className={`text-[9px] font-black uppercase tracking-widest transition-colors ${!bot.public_enabled ? 'text-slate-900' : 'text-slate-300'}`}
            >
              Private
            </span>
            <Switch
              id="public-toggle"
              checked={bot.public_enabled}
              onCheckedChange={(v) => patchBot({ public_enabled: v })}
              className="scale-90 data-[state=checked]:bg-emerald-500"
            />
            <span
              className={`text-[9px] font-black uppercase tracking-widest transition-colors ${bot.public_enabled ? 'text-emerald-600' : 'text-slate-300'}`}
            >
              Global
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8 flex-1 min-h-0 overflow-visible">
        {/* Custom Tabs */}
        <div className="w-full shrink-0">
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex flex-nowrap overflow-x-auto no-scrollbar gap-1">
            <TabTrigger
              active={activeTab === 'knowledge'}
              onClick={() => setActiveTab('knowledge')}
              icon={<Database className="h-4.5 w-4.5 shrink-0" />}
              label="Knowledge Repo"
            />
            <TabTrigger
              active={activeTab === 'appearance'}
              onClick={() => setActiveTab('appearance')}
              icon={<Palette className="h-4.5 w-4.5 shrink-0" />}
              label="Visuals"
            />
            <TabTrigger
              active={activeTab === 'metadata'}
              onClick={() => setActiveTab('metadata')}
              icon={<Settings2 className="h-4.5 w-4.5 shrink-0" />}
              label="Identity"
            />
            <TabTrigger
              active={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              icon={<Code className="h-4.5 w-4.5 shrink-0" />}
              label="Integration"
            />
          </div>
        </div>

        <div className="flex-1 min-h-[400px]">
          {activeTab === 'knowledge' && <KnowledgeManager bot={bot} onRefresh={fetchBot} />}
          {activeTab === 'appearance' && <AppearanceEditor bot={bot} onUpdateTheme={updateTheme} />}
          {activeTab === 'metadata' && <MetadataEditor bot={bot} onPatch={patchBot} />}
          {activeTab === 'chat' && <IntegrationManager bot={bot} />}
        </div>
      </div>
    </div>
  )
}

function TabTrigger({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest whitespace-nowrap
        ${active ? 'bg-white text-lumina-primary shadow-lg shadow-lumina-primary/10 border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function KnowledgeManager({ bot, onRefresh }) {
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
      const res = await fetchWithAuth(`/api/bots/${bot.id}/documents`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRebuild() {
    setRebuilding(true)
    try {
      await fetchWithAuth(`/api/bots/${bot.id}/rebuild`, { method: 'POST' })
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setRebuilding(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-500 max-w-5xl">
      <div
        className="group relative flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-slate-200 rounded-[2rem] bg-white hover:bg-slate-50 hover:border-lumina-primary/30 transition-all cursor-pointer shadow-inner"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFileUpload({ target: { files: e.dataTransfer.files } })
        }}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.txt"
        />

        <div
          className={`
          flex h-16 w-16 items-center justify-center rounded-2xl mb-6 bg-slate-50 border border-slate-100 transition-all group-hover:scale-110 shadow-sm
          ${uploading ? 'animate-pulse' : ''}
        `}
        >
          <Upload
            className={`h-7 w-7 transition-colors ${uploading ? 'text-lumina-primary' : 'text-slate-300'}`}
          />
        </div>

        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
          Ingest Knowledge Layers
        </h3>
        <p className="text-slate-400 text-[10px] mt-2 tracking-[0.2em] uppercase font-bold text-center px-8">
          Compatible Archives: .pdf, .txt
        </p>

        <div className="mt-8 px-6 py-2.5 bg-lumina-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-lumina-primary/20 hover:scale-105 transition-all">
          {uploading ? 'Processing...' : 'Neural Upload'}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-4 w-4 text-slate-400" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              Integrated Intelligence Layers
            </h4>
          </div>
          <button
            onClick={handleRebuild}
            disabled={rebuilding || bot.documents.length === 0}
            className="text-[9px] font-black uppercase tracking-widest text-lumina-primary px-3 py-1.5 bg-lumina-primary/5 rounded-full border border-lumina-primary/10 disabled:opacity-30"
          >
            {rebuilding ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Rebuild Index'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bot.documents.map((doc, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-4 group hover:border-lumina-primary/20 transition-all shadow-sm"
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-lumina-primary group-hover:text-white transition-all">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-bold text-slate-900 truncate tracking-tight">
                  {doc.original_name}
                </p>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                  Active_Repo
                </span>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  if (confirm('Deconstruct layer?')) {
                    try {
                      await fetchWithAuth(`/api/bots/${bot.id}/documents/${doc.id}`, {
                        method: 'DELETE',
                      })
                      onRefresh()
                    } catch (e) {
                      console.error(e)
                    }
                  }
                }}
                className="p-2 text-slate-300 hover:text-rose-500 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {bot.documents.length === 0 && (
            <div className="col-span-full py-10 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
                No Layers Synchronized
              </p>
            </div>
          )}
        </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 animate-in fade-in slide-in-from-right-2 duration-500 max-w-6xl h-full">
      <div className="space-y-8 flex flex-col">
        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              Interface Definitions
            </h4>
          </div>

          <div className="space-y-6">
            <div className="grid gap-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Hub Identifier
              </Label>
              <Input
                value={currentTheme.botTitle}
                onChange={(e) => setPatch({ ...patch, botTitle: e.target.value })}
                className="h-11 bg-white border-slate-200 rounded-xl text-[12px] font-bold shadow-sm"
              />
            </div>
            <div className="grid gap-2.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Initialization Message
              </Label>
              <textarea
                value={currentTheme.welcomeMessage}
                onChange={(e) => setPatch({ ...patch, welcomeMessage: e.target.value })}
                className="w-full min-h-[100px] p-4 bg-white border border-slate-200 focus:border-lumina-primary/30 outline-none transition-all text-[12px] font-bold resize-none rounded-xl shadow-sm"
              />
            </div>
          </div>
        </section>

        <section className="p-6 rounded-[2rem] border border-slate-200 bg-white shadow-sm space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
            Neural Chroma
          </h4>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[9px] font-black uppercase text-slate-300">Primary Core</Label>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <input
                  type="color"
                  value={currentTheme.primaryColor || '#4f46e5'}
                  onChange={(e) => setPatch({ ...patch, primaryColor: e.target.value })}
                  className="h-6 w-6 rounded cursor-pointer border-none"
                />
                <span className="font-mono text-[10px] uppercase font-black text-slate-500">
                  {currentTheme.primaryColor || '#4f46e5'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[9px] font-black uppercase text-slate-300">Accent Aura</Label>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <input
                  type="color"
                  value={currentTheme.accentColor || '#0ea5e9'}
                  onChange={(e) => setPatch({ ...patch, accentColor: e.target.value })}
                  className="h-6 w-6 rounded cursor-pointer border-none"
                />
                <span className="font-mono text-[10px] uppercase font-black text-slate-500">
                  {currentTheme.accentColor || '#0ea5e9'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <button
          onClick={handleApply}
          disabled={!hasChanges || saving}
          className="w-full h-14 bg-lumina-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-lumina-primary/20 disabled:opacity-20 flex items-center justify-center gap-3 mt-auto"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Commit Visual Patch'}
        </button>
      </div>

      <div className="hidden lg:flex flex-col gap-6">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 px-2">
          Simulation Projection
        </div>
        <div className="flex-1 bg-slate-50/50 rounded-[2.5rem] border border-slate-200 p-8 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
          {/* Compact Mockup */}
          <div className="w-full max-w-[280px] border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl bg-white">
            <div
              className="p-4 border-b border-slate-100 flex items-center gap-3"
              style={{ background: (currentTheme.primaryColor || '#4f46e5') + '08' }}
            >
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center shadow-md shrink-0"
                style={{ backgroundColor: currentTheme.primaryColor || '#4f46e5' }}
              >
                <Zap className="h-4 w-4 text-white fill-current" />
              </div>
              <p className="text-[10px] font-black text-slate-900 truncate tracking-tight">
                {currentTheme.botTitle || 'Unit_Assistant'}
              </p>
            </div>
            <div className="p-4 h-64 flex flex-col gap-3 overflow-y-auto no-scrollbar">
              <div className="p-3 rounded-xl text-[11px] font-medium leading-relaxed bg-slate-50 text-slate-600 border border-slate-200 max-w-[85%]">
                {currentTheme.welcomeMessage || 'Establishing neural link...'}
              </div>
              <div
                className="p-3 rounded-xl text-[11px] font-bold text-white self-end max-w-[85%]"
                style={{ backgroundColor: currentTheme.primaryColor || '#4f46e5' }}
              >
                Unit status verified.
              </div>
            </div>
            <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
              <div className="flex-1 h-9 bg-slate-50 border border-slate-200 rounded-lg"></div>
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: currentTheme.primaryColor || '#4f46e5' }}
              >
                <Send className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-32 w-32 bg-lumina-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-40" />
        </div>
      </div>
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
    <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-500 max-w-3xl">
      <section className="space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
            Neutral Identity Matrix
          </h4>
        </div>
        <div className="space-y-6">
          <div className="grid gap-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Unit Designation
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-white border-slate-200 rounded-2xl text-[13px] font-bold"
            />
          </div>
          <div className="grid gap-2.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Mission Parameters
            </Label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full min-h-[120px] p-5 bg-white border border-slate-200 focus:border-lumina-primary/30 outline-none transition-all text-[13px] font-bold resize-none rounded-2xl shadow-sm"
            />
          </div>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="w-full lg:w-max h-14 px-12 bg-lumina-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-lumina-primary/20 disabled:opacity-20 flex items-center justify-center gap-3 transition-all active:scale-95"
      >
        {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
        Sync Unit Blueprint
      </button>
    </div>
  )
}

function IntegrationManager({ bot }) {
  const [integration, setIntegration] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWithAuth(`/api/bots/${bot.id}/integration`)
      .then((res) => res.json())
      .then(setIntegration)
      .finally(() => setLoading(false))
  }, [bot.id])

  if (loading) return null

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    alert('Code transmitted')
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-500 max-w-5xl pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="p-6 rounded-[2rem] border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">
              Cloud Endpoint
            </h4>
            <p className="text-[11px] font-medium text-slate-400 mb-6 leading-relaxed">
              Direct transmission gateway for global neural access.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
            <input
              readOnly
              value={integration.widget_url}
              className="flex-1 bg-transparent border-none outline-none font-mono text-[9px] font-black text-slate-600 truncate"
            />
            <button
              onClick={() => copy(integration.widget_url)}
              className="p-2 text-slate-300 hover:text-lumina-primary hover:bg-white rounded-lg transition-all shadow-sm"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="p-6 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">
            Embedded Protocol
          </h4>
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 group relative">
            <pre className="font-mono text-[9px] text-indigo-200/80 leading-relaxed overflow-x-auto no-scrollbar max-h-32">
              {integration.react_component_code}
            </pre>
            <button
              onClick={() => copy(integration.react_component_code)}
              className="absolute top-3 right-3 p-2 bg-white/10 text-white hover:bg-white/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      <section className="p-8 rounded-[2.5rem] border border-slate-200 bg-white shadow-sm relative overflow-hidden group">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 bg-lumina-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <Zap className="h-5 w-5" />
          </div>
          <h4 className="text-lg font-black text-slate-900 tracking-tight">Script Injection</h4>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 relative group shadow-inner">
          <pre className="font-mono text-[11px] text-slate-400 overflow-x-auto no-scrollbar whitespace-pre-wrap">
            {integration.iframe_snippet}
          </pre>
          <button
            onClick={() => copy(integration.iframe_snippet)}
            className="absolute top-4 right-4 p-2.5 bg-white text-slate-400 border border-slate-100 rounded-lg opacity-0 group-hover:opacity-100 shadow-sm transition-all"
          >
            <Code className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => copy(integration.iframe_snippet)}
          className="w-full h-14 bg-lumina-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-lumina-primary/30 flex items-center justify-center gap-3"
        >
          <Zap className="h-4 w-4" />
          Synchronize Native Interface
        </button>
      </section>
    </div>
  )
}
