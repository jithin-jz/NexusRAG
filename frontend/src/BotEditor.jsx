function BotEditor({ botId, onBack, session }) {
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
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" onClick={onBack} className="w-fit h-9 gap-2 px-3 rounded-xl transition-all hover:bg-[#124170]/5 text-[#124170] font-bold">
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#124170] text-white shadow-xl shadow-[#124170]/20">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-fraunces text-3xl font-bold text-[#182033] tracking-tight">{bot.name}</h2>
              <div className="flex items-center gap-3 mt-1 underline-offset-4 decoration-[#c75d2c]/30 decoration-2 font-mono text-[11px] font-bold text-[#5f6b7d] uppercase tracking-wider">
                <span>{bot.slug}</span>
                <span className="h-1 w-1 rounded-full bg-black/10" />
                <span>{bot.documents.length} File{bot.documents.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl ring-1 ring-black/[0.04] shadow-sm">
            <Label htmlFor="public" className="text-xs font-bold uppercase tracking-wider text-[#5f6b7d]">Public Visibility</Label>
            <Switch 
              id="public"
              checked={bot.public_enabled} 
              onCheckedChange={v => patchBot({ public_enabled: v })}
              className="data-[state=checked]:bg-[#c75d2c]"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="h-14 p-1 rounded-2xl bg-white ring-1 ring-black/[0.05] shadow-lg shadow-[#124170]/5 inline-flex">
          <TabsTrigger value="knowledge" className="rounded-xl h-full px-8 font-bold text-sm data-[state=active]:bg-[#124170] data-[state=active]:text-white transition-all gap-2">
            <Database className="h-4 w-4" />
            <span>Knowledge</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-xl h-full px-8 font-bold text-sm data-[state=active]:bg-[#124170] data-[state=active]:text-white transition-all gap-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-xl h-full px-8 font-bold text-sm data-[state=active]:bg-[#124170] data-[state=active]:text-white transition-all gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Deployment</span>
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-8">
          <TabsContent value="knowledge" className="m-0 mt-0">
            <KnowledgeManager bot={bot} session={session} onRefresh={fetchBot} />
          </TabsContent>
          <TabsContent value="appearance" className="m-0 mt-0">
            <AppearanceEditor bot={bot} session={session} onRefresh={fetchBot} onUpdateTheme={updateTheme} />
          </TabsContent>
          <TabsContent value="chat" className="m-0 mt-0">
            <IntegrationManager bot={bot} session={session} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
