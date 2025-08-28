import { api } from "encore.dev/api";
import type { ListGradesResponse, Grade } from "./types";

// Static list of grades available in the school system.
export const list = api<void, ListGradesResponse>(
  { expose: true, method: "GET", path: "/grades" },
  async () => {
    const grades: Grade[] = [
      {
        name: "kindergarten",
        sortOrder: 0
      },
      {
        name: "1st-section-1",
        sortOrder: 1
      },
      {
        name: "1st-section-2",
        sortOrder: 2
      },
      {
        name: "2nd",
        sortOrder: 3
      },
      {
        name: "3rd",
        sortOrder: 4
      },
      {
        name: "4th",
        sortOrder: 5
      },
      {
        name: "5th",
        sortOrder: 6
      },
      {
        name: "6th",
        sortOrder: 7
      },
      {
        name: "7th",
        sortOrder: 8
      },
      {
        name: "8th",
        sortOrder: 9
      },
      {
        name: "9th",
        sortOrder: 10
      },
      {
        name: "10th",
        sortOrder: 11
      },
      {
        name: "11th",
        sortOrder: 12
      },
      {
        name: "12th",
        sortOrder: 13
      }
    ];

    return { grades };
  }
);
