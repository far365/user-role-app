import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CalendarPlus, MessageSquare, CheckCircle, XCircle, AlertCircle, X, History } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SubmitAbsenceRequestDialog } from "../teacher/SubmitAbsenceRequestDialog";
import { ViewAbsenceHistoryDialog } from "../teacher/ViewAbsenceHistoryDialog";
import backend from "~backend/client";
import type { AbsenceRecord } from "~backend/student/pending_and_approved_absences_by_student";

interface StudentAbsenceCardProps {
  studentId: string;
  studentName: string;
  grade: string;
}

export function StudentAbsenceCard({ studentId, studentName, grade }: StudentAbsenceCardProps) {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitAbsenceDialogOpen, setIsSubmitAbsenceDialogOpen] = useState(false);
  const [isViewHistoryOpen, setIsViewHistoryOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAbsences = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await backend.student.pendingAndApprovedAbsencesByStudent({ studentid: studentId });
        setAbsences(response.absences);
      } catch (err) {
        console.error(`Failed to fetch absences for student ${studentId}:`, err);
        setError(err instanceof Error ? err.message : "Failed to load absences");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAbsences();
  }, [studentId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "N/A";
    return timeStr;
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleCancelPendingRequest = async (absencercdid: number) => {
    setCancellingId(absencercdid);
    try {
      await backend.student.rejectAbsenceRequest({
        absencercdid: absencercdid.toString(),
        p_approver_note: "Cancelled by parent",
        p_userid: studentId
      });

      toast({
        title: "Success",
        description: "Absence request cancelled successfully",
      });

      const response = await backend.student.pendingAndApprovedAbsencesByStudent({ studentid: studentId });
      setAbsences(response.absences);
    } catch (err) {
      console.error("Failed to cancel absence request:", err);
      toast({
        title: "Error",
        description: "Failed to cancel absence request",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-blue-900">
            Absences for {studentName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading absences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-red-900">
            Absences for {studentName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (absences.length === 0) {
    return (
      <Card className="border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            Absences for {studentName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No absence records found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-100">
      <CardHeader className="py-3 pb-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-blue-900">
            {studentName}
            <span className="text-sm font-normal text-gray-600 ml-2">Grade {grade}</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 shrink-0 h-6 px-2 text-xs"
            onClick={() => setIsSubmitAbsenceDialogOpen(true)}
          >
            <CalendarPlus className="w-3 h-3 mr-1.5" />
            New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {absences.map((absence) => (
            <div key={absence.absencercdid} className="border rounded-lg p-2 bg-gray-50">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(absence.absencedate)}
                  </div>
                </div>
                {getApprovalStatusBadge(absence.approvalstatus)}
              </div>
              <div className="text-xs text-gray-600 pl-6">
                {absence.fullday ? "Full Day" : `${formatTime(absence.absencestarttm)} - ${formatTime(absence.absenceendtm)}`}
              </div>

              {absence.absencereason && (
                <div className="text-xs text-gray-700 mt-1.5 pl-6">
                  <span className="font-medium">Reason:</span> {absence.absencereason}
                </div>
              )}

              {absence.requester_note && (
                <div className="flex items-start gap-2 mt-1.5 pl-6 text-xs">
                  <MessageSquare className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-800 flex-1">{absence.requester_note}</span>
                </div>
              )}

              {absence.approver_note && (
                <div className="flex items-start gap-2 mt-1.5 pl-6 text-xs">
                  <MessageSquare className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-800 flex-1">{absence.approver_note}</span>
                </div>
              )}
              
              {absence.approvalstatus.toLowerCase() === 'pending' && (
                <div className="flex justify-end mt-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 h-6 px-2 text-xs"
                    onClick={() => handleCancelPendingRequest(absence.absencercdid)}
                    disabled={cancellingId === absence.absencercdid}
                  >
                    {cancellingId === absence.absencercdid ? (
                      <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-blue-600"></div>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Button
            variant="link"
            className="text-blue-600 hover:text-blue-800 underline p-0 h-auto text-xs"
            onClick={() => setIsViewHistoryOpen(true)}
          >
            <History className="w-3 h-3 mr-1" />
            History
          </Button>
        </div>
      </CardContent>
      
      <SubmitAbsenceRequestDialog
        student={{
          studentid: studentId,
          StudentName: studentName
        }}
        grade={grade}
        isOpen={isSubmitAbsenceDialogOpen}
        onClose={() => setIsSubmitAbsenceDialogOpen(false)}
        onSubmitted={() => {
          toast({
            title: "Success",
            description: "Absence request submitted successfully",
          });
          window.location.reload();
        }}
        userRole="Parent"
      />
      
      <ViewAbsenceHistoryDialog
        student={{
          studentid: studentId,
          StudentName: studentName
        }}
        absenceHistory={absences.map((req) => ({
          date: new Date(req.absencedate).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: '2-digit' }),
          type: req.fullday ? 'Full Day' : 'Half Day',
          status: req.approvalstatus,
          startTime: req.absencestarttm,
          endTime: req.absenceendtm,
          reason: req.absencereason,
          notes: req.requester_note
        }))}
        isOpen={isViewHistoryOpen}
        onClose={() => setIsViewHistoryOpen(false)}
      />
    </Card>
  );
}
