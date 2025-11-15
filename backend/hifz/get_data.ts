import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { GetHifzDataRequest, GetHifzDataResponse, HifzEntry } from "./types";
import { SURAHS } from "./surah_data";

export const getData = api(
  { method: "POST", path: "/hifz/get-data", expose: true },
  async (req: GetHifzDataRequest): Promise<GetHifzDataResponse> => {
    try {
      const { data, error } = await supabase
        .from("student_hifz_rcd")
        .select("*")
        .eq("studentid", req.studentId)
        .eq("lesson_date_text", req.date)
        .order("id", { ascending: true });

      if (error) {
        console.error("Failed to fetch hifz data:", error);
        return {
          data: {
            meaning: [],
            memorization: [],
            revision: [],
          },
        };
      }

      const meaning: HifzEntry[] = [];
      const memorization: HifzEntry[] = [];
      const revision: HifzEntry[] = [];

      (data || []).forEach((record: any) => {
        const surah = SURAHS.find((s) => s.name_english === record.surah);
        
        const entry: HifzEntry = {
          surahName: record.surah || "",
          surahNum: surah?.num,
          from: parseInt(record.from) || 1,
          to: parseInt(record.to) || 1,
          grade: record.hifzgrade || "",
          lines: parseInt(record.lines) || 1,
          iterations: 1,
          note: record.notes || "",
        };

        const recordType = record.record_type?.toLowerCase();
        if (recordType === "meaning") {
          meaning.push(entry);
        } else if (recordType === "memorization") {
          memorization.push(entry);
        } else if (recordType === "revision") {
          revision.push(entry);
        }
      });

      return {
        data: {
          meaning,
          memorization,
          revision,
        },
      };
    } catch (err: any) {
      console.error("Failed to fetch hifz data:", err);
      return {
        data: {
          meaning: [],
          memorization: [],
          revision: [],
        },
      };
    }
  }
);
