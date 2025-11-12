export type HifzGrade = "A+" | "A" | "B+" | "B" | "C" | "";

export interface HifzEntry {
  surahName: string;
  surahNum?: number;
  from?: number;
  to?: number;
  grade: HifzGrade;
  lines?: number;
  iterations?: number;
  note?: string;
}

export interface HifzGridData {
  meaning: HifzEntry[];
  memorization: HifzEntry[];
  revision: HifzEntry[];
}

export interface GetHifzDataRequest {
  studyGroupId: string;
  studentId: string;
  date: string;
}

export interface GetHifzDataResponse {
  data: HifzGridData;
}

export interface SaveHifzDataRequest {
  studyGroupId: string;
  studentId: string;
  date: string;
  section: "meaning" | "memorization" | "revision";
  entries: HifzEntry[];
}

export interface SaveHifzDataResponse {
  success: boolean;
}

export interface HifzHistoryEntry {
  date: string;
  section: "meaning" | "memorization" | "revision";
  surahName: string;
  grade: HifzGrade;
}

export interface GetHifzHistoryRequest {
  studyGroupId: string;
  studentId: string;
}

export interface GetHifzHistoryResponse {
  history: HifzHistoryEntry[];
}

export interface GetHifzHistoryByStudentIdRequest {
  studentId: string;
  prevRowsCount?: string;
  startDate?: string;
  endDate?: string;
  surah?: string;
}

export interface GetHifzHistoryByStudentIdResponse {
  history: any[];
}

export interface GetHifzHistoryByParentIdRequest {
  parentId: string;
  prevRowsCount?: string;
  startDate?: string;
  endDate?: string;
  surah?: string;
}

export interface GetHifzHistoryByParentIdResponse {
  history: any[];
}

export interface SurahSetup {
  num: number;
  name_english: string;
  name_arabic: string;
  ayats: number;
}
