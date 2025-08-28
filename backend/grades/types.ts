export interface Grade {
  name: string;
  building: string;
  sortOrder: number;
}

export interface ListGradesResponse {
  grades: Grade[];
}
