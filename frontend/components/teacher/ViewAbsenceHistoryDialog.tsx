import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import backend from "~backend/client";

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
    studentid: string;
    StudentName: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ViewAbsenceHistoryDialog({ student, isOpen, onClose }: ViewAbsenceHistoryDialogProps) {
  const [absenceHistory, setAbsenceHistory] = useState<AbsenceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAbsenceHistory = async () => {
      if (!isOpen) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await backend.student.getAbsenceHistoryByStudentID({ studentID: student.studentid });
        
        const formattedHistory: AbsenceRequest[] = response.absenceHistory.map((record: any) => ({
          date: new Date(record.absencedate).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: '2-digit' }),
          type: record.fullday ? 'Full Day' : 'Half Day',
          status: record.approvalstatus,
          startTime: record.absencestarttm,
          endTime: record.absenceendtm,
          reason: record.absencereason,
          notes: record.requester_note
        }));
        
        setAbsenceHistory(formattedHistory);
      } catch (err) {
        console.error('Failed to fetch absence history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load absence history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAbsenceHistory();
  }, [isOpen, student.studentid]);

  const reasonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    absenceHistory.forEach((request) => {
      if (request.reason) {
        counts[request.reason] = (counts[request.reason] || 0) + 1;
      }
    });
    return counts;
  }, [absenceHistory]);

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

        <div className="space-y-6 py-4">
          {!isLoading && !error && absenceHistory.length > 0 && Object.keys(reasonCounts).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="font-semibold text-sm text-gray-700 mb-2">Absence Reason Summary</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(reasonCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([reason, count]) => (
                    <Badge key={reason} variant="secondary" className="text-sm">
                      {reason}: {count}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading absence history...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : absenceHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No absence history found
            </div>
          ) : (
            absenceHistory.map((request, idx) => (
              <div
                key={idx}
                className="pb-6 border-b last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-lg">{request.date}</div>
                  {getStatusBadge(request.status)}
                </div>
                <div className="text-base text-foreground mb-3">
                  {request.type}
                  {request.type === 'Half Day' && request.startTime && request.endTime && ` (${request.startTime} - ${request.endTime})`}
                </div>
                {request.reason && (
                  <div className="text-sm text-foreground/80">
                    <span className="font-semibold">Reason:</span> {request.reason}
                  </div>
                )}
                {request.notes && (
                  <div className="text-sm text-foreground/80">
                    <span className="font-semibold">Notes:</span> {request.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
