import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";
import type { DismissalStatus } from "@/types";

interface DismissalUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  grade: string;
  user: UserType;
}

export function DismissalUpdateDialog({ isOpen, onClose, grade, user }: DismissalUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<DismissalStatus>("Unknown");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  const dismissalStatuses: { value: DismissalStatus; label: string }[] = [
    { value: "Unknown", label: "Unknown" },
    { value: "StandBy", label: "StandBy" },
    { value: "InQueue", label: "InQueue" },
    { value: "Collected", label: "Collected" },
    { value: "EarlyDismissal", label: "EarlyDismissal" },
    { value: "DirectPickup", label: "DirectPickup" },
    { value: "LatePickup", label: "LatePickup" },
    { value: "AfterCare", label: "AfterCare" },
    { value: "Released", label: "Released" }
  ];

  const handleSubmit = async () => {
    const dismissedAtTimestamp = new Date();
    
    console.log("🎯 DISMISSAL UPDATE DEBUG - Form Submission:");
    console.log("  Grade:", grade);
    console.log("  Dismissal Status:", selectedStatus);
    console.log("  User ID:", user.userID);
    console.log("  User Display Name:", user.displayName);
    console.log("  Add To Queue Method: Manual (default)");
    console.log("  Dismissed At:", dismissedAtTimestamp.toISOString());

    setIsSubmitting(true);
    
    try {
      const response = await backend.queue.updateDismissalStatusByGrade({
        grade: grade,
        dismissalQueueStatus: selectedStatus,
        addToQueueMethod: 'Manual',
        dismissedAt: dismissedAtTimestamp,
        userId: user.userID
      });

      console.log("✅ DISMISSAL UPDATE DEBUG - API Response:", response);

      if (response.success) {
        setResultMessage(`Successfully updated dismissal status for ${response.rowsUpdated} students in grade ${grade} to ${selectedStatus}`);
        setIsError(false);
      } else {
        setResultMessage(`Failed to update dismissal status: ${response.error || 'Unknown error'}`);
        setIsError(true);
      }
      
      setShowResultDialog(true);
      
    } catch (error) {
      console.error("❌ DISMISSAL UPDATE DEBUG - Error:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResultMessage(`Error updating dismissal status: ${errorMessage}`);
      setIsError(true);
      setShowResultDialog(true);
      
      toast({
        title: "Error",
        description: `Failed to update dismissal status: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus("Unknown");
    onClose();
  };

  const handleResultDialogClose = () => {
    setShowResultDialog(false);
    setResultMessage("");
    setIsError(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update dismissal status for entire grade</DialogTitle>
            <DialogDescription>
              Update the dismissal status for all students in grade <strong>{grade}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-medium">Dismissal Status</Label>
              <RadioGroup
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as DismissalStatus)}
                className="grid grid-cols-2 gap-4"
              >
                {dismissalStatuses.map((status) => (
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
                <div>Add To Queue Method: Manual</div>
                <div>Dismissed At: {new Date().toISOString()}</div>
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
