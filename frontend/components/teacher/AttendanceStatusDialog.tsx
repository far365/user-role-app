import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface AttendanceStatusDialogProps {
  student: {
    studentid: string;
    StudentName: string;
    AttendanceStatusAndTime: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

type ArrivalStatus = "OnTime" | "OnTime-M" | "Tardy" | "Tardy-M" | "NoShow" | "Unknown";

export function AttendanceStatusDialog({ student, isOpen, onClose, onStatusUpdated }: AttendanceStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ArrivalStatus>("OnTime");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  const arrivalStatuses: { value: ArrivalStatus; label: string }[] = [
    { value: "OnTime", label: "OnTime" },
    { value: "OnTime-M", label: "OnTime-M" },
    { value: "Tardy", label: "Tardy" },
    { value: "Tardy-M", label: "Tardy-M" },
    { value: "NoShow", label: "NoShow" },
    { value: "Unknown", label: "Unknown" }
  ];

  const handleSubmit = async () => {
    console.log("🎯 INDIVIDUAL ATTENDANCE UPDATE DEBUG - Form Submission:");
    console.log("  Student ID:", student.studentid);
    console.log("  Student Name:", student.StudentName);
    console.log("  Arrival Status:", selectedStatus);

    setIsSubmitting(true);
    
    try {
      // Note: This assumes an API endpoint exists for updating individual student attendance
      // You may need to create this endpoint in the backend
      const response = await backend.student.updateAttendanceStatus({
        studentId: student.studentid,
        arrivalStatus: selectedStatus
      });

      console.log("✅ INDIVIDUAL ATTENDANCE UPDATE DEBUG - API Response:", response);

      if (response.success) {
        setResultMessage(`Successfully updated attendance for ${student.StudentName} to ${selectedStatus}`);
        setIsError(false);
        onStatusUpdated(); // Refresh the parent component's data
      } else {
        setResultMessage(`Failed to update attendance: ${response.error || 'Unknown error'}`);
        setIsError(true);
      }
      
      setShowResultDialog(true);
      
    } catch (error) {
      console.error("❌ INDIVIDUAL ATTENDANCE UPDATE DEBUG - Error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResultMessage(`Error updating attendance: ${errorMessage}`);
      setIsError(true);
      setShowResultDialog(true);
      
      toast({
        title: "Error",
        description: `Failed to update attendance: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus("OnTime");
    onClose();
  };

  const handleResultDialogClose = () => {
    setShowResultDialog(false);
    setResultMessage("");
    setIsError(false);
    onClose();
  };

  // Extract current attendance status from the status text
  const getCurrentStatus = () => {
    const match = student.AttendanceStatusAndTime.match(/Attendance:\s*(\w+)/);
    return match ? match[1] : 'Unknown';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Attendance Status</DialogTitle>
            <DialogDescription>
              Update the attendance status for <strong>{student.StudentName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-800 mb-1">Current Status:</div>
              <div className="text-sm text-gray-600">
                {student.AttendanceStatusAndTime || 'No attendance recorded'}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">New Arrival Status</Label>
              <RadioGroup
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as ArrivalStatus)}
                className="grid grid-cols-2 gap-4"
              >
                {arrivalStatuses.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={status.value} id={status.value} />
                    <Label htmlFor={status.value} className="font-normal">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">Update Info:</div>
              <div className="text-xs text-blue-700">
                <div>Student: {student.StudentName}</div>
                <div>Current: {getCurrentStatus()}</div>
                <div>New Status: {selectedStatus}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isError ? "Update Failed" : "Update Complete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resultMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleResultDialogClose}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}