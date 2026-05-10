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

export const update = api<UpdateParentRequest, GetParentResponse>(
  { expose: true, method: "PUT", path: "/parent/update" },
  async (req) => {
    if (!req.username) {
      throw APIError.invalidArgument("Username is required");
    }

    const { data: status, error } = await supabase.rpc("update_parent_record", {
      parentid: req.username,
      parentName: req.parentName ?? null,
      parentPhoneMain: req.parentPhoneMain ?? null,
      sendSMS: req.sendSMS !== undefined ? String(req.sendSMS) : null,
      parentVehicleInfo: req.parentVehicleInfo ?? null,
      alternate1Name: req.alternate1Name ?? null,
      alternate1Phone: req.alternate1Phone ?? null,
      alternate1Relationship: req.alternate1Relationship ?? null,
      alternate1VehicleInfo: req.alternate1VehicleInfo ?? null,
      alternate2Name: req.alternate2Name ?? null,
      alternate2Phone: req.alternate2Phone ?? null,
      alternate2Relationship: req.alternate2Relationship ?? null,
      alternate2VehicleInfo: req.alternate2VehicleInfo ?? null,
      alternate3Name: req.alternate3Name ?? null,
      alternate3Phone: req.alternate3Phone ?? null,
      alternate3Relationship: req.alternate3Relationship ?? null,
      alternate3VehicleInfo: req.alternate3VehicleInfo ?? null,
    });

    if (error) {
      throw APIError.internal(`Failed to update parent record: ${error.message}`);
    }

    if (typeof status === "string" && status.toLowerCase().includes("error")) {
      throw APIError.internal(`Update failed: ${status}`);
    }

    const { data: parentData, error: fetchError } = await supabase.rpc("get_parent_info", {
      username: req.username,
    });

    if (fetchError || !parentData) {
      throw APIError.internal("Failed to fetch updated parent record");
    }

    const p = parentData as any;
    const parent: Parent = {
      parentID: p.parentID ?? req.username,
      parentName: p.parentName ?? "",
      parentPhoneMain: p.parentPhoneMain ?? "",
      parentRecordStatus: p.parentRecordStatus ?? "",
      parentVehicleInfo: p.parentVehicleInfo ?? "",
      gender: p.gender ?? "",
      sendSMS: p.sendSMS ?? false,
      alternate1Name: p.alternate1Name ?? "",
      alternate1Phone: p.alternate1Phone ?? "",
      alternate1Relationship: p.alternate1Relationship ?? "",
      alternate1VehicleInfo: p.alternate1VehicleInfo ?? "",
      alternate2Name: p.alternate2Name ?? "",
      alternate2Phone: p.alternate2Phone ?? "",
      alternate2Relationship: p.alternate2Relationship ?? "",
      alternate2VehicleInfo: p.alternate2VehicleInfo ?? "",
      alternate3Name: p.alternate3Name ?? "",
      alternate3Phone: p.alternate3Phone ?? "",
      alternate3Relationship: p.alternate3Relationship ?? "",
      alternate3VehicleInfo: p.alternate3VehicleInfo ?? "",
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    };

    return { parent };
  }
);
