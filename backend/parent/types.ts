export interface Parent {
  parentID: string;
  parentName: string;
  parentPhoneMain: string;
  parentRecordStatus: string;
  parentVehicleInfo: string;
  gender: string;
  sendSMS: boolean;
  alternate1Name: string;
  alternate1Phone: string;
  alternate1Relationship: string;
  alternate1VehicleInfo: string;
  alternate2Name: string;
  alternate2Phone: string;
  alternate2Relationship: string;
  alternate2VehicleInfo: string;
  alternate3Name: string;
  alternate3Phone: string;
  alternate3Relationship: string;
  alternate3VehicleInfo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetParentResponse {
  parent: Parent;
}
