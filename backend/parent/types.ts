export interface Parent {
  parentID: string;
  parentName: string;
  phoneNumber: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetParentResponse {
  parent: Parent;
}
