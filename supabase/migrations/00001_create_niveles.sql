CREATE TABLE niveles (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  ciclo_escolar TEXT DEFAULT '2026-2027',
  activo BOOLEAN DEFAULT true,
  orden SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO niveles (id, nombre, descripcion, orden) VALUES
  ('inicial-preescolar', 'Educación Inicial y Preescolar', 'Fase 1 y Fase 2 del Plan de Estudio 2022', 1),
  ('primaria', 'Educación Primaria', 'Fase 3, 4 y 5 del Plan de Estudio 2022', 2),
  ('telesecundaria', 'Telesecundaria', 'Fase 6 del Plan de Estudio 2022', 3);
