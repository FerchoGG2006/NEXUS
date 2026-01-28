'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Package, Users, Zap, Bot, Globe, ShieldCheck, ChevronRight } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="landing-container">
      {/* Background Ambience */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />
      <div className="grid-overlay" />

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo-container">
          <div className="logo-icon">N</div>
          <span className="logo-text">NEXUS <span className="logo-highlight">AUTO-SALES</span></span>
        </div>
        <div className="nav-links">
          <Link href="/login" className="btn btn--secondary btn--sm">Admin Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge-new">
            <span className="badge-dot"></span> v2.0 Ahora con Agente IA
          </div>
          <h1 className="hero-title">
            El Futuro del <br />
            <span className="text-gradient">Comercio Autónomo</span>
          </h1>
          <p className="hero-subtitle">
            Automatiza tu inventario, gestiona afiliados y deja que nuestra IA cierre ventas por ti en WhatsApp y Facebook.
            El primer CRM diseñado para funcionar solo.
          </p>

          <div className="hero-cta">
            <Link href="/dashboard" className="btn btn--primary btn--lg icon-hover">
              Entrar al Dashboard <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="btn btn--glass btn--lg">
              Ver Documentación
            </Link>
          </div>
        </div>

        {/* Hero Visual / Dashboard Preview */}
        <div className="hero-visual">
          <div className="visual-card main-card">
            <div className="card-header-fake">
              <div className="dots"><span></span><span></span><span></span></div>
              <div className="bar">nexus-assistant.exe</div>
            </div>
            <div className="chat-preview">
              <div className="msg ia">
                Hola, veo que te interesa el iPhone 15. 📱
              </div>
              <div className="msg user">
                Sí, ¿qué precio tiene?
              </div>
              <div className="msg ia">
                Cuesta $999 USD. Si te lo envío hoy, te llega mañana. ¿Te genero el link de pago? 🚀
              </div>
              <div className="status-pill">
                <span className="pulse"></span> IA Negociando...
              </div>
            </div>
          </div>
          <div className="visual-card floating-card card-1">
            <BarChart3 size={24} color="#4ade80" />
            <div>
              <div className="text-xs text-muted">Ventas Hoy</div>
              <div className="font-bold">$1,240.50</div>
            </div>
          </div>
          <div className="visual-card floating-card card-2">
            <Bot size={24} color="#a78bfa" />
            <div>
              <div className="text-xs text-muted">IA Activa</div>
              <div className="font-bold">24 Chats</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Todo lo que necesitas para escalar</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="icon-box color-cyan"><BarChart3 size={24} /></div>
            <h3>Dashboard Real-Time</h3>
            <p>Métricas en vivo de ventas, inventario y rendimiento de afiliados sin refrescar la página.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box color-violet"><Bot size={24} /></div>
            <h3>Vendedor IA 24/7</h3>
            <p>Nuestra IA aprende de tus políticas y cierra ventas automáticamente mientras duermes.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box color-amber"><Package size={24} /></div>
            <h3>Inventario Sincronizado</h3>
            <p>Control total de stock. Si se vende por WhatsApp, se descuenta de la web al instante.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box color-rose"><Users size={24} /></div>
            <h3>Red de Afiliados</h3>
            <p>Gestiona comisiones y pagos para tus vendedores externos desde un solo lugar.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="logo-container">
            <div className="logo-icon small">N</div>
            <span className="logo-text text-sm">NEXUS TECH</span>
          </div>
          <div className="footer-links">
            <span>© 2026 Nexus Tech-Admin</span>
            <span className="divider">|</span>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        /* Reset & Base */
        .landing-container {
            min-height: 100vh;
            background-color: #030712;
            color: white;
            position: relative;
            overflow-x: hidden;
            font-family: 'Inter', sans-serif;
        }

        /* Ambient Background */
        .ambient-glow {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px);
            z-index: 0;
            opacity: 0.4;
        }
        .glow-1 {
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, transparent 70%);
            top: -100px;
            left: -100px;
        }
        .glow-2 {
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%);
            bottom: 0;
            right: -100px;
        }
        .grid-overlay {
            position: absolute;
            inset: 0;
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
            z-index: 0;
            pointer-events: none;
        }

        /* Navbar */
        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 48px;
            position: relative;
            z-index: 50;
        }
        .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #4f46e5, #9333ea);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 20px;
            box-shadow: 0 0 20px rgba(79, 70, 229, 0.4);
        }
        .logo-icon.small { width: 32px; height: 32px; font-size: 16px; }
        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .logo-highlight {
            background: linear-gradient(to right, #a78bfa, #2dd4bf);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Content Sections */
        .hero {
            position: relative;
            z-index: 10;
            padding: 80px 48px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
        }

        .hero-content {
            max-width: 600px;
        }

        .badge-new {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 100px;
            font-size: 0.875rem;
            color: #d1d5db;
            margin-bottom: 24px;
        }
        .badge-dot {
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            box-shadow: 0 0 10px #4ade80;
        }

        .hero-title {
            font-size: 4rem;
            line-height: 1.1;
            font-weight: 800;
            margin-bottom: 24px;
            letter-spacing: -1px;
        }
        .text-gradient {
            background: linear-gradient(to right, #818cf8, #c084fc, #38bdf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
            font-size: 1.125rem;
            line-height: 1.6;
            color: #9ca3af;
            margin-bottom: 40px;
        }

        .hero-cta {
            display: flex;
            gap: 16px;
        }

        /* Buttons */
        .btn--glass {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            backdrop-filter: blur(10px);
        }
        .btn--glass:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }
        .btn--lg {
            padding: 14px 28px;
            font-size: 1rem;
        }
        .icon-hover svg {
            transition: transform 0.2s;
        }
        .icon-hover:hover svg {
            transform: translateX(4px);
        }

        /* Hero Visual */
        .hero-visual {
            position: relative;
            height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            perspective: 1000px;
        }

        .visual-card {
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .main-card {
            width: 400px;
            height: 300px;
            transform: rotateY(-5deg) rotateX(5deg);
            padding: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid #6366f1;
            box-shadow: 0 0 80px rgba(99, 102, 241, 0.15);
        }

        .card-header-fake {
            background: rgba(0,0,0,0.3);
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .dots { display: flex; gap: 6px; }
        .dots span { width: 10px; height: 10px; border-radius: 50%; background: #374151; }
        .dots span:nth-child(1) { background: #ef4444; }
        .dots span:nth-child(2) { background: #f59e0b; }
        .dots span:nth-child(3) { background: #10b981; }
        .bar { font-family: monospace; font-size: 10px; color: #6b7280; }

        .chat-preview {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-size: 0.875rem;
        }
        .msg {
            padding: 10px 14px;
            border-radius: 12px;
            max-width: 85%;
            line-height: 1.4;
        }
        .msg.ia {
            background: rgba(99, 102, 241, 0.15);
            color: #e0e7ff;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
            border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .msg.user {
            background: #374151;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
        }

        .status-pill {
            margin-top: auto;
            align-self: flex-start;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: #4ade80;
            padding: 6px 12px;
            background: rgba(74, 222, 128, 0.1);
            border-radius: 50px;
        }
        .pulse {
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            animation: pulse-dot 1.5s infinite;
        }

        .floating-card {
            position: absolute;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
            min-width: 180px;
            animation: float 6s ease-in-out infinite;
        }
        .card-1 { top: 60px; right: -20px; animation-delay: 0s; }
        .card-2 { bottom: 80px; left: -40px; animation-delay: 3s; }

        /* Features */
        .features {
            padding: 80px 48px;
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            z-index: 10;
        }
        .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 60px;
            font-weight: 700;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 30px;
        }
        .feature-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            padding: 32px;
            border-radius: 24px;
            transition: all 0.3s;
        }
        .feature-card:hover {
            background: rgba(255,255,255,0.05);
            transform: translateY(-5px);
            border-color: rgba(99, 102, 241, 0.3);
        }
        .icon-box {
            width: 50px;
            height: 50px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            background: rgba(255,255,255,0.05);
        }
        .color-cyan { color: #22d3ee; background: rgba(34, 211, 238, 0.1); }
        .color-violet { color: #a78bfa; background: rgba(167, 139, 250, 0.1); }
        .color-amber { color: #fbbf24; background: rgba(251, 191, 36, 0.1); }
        .color-rose { color: #fb7185; background: rgba(251, 113, 133, 0.1); }

        .feature-card h3 {
            font-size: 1.25rem;
            margin-bottom: 12px;
            font-weight: 600;
        }
        .feature-card p {
            color: #9ca3af;
            line-height: 1.6;
        }

        /* Footer */
        .footer {
            border-top: 1px solid rgba(255,255,255,0.05);
            padding: 40px 48px;
            background: #020617;
            position: relative;
            z-index: 10;
        }
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
        }
        .footer-links {
            display: flex;
            gap: 16px;
            color: #6b7280;
            font-size: 0.875rem;
            align-items: center;
        }
        .footer-links a:hover { color: white; }
        .divider { color: #374151; }

        /* Animations */
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
        }
        @keyframes pulse-dot {
            0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
            100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }

        /* Mobile */
        @media (max-width: 1024px) {
            .hero { grid-template-columns: 1fr; text-align: center; padding: 40px 24px; }
            .hero-content { margin: 0 auto; }
            .hero-cta { justify-content: center; }
            .hero-visual { display: none; }
            .navbar { padding: 20px 24px; }
            .hero-title { font-size: 2.5rem; }
            .features-grid { grid-template-columns: 1fr; }
            .footer-content { flex-direction: column; gap: 20px; }
        }
      `}</style>
    </main>
  )
}
