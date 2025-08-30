import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Save, X, User, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DismissalQueueRecord {
  queueId: string;
  studentId: string;
  studentName: string;
  dismissalQueueStatus: string;
  classBuilding: string;
  grade: string;
  parentName?: string;
  alternateName?: string;
}

interface StudentStatusEditDialogProps {
  student: DismissalQueueRecord;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (studentId: string, newStatus: string) => Promise<void>;
}

const dismissalStatuses = [
  { value: "Standby", label: "Standby", description: "Student is waiting to be called for pickup" },
  { value: "InQueue", label: "In Queue", description: "Student is in the pickup queue" },
  { value: "Released", label: "Released", description: "Student has been released for pickup" },
  { value: "Collected", label: "Collected", description: "Student has been picked up" },
  { value: "Unknown", label: "Unknown", description: "Status is unclear or needs verification" },
  { value: "NoShow", label: "No Show", description: "Parent/guardian did not arrive for pickup" },
  { value: "EarlyDismissal", label: "Early Dismissal", description: "Student was dismissed early" },
  { value: "DirectPickup", label: "Direct Pickup", description: "Student was picked up directly from classroom" },
  { value: "LatePickup", label: "Late Pickup", description: "Student will be or was picked up late" },
  { value: "AfterCare", label: "After Care", description: "Student goes to after-school care" }
];

export function StudentStatusEditDialog({ student, isOpen, onClose, onStatusUpdated }: StudentStatusEditDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(student.dismissalQueueStatus);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (selectedStatus === student.dismissalQueueStatus) {
      toast({
        title: "No Changes",
        description: "Status has not been changed",
      });
      onClose();
      return;
    }

    try {
      setIsSaving(true);
      
      // Call the parent component's status update function
      await onStatusUpdated(student.studentId, selectedStatus);
      
      onClose();
    } catch (error) {
      console.error("Failed to update student status:", error);
      // Error handling is done in the parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedStatus(student.dismissalQueueStatus);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Standby':
        return 'bg-yellow-100 text-yellow-800';
      case 'InQueue':
        return 'bg-blue-100 text-blue-800';
      case 'Released':
        return 'bg-green-100 text-green-800';
      case 'Collected':
        return 'bg-gray-100 text-gray-800';
      case 'Unknown':
        return 'bg-red-100 text-red-800';
      case 'NoShow':
        return 'bg-orange-100 text-orange-800';
      case 'EarlyDismissal':
        return 'bg-purple-100 text-purple-800';
      case 'DirectPickup':
        return 'bg-indigo-100 text-indigo-800';
      case 'LatePickup':
        return 'bg-teal-100 text-teal-800';
      case 'AfterCare':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSelectedStatusInfo = () => {
    return dismissalStatuses.find(status => status.value === selectedStatus);
  };

  const hasStatusChanged = selectedStatus !== student.dismissalQueueStatus;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Edit Student Status</span>
          </DialogTitle>
          <DialogDescription>
            Update the dismissal queue status for {student.studentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium text-gray-700">Student</Label>
                <p className="text-sm text-gray-900">{student.studentName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Grade</Label>
                  <p className="text-sm text-gray-900">{student.grade}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Building</Label>
                  <p className="text-sm text-gray-900">{student.classBuilding}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Contact</Label>
                <p className="text-sm text-gray-900">
                  {student.alternateName || student.parentName || 'No contact information'}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Current Status</Label>
                <div className="mt-1">
                  <Badge className={getStatusColor(student.dismissalQueueStatus)}>
                    {student.dismissalQueueStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {dismissalStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center space-x-2">
                        <span>{status.label}</span>
                        {status.value === student.dismissalQueueStatus && (
                          <span className="text-xs text-gray-500">(current)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Description */}
            {getSelectedStatusInfo() && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {getSelectedStatusInfo()?.label}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {getSelectedStatusInfo()?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Change Warning */}
            {hasStatusChanged && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Status Change
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This will change the student's status from "{student.dismissalQueueStatus}" to "{selectedStatus}". 
                      This action will be logged and may affect pickup procedures.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasStatusChanged}
            className={hasStatusChanged ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
