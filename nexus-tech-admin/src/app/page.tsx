'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Package, Users, Bot, Check, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-[-100px] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] pointer-events-none" />

      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            N
          </div>
          <span className="text-xl font-bold tracking-tight">
            NEXUS <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">AUTO-SALES</span>
          </span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-5 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium backdrop-blur-md">
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="text-center lg:text-left mx-auto lg:mx-0 max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80] animate-pulse"></span>
            <span className="text-sm text-gray-300 font-medium">v2.0 Ahora con Agente IA</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
            El Futuro del <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              Comercio Autónomo
            </span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Automatiza tu inventario, gestiona afiliados y deja que nuestra IA cierre ventas por ti en WhatsApp y Facebook.
            El primer CRM diseñado para funcionar solo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/dashboard" className="btn-cyber-primary px-8 py-4 text-lg font-bold flex items-center justify-center gap-2 rounded-xl group">
              Entrar al Dashboard
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="px-8 py-4 text-lg font-medium rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-md text-center">
              Ver Documentación
            </Link>
          </div>
        </div>

        {/* Hero Visual / Dashboard Preview */}
        <div className="relative h-[500px] hidden lg:flex items-center justify-center perspective-[1000px]">
          {/* Main Card */}
          <div className="w-[420px] bg-gray-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_80px_rgba(99,102,241,0.15)] overflow-hidden transform -rotate-y-6 rotate-x-6 hover:rotate-0 transition-transform duration-500 ease-out">
            <div className="bg-gray-950/50 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              </div>
              <div className="text-[10px] font-mono text-gray-500">nexus-assistant.exe</div>
            </div>

            <div className="p-6 space-y-4 font-sans text-sm">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl rounded-bl-sm text-indigo-100 max-w-[85%]">
                Hola, veo que te interesa el iPhone 15. 📱
              </div>
              <div className="p-3 bg-gray-800 rounded-xl rounded-br-sm text-gray-200 self-end max-w-[85%] ml-auto">
                Sí, ¿qué precio tiene?
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl rounded-bl-sm text-indigo-100 max-w-[90%]">
                Cuesta $3.999.000 COP. Si te lo envío hoy, te llega mañana. ¿Te genero el link de pago? 🚀
              </div>

              <div className="flex items-center gap-2 text-xs text-green-400 pt-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_currentColor]"></span>
                <span className="font-mono">IA Negociando...</span>
              </div>
            </div>
          </div>

          {/* Floating Cards */}
          <div className="absolute top-10 right-0 p-4 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex items-center gap-4 animate-[float_6s_ease-in-out_infinite]">
            <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><BarChart3 size={24} /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Ventas Hoy</p>
              <p className="text-lg font-bold text-white">$4,960,000</p>
            </div>
          </div>

          <div className="absolute bottom-20 left-0 p-4 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl flex items-center gap-4 animate-[float_6s_ease-in-out_infinite_3s]">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Bot size={24} /></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">IA Activa</p>
              <p className="text-lg font-bold text-white">24 Chats</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 md:px-12 py-24 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Todo lo que necesitas para escalar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: BarChart3, color: "text-cyan-400 bg-cyan-400/10", title: "Dashboard Real-Time", desc: "Métricas en vivo de ventas, inventario y rendimiento sin refrescar." },
            { icon: Bot, color: "text-purple-400 bg-purple-400/10", title: "Vendedor IA 24/7", desc: "Nuestra IA aprende de tus políticas y cierra ventas mientras duermes." },
            { icon: Package, color: "text-amber-400 bg-amber-400/10", title: "Inventario Sincronizado", desc: "Si se vende por WhatsApp, se descuenta de la web al instante." },
            { icon: Users, color: "text-rose-400 bg-rose-400/10", title: "Red de Afiliados", desc: "Gestiona comisiones y pagos para tus vendedores externos." }
          ].map((feature, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.05] hover:-translate-y-1 hover:border-indigo-500/30 transition-all group">
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#020617] relative z-10">
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              N
            </div>
            <span className="text-sm font-semibold tracking-wide text-gray-300">NEXUS TECH</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <span>© 2026 Nexus Tech-Admin</span>
            <span className="text-gray-700">|</span>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
