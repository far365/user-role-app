import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { GraduationCap, Users, Clock, RefreshCw, AlertCircle, UserX, UserCheck, LogOut, CheckCircle, XCircle } from "lucide-react";
import { AttendanceStatusDialog } from "../teacher/AttendanceStatusByStudentDialog";
import { AttendanceUpdateDialog } from "../teacher/AttendanceUpdateDialogForGrade";
import { StudentDismissalStatusEditDialog } from "../teacher/StudentDismissalStatusEditDialog";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";
import type { Grade } from "~backend/grades/types";
import type { AbsenceRequest } from "~backend/student/pending_absence_approvals_by_grade";

interface TeacherDashboardProps {
  user: UserType;
}

interface AttendanceDismissalRecord {
  queueid: string;
  studentid: string;
  StudentName: string;
  AttendanceStatusAndTime: string;
  DismissalStatusAndTime: string;
  DismissalMethod: string;
  DismissalPickupBy: string;
}

interface PendingAbsenceState {
  requests: AbsenceRequest[];
  isLoading: boolean;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [studentRecords, setStudentRecords] = useState<AttendanceDismissalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceDismissalRecord | null>(null);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isBulkAttendanceDialogOpen, setIsBulkAttendanceDialogOpen] = useState(false);
  const [isDismissalDialogOpen, setIsDismissalDialogOpen] = useState(false);
  const [pendingAbsence, setPendingAbsence] = useState<PendingAbsenceState>({
    requests: [],
    isLoading: false
  });
  
  const { toast } = useToast();

  // Load grades on component mount
  useEffect(() => {
    const loadGrades = async () => {
      try {
        const response = await backend.grades.list();
        setGrades(response.grades);
      } catch (error) {
        console.error("Failed to load grades:", error);
        toast({
          title: "Error",
          description: "Failed to load grade list",
          variant: "destructive",
        });
      }
    };

    loadGrades();
  }, [toast]);

  const loadStudentData = async (grade: string) => {
    setIsLoading(true);
    try {
      console.log(`Loading student data for grade: ${grade}`);
      
      const response = await backend.queue.getAttendanceDismissalStatusByGrade({
        timezone: 'America/Los_Angeles',
        grade: grade
      });
      
      console.log("Student data response:", response);
      
      setStudentRecords(response.data);
      setLastRefresh(new Date());
      
      toast({
        title: "Data Loaded",
        description: `Loaded ${response.data.length} students for ${grade}`,
      });
    } catch (error) {
      console.error("Failed to load student data:", error);
      
      setStudentRecords([]);
      
      let errorMessage = "Failed to load student data";
      if (error instanceof Error) {
        errorMessage = `Failed to load student data: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingAbsenceRequests = async (grade: string) => {
    setPendingAbsence(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await backend.student.pendingAbsenceApprovalsByGrade({ grade });
      setPendingAbsence({
        requests: response.requests,
        isLoading: false
      });
    } catch (error) {
      console.error("Failed to load pending absence requests:", error);
      setPendingAbsence({
        requests: [],
        isLoading: false
      });
    }
  };

  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    loadStudentData(grade);
    loadPendingAbsenceRequests(grade);
  };

  const handleRefresh = async () => {
    if (!selectedGrade) return;
    await loadStudentData(selectedGrade);
    await loadPendingAbsenceRequests(selectedGrade);
  };

  const handleApproveAbsence = async (absencercdid: number) => {
    try {
      await backend.student.approveAbsenceRequest({ absencercdid });
      toast({
        title: "Success",
        description: "Absence request approved",
      });
      if (selectedGrade) {
        await loadPendingAbsenceRequests(selectedGrade);
      }
    } catch (error) {
      console.error("Failed to approve absence request:", error);
      toast({
        title: "Error",
        description: "Failed to approve absence request",
        variant: "destructive",
      });
    }
  };

  const handleRejectAbsence = async (absencercdid: number) => {
    try {
      await backend.student.rejectAbsenceRequest({ absencercdid });
      toast({
        title: "Success",
        description: "Absence request rejected",
      });
      if (selectedGrade) {
        await loadPendingAbsenceRequests(selectedGrade);
      }
    } catch (error) {
      console.error("Failed to reject absence request:", error);
      toast({
        title: "Error",
        description: "Failed to reject absence request",
        variant: "destructive",
      });
    }
  };

  const handleAttendanceStatusClick = (student: AttendanceDismissalRecord) => {
    setSelectedStudent(student);
    setIsAttendanceDialogOpen(true);
  };

  const handleDismissalStatusClick = (student: AttendanceDismissalRecord) => {
    setSelectedStudent(student);
    setIsDismissalDialogOpen(true);
  };

  const formatLastLogin = (lastLogin: Date | null) => {
    if (!lastLogin) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return lastLogin.toLocaleDateString();
    }
  };

  // Extract attendance status from AttendanceStatusAndTime
  const getAttendanceStatus = (statusText: string) => {
    if (!statusText) return 'Unknown';
    // Extract status before the first comma or space
    const match = statusText.match(/Attendance:\s*(\w+)/);
    return match ? match[1] : 'Unknown';
  };

  // Extract dismissal status from DismissalStatusAndTime  
  const getDismissalStatus = (statusText: string) => {
    if (!statusText) return 'Unknown';
    // Extract status before the first comma or space
    const match = statusText.match(/Dismissal:\s*(\w+)/);
    return match ? match[1] : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={user.userStatus === 'Active' ? 'default' : 'destructive'}
              className={user.userStatus === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {user.userStatus}
            </Badge>
            <span className="text-sm text-gray-500">
              Last login: {formatLastLogin(user.lastLoginDTTM)}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Teacher Dashboard</h3>
          <p className="text-sm text-gray-600">
            Monitor student attendance and dismissal status.
          </p>
        </div>
      </div>

      {/* Grade Selection and Refresh */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <CardTitle>Class Selection</CardTitle>
            </div>
          </div>
          <CardDescription>
            Select a class/grade to view student attendance and dismissal status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Last Updated */}
          {lastRefresh && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          )}
          
          {/* Grade Selection and Refresh */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedGrade} onValueChange={handleGradeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class/Grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.name} value={grade.name}>
                      {grade.name} - Building {grade.building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedGrade && (
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grade Action Buttons */}
      {selectedGrade && (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5">
            <Button 
              variant="outline" 
              className="inline-flex items-center h-10 px-3 border-2 border-blue-400 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-500 text-sm"
            >
              <UserX className="h-4 w-4 mr-1.5" />
              Absence
            </Button>
            <Button 
              variant="outline" 
              className="inline-flex items-center h-10 px-3 border-2 border-blue-400 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-500 text-sm"
            >
              <Clock className="h-4 w-4 mr-1.5" />
              Pending Approvals - {pendingAbsence.requests.length}
            </Button>
          </div>
          <div className="flex gap-2.5">
            <Button 
              variant="outline" 
              className="inline-flex items-center h-10 px-3 border-2 border-blue-400 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-500 text-sm"
              onClick={() => setIsBulkAttendanceDialogOpen(true)}
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              Attendance By Grade/Group
            </Button>
            <Button 
              variant="outline" 
              className="inline-flex items-center h-10 px-3 border-2 border-blue-400 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-500 text-sm"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Dismissal By Grade/Group
            </Button>
          </div>
        </div>
      )}

      {/* Pending Absence Requests Section */}
      {selectedGrade && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Pending Absence Requests</span>
              {pendingAbsence.requests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingAbsence.requests.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and approve/reject absence requests for {selectedGrade}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingAbsence.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
                <p className="text-gray-600">Loading absence requests...</p>
              </div>
            ) : pendingAbsence.requests.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No Pending Requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAbsence.requests.map((request) => (
                  <div
                    key={request.absencercdid}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">
                          {request.studentname}
                        </h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Date:</span> {new Date(request.absencedate).toLocaleDateString()}</p>
                          <p><span className="font-medium">Type:</span> {request.fullday ? 'Full Day' : 'Partial Day'}</p>
                          {!request.fullday && request.absencestarttm && request.absenceendtm && (
                            <p><span className="font-medium">Time:</span> {request.absencestarttm} - {request.absenceendtm}</p>
                          )}
                          {request.requester_note && (
                            <p><span className="font-medium">Note:</span> {request.requester_note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => handleApproveAbsence(request.absencercdid)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleRejectAbsence(request.absencercdid)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student List Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Student List</span>
            {selectedGrade && (
              <Badge variant="secondary" className="ml-2">
                {studentRecords.length} students
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedGrade 
              ? `Students in ${selectedGrade} with attendance and dismissal status`
              : "Select a grade to view students"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedGrade ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No grade selected</p>
              <p className="text-sm text-gray-500 mt-1">
                Please select a class/grade to view student data
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading student data...</p>
            </div>
          ) : studentRecords.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No students found</p>
              <p className="text-sm text-gray-500 mt-1">
                No student data available for this grade
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Student Cards with 3-row layout */}
              {studentRecords.map((student) => (
                <div 
                  key={`${student.queueid}-${student.studentid}`}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Row 1: Student Name (bold) + Absence Request Button */}
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-lg">
                      {student.StudentName || 'Unknown Student'}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[0.65rem] px-2 py-1 h-6 border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400"
                      onClick={() => {
                        // TODO: Implement absence request functionality
                        toast({
                          title: "Coming Soon",
                          description: "Absence request feature will be implemented soon",
                        });
                      }}
                    >
                      ✨ Submit Absence Request
                    </Button>
                  </div>
                  
                  {/* Row 2: Attendance Info (2 columns) */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-sm text-gray-600">
                      {student.AttendanceStatusAndTime || 'No attendance info'}
                    </div>
                    <div>
                      <button
                        onClick={() => handleAttendanceStatusClick(student)}
                        className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                      >
                        {getAttendanceStatus(student.AttendanceStatusAndTime)}
                      </button>
                    </div>
                  </div>
                  
                  {/* Row 3: Dismissal Info (2 columns) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-sm text-gray-600">
                      {student.DismissalStatusAndTime || 'No dismissal info'}
                    </div>
                    <div>
                      <button
                        onClick={() => handleDismissalStatusClick(student)}
                        className="text-green-600 hover:text-green-800 underline text-sm font-medium"
                      >
                        {getDismissalStatus(student.DismissalStatusAndTime)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Student Attendance Status Dialog */}
      {selectedStudent && (
        <AttendanceStatusDialog
          student={selectedStudent}
          grade={selectedGrade}
          userid={user.userID}
          isOpen={isAttendanceDialogOpen}
          onClose={() => {
            setIsAttendanceDialogOpen(false);
            setSelectedStudent(null);
          }}
          onStatusUpdated={() => {
            // Refresh data after status update
            if (selectedGrade) {
              loadStudentData(selectedGrade);
            }
          }}
        />
      )}

      {/* Bulk Attendance Update Dialog */}
      <AttendanceUpdateDialog
        isOpen={isBulkAttendanceDialogOpen}
        onClose={() => setIsBulkAttendanceDialogOpen(false)}
        grade={selectedGrade}
        user={user}
      />

      {/* Dismissal Status Dialog (reuse existing one) */}
      {selectedStudent && (
        <StudentDismissalStatusEditDialog
          student={{
            queueId: selectedStudent.queueid,
            studentId: selectedStudent.studentid,
            studentName: selectedStudent.StudentName,
            dismissalQueueStatus: getDismissalStatus(selectedStudent.DismissalStatusAndTime),
            classBuilding: 'A', // Default, can be enhanced later
            grade: selectedGrade,
            parentName: '', // Not available in current data structure
            alternateName: selectedStudent.DismissalPickupBy
          }}
          userId={user.userID}
          isOpen={isDismissalDialogOpen}
          onClose={() => {
            setIsDismissalDialogOpen(false);
            setSelectedStudent(null);
          }}
          onStatusUpdated={async (studentId: string, newStatus: string) => {
            // Refresh data after status update
            if (selectedGrade) {
              loadStudentData(selectedGrade);
            }
          }}
        />
      )}
    </div>
  );
}