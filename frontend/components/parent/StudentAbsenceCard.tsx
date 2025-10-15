import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
        <div className="space-y-3">
          {absences.map((absence) => (
            <div key={absence.absencercdid} className="border rounded-lg p-3 bg-gray-50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(absence.absencedate)}
                  </span>
                </div>
                {getApprovalStatusBadge(absence.approvalstatus)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-gray-700">Day Type:</span>
                  <p className="text-gray-900">{absence.fullday ? "Full Day" : "Partial Day"}</p>
                </div>

                {!absence.fullday && (
                  <>
                    <div>
                      <span className="font-medium text-gray-700">Start Time:</span>
                      <p className="text-gray-900">{formatTime(absence.absencestarttm)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">End Time:</span>
                      <p className="text-gray-900">{formatTime(absence.absenceendtm)}</p>
                    </div>
                  </>
                )}

                {absence.absencereason && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Reason:</span>
                    <p className="text-gray-900">{absence.absencereason}</p>
                  </div>
                )}
              </div>

              {absence.requester_note && (
                <div className="bg-blue-50 rounded p-2">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-3 h-3 text-blue-600 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-blue-900">Requester Note:</span>
                      <p className="text-xs text-blue-800">{absence.requester_note}</p>
                    </div>
                  </div>
                </div>
              )}

              {absence.approver_note && (
                <div className="bg-green-50 rounded p-2">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-3 h-3 text-green-600 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-green-900">Approver Note:</span>
                      <p className="text-xs text-green-800">{absence.approver_note}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1 border-t border-gray-200">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">
                  Created: {formatDate(absence.createdon)}
                </span>
              </div>
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
