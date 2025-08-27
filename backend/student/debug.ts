import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface StudentDebugResponse {
  studentrcdRecords: any[];
  parentrcdRecords: any[];
  specificStudentsForParent: any[];
  tableStructure: any;
  parentID: string;
  queryTest: any;
  directQueryResult: any;
  connectionTest: any;
  tableExists: boolean;
  rawTableInfo: any;
}

// Debug endpoint to check student table contents and structure.
export const debug = api<{ parentID: string }, StudentDebugResponse>(
  { expose: true, method: "GET", path: "/student/debug/:parentID" },
  async ({ parentID }) => {
    try {
      console.log(`[Student Debug] Starting comprehensive debug for parent ID: ${parentID}`);
      
      // Test 1: Basic connection test
      let connectionTest = null;
      try {
        const { data: connectionData, error: connectionError } = await supabase
          .from('usersrcd')
          .select('count')
          .limit(1);
        
        connectionTest = {
          success: !connectionError,
          error: connectionError?.message || null,
          canConnectToDatabase: true
        };
        console.log(`[Student Debug] Connection test:`, connectionTest);
      } catch (err) {
        connectionTest = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown connection error',
          canConnectToDatabase: false
        };
      }

      // Test 2: Check if studentrcd table exists and get raw info
      let tableExists = false;
      let rawTableInfo = null;
      try {
        // Try to get table schema information
        const { data: schemaData, error: schemaError } = await supabase
          .rpc('get_table_info', { table_name: 'studentrcd' })
          .then(result => result)
          .catch(() => ({ data: null, error: 'RPC not available' }));

        // Alternative: Try a simple query to see if table exists
        const { data: testData, error: testError } = await supabase
          .from('studentrcd')
          .select('*')
          .limit(0); // Get no rows, just test if table exists

        tableExists = !testError;
        rawTableInfo = {
          schemaData,
          schemaError,
          testError: testError?.message || null,
          tableAccessible: !testError
        };
        
        console.log(`[Student Debug] Table existence test:`, { tableExists, rawTableInfo });
      } catch (err) {
        rawTableInfo = {
          error: err instanceof Error ? err.message : 'Unknown table error',
          tableAccessible: false
        };
      }

      // Test 3: Get all studentrcd records with detailed logging
      console.log(`[Student Debug] Attempting to fetch all studentrcd records...`);
      const { data: studentrcdRecords, error: studentError } = await supabase
        .from('studentrcd')
        .select('*');

      console.log(`[Student Debug] All students query:`, {
        recordCount: studentrcdRecords?.length || 0,
        error: studentError?.message || null,
        firstRecord: studentrcdRecords?.[0] || null
      });

      // Test 4: Get all parentrcd records for reference
      const { data: parentrcdRecords, error: parentError } = await supabase
        .from('parentrcd')
        .select('*');

      console.log(`[Student Debug] All parents query:`, {
        recordCount: parentrcdRecords?.length || 0,
        error: parentError?.message || null
      });

      // Test 5: Get specific students for this parent with multiple approaches
      console.log(`[Student Debug] Testing specific parent query: parentid = '${parentID}'`);
      
      // Approach 1: Standard .eq()
      const { data: specificStudentsForParent, error: specificError } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', parentID);

      console.log(`[Student Debug] Specific query (eq):`, {
        recordCount: specificStudentsForParent?.length || 0,
        error: specificError?.message || null,
        records: specificStudentsForParent || []
      });

      // Test 6: Test the exact same query that should work with different approaches
      const { data: directQueryResult, error: directQueryError } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', 'p0001');

      console.log(`[Student Debug] Direct p0001 query:`, {
        recordCount: directQueryResult?.length || 0,
        error: directQueryError?.message || null,
        records: directQueryResult || []
      });

      // Test 7: Try to get table structure
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
        } else {
          tableStructure = {
            columns: [],
            sampleData: null,
            note: 'No records in table to determine structure'
          };
        }
      } catch (err) {
        tableStructure = {
          error: err instanceof Error ? err.message : 'Unknown structure error',
          columns: [],
          sampleData: null
        };
      }

      // Test 8: Test different query approaches
      let queryTest = null;
      try {
        // Test with filter approach
        const { data: testData1, error: testError1 } = await supabase
          .from('studentrcd')
          .select('*')
          .filter('parentid', 'eq', parentID);

        // Test with ilike (case insensitive)
        const { data: testData2, error: testError2 } = await supabase
          .from('studentrcd')
          .select('*')
          .ilike('parentid', parentID);

        // Test with raw SQL if available
        let rawSqlResult = null;
        try {
          const { data: rawData, error: rawError } = await supabase
            .rpc('execute_sql', { 
              sql_query: `SELECT * FROM studentrcd WHERE parentid = '${parentID}'` 
            })
            .then(result => result)
            .catch(() => ({ data: null, error: 'Raw SQL not available' }));
          
          rawSqlResult = { rawData, rawError };
        } catch (rawErr) {
          rawSqlResult = { error: 'Raw SQL execution failed' };
        }
        
        queryTest = {
          filterApproach: { data: testData1, error: testError1?.message || null },
          ilikeApproach: { data: testData2, error: testError2?.message || null },
          rawSqlResult
        };
      } catch (err) {
        queryTest = {
          error: err instanceof Error ? err.message : 'Query test failed'
        };
      }

      console.log('Student Debug comprehensive results:', {
        connectionTest,
        tableExists,
        studentrcdCount: studentrcdRecords?.length || 0,
        parentrcdCount: parentrcdRecords?.length || 0,
        specificStudentsCount: specificStudentsForParent?.length || 0,
        directQueryCount: directQueryResult?.length || 0,
        errors: {
          studentError: studentError?.message || null,
          parentError: parentError?.message || null,
          specificError: specificError?.message || null,
          directQueryError: directQueryError?.message || null
        }
      });

      return {
        studentrcdRecords: studentrcdRecords || [],
        parentrcdRecords: parentrcdRecords || [],
        specificStudentsForParent: specificStudentsForParent || [],
        tableStructure: tableStructure || null,
        parentID: parentID,
        queryTest: queryTest || null,
        directQueryResult: directQueryResult || [],
        connectionTest: connectionTest || null,
        tableExists,
        rawTableInfo: rawTableInfo || null
      };

    } catch (error) {
      console.error("Student debug comprehensive error:", error);
      throw new Error(`Student debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
