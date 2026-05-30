import { createClient } from "@/lib/supabase/client";
import type { PreguntaConShuffle } from "@/types/question";
import type { ExamResult } from "./scoring";
import type { ExamConfig } from "@/stores/exam-store";

export async function persistExamResults(
  preguntas: PreguntaConShuffle[],
  respuestas: (number | null)[],
  resultado: ExamResult,
  config: ExamConfig,
  nivelId: string
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const userId = user.id;

  // 1. Upsert tracking per question
  for (let i = 0; i < preguntas.length; i++) {
    if (respuestas[i] === null) continue;

    const preguntaId = preguntas[i].id;
    const acerto = respuestas[i] === preguntas[i]._respuesta ? 1 : 0;

    const { data: existing } = await (supabase.from("tracking") as any)
      .select("vistas, aciertos")
      .eq("user_id", userId)
      .eq("pregunta_id", preguntaId)
      .single();

    if (existing) {
      await (supabase.from("tracking") as any)
        .update({
          vistas: existing.vistas + 1,
          aciertos: existing.aciertos + acerto,
          ultima_fecha: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("pregunta_id", preguntaId);
    } else {
      await (supabase.from("tracking") as any).insert({
        user_id: userId,
        pregunta_id: preguntaId,
        vistas: 1,
        aciertos: acerto,
        ultima_fecha: new Date().toISOString(),
      });
    }
  }

  // 2. Insert exam history
  await (supabase.from("historial_examenes") as any).insert({
    user_id: userId,
    nivel_id: nivelId,
    modo: config.modo,
    total_preguntas: resultado.total,
    correctas: resultado.correctas,
    porcentaje: resultado.porcentaje,
    tiempo_segundos: resultado.tiempoSegundos,
    configuracion: {
      cantidad: config.cantidad,
      dimensiones: config.dimensiones,
      tipos: config.tipos,
    },
    detalles: [{
      porDimension: resultado.porDimension,
      porCategoria: resultado.porCategoria,
    }],
  });
}
