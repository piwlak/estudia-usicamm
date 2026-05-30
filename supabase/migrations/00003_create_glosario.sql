CREATE TABLE glosario (
  id SERIAL PRIMARY KEY,
  nivel_id TEXT NOT NULL REFERENCES niveles(id),
  seccion TEXT NOT NULL,
  sigla TEXT NOT NULL,
  termino TEXT NOT NULL,
  definicion TEXT NOT NULL,
  orden SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_glosario_nivel ON glosario(nivel_id);
