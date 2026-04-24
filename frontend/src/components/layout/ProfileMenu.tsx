"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  UserIcon as DefaultUserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";

export interface ProfileMenuLink {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ProfileMenuProps {
  /** Rótulo curto do papel exibido acima do nome (ex.: "Organizador"). */
  roleLabel: string;
  /** Itens extras exibidos acima do "Sair do Sistema". */
  links?: ProfileMenuLink[];
  /** Acessório opcional renderizado à esquerda do dropdown (ex.: sino de notificações). */
  leftAccessory?: ReactNode;
}

export function ProfileMenu({ roleLabel, links = [], leftAccessory }: ProfileMenuProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      {leftAccessory}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`Abrir menu do usuário ${user.name}`}
          className="flex items-center gap-3 pl-2 group cursor-pointer"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black uppercase tracking-tight leading-none text-foreground">
              {user.name}
            </p>
            <p className="text-[10px] font-bold text-primary uppercase leading-tight">
              {roleLabel}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-muted overflow-hidden flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all border border-border">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircleIcon className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in duration-200"
            >
              <div className="px-3 py-2 border-b border-border/50 mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Logado como
                </p>
                <p className="text-xs font-bold truncate text-foreground">
                  {user.email}
                </p>
              </div>

              {links.map((link) => {
                const Icon = link.icon ?? DefaultUserIcon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all group"
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                role="menuitem"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/5 transition-all"
              >
                <ArrowRightOnRectangleIcon
                  className="w-4 h-4"
                  aria-hidden="true"
                />
                Sair do Sistema
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
