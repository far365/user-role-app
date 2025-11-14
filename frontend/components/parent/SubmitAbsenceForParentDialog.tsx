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
import backend from "~backend/client";
import type { AbsenceRecord } from "~backend/student/pending_and_approved_absences_by_student";

interface Student {
  studentId: string;
  studentName: string;
  grade: string;
}

interface SubmitAbsenceForParentDialogProps {
  students: Student[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function SubmitAbsenceForParentDialog({ students, isOpen, onClose, onSubmitted }: SubmitAbsenceForParentDialogProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [absenceType, setAbsenceType] = useState<"full" | "half">("full");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("9:00am");
  const [endTime, setEndTime] = useState("10:00am");
  const [reason, setReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultStatus, setResultStatus] = useState<{ success: boolean; message: string; details?: string[] } | null>(null);
  const [classTimingsMap, setClassTimingsMap] = useState<Map<string, { startTime: string; endTime: string }>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && students.length > 0) {
      const uniqueGrades = [...new Set(students.map(s => s.grade))];
      Promise.all(
        uniqueGrades.map(async (grade) => {
          try {
            const timing = await backend.grades.classTimings({ grade });
            return { grade, timing };
          } catch (error) {
            console.error(`Failed to load class timings for grade ${grade}:`, error);
            return { grade, timing: null };
          }
        })
      ).then((results) => {
        const newMap = new Map();
        results.forEach(({ grade, timing }) => {
          if (timing) {
            newMap.set(grade, timing);
          }
        });
        setClassTimingsMap(newMap);
      });
    }
  }, [isOpen, students]);

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudentIds);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudentIds(newSelection);
  };

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
    const match = timeStr.match(/^(\d{2}):(\d{2})/);
    if (!match) return timeStr;
    
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    return `${hours}:${minutes} ${period}`;
  };

  const checkForConflicts = async (): Promise<{ hasConflicts: boolean; conflicts: string[] }> => {
    if (!startDate) {
      return { hasConflicts: false, conflicts: [] };
    }

    const formattedDate = format(startDate, "yyyy-MM-dd");
    const conflicts: string[] = [];

    for (const studentId of selectedStudentIds) {
      const student = students.find(s => s.studentId === studentId);
      if (!student) continue;

      try {
        const response = await backend.student.pendingAndApprovedAbsencesByStudent({ studentid: studentId });
        
        const hasConflict = response.absences.some((absence: AbsenceRecord) => {
          const absenceDate = format(new Date(absence.absencedate), "yyyy-MM-dd");
          return absenceDate === formattedDate;
        });

        if (hasConflict) {
          conflicts.push(`${student.studentName} already has a pending or approved absence on ${format(startDate, "EEE M/d/yy")}`);
        }
      } catch (error) {
        console.error(`Failed to check absences for ${student.studentName}:`, error);
        conflicts.push(`Failed to check absences for ${student.studentName}`);
      }
    }

    return { hasConflicts: conflicts.length > 0, conflicts };
  };

  const handleSubmit = async () => {
    const errors: string[] = [];

    if (selectedStudentIds.size === 0) {
      errors.push("Please select at least one student");
    }

    if (!startDate) {
      errors.push("Start date is required");
    }

    if (!reason) {
      errors.push("Reason is required");
    }

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: (
          <div>
            <p className="mb-2">Please fix the following:</p>
            <ul className="list-disc pl-4">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    if (absenceType === "half") {
      const selectedStudent = students.find(s => selectedStudentIds.has(s.studentId));
      if (selectedStudent) {
        const classTimings = classTimingsMap.get(selectedStudent.grade);
        
        if (classTimings) {
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
      }
    }

    setIsSubmitting(true);
    try {
      const { hasConflicts, conflicts } = await checkForConflicts();
      
      if (hasConflicts) {
        setResultStatus({
          success: false,
          message: "Conflict Detected",
          details: conflicts
        });
        setShowResultDialog(true);
        setIsSubmitting(false);
        return;
      }

      if (!startDate) {
        throw new Error("Start date is required");
      }

      const formattedDate = format(startDate, "yyyy-MM-dd");
      const successfulSubmissions: string[] = [];
      const failedSubmissions: string[] = [];

      for (const studentId of selectedStudentIds) {
        const student = students.find(s => s.studentId === studentId);
        if (!student) continue;

        try {
          const requestData = {
            studentid: studentId,
            absencetype: "ApprovedAbsence" as const,
            absencedate: formattedDate,
            fullday: absenceType === "full",
            absencestarttime: absenceType === "half" ? startTime : undefined,
            absenceendtime: absenceType === "half" ? endTime : undefined,
            createdbyuserid: "current-user-id",
            absencereason: reason,
            approvalstatus: "Pending" as const,
            requester_note: additionalNotes || undefined,
          };
          
          const response = await backend.student.insertAbsence(requestData);

          if (response.status === "Success") {
            successfulSubmissions.push(student.studentName);
          } else {
            failedSubmissions.push(`${student.studentName}: ${response.message}`);
          }
        } catch (error) {
          console.error(`Failed to submit absence for ${student.studentName}:`, error);
          failedSubmissions.push(`${student.studentName}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      if (failedSubmissions.length === 0) {
        setResultStatus({
          success: true,
          message: `Absence request submitted successfully for ${successfulSubmissions.length} student(s)`,
          details: successfulSubmissions
        });
        
        setSelectedStudentIds(new Set());
        setAbsenceType("full");
        setStartDate(undefined);
        setStartTime("9:00am");
        setEndTime("10:00am");
        setReason("");
        setAdditionalNotes("");
        
        onSubmitted?.();
      } else {
        setResultStatus({
          success: successfulSubmissions.length > 0,
          message: `${successfulSubmissions.length} succeeded, ${failedSubmissions.length} failed`,
          details: [...successfulSubmissions.map(s => `✓ ${s}`), ...failedSubmissions.map(s => `✗ ${s}`)]
        });
      }
      
      setShowResultDialog(true);
    } catch (error) {
      console.error("Failed to submit absence requests:", error);
      setResultStatus({
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      });
      setShowResultDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedStudentIds(new Set());
    setAbsenceType("full");
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
            <DialogTitle className="text-2xl">
              Submit Absence Request
            </DialogTitle>
            <Badge variant="outline" className="text-xs w-fit">
              Parent
            </Badge>
            <DialogDescription className="text-base font-semibold text-gray-900">
              Select students and submit absence request
            </DialogDescription>
          </DialogHeader>

          <div className="px-6">
            <div className="space-y-4 py-2">
              <div className="space-y-3 border border-gray-300 bg-gray-50 p-4 rounded-md">
                <div className="font-medium text-sm">Select Students</div>
                <div className="space-y-2">
                  {students.map((student) => (
                    <div key={student.studentId} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`student-${student.studentId}`}
                        checked={selectedStudentIds.has(student.studentId)}
                        onChange={() => toggleStudentSelection(student.studentId)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`student-${student.studentId}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {student.studentName} <span className="text-gray-600">(Grade {student.grade})</span>
                      </label>
                    </div>
                  ))}
                </div>
                {selectedStudentIds.size > 0 && (
                  <div className="text-xs text-blue-600 mt-2">
                    {selectedStudentIds.size} student(s) selected
                  </div>
                )}
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
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "EEE M/d/yy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date: Date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const oneYearFromNow = new Date(today);
                        oneYearFromNow.setFullYear(today.getFullYear() + 1);
                        const dayOfWeek = date.getDay();
                        
                        return date < today || date > oneYearFromNow || dayOfWeek === 0 || dayOfWeek === 6;
                      }}
                      modifiers={{
                        friday: (date: Date) => date.getDay() === 5
                      }}
                      modifiersClassNames={{
                        friday: "bg-yellow-200 hover:bg-yellow-300"
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
            </div>
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
            
            {resultStatus?.details && resultStatus.details.length > 0 && (
              <div className="space-y-2 border border-gray-300 bg-gray-50 p-4 rounded-md">
                <div className="font-semibold text-sm mb-3">Details:</div>
                <ul className="space-y-1 text-sm">
                  {resultStatus.details.map((detail, index) => (
                    <li key={index} className="text-gray-900">{detail}</li>
                  ))}
                </ul>
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
