"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nivel, setNivel] = useState("inicial-preescolar");
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!acepto) {
      setError("Debes aceptar los términos para continuar.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, nivel_activo: nivel },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data.user) {
        await (supabase.from("perfiles") as any)
          .update({
            nivel_activo: nivel,
            niveles_acceso: [nivel],
          })
          .eq("id", data.user.id);
      }
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-2xl font-extrabold">
            U
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Crear cuenta
          </h1>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <p className="font-semibold">Antes de registrarte:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              Este simulador <strong>no es oficial</strong> ni está respaldado
              por la USICAMM o la SEP.
            </li>
            <li>
              Las preguntas son ejercicios de práctica basados en la
              bibliografía oficial 2026-2027.
            </li>
            <li>
              Las respuestas son criterio del autor y{" "}
              <strong>pueden contener errores</strong>.
            </li>
            <li>
              Esta app <strong>no garantiza aprobación</strong>.
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label
              htmlFor="nivel"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              ¿Qué nivel vas a presentar?
            </label>
            <select
              id="nivel"
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition"
            >
              <option value="inicial-preescolar">Inicial y Preescolar</option>
              <option value="primaria">Primaria</option>
              <option value="telesecundaria">Telesecundaria</option>
            </select>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Puedes cambiar de nivel después desde el menú.
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acepto}
              onChange={(e) => setAcepto(e.target.checked)}
              className="mt-0.5 rounded border-slate-300"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Entiendo y acepto que este es un simulador no oficial y
              complementario.
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-[var(--primary)] font-medium hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
