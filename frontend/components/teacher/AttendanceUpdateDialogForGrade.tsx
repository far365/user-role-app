import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";
import type { ArrivalStatus } from "@/types";

interface AttendanceUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  grade: string;
  user: UserType;
  onStatusUpdated?: (rowsUpdated?: number, status?: string) => void;
}

export function AttendanceUpdateDialog({ isOpen, onClose, grade, user, onStatusUpdated }: AttendanceUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ArrivalStatus>("OnTime");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const arrivalStatuses: { value: ArrivalStatus; label: string }[] = [
    { value: "OnTime", label: "OnTime" },
    { value: "Tardy", label: "Tardy" },
    { value: "NoShow", label: "NoShow (Add Absence)" },
    { value: "ExcusedDelay", label: "ExcusedDelay" },
    { value: "Unknown", label: "Unknown" }
  ];

  const handleSubmit = async () => {
    console.log("🎯 ATTENDANCE UPDATE DEBUG - Form Submission:");
    console.log("  Grade:", grade);
    console.log("  Arrival Status:", selectedStatus);
    console.log("  User ID:", user.userID);
    console.log("  User Display Name:", user.displayName);

    if (selectedStatus === "NoShow") {
      toast({
        title: "Status Not Allowed",
        description: "This status can't be applied to entire grade",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await backend.user.updateAttendanceStatusByGrade({
        grade: grade,
        arrivalStatus: selectedStatus,
        userid: user.userID
      });

      console.log("✅ ATTENDANCE UPDATE DEBUG - API Response:", response);

      if (response.success) {
        toast({
          title: "Success",
          description: `Successfully updated attendance for ${response.rowsUpdated} students in grade ${grade} to ${selectedStatus}`,
        });
        if (onStatusUpdated) {
          onStatusUpdated(response.rowsUpdated, selectedStatus);
        }
        onClose();
      } else {
        toast({
          title: "Error",
          description: `Failed to update attendance: ${response.error || 'Unknown error'}`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("❌ ATTENDANCE UPDATE DEBUG - Error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update attendance status for entire grade</DialogTitle>
            <DialogDescription>
              Update the attendance status for all students in grade <strong>{grade}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-medium">Arrival Status</Label>
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
              <div className="text-sm font-medium text-blue-800 mb-1">Debug Info:</div>
              <div className="text-xs text-blue-700">
                <div>Grade: {grade}</div>
                <div>Selected Status: {selectedStatus}</div>
                <div>User ID: {user.userID}</div>
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
  );
}