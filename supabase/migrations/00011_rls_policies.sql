-- Enable RLS on all tables
ALTER TABLE niveles ENABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE glosario ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_examenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Public content: read for all authenticated users
CREATE POLICY "Niveles are public" ON niveles
  FOR SELECT USING (true);

CREATE POLICY "Active questions readable" ON preguntas
  FOR SELECT USING (activo = true);

CREATE POLICY "Glossary readable" ON glosario
  FOR SELECT USING (true);

CREATE POLICY "Summaries readable" ON resumenes
  FOR SELECT USING (true);

-- User-owned data: CRUD only for the owner
CREATE POLICY "Own profile" ON perfiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Own tracking" ON tracking
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Own history" ON historial_examenes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Own notes" ON notas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Own reports" ON reportes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Own playlists" ON playlists
  FOR ALL USING (auth.uid() = user_id);

-- Admin: full access to content tables
CREATE POLICY "Admin manage questions" ON preguntas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admin manage glossary" ON glosario
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admin manage summaries" ON resumenes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admin view all reports" ON reportes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admin update reports" ON reportes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );
