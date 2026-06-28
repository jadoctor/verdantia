export interface Familia {
  idfamilias: number;
  familiasnombre: string;
  familiasnombrecientifico: string | null;
  familiasgruporotacion: string;
  familiasanosdescanso: number;
  familiascolor: string;
  familiasemoji: string;
  familiasnotas: string | null;
  familiasprecedentes: number[] | null;
  familiassucesores: number[] | null;
  familiasactivosino: number;
  familiasdescripcion?: string | null;
}

export interface FamiliaMin {
  idfamilias: number;
  familiasnombre: string;
  familiasgruporotacion: string;
  familiasemoji: string;
  familiascolor: string;
}

export interface Especie {
  idespeciesvegetales: number;
  especiesvegetalesnombre: string;
  especiesvegetalesicono: string;
  especiesvegetalesvisibilidadsino: number;
}
