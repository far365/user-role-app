export interface Student {
  studentID: string;
  parentID: string;
  studentName: string;
  grade?: string;
  class?: string;
  studentStatus?: string;
  dateOfBirth?: Date;
  emergencyContact?: string;
  medicalInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetStudentsByParentResponse {
  students: Student[];
}
