import type { NivelId, Rol } from "./database";

export interface UserProfile {
  id: string;
  nombre: string | null;
  nivel_activo: NivelId;
  niveles_acceso: NivelId[];
  rol: Rol;
  preferencias: {
    tema: "claro" | "oscuro";
    fontScale: number;
  };
}

export interface TrackingEntry {
  pregunta_id: number;
  vistas: number;
  aciertos: number;
  ultima_fecha: string | null;
}
