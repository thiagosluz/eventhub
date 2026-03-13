import Link from "next/link"
import { Calendar } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary/90" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex bg-white text-primary w-8 h-8 rounded-md justify-center items-center font-bold">E</div>
            EventHub SaaS
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;A plataforma transformou a maneira como vendemos ingressos e engajamos nosso público. Incrível estabilidade e design impressionante.&rdquo;
            </p>
            <footer className="text-sm">Sofia Ribeiro, Tech Conference BR</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8 flex items-center h-full justify-center">
        {children}
      </div>
    </div>
  )
}
