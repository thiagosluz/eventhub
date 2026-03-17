"use client";

import { SponsorCategory } from "@/services/sponsors.service";

interface SponsorShowcaseProps {
  categories: SponsorCategory[];
}

export function SponsorShowcase({ categories }: SponsorShowcaseProps) {
  if (!categories || categories.length === 0) return null;

  const sizeClasses = {
    SMALL: "h-12 md:h-16",
    MEDIUM: "h-20 md:h-24",
    LARGE: "h-32 md:h-40",
  };

  const gridClasses = {
    SMALL: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
    MEDIUM: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    LARGE: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <section className="space-y-16 py-12 px-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tight">Realização e Apoio</h2>
        <div className="w-24 h-1.5 bg-primary rounded-full" />
      </div>

      <div className="space-y-20">
        {categories.map((category) => (
          <div key={category.id} className="space-y-8">
            <div className="flex items-center gap-4">
               <div 
                 className="h-px flex-1 bg-border" 
                 style={{ backgroundImage: `linear-gradient(to right, transparent, ${category.color || 'var(--border)'}, transparent)` }}
               />
               <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap px-4" style={{ color: category.color }}>
                  {category.name}
               </h3>
               <div 
                 className="h-px flex-1 bg-border" 
                 style={{ backgroundImage: `linear-gradient(to right, transparent, ${category.color || 'var(--border)'}, transparent)` }}
               />
            </div>

            <div className={`grid gap-8 items-center justify-items-center ${gridClasses[category.size] || gridClasses.MEDIUM}`}>
              {category.sponsors.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.websiteUrl || "#"}
                  target={sponsor.websiteUrl ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`relative group w-full flex items-center justify-center p-4 rounded-2xl bg-white/50 border border-border/40 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 ${sponsor.websiteUrl ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className={`${sizeClasses[category.size] || sizeClasses.MEDIUM} w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-700 opacity-70 group-hover:opacity-100 p-2`}
                  />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
