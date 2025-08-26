import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Parent, GetParentResponse } from "./types";

// Retrieves parent information by username from parentrcd table directly.
export const getByUsername = api<{ username: string }, GetParentResponse>(
  { expose: true, method: "GET", path: "/parent/by-username/:username" },
  async ({ username }) => {
    try {
      console.log(`[Parent API] Looking up username: ${username}`);
      
      // Query parentrcd table directly using username
      // Assuming the parentrcd table has a field that links to the username
      // This might be 'username', 'loginid', or 'parentid' that matches the username
      const { data: parentRow, error: parentError } = await supabase
        .from('parentrcd')
        .select('*')
        .eq('parentid', username)  // Assuming parentid in parentrcd matches the username
        .single();

      console.log(`[Parent API] Parent query result:`, { parentRow, parentError });

      if (parentError) {
        console.log(`[Parent API] Parent query error:`, parentError);
        throw APIError.notFound(`Parent record not found: ${parentError.message}`);
      }

      if (!parentRow) {
        console.log(`[Parent API] No parent row returned for username: ${username}`);
        throw APIError.notFound("Parent record not found");
      }

      console.log(`[Parent API] Successfully found parent data:`, parentRow);

      const parent: Parent = {
        parentID: parentRow.parentid,
        parentName: parentRow.parentname || '',
        parentPhoneMain: parentRow.parentphonemain || '',
        parentRecordStatus: parentRow.parentrecordstatus || '',
        parentVehicleInfo: parentRow.parentvehicleinfo || '',
        gender: parentRow.gender || '',
        sendSMS: parentRow.sendsms || false,
        alternate1Name: parentRow.alternate1_name || '',
        alternate1Phone: parentRow.alternate1_phone || '',
        alternate1Relationship: parentRow.alternate1_relationship || '',
        alternate1VehicleInfo: parentRow.alternate1_vehicleinfo || '',
        alternate2Name: parentRow.alternate2_name || '',
        alternate2Phone: parentRow.alternate2_phone || '',
        alternate2Relationship: parentRow.alternate2_relationship || '',
        alternate2VehicleInfo: parentRow.alternate2_vehicleinfo || '',
        alternate3Name: parentRow.alternate3_name || '',
        alternate3Phone: parentRow.alternate3_phone || '',
        alternate3Relationship: parentRow.alternate3_relationship || '',
        alternate3VehicleInfo: parentRow.alternate3_vehicleinfo || '',
        createdAt: parentRow.created_at ? new Date(parentRow.created_at) : new Date(),
        updatedAt: parentRow.updated_at ? new Date(parentRow.updated_at) : new Date(),
      };

      console.log(`[Parent API] Returning parent data:`, parent);
      return { parent };

    } catch (error) {
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        console.log(`[Parent API] APIError:`, error.message);
        throw error;
      }
      
      console.error("[Parent API] Unexpected error fetching parent data:", error);
      throw APIError.internal("Failed to fetch parent information");
    }
  }
);
