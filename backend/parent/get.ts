import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Parent, GetParentResponse } from "./types";

// Retrieves parent information by username from usersrcd table.
export const getByUsername = api<{ username: string }, GetParentResponse>(
  { expose: true, method: "GET", path: "/parent/by-username/:username" },
  async ({ username }) => {
    try {
      console.log(`[Parent API] Looking up username: ${username}`);
      
      // First, get the parentID from usersrcd table using username
      const { data: userRow, error: userError } = await supabase
        .from('usersrcd')
        .select('parentid, username, loginid')
        .eq('username', username)
        .single();

      console.log(`[Parent API] User query result:`, { userRow, userError });

      if (userError) {
        console.log(`[Parent API] User query error:`, userError);
        throw APIError.notFound(`User not found: ${userError.message}`);
      }

      if (!userRow) {
        console.log(`[Parent API] No user row returned for username: ${username}`);
        throw APIError.notFound("User not found");
      }

      if (!userRow.parentid) {
        console.log(`[Parent API] User found but no parentid: ${JSON.stringify(userRow)}`);
        throw APIError.notFound("Parent ID not found for this user");
      }

      console.log(`[Parent API] Found parentid: ${userRow.parentid} for username: ${username}`);

      // Then get the parent details from parentrcd table
      const { data: parentRow, error: parentError } = await supabase
        .from('parentrcd')
        .select('*')
        .eq('parentid', userRow.parentid)
        .single();

      console.log(`[Parent API] Parent query result:`, { parentRow, parentError });

      if (parentError) {
        console.log(`[Parent API] Parent query error:`, parentError);
        throw APIError.notFound(`Parent record not found: ${parentError.message}`);
      }

      if (!parentRow) {
        console.log(`[Parent API] No parent row returned for parentid: ${userRow.parentid}`);
        throw APIError.notFound("Parent record not found");
      }

      console.log(`[Parent API] Successfully found parent data:`, parentRow);

      const parent: Parent = {
        parentID: parentRow.parentid,
        parentName: parentRow.parentname || '',
        phoneNumber: parentRow.phonenumber || '',
        email: parentRow.email || '',
        address: parentRow.address || '',
        emergencyContact: parentRow.emergencycontact || '',
        emergencyPhone: parentRow.emergencyphone || '',
        createdAt: parentRow.createdat ? new Date(parentRow.createdat) : new Date(),
        updatedAt: parentRow.updatedat ? new Date(parentRow.updatedat) : new Date(),
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
