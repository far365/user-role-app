import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone, UserCheck, AlertCircle, Bug, Car, Users, Edit, Save, X, GraduationCap, TestTube, Database, Cloud, QrCode, RefreshCw, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "../QRCodeGenerator";
import { SubmitAbsenceRequestDialog } from "../teacher/SubmitAbsenceRequestDialog";
import { EditParentInfoDialog } from "./EditParentInfoDialog";
import { ManageAbsencesDialog } from "../parent/ManageAbsencesDialog";
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
  const [isSubmitAbsenceDialogOpen, setIsSubmitAbsenceDialogOpen] = useState(false);
  const [selectedStudentForAbsence, setSelectedStudentForAbsence] = useState<{ studentid: string; StudentName: string; grade: string } | null>(null);
  const [isManageAbsencesDialogOpen, setIsManageAbsencesDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [studentDebugData, setStudentDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showStudentDebug, setShowStudentDebug] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-900">Parent Dashboard</h3>
        {parentData && (
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsEditDialogOpen(true)} 
              variant="outline" 
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Parent and Alternate Info
            </Button>
            <Button
              onClick={() => setIsManageAbsencesDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
              disabled={studentData.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              Manage Absences
            </Button>
            <Button
              onClick={handleSubmitQRCode}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Submit QR Code
            </Button>
          </div>
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
                  <Label className="text-sm font-medium text-gray-700">Parent QR Code</Label>
									
									{/*<p className="text-sm text-gray-900 mt-1">{parentData.parentName || 'Not provided'}</p> */}
									
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
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-900">
                              {student.studentName} - {student.grade} - {student.classBuilding}
                            </p>
                          </div>
                          <p className="text-xs text-gray-900">
                            Arrival Status: Tardy at 7:58 AM - 15 mins late
                          </p>
                          <p className="text-xs text-gray-900">
                            Dismissal Status: as of 3:45pm
                          </p>
                          <div className="mt-1">
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
      
      {selectedStudentForAbsence && (
        <SubmitAbsenceRequestDialog
          student={{
            studentid: selectedStudentForAbsence.studentid,
            StudentName: selectedStudentForAbsence.StudentName
          }}
          grade={selectedStudentForAbsence.grade}
          isOpen={isSubmitAbsenceDialogOpen}
          onClose={() => {
            setIsSubmitAbsenceDialogOpen(false);
            setSelectedStudentForAbsence(null);
          }}
          onSubmitted={() => {
            toast({
              title: "Success",
              description: "Absence request submitted successfully",
            });
          }}
          userRole="Parent"
        />
      )}

      {parentData && (
        <EditParentInfoDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          parentData={parentData}
          username={user.loginID}
          onUpdate={(updatedParent) => setParentData(updatedParent)}
        />
      )}

      <ManageAbsencesDialog
        isOpen={isManageAbsencesDialogOpen}
        onClose={() => setIsManageAbsencesDialogOpen(false)}
        students={studentData.map(s => ({ studentId: s.studentId, studentName: s.studentName, grade: s.grade }))}
      />
    </div>
  );
}