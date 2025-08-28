export interface Grade {
  name: string;
  sortOrder: number;
}

export interface ListGradesResponse {
  grades: Grade[];
}
