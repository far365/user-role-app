import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone, UserCheck, AlertCircle, Bug, Car, Users, User, Edit, Save, X, GraduationCap, TestTube, Database, Cloud, QrCode, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "../QRCodeGenerator";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import type { Parent } from "~backend/parent/types";
import type { Student } from "~backend/student/types";

interface ParentDashboardProps {
  user: User;
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

interface StudentWithDismissalStatus extends Student {
  dismissalStatus?: string;
  isLoadingDismissalStatus?: boolean;
  dismissalStatusError?: string;
}

export function ParentDashboard({ user }: ParentDashboardProps) {
  const [parentData, setParentData] = useState<Parent | null>(null);
  const [studentData, setStudentData] = useState<StudentWithDismissalStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isRefreshingDismissalStatus, setIsRefreshingDismissalStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [studentDebugData, setStudentDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showStudentDebug, setShowStudentDebug] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    const fetchParentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching parent data for username:", user.loginID);
        
        const response = await backend.parent.getByUsername({ username: user.loginID });
        console.log("Parent data response:", response);
        
        setParentData(response.parent);
        
        // Initialize edit data with only editable fields
        setEditData({
          parentPhoneMain: response.parent.parentPhoneMain,
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

        // Fetch student data using the correct parentID from the parent record
        await fetchStudentData(response.parent.parentID);
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

  const fetchStudentData = async (parentID: string) => {
    try {
      setIsLoadingStudents(true);
      setStudentError(null);
      console.log("=== FRONTEND: Fetching student data from Supabase ===");
      console.log("Parent ID:", parentID);
      console.log("This will query Supabase studentrcd table where parentid =", parentID);
      
      const response = await backend.student.getByParentID({ parentID });
      console.log("=== FRONTEND: Student data response from Supabase ===", response);
      
      // Convert students to include dismissal status fields
      const studentsWithDismissalStatus: StudentWithDismissalStatus[] = response.students.map(student => ({
        ...student,
        dismissalStatus: undefined,
        isLoadingDismissalStatus: false,
        dismissalStatusError: undefined
      }));
      
      setStudentData(studentsWithDismissalStatus);
      
      // Fetch dismissal status for each student
      studentsWithDismissalStatus.forEach(student => {
        fetchDismissalStatusForStudent(student);
      });
      
      if (response.students.length === 0) {
        console.log("=== FRONTEND: No students found in Supabase ===");
        console.log("This could mean:");
        console.log("1. No student records exist in Supabase with parentid =", parentID);
        console.log("2. The parentid field in Supabase studentrcd doesn't match");
        console.log("3. The studentrcd table in Supabase is empty");
        console.log("4. RLS (Row Level Security) policies in Supabase are blocking access");
        console.log("5. The API is connecting to the wrong Supabase project");
      }
    } catch (error) {
      console.error("=== FRONTEND: Failed to fetch student data from Supabase ===", error);
      setStudentError(error instanceof Error ? error.message : "Failed to load student information from Supabase");
      // Don't show toast for student errors as it's not critical
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchDismissalStatusForStudent = async (student: StudentWithDismissalStatus) => {
    if (!student.studentId) {
      // Update student to show no ID available
      setStudentData(prev => 
        prev.map(s => 
          s.studentId === student.studentId 
            ? { ...s, dismissalStatus: undefined, isLoadingDismissalStatus: false, dismissalStatusError: "No student ID" }
            : s
        )
      );
      return;
    }

    try {
      // Update student to show loading state
      setStudentData(prev => 
        prev.map(s => 
          s.studentId === student.studentId 
            ? { ...s, isLoadingDismissalStatus: true, dismissalStatusError: undefined }
            : s
        )
      );

      console.log(`Fetching dismissal status for student ${student.studentId} in grade ${student.grade}`);
      
      // Get the dismissal queue list for this student's grade
      const response = await backend.queue.getQueueListByGrade({ grade: student.grade });
      console.log(`Dismissal queue response for grade ${student.grade}:`, response);
      
      if (!response.queueId) {
        // No open queue
        setStudentData(prev => 
          prev.map(s => 
            s.studentId === student.studentId 
              ? { ...s, dismissalStatus: undefined, isLoadingDismissalStatus: false, dismissalStatusError: "Queue info not available" }
              : s
          )
        );
        return;
      }
      
      // Find this student in the dismissal queue records
      const studentRecord = response.records.find(record => record.studentId === student.studentId);
      
      if (studentRecord) {
        // Update student with dismissal status
        setStudentData(prev => 
          prev.map(s => 
            s.studentId === student.studentId 
              ? { ...s, dismissalStatus: studentRecord.dismissalQueueStatus, isLoadingDismissalStatus: false, dismissalStatusError: undefined }
              : s
          )
        );
        console.log(`Found dismissal status for student ${student.studentId}: ${studentRecord.dismissalQueueStatus}`);
      } else {
        // Student not found in dismissal queue
        setStudentData(prev => 
          prev.map(s => 
            s.studentId === student.studentId 
              ? { ...s, dismissalStatus: undefined, isLoadingDismissalStatus: false, dismissalStatusError: "Not in queue" }
              : s
          )
        );
        console.log(`Student ${student.studentId} not found in dismissal queue for grade ${student.grade}`);
      }
    } catch (error) {
      console.error(`Failed to fetch dismissal status for student ${student.studentId}:`, error);
      
      let errorMessage = "Queue info not available";
      if (error instanceof Error) {
        if (error.message.includes("No open queue")) {
          errorMessage = "Queue info not available";
        } else {
          errorMessage = "Status unavailable";
        }
      }
      
      // Update student with error state
      setStudentData(prev => 
        prev.map(s => 
          s.studentId === student.studentId 
            ? { 
                ...s, 
                dismissalStatus: undefined, 
                isLoadingDismissalStatus: false, 
                dismissalStatusError: errorMessage
              }
            : s
        )
      );
    }
  };

  const handleRefreshDismissalStatus = async () => {
    if (studentData.length === 0) {
      toast({
        title: "No Students",
        description: "No students found to refresh dismissal status",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRefreshingDismissalStatus(true);
      
      console.log("Refreshing dismissal status for all students");
      
      // Refresh dismissal status for each student
      const refreshPromises = studentData.map(student => fetchDismissalStatusForStudent(student));
      await Promise.all(refreshPromises);
      
      toast({
        title: "Status Refreshed",
        description: "Dismissal status has been updated for all students",
      });
    } catch (error) {
      console.error("Failed to refresh dismissal status:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dismissal status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingDismissalStatus(false);
    }
  };

  const handleStudentDebug = async () => {
    if (!parentData) {
      toast({
        title: "Debug Error",
        description: "Parent data not loaded yet",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("=== FRONTEND: Fetching comprehensive Supabase student debug data ===");
      console.log("Parent ID for debug:", parentData.parentID);
      
      const response = await backend.student.debug({ parentID: parentData.parentID });
      console.log("=== FRONTEND: Supabase student debug response ===", response);
      
      setStudentDebugData(response);
      setShowStudentDebug(true);
      
      // Enhanced toast message with more details
      const totalStudents = response.studentrcdRecords.length;
      const studentsForParent = response.specificStudentsForParent.length;
      const tableExists = response.tableExists;
      const connectionOk = response.connectionTest?.success;
      const supabaseConfigured = response.supabaseConfig?.supabaseUrl === 'CONFIGURED';
      
      let debugSummary = `Supabase connection: ${connectionOk ? 'OK' : 'FAILED'}`;
      debugSummary += `\nSupabase configured: ${supabaseConfigured ? 'YES' : 'NO'}`;
      debugSummary += `\nTable exists: ${tableExists ? 'YES' : 'NO'}`;
      debugSummary += `\nTotal students in Supabase: ${totalStudents}`;
      debugSummary += `\nStudents for this parent: ${studentsForParent}`;
      
      toast({
        title: "Supabase Student Debug Complete",
        description: debugSummary,
      });
    } catch (error) {
      console.error("Failed to fetch Supabase student debug data:", error);
      toast({
        title: "Supabase Student Debug Error",
        description: "Failed to fetch student debug information from Supabase",
        variant: "destructive",
      });
    }
  };

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
    console.log("=== SAVE OPERATION START ===");
    console.log("Current edit data:", editData);
    console.log("Original parent data:", parentData);
    
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
      
      console.log("Calling backend.parent.update with:", {
        username: user.loginID,
        ...editData,
      });
      
      const response = await backend.parent.update({
        username: user.loginID,
        ...editData,
      });
      
      console.log("Backend response:", response);
      
      setParentData(response.parent);
      setIsEditing(false);
      setValidationErrors({});
      
      toast({
        title: "Success",
        description: "Parent information updated successfully.",
      });
    } catch (error) {
      console.error("=== SAVE OPERATION ERROR ===");
      console.error("Failed to update parent data:", error);
      
      let errorMessage = "Failed to update parent information. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = `Update failed: ${error.message}`;
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      console.log("=== SAVE OPERATION END ===");
    }
  };

  const handleInputChange = (field: keyof EditableParentData, value: string) => {
    console.log(`Input change: ${field} = ${value}`);
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation errors for this field when user starts typing
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

  const handleSubmitQRCode = () => {
    toast({
      title: "QR Code Submitted",
      description: "QR Code submission simulated for testing purposes.",
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  const getDismissalStatusColor = (status: string) => {
    switch (status) {
      case 'Standby':
        return 'bg-yellow-100 text-yellow-800';
      case 'InQueue':
        return 'bg-blue-100 text-blue-800';
      case 'Released':
        return 'bg-green-100 text-green-800';
      case 'Collected':
        return 'bg-gray-100 text-gray-800';
      case 'Unknown':
        return 'bg-red-100 text-red-800';
      case 'NoShow':
        return 'bg-orange-100 text-orange-800';
      case 'EarlyDismissal':
        return 'bg-purple-100 text-purple-800';
      case 'DirectPickup':
        return 'bg-indigo-100 text-indigo-800';
      case 'LatePickup':
        return 'bg-teal-100 text-teal-800';
      case 'AfterCare':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Parent: Loading...</h2>
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
      {/* Status and Last Login Header */}
      {parentData && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge 
              variant={parentData.parentRecordStatus === 'Active' ? 'default' : 'destructive'}
              className={parentData.parentRecordStatus === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {parentData.parentRecordStatus || 'Unknown'}
            </Badge>
            <span className="text-sm text-gray-600">Last Login: {formatDate(user.lastLoginDTTM)}</span>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Parent Dashboard</h3>
        <h3 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Parent Dashboard2</h3>
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
          {/* Non-Editable Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5" />
                  <span>Parent Information</span>
                </div>
                <Button 
                  onClick={handleRefreshDismissalStatus} 
                  variant="outline" 
                  size="sm"
                  disabled={isRefreshingDismissalStatus || studentData.length === 0}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingDismissalStatus ? 'animate-spin' : ''}`} />
                  {isRefreshingDismissalStatus ? 'Refreshing...' : 'Refresh Status'}
                </Button>
              </CardTitle>
              <CardDescription>Your account details and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Parent Name</Label>
                  <p className="text-sm text-gray-900 mt-1">{parentData.parentName || 'Not provided'}</p>
                  <div className="mt-2">
                    <QRCodeGenerator
                      name={parentData.parentName || 'Parent'}
                      phone={parentData.parentPhoneMain || ''}
                      title="Parent Contact"
                      parentID={parentData.parentID}
                    />
                  </div>
                </div>
              </div>

              {/* Student Information - Enhanced with dismissal status */}
              <div>
                <Label className="text-sm font-bold text-blue-600">Students</Label>
                {isLoadingStudents ? (
                  <p className="text-sm text-gray-600 mt-1">Loading students...</p>
                ) : studentError ? (
                  <p className="text-sm text-red-600 mt-1">Unable to load student information</p>
                ) : studentData.length === 0 ? (
                  <p className="text-sm text-gray-600 mt-1">No students found</p>
                ) : (
                  <div className="mt-1 space-y-2">
                    {studentData.map((student, index) => (
                      <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {student.studentName} - Grade {student.grade} - {student.classBuilding}
                          </p>
                        </div>
                        <div className="ml-4">
                          {student.isLoadingDismissalStatus ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                              <span className="text-xs text-gray-500">Loading...</span>
                            </div>
                          ) : student.dismissalStatus ? (
                            <Badge className={getDismissalStatusColor(student.dismissalStatus)}>
                              {student.dismissalStatus}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {student.dismissalStatusError || 'Status unavailable'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <Button 
                    onClick={handleStudentDebug} 
                    variant="outline" 
                    size="sm"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Debug Students
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span>Editable Information</span>
                </div>
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button onClick={handleEdit} variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Record
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
              </CardTitle>
              <CardDescription>Update your contact information and vehicle details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Phone and Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentPhoneMain" className="text-sm font-medium text-gray-700">Primary Phone</Label>
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
                
                <div>
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

              {/* Alternate Contact 1 */}
              <div className={`p-4 border rounded-lg ${getFieldError('Alternate Contact 1') ? 'border-red-300 bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Alternate Contact 1</h4>
                  {!isEditing && parentData.alternate1Name && parentData.alternate1Phone && (
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
                  
                  <div>
                    <Label htmlFor="alternate1Phone" className="text-sm font-medium text-gray-700">Phone</Label>
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
                  
                  <div>
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
                  
                  <div>
                    <Label htmlFor="alternate1VehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Info</Label>
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
              </div>

              {/* Alternate Contact 2 */}
              <div className={`p-4 border rounded-lg ${getFieldError('Alternate Contact 2') ? 'border-red-300 bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Alternate Contact 2</h4>
                  {!isEditing && parentData.alternate2Name && parentData.alternate2Phone && (
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
                  
                  <div>
                    <Label htmlFor="alternate2Phone" className="text-sm font-medium text-gray-700">Phone</Label>
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
                  
                  <div>
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
                  
                  <div>
                    <Label htmlFor="alternate2VehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Info</Label>
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
              </div>

              {/* Alternate Contact 3 */}
              <div className={`p-4 border rounded-lg ${getFieldError('Alternate Contact 3') ? 'border-red-300 bg-red-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Alternate Contact 3</h4>
                  {!isEditing && parentData.alternate3Name && parentData.alternate3Phone && (
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
                  
                  <div>
                    <Label htmlFor="alternate3Phone" className="text-sm font-medium text-gray-700">Phone</Label>
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
                  
                  <div>
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
                  
                  <div>
                    <Label htmlFor="alternate3VehicleInfo" className="text-sm font-medium text-gray-700">Vehicle Info</Label>
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
              </div>
            </CardContent>
          </Card>

          {/* Submit QR Code Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleSubmitQRCode}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Submit QR Code
            </Button>
          </div>

          {/* Student Debug Information */}
          {showStudentDebug && studentDebugData && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Supabase Student Debug Information</CardTitle>
                <CardDescription className="text-yellow-700">
                  Comprehensive Supabase database analysis for troubleshooting student data
                </CardDescription>
              </CardHeader>
              <CardContent className="text-yellow-800">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium">Supabase Connection & Configuration:</p>
                    <div className="bg-white p-2 rounded text-xs">
                      <p><strong>Database Connection:</strong> {studentDebugData.connectionTest?.success ? '✅ OK' : '❌ FAILED'}</p>
                      <p><strong>Supabase URL:</strong> {studentDebugData.supabaseConfig?.supabaseUrl || 'NOT_CONFIGURED'}</p>
                      <p><strong>Supabase Key:</strong> {studentDebugData.supabaseConfig?.supabaseKey || 'NOT_CONFIGURED'}</p>
                      <p><strong>REST URL:</strong> {studentDebugData.supabaseConfig?.restUrl || 'NOT_AVAILABLE'}</p>
                      {studentDebugData.connectionTest?.error && (
                        <p><strong>Connection Error:</strong> {studentDebugData.connectionTest.error}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="font-medium">Students for this Parent ({studentDebugData.specificStudentsForParent.length}):</p>
                    <div className="bg-white p-2 rounded text-xs max-h-40 overflow-auto">
                      {studentDebugData.specificStudentsForParent.length === 0 ? (
                        <p className="text-red-600">❌ No students found in Supabase with parentid = "{studentDebugData.parentID}"</p>
                      ) : (
                        studentDebugData.specificStudentsForParent.map((record: any, index: number) => (
                          <div key={index} className="mb-2 p-1 border-b">
                            <strong>Student:</strong> {record.studentname || 'N/A'} | 
                            <strong> ID:</strong> {record.studentid || 'N/A'} | 
                            <strong> Parent ID:</strong> {record.parentid || 'N/A'}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium">All Students in Supabase Database ({studentDebugData.studentrcdRecords.length}):</p>
                    <div className="bg-white p-2 rounded text-xs max-h-40 overflow-auto">
                      {studentDebugData.studentrcdRecords.length === 0 ? (
                        <p className="text-red-600">❌ CRITICAL: studentrcd table in Supabase is completely empty!</p>
                      ) : (
                        <>
                          <p className="text-green-600 mb-2">✅ Found {studentDebugData.studentrcdRecords.length} total students in Supabase</p>
                          {studentDebugData.studentrcdRecords.slice(0, 10).map((record: any, index: number) => (
                            <div key={index} className="mb-2 p-1 border-b">
                              <strong>Student:</strong> {record.studentname || 'N/A'} | 
                              <strong> ID:</strong> {record.studentid || 'N/A'} | 
                              <strong> Parent ID:</strong> {record.parentid || 'N/A'} |
                              <strong> Grade:</strong> {record.grade || 'N/A'}
                            </div>
                          ))}
                          {studentDebugData.studentrcdRecords.length > 10 && (
                            <p className="text-gray-500">... and {studentDebugData.studentrcdRecords.length - 10} more</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
