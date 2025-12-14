import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";
import type { Teacher, ScheduleActivity, TeacherAssignment, TeacherRole } from "@/types/teacher-assignment";

interface AssignTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ScheduleActivity;
  teachers: Teacher[];
  existingAssignments: TeacherAssignment[];
  onSave: (assignment: Partial<TeacherAssignment>) => void;
}

export function AssignTeacherDialog({
  open,
  onOpenChange,
  activity,
  teachers,
  existingAssignments,
  onSave,
}: AssignTeacherDialogProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<TeacherRole>("Primary Teacher");
  const [notes, setNotes] = useState("");

  const roles: TeacherRole[] = ["Primary Teacher", "Assistant Teacher", "Student Teacher"];

  const handleSave = () => {
    if (!selectedTeacherId) return;

    onSave({
      teacher_id: selectedTeacherId,
      role: selectedRole,
      assignment_type: "Permanent",
      start_date: new Date().toISOString().split('T')[0],
      notes,
    });

    setSelectedTeacherId("");
    setSelectedRole("Primary Teacher");
    setNotes("");
  };

  const handleCancel = () => {
    setSelectedTeacherId("");
    setSelectedRole("Primary Teacher");
    setNotes("");
    onOpenChange(false);
  };

  const getAssignmentCounts = () => {
    const primaryCount = existingAssignments.filter(a => a.role === "Primary Teacher").length;
    const assistantCount = existingAssignments.filter(a => a.role === "Assistant Teacher").length;
    const studentTeacherCount = existingAssignments.filter(a => a.role === "Student Teacher").length;

    return { primaryCount, assistantCount, studentTeacherCount };
  };

  const { primaryCount, assistantCount, studentTeacherCount } = getAssignmentCounts();

  const checkTeacherConflict = (teacherId: string) => {
    return false;
  };

  const hasConflict = selectedTeacherId ? checkTeacherConflict(selectedTeacherId) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Teacher to Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Activity Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Activity:</span>
                <p className="font-medium">{activity.activity_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <p className="font-medium">{activity.activity_type}</p>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <p className="font-medium">{activity.start_time} - {activity.end_time}</p>
              </div>
              <div>
                <span className="text-gray-600">Day:</span>
                <p className="font-medium">{activity.day_of_week}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-sm mb-3">Required vs Assigned</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <div>
                  <p className="text-xs text-gray-600">Primary</p>
                  <p className="font-semibold">{primaryCount} / {activity.required_teachers.primary}</p>
                </div>
                {primaryCount >= activity.required_teachers.primary ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <div>
                  <p className="text-xs text-gray-600">Assistant</p>
                  <p className="font-semibold">{assistantCount} / {activity.required_teachers.assistant}</p>
                </div>
                {assistantCount >= activity.required_teachers.assistant ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                )}
              </div>
              
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <div>
                  <p className="text-xs text-gray-600">Student Teacher</p>
                  <p className="font-semibold">{studentTeacherCount} / {activity.required_teachers.student_teacher}</p>
                </div>
                {studentTeacherCount >= activity.required_teachers.student_teacher ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                )}
              </div>
            </div>
          </div>

          {existingAssignments.length > 0 && (
            <div className="space-y-2">
              <Label>Currently Assigned Teachers</Label>
              <div className="space-y-2">
                {existingAssignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{assignment.teacher_name}</p>
                      <p className="text-xs text-gray-600">{assignment.role}</p>
                    </div>
                    <Badge variant="outline">{assignment.assignment_type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="teacher">Select Teacher</Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Choose a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as TeacherRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasConflict && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">Scheduling Conflict Detected</p>
                <p>This teacher has another assignment at the same time.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedTeacherId}>
            Assign Teacher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
