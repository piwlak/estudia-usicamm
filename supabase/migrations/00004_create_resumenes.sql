CREATE TABLE resumenes (
  id SERIAL PRIMARY KEY,
  nivel_id TEXT NOT NULL REFERENCES niveles(id),
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  que_es TEXT NOT NULL,
  ideas_clave JSONB NOT NULL,
  no_es TEXT,
  errores_comunes TEXT,
  orden SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resumenes_nivel ON resumenes(nivel_id);
