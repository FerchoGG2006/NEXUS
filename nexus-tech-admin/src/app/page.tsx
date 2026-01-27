import Link from 'next/link'
import { ArrowRight, BarChart3, Package, Users, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-[150px]" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-3xl font-black text-white">N</span>
          </div>
          <span className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            NEXUS
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
          Sistema de Gestión
          <span className="block bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            y Ventas
          </span>
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Automatiza ventas, gestiona inventario inteligente y maneja tu red de afiliados y clientes B2B.
          Control total de tu ganancia neta.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: BarChart3, label: 'Dashboard en Tiempo Real' },
            { icon: Package, label: 'Control de Inventario' },
            { icon: Users, label: 'Red de Afiliados' },
            { icon: Zap, label: 'Automatización' },
          ].map((feature, i) => (
            <div
              key={i}
              className="card-glass p-4 flex flex-col items-center gap-3 hover:border-indigo-500/50 transition-all"
            >
              <feature.icon className="w-8 h-8 text-indigo-400" />
              <span className="text-sm text-gray-300 text-center">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="btn btn-primary btn-lg animate-pulse-glow"
          >
            Iniciar Sesión
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/dashboard"
            className="btn btn-secondary btn-lg"
          >
            Ver Demo
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center text-sm text-gray-600">
        © 2026 NEXUS TECH-ADMIN. Todos los derechos reservados.
      </footer>
    </main>
  )
}
