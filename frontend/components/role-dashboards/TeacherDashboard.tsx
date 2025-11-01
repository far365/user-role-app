import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GraduationCap, Users, Clock, RefreshCw, AlertCircle, UserX, UserCheck, LogOut, CheckCircle, XCircle, ChevronDown, CalendarPlus, LayoutGrid, List, History } from "lucide-react";
import { AttendanceStatusDialog } from "../teacher/AttendanceStatusByStudentDialog";
import { AttendanceUpdateDialog } from "../teacher/AttendanceUpdateDialogForGrade";
import { DismissalUpdateDialog } from "../teacher/DismissalUpdateDialogForGrade";
import { StudentDismissalStatusEditDialog } from "../teacher/StudentDismissalStatusEditDialog";
import { SubmitAbsenceRequestDialog } from "../teacher/SubmitAbsenceRequestDialog";
import { ViewAbsenceHistoryDialog } from "../teacher/ViewAbsenceHistoryDialog";
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

interface AbsenceNotes {
  [absencercdid: number]: string;
}

interface RejectConfirmation {
  isOpen: boolean;
  absencercdid: number | null;
}

interface ApproveConfirmation {
  isOpen: boolean;
  absencercdid: number | null;
}

interface StatusCount {
  attendance_status?: string;
  dismissal_status?: string;
  count: number;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedDismissalGroup, setSelectedDismissalGroup] = useState<string>("");
  const [selectionMode, setSelectionMode] = useState<"grade" | "dismissal">("grade");
  const [studentRecords, setStudentRecords] = useState<AttendanceDismissalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceDismissalRecord | null>(null);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isBulkAttendanceDialogOpen, setIsBulkAttendanceDialogOpen] = useState(false);
  const [isBulkDismissalDialogOpen, setIsBulkDismissalDialogOpen] = useState(false);
  const [isDismissalDialogOpen, setIsDismissalDialogOpen] = useState(false);
  const [pendingAbsence, setPendingAbsence] = useState<PendingAbsenceState>({
    requests: [],
    isLoading: false
  });
  const [absenceNotes, setAbsenceNotes] = useState<AbsenceNotes>({});
  const [rejectConfirmation, setRejectConfirmation] = useState<RejectConfirmation>({
    isOpen: false,
    absencercdid: null
  });
  const [approveConfirmation, setApproveConfirmation] = useState<ApproveConfirmation>({
    isOpen: false,
    absencercdid: null
  });
  const [isAbsenceRequestsOpen, setIsAbsenceRequestsOpen] = useState(false);
  const [isStudentListOpen, setIsStudentListOpen] = useState(false);
  const [isStatusSummaryOpen, setIsStatusSummaryOpen] = useState(false);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [isSubmitAbsenceDialogOpen, setIsSubmitAbsenceDialogOpen] = useState(false);
  const [selectedStudentForAbsence, setSelectedStudentForAbsence] = useState<{ studentid: string; StudentName: string } | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isViewHistoryOpen, setIsViewHistoryOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<{ studentid: string; StudentName: string } | null>(null);
  const [lastUpdateMessage, setLastUpdateMessage] = useState<string | null>(null);
  
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
        timezone: 'America/Chicago',
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

  const loadStatusCounts = async (grade: string) => {
    setIsLoadingCounts(true);
    try {
      const response = await backend.queue.attendanceAndDismissalQueueCountsByGrade({
        sch_tz: 'America/Chicago',
        p_grade: grade
      });
      console.log("Status counts response:", response);
      console.log("Status counts data:", response.data);
      setStatusCounts(response.data);
    } catch (error) {
      console.error("Failed to load status counts:", error);
      setStatusCounts([]);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    setLastUpdateMessage(null);
    loadStudentData(grade);
    loadPendingAbsenceRequests(grade);
    loadStatusCounts(grade);
  };

  const handleRefresh = async () => {
    if (!selectedGrade) return;
    await loadStudentData(selectedGrade);
    await loadPendingAbsenceRequests(selectedGrade);
    await loadStatusCounts(selectedGrade);
  };

  const handleApproveAbsenceClick = (absencercdid: number) => {
    setApproveConfirmation({
      isOpen: true,
      absencercdid
    });
  };

  const handleApproveAbsenceConfirm = async () => {
    if (approveConfirmation.absencercdid === null) return;
    
    try {
      const note = absenceNotes[approveConfirmation.absencercdid] || '';
      const response = await backend.student.approveAbsenceRequest({ 
        absencercdid: approveConfirmation.absencercdid,
        p_approver_note: note,
        p_userid: user.userID
      });
      
      if (response.status === 'Success') {
        toast({
          title: "Success",
          description: "Absence request approved",
        });
        setAbsenceNotes(prev => {
          const updated = { ...prev };
          delete updated[approveConfirmation.absencercdid!];
          return updated;
        });
        if (selectedGrade) {
          await loadPendingAbsenceRequests(selectedGrade);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to approve absence request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to approve absence request:", error);
      toast({
        title: "Error",
        description: "Failed to approve absence request",
        variant: "destructive",
      });
    } finally {
      setApproveConfirmation({ isOpen: false, absencercdid: null });
    }
  };

  const handleRejectAbsenceClick = (absencercdid: number) => {
    setRejectConfirmation({
      isOpen: true,
      absencercdid
    });
  };

  const handleRejectAbsenceConfirm = async () => {
    if (rejectConfirmation.absencercdid === null) return;
    
    try {
      const note = absenceNotes[rejectConfirmation.absencercdid] || '';
      await backend.student.rejectAbsenceRequest({ 
        absencercdid: rejectConfirmation.absencercdid.toString(), 
        p_approver_note: note,
        p_userid: user.userID
      });
      toast({
        title: "Success",
        description: "Absence request rejected",
      });
      setAbsenceNotes(prev => {
        const updated = { ...prev };
        delete updated[rejectConfirmation.absencercdid!];
        return updated;
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
    } finally {
      setRejectConfirmation({ isOpen: false, absencercdid: null });
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

  // Remove status word from status text to avoid redundancy
  const removeStatusFromText = (statusText: string, statusType: 'Attendance' | 'Dismissal') => {
    if (!statusText) return '';
    // Remove the status word, keeping only the timestamp/additional info
    const regex = new RegExp(`${statusType}:\\s*\\w+\\s*`);
    const result = statusText.replace(regex, `${statusType}: `).trim();
    
    // If result is "Attendance: at Unknown" or "Dismissal: at Unknown", return empty
    if (result.match(new RegExp(`^${statusType}:\\s*at\\s+Unknown$`, 'i'))) {
      return '';
    }
    
    return result;
  };

  // Format alternate pickup to remove timestamp
  const formatAlternatePickup = (pickupBy: string) => {
    if (!pickupBy) return '';
    // If it contains "(alternate)", remove everything after it
    const match = pickupBy.match(/^(.+?\(alternate\))/);
    return match ? match[1] : pickupBy;
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
          
          {/* Radio Selection Mode */}
          <RadioGroup value={selectionMode} onValueChange={(value) => {
            setSelectionMode(value as "grade" | "dismissal");
            if (value === "grade") {
              setSelectedDismissalGroup("");
            } else {
              setSelectedGrade("");
            }
          }} className="flex gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grade" id="select-grade" />
              <Label htmlFor="select-grade" className="cursor-pointer">Select by Grade</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dismissal" id="select-dismissal" />
              <Label htmlFor="select-dismissal" className="cursor-pointer">Select by Dismissal Group</Label>
            </div>
          </RadioGroup>

          {/* Grade Selection */}
          {selectionMode === "grade" && (
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
          )}

          {/* Dismissal Group Selection */}
          {selectionMode === "dismissal" && (
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Select 
                  value={selectedDismissalGroup} 
                  onValueChange={(value) => {
                    setSelectedDismissalGroup(value);
                    toast({
                      title: "Not Yet Implemented",
                      description: "Dismissal group filtering is coming soon",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Dismissal Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus1">Bus 1</SelectItem>
                    <SelectItem value="bus2">Bus 2</SelectItem>
                    <SelectItem value="bus3">Bus 3</SelectItem>
                    <SelectItem value="walkers">Walkers</SelectItem>
                    <SelectItem value="carpool">Carpool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Action Buttons */}
      {selectedGrade && (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5">
						<Button 
              variant="outline" 
              className="inline-flex items-center h-7 px-2 border-2 border-blue-400 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-500 text-xs"
            >
              <Clock className="h-3 w-3 mr-1.5" />
              Pending Approvals - {pendingAbsence.requests.length}
            </Button>
          </div>
          <div className="flex gap-2.5">
            <Button 
              variant="outline" 
              className="inline-flex items-center h-7 px-2 border-2 border-blue-400 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-500 text-xs"
              onClick={() => setIsBulkAttendanceDialogOpen(true)}
            >
              <UserCheck className="h-3 w-3 mr-1.5" />
              Attendance By Grade/Group
            </Button>
          </div>
          <div className="flex gap-2.5">
            <Button 
              variant="outline" 
              className="inline-flex items-center h-7 px-2 border-2 border-blue-400 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-500 text-xs"
              onClick={() => setIsBulkDismissalDialogOpen(true)}
            >
              <LogOut className="h-3 w-3 mr-1.5" />
              Dismissal By Grade/Group
            </Button>
          </div>
        </div>
      )}

      {/* Last Update Message */}
      {selectedGrade && lastUpdateMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">{lastUpdateMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLastUpdateMessage(null)}
            className="h-7 px-2"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Status Counts Table */}
      {selectedGrade && (
        <Card>
          <Collapsible open={isStatusSummaryOpen} onOpenChange={setIsStatusSummaryOpen}>
            <CardHeader>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <CardTitle>Attendance & Dismissal Status Summary</CardTitle>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isStatusSummaryOpen ? 'transform rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CardDescription>
                Count of students by attendance and dismissal status for {selectedGrade}
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                {isLoadingCounts ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                ) : statusCounts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No status data available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Attendance Column */}
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Attendance</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-semibold">Status</th>
                            <th className="text-right py-2 px-3 font-semibold">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statusCounts
                            .filter(row => row.attendance_status && row.count > 0)
                            .map((row, index) => (
                              <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="py-2 px-3">{row.attendance_status}</td>
                                <td className="py-2 px-3 text-right font-medium">{row.count}</td>
                              </tr>
                            ))}
                          {statusCounts.filter(row => row.attendance_status && row.count > 0).length === 0 && (
                            <tr>
                              <td colSpan={2} className="py-2 px-3 text-center text-gray-500">No data</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Dismissal Column */}
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Dismissal</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-semibold">Status</th>
                            <th className="text-right py-2 px-3 font-semibold">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statusCounts
                            .filter(row => row.dismissal_status && row.count > 0)
                            .map((row, index) => (
                              <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="py-2 px-3">{row.dismissal_status}</td>
                                <td className="py-2 px-3 text-right font-medium">{row.count}</td>
                              </tr>
                            ))}
                          {statusCounts.filter(row => row.dismissal_status && row.count > 0).length === 0 && (
                            <tr>
                              <td colSpan={2} className="py-2 px-3 text-center text-gray-500">No data</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Pending Absence Requests Section */}
      {selectedGrade && (
        <Card>
          <Collapsible open={isAbsenceRequestsOpen} onOpenChange={setIsAbsenceRequestsOpen}>
            <CardHeader>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Pending Absence Requests</span>
                    {pendingAbsence.requests.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {pendingAbsence.requests.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isAbsenceRequestsOpen ? 'transform rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CardDescription>
                Review and approve/reject absence requests for {selectedGrade}
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
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
                        <div className="flex flex-col">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">
                              {request.studentname}
                            </h4>
                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                              <p><span className="font-medium">Record ID:</span> {request.absencercdid}</p>
                              <p><span className="font-medium">Date:</span> {new Date(request.absencedate).toLocaleDateString('en-US', { weekday: 'short', year: '2-digit', month: 'numeric', day: 'numeric' })}</p>
                              <p><span className="font-medium">Type:</span> {request.fullday ? 'Full Day' : `Partial Day ${request.absencestarttm && request.absenceendtm ? `(${request.absencestarttm} - ${request.absenceendtm})` : ''}`}</p>
                              {request.absencereason && (
                                <p><span className="font-medium">Reason:</span> {request.absencereason}</p>
                              )}
                              {request.requester_note && (
                                <p><span className="font-medium">Note:</span> {request.requester_note}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                              Approval/Rejection Note
                            </label>
                            <Textarea
                              placeholder="Add a note (optional)"
                              value={absenceNotes[request.absencercdid] || ''}
                              onChange={(e) => setAbsenceNotes(prev => ({
                                ...prev,
                                [request.absencercdid]: e.target.value
                              }))}
                              className="text-sm"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2 mt-3 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-600 hover:bg-green-50 h-7 px-2.5 text-xs"
                              onClick={() => handleApproveAbsenceClick(request.absencercdid)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50 h-7 px-2.5 text-xs"
                              onClick={() => handleRejectAbsenceClick(request.absencercdid)}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Student List Section */}
      {selectedGrade && (
        <Card>
          <Collapsible open={isStudentListOpen} onOpenChange={setIsStudentListOpen}>
            <CardHeader>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Student List</span>
                    <Badge variant="secondary" className="ml-2">
                      {studentRecords.length} students
                    </Badge>
                  </CardTitle>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isStudentListOpen ? 'transform rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CardDescription className="flex items-center justify-between">
                <span>Students in {selectedGrade} with attendance and dismissal status</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode("list");
                    }}
                    className="h-8 px-3"
                  >
                    <List className="w-4 h-4 mr-1.5" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMode("grid");
                    }}
                    className="h-8 px-3"
                  >
                    <LayoutGrid className="w-4 h-4 mr-1.5" />
                    Grid
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                {isLoading ? (
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
                  {studentRecords.map((student) => (
                    <div 
                      key={`${student.queueid}-${student.studentid}`}
                      className="border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {viewMode === "list" ? (
                        <div className="p-4">
                          {/* Row 1: Student Name (bold) + Absence Request Button */}
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-bold text-gray-900 text-lg">
                              {student.StudentName || 'Unknown Student'}
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 shrink-0 h-7 px-2 text-xs"
                              onClick={() => {
                                setSelectedStudentForAbsence({
                                  studentid: student.studentid,
                                  StudentName: student.StudentName
                                });
                                setIsSubmitAbsenceDialogOpen(true);
                              }}
                            >
                              <CalendarPlus className="w-3 h-3 mr-1.5" />
                              New
                            </Button>
                          </div>
                          
                          {/* Row 2: Attendance Info (2 columns) */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="text-sm text-gray-500 italic">
                              {removeStatusFromText(student.AttendanceStatusAndTime, 'Attendance') || 'No attendance info'}
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
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div className="text-sm text-gray-500 italic">
                              {removeStatusFromText(student.DismissalStatusAndTime, 'Dismissal') || 'No dismissal info'}
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
                          
                          {/* Row 4: Dismissal Method and Pickup By (only if alternate) */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-gray-600">
                              {student.DismissalMethod || 'Method: Unknown'}
                            </div>
                            <div>
                              {student.DismissalPickupBy?.toLowerCase().includes('alternate') && (
                                <span className="text-red-600 font-medium">
                                  {formatAlternatePickup(student.DismissalPickupBy)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Row 5: Absence History Link */}
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                setSelectedStudentForHistory({
                                  studentid: student.studentid,
                                  StudentName: student.StudentName
                                });
                                setIsViewHistoryOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 underline text-xs inline-flex items-center"
                            >
                              <History className="w-3 h-3 mr-1" />
                              Absence History
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          {/* Student Name + Absence Request Button */}
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-bold text-gray-900 text-lg">
                              {student.StudentName || 'Unknown Student'}
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 shrink-0 h-7 px-2 text-xs"
                              onClick={() => {
                                setSelectedStudentForAbsence({
                                  studentid: student.studentid,
                                  StudentName: student.StudentName
                                });
                                setIsSubmitAbsenceDialogOpen(true);
                              }}
                            >
                              <CalendarPlus className="w-3 h-3 mr-1.5" />
                              New
                            </Button>
                          </div>
                          
                          {/* Grid Layout: Attendance and Dismissal Side by Side */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Attendance Card */}
                            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                              <div className="text-xs font-semibold text-blue-800 mb-2">Attendance</div>
                              <div className="text-sm text-gray-500 italic mb-2">
                                {removeStatusFromText(student.AttendanceStatusAndTime, 'Attendance') || 'No attendance info'}
                              </div>
                              <button
                                onClick={() => handleAttendanceStatusClick(student)}
                                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                              >
                                {getAttendanceStatus(student.AttendanceStatusAndTime)}
                              </button>
                            </div>
                            
                            {/* Dismissal Card */}
                            <div className="border border-green-200 rounded-lg p-3 bg-green-50/50">
                              <div className="text-xs font-semibold text-green-800 mb-2">Dismissal</div>
                              <div className="text-sm text-gray-500 italic mb-2">
                                {removeStatusFromText(student.DismissalStatusAndTime, 'Dismissal') || 'No dismissal info'}
                              </div>
                              <button
                                onClick={() => handleDismissalStatusClick(student)}
                                className="text-green-600 hover:text-green-800 underline text-sm font-medium"
                              >
                                {getDismissalStatus(student.DismissalStatusAndTime)}
                              </button>
                              <div className="mt-2 text-sm text-gray-600">
                                {student.DismissalMethod || 'Method: Unknown'}
                              </div>
                              {student.DismissalPickupBy?.toLowerCase().includes('alternate') && (
                                <div className="mt-1 text-sm text-red-600 font-medium">
                                  {formatAlternatePickup(student.DismissalPickupBy)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Absence History Link */}
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                setSelectedStudentForHistory({
                                  studentid: student.studentid,
                                  StudentName: student.StudentName
                                });
                                setIsViewHistoryOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 underline text-xs inline-flex items-center"
                            >
                              <History className="w-3 h-3 mr-1" />
                              Absence History
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

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
        onStatusUpdated={(rowsUpdated?: number, status?: string) => {
          if (selectedGrade) {
            if (rowsUpdated !== undefined && status) {
              setLastUpdateMessage(`Updated attendance for ${rowsUpdated} student${rowsUpdated !== 1 ? 's' : ''} in ${selectedGrade} to ${status}`);
            }
            loadStudentData(selectedGrade);
            loadStatusCounts(selectedGrade);
          }
        }}
      />

      {/* Bulk Dismissal Update Dialog */}
      <DismissalUpdateDialog
        isOpen={isBulkDismissalDialogOpen}
        onClose={() => setIsBulkDismissalDialogOpen(false)}
        grade={selectedGrade}
        user={user}
        onStatusUpdated={(rowsUpdated?: number, status?: string) => {
          if (selectedGrade) {
            if (rowsUpdated !== undefined && status) {
              setLastUpdateMessage(`Updated dismissal status for ${rowsUpdated} student${rowsUpdated !== 1 ? 's' : ''} in ${selectedGrade} to ${status}`);
            }
            loadStudentData(selectedGrade);
            loadStatusCounts(selectedGrade);
          }
        }}
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

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveConfirmation.isOpen} onOpenChange={(open) => !open && setApproveConfirmation({ isOpen: false, absencercdid: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this absence request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveAbsenceConfirm} className="bg-green-600 hover:bg-green-700">
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectConfirmation.isOpen} onOpenChange={(open) => !open && setRejectConfirmation({ isOpen: false, absencercdid: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this absence request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectAbsenceConfirm} className="bg-red-600 hover:bg-red-700">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Absence Request Dialog */}
      {selectedStudentForAbsence && (
        <SubmitAbsenceRequestDialog
          student={selectedStudentForAbsence}
          grade={selectedGrade}
          isOpen={isSubmitAbsenceDialogOpen}
          onClose={() => {
            setIsSubmitAbsenceDialogOpen(false);
            setSelectedStudentForAbsence(null);
          }}
          onSubmitted={() => {
            if (selectedGrade) {
              loadPendingAbsenceRequests(selectedGrade);
            }
          }}
          userRole={user.userRole}
        />
      )}

      {/* View Absence History Dialog */}
      {selectedStudentForHistory && (
        <ViewAbsenceHistoryDialog
          student={selectedStudentForHistory}
          isOpen={isViewHistoryOpen}
          onClose={() => {
            setIsViewHistoryOpen(false);
            setSelectedStudentForHistory(null);
          }}
        />
      )}
    </div>
  );
}