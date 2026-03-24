import React, { useState } from 'react';

interface SeoPreviewProps {
  seoTitle?: string;
  seoDescription?: string;
  name?: string;
  slug?: string;
  domain?: string;
  description?: string;
  bannerUrl?: string | null;
}

export function SeoPreview({ 
  seoTitle, 
  seoDescription, 
  name, 
  slug, 
  domain = "eventhub.com", 
  description,
  bannerUrl
}: SeoPreviewProps) {
  const [tab, setTab] = useState<'google' | 'social'>('google');
  
  const finalTitle = seoTitle || name || "Título do Evento";
  const finalDescription = seoDescription || (description ? description.slice(0, 160) : "Descrição do evento para ajudar os usuários a encontrarem e se interessarem.");
  const url = `${domain}/events/${slug || 'seu-evento'}`;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mt-6 mb-4">
      <div className="flex items-center border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={() => setTab('google')}
          className={`px-4 py-3 text-sm font-bold transition-all ${tab === 'google' ? 'text-primary border-b-2 border-primary bg-card' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          Google Preview
        </button>
        <button
          type="button"
          onClick={() => setTab('social')}
          className={`px-4 py-3 text-sm font-bold transition-all ${tab === 'social' ? 'text-primary border-b-2 border-primary bg-card' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          Social Preview
        </button>
      </div>

      <div className="p-6 bg-secondary/5">
        {tab === 'google' ? (
          <div className="max-w-[600px] flex flex-col gap-1 p-6 bg-card border border-border shadow-sm rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center p-1.5 border border-primary/20">
                <svg className="w-full h-full text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2A10 10 0 1022 12A10 10 0 0012 2ZM12 20.5a8.5 8.5 0 118.5-8.5A8.5 8.5 0 0112 20.5ZM12.5 5h-1v5.5l4 4 .7-.7-3.7-3.7Z" />
                </svg>
              </div>
              <div className="flex flex-col flex-1 truncate">
                <span className="text-sm font-medium text-foreground tracking-tight">{domain}</span>
                <span className="text-xs text-muted-foreground truncate">https://{url}</span>
              </div>
            </div>
            <h3 className="text-[#1a0dab] dark:text-[#8ab4f8] text-[20px] leading-snug font-medium hover:underline cursor-pointer pt-3 truncate">
              {finalTitle}
            </h3>
            <p className="text-sm text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 mt-1 break-words">
              {finalDescription}
            </p>
          </div>
        ) : (
          <div className="max-w-[500px] border border-border rounded-xl overflow-hidden shadow-sm bg-card transition-all hover:shadow-md">
            <div className="aspect-[1.91/1] w-full bg-muted flex items-center justify-center overflow-hidden relative">
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-bold uppercase tracking-widest">Sem Imagem</span>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col gap-1 border-t border-border bg-secondary/10">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black leading-tight">{domain}</span>
              <h3 className="text-foreground font-bold line-clamp-1 leading-snug mt-1">{finalTitle}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1 leading-snug">{finalDescription}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
