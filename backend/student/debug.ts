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
  supabaseConfig: any;
  rlsStatus: any;
  schemaInfo: any;
}

// Debug endpoint to check student table contents and structure.
export const debug = api<{ parentID: string }, StudentDebugResponse>(
  { expose: true, method: "GET", path: "/student/debug/:parentID" },
  async ({ parentID }) => {
    try {
      console.log(`[Student Debug] Starting comprehensive Supabase debug for parent ID: ${parentID}`);
      
      // Test 1: Verify Supabase connection and configuration
      let connectionTest = null;
      let supabaseConfig = null;
      try {
        // Test basic Supabase connection
        const { data: connectionData, error: connectionError } = await supabase
          .from('usersrcd')
          .select('count')
          .limit(1);
        
        // Get Supabase client configuration info (without exposing secrets)
        supabaseConfig = {
          supabaseUrl: supabase.supabaseUrl ? 'CONFIGURED' : 'MISSING',
          supabaseKey: supabase.supabaseKey ? 'CONFIGURED' : 'MISSING',
          clientConfigured: !!supabase,
          restUrl: supabase.rest?.url || 'NOT_AVAILABLE'
        };
        
        connectionTest = {
          success: !connectionError,
          error: connectionError?.message || null,
          canConnectToDatabase: true,
          testQuery: 'SELECT count FROM usersrcd LIMIT 1',
          testResult: connectionData
        };
        console.log(`[Student Debug] Supabase connection test:`, connectionTest);
        console.log(`[Student Debug] Supabase config:`, supabaseConfig);
      } catch (err) {
        connectionTest = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown connection error',
          canConnectToDatabase: false
        };
        supabaseConfig = {
          error: 'Failed to get Supabase configuration'
        };
      }

      // Test 2: Check RLS (Row Level Security) status
      let rlsStatus = null;
      try {
        // Try to get RLS information for studentrcd table
        const { data: rlsData, error: rlsError } = await supabase
          .rpc('check_table_rls', { table_name: 'studentrcd' })
          .then(result => result)
          .catch(() => ({ data: null, error: 'RLS check not available' }));

        // Alternative: Try a direct query to see if RLS is blocking
        const { data: directTest, error: directError } = await supabase
          .from('studentrcd')
          .select('*')
          .limit(1);

        rlsStatus = {
          rlsData,
          rlsError: rlsError?.message || null,
          directTestSuccess: !directError,
          directTestError: directError?.message || null,
          directTestRecordCount: directTest?.length || 0
        };
        
        console.log(`[Student Debug] RLS status:`, rlsStatus);
      } catch (err) {
        rlsStatus = {
          error: err instanceof Error ? err.message : 'Unknown RLS error',
          accessible: false
        };
      }

      // Test 3: Get schema information
      let schemaInfo = null;
      try {
        // Try to get table schema information
        const { data: schemaData, error: schemaError } = await supabase
          .rpc('get_table_schema', { table_name: 'studentrcd' })
          .then(result => result)
          .catch(() => ({ data: null, error: 'Schema RPC not available' }));

        // Alternative: Try to get column information
        const { data: columnsTest, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'studentrcd')
          .then(result => result)
          .catch(() => ({ data: null, error: 'Information schema not accessible' }));

        schemaInfo = {
          schemaData,
          schemaError: schemaError?.message || null,
          columnsTest,
          columnsError: columnsError?.message || null
        };
        
        console.log(`[Student Debug] Schema info:`, schemaInfo);
      } catch (err) {
        schemaInfo = {
          error: err instanceof Error ? err.message : 'Unknown schema error'
        };
      }

      // Test 4: Check if studentrcd table exists and get raw info
      let tableExists = false;
      let rawTableInfo = null;
      try {
        // Try a simple query to see if table exists
        const { data: testData, error: testError } = await supabase
          .from('studentrcd')
          .select('*')
          .limit(0); // Get no rows, just test if table exists

        tableExists = !testError;
        rawTableInfo = {
          testError: testError?.message || null,
          tableAccessible: !testError,
          errorCode: testError?.code || null,
          errorDetails: testError?.details || null,
          errorHint: testError?.hint || null
        };
        
        console.log(`[Student Debug] Table existence test:`, { tableExists, rawTableInfo });
      } catch (err) {
        rawTableInfo = {
          error: err instanceof Error ? err.message : 'Unknown table error',
          tableAccessible: false
        };
      }

      // Test 5: Get all studentrcd records with detailed logging
      console.log(`[Student Debug] Attempting to fetch all studentrcd records from Supabase...`);
      const { data: studentrcdRecords, error: studentError } = await supabase
        .from('studentrcd')
        .select('*');

      console.log(`[Student Debug] All students query:`, {
        recordCount: studentrcdRecords?.length || 0,
        error: studentError?.message || null,
        errorCode: studentError?.code || null,
        errorDetails: studentError?.details || null,
        firstRecord: studentrcdRecords?.[0] || null
      });

      // Test 6: Get all parentrcd records for reference
      const { data: parentrcdRecords, error: parentError } = await supabase
        .from('parentrcd')
        .select('*');

      console.log(`[Student Debug] All parents query:`, {
        recordCount: parentrcdRecords?.length || 0,
        error: parentError?.message || null
      });

      // Test 7: Get specific students for this parent with multiple approaches
      console.log(`[Student Debug] Testing specific parent query: parentid = '${parentID}'`);
      
      // Approach 1: Standard .eq()
      const { data: specificStudentsForParent, error: specificError } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', parentID);

      console.log(`[Student Debug] Specific query (eq):`, {
        recordCount: specificStudentsForParent?.length || 0,
        error: specificError?.message || null,
        errorCode: specificError?.code || null,
        records: specificStudentsForParent || []
      });

      // Test 8: Test the exact same query that should work with different approaches
      const { data: directQueryResult, error: directQueryError } = await supabase
        .from('studentrcd')
        .select('*')
        .eq('parentid', 'p0001');

      console.log(`[Student Debug] Direct p0001 query:`, {
        recordCount: directQueryResult?.length || 0,
        error: directQueryError?.message || null,
        errorCode: directQueryError?.code || null,
        records: directQueryResult || []
      });

      // Test 9: Try to get table structure
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
            sampleData: sampleRecord,
            dataTypes: Object.keys(sampleRecord).reduce((acc, key) => {
              acc[key] = typeof sampleRecord[key];
              return acc;
            }, {} as Record<string, string>)
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

      // Test 10: Test different query approaches
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

        // Test with contains
        const { data: testData3, error: testError3 } = await supabase
          .from('studentrcd')
          .select('*')
          .contains('parentid', [parentID]);

        // Test raw SQL approach if available
        let rawSqlResult = null;
        try {
          const { data: rawData, error: rawError } = await supabase
            .rpc('execute_sql', { 
              sql_query: `SELECT * FROM studentrcd WHERE parentid = '${parentID}'` 
            })
            .then(result => result)
            .catch(() => ({ data: null, error: 'Raw SQL not available' }));
          
          rawSqlResult = { rawData, rawError: rawError?.message || null };
        } catch (rawErr) {
          rawSqlResult = { error: 'Raw SQL execution failed' };
        }
        
        queryTest = {
          filterApproach: { 
            data: testData1, 
            error: testError1?.message || null,
            count: testData1?.length || 0
          },
          ilikeApproach: { 
            data: testData2, 
            error: testError2?.message || null,
            count: testData2?.length || 0
          },
          containsApproach: { 
            data: testData3, 
            error: testError3?.message || null,
            count: testData3?.length || 0
          },
          rawSqlResult
        };
      } catch (err) {
        queryTest = {
          error: err instanceof Error ? err.message : 'Query test failed'
        };
      }

      console.log('Student Debug comprehensive Supabase results:', {
        connectionTest,
        supabaseConfig,
        rlsStatus,
        schemaInfo,
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
        rawTableInfo: rawTableInfo || null,
        supabaseConfig: supabaseConfig || null,
        rlsStatus: rlsStatus || null,
        schemaInfo: schemaInfo || null
      };

    } catch (error) {
      console.error("Student debug comprehensive Supabase error:", error);
      throw new Error(`Student debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
