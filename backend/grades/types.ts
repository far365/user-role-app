export interface Grade {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
}

export interface ListGradesResponse {
  grades: Grade[];
}
