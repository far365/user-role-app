import { api, APIError } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Parent, GetParentResponse } from "./types";

export interface UpdateParentRequest {
  username: string;
  parentName?: string;
  parentPhoneMain?: string;
  sendSMS?: boolean;
  parentVehicleInfo?: string;
  alternate1Name?: string;
  alternate1Phone?: string;
  alternate1Relationship?: string;
  alternate1VehicleInfo?: string;
  alternate2Name?: string;
  alternate2Phone?: string;
  alternate2Relationship?: string;
  alternate2VehicleInfo?: string;
  alternate3Name?: string;
  alternate3Phone?: string;
  alternate3Relationship?: string;
  alternate3VehicleInfo?: string;
}

// Updates parent information by username.
export const update = api<UpdateParentRequest, GetParentResponse>(
  { expose: true, method: "PUT", path: "/parent/update" },
  async (req) => {
    const { username, ...updateData } = req;

    if (!username) {
      throw APIError.invalidArgument("Username is required");
    }

    try {
      console.log(`[Parent API] Updating parent data for username: ${username}`);
      
      // Build the update object with only provided fields
      const updateFields: any = {
        updated_at: new Date().toISOString()
      };

      if (updateData.parentName !== undefined) {
        updateFields.parentname = updateData.parentName;
      }
      if (updateData.parentPhoneMain !== undefined) {
        updateFields.parentphonemain = updateData.parentPhoneMain;
      }
      if (updateData.sendSMS !== undefined) {
        updateFields.sendsms = updateData.sendSMS;
      }
      if (updateData.parentVehicleInfo !== undefined) {
        updateFields.parentvehicleinfo = updateData.parentVehicleInfo;
      }
      if (updateData.alternate1Name !== undefined) {
        updateFields.alternate1_name = updateData.alternate1Name;
      }
      if (updateData.alternate1Phone !== undefined) {
        updateFields.alternate1_phone = updateData.alternate1Phone;
      }
      if (updateData.alternate1Relationship !== undefined) {
        updateFields.alternate1_relationship = updateData.alternate1Relationship;
      }
      if (updateData.alternate1VehicleInfo !== undefined) {
        updateFields.alternate1_vehicleinfo = updateData.alternate1VehicleInfo;
      }
      if (updateData.alternate2Name !== undefined) {
        updateFields.alternate2_name = updateData.alternate2Name;
      }
      if (updateData.alternate2Phone !== undefined) {
        updateFields.alternate2_phone = updateData.alternate2Phone;
      }
      if (updateData.alternate2Relationship !== undefined) {
        updateFields.alternate2_relationship = updateData.alternate2Relationship;
      }
      if (updateData.alternate2VehicleInfo !== undefined) {
        updateFields.alternate2_vehicleinfo = updateData.alternate2VehicleInfo;
      }
      if (updateData.alternate3Name !== undefined) {
        updateFields.alternate3_name = updateData.alternate3Name;
      }
      if (updateData.alternate3Phone !== undefined) {
        updateFields.alternate3_phone = updateData.alternate3Phone;
      }
      if (updateData.alternate3Relationship !== undefined) {
        updateFields.alternate3_relationship = updateData.alternate3Relationship;
      }
      if (updateData.alternate3VehicleInfo !== undefined) {
        updateFields.alternate3_vehicleinfo = updateData.alternate3VehicleInfo;
      }

      // Update the parent record
      const { data: updatedParentRow, error: updateError } = await supabase
        .from('parentrcd')
        .update(updateFields)
        .eq('parentid', username)
        .select('*')
        .single();

      console.log(`[Parent API] Update result:`, { updatedParentRow, updateError });

      if (updateError) {
        console.log(`[Parent API] Update error:`, updateError);
        throw APIError.internal(`Failed to update parent record: ${updateError.message}`);
      }

      if (!updatedParentRow) {
        console.log(`[Parent API] No parent row returned after update for username: ${username}`);
        throw APIError.notFound("Parent record not found");
      }

      console.log(`[Parent API] Successfully updated parent data:`, updatedParentRow);

      const parent: Parent = {
        parentID: updatedParentRow.parentid,
        parentName: updatedParentRow.parentname || '',
        parentPhoneMain: updatedParentRow.parentphonemain || '',
        parentRecordStatus: updatedParentRow.parentrecordstatus || '',
        parentVehicleInfo: updatedParentRow.parentvehicleinfo || '',
        gender: updatedParentRow.gender || '',
        sendSMS: updatedParentRow.sendsms || false,
        alternate1Name: updatedParentRow.alternate1_name || '',
        alternate1Phone: updatedParentRow.alternate1_phone || '',
        alternate1Relationship: updatedParentRow.alternate1_relationship || '',
        alternate1VehicleInfo: updatedParentRow.alternate1_vehicleinfo || '',
        alternate2Name: updatedParentRow.alternate2_name || '',
        alternate2Phone: updatedParentRow.alternate2_phone || '',
        alternate2Relationship: updatedParentRow.alternate2_relationship || '',
        alternate2VehicleInfo: updatedParentRow.alternate2_vehicleinfo || '',
        alternate3Name: updatedParentRow.alternate3_name || '',
        alternate3Phone: updatedParentRow.alternate3_phone || '',
        alternate3Relationship: updatedParentRow.alternate3_relationship || '',
        alternate3VehicleInfo: updatedParentRow.alternate3_vehicleinfo || '',
        createdAt: updatedParentRow.created_at ? new Date(updatedParentRow.created_at) : new Date(),
        updatedAt: updatedParentRow.updated_at ? new Date(updatedParentRow.updated_at) : new Date(),
      };

      console.log(`[Parent API] Returning updated parent data:`, parent);
      return { parent };

    } catch (error) {
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        console.log(`[Parent API] APIError:`, error.message);
        throw error;
      }
      
      console.error("[Parent API] Unexpected error updating parent data:", error);
      throw APIError.internal("Failed to update parent information");
    }
  }
);
