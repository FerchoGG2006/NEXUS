import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXUS TECH-ADMIN | Sistema de Gestión y Ventas",
  description: "Sistema de gestión y ventas para accesorios tecnológicos. Automatiza ventas, gestiona inventario inteligente y maneja una red de afiliados y clientes B2B.",
  keywords: ["gestión", "ventas", "inventario", "afiliados", "B2B", "accesorios tecnológicos"],
  authors: [{ name: "NEXUS TECH-ADMIN" }],
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
