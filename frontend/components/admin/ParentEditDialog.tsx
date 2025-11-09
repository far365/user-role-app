import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Save, X, AlertCircle } from "lucide-react";
import backend from "~backend/client";
import type { Parent } from "~backend/parent/types";

interface ParentEditDialogProps {
  parent: Parent;
  isOpen: boolean;
  onClose: () => void;
  onParentUpdated: (updatedParent: Parent) => void;
}

interface EditableParentData {
  parentName: string;
  parentPhoneMain: string;
  sendSMS: boolean;
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

export function ParentEditDialog({ parent, isOpen, onClose, onParentUpdated }: ParentEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editData, setEditData] = useState<EditableParentData>({
    parentName: parent.parentName,
    parentPhoneMain: parent.parentPhoneMain,
    sendSMS: parent.sendSMS,
    parentVehicleInfo: parent.parentVehicleInfo,
    alternate1Name: parent.alternate1Name,
    alternate1Phone: parent.alternate1Phone,
    alternate1Relationship: parent.alternate1Relationship,
    alternate1VehicleInfo: parent.alternate1VehicleInfo,
    alternate2Name: parent.alternate2Name,
    alternate2Phone: parent.alternate2Phone,
    alternate2Relationship: parent.alternate2Relationship,
    alternate2VehicleInfo: parent.alternate2VehicleInfo,
    alternate3Name: parent.alternate3Name,
    alternate3Phone: parent.alternate3Phone,
    alternate3Relationship: parent.alternate3Relationship,
    alternate3VehicleInfo: parent.alternate3VehicleInfo,
  });
  
  const { toast } = useToast();

  const validateAlternateContact = (contactNumber: number, data: EditableParentData): string[] => {
    const errors: string[] = [];
    const prefix = `alternate${contactNumber}`;
    
    const name = data[`${prefix}Name` as keyof EditableParentData] as string;
    const phone = data[`${prefix}Phone` as keyof EditableParentData] as string;
    const relationship = data[`${prefix}Relationship` as keyof EditableParentData] as string;
    const vehicleInfo = data[`${prefix}VehicleInfo` as keyof EditableParentData] as string;
    
    // Check if any field is filled
    const hasAnyField = name.trim() || phone.trim() || relationship.trim() || vehicleInfo.trim();
    
    if (hasAnyField) {
      // If any field is filled, all fields must be filled
      if (!name.trim()) errors.push(`Alternate Contact ${contactNumber} Name is required`);
      if (!phone.trim()) errors.push(`Alternate Contact ${contactNumber} Phone is required`);
      if (!relationship.trim()) errors.push(`Alternate Contact ${contactNumber} Relationship is required`);
      if (!vehicleInfo.trim()) errors.push(`Alternate Contact ${contactNumber} Vehicle Info is required`);
    }
    
    return errors;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!editData.parentName.trim()) {
      errors.parentName = "Parent Name is required";
    }
    
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
        username: parent.parentID,
        ...editData,
      });
      
      onParentUpdated(response.parent);
      
      if (editData.parentName !== parent.parentName) {
        toast({
          title: "Success",
          description: "Parent information updated successfully. Display name has been synchronized.",
        });
      } else {
        toast({
          title: "Success",
          description: "Parent information updated successfully.",
        });
      }
      
    } catch (error) {
      console.error("Failed to update parent data:", error);
      toast({
        title: "Error",
        description: "Failed to update parent information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof EditableParentData, value: string | boolean) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation errors for this field when user starts typing
    if (typeof value === 'string' && value.trim()) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Parent Record</DialogTitle>
          <DialogDescription>
            Editing information for {parent.parentName} (ID: {parent.parentID})
            <br />
            <span className="text-sm text-blue-600">Note: Updating the parent name will also update the display name in the user record.</span>
          </DialogDescription>
        </DialogHeader>

        {Object.keys(validationErrors).length > 0 && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Validation Errors</span>
            </div>
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
          </div>
        )}

        <div className="space-y-6">
          {/* Main Parent Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Main Parent Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentName">Parent Name</Label>
                <Input
                  id="parentName"
                  type="text"
                  value={editData.parentName}
                  onChange={(e) => handleInputChange('parentName', e.target.value)}
                  placeholder="Enter parent name"
                  className={validationErrors.parentName ? 'border-red-300' : ''}
                />
                {validationErrors.parentName && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.parentName}</p>
                )}
                {editData.parentName !== parent.parentName && (
                  <p className="text-xs text-blue-600 mt-1">
                    This will also update the display name in the user record.
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="parentID">Parent ID (Read-only)</Label>
                <Input
                  id="parentID"
                  type="text"
                  value={parent.parentID}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentPhoneMain">Main Phone Number</Label>
                <Input
                  id="parentPhoneMain"
                  type="tel"
                  value={editData.parentPhoneMain}
                  onChange={(e) => handleInputChange('parentPhoneMain', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="parentVehicleInfo">Vehicle Information</Label>
                <Input
                  id="parentVehicleInfo"
                  type="text"
                  value={editData.parentVehicleInfo}
                  onChange={(e) => handleInputChange('parentVehicleInfo', e.target.value)}
                  placeholder="Enter vehicle information"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editData.sendSMS}
                onCheckedChange={(checked) => handleInputChange('sendSMS', checked)}
              />
              <Label>SMS Notifications Enabled</Label>
            </div>
          </div>

          {/* Alternate Contact 1 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Alternate Contact 1</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternate1Name">Name</Label>
                <Input
                  id="alternate1Name"
                  type="text"
                  value={editData.alternate1Name}
                  onChange={(e) => handleInputChange('alternate1Name', e.target.value)}
                  placeholder="Enter contact name"
                  className={getFieldError('Alternate Contact 1 Name') ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="alternate1Phone">Phone Number</Label>
                <Input
                  id="alternate1Phone"
                  type="tel"
                  value={editData.alternate1Phone}
                  onChange={(e) => handleInputChange('alternate1Phone', e.target.value)}
                  placeholder="Enter phone number"
                  className={getFieldError('Alternate Contact 1 Phone') ? 'border-red-300' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternate1Relationship">Relationship</Label>
                <Input
                  id="alternate1Relationship"
                  type="text"
                  value={editData.alternate1Relationship}
                  onChange={(e) => handleInputChange('alternate1Relationship', e.target.value)}
                  placeholder="Enter relationship"
                  className={getFieldError('Alternate Contact 1 Relationship') ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="alternate1VehicleInfo">Vehicle Information</Label>
                <Input
                  id="alternate1VehicleInfo"
                  type="text"
                  value={editData.alternate1VehicleInfo}
                  onChange={(e) => handleInputChange('alternate1VehicleInfo', e.target.value)}
                  placeholder="Enter vehicle information"
                  className={getFieldError('Alternate Contact 1 Vehicle Info') ? 'border-red-300' : ''}
                />
              </div>
            </div>
          </div>

          {/* Alternate Contact 2 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Alternate Contact 2</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternate2Name">Name</Label>
                <Input
                  id="alternate2Name"
                  type="text"
                  value={editData.alternate2Name}
                  onChange={(e) => handleInputChange('alternate2Name', e.target.value)}
                  placeholder="Enter contact name"
                  className={getFieldError('Alternate Contact 2 Name') ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="alternate2Phone">Phone Number</Label>
                <Input
                  id="alternate2Phone"
                  type="tel"
                  value={editData.alternate2Phone}
                  onChange={(e) => handleInputChange('alternate2Phone', e.target.value)}
                  placeholder="Enter phone number"
                  className={getFieldError('Alternate Contact 2 Phone') ? 'border-red-300' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternate2Relationship">Relationship</Label>
                <Input
                  id="alternate2Relationship"
                  type="text"
                  value={editData.alternate2Relationship}
                  onChange={(e) => handleInputChange('alternate2Relationship', e.target.value)}
                  placeholder="Enter relationship"
                  className={getFieldError('Alternate Contact 2 Relationship') ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="alternate2VehicleInfo">Vehicle Information</Label>
                <Input
                  id="alternate2VehicleInfo"
                  type="text"
                  value={editData.alternate2VehicleInfo}
                  onChange={(e) => handleInputChange('alternate2VehicleInfo', e.target.value)}
                  placeholder="Enter vehicle information"
                  className={getFieldError('Alternate Contact 2 Vehicle Info') ? 'border-red-300' : ''}
                />
              </div>
            </div>
          </div>

          {/* Alternate Contact 3 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Alternate Contact 3</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternate3Name">Name</Label>
                <Input
                  id="alternate3Name"
                  type="text"
                  value={editData.alternate3Name}
                  onChange={(e) => handleInputChange('alternate3Name', e.target.value)}
                  placeholder="Enter contact name"
                  className={getFieldError('Alternate Contact 3 Name') ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="alternate3Phone">Phone Number</Label>
                <Input
                  id="alternate3Phone"
                  type="tel"
                  value={editData.alternate3Phone}
                  onChange={(e) => handleInputChange('alternate3Phone', e.target.value)}
                  placeholder="Enter phone number"
                  className={getFieldError('Alternate Contact 3 Phone') ? 'border-red-300' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alternate3Relationship">Relationship</Label>
                <Input
                  id="alternate3Relationship"
                  type="text"
                  value={editData.alternate3Relationship}
                  onChange={(e) => handleInputChange('alternate3Relationship', e.target.value)}
                  placeholder="Enter relationship"
                  className={getFieldError('Alternate Contact 3 Relationship') ? 'border-red-300' : ''}
                />
              </div>
              
              <div>
                <Label htmlFor="alternate3VehicleInfo">Vehicle Information</Label>
                <Input
                  id="alternate3VehicleInfo"
                  type="text"
                  value={editData.alternate3VehicleInfo}
                  onChange={(e) => handleInputChange('alternate3VehicleInfo', e.target.value)}
                  placeholder="Enter vehicle information"
                  className={getFieldError('Alternate Contact 3 Vehicle Info') ? 'border-red-300' : ''}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button onClick={onClose} variant="outline" disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
