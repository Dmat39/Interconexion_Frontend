export type EstadoVecino = 'CITA' | 'INTERCONEXIÓN' | 'PENDIENTE' | 'CANCELADO';
export type EstadoVisita = 'PROGRAMADA' | 'COMPLETADA' | 'NO_ATENDIDO' | 'REPROGRAMAR';
export type EstadoGrupo = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO';
export type EstadoVecinal = 'ACTIVA' | 'INACTIVA' | 'RECUPERAR';

export interface Vecino {
  id: string;
  nombre: string;
  celular?: string;
  direccion?: string;
  lat?: number;
  lng?: number;
  nombre_gestor?: string;
  estado: EstadoVecino;
  fecha_tentativa?: string;
  tiene_internet?: boolean;
  visualiza_camaras_celular?: boolean;
  aplicativo?: string;
  herramientas_extra?: string;
  marca?: string;
  tipo_camara?: string;
  nombre_grabador?: string;
  contrasena?: string;
  num_camaras?: number;
  sector?: string;
  mes?: string;
  fecha_registro?: string;
  camaras?: CamaraVecino[];
  visitas?: Visita[];
  created_at: string;
  updated_at: string;
}

export interface CamaraVecino {
  id: string;
  vecino_id: string;
  numero_camara: number;
  lat: number;
  lng: number;
  descripcion?: string;
  created_at: string;
}

export interface GrupoVisita {
  id: string;
  nombre: string;
  tecnico: string;
  fecha: string;
  sector?: string;
  estado: EstadoGrupo;
  urbanizacion_id?: string;
  urbanizacion?: Urbanizacion;
  observaciones?: string;
  visitas?: Visita[];
  created_at: string;
  updated_at: string;
}

export interface Visita {
  id: string;
  vecino_id: string;
  vecino?: Vecino;
  grupo_id?: string;
  grupo?: GrupoVisita;
  orden?: number;
  fecha_programada: string;
  hora_programada?: string;
  tecnico: string;
  estado: EstadoVisita;
  observaciones?: string;
  resultado?: string;
  created_at: string;
  updated_at: string;
}

export interface Recuperacion {
  id: string;
  vecino_id: string;
  vecino?: Vecino;
  sector: string;
  fecha_recuperacion: string;
  tecnico: string;
  observaciones?: string;
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Urbanizacion {
  id: string;
  nombre: string;
  sector?: string;
  descripcion?: string;
  vecinos?: Vecino[];
  created_at: string;
  updated_at: string;
}

export interface VecinalActiva {
  id: string;
  nombre: string;
  direccion?: string;
  sector?: string;
  tecnico?: string;
  num_camaras?: number;
  observaciones?: string;
  estado: EstadoVecinal;
  vecino_id?: string;
  vecino?: Vecino;
  created_at: string;
  updated_at: string;
}