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
  grade: string;
  userid: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

type ArrivalStatus = "OnTime" | "OnTime-M" | "Tardy" | "Tardy-M" | "NoShow" | "Unknown";

export function AttendanceStatusDialog({ student, grade, userid, isOpen, onClose, onStatusUpdated }: AttendanceStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ArrivalStatus>("OnTime");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
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
    setDebugInfo(null); // Clear previous debug info
    
    try {
      const requestData = {
        studentId: student.studentid,
        arrivalStatus: selectedStatus,
        grade: grade,
        userid: userid
      };
      
      console.log("🚀 REQUEST DATA BEING SENT:", JSON.stringify(requestData, null, 2));
      
      const response = await backend.student.updateStudentAttendanceStatus(requestData);

      console.log("✅ INDIVIDUAL ATTENDANCE UPDATE DEBUG - Full API Response:", JSON.stringify(response, null, 2));
      
      // Store debug information for display
      setDebugInfo({
        request: requestData,
        response: response,
        timestamp: new Date().toISOString()
      });

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
      
      // Store error debug information
      setDebugInfo({
        request: {
          studentId: student.studentid,
          arrivalStatus: selectedStatus,
          grade: grade,
          userid: userid
        },
        error: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          fullError: error
        },
        timestamp: new Date().toISOString()
      });
      
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
    setDebugInfo(null);
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
            <DialogTitle>Update Attendance Status By Student</DialogTitle>
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
              <div className="text-sm font-medium text-blue-800 mb-2">📋 Request Details:</div>
              <div className="text-xs text-blue-700 space-y-1">
                <div><strong>Student:</strong> {student.StudentName}</div>
                <div><strong>Student ID:</strong> {student.studentid}</div>
                <div><strong>Current Status:</strong> {getCurrentStatus()}</div>
                <div><strong>New Status:</strong> {selectedStatus}</div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="text-xs font-medium text-blue-800 mb-1">API Payload:</div>
                <pre className="text-xs bg-white p-2 border border-blue-300 rounded overflow-x-auto">
{JSON.stringify({
  grade: grade,
  arrivalStatus: selectedStatus,
  userid: userid,
  studentId: student.studentid
}, null, 2)}
                </pre>
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
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isError ? "Update Failed" : "Update Complete"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {resultMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {debugInfo && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">🔍 Debug Information</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">📤 Request Sent to Backend:</div>
                    <pre className="text-xs bg-white p-2 border rounded overflow-x-auto">
                      {JSON.stringify(debugInfo.request, null, 2)}
                    </pre>
                  </div>
                  
                  {debugInfo.response && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">📥 Backend Response:</div>
                      <pre className="text-xs bg-white p-2 border rounded overflow-x-auto">
                        {JSON.stringify(debugInfo.response, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {debugInfo.error && (
                    <div>
                      <div className="text-xs font-medium text-red-700 mb-1">❌ Error Details:</div>
                      <pre className="text-xs bg-red-50 p-2 border border-red-200 rounded overflow-x-auto">
                        {JSON.stringify(debugInfo.error, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Timestamp: {debugInfo.timestamp}
                  </div>
                </div>
              </div>
              
              {debugInfo.response?.debugInfo && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">🔧 Backend Debug Information</h4>
                  <pre className="text-xs bg-white p-2 border rounded overflow-x-auto">
                    {JSON.stringify(debugInfo.response.debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
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