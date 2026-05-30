import type { Metadata, Viewport } from "next";
import "./globals.css";
import OfflineBanner from "@/components/pwa/OfflineBanner";

export const metadata: Metadata = {
  title: "Estudia USICAMM — Simulador de Admisión Docente",
  description:
    "Plataforma profesional de estudio para el examen de Admisión Docente USICAMM. Inicial y Preescolar, Primaria y Telesecundaria.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#667eea",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100">
        {children}
        <OfflineBanner />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
