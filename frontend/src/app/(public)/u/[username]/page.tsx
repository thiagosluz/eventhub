"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usersService } from "@/services/users.service";
import Image from "next/image";
import Link from "next/link";
import { 
  TrophyIcon, 
  AcademicCapIcon, 
  CalendarIcon, 
  GlobeAltIcon,
  TicketIcon,
  CheckBadgeIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { Badge3D } from "@/components/profile/Badge3D";
import { AvatarWithBorder } from "@/components/profile/AvatarWithBorder";

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersService.getPublicProfile(username as string);
        setProfile(data);
      } catch (err) {
        console.error("Failed to load public profile", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-bold animate-pulse">Carregando Perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="premium-card p-12 text-center max-w-md space-y-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <GlobeAltIcon className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black">Perfil não encontrado</h1>
            <p className="text-muted-foreground">Este perfil pode ser privado ou o nome de usuário está incorreto.</p>
          </div>
          <Link href="/" className="premium-button block w-full !py-3">Voltar para Home</Link>
        </div>
      </div>
    );
  }

  const themeColors: Record<string, string> = {
    zinc: "from-slate-900 to-slate-800",
    indigo: "from-indigo-900 to-slate-900",
    rose: "from-rose-900 to-slate-900",
    emerald: "from-emerald-900 to-slate-900",
    amber: "from-amber-900 to-slate-900",
    fuchsia: "from-fuchsia-900 to-slate-900",
    sky: "from-sky-900 to-slate-900",
  };

  const accentColors: Record<string, string> = {
    zinc: "text-slate-400",
    indigo: "text-indigo-400",
    rose: "text-rose-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    fuchsia: "text-fuchsia-400",
    sky: "text-sky-400",
  };

  const theme = profile.profileTheme || "zinc";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Dynamic Header Banner */}
      <div className={`h-64 md:h-80 bg-gradient-to-br ${themeColors[theme]} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="absolute -bottom-px left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-secondary/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-32 relative z-10 space-y-12">
        {/* Profile Card */}
        <div className="premium-card p-8 md:p-12 bg-card/80 backdrop-blur-xl border-border/50 flex flex-col md:flex-row items-center md:items-end gap-8 shadow-2xl">
          <div className="relative -mt-20 md:-mt-0 group">
             <AvatarWithBorder 
               avatarUrl={profile.avatarUrl} 
               name={profile.name} 
               level={profile.level || 1}
               size="lg"
             />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
               <h1 className="text-4xl font-black text-foreground tracking-tight">{profile.name}</h1>
               <p className={`text-lg font-bold font-mono ${accentColors[theme]}`}>@{profile.username}</p>
            </div>
            
            {profile.bio && (
              <p className="text-muted-foreground font-medium max-w-2xl px-4 md:px-0">{profile.bio}</p>
            )}

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
               {profile.interests?.map((tag: string) => (
                 <span key={tag} className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-xs font-black uppercase tracking-widest border border-primary/10">
                   #{tag}
                 </span>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
             <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 text-center">
                <div className="text-3xl font-black text-primary">{profile.registrations?.length || 0}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                  <TicketIcon className="w-3 h-3" /> Eventos
                </div>
             </div>
             <div className="bg-fuchsia-500/5 rounded-2xl p-4 border border-fuchsia-500/10 text-center">
                <div className="text-3xl font-black text-fuchsia-600">{profile.userBadges?.length || 0}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                  <CheckBadgeIcon className="w-3 h-3" /> Medalhas
                </div>
             </div>
          </div>
        </div>

        {/* Badges Section */}
        {profile.userBadges?.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <h2 className="text-2xl font-black flex items-center gap-2">
                🏆 Conquistas Desbloqueadas
              </h2>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Coleção em 3D</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {profile.userBadges.map((ub: any) => (
                <Badge3D 
                  key={ub.badge.id}
                  name={ub.badge.name}
                  description={ub.badge.description}
                  color={ub.badge.color}
                  iconUrl={ub.badge.iconUrl}
                  isEarned={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Journey / Done Events */}
        {profile.registrations?.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-black flex items-center gap-2">
              🎫 Jornada de Participação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.registrations.map((reg: any) => (
                <div key={reg.id} className="premium-card p-6 bg-card border-border flex items-center gap-6 group hover:border-primary/30 transition-all">
                   <div className="w-20 h-20 relative rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                     {reg.event.bannerUrl ? (
                       <Image src={reg.event.bannerUrl} alt={reg.event.name} fill sizes="80px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                         <CalendarIcon className="w-8 h-8" />
                       </div>
                     )}
                   </div>
                   <div className="flex-1">
                      <h3 className="font-black text-foreground group-hover:text-primary transition-colors">{reg.event.name}</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Participante</p>
                      <Link href={`/events/${reg.event.slug}`} className="inline-block mt-3 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver Evento →</Link>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Powered by Footer */}
        <div className="pt-20 text-center">
           <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
              <SparklesIcon className="w-4 h-4" />
              Criado via <strong>EventHub</strong>
           </Link>
        </div>
      </div>
    </div>
  );
}
