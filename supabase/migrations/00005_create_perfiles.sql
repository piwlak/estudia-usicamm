CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  nivel_activo TEXT NOT NULL REFERENCES niveles(id) DEFAULT 'inicial-preescolar',
  niveles_acceso TEXT[] DEFAULT ARRAY['inicial-preescolar']::TEXT[],
  rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario', 'premium', 'admin')),
  preferencias JSONB DEFAULT '{"tema":"claro","fontScale":1}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, nivel_activo, niveles_acceso, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    'inicial-preescolar',
    ARRAY['inicial-preescolar']::TEXT[],
    'usuario'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
