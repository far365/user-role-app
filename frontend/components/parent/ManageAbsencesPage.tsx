import { useState } from "react";
import { StudentAbsenceCard } from "./StudentAbsenceCard";
import { SubmitAbsenceForParentDialog } from "./SubmitAbsenceForParentDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CalendarPlus } from "lucide-react";

interface Student {
  studentId: string;
  studentName: string;
  grade: string;
}

interface ManageAbsencesPageProps {
  students: Student[];
  onBack: () => void;
}

export function ManageAbsencesPage({ students, onBack }: ManageAbsencesPageProps) {
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="hover:bg-gray-100 h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Manage Absences</h1>
                <p className="text-xs text-gray-600">View and manage absence records for your students</p>
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              className="bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => setIsSubmitDialogOpen(true)}
            >
              <CalendarPlus className="w-4 h-4 mr-1" />
              Submit for Multiple
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 py-2">
          <div className="space-y-1.5">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No students found</p>
              </div>
            ) : (
              students.map((student) => (
                <StudentAbsenceCard
                  key={`${student.studentId}-${refreshKey}`}
                  studentId={student.studentId}
                  studentName={student.studentName}
                  grade={student.grade}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <SubmitAbsenceForParentDialog
        students={students}
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onSubmitted={() => {
          toast({
            title: "Success",
            description: "Absence requests submitted successfully",
          });
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
}
