CREATE TABLE reportes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pregunta_id INTEGER NOT NULL REFERENCES preguntas(id),
  motivo TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisado', 'corregido', 'descartado')),
  respuesta_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reportes_estado ON reportes(estado);
CREATE INDEX idx_reportes_user ON reportes(user_id);
