import { StudentAbsenceCard } from "./StudentAbsenceCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manage Absences</h1>
              <p className="text-sm text-gray-600">View and manage absence records for your students</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No students found</p>
            </div>
          ) : (
            students.map((student) => (
              <StudentAbsenceCard
                key={student.studentId}
                studentId={student.studentId}
                studentName={student.studentName}
                grade={student.grade}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
