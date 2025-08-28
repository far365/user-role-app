import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface RawSQLTestResponse {
  testResults: Array<{
    query: string;
    success: boolean;
    result: any;
    error?: string;
    rowCount?: number;
  }>;
  summary: string;
}

// Tests raw SQL queries to understand what's happening with the queuemasterrcd table
export const testRawSQL = api<void, RawSQLTestResponse>(
  { expose: true, method: "GET", path: "/queue/test-raw-sql" },
  async () => {
    const testResults: Array<{
      query: string;
      success: boolean;
      result: any;
      error?: string;
      rowCount?: number;
    }> = [];

    // Test queries to run
    const testQueries = [
      // Basic existence and structure
      "SELECT 1 as test_connection",
      "SELECT COUNT(*) as total_count FROM queuemasterrcd",
      "SELECT * FROM queuemasterrcd LIMIT 1",
      
      // Check table structure
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'queuemasterrcd' ORDER BY ordinal_position",
      
      // Check if table exists with different cases
      "SELECT table_name FROM information_schema.tables WHERE table_name ILIKE 'queuemaster%'",
      
      // Check for any data with different column name formats
      "SELECT queueid FROM queuemasterrcd LIMIT 1",
      "SELECT QUEUEID FROM queuemasterrcd LIMIT 1", 
      "SELECT queue_id FROM queuemasterrcd LIMIT 1",
      
      // Check RLS policies
      "SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'queuemasterrcd'",
      
      // Check table permissions
      "SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_name = 'queuemasterrcd'",
      
      // Try to see all data
      "SELECT * FROM queuemasterrcd",
    ];

    for (const query of testQueries) {
      console.log(`[Raw SQL Test] Testing query: ${query}`);
      
      try {
        // Try using Supabase's rpc function if available
        let result = null;
        let error = null;
        
        try {
          const rpcResult = await supabase.rpc('execute_sql', { sql_query: query });
          result = rpcResult.data;
          error = rpcResult.error;
        } catch (rpcErr) {
          // If RPC is not available, try using regular Supabase queries for some cases
          if (query.includes('SELECT * FROM queuemasterrcd')) {
            const directResult = await supabase.from('queuemasterrcd').select('*');
            result = directResult.data;
            error = directResult.error;
          } else if (query.includes('COUNT(*) as total_count FROM queuemasterrcd')) {
            const countResult = await supabase.from('queuemasterrcd').select('*', { count: 'exact', head: true });
            result = [{ total_count: countResult.count }];
            error = countResult.error;
          } else if (query.includes('information_schema.columns')) {
            const schemaResult = await supabase.from('information_schema.columns')
              .select('column_name, data_type, is_nullable')
              .eq('table_name', 'queuemasterrcd');
            result = schemaResult.data;
            error = schemaResult.error;
          } else if (query.includes('information_schema.tables')) {
            const tablesResult = await supabase.from('information_schema.tables')
              .select('table_name')
              .ilike('table_name', 'queuemaster%');
            result = tablesResult.data;
            error = tablesResult.error;
          } else {
            throw new Error('RPC not available and no direct equivalent');
          }
        }

        if (error) {
          testResults.push({
            query,
            success: false,
            result: null,
            error: error.message || String(error),
          });
          console.log(`[Raw SQL Test] Query failed: ${error.message || error}`);
        } else {
          testResults.push({
            query,
            success: true,
            result,
            rowCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
          });
          console.log(`[Raw SQL Test] Query succeeded:`, result);
        }
      } catch (err) {
        testResults.push({
          query,
          success: false,
          result: null,
          error: err instanceof Error ? err.message : String(err),
        });
        console.log(`[Raw SQL Test] Query exception:`, err);
      }
    }

    // Generate summary
    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;
    
    let summary = `Executed ${totalCount} test queries, ${successCount} succeeded, ${totalCount - successCount} failed.\n\n`;
    
    // Analyze results
    const connectionTest = testResults.find(r => r.query.includes('test_connection'));
    if (connectionTest?.success) {
      summary += "✓ Database connection is working\n";
    } else {
      summary += "✗ Database connection failed\n";
    }

    const countTest = testResults.find(r => r.query.includes('COUNT(*)'));
    if (countTest?.success) {
      const count = countTest.result?.[0]?.total_count;
      summary += `✓ Table accessible, contains ${count} records\n`;
    } else {
      summary += "✗ Cannot access queuemasterrcd table or get count\n";
    }

    const structureTest = testResults.find(r => r.query.includes('information_schema.columns'));
    if (structureTest?.success && structureTest.result?.length > 0) {
      summary += `✓ Table structure accessible, has ${structureTest.result.length} columns\n`;
      summary += "Columns: " + structureTest.result.map((col: any) => col.column_name).join(', ') + "\n";
    } else {
      summary += "✗ Cannot access table structure information\n";
    }

    const rlsTest = testResults.find(r => r.query.includes('pg_policies'));
    if (rlsTest?.success) {
      if (rlsTest.result?.length > 0) {
        summary += `⚠ RLS policies found: ${rlsTest.result.length} policies may be filtering data\n`;
      } else {
        summary += "✓ No RLS policies found\n";
      }
    }

    const dataTest = testResults.find(r => r.query === 'SELECT * FROM queuemasterrcd');
    if (dataTest?.success) {
      summary += `✓ Can query table data, returned ${dataTest.rowCount} records\n`;
    } else {
      summary += "✗ Cannot query table data\n";
    }

    return {
      testResults,
      summary
    };
  }
);
