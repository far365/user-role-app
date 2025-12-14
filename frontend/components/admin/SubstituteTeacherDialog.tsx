import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Teacher, ScheduleActivity, TeacherAssignment } from "@/types/teacher-assignment";

interface SubstituteTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ScheduleActivity;
  teachers: Teacher[];
  existingAssignments: TeacherAssignment[];
  onSave: (assignment: Partial<TeacherAssignment>) => void;
}

export function SubstituteTeacherDialog({
  open,
  onOpenChange,
  activity,
  teachers,
  existingAssignments,
  onSave,
}: SubstituteTeacherDialogProps) {
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>("");
  const [replacingTeacherId, setReplacingTeacherId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [notes, setNotes] = useState("");

  const permanentTeachers = existingAssignments.filter(a => a.assignment_type === "Permanent");

  const handleSave = () => {
    if (!substituteTeacherId || !replacingTeacherId || !startDate || !endDate) return;

    onSave({
      teacher_id: substituteTeacherId,
      role: "Substitute Teacher",
      assignment_type: "Temporary",
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      replacing_teacher_id: replacingTeacherId,
      notes,
    });

    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setSubstituteTeacherId("");
    setReplacingTeacherId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setNotes("");
  };

  const availableSubstitutes = teachers.filter(t => 
    !permanentTeachers.some(pt => pt.teacher_id === t.id)
  );

  const isFormValid = substituteTeacherId && replacingTeacherId && startDate && endDate;
  const isDateRangeValid = startDate && endDate && startDate <= endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Substitute Teacher</DialogTitle>
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

          {permanentTeachers.length > 0 && (
            <div className="space-y-2">
              <Label>Permanent Teachers for This Activity</Label>
              <div className="space-y-2">
                {permanentTeachers.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{assignment.teacher_name}</p>
                      <p className="text-xs text-gray-600">{assignment.role}</p>
                    </div>
                    <Badge variant="outline">Permanent</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="replacing-teacher">Teacher Being Replaced</Label>
            <Select value={replacingTeacherId} onValueChange={setReplacingTeacherId}>
              <SelectTrigger id="replacing-teacher">
                <SelectValue placeholder="Select teacher to replace" />
              </SelectTrigger>
              <SelectContent>
                {permanentTeachers.map(assignment => (
                  <SelectItem key={assignment.teacher_id} value={assignment.teacher_id}>
                    {assignment.teacher_name} ({assignment.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="substitute-teacher">Substitute Teacher</Label>
            <Select value={substituteTeacherId} onValueChange={setSubstituteTeacherId}>
              <SelectTrigger id="substitute-teacher">
                <SelectValue placeholder="Select substitute teacher" />
              </SelectTrigger>
              <SelectContent>
                {availableSubstitutes.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableSubstitutes.length === 0 && (
              <p className="text-sm text-orange-600">No available substitute teachers (all permanently assigned to this activity)</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date: Date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {startDate && endDate && !isDateRangeValid && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">Invalid Date Range</p>
                <p>End date must be after or equal to start date.</p>
              </div>
            </div>
          )}

          {startDate && endDate && isDateRangeValid && (
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Duration: </span>
                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Reason for Substitution</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Medical leave, Professional development, Personal emergency..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {substituteTeacherId && replacingTeacherId && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-1">Assignment Summary</p>
              <p className="text-sm text-green-700">
                {teachers.find(t => t.id === substituteTeacherId)?.name} will substitute for{' '}
                {teachers.find(t => t.id === replacingTeacherId)?.name}
                {startDate && endDate && isDateRangeValid && (
                  <> from {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}</>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid || !isDateRangeValid}>
            Assign Substitute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
