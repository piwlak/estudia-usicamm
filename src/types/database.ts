export type NivelId = "inicial-preescolar" | "primaria" | "telesecundaria";
export type Rol = "usuario" | "premium" | "admin";
export type ModoExamen = "estudio" | "simulacro";
export type TipoPregunta = "directo" | "caso" | "valoracion" | "completamiento" | "secuencia" | "multireactivo";
export type EstadoReporte = "pendiente" | "revisado" | "corregido" | "descartado";

export interface Database {
  public: {
    Tables: {
      niveles: {
        Row: {
          id: NivelId;
          nombre: string;
          descripcion: string | null;
          ciclo_escolar: string;
          activo: boolean;
          orden: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["niveles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["niveles"]["Insert"]>;
      };
      preguntas: {
        Row: {
          id: number;
          nivel_id: NivelId;
          fuente: string | null;
          categoria: string;
          subcategoria: string | null;
          dimension: string;
          tipo: TipoPregunta;
          caso: string | null;
          pregunta: string;
          opciones: string[];
          respuesta: number;
          explicacion: string | null;
          cita: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["preguntas"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["preguntas"]["Insert"]>;
      };
      glosario: {
        Row: {
          id: number;
          nivel_id: NivelId;
          seccion: string;
          sigla: string;
          termino: string;
          definicion: string;
          orden: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["glosario"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["glosario"]["Insert"]>;
      };
      resumenes: {
        Row: {
          id: number;
          nivel_id: NivelId;
          categoria: string;
          titulo: string;
          que_es: string;
          ideas_clave: string[];
          no_es: string | null;
          errores_comunes: string | null;
          orden: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["resumenes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["resumenes"]["Insert"]>;
      };
      perfiles: {
        Row: {
          id: string;
          nombre: string | null;
          nivel_activo: NivelId;
          niveles_acceso: NivelId[];
          rol: Rol;
          preferencias: {
            tema: "claro" | "oscuro";
            fontScale: number;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["perfiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["perfiles"]["Insert"]>;
      };
      tracking: {
        Row: {
          id: number;
          user_id: string;
          pregunta_id: number;
          vistas: number;
          aciertos: number;
          ultima_fecha: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tracking"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["tracking"]["Insert"]>;
      };
      historial_examenes: {
        Row: {
          id: number;
          user_id: string;
          nivel_id: NivelId;
          modo: ModoExamen;
          total_preguntas: number;
          correctas: number;
          porcentaje: number;
          tiempo_segundos: number | null;
          configuracion: Record<string, unknown> | null;
          detalles: Record<string, unknown>[] | null;
          descripcion: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["historial_examenes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["historial_examenes"]["Insert"]>;
      };
      notas: {
        Row: {
          id: number;
          user_id: string;
          pregunta_id: number;
          texto: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notas"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["notas"]["Insert"]>;
      };
      reportes: {
        Row: {
          id: number;
          user_id: string;
          pregunta_id: number;
          motivo: string | null;
          estado: EstadoReporte;
          respuesta_admin: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reportes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reportes"]["Insert"]>;
      };
      playlists: {
        Row: {
          id: number;
          user_id: string;
          nivel_id: NivelId;
          nombre: string;
          filtros: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["playlists"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["playlists"]["Insert"]>;
      };
    };
  };
}
