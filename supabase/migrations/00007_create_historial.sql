CREATE TABLE historial_examenes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel_id TEXT NOT NULL REFERENCES niveles(id),
  modo TEXT NOT NULL CHECK (modo IN ('estudio', 'simulacro')),
  total_preguntas INTEGER NOT NULL,
  correctas INTEGER NOT NULL,
  porcentaje INTEGER NOT NULL,
  tiempo_segundos INTEGER,
  configuracion JSONB,
  detalles JSONB,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_historial_user ON historial_examenes(user_id);
CREATE INDEX idx_historial_user_nivel ON historial_examenes(user_id, nivel_id);
