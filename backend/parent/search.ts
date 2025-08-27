import { api, APIError, Query } from "encore.dev/api";
import { supabase } from "../user/supabase";
import type { Parent } from "./types";

export interface SearchParentByNameRequest {
  name: Query<string>;
}

export interface SearchParentByPhoneRequest {
  phone: Query<string>;
}

export interface SearchParentByAlternateNameRequest {
  alternateName: Query<string>;
}

export interface SearchParentResponse {
  parents: Parent[];
}

// Searches for parent records by parent name (minimum 4 characters).
export const searchByName = api<SearchParentByNameRequest, SearchParentResponse>(
  { expose: true, method: "GET", path: "/parent/search/name" },
  async ({ name }) => {
    if (!name || name.trim().length < 4) {
      throw APIError.invalidArgument("Name must be at least 4 characters long");
    }

    try {
      console.log(`[Parent Search] Searching by name: "${name}"`);
      
      const { data: parentRows, error } = await supabase
        .from('parentrcd')
        .select('*')
        .ilike('parentname', `%${name.trim()}%`)
        .order('parentname');

      console.log(`[Parent Search] Query result:`, { parentRows, error });

      if (error) {
        console.error("Search by name error:", error);
        throw APIError.internal(`Failed to search parents: ${error.message}`);
      }

      const parents: Parent[] = (parentRows || []).map(row => ({
        parentID: row.parentid,
        parentName: row.parentname || '',
        parentPhoneMain: row.parentphonemain || '',
        parentRecordStatus: row.parentrecordstatus || '',
        parentVehicleInfo: row.parentvehicleinfo || '',
        gender: row.gender || '',
        sendSMS: row.sendsms || false,
        alternate1Name: row.alternate1_name || '',
        alternate1Phone: row.alternate1_phone || '',
        alternate1Relationship: row.alternate1_relationship || '',
        alternate1VehicleInfo: row.alternate1_vehicleinfo || '',
        alternate2Name: row.alternate2_name || '',
        alternate2Phone: row.alternate2_phone || '',
        alternate2Relationship: row.alternate2_relationship || '',
        alternate2VehicleInfo: row.alternate2_vehicleinfo || '',
        alternate3Name: row.alternate3_name || '',
        alternate3Phone: row.alternate3_phone || '',
        alternate3Relationship: row.alternate3_relationship || '',
        alternate3VehicleInfo: row.alternate3_vehicleinfo || '',
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));

      console.log(`[Parent Search] Found ${parents.length} parents`);
      return { parents };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error searching parents by name:", error);
      throw APIError.internal("Failed to search parent records");
    }
  }
);

// Searches for parent records by main phone number (must be exactly 10 digits).
export const searchByPhone = api<SearchParentByPhoneRequest, SearchParentResponse>(
  { expose: true, method: "GET", path: "/parent/search/phone" },
  async ({ phone }) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      throw APIError.invalidArgument("Phone number must be exactly 10 digits");
    }

    try {
      console.log(`[Parent Search] Searching by phone: "${cleanPhone}"`);
      
      const { data: parentRows, error } = await supabase
        .from('parentrcd')
        .select('*')
        .eq('parentphonemain', cleanPhone)
        .order('parentname');

      console.log(`[Parent Search] Query result:`, { parentRows, error });

      if (error) {
        console.error("Search by phone error:", error);
        throw APIError.internal(`Failed to search parents: ${error.message}`);
      }

      const parents: Parent[] = (parentRows || []).map(row => ({
        parentID: row.parentid,
        parentName: row.parentname || '',
        parentPhoneMain: row.parentphonemain || '',
        parentRecordStatus: row.parentrecordstatus || '',
        parentVehicleInfo: row.parentvehicleinfo || '',
        gender: row.gender || '',
        sendSMS: row.sendsms || false,
        alternate1Name: row.alternate1_name || '',
        alternate1Phone: row.alternate1_phone || '',
        alternate1Relationship: row.alternate1_relationship || '',
        alternate1VehicleInfo: row.alternate1_vehicleinfo || '',
        alternate2Name: row.alternate2_name || '',
        alternate2Phone: row.alternate2_phone || '',
        alternate2Relationship: row.alternate2_relationship || '',
        alternate2VehicleInfo: row.alternate2_vehicleinfo || '',
        alternate3Name: row.alternate3_name || '',
        alternate3Phone: row.alternate3_phone || '',
        alternate3Relationship: row.alternate3_relationship || '',
        alternate3VehicleInfo: row.alternate3_vehicleinfo || '',
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));

      console.log(`[Parent Search] Found ${parents.length} parents`);
      return { parents };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error searching parents by phone:", error);
      throw APIError.internal("Failed to search parent records");
    }
  }
);

// Searches for parent records by alternate contact name (minimum 4 characters).
export const searchByAlternateName = api<SearchParentByAlternateNameRequest, SearchParentResponse>(
  { expose: true, method: "GET", path: "/parent/search/alternate-name" },
  async ({ alternateName }) => {
    if (!alternateName || alternateName.trim().length < 4) {
      throw APIError.invalidArgument("Alternate name must be at least 4 characters long");
    }

    try {
      console.log(`[Parent Search] Searching by alternate name: "${alternateName}"`);
      
      const searchTerm = `%${alternateName.trim()}%`;
      
      const { data: parentRows, error } = await supabase
        .from('parentrcd')
        .select('*')
        .or(`alternate1_name.ilike.${searchTerm},alternate2_name.ilike.${searchTerm},alternate3_name.ilike.${searchTerm}`)
        .order('parentname');

      console.log(`[Parent Search] Query result:`, { parentRows, error });

      if (error) {
        console.error("Search by alternate name error:", error);
        throw APIError.internal(`Failed to search parents: ${error.message}`);
      }

      const parents: Parent[] = (parentRows || []).map(row => ({
        parentID: row.parentid,
        parentName: row.parentname || '',
        parentPhoneMain: row.parentphonemain || '',
        parentRecordStatus: row.parentrecordstatus || '',
        parentVehicleInfo: row.parentvehicleinfo || '',
        gender: row.gender || '',
        sendSMS: row.sendsms || false,
        alternate1Name: row.alternate1_name || '',
        alternate1Phone: row.alternate1_phone || '',
        alternate1Relationship: row.alternate1_relationship || '',
        alternate1VehicleInfo: row.alternate1_vehicleinfo || '',
        alternate2Name: row.alternate2_name || '',
        alternate2Phone: row.alternate2_phone || '',
        alternate2Relationship: row.alternate2_relationship || '',
        alternate2VehicleInfo: row.alternate2_vehicleinfo || '',
        alternate3Name: row.alternate3_name || '',
        alternate3Phone: row.alternate3_phone || '',
        alternate3Relationship: row.alternate3_relationship || '',
        alternate3VehicleInfo: row.alternate3_vehicleinfo || '',
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));

      console.log(`[Parent Search] Found ${parents.length} parents`);
      return { parents };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error("Unexpected error searching parents by alternate name:", error);
      throw APIError.internal("Failed to search parent records");
    }
  }
);
