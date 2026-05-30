CREATE TABLE playlists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel_id TEXT NOT NULL REFERENCES niveles(id),
  nombre TEXT NOT NULL,
  filtros JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_playlists_user ON playlists(user_id);
