import { StudentAbsenceCard } from "./StudentAbsenceCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Student {
  studentId: string;
  studentName: string;
}

interface ManageAbsencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export function ManageAbsencesDialog({ isOpen, onClose, students }: ManageAbsencesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Absences</DialogTitle>
          <DialogDescription>
            View and manage absence records for your students
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {students.length === 0 ? (
            <p className="text-sm text-gray-600">No students found</p>
          ) : (
            students.map((student) => (
              <StudentAbsenceCard
                key={student.studentId}
                studentId={student.studentId}
                studentName={student.studentName}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
