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
import { ViewAbsenceHistoryDialog } from "./ViewAbsenceHistoryDialog";
import backend from "~backend/client";

interface SubmitAbsenceRequestDialogProps {
  student: {
    studentid: string;
    StudentName: string;
  };
  grade: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

interface AbsenceRequest {
  date: string;
  type: string;
  status: string;
  startTime?: string;
  endTime?: string;
}

const mockAbsenceHistory: AbsenceRequest[] = [
  { date: "Fri 5/2/25", type: "Full Day", status: "Approved" },
  { date: "Wed 7/9/25", type: "Full Day", status: "Approved" },
  { date: "Thu 7/10/25", type: "Half Day", status: "Approved", startTime: "8:30 am", endTime: "10 am" },
  { date: "10/2/25", type: "Full Day", status: "Pending" },
];

export function SubmitAbsenceRequestDialog({ student, grade, isOpen, onClose, onSubmitted }: SubmitAbsenceRequestDialogProps) {
  const [absenceType, setAbsenceType] = useState<"full" | "half">("full");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("9:00am");
  const [endTime, setEndTime] = useState("10:00am");
  const [reason, setReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isViewHistoryOpen, setIsViewHistoryOpen] = useState(false);
  const [classTimings, setClassTimings] = useState<{ startTime: string; endTime: string } | null>(null);
  const { toast } = useToast();

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

  const handleSubmit = () => {
    const dateRegex = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\/(\d{1,2})\/(\d{2})$/i;
    const dateMatch = startDate.match(dateRegex);
    
    if (!dateMatch) {
      toast({
        title: "Invalid Date",
        description: "Please enter date in format: Fri 10/3/25",
        variant: "destructive",
      });
      return;
    }

    const month = parseInt(dateMatch[2]);
    const day = parseInt(dateMatch[3]);
    const year = 2000 + parseInt(dateMatch[4]);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Start date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (selectedDate > oneYearFromNow) {
      toast({
        title: "Invalid Date",
        description: "Start date cannot be more than one year in the future",
        variant: "destructive",
      });
      return;
    }

    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast({
        title: "Invalid Date",
        description: "Start date cannot be on a weekend",
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

    toast({
      title: "Coming Soon",
      description: "Absence request submission will be implemented when backend endpoints are ready",
    });
  };

  const handleCancel = () => {
    setAbsenceType("full");
    setStartDate("");
    setStartTime("9:00am");
    setEndTime("10:00am");
    setReason("");
    setAdditionalNotes("");
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Submit Absence Request</DialogTitle>
            <DialogDescription className="text-xl font-bold text-gray-900">
              {student.StudentName}
            </DialogDescription>
            {classTimings && (
              <div className="text-sm text-muted-foreground mt-2">
                Normal Class Hours: {classTimings.startTime.replace(/(\d{1,2}):(\d{2})(am|pm)/i, (_, h, m, p) => `${h}:${m} ${p.toUpperCase()}`)} - {classTimings.endTime.replace(/(\d{1,2}):(\d{2})(am|pm)/i, (_, h, m, p) => `${h}:${m} ${p.toUpperCase()}`)}
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

            <div className="space-y-3">
              <div className="font-medium">Currently Pending/Approved Request</div>
              <div className="pl-4 space-y-1 text-sm">
                {mockAbsenceHistory.map((req, idx) => (
                  <div key={idx}>
                    {req.date} - {req.type}
                    {req.startTime && req.endTime && ` (${req.startTime} - ${req.endTime})`} - {req.status}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="illness">Illness</SelectItem>
                  <SelectItem value="appointment">Medical Appointment</SelectItem>
                  <SelectItem value="family">Family Emergency</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date:</Label>
                <Input
                  type="text"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Fri 10/3/25"
                />
              </div>
              {absenceType === "half" && (
                <>
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
                </>
              )}
            </div>

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

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ViewAbsenceHistoryDialog
        student={student}
        absenceHistory={mockAbsenceHistory}
        isOpen={isViewHistoryOpen}
        onClose={() => setIsViewHistoryOpen(false)}
      />
    </>
  );
}
