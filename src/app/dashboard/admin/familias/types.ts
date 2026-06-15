export interface FamiliaList {
  idfamilias: number;
  familiasnombre: string;
  familiasnombrecientifico: string | null;
  familiasgruporotacion: string;
  familiasanosdescanso: number;
  familiascolor: string;
  familiasemoji: string;
  familiasdescripcion: string | null;
  familiasnotas: string | null;
  familiasprecedentes: string | any[] | null;
  familiassucesores: string | any[] | null;
  familiasactivosino: number;
  total_especies: number;
}
