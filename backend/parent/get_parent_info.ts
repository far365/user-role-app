import { api } from "encore.dev/api";
import { supabase } from "../user/supabase";

export interface GetParentInfoRequest {
  username: string;
}

export interface ParentInfo {
  gender: string;
  sendSMS: boolean;
  parentID: string;
  createdAt: string;
  updatedAt: string;
  parentName: string;
  alternate1Name: string | null;
  alternate2Name: string | null;
  alternate3Name: string | null;
  alternate1Phone: string | null;
  alternate2Phone: string | null;
  alternate3Phone: string | null;
  parentPhoneMain: string;
  parentVehicleInfo: string | null;
  parentRecordStatus: string;
  alternate1VehicleInfo: string | null;
  alternate2VehicleInfo: string | null;
  alternate3VehicleInfo: string | null;
  alternate1Relationship: string | null;
  alternate2Relationship: string | null;
  alternate3Relationship: string | null;
}

export const getParentInfo = api(
  { method: "POST", path: "/parent/get-parent-info", expose: true },
  async (req: GetParentInfoRequest): Promise<ParentInfo> => {
    const { data, error } = await supabase.rpc("get_parent_info", {
      username: req.username,
    });

    if (error) {
      throw new Error(`Failed to get parent info: ${error.message}`);
    }

    if (!data) {
      throw new Error("Parent info not found");
    }

    return data as ParentInfo;
  }
);
