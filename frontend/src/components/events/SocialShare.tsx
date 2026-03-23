'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import { ShareIcon, CalendarIcon, CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SocialShareProps {
  event: Event;
}

export function SocialShare({ event }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [eventUrl, setEventUrl] = useState('');

  useEffect(() => {
    setEventUrl(window.location.href);
  }, []);

  const formatCalendarDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = formatCalendarDate(event.startDate);
  const endDate = formatCalendarDate(event.endDate);
  const title = encodeURIComponent(event.name);
  const description = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || 'Online');

  const calendarLinks = {
    google: `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&location=${location}&dates=${startDate}/${endDate}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&body=${description}&location=${location}&startdt=${event.startDate}&enddt=${event.endDate}`,
  };

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${title}%20${eventUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${eventUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${title}&url=${eventUrl}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <ShareIcon className="w-4 h-4" />
          Compartilhar
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-all font-bold text-sm"
          >
            WhatsApp
          </a>
          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-all font-bold text-sm"
          >
            LinkedIn
          </a>
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 transition-all font-bold text-sm"
          >
            Twitter / X
          </a>
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-muted hover:bg-muted/80 text-foreground transition-all font-bold text-sm"
          >
            {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar Link'}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Adicionar ao Calendário
        </h3>
        
        <div className="flex flex-col gap-2">
          <a
            href={calendarLinks.google}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            <span className="font-bold">Google Calendar</span>
            <div className="p-2 rounded-lg bg-muted group-hover:bg-primary group-hover:text-white transition-all">
               <CalendarIcon className="w-4 h-4" />
            </div>
          </a>
          <a
            href={calendarLinks.outlook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            <span className="font-bold">Outlook / Office 365</span>
            <div className="p-2 rounded-lg bg-muted group-hover:bg-primary group-hover:text-white transition-all">
               <CalendarIcon className="w-4 h-4" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
