import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Save, X, AlertCircle, Car } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { QRCodeGenerator } from "../QRCodeGenerator";
import backend from "~backend/client";
import type { ParentInfo } from "~backend/parent/get_parent_info";

interface EditParentInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentData: ParentInfo;
  username: string;
  onUpdate: (updatedParent: ParentInfo) => void;
}

interface EditableParentData {
  parentPhoneMain: string;
  parentVehicleInfo: string;
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
}

interface ValidationErrors {
  [key: string]: string;
}

export function EditParentInfoDialog({ isOpen, onClose, parentData, username, onUpdate }: EditParentInfoDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editData, setEditData] = useState<EditableParentData>({
    parentPhoneMain: '',
    parentVehicleInfo: '',
    alternate1Name: '',
    alternate1Phone: '',
    alternate1Relationship: '',
    alternate1VehicleInfo: '',
    alternate2Name: '',
    alternate2Phone: '',
    alternate2Relationship: '',
    alternate2VehicleInfo: '',
    alternate3Name: '',
    alternate3Phone: '',
    alternate3Relationship: '',
    alternate3VehicleInfo: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (parentData) {
      setEditData({
        parentPhoneMain: parentData.parentPhoneMain,
        parentVehicleInfo: parentData.parentVehicleInfo || '',
        alternate1Name: parentData.alternate1Name || '',
        alternate1Phone: parentData.alternate1Phone || '',
        alternate1Relationship: parentData.alternate1Relationship || '',
        alternate1VehicleInfo: parentData.alternate1VehicleInfo || '',
        alternate2Name: parentData.alternate2Name || '',
        alternate2Phone: parentData.alternate2Phone || '',
        alternate2Relationship: parentData.alternate2Relationship || '',
        alternate2VehicleInfo: parentData.alternate2VehicleInfo || '',
        alternate3Name: parentData.alternate3Name || '',
        alternate3Phone: parentData.alternate3Phone || '',
        alternate3Relationship: parentData.alternate3Relationship || '',
        alternate3VehicleInfo: parentData.alternate3VehicleInfo || '',
      });
    }
  }, [parentData]);

  const validateAlternateContact = (contactNumber: number, data: EditableParentData): string[] => {
    const errors: string[] = [];
    const prefix = `alternate${contactNumber}`;
   
    const name = data[`${prefix}Name` as keyof EditableParentData] as string;
    const phone = data[`${prefix}Phone` as keyof EditableParentData] as string;
    const relationship = data[`${prefix}Relationship` as keyof EditableParentData] as string;
    const vehicleInfo = data[`${prefix}VehicleInfo` as keyof EditableParentData] as string;
   
    const hasAnyField = name.trim() || phone.trim() || relationship.trim() || vehicleInfo.trim();
   
    if (hasAnyField) {
      if (!name.trim()) errors.push(`Alternate Contact ${contactNumber} Name is required`);
      if (!phone.trim()) errors.push(`Alternate Contact ${contactNumber} Phone is required`);
      if (!relationship.trim()) errors.push(`Alternate Contact ${contactNumber} Relationship is required`);
      if (!vehicleInfo.trim()) errors.push(`Alternate Contact ${contactNumber} Vehicle Info is required`);
    }
   
    return errors;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
   
    const alternate1Errors = validateAlternateContact(1, editData);
    const alternate2Errors = validateAlternateContact(2, editData);
    const alternate3Errors = validateAlternateContact(3, editData);
   
    alternate1Errors.forEach((error, index) => {
      errors[`alternate1_${index}`] = error;
    });
    alternate2Errors.forEach((error, index) => {
      errors[`alternate2_${index}`] = error;
    });
    alternate3Errors.forEach((error, index) => {
      errors[`alternate3_${index}`] = error;
    });
   
    setValidationErrors(errors);
   
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      const errorMessages = Object.values(validationErrors);
      toast({
        title: "Validation Error",
        description: errorMessages.join('. '),
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSaving(true);
     
      const response = await backend.parent.update({
        username: username,
        ...editData,
      });
     
      // Convert Parent to ParentInfo
      const updatedParentInfo: ParentInfo = {
        parentID: response.parent.parentID,
        parentName: response.parent.parentName,
        parentPhoneMain: response.parent.parentPhoneMain,
        parentRecordStatus: response.parent.parentRecordStatus,
        parentVehicleInfo: response.parent.parentVehicleInfo,
        gender: response.parent.gender,
        sendSMS: response.parent.sendSMS,
        alternate1Name: response.parent.alternate1Name || null,
        alternate1Phone: response.parent.alternate1Phone || null,
        alternate1Relationship: response.parent.alternate1Relationship || null,
        alternate1VehicleInfo: response.parent.alternate1VehicleInfo || null,
        alternate2Name: response.parent.alternate2Name || null,
        alternate2Phone: response.parent.alternate2Phone || null,
        alternate2Relationship: response.parent.alternate2Relationship || null,
        alternate2VehicleInfo: response.parent.alternate2VehicleInfo || null,
        alternate3Name: response.parent.alternate3Name || null,
        alternate3Phone: response.parent.alternate3Phone || null,
        alternate3Relationship: response.parent.alternate3Relationship || null,
        alternate3VehicleInfo: response.parent.alternate3VehicleInfo || null,
        createdAt: response.parent.createdAt.toISOString(),
        updatedAt: response.parent.updatedAt.toISOString(),
      };
     
      onUpdate(updatedParentInfo);
      setValidationErrors({});
     
      toast({
        title: "Success",
        description: "Parent information updated successfully.",
      });

      onClose();
    } catch (error) {
      console.error("Failed to update parent data:", error);
     
      let errorMessage = "Failed to update parent information. Please try again.";
     
      if (error instanceof Error) {
        errorMessage = `Update failed: ${error.message}`;
      }
     
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof EditableParentData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
   
    if (value.trim()) {
      const newErrors = { ...validationErrors };
      Object.keys(newErrors).forEach(key => {
        if (key.includes(field)) {
          delete newErrors[key];
        }
      });
      setValidationErrors(newErrors);
    }
  };

  const getFieldError = (fieldName: string): boolean => {
    return Object.values(validationErrors).some(error => error.includes(fieldName));
  };

  const handleCancel = () => {
    setEditData({
      parentPhoneMain: parentData.parentPhoneMain,
      parentVehicleInfo: parentData.parentVehicleInfo || '',
      alternate1Name: parentData.alternate1Name || '',
      alternate1Phone: parentData.alternate1Phone || '',
      alternate1Relationship: parentData.alternate1Relationship || '',
      alternate1VehicleInfo: parentData.alternate1VehicleInfo || '',
      alternate2Name: parentData.alternate2Name || '',
      alternate2Phone: parentData.alternate2Phone || '',
      alternate2Relationship: parentData.alternate2Relationship || '',
      alternate2VehicleInfo: parentData.alternate2VehicleInfo || '',
      alternate3Name: parentData.alternate3Name || '',
      alternate3Phone: parentData.alternate3Phone || '',
      alternate3Relationship: parentData.alternate3Relationship || '',
      alternate3VehicleInfo: parentData.alternate3VehicleInfo || '',
    });
    setValidationErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Edit Parent and Alternate Info</span>
          </DialogTitle>
          <DialogDescription>Update your contact information and vehicle details</DialogDescription>
        </DialogHeader>

        {Object.keys(validationErrors).length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Validation Errors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-red-700">
                <p className="font-medium mb-2">Please fix the following errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {Object.values(validationErrors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  <strong>Note:</strong> If you fill in any field for an alternate contact, all 4 fields (Name, Phone, Relationship, Vehicle Info) must be completed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parentPhoneMain" className="text-sm font-medium text-gray-700">Primary Phone</Label>
              <Input
                id="parentPhoneMain"
                type="tel"
                value={editData.parentPhoneMain}
                onChange={(e) => handleInputChange('parentPhoneMain', e.target.value)}
                placeholder="Enter phone number"
                className="mt-1"
              />
            </div>
           
            <div>
              <Label htmlFor="parentVehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Information</Label>
              <Input
                id="parentVehicleInfo"
                type="text"
                value={editData.parentVehicleInfo}
                onChange={(e) => handleInputChange('parentVehicleInfo', e.target.value)}
                placeholder="Enter vehicle information"
                className="mt-1"
              />
            </div>
          </div>

          <div className={`p-4 border rounded-lg ${getFieldError('Alternate Contact 1') ? 'border-red-300 bg-red-50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Alternate Contact 1</h4>
              {parentData.alternate1Name && parentData.alternate1Phone && (
                <QRCodeGenerator
                  name={parentData.alternate1Name}
                  phone={parentData.alternate1Phone}
                  title="Alternate Contact 1"
                  parentID={parentData.parentID}
                  isAlternateContact={true}
                  alternateName={parentData.alternate1Name}
                  parentName={parentData.parentName}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternate1Name" className="text-sm font-medium text-gray-700">Name</Label>
                <Input
                  id="alternate1Name"
                  type="text"
                  value={editData.alternate1Name}
                  onChange={(e) => handleInputChange('alternate1Name', e.target.value)}
                  placeholder="Enter contact name"
                  className={`mt-1 ${getFieldError('Alternate Contact 1 Name') ? 'border-red-300' : ''}`}
                />
              </div>
             
              <div>
                <Label htmlFor="alternate1Phone" className="text-sm font-medium text-gray-700">Phone</Label>
                <Input
                  id="alternate1Phone"
                  type="tel"
                  value={editData.alternate1Phone}
                  onChange={(e) => handleInputChange('alternate1Phone', e.target.value)}
                  placeholder="Enter phone number"
                  className={`mt-1 ${getFieldError('Alternate Contact 1 Phone') ? 'border-red-300' : ''}`}
                />
              </div>
             
              <div>
                <Label htmlFor="alternate1Relationship" className="text-sm font-medium text-gray-700">Relationship</Label>
                <Input
                  id="alternate1Relationship"
                  type="text"
                  value={editData.alternate1Relationship}
                  onChange={(e) => handleInputChange('alternate1Relationship', e.target.value)}
                  placeholder="Enter relationship"
                  className={`mt-1 ${getFieldError('Alternate Contact 1 Relationship') ? 'border-red-300' : ''}`}
                />
              </div>
             
              <div>
                <Label htmlFor="alternate1VehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Info</Label>
                <Input
                  id="alternate1VehicleInfo"
                  type="text"
                  value={editData.alternate1VehicleInfo}
                  onChange={(e) => handleInputChange('alternate1VehicleInfo', e.target.value)}
                  placeholder="Enter vehicle information"
                  className={`mt-1 ${getFieldError('Alternate Contact 1 Vehicle Info') ? 'border-red-300' : ''}`}
                />
              </div>
            </div>
          </div>

          <div className={`p-4 border rounded-lg ${getFieldError('Alternate Contact 2') ? 'border-red-300 bg-red-50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Alternate Contact 2</h4>
              {parentData.alternate2Name && parentData.alternate2Phone && (
                <QRCodeGenerator
                  name={parentData.alternate2Name}
                  phone={parentData.alternate2Phone}
                  title="Alternate Contact 2"
                  parentID={parentData.parentID}
                  isAlternateContact={true}
                  alternateName={parentData.alternate2Name}
                  parentName={parentData.parentName}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternate2Name" className="text-sm font-medium text-gray-700">Name</Label>
                <Input
                  id="alternate2Name"
                  type="text"
                  value={editData.alternate2Name}
                  onChange={(e) => handleInputChange('alternate2Name', e.target.value)}
                  placeholder="Enter contact name"
                  className={`mt-1 ${getFieldError('Alternate Contact 2 Name') ? 'border-red-300' : ''}`}
                />
              </div>
             
              <div>
                <Label htmlFor="alternate2Phone" className="text-sm font-medium text-gray-700">Phone</Label>
                <Input
                  id="alternate2Phone"
                  type="tel"
                  value={editData.alternate2Phone}
                  onChange={(e) => handleInputChange('alternate2Phone', e.target.value)}
                  placeholder="Enter phone number"
                  className={`mt-1 ${getFieldError('Alternate Contact 2 Phone') ? 'border-red-300' : ''}`}
                />
              </div>
             
              <div>
                <Label htmlFor="alternate2Relationship" className="text-sm font-medium text-gray-700">Relationship</Label>
                <Input
                  id="alternate2Relationship"
                  type="text"
                  value={editData.alternate2Relationship}
                  onChange={(e) => handleInputChange('alternate2Relationship', e.target.value)}
                  placeholder="Enter relationship"
                  className={`mt-1 ${getFieldError('Alternate Contact 2 Relationship') ? 'border-red-300' : ''}`}
                />
              </div>
             
              <div>
                <Label htmlFor="alternate2VehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Info</Label>
                <Input
                  id="alternate2VehicleInfo"
                  type="text"
                  value={editData.alternate2VehicleInfo}
                  onChange={(e) => handleInputChange('alternate2VehicleInfo', e.target.value)}
                  placeholder="Enter vehicle information"
                  className={`mt-1 ${getFieldError('Alternate Contact 2 Vehicle Info') ? 'border-red-300' : ''}`}
                />
              </div>
            </div>
          </div>

          <div className={`p-4 border rounded-lg ${getFieldError('Alternate Contact 3') ? 'border-red-300 bg-red-50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Alternate Contact 3</h4>
              {parentData.alternate3Name && parentData.alternate3Phone && (
                <QRCodeGenerator
                  name={parentData.alternate3Name}
                  phone={parentData.alternate3Phone}
                  title="Alternate Contact 3"
                  parentID={parentData.parentID}
                  isAlternateContact={true}
                  alternateName={parentData.alternate3Name}
                  parentName={parentData.parentName}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternate3Name" className="text-sm font-medium text-gray-700">Name</Label>
                <Input
                  id="alternate3Name"
                  type="text"
                  value={editData.alternate3Name}
                  onChange={(e) => handleInputChange('alternate3Name', e.target.value)}
                  placeholder="Enter contact name"
                  className={`mt-1 ${getFieldError('Alternate Contact 3 Name') ? 'border-red-300' : ''}`}
                />
              </div>
             
              <div>
                <Label htmlFor="alternate3Phone" className="text-sm font-medium text-gray-700">Phone</Label>
                <Input
                  id="alternate3Phone"
                  type="tel"
                  value={editData.alternate3Phone}
                  onChange={(e) => handleInputChange('alternate3Phone', e.target.value)}
                  placeholder="Enter phone number"
                  className={`mt-1 ${getFieldError('Alternate Contact 3 Phone') ? 'border-red-300' : ''}`}
                />
              </div>
             
              <div>
                <Label htmlFor="alternate3Relationship" className="text-sm font-medium text-gray-700">Relationship</Label>
                <Input
                  id="alternate3Relationship"
                  type="text"
                  value={editData.alternate3Relationship}
                  onChange={(e) => handleInputChange('alternate3Relationship', e.target.value)}
                  placeholder="Enter relationship"
                  className={`mt-1 ${getFieldError('Alternate Contact 3 Relationship') ? 'border-red-300' : ''}`}
                />
              </div>
             
              <div>
                <Label htmlFor="alternate3VehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Info</Label>
                <Input
                  id="alternate3VehicleInfo"
                  type="text"
                  value={editData.alternate3VehicleInfo}
                  onChange={(e) => handleInputChange('alternate3VehicleInfo', e.target.value)}
                  placeholder="Enter vehicle information"
                  className={`mt-1 ${getFieldError('Alternate Contact 3 Vehicle Info') ? 'border-red-300' : ''}`}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
