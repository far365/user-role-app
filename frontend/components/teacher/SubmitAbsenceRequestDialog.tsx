import { useState } from "react";
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

interface SubmitAbsenceRequestDialogProps {
  student: {
    studentid: string;
    StudentName: string;
  };
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

export function SubmitAbsenceRequestDialog({ student, isOpen, onClose, onSubmitted }: SubmitAbsenceRequestDialogProps) {
  const [absenceType, setAbsenceType] = useState<"full" | "half">("full");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("9:00am");
  const [endTime, setEndTime] = useState("10:00am");
  const [reason, setReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isViewHistoryOpen, setIsViewHistoryOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
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
                  <div className="col-span-2 space-y-2">
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
