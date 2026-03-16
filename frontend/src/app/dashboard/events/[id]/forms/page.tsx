"use client";

import { useEffect, useState, use } from "react";
import { formsService } from "@/services/forms.service";
import { eventsService } from "@/services/events.service";
import { Event, Form, FormField } from "@/types/event";
import { 
  PlusIcon, 
  TrashIcon, 
  ChevronLeftIcon,
  Bars3Icon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EventFormsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const [fields, setFields] = useState<Partial<FormField>[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, formData] = await Promise.all([
          eventsService.getOrganizerEventById(id),
          formsService.getRegistrationForm(id)
        ]);
        setEvent(eventData);
        setForm(formData);
        if (formData && formData.fields) {
          setFields(formData.fields);
        } else if (formData) {
          setFields([]);
        }
      } catch (err) {
        setError("Não foi possível carregar os dados.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const addField = () => {
    const newField: Partial<FormField> = {
      label: "",
      type: "TEXT",
      required: false,
      order: fields.length
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    // Update order
    const updatedFields = newFields.map((f, i) => ({ ...f, order: i }));
    setFields(updatedFields);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSaveSuccess(false);

    try {
      // Validate
      if (fields.some(f => !f.label)) {
        throw new Error("Todas as perguntas precisam de um rótulo (label).");
      }

      await formsService.saveRegistrationForm(id, {
        name: "Formulário de Inscrição",
        fields: fields
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar o formulário.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Carregando formulário...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/events/${id}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeftIcon className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Formulário de Inscrição</h1>
          </div>
          <p className="text-muted-foreground font-medium ml-10">Gerencie as perguntas extras para os participantes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="premium-button flex items-center gap-2"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Salvar Alterações</>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="premium-card p-8 bg-card border-border space-y-8">
          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in">
              <CheckCircleIcon className="w-5 h-5" />
              Formulário salvo com sucesso!
            </div>
          )}
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in">
              <ExclamationCircleIcon className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                <p className="text-muted-foreground font-medium">Nenhuma pergunta personalizada adicionada ainda.</p>
                <button onClick={addField} className="mt-4 text-primary font-black uppercase tracking-widest text-xs hover:underline">
                  Adicionar primeira pergunta
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={index} className="flex items-start gap-4 p-6 rounded-2xl bg-muted/30 border border-border group animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="mt-2 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-move">
                      <Bars3Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-6 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rótulo da Pergunta</label>
                        <input 
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Ex: Tamanho da Camiseta"
                          className="w-full h-10 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                        />
                      </div>
                      
                      <div className="md:col-span-3 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</label>
                        <select 
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-border bg-card focus:border-primary outline-none font-bold text-sm"
                        >
                          <option value="TEXT">Texto Curto</option>
                          <option value="TEXTAREA">Texto Longo</option>
                          <option value="NUMBER">Número</option>
                          <option value="EMAIL">E-mail</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary h-5 w-5"
                          />
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Obrigatório</span>
                        </label>
                      </div>

                      <div className="md:col-span-1 flex items-center justify-end pt-5">
                        <button 
                          onClick={() => removeField(index)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {fields.length > 0 && (
              <button 
                onClick={addField}
                className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-bold"
              >
                <PlusIcon className="w-5 h-5" />
                Adicionar mais uma pergunta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
