import { api } from "encore.dev/api";

export const attendanceAndDismissalQueueCountsByGrade = api(
  { method: "GET", path: "/attendance-and-dismissal-queue-counts-by-grade", expose: true },
  async (): Promise<string> => {
    return null;
  }
);