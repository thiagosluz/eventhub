"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Save, Upload, Palette, Image as ImageIcon, LayoutTemplate, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useState, useEffect } from "react"
import { format } from "date-fns"

export default function EventConfigurationPage() {
  const { slug } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await api.get("/events")
      return data
    }
  })

  // Encontra o evento pelo slug
  const event = events?.find((e: any) => e.slug === slug)

  const [formData, setFormData] = useState<any>({
    name: "",
    slug: "",
    description: "",
    startDate: "",
    endDate: "",
  })

  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || "",
        slug: event.slug || "",
        description: event.description || "",
        startDate: event.startDate ? format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm") : "",
        endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm") : "",
      })
    }
  }, [event])

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch(`/events/${event.id}`, data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] })
      // Se alterou o slug, redireciona para a nova URL
      if (data.slug !== slug) {
        router.push(`/admin/eventos/${data.slug}`)
      }
    }
  })

  const bannerMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      const response = await api.post(`/events/${event.id}/banner`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] })
    },
    onSettled: () => {
      setIsUploading(false)
    }
  })

  const handleSave = () => {
    updateMutation.mutate({
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    })
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      bannerMutation.mutate(e.target.files[0])
    }
  }

  const togglePublishStatus = () => {
    const newStatus = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
    updateMutation.mutate({ status: newStatus })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center p-24 space-y-4">
        <h2 className="text-2xl font-bold">Evento não encontrado</h2>
        <Link href="/admin/eventos" className="text-primary hover:underline">Voltar para meus eventos</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/eventos" className="p-2 border border-border rounded-md bg-background hover:bg-muted text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configurações do Evento</h1>
            <p className="text-sm text-muted-foreground">{event.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={togglePublishStatus}
            disabled={updateMutation.isPending}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors border ${event.status === "PUBLISHED" ? "border-green-500/30 text-green-600 bg-green-500/10 hover:bg-green-500/20" : "border-border bg-muted hover:bg-muted/80"}`}
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {event.status === "PUBLISHED" ? "Publicado (Despublicar)" : "Rascunho (Publicar)"}
          </button>
          
          <button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Navigation Sub-menu Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          <button className="border-b-2 border-primary py-3 px-2 text-sm font-medium text-primary">Informações Básicas</button>
          <Link href={`/admin/eventos/${slug}/programacao`} className="border-b-2 border-transparent py-3 px-2 text-sm font-medium text-muted-foreground hover:text-foreground">Programação</Link>
          <button className="border-b-2 border-transparent py-3 px-2 text-sm font-medium text-muted-foreground hover:text-foreground">Submissões (Call for Papers)</button>
        </nav>
      </div>

      {/* Main Configurations */}
      <div className="grid gap-6">
        
        {/* Identidade Visual */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /> Identidade Visual</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Banner do Evento</label>
                <label className="border-2 border-dashed border-border rounded-xl aspect-video bg-muted/50 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted hover:border-primary/50 cursor-pointer transition-colors relative overflow-hidden group block">
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={isUploading} />
                  {event.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                  ) : null}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity ${event.bannerUrl ? "opacity-0 group-hover:opacity-100 bg-black/40 text-white" : ""}`}>
                    {isUploading ? (
                       <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-sm font-medium">Trocar Imagem</span>
                      </>
                    )}
                  </div>
                </label>
                <p className="text-xs text-muted-foreground">Recomendado: 1920x1080px (JPG ou PNG).</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tema de Cores</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "bg-indigo-600", "bg-purple-600", "bg-rose-500", "bg-orange-500", 
                    "bg-emerald-500", "bg-blue-500", "bg-slate-900", "bg-pink-500"
                  ].map((bg, i) => (
                    <button key={i} className={`h-12 rounded-md ${bg} ${event.themeConfig?.color === bg ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-105 transition-transform'}`} onClick={() => updateMutation.mutate({ themeConfig: { color: bg } })} aria-label="Color"></button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-6">
                 <label className="text-sm font-medium flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Estilo da Página</label>
                 <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                    <option>Layout Moderno (Padrão)</option>
                    <option>Layout Minimalista</option>
                    <option>Layout Corporativo</option>
                 </select>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Informações Básicas */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Datas & Informações</h2>
          
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Evento</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug da URL</label>
                <div className="flex">
                  <div className="flex items-center px-3 border border-r-0 border-input bg-muted rounded-l-md text-sm text-muted-foreground font-mono">
                    eventhub.com/
                  </div>
                  <input type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full h-10 px-3 border border-input bg-background rounded-r-md text-sm font-mono" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Início</label>
                <input type="datetime-local" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Término</label>
                <input type="datetime-local" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Apresentação / Descrição</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full h-32 px-3 py-2 rounded-md border border-input bg-background text-sm"></textarea>
            </div>
          </div>
        </motion.section>

      </div>
    </div>
  )
}
