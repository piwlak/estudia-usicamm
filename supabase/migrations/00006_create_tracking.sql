CREATE TABLE tracking (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pregunta_id INTEGER NOT NULL REFERENCES preguntas(id),
  vistas INTEGER DEFAULT 0,
  aciertos INTEGER DEFAULT 0,
  ultima_fecha TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, pregunta_id)
);

CREATE INDEX idx_tracking_user ON tracking(user_id);
CREATE INDEX idx_tracking_user_pregunta ON tracking(user_id, pregunta_id);
