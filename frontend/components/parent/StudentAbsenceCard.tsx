import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, MessageSquare, CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SubmitAbsenceRequestDialog } from "../teacher/SubmitAbsenceRequestDialog";
import backend from "~backend/client";

interface AbsenceRecord {
  absencercdid: number;
  absencedate: string;
  fullday: boolean;
  absencestarttm?: string;
  absenceendtm?: string;
  approvalstatus: string;
  absencereason?: string;
  requester_note?: string;
  approver_note?: string;
  createdon: string;
  updatedon?: string;
}

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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-blue-900">
            Absences for {studentName}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400"
            onClick={() => setIsSubmitAbsenceDialogOpen(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Submit Absence Request
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {absences.map((absence) => (
            <div key={absence.absencercdid} className="border rounded-md p-2 bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {formatDate(absence.absencedate)}
                  </div>
                  <span className="text-xs text-gray-600 flex-shrink-0">
                    {absence.fullday ? "Full Day" : `${formatTime(absence.absencestarttm)}-${formatTime(absence.absenceendtm)}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {getApprovalStatusBadge(absence.approvalstatus)}
                  {absence.approvalstatus.toLowerCase() === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleCancelPendingRequest(absence.absencercdid)}
                      disabled={cancellingId === absence.absencercdid}
                    >
                      {cancellingId === absence.absencercdid ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {absence.absencereason && (
                <div className="text-xs text-gray-700 mt-1 ml-6">
                  <span className="font-medium">Reason:</span> {absence.absencereason}
                </div>
              )}

              {absence.requester_note && (
                <div className="flex items-start gap-1.5 mt-1 ml-6 text-xs">
                  <MessageSquare className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-800">{absence.requester_note}</span>
                </div>
              )}

              {absence.approver_note && (
                <div className="flex items-start gap-1.5 mt-1 ml-6 text-xs">
                  <MessageSquare className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-green-800">{absence.approver_note}</span>
                </div>
              )}
            </div>
          ))}
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
    </Card>
  );
}
