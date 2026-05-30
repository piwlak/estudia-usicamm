CREATE TABLE notas (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pregunta_id INTEGER NOT NULL REFERENCES preguntas(id),
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, pregunta_id)
);

CREATE INDEX idx_notas_user ON notas(user_id);
