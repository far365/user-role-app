import { api, APIError, Query } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Parent } from "./types";

export type SearchParentCombinedType = "parentname" | "phone" | "alternatename";

export interface SearchParentCombinedRequest {
  search_text: Query<string>;
  search_type: Query<SearchParentCombinedType>;
}

export interface SearchParentCombinedResponse {
  parents: Parent[];
  message?: string;
}

export const searchParentCombined = api<SearchParentCombinedRequest, SearchParentCombinedResponse>(
  { expose: true, method: "GET", path: "/parent/search/combined" },
  async ({ search_text, search_type }) => {
    if (!search_type || !["parentname", "phone", "alternatename"].includes(search_type)) {
      throw APIError.invalidArgument(
        "Invalid search_type. Allowed values are: parentname, phone, alternatename"
      );
    }

    if (!search_text || search_text.trim() === "") {
      throw APIError.invalidArgument("search_text is required");
    }

    try {
      const { data, error } = await supabase.rpc("search_parent_combined", {
        search_text: search_text.trim(),
        search_type,
      });

      if (error) {
        throw APIError.internal(`search_parent_combined failed: ${error.message}`);
      }

      const rows = (data || []) as any[];

      if (rows.length === 1 && rows[0].message === "No Matching Data") {
        return { parents: [], message: "No Matching Data" };
      }

      const parents: Parent[] = rows
        .filter((row) => row.parentid !== null)
        .map((row) => ({
          parentID: row.parentid,
          parentName: row.parentname || "",
          parentPhoneMain: row.parentphonemain || "",
          parentRecordStatus: row.parentrecordstatus || "",
          parentVehicleInfo: row.parentvehicleinfo || "",
          gender: row.gender || "",
          sendSMS: row.sendsms || false,
          alternate1Name: row.alternate1_name || "",
          alternate1Phone: row.alternate1_phone || "",
          alternate1Relationship: row.alternate1_relationship || "",
          alternate1VehicleInfo: row.alternate1_vehicleinfo || "",
          alternate2Name: row.alternate2_name || "",
          alternate2Phone: row.alternate2_phone || "",
          alternate2Relationship: row.alternate2_relationship || "",
          alternate2VehicleInfo: row.alternate2_vehicleinfo || "",
          alternate3Name: row.alternate3_name || "",
          alternate3Phone: row.alternate3_phone || "",
          alternate3Relationship: row.alternate3_relationship || "",
          alternate3VehicleInfo: row.alternate3_vehicleinfo || "",
          createdAt: row.created_at ? new Date(row.created_at) : new Date(),
          updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        }));

      return { parents };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.internal("Failed to execute search_parent_combined");
    }
  }
);
