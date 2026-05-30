export const dynamic = "force-dynamic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = (await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single()) as { data: { rol: string } | null };

  if (perfil?.rol !== "admin") redirect("/dashboard");

  const navItems = [
    { href: "/admin", label: "Inicio" },
    { href: "/admin/preguntas", label: "Preguntas" },
    { href: "/admin/usuarios", label: "Usuarios" },
    { href: "/admin/reportes", label: "Reportes" },
    { href: "/admin/analytics", label: "Analytics" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
