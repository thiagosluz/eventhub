export function Footer() {
  return (
    <footer className="py-12 border-t border-border/50 bg-background px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Event<span className="text-primary">Hub</span>
          </span>
        </div>
        
        <p className="text-muted-foreground text-sm font-medium">
          &copy; {new Date().getFullYear()} EventHub SaaS. Todos os direitos reservados.
        </p>
        
        <div className="flex gap-8 text-sm font-semibold text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
          <a href="#" className="hover:text-primary transition-colors">Termos</a>
          <a href="#" className="hover:text-primary transition-colors">Contato</a>
        </div>
      </div>
    </footer>
  );
}
