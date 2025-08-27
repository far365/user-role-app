import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface StudentDebugResponse {
  studentrcdRecords: any[];
  parentrcdRecords: any[];
  specificStudentsForParent: any[];
  tableStructure: any;
  parentID: string;
}

// Debug endpoint to check student table contents and structure.
export const debug = api<{ parentID: string }, StudentDebugResponse>(
  { expose: true, method: "GET", path: "/student/debug/:parentID" },
  async ({ parentID }) => {
    try {
      console.log(`[Student Debug] Starting debug for parent ID: ${parentID}`);
      
      // Get all studentrcd records
      const { data: studentrcdRecords, error: studentError } = await supabase
        .from('studentrcd')
        .select('*');

      // Get all parentrcd records for reference
      const { data: parentrcdRecords, error: parentError } = await supabase
        .from('parentrcd')
        .select('*');

      // Get specific students for this parent
      const { data: specificStudentsForParent, error: specificError } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', parentID);

      // Try to get table structure
      let tableStructure = null;
      try {
        const { data: sampleRecord } = await supabase
          .from('studentrcd')
          .select('*')
          .limit(1)
          .single();
        
        if (sampleRecord) {
          tableStructure = {
            columns: Object.keys(sampleRecord),
            sampleData: sampleRecord
          };
        }
      } catch (err) {
        console.log("Could not get table structure:", err);
      }

      console.log('Student Debug results:', {
        studentrcdCount: studentrcdRecords?.length || 0,
        parentrcdCount: parentrcdRecords?.length || 0,
        specificStudentsCount: specificStudentsForParent?.length || 0,
        studentError,
        parentError,
        specificError,
        tableStructure
      });

      return {
        studentrcdRecords: studentrcdRecords || [],
        parentrcdRecords: parentrcdRecords || [],
        specificStudentsForParent: specificStudentsForParent || [],
        tableStructure: tableStructure || null,
        parentID: parentID
      };

    } catch (error) {
      console.error("Student debug error:", error);
      throw new Error("Student debug failed");
    }
  }
);
