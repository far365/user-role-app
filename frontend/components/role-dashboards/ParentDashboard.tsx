import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Phone, Mail, MapPin, UserCheck, AlertCircle, Bug, Car, Users, MessageSquare, User, Edit, Save, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "../QRCodeGenerator";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import type { Parent } from "~backend/parent/types";

interface ParentDashboardProps {
  user: User;
}

interface EditableParentData {
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

export function ParentDashboard({ user }: ParentDashboardProps) {
  const [parentData, setParentData] = useState<Parent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [editData, setEditData] = useState<EditableParentData>({
    parentPhoneMain: '',
    sendSMS: false,
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
    const fetchParentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching parent data for username:", user.loginID);
        
        const response = await backend.parent.getByUsername({ username: user.loginID });
        console.log("Parent data response:", response);
        
        setParentData(response.parent);
        
        // Initialize edit data
        setEditData({
          parentPhoneMain: response.parent.parentPhoneMain,
          sendSMS: response.parent.sendSMS,
          parentVehicleInfo: response.parent.parentVehicleInfo,
          alternate1Name: response.parent.alternate1Name,
          alternate1Phone: response.parent.alternate1Phone,
          alternate1Relationship: response.parent.alternate1Relationship,
          alternate1VehicleInfo: response.parent.alternate1VehicleInfo,
          alternate2Name: response.parent.alternate2Name,
          alternate2Phone: response.parent.alternate2Phone,
          alternate2Relationship: response.parent.alternate2Relationship,
          alternate2VehicleInfo: response.parent.alternate2VehicleInfo,
          alternate3Name: response.parent.alternate3Name,
          alternate3Phone: response.parent.alternate3Phone,
          alternate3Relationship: response.parent.alternate3Relationship,
          alternate3VehicleInfo: response.parent.alternate3VehicleInfo,
        });
      } catch (error) {
        console.error("Failed to fetch parent data:", error);
        setError(error instanceof Error ? error.message : "Failed to load parent information");
        toast({
          title: "Error",
          description: "Failed to load parent information. Please check if your parent record exists in the database.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchParentData();
  }, [user.loginID, toast]);

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
    
    // Validate alternate contacts
    const alternate1Errors = validateAlternateContact(1, editData);
    const alternate2Errors = validateAlternateContact(2, editData);
    const alternate3Errors = validateAlternateContact(3, editData);
    
    // Add errors to the errors object
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

  const handleDebug = async () => {
    try {
      console.log("Fetching debug data for username:", user.loginID);
      const response = await backend.parent.debug({ username: user.loginID });
      console.log("Debug data response:", response);
      setDebugData(response);
      setShowDebug(true);
    } catch (error) {
      console.error("Failed to fetch debug data:", error);
      toast({
        title: "Debug Error",
        description: "Failed to fetch debug information",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setValidationErrors({});
  };

  const handleCancel = () => {
    if (parentData) {
      setEditData({
        parentPhoneMain: parentData.parentPhoneMain,
        sendSMS: parentData.sendSMS,
        parentVehicleInfo: parentData.parentVehicleInfo,
        alternate1Name: parentData.alternate1Name,
        alternate1Phone: parentData.alternate1Phone,
        alternate1Relationship: parentData.alternate1Relationship,
        alternate1VehicleInfo: parentData.alternate1VehicleInfo,
        alternate2Name: parentData.alternate2Name,
        alternate2Phone: parentData.alternate2Phone,
        alternate2Relationship: parentData.alternate2Relationship,
        alternate2VehicleInfo: parentData.alternate2VehicleInfo,
        alternate3Name: parentData.alternate3Name,
        alternate3Phone: parentData.alternate3Phone,
        alternate3Relationship: parentData.alternate3Relationship,
        alternate3VehicleInfo: parentData.alternate3VehicleInfo,
      });
    }
    setIsEditing(false);
    setValidationErrors({});
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
        username: user.loginID,
        ...editData,
      });
      
      setParentData(response.parent);
      setIsEditing(false);
      setValidationErrors({});
      
      toast({
        title: "Success",
        description: "Parent information updated successfully",
      });
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Parent Dashboard</h2>
          <p className="text-gray-600">Loading your information...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !parentData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Parent Dashboard</h2>
          <p className="text-gray-600">{user.displayName}!</p>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>Parent Information Not Found</span>
            </CardTitle>
            <CardDescription className="text-red-700">
              No parent record found for username: {user.loginID}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-red-700">
            <p className="text-sm">
              Please ensure that:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>A record exists in the parentrcd table with parentid = "{user.loginID}"</li>
              <li>The parentrcd table has the correct field names (parentid, parentname, etc.)</li>
              <li>The username "{user.loginID}" matches a parentid in the parentrcd table</li>
            </ul>
            <p className="text-sm mt-3">
              Error details: {error}
            </p>
            <div className="mt-4">
              <Button onClick={handleDebug} variant="outline" size="sm">
                <Bug className="w-4 h-4 mr-2" />
                Debug Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {showDebug && debugData && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Debug Information</CardTitle>
              <CardDescription className="text-yellow-700">
                Database contents for troubleshooting
              </CardDescription>
            </CardHeader>
            <CardContent className="text-yellow-800">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Specific User Record (usersrcd):</p>
                  <pre className="bg-white p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.specificUser, null, 2)}
                  </pre>
                </div>

                <div>
                  <p className="font-medium">Specific Parent Record (parentrcd where parentid = "{user.loginID}"):</p>
                  <pre className="bg-white p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(debugData.specificParent, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <p className="font-medium">All usersrcd Records ({debugData.usersrcdRecords.length}):</p>
                  <div className="bg-white p-2 rounded text-xs max-h-40 overflow-auto">
                    {debugData.usersrcdRecords.map((record: any, index: number) => (
                      <div key={index} className="mb-2 p-1 border-b">
                        <strong>Username:</strong> {record.username || 'N/A'} | 
                        <strong> LoginID:</strong> {record.loginid || 'N/A'} | 
                        <strong> UserID:</strong> {record.userid || 'N/A'}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-medium">All parentrcd Records ({debugData.parentrcdRecords.length}):</p>
                  <div className="bg-white p-2 rounded text-xs max-h-40 overflow-auto">
                    {debugData.parentrcdRecords.map((record: any, index: number) => (
                      <div key={index} className="mb-2 p-1 border-b">
                        <strong>ParentID:</strong> {record.parentid || 'N/A'} | 
                        <strong> Name:</strong> {record.parentname || 'N/A'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Parent Dashboard</h3>
        {parentData && (
          <div className="flex items-center justify-between mb-2">
            <Badge 
              variant={parentData.parentRecordStatus === 'Active' ? 'default' : 'destructive'}
              className={parentData.parentRecordStatus === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {parentData.parentRecordStatus || 'Unknown'}
            </Badge>
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} disabled={isSaving} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        <p className="text-sm text-gray-600">
          Stay connected with your child's activities and important updates.
        </p>
        
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
      </div>

      {parentData && (
        <div className="space-y-6">
          {/* Main Parent Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5" />
                  <span>Parent Information</span>
                </CardTitle>
                <CardDescription>Your primary contact details and information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Parent Name</p>
                    <p className="text-sm text-gray-900">{parentData.parentName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Parent ID</p>
                    <p className="text-sm text-gray-900 font-mono">{parentData.parentID}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Gender</p>
                    <p className="text-sm text-gray-900">{parentData.gender === 'M' ? 'Male' : parentData.gender === 'F' ? 'Female' : parentData.gender || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="parentPhoneMain" className="text-sm font-medium text-gray-700">Main Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="parentPhoneMain"
                        type="tel"
                        value={editData.parentPhoneMain}
                        onChange={(e) => handleInputChange('parentPhoneMain', e.target.value)}
                        placeholder="Enter phone number"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.parentPhoneMain || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-700">SMS Notifications</Label>
                    {isEditing ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <Switch
                          checked={editData.sendSMS}
                          onCheckedChange={(checked) => handleInputChange('sendSMS', checked)}
                        />
                        <span className="text-sm text-gray-600">
                          {editData.sendSMS ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <Badge variant={parentData.sendSMS ? 'default' : 'secondary'}>
                          {parentData.sendSMS ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Car className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="parentVehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Information</Label>
                    {isEditing ? (
                      <Input
                        id="parentVehicleInfo"
                        type="text"
                        value={editData.parentVehicleInfo}
                        onChange={(e) => handleInputChange('parentVehicleInfo', e.target.value)}
                        placeholder="Enter vehicle information"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.parentVehicleInfo || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="pt-2 border-t">
                    <QRCodeGenerator
                      name={parentData.parentName || 'Parent'}
                      phone={parentData.parentPhoneMain || ''}
                      title="Parent Contact"
                      parentID={parentData.parentID}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={getFieldError('Alternate Contact 1') ? 'border-red-300' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Alternate Contact 1</span>
                </CardTitle>
                <CardDescription>Primary alternate contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="alternate1Name" className="text-sm font-medium text-gray-700">Name</Label>
                  {isEditing ? (
                    <Input
                      id="alternate1Name"
                      type="text"
                      value={editData.alternate1Name}
                      onChange={(e) => handleInputChange('alternate1Name', e.target.value)}
                      placeholder="Enter contact name"
                      className={`mt-1 ${getFieldError('Alternate Contact 1 Name') ? 'border-red-300' : ''}`}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{parentData.alternate1Name || 'Not provided'}</p>
                  )}
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="alternate1Phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="alternate1Phone"
                        type="tel"
                        value={editData.alternate1Phone}
                        onChange={(e) => handleInputChange('alternate1Phone', e.target.value)}
                        placeholder="Enter phone number"
                        className={`mt-1 ${getFieldError('Alternate Contact 1 Phone') ? 'border-red-300' : ''}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.alternate1Phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="alternate1Relationship" className="text-sm font-medium text-gray-700">Relationship</Label>
                    {isEditing ? (
                      <Input
                        id="alternate1Relationship"
                        type="text"
                        value={editData.alternate1Relationship}
                        onChange={(e) => handleInputChange('alternate1Relationship', e.target.value)}
                        placeholder="Enter relationship"
                        className={`mt-1 ${getFieldError('Alternate Contact 1 Relationship') ? 'border-red-300' : ''}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.alternate1Relationship || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Car className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="alternate1VehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Information</Label>
                    {isEditing ? (
                      <Input
                        id="alternate1VehicleInfo"
                        type="text"
                        value={editData.alternate1VehicleInfo}
                        onChange={(e) => handleInputChange('alternate1VehicleInfo', e.target.value)}
                        placeholder="Enter vehicle information"
                        className={`mt-1 ${getFieldError('Alternate Contact 1 Vehicle Info') ? 'border-red-300' : ''}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.alternate1VehicleInfo || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {!isEditing && parentData.alternate1Name && parentData.alternate1Phone && (
                  <div className="pt-2 border-t">
                    <QRCodeGenerator
                      name={parentData.alternate1Name}
                      phone={parentData.alternate1Phone}
                      title="Alternate Contact 1"
                      parentID={parentData.parentID}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alternate Contacts 2 & 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={getFieldError('Alternate Contact 2') ? 'border-red-300' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Alternate Contact 2</span>
                </CardTitle>
                <CardDescription>Secondary alternate contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="alternate2Name" className="text-sm font-medium text-gray-700">Name</Label>
                  {isEditing ? (
                    <Input
                      id="alternate2Name"
                      type="text"
                      value={editData.alternate2Name}
                      onChange={(e) => handleInputChange('alternate2Name', e.target.value)}
                      placeholder="Enter contact name"
                      className={`mt-1 ${getFieldError('Alternate Contact 2 Name') ? 'border-red-300' : ''}`}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{parentData.alternate2Name || 'Not provided'}</p>
                  )}
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="alternate2Phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="alternate2Phone"
                        type="tel"
                        value={editData.alternate2Phone}
                        onChange={(e) => handleInputChange('alternate2Phone', e.target.value)}
                        placeholder="Enter phone number"
                        className={`mt-1 ${getFieldError('Alternate Contact 2 Phone') ? 'border-red-300' : ''}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.alternate2Phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="alternate2Relationship" className="text-sm font-medium text-gray-700">Relationship</Label>
                    {isEditing ? (
                      <Input
                        id="alternate2Relationship"
                        type="text"
                        value={editData.alternate2Relationship}
                        onChange={(e) => handleInputChange('alternate2Relationship', e.target.value)}
                        placeholder="Enter relationship"
                        className={`mt-1 ${getFieldError('Alternate Contact 2 Relationship') ? 'border-red-300' : ''}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.alternate2Relationship || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Car className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="alternate2VehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Information</Label>
                    {isEditing ? (
                      <Input
                        id="alternate2VehicleInfo"
                        type="text"
                        value={editData.alternate2VehicleInfo}
                        onChange={(e) => handleInputChange('alternate2VehicleInfo', e.target.value)}
                        placeholder="Enter vehicle information"
                        className={`mt-1 ${getFieldError('Alternate Contact 2 Vehicle Info') ? 'border-red-300' : ''}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.alternate2VehicleInfo || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {!isEditing && parentData.alternate2Name && parentData.alternate2Phone && (
                  <div className="pt-2 border-t">
                    <QRCodeGenerator
                      name={parentData.alternate2Name}
                      phone={parentData.alternate2Phone}
                      title="Alternate Contact 2"
                      parentID={parentData.parentID}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={getFieldError('Alternate Contact 3') ? 'border-red-300' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Alternate Contact 3</span>
                </CardTitle>
                <CardDescription>Third alternate contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="alternate3Name" className="text-sm font-medium text-gray-700">Name</Label>
                  {isEditing ? (
                    <Input
                      id="alternate3Name"
                      type="text"
                      value={editData.alternate3Name}
                      onChange={(e) => handleInputChange('alternate3Name', e.target.value)}
                      placeholder="Enter contact name"
                      className={`mt-1 ${getFieldError('Alternate Contact 3 Name') ? 'border-red-300' : ''}`}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1">{parentData.alternate3Name || 'Not provided'}</p>
                    )}
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="alternate3Phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="alternate3Phone"
                        type="tel"
                        value={editData.alternate3Phone}
                        onChange={(e) => handleInputChange('alternate3Phone', e.target.value)}
                        placeholder="Enter phone number"
                        className={`mt-1 ${getFieldError('Alternate Contact 3 Phone') ? 'border-red-300' : ''}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.alternate3Phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="alternate3Relationship" className="text-sm font-medium text-gray-700">Relationship</Label>
                    {isEditing ? (
                      <Input
                        id="alternate3Relationship"
                        type="text"
                        value={editData.alternate3Relationship}
                        onChange={(e) => handleInputChange('alternate3Relationship', e.target.value)}
                        placeholder="Enter relationship"
                        className={`mt-1 ${getFieldError('Alternate Contact 3 Relationship') ? 'border-red-300' : ''}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.alternate3Relationship || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Car className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="alternate3VehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Information</Label>
                    {isEditing ? (
                      <Input
                        id="alternate3VehicleInfo"
                        type="text"
                        value={editData.alternate3VehicleInfo}
                        onChange={(e) => handleInputChange('alternate3VehicleInfo', e.target.value)}
                        placeholder="Enter vehicle information"
                        className={`mt-1 ${getFieldError('Alternate Contact 3 Vehicle Info') ? 'border-red-300' : ''}`}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{parentData.alternate3VehicleInfo || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {!isEditing && parentData.alternate3Name && parentData.alternate3Phone && (
                  <div className="pt-2 border-t">
                    <QRCodeGenerator
                      name={parentData.alternate3Name}
                      phone={parentData.alternate3Phone}
                      title="Alternate Contact 3"
                      parentID={parentData.parentID}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Record Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-800">Record Information</CardTitle>
              <CardDescription className="text-blue-700">
                Database record details and timestamps
              </CardDescription>
            </CardHeader>
            <CardContent className="text-blue-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p><strong>Parent ID:</strong> {parentData.parentID}</p>
                  <p><strong>SMS Enabled:</strong> {parentData.sendSMS ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p><strong>Gender:</strong> {parentData.gender === 'M' ? 'Male' : parentData.gender === 'F' ? 'Female' : parentData.gender || 'Not specified'}</p>
                  <p><strong>Main Phone:</strong> {parentData.parentPhoneMain || 'N/A'}</p>
                  <p><strong>Vehicle:</strong> {parentData.parentVehicleInfo || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Created:</strong> {parentData.createdAt.toLocaleDateString()}</p>
                  <p><strong>Updated:</strong> {parentData.updatedAt.toLocaleDateString()}</p>
                  <p><strong>Username:</strong> {user.loginID}</p>
                </div>
              </div>
              
              {!isEditing && (
                <div className="mt-4 pt-4 border-t">
                  <QRCodeGenerator
                    name={parentData.parentName || 'Parent'}
                    phone={parentData.parentPhoneMain || ''}
                    title="Parent Contact Information"
                    parentID={parentData.parentID}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
