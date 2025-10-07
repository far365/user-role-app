import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ViewAbsenceHistoryDialog } from "./ViewAbsenceHistoryDialog";
import backend from "~backend/client";
import type { AbsenceRecord } from "~backend/student/pending_and_approved_absences_by_student";
import type { UserRole } from "~backend/user/types";

interface SubmitAbsenceRequestDialogProps {
  student: {
    studentid: string;
    StudentName: string;
  };
  grade: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  userRole?: UserRole;
}

export function SubmitAbsenceRequestDialog({ student, grade, isOpen, onClose, onSubmitted, userRole }: SubmitAbsenceRequestDialogProps) {
  const [absenceType, setAbsenceType] = useState<"full" | "half">("full");
  const [absenceCategory, setAbsenceCategory] = useState<"UnapprovedAbsence" | "No Show">("UnapprovedAbsence");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("9:00am");
  const [endTime, setEndTime] = useState("10:00am");
  const [reason, setReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isViewHistoryOpen, setIsViewHistoryOpen] = useState(false);
  const [classTimings, setClassTimings] = useState<{ startTime: string; endTime: string } | null>(null);
  const [absenceHistory, setAbsenceHistory] = useState<AbsenceRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultStatus, setResultStatus] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-600 hover:bg-red-700">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  useEffect(() => {
    if (isOpen && grade) {
      backend.grades.classTimings({ grade })
        .then(setClassTimings)
        .catch((error) => {
          console.error("Failed to load class timings:", error);
          toast({
            title: "Error",
            description: "Failed to load class timings",
            variant: "destructive",
          });
        });
    }
  }, [isOpen, grade, toast]);

  useEffect(() => {
    if (isOpen && student.studentid) {
      setIsLoadingHistory(true);
      backend.student.pendingAndApprovedAbsencesByStudent({ studentid: student.studentid })
        .then((response) => {
          setAbsenceHistory(response.absences);
        })
        .catch((error) => {
          console.error("Failed to load absence history:", error);
          setAbsenceHistory([]);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    }
  }, [isOpen, student.studentid]);

  const parseTime = (timeStr: string): { hours: number; minutes: number } | null => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toLowerCase();
    
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return { hours, minutes };
  };

  const formatTime = (timeStr: string): string => {
    // Handle format like "08:31:00-05" (24-hour format with timezone)
    const match = timeStr.match(/^(\d{2}):(\d{2})/);
    if (!match) return timeStr;
    
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    return `${hours}:${minutes} ${period}`;
  };

  const handleSubmit = async () => {
    if (!startDate) {
      toast({
        title: "Invalid Date",
        description: "Please select a start date",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Validation Error",
        description: "Please select a reason",
        variant: "destructive",
      });
      return;
    }

    if (absenceType === "half" && classTimings) {
      const parsedStartTime = parseTime(startTime);
      const parsedEndTime = parseTime(endTime);
      const parsedClassStart = parseTime(classTimings.startTime);
      const parsedClassEnd = parseTime(classTimings.endTime);

      if (!parsedStartTime || !parsedEndTime) {
        toast({
          title: "Invalid Time",
          description: "Please enter time in format: 9:00am or 2:30pm",
          variant: "destructive",
        });
        return;
      }

      if (!parsedClassStart || !parsedClassEnd) {
        toast({
          title: "Error",
          description: "Class timings are not properly configured",
          variant: "destructive",
        });
        return;
      }

      const startMinutes = parsedStartTime.hours * 60 + parsedStartTime.minutes;
      const endMinutes = parsedEndTime.hours * 60 + parsedEndTime.minutes;
      const classStartMinutes = parsedClassStart.hours * 60 + parsedClassStart.minutes;
      const classEndMinutes = parsedClassEnd.hours * 60 + parsedClassEnd.minutes;

      if (startMinutes < classStartMinutes || endMinutes > classEndMinutes) {
        toast({
          title: "Invalid Time Range",
          description: `Half day timings must be within class hours (${classTimings.startTime} - ${classTimings.endTime})`,
          variant: "destructive",
        });
        return;
      }

      if (startMinutes >= endMinutes) {
        toast({
          title: "Invalid Time Range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formattedDate = format(startDate, "yyyy-MM-dd");
      const approvalStatus = userRole === "Teacher" ? "Approved" : "Pending";
      
      const requestData = {
        studentid: student.studentid,
        absencetype: "ApprovedAbsence",
        absencedate: formattedDate,
        fullday: absenceType === "full",
        absencestarttime: absenceType === "half" ? startTime : undefined,
        absenceendtime: absenceType === "half" ? endTime : undefined,
        createdbyuserid: "current-user-id",
        absencereason: reason,
        approvalstatus: approvalStatus,
        requester_note: additionalNotes || undefined,
      };
      
      const response = await backend.student.insertAbsence(requestData);

      if (response.status === "Success") {
        setResultStatus({
          success: true,
          message: `Absence request ${userRole === "Teacher" ? "submitted and approved" : "submitted"} successfully`,
          data: requestData
        });
        setShowResultDialog(true);
        
        setAbsenceType("full");
        setAbsenceCategory("UnapprovedAbsence");
        setStartDate(undefined);
        setStartTime("9:00am");
        setEndTime("10:00am");
        setReason("");
        setAdditionalNotes("");
        
        onSubmitted?.();
      } else {
        console.error("Insert absence error:", response.message);
        setResultStatus({
          success: false,
          message: response.message || "Failed to submit absence request",
          data: requestData
        });
        setShowResultDialog(true);
      }
    } catch (error) {
      console.error("Failed to submit absence request:", error);
      const formattedDate = startDate ? format(startDate, "yyyy-MM-dd") : "";
      const approvalStatus = userRole === "Teacher" ? "Approved" : "Pending";
      setResultStatus({
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        data: {
          studentid: student.studentid,
          absencetype: "ApprovedAbsence",
          absencedate: formattedDate,
          fullday: absenceType === "full",
          absencestarttime: absenceType === "half" ? startTime : undefined,
          absenceendtime: absenceType === "half" ? endTime : undefined,
          createdbyuserid: "current-user-id",
          absencereason: reason,
          approvalstatus: approvalStatus,
          requester_note: additionalNotes || undefined,
        }
      });
      setShowResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setAbsenceType("full");
    setAbsenceCategory("UnapprovedAbsence");
    setStartDate(undefined);
    setStartTime("9:00am");
    setEndTime("10:00am");
    setReason("");
    setAdditionalNotes("");
    onClose();
  };

  const handleResultDialogClose = () => {
    setShowResultDialog(false);
    if (resultStatus?.success) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              Submit Absence Request
              {userRole && (
                <Badge variant="outline" className="text-xs">
                  {userRole}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xl font-bold text-gray-900">
              {student.StudentName}
            </DialogDescription>
            {classTimings && (
              <div className="text-sm text-muted-foreground mt-2">
                Normal Class Hours: {formatTime(classTimings.startTime)} - {formatTime(classTimings.endTime)}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Button
              variant="link"
              className="text-blue-600 hover:text-blue-800 underline p-0 h-auto"
              onClick={() => setIsViewHistoryOpen(true)}
            >
              View Absence History/Details
            </Button>

            <div className="space-y-3 border border-gray-300 bg-gray-50 p-4 rounded-md">
              <div className="font-medium text-xs">Currently Pending/Approved Request</div>
              <div className="space-y-4 text-xs">
                {isLoadingHistory ? (
                  <div className="text-gray-500">Loading...</div>
                ) : absenceHistory.length === 0 ? (
                  <div className="text-gray-500">No pending or approved absences</div>
                ) : (
                  absenceHistory.map((req) => {
                    const date = new Date(req.absencedate).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: '2-digit' });
                    const type = req.fullday ? 'Full Day' : 'Half Day';
                    const timeRange = !req.fullday && req.absencestarttm && req.absenceendtm ? ` (${req.absencestarttm} - ${req.absenceendtm})` : '';
                    return (
                      <div key={req.absencercdid} className="pb-4 border-b last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold">{date}</div>
                          {getStatusBadge(req.approvalstatus)}
                        </div>
                        <div className="text-foreground">
                          {type}{timeRange}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Illness">Illness</SelectItem>
                  <SelectItem value="MedicalAppointment">Medical Appointment</SelectItem>
                  <SelectItem value="FamilyEmergency">Family Emergency</SelectItem>
                  <SelectItem value="FamilyVacation">Family Vacation</SelectItem>
                  <SelectItem value="Hajj/Umrah">Hajj/Umrah</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="font-medium">Absence Type</Label>
              <RadioGroup
                value={absenceCategory}
                onValueChange={(value) => setAbsenceCategory(value as "UnapprovedAbsence" | "No Show")}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UnapprovedAbsence" id="unapproved" />
                    <Label htmlFor="unapproved" className="font-normal">Unapproved Absence</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No Show" id="noshow" />
                    <Label htmlFor="noshow" className="font-normal">No Show</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="font-medium">Duration</Label>
              <RadioGroup
                value={absenceType}
                onValueChange={(value) => setAbsenceType(value as "full" | "half")}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full" className="font-normal">Full Day</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="half" id="half" />
                    <Label htmlFor="half" className="font-normal">Half Day</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Start Date:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "EEE M/d/yy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const oneYearFromNow = new Date(today);
                      oneYearFromNow.setFullYear(today.getFullYear() + 1);
                      const dayOfWeek = date.getDay();
                      
                      const isAbsenceDate = absenceHistory.some((req) => {
                        const absenceDate = new Date(req.absencedate);
                        absenceDate.setHours(0, 0, 0, 0);
                        return absenceDate.getTime() === date.getTime();
                      });
                      
                      return date < today || date > oneYearFromNow || dayOfWeek === 0 || dayOfWeek === 6 || isAbsenceDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {absenceType === "half" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time:</Label>
                  <Input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time:</Label>
                  <Input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Add any additional information here..."
                rows={4}
              />
            </div>

            {userRole === "Teacher" && (
              <div className="space-y-2">
                <Label className="font-medium">Approval Status</Label>
                <div className="p-3 border border-gray-300 rounded-md bg-green-50">
                  <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ViewAbsenceHistoryDialog
        student={student}
        absenceHistory={absenceHistory.map((req: AbsenceRecord) => ({
          date: new Date(req.absencedate).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: '2-digit' }),
          type: req.fullday ? 'Full Day' : 'Half Day',
          status: req.approvalstatus,
          startTime: req.absencestarttm,
          endTime: req.absenceendtm,
          reason: req.absencereason,
          notes: req.requester_note
        }))}
        isOpen={isViewHistoryOpen}
        onClose={() => setIsViewHistoryOpen(false)}
      />

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resultStatus?.success ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <span>Success</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span>Error</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-center text-lg font-semibold">{resultStatus?.message}</p>
            
            {resultStatus?.data && (
              <div className="space-y-2 border border-gray-300 bg-gray-50 p-4 rounded-md">
                <div className="font-semibold text-sm mb-3">Request Details:</div>
                <div className="space-y-1 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Student ID:</span>
                    <span>{resultStatus.data.studentid}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Absence Type:</span>
                    <span>{resultStatus.data.absencetype}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Absence Date:</span>
                    <span>{resultStatus.data.absencedate}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Full Day:</span>
                    <span>{resultStatus.data.fullday ? 'Yes' : 'No'}</span>
                  </div>
                  {resultStatus.data.absencestarttime && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Start Time:</span>
                      <span>{resultStatus.data.absencestarttime}</span>
                    </div>
                  )}
                  {resultStatus.data.absenceendtime && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">End Time:</span>
                      <span>{resultStatus.data.absenceendtime}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Created By User ID:</span>
                    <span>{resultStatus.data.createdbyuserid}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Absence Reason:</span>
                    <span>{resultStatus.data.absencereason}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Approval Status:</span>
                    <span>{resultStatus.data.approvalstatus}</span>
                  </div>
                  {resultStatus.data.requester_note && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Requester Note:</span>
                      <span>{resultStatus.data.requester_note}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleResultDialogClose} className="w-full">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
