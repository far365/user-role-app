export interface Student {
  studentId: string;
  studentStatus: string;
  studentName: string;
  grade: string;
  classBuilding: string;
  parentId: string;
  attendanceStatus: string;
  dismissalInstructions: string;
  otherNote: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetStudentsByParentResponse {
  students: Student[];
}

export interface AbsenceHistoryRecord {
  [key: string]: any;
}

export interface GetAbsenceHistoryResponse {
  absenceHistory: AbsenceHistoryRecord[];
}
