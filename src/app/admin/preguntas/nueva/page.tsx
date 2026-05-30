"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NuevaPreguntaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nivel_id: "inicial-preescolar",
    fuente: "",
    categoria: "",
    subcategoria: "",
    dimension: "",
    tipo: "directo",
    caso: "",
    pregunta: "",
    opciones: ["", "", "", ""],
    respuesta: 0,
    explicacion: "",
    cita: "",
    activo: true,
  });

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateOpcion = (index: number, value: string) => {
    const newOpciones = [...form.opciones];
    newOpciones[index] = value;
    setForm((prev) => ({ ...prev, opciones: newOpciones }));
  };

  const addOpcion = () => {
    setForm((prev) => ({ ...prev, opciones: [...prev.opciones, ""] }));
  };

  const removeOpcion = (index: number) => {
    if (form.opciones.length <= 2) return;
    const newOpciones = form.opciones.filter((_, i) => i !== index);
    setForm((prev) => ({
      ...prev,
      opciones: newOpciones,
      respuesta: prev.respuesta >= newOpciones.length ? 0 : prev.respuesta,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!form.pregunta.trim() || !form.categoria.trim() || !form.dimension.trim()) {
      setError("Pregunta, categoría y dimensión son obligatorios");
      setSaving(false);
      return;
    }

    if (form.opciones.some((o) => !o.trim())) {
      setError("Todas las opciones deben tener texto");
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase.from("preguntas").insert({
      nivel_id: form.nivel_id,
      fuente: form.fuente || null,
      categoria: form.categoria,
      subcategoria: form.subcategoria || null,
      dimension: form.dimension,
      tipo: form.tipo,
      caso: form.caso || null,
      pregunta: form.pregunta,
      opciones: form.opciones,
      respuesta: form.respuesta,
      explicacion: form.explicacion || null,
      cita: form.cita || null,
      activo: form.activo,
    } as any);

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/preguntas");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Nueva Pregunta
        </h1>
        <Link
          href="/admin/preguntas"
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Volver a preguntas
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nivel
            </label>
            <select
              value={form.nivel_id}
              onChange={(e) => updateField("nivel_id", e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="inicial-preescolar">Inicial y Preescolar</option>
              <option value="primaria">Primaria</option>
              <option value="telesecundaria">Telesecundaria</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tipo
            </label>
            <select
              value={form.tipo}
              onChange={(e) => updateField("tipo", e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="directo">Directo</option>
              <option value="caso">Caso</option>
              <option value="valoracion">Valoración</option>
              <option value="completamiento">Completamiento</option>
              <option value="secuencia">Secuencia</option>
              <option value="multireactivo">Multireactivo</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Categoría *
            </label>
            <input
              type="text"
              value={form.categoria}
              onChange={(e) => updateField("categoria", e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subcategoría
            </label>
            <input
              type="text"
              value={form.subcategoria}
              onChange={(e) => updateField("subcategoria", e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Dimensión *
            </label>
            <input
              type="text"
              value={form.dimension}
              onChange={(e) => updateField("dimension", e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fuente
            </label>
            <input
              type="text"
              value={form.fuente}
              onChange={(e) => updateField("fuente", e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {(form.tipo === "caso" || form.tipo === "multireactivo") && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Caso / Contexto
            </label>
            <textarea
              value={form.caso}
              onChange={(e) => updateField("caso", e.target.value)}
              rows={3}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Pregunta *
          </label>
          <textarea
            value={form.pregunta}
            onChange={(e) => updateField("pregunta", e.target.value)}
            rows={3}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Opciones
          </label>
          <div className="space-y-2">
            {form.opciones.map((opcion, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="respuesta"
                  checked={form.respuesta === index}
                  onChange={() => updateField("respuesta", index)}
                  className="text-indigo-600"
                />
                <input
                  type="text"
                  value={opcion}
                  onChange={(e) => updateOpcion(index, e.target.value)}
                  placeholder={`Opción ${index + 1}`}
                  className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeOpcion(index)}
                  className="text-red-500 hover:text-red-700 text-sm px-2"
                >
                  X
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOpcion}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            + Agregar opción
          </button>
          <p className="text-xs text-slate-500 mt-1">
            El radio seleccionado indica la respuesta correcta (índice {form.respuesta})
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Explicación
          </label>
          <textarea
            value={form.explicacion}
            onChange={(e) => updateField("explicacion", e.target.value)}
            rows={3}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Cita / Referencia
          </label>
          <input
            type="text"
            value={form.cita}
            onChange={(e) => updateField("cita", e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activo"
            checked={form.activo}
            onChange={(e) => updateField("activo", e.target.checked)}
            className="rounded text-indigo-600"
          />
          <label
            htmlFor="activo"
            className="text-sm text-slate-700 dark:text-slate-300"
          >
            Pregunta activa
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Crear Pregunta"}
          </button>
          <Link
            href="/admin/preguntas"
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
