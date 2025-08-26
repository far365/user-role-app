import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Parent, GetParentResponse } from "./types";

// Retrieves parent information by username from usersrcd table.
export const getByUsername = api<{ username: string }, GetParentResponse>(
  { expose: true, method: "GET", path: "/parent/by-username/:username" },
  async ({ username }) => {
    try {
      // First, get the parentID from usersrcd table using username
      const { data: userRow, error: userError } = await supabase
        .from('usersrcd')
        .select('parentid')
        .eq('username', username)
        .single();

      if (userError || !userRow) {
        throw APIError.notFound("User not found");
      }

      if (!userRow.parentid) {
        throw APIError.notFound("Parent ID not found for this user");
      }

      // Then get the parent details from parentrcd table
      const { data: parentRow, error: parentError } = await supabase
        .from('parentrcd')
        .select('*')
        .eq('parentid', userRow.parentid)
        .single();

      if (parentError || !parentRow) {
        throw APIError.notFound("Parent record not found");
      }

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

      return { parent };

    } catch (error) {
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Error fetching parent data:", error);
      throw APIError.internal("Failed to fetch parent information");
    }
  }
);
