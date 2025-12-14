import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "~backend/user/types";
import { TeacherAssignmentGrid } from "./TeacherAssignmentGrid";
import { AssignTeacherDialog } from "./AssignTeacherDialog";
import { SubstituteTeacherDialog } from "./SubstituteTeacherDialog";
import { TeacherWorkloadSidebar } from "./TeacherWorkloadSidebar";
import type { Teacher, ScheduleActivity, TeacherAssignment, TeacherWorkload } from "@/types/teacher-assignment";

interface TeacherAssignmentPageProps {
  user: User;
  onBack: () => void;
}

export function TeacherAssignmentPage({ user, onBack }: TeacherAssignmentPageProps) {
  const [viewMode, setViewMode] = useState<"planning" | "assignment">("assignment");
  const [academicYear, setAcademicYear] = useState("AY25-26");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activities, setActivities] = useState<ScheduleActivity[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ScheduleActivity | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showSubstituteDialog, setShowSubstituteDialog] = useState(false);
  const [showWorkloadSidebar, setShowWorkloadSidebar] = useState(true);
  const { toast } = useToast();

  const grades = [
    { name: "KG1", building: "A" },
    { name: "KG2", building: "A" },
    { name: "Grade 1", building: "B" },
    { name: "Grade 2", building: "B" },
    { name: "Grade 3", building: "C" },
  ];

  const weeks = [
    { value: "2025-03-03", label: "Week of March 3, 2025" },
    { value: "2025-03-10", label: "Week of March 10, 2025" },
    { value: "2025-03-17", label: "Week of March 17, 2025" },
    { value: "2025-03-24", label: "Week of March 24, 2025" },
  ];

  useEffect(() => {
    setTeachers([
      { id: "T001", name: "Sarah Johnson", email: "sarah.j@school.edu", qualifications: ["Math", "Science"] },
      { id: "T002", name: "Ahmed Hassan", email: "ahmed.h@school.edu", qualifications: ["English", "History"] },
      { id: "T003", name: "Maria Garcia", email: "maria.g@school.edu", qualifications: ["Art", "Music"] },
      { id: "T004", name: "John Smith", email: "john.s@school.edu", qualifications: ["PE", "Health"] },
      { id: "T005", name: "Fatima Ali", email: "fatima.a@school.edu", qualifications: ["Arabic", "Islamic Studies"] },
    ]);

    setActivities([
      {
        id: "ACT001",
        activity_name: "Math - Algebra",
        activity_type: "Academic",
        start_time: "08:00",
        end_time: "09:00",
        day_of_week: "Monday",
        grade: "Grade 3",
        required_teachers: { primary: 1, assistant: 1, student_teacher: 0 },
      },
      {
        id: "ACT002",
        activity_name: "English - Reading",
        activity_type: "Academic",
        start_time: "09:00",
        end_time: "10:00",
        day_of_week: "Monday",
        grade: "Grade 3",
        required_teachers: { primary: 1, assistant: 0, student_teacher: 0 },
      },
      {
        id: "ACT003",
        activity_name: "Science - Biology",
        activity_type: "Academic",
        start_time: "10:00",
        end_time: "11:00",
        day_of_week: "Monday",
        grade: "Grade 3",
        required_teachers: { primary: 1, assistant: 1, student_teacher: 0 },
      },
      {
        id: "ACT004",
        activity_name: "PE - Basketball",
        activity_type: "Physical",
        start_time: "11:00",
        end_time: "12:00",
        day_of_week: "Monday",
        grade: "Grade 3",
        required_teachers: { primary: 1, assistant: 0, student_teacher: 0 },
      },
    ]);

    setAssignments([
      {
        id: "ASN001",
        activity_id: "ACT001",
        teacher_id: "T001",
        teacher_name: "Sarah Johnson",
        role: "Primary Teacher",
        assignment_type: "Permanent",
        start_date: "2025-03-03",
        assigned_by: "Admin",
        assigned_at: "2025-02-15T10:00:00Z",
      },
      {
        id: "ASN002",
        activity_id: "ACT002",
        teacher_id: "T002",
        teacher_name: "Ahmed Hassan",
        role: "Primary Teacher",
        assignment_type: "Permanent",
        start_date: "2025-03-03",
        assigned_by: "Admin",
        assigned_at: "2025-02-15T10:05:00Z",
      },
    ]);
  }, []);

  const handleAssignTeacher = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      setSelectedActivity(activity);
      setShowAssignDialog(true);
    }
  };

  const handleManageSubstitute = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
      setSelectedActivity(activity);
      setShowSubstituteDialog(true);
    }
  };

  const handleSaveAssignment = (assignment: Partial<TeacherAssignment>) => {
    const newAssignment: TeacherAssignment = {
      id: `ASN${String(assignments.length + 1).padStart(3, '0')}`,
      activity_id: selectedActivity!.id,
      teacher_id: assignment.teacher_id!,
      teacher_name: teachers.find(t => t.id === assignment.teacher_id)?.name || "",
      role: assignment.role!,
      assignment_type: assignment.assignment_type || "Permanent",
      start_date: assignment.start_date || new Date().toISOString().split('T')[0],
      end_date: assignment.end_date,
      assigned_by: user.displayName,
      assigned_at: new Date().toISOString(),
      notes: assignment.notes,
    };

    setAssignments([...assignments, newAssignment]);
    setShowAssignDialog(false);
    
    toast({
      title: "Teacher Assigned",
      description: `${newAssignment.teacher_name} assigned as ${newAssignment.role}`,
    });
  };

  const handleSaveSubstitute = (assignment: Partial<TeacherAssignment>) => {
    const newAssignment: TeacherAssignment = {
      id: `ASN${String(assignments.length + 1).padStart(3, '0')}`,
      activity_id: selectedActivity!.id,
      teacher_id: assignment.teacher_id!,
      teacher_name: teachers.find(t => t.id === assignment.teacher_id)?.name || "",
      role: "Substitute Teacher",
      assignment_type: "Temporary",
      start_date: assignment.start_date!,
      end_date: assignment.end_date!,
      replacing_teacher_id: assignment.replacing_teacher_id,
      replacing_teacher_name: teachers.find(t => t.id === assignment.replacing_teacher_id)?.name,
      assigned_by: user.displayName,
      assigned_at: new Date().toISOString(),
      notes: assignment.notes,
    };

    setAssignments([...assignments, newAssignment]);
    setShowSubstituteDialog(false);
    
    toast({
      title: "Substitute Assigned",
      description: `${newAssignment.teacher_name} assigned to cover ${newAssignment.replacing_teacher_name}`,
    });
  };

  const getActivityAssignments = (activityId: string) => {
    return assignments.filter(a => a.activity_id === activityId);
  };

  const getAssignmentStats = () => {
    const totalActivities = activities.length;
    const fullyStaffed = activities.filter(activity => {
      const activityAssignments = getActivityAssignments(activity.id);
      const primaryCount = activityAssignments.filter(a => a.role === "Primary Teacher").length;
      const assistantCount = activityAssignments.filter(a => a.role === "Assistant Teacher").length;
      
      return primaryCount >= activity.required_teachers.primary && 
             assistantCount >= activity.required_teachers.assistant;
    }).length;

    const understaffed = totalActivities - fullyStaffed;
    
    return { totalActivities, fullyStaffed, understaffed };
  };

  const stats = getAssignmentStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "assignment" ? "default" : "outline"}
            onClick={() => setViewMode("assignment")}
          >
            Assignment View
          </Button>
          <Button
            variant={viewMode === "planning" ? "default" : "outline"}
            onClick={() => setViewMode("planning")}
          >
            Planning View
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teacher Assignment Management</h2>
        <p className="text-gray-600">Assign teachers to class activities and manage substitutes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Fully Staffed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fullyStaffed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Understaffed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-orange-600">{stats.understaffed}</div>
              {stats.understaffed > 0 && <AlertTriangle className="w-5 h-5 text-orange-600" />}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="academic-year">Academic Year</Label>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger id="academic-year">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AY25-26">AY25-26</SelectItem>
              <SelectItem value="AY24-25">AY24-25</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade">Grade</Label>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger id="grade">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grade) => (
                <SelectItem key={grade.name} value={grade.name}>
                  {grade.name} - Building {grade.building}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="week">Week</Label>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger id="week">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((week) => (
                <SelectItem key={week.value} value={week.value}>
                  {week.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedGrade && selectedWeek && (
        <div className="flex gap-6">
          <div className="flex-1">
            <TeacherAssignmentGrid
              activities={activities}
              assignments={assignments}
              viewMode={viewMode}
              onAssignTeacher={handleAssignTeacher}
              onManageSubstitute={handleManageSubstitute}
            />
          </div>
          
          {showWorkloadSidebar && (
            <div className="w-80">
              <TeacherWorkloadSidebar
                teachers={teachers}
                assignments={assignments}
                activities={activities}
              />
            </div>
          )}
        </div>
      )}

      {selectedActivity && (
        <>
          <AssignTeacherDialog
            open={showAssignDialog}
            onOpenChange={setShowAssignDialog}
            activity={selectedActivity}
            teachers={teachers}
            existingAssignments={getActivityAssignments(selectedActivity.id)}
            onSave={handleSaveAssignment}
          />
          
          <SubstituteTeacherDialog
            open={showSubstituteDialog}
            onOpenChange={setShowSubstituteDialog}
            activity={selectedActivity}
            teachers={teachers}
            existingAssignments={getActivityAssignments(selectedActivity.id)}
            onSave={handleSaveSubstitute}
          />
        </>
      )}
    </div>
  );
}
