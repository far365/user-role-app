import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface DebugTableResponse {
  tableExists: boolean;
  recordCount: number;
  sampleRecord: any;
  columnNames: string[];
  errors: string[];
  rawQueryResults: any[];
  tableSchema: any[];
  permissions: string;
}

// Debug endpoint to thoroughly inspect the queuemasterrcd table
export const debugTable = api<void, DebugTableResponse>(
  { expose: true, method: "GET", path: "/queue/debug-table" },
  async () => {
    const result: DebugTableResponse = {
      tableExists: false,
      recordCount: 0,
      sampleRecord: null,
      columnNames: [],
      errors: [],
      rawQueryResults: [],
      tableSchema: [],
      permissions: "unknown"
    };

    console.log("[Queue Debug] === COMPREHENSIVE TABLE DEBUG START ===");

    // Test 1: Check if table exists
    console.log("[Queue Debug] Test 1: Table existence check");
    try {
      const { error: existsError } = await supabase
        .from('queuemasterrcd')
        .select('*')
        .limit(0);
      
      if (existsError) {
        result.errors.push(`Table access error: ${existsError.message} (Code: ${existsError.code})`);
        console.error("[Queue Debug] Table access error:", existsError);
      } else {
        result.tableExists = true;
        console.log("[Queue Debug] Table exists and is accessible");
      }
    } catch (err) {
      result.errors.push(`Table existence check failed: ${err}`);
      console.error("[Queue Debug] Table existence check failed:", err);
    }

    if (!result.tableExists) {
      console.log("[Queue Debug] Table not accessible, returning early");
      return result;
    }

    // Test 2: Get record count using multiple methods
    console.log("[Queue Debug] Test 2: Record count analysis");
    
    // Method 1: Count with exact
    try {
      const { count, error } = await supabase
        .from('queuemasterrcd')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        result.errors.push(`Count (exact) error: ${error.message}`);
      } else {
        result.recordCount = count || 0;
        console.log("[Queue Debug] Exact count:", count);
      }
    } catch (err) {
      result.errors.push(`Count (exact) exception: ${err}`);
    }

    // Method 2: Try to fetch actual records
    try {
      const { data, error } = await supabase
        .from('queuemasterrcd')
        .select('*')
        .limit(10);
      
      if (error) {
        result.errors.push(`Select records error: ${error.message}`);
      } else {
        result.rawQueryResults = data || [];
        console.log("[Queue Debug] Raw query returned:", data?.length || 0, "records");
        
        if (data && data.length > 0) {
          result.sampleRecord = data[0];
          result.columnNames = Object.keys(data[0]);
          result.recordCount = Math.max(result.recordCount, data.length);
          console.log("[Queue Debug] Sample record:", data[0]);
          console.log("[Queue Debug] Column names:", Object.keys(data[0]));
        }
      }
    } catch (err) {
      result.errors.push(`Select records exception: ${err}`);
    }

    // Test 3: Try different table name variations
    console.log("[Queue Debug] Test 3: Table name variations");
    const tableVariations = ['queuemasterrcd', 'QueueMasterRcd', 'QUEUEMASTERRCD', 'queue_master_rcd'];
    
    for (const tableName of tableVariations) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`[Queue Debug] Table variation '${tableName}' works:`, data.length, "records");
          if (data.length > 0 && !result.sampleRecord) {
            result.sampleRecord = data[0];
            result.columnNames = Object.keys(data[0]);
          }
        } else if (error) {
          console.log(`[Queue Debug] Table variation '${tableName}' failed:`, error.message);
        }
      } catch (err) {
        console.log(`[Queue Debug] Table variation '${tableName}' exception:`, err);
      }
    }

    // Test 4: Check table schema if possible
    console.log("[Queue Debug] Test 4: Schema inspection");
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'queuemasterrcd');
      
      if (!schemaError && schemaData) {
        result.tableSchema = schemaData;
        console.log("[Queue Debug] Schema data:", schemaData);
      } else if (schemaError) {
        result.errors.push(`Schema query error: ${schemaError.message}`);
      }
    } catch (err) {
      result.errors.push(`Schema query exception: ${err}`);
    }

    // Test 5: Check column information
    console.log("[Queue Debug] Test 5: Column information");
    try {
      const { data: columnData, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'queuemasterrcd');
      
      if (!columnError && columnData) {
        console.log("[Queue Debug] Column information:", columnData);
        result.columnNames = columnData.map(col => col.column_name);
      } else if (columnError) {
        result.errors.push(`Column query error: ${columnError.message}`);
      }
    } catch (err) {
      result.errors.push(`Column query exception: ${err}`);
    }

    // Test 6: Check RLS policies
    console.log("[Queue Debug] Test 6: RLS policy check");
    try {
      const { data: rlsData, error: rlsError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'queuemasterrcd');
      
      if (!rlsError && rlsData) {
        console.log("[Queue Debug] RLS policies:", rlsData);
        if (rlsData.length > 0) {
          result.permissions = `RLS enabled with ${rlsData.length} policies`;
        } else {
          result.permissions = "No RLS policies found";
        }
      } else if (rlsError) {
        result.errors.push(`RLS query error: ${rlsError.message}`);
      }
    } catch (err) {
      result.errors.push(`RLS query exception: ${err}`);
    }

    // Test 7: Raw SQL approach (if available)
    console.log("[Queue Debug] Test 7: Raw SQL test");
    try {
      const { data: rawData, error: rawError } = await supabase
        .rpc('execute_sql', { sql_query: 'SELECT COUNT(*) as count FROM queuemasterrcd' });
      
      if (!rawError && rawData) {
        console.log("[Queue Debug] Raw SQL count:", rawData);
      } else if (rawError) {
        result.errors.push(`Raw SQL error: ${rawError.message}`);
      }
    } catch (err) {
      result.errors.push(`Raw SQL not available: ${err}`);
    }

    console.log("[Queue Debug] === COMPREHENSIVE TABLE DEBUG END ===");
    console.log("[Queue Debug] Final result:", result);
    
    return result;
  }
);
