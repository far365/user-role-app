import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone, UserCheck, AlertCircle, Car, Users, Edit, Save, X, GraduationCap, QrCode, RefreshCw, FileText, ExternalLink, Bell } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "../QRCodeGenerator";
import { SubmitAbsenceRequestDialog } from "../teacher/SubmitAbsenceRequestDialog";
import { EditParentInfoDialog } from "./EditParentInfoDialog";
import { ManageAbsencesPage } from "../parent/ManageAbsencesPage";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import type { ParentInfo } from "~backend/parent/get_parent_info";
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
interface StudentWithDismissalStatus {
  studentId: string;
  studentName: string;
  grade: string;
  dismissalStatus?: string;
  attendanceStatus?: string;
  dismissalMethod?: string;
  dismissalPickupBy?: string;
  attendanceStatusAndTime?: string;
  dismissalStatusAndTime?: string;
  isLoadingDismissalStatus?: boolean;
  dismissalStatusError?: string;
}
export function ParentDashboard({ user }: ParentDashboardProps) {
  const [parentData, setParentData] = useState<ParentInfo | null>(null);
  const [studentData, setStudentData] = useState<StudentWithDismissalStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isRefreshingDismissalStatus, setIsRefreshingDismissalStatus] = useState(false);
  const [isSubmitAbsenceDialogOpen, setIsSubmitAbsenceDialogOpen] = useState(false);
  const [selectedStudentForAbsence, setSelectedStudentForAbsence] = useState<{ studentid: string; StudentName: string; grade: string } | null>(null);
  const [showManageAbsencesPage, setShowManageAbsencesPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { toast } = useToast();
  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching parent data for username:", user.loginID);
       
        const response = await backend.parent.getParentInfo({ username: user.loginID });
        console.log("Parent data response:", response);
       
        setParentData(response);
        // Fetch student data using the correct parentID from the parent record
        await fetchStudentData(response.parentID);
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
     
      const response = await backend.student.getStudentsByParentID({ parentId: parentID });
      console.log("=== FRONTEND: Student data response from Supabase ===", response);
     
      // Convert students to include dismissal status fields
      const studentsWithDismissalStatus: StudentWithDismissalStatus[] = response.students.map(student => ({
        studentId: student.studentid,
        studentName: student.studentname,
        grade: student.grade,
        dismissalStatus: undefined,
        isLoadingDismissalStatus: false,
        dismissalStatusError: undefined
      }));
     
      setStudentData(studentsWithDismissalStatus);
     
      // Fetch dismissal status for each student
      studentsWithDismissalStatus.forEach(student => {
        fetchDismissalStatusForStudent(student, parentID);
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
  const fetchDismissalStatusForStudent = async (student: StudentWithDismissalStatus, parentID?: string) => {
    const effectiveParentID = parentID || parentData?.parentID;
    if (!student.studentId || !effectiveParentID) {
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
      setStudentData(prev =>
        prev.map(s =>
          s.studentId === student.studentId
            ? { ...s, isLoadingDismissalStatus: true, dismissalStatusError: undefined }
            : s
        )
      );
      
      console.log(`Fetching attendance/dismissal status for parent ${effectiveParentID}`);
     
      const response = await backend.queue.getAttendanceDismissalStatusByParent({
        timezone: 'America/Chicago',
        parentId: effectiveParentID
      });
      
      console.log(`Attendance/dismissal response for parent ${effectiveParentID}:`, response);
      console.log(`Response data:`, response.data);
      console.log(`Looking for student ID: "${student.studentId}" (type: ${typeof student.studentId})`);
      console.log(`Available student IDs in response:`, response.data?.map(r => `"${r.studentid}" (type: ${typeof r.studentid})`) || []);
     
      const studentRecord = response.data?.find(record => {
        const match = String(record.studentid) === String(student.studentId);
        console.log(`Comparing record.studentid="${record.studentid}" with student.studentId="${student.studentId}": ${match}`);
        return match;
      });
     
      if (studentRecord) {
        const dismissalStatus = studentRecord.DismissalStatusAndTime?.match(/Dismissal:\s*(\w+)/)?.[1] || 'Unknown';
        const attendanceStatus = studentRecord.AttendanceStatusAndTime || '';
        const dismissalMethod = studentRecord.DismissalMethod || '';
        const dismissalPickupBy = studentRecord.DismissalPickupBy || '';
        const attendanceStatusAndTime = studentRecord.AttendanceStatusAndTime || '';
        const dismissalStatusAndTime = studentRecord.DismissalStatusAndTime || '';
        
        setStudentData(prev =>
          prev.map(s =>
            s.studentId === student.studentId
              ? { 
                  ...s, 
                  dismissalStatus,
                  attendanceStatus,
                  dismissalMethod,
                  dismissalPickupBy,
                  attendanceStatusAndTime,
                  dismissalStatusAndTime,
                  isLoadingDismissalStatus: false, 
                  dismissalStatusError: undefined 
                }
              : s
          )
        );
        console.log(`Found status for student ${student.studentId}: ${dismissalStatus}`);
      } else {
        setStudentData(prev =>
          prev.map(s =>
            s.studentId === student.studentId
              ? { ...s, dismissalStatus: undefined, isLoadingDismissalStatus: false, dismissalStatusError: "Not in queue" }
              : s
          )
        );
        console.log(`Student ${student.studentId} not found in response`);
      }
    } catch (error) {
      console.error(`Failed to fetch status for student ${student.studentId}:`, error);
     
      let errorMessage = "Status unavailable";
      if (error instanceof Error) {
        if (error.message.includes("No open queue")) {
          errorMessage = "Queue info not available";
        } else {
          errorMessage = "Status unavailable";
        }
      }
     
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

  const getAttendanceStatus = (statusText: string) => {
    if (!statusText) return 'Unknown';
    const match = statusText.match(/Attendance:\s*(\w+)/);
    return match ? match[1] : 'Unknown';
  };

  const getDismissalStatus = (statusText: string) => {
    if (!statusText) return 'Unknown';
    const match = statusText.match(/Dismissal:\s*(\w+)/);
    return match ? match[1] : 'Unknown';
  };

  const removeStatusFromText = (statusText: string, statusType: 'Attendance' | 'Dismissal') => {
    if (!statusText) return '';
    const regex = new RegExp(`${statusType}:\\s*\\w+\\s*`);
    const result = statusText.replace(regex, `${statusType}: `).trim();
    
    if (result.match(new RegExp(`^${statusType}:\\s*at\\s+Unknown$`, 'i'))) {
      return '';
    }
    
    return result;
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
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-3">
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
        
        {/* Upcoming Events/Activities Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Upcoming Event/Activities Reminder(s)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700">
              Group Photos
            </div>
          </CardContent>
        </Card>

        {parentData && (
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => setIsEditDialogOpen(true)} 
              variant="outline" 
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 w-fit h-8 px-3 text-sm"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit Parent and Alternate Info
            </Button>
            <Button
              onClick={() => setShowManageAbsencesPage(true)}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 w-fit h-8 px-3 text-sm"
              disabled={studentData.length === 0}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Manage Absences
            </Button>
            <Button
              onClick={() => window.open('https://hquranacademy.org', '_blank')}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-50 w-fit h-8 px-3 text-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Quick Links
            </Button>
            {/* <Button
              onClick={handleSubmitQRCode}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 w-fit h-8 px-3 text-sm"
            >
              <QrCode className="w-3.5 h-3.5 mr-1.5" />
              Submit QR Code
            </Button> */}
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
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 h-8 px-3 text-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshingDismissalStatus ? 'animate-spin' : ''}`} />
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
                      <div key={student.studentId} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-base font-bold text-gray-900">
                              {student.studentName} <span className="text-sm font-normal text-gray-500">({student.grade})</span>
                            </h4>
                            <a
                              href={`https://hquranacademy.org/grade-${student.grade.toLowerCase()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1"
                            >
                              {student.grade} info
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        
                        {student.isLoadingDismissalStatus ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            <span className="text-sm text-gray-500">Loading...</span>
                          </div>
                        ) : student.dismissalStatusError ? (
                          <p className="text-sm text-gray-500">{student.dismissalStatusError}</p>
                        ) : student.attendanceStatusAndTime || student.dismissalStatusAndTime ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="text-sm text-gray-500 italic">
                                {removeStatusFromText(student.attendanceStatusAndTime || '', 'Attendance') || 'No attendance info'}
                              </div>
                              <div className="text-sm font-medium text-blue-600">
                                {getAttendanceStatus(student.attendanceStatusAndTime || '')}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-2">
                              <div className="text-sm text-gray-500 italic">
                                {removeStatusFromText(student.dismissalStatusAndTime || '', 'Dismissal') || 'No dismissal info'}
                              </div>
                              <div className="text-sm font-medium text-green-600">
                                {getDismissalStatus(student.dismissalStatusAndTime || '')}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-gray-600">
                                {student.dismissalMethod || 'Method: Unknown'}
                              </div>
                              <div>
                                {student.dismissalPickupBy && student.dismissalPickupBy.toLowerCase().includes('alternate') && (
                                  <span className="text-red-600 font-medium">
                                    {student.dismissalPickupBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No attendance/dismissal data available</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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

      {showManageAbsencesPage && (
        <div className="fixed inset-0 z-50 bg-white">
          <ManageAbsencesPage
            students={studentData.map(s => ({ studentId: s.studentId, studentName: s.studentName, grade: s.grade }))}
            onBack={() => setShowManageAbsencesPage(false)}
          />
        </div>
      )}
    </div>
  );
}