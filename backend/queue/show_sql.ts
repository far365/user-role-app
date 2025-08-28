import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

interface SQLQueryInfo {
  operation: string;
  table: string;
  query: string;
  description: string;
}

interface ShowSQLResponse {
  queries: SQLQueryInfo[];
  notes: string[];
}

// Shows the actual SQL queries used by the queue operations
export const showSQL = api<void, ShowSQLResponse>(
  { expose: true, method: "GET", path: "/queue/show-sql" },
  async () => {
    const queries: SQLQueryInfo[] = [];
    const notes: string[] = [];

    // Note: Supabase client doesn't expose the raw SQL directly,
    // but we can show the equivalent SQL for each operation

    queries.push({
      operation: "Table Existence Check",
      table: "queuemasterrcd",
      query: `SELECT * FROM queuemasterrcd LIMIT 0;`,
      description: "Checks if the table exists and is accessible"
    });

    queries.push({
      operation: "Count Records (Exact)",
      table: "queuemasterrcd", 
      query: `SELECT COUNT(*) FROM queuemasterrcd;`,
      description: "Gets exact count of all records in the table"
    });

    queries.push({
      operation: "Count Records (Planned)",
      table: "queuemasterrcd",
      query: `EXPLAIN (FORMAT JSON) SELECT * FROM queuemasterrcd;`,
      description: "Gets estimated count from query planner statistics"
    });

    queries.push({
      operation: "Count Records (Estimated)",
      table: "queuemasterrcd",
      query: `SELECT reltuples::BIGINT AS estimate FROM pg_class WHERE relname = 'queuemasterrcd';`,
      description: "Gets estimated count from PostgreSQL statistics"
    });

    queries.push({
      operation: "Fetch One Record",
      table: "queuemasterrcd",
      query: `SELECT * FROM queuemasterrcd LIMIT 1;`,
      description: "Fetches one record to check table structure and data"
    });

    queries.push({
      operation: "List All Queues",
      table: "queuemasterrcd",
      query: `SELECT * FROM queuemasterrcd ORDER BY queueid DESC;`,
      description: "Fetches all queue records ordered by queue ID (newest first)"
    });

    queries.push({
      operation: "List with Specific Columns",
      table: "queuemasterrcd",
      query: `SELECT queueid, queuestarttime, queuestartedbyusername, queueendtime, queueclosedbyusername, queuemasterstatus, lastupdatedttm, archiveddttm FROM queuemasterrcd ORDER BY queueid DESC;`,
      description: "Fetches queues with explicit column names (lowercase)"
    });

    queries.push({
      operation: "List with Uppercase Columns",
      table: "queuemasterrcd",
      query: `SELECT QUEUEID, QUEUESTARTTIME, QUEUESTARTEDBYUSERNAME, QUEUEENDTIME, QUEUECLOSEDBYUSERNAME, QUEUEMASTERSTATUS, LASTUPDATEDTTM, ARCHIVEDDTTM FROM queuemasterrcd ORDER BY QUEUEID DESC;`,
      description: "Fetches queues with uppercase column names"
    });

    queries.push({
      operation: "List with Snake Case Columns",
      table: "queuemasterrcd",
      query: `SELECT queue_id, queue_start_time, queue_started_by_username, queue_end_time, queue_closed_by_username, queue_master_status, last_updated_ttm, archived_dttm FROM queuemasterrcd ORDER BY queue_id DESC;`,
      description: "Fetches queues with snake_case column names"
    });

    queries.push({
      operation: "Get Current Open Queue",
      table: "queuemasterrcd",
      query: `SELECT * FROM queuemasterrcd WHERE queuemasterstatus = 'Open' ORDER BY queueid DESC LIMIT 1;`,
      description: "Finds the most recent open queue"
    });

    queries.push({
      operation: "Create New Queue",
      table: "queuemasterrcd",
      query: `INSERT INTO queuemasterrcd (queueid, queuestarttime, queuestartedbyusername, queuemasterstatus, lastupdatedttm) VALUES ($1, $2, $3, 'Open', $4) RETURNING *;`,
      description: "Creates a new queue record with current timestamp"
    });

    queries.push({
      operation: "Close Queue",
      table: "queuemasterrcd",
      query: `UPDATE queuemasterrcd SET queueendtime = $1, queueclosedbyusername = $2, queuemasterstatus = 'Closed', lastupdatedttm = $3 WHERE queuemasterstatus = 'Open' RETURNING *;`,
      description: "Closes the currently open queue"
    });

    queries.push({
      operation: "Delete Queue",
      table: "queuemasterrcd",
      query: `DELETE FROM queuemasterrcd WHERE queueid = $1;`,
      description: "Deletes a specific queue by ID"
    });

    // Schema inspection queries
    queries.push({
      operation: "Check Table Schema",
      table: "information_schema.tables",
      query: `SELECT table_name, table_type FROM information_schema.tables WHERE table_name = 'queuemasterrcd';`,
      description: "Gets table metadata from PostgreSQL system catalog"
    });

    queries.push({
      operation: "Check Column Information",
      table: "information_schema.columns",
      query: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'queuemasterrcd' ORDER BY ordinal_position;`,
      description: "Gets column definitions for the table"
    });

    queries.push({
      operation: "Check RLS Policies",
      table: "pg_policies",
      query: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'queuemasterrcd';`,
      description: "Checks Row Level Security policies that might affect data access"
    });

    // Add notes about Supabase specifics
    notes.push("Supabase uses PostgREST which converts REST API calls to SQL queries");
    notes.push("The actual SQL may include additional WHERE clauses for RLS (Row Level Security)");
    notes.push("Column names in PostgreSQL are case-sensitive when quoted, case-insensitive when unquoted");
    notes.push("Supabase client automatically handles parameterization to prevent SQL injection");
    notes.push("The $1, $2, etc. are PostgreSQL parameter placeholders for prepared statements");

    // Test if we can get actual query plans
    try {
      console.log("[SQL Debug] Testing if we can get query execution plans...");
      
      // Try to get the actual execution plan for a simple query
      const { data: planData, error: planError } = await supabase
        .rpc('explain_query', { 
          query_text: 'SELECT * FROM queuemasterrcd LIMIT 1' 
        })
        .then(result => result)
        .catch(() => ({ data: null, error: 'explain_query function not available' }));

      if (planData) {
        notes.push(`Query execution plan available: ${JSON.stringify(planData)}`);
      } else {
        notes.push("Query execution plans not accessible (explain_query function not available)");
      }
    } catch (err) {
      notes.push("Could not retrieve query execution plans");
    }

    return {
      queries,
      notes
    };
  }
);
