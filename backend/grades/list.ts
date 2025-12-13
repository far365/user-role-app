import { api } from "encore.dev/api";
import type { ListGradesResponse, Grade } from "./types";

// Static list of grades available in the school system.
export const list = api<void, ListGradesResponse>(
  { expose: true, method: "GET", path: "/grades" },
  async () => {
    const grades: Grade[] = [
      {
        name: "Kindergarten",
        building: "A",
        sortOrder: 0
      },
      {
        name: "1st-section-1",
        building: "A",
        sortOrder: 1
      },
      {
        name: "1st-section-2",
        building: "A",
        sortOrder: 2
      },
      {
        name: "2nd",
        building: "A",
        sortOrder: 3
      },
      {
        name: "3rd",
        building: "A",
        sortOrder: 4
      },
      {
        name: "4th",
        building: "A",
        sortOrder: 5
      },
      {
        name: "5th",
        building: "A",
        sortOrder: 6
      },
      {
        name: "6th",
        building: "A",
        sortOrder: 7
      },
      {
        name: "7th",
        building: "B",
        sortOrder: 8
      },
      {
        name: "8th",
        building: "B",
        sortOrder: 9
      },
      {
        name: "9th",
        building: "B",
        sortOrder: 10
      },
      {
        name: "10th",
        building: "B",
        sortOrder: 11
      } /*,
      {
        name: "11th",
        building: "B",
        sortOrder: 12
      },
      {
        name: "12th",
        building: "B",
        sortOrder: 13
      }*/
    ];

    return { grades };
  }
);
