import { api } from "encore.dev/api";
import type { ListGradesResponse, Grade } from "./types";

// Static list of grades available in the school system.
export const list = api<void, ListGradesResponse>(
  { expose: true, method: "GET", path: "/grades" },
  async () => {
    const grades: Grade[] = [
      {
        id: "K",
        name: "kindergarten",
        displayName: "Kindergarten",
        sortOrder: 0
      },
      {
        id: "1-1",
        name: "1st-section-1",
        displayName: "1st - Section 1",
        sortOrder: 1
      },
      {
        id: "1-2",
        name: "1st-section-2",
        displayName: "1st - Section 2",
        sortOrder: 2
      },
      {
        id: "2",
        name: "2nd",
        displayName: "2nd",
        sortOrder: 3
      },
      {
        id: "3",
        name: "3rd",
        displayName: "3rd",
        sortOrder: 4
      },
      {
        id: "4",
        name: "4th",
        displayName: "4th",
        sortOrder: 5
      },
      {
        id: "5",
        name: "5th",
        displayName: "5th",
        sortOrder: 6
      },
      {
        id: "6",
        name: "6th",
        displayName: "6th",
        sortOrder: 7
      },
      {
        id: "7",
        name: "7th",
        displayName: "7th",
        sortOrder: 8
      },
      {
        id: "8",
        name: "8th",
        displayName: "8th",
        sortOrder: 9
      },
      {
        id: "9",
        name: "9th",
        displayName: "9th",
        sortOrder: 10
      },
      {
        id: "10",
        name: "10th",
        displayName: "10th",
        sortOrder: 11
      },
      {
        id: "11",
        name: "11th",
        displayName: "11th",
        sortOrder: 12
      },
      {
        id: "12",
        name: "12th",
        displayName: "12th",
        sortOrder: 13
      }
    ];

    return { grades };
  }
);
