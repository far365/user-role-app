import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AbsenceRequest {
  date: string;
  type: string;
  status: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  notes?: string;
}

interface ViewAbsenceHistoryDialogProps {
  student: {
    StudentName: string;
  };
  absenceHistory: AbsenceRequest[];
  isOpen: boolean;
  onClose: () => void;
}

export function ViewAbsenceHistoryDialog({ student, absenceHistory, isOpen, onClose }: ViewAbsenceHistoryDialogProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Absence History/Details</DialogTitle>
          <DialogDescription className="text-xl font-bold text-gray-900">
            {student.StudentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {absenceHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No absence history found
            </div>
          ) : (
            <div className="space-y-3">
              {absenceHistory.map((request, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">{request.date}</div>
                      <div className="text-sm text-gray-600">
                        {request.type}
                        {request.startTime && request.endTime && ` (${request.startTime} - ${request.endTime})`}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  {request.reason && (
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Reason:</span> {request.reason}
                    </div>
                  )}
                  {request.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Notes:</span> {request.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
