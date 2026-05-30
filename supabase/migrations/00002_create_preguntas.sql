CREATE TABLE preguntas (
  id SERIAL PRIMARY KEY,
  nivel_id TEXT NOT NULL REFERENCES niveles(id),
  fuente TEXT,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  dimension TEXT NOT NULL,
  tipo TEXT NOT NULL,
  caso TEXT,
  pregunta TEXT NOT NULL,
  opciones JSONB NOT NULL,
  respuesta SMALLINT NOT NULL CHECK (respuesta >= 0 AND respuesta <= 2),
  explicacion TEXT,
  cita TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_preguntas_nivel ON preguntas(nivel_id);
CREATE INDEX idx_preguntas_nivel_dimension ON preguntas(nivel_id, dimension);
CREATE INDEX idx_preguntas_nivel_categoria ON preguntas(nivel_id, categoria);
CREATE INDEX idx_preguntas_nivel_tipo ON preguntas(nivel_id, tipo);
