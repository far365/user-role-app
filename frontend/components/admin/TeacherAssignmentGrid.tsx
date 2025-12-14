import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, AlertCircle, CheckCircle } from "lucide-react";
import type { ScheduleActivity, TeacherAssignment } from "@/types/teacher-assignment";

interface TeacherAssignmentGridProps {
  activities: ScheduleActivity[];
  assignments: TeacherAssignment[];
  viewMode: "planning" | "assignment";
  onAssignTeacher: (activityId: string) => void;
  onManageSubstitute: (activityId: string) => void;
}

export function TeacherAssignmentGrid({
  activities,
  assignments,
  viewMode,
  onAssignTeacher,
  onManageSubstitute,
}: TeacherAssignmentGridProps) {
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  const getActivityAssignments = (activityId: string) => {
    return assignments.filter(a => a.activity_id === activityId);
  };

  const getAssignmentStatus = (activity: ScheduleActivity) => {
    const activityAssignments = getActivityAssignments(activity.id);
    const primaryCount = activityAssignments.filter(a => a.role === "Primary Teacher").length;
    const assistantCount = activityAssignments.filter(a => a.role === "Assistant Teacher").length;
    const studentTeacherCount = activityAssignments.filter(a => a.role === "Student Teacher").length;

    const primaryNeeded = activity.required_teachers.primary;
    const assistantNeeded = activity.required_teachers.assistant;
    const studentTeacherNeeded = activity.required_teachers.student_teacher;

    const isPrimaryFilled = primaryCount >= primaryNeeded;
    const isAssistantFilled = assistantCount >= assistantNeeded;
    const isStudentTeacherFilled = studentTeacherCount >= studentTeacherNeeded;

    if (isPrimaryFilled && isAssistantFilled && isStudentTeacherFilled) {
      return "complete";
    } else if (primaryCount > 0 || assistantCount > 0 || studentTeacherCount > 0) {
      return "partial";
    }
    return "empty";
  };

  const getActivitiesForDay = (day: string) => {
    return activities
      .filter(a => a.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const renderActivityCard = (activity: ScheduleActivity) => {
    const activityAssignments = getActivityAssignments(activity.id);
    const status = getAssignmentStatus(activity);
    const hasSubstitute = activityAssignments.some(a => a.role === "Substitute Teacher");

    const primaryTeachers = activityAssignments.filter(a => a.role === "Primary Teacher");
    const assistantTeachers = activityAssignments.filter(a => a.role === "Assistant Teacher");
    const studentTeachers = activityAssignments.filter(a => a.role === "Student Teacher");
    const substitutes = activityAssignments.filter(a => a.role === "Substitute Teacher");

    return (
      <Card key={activity.id} className="mb-3">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold">{activity.activity_name}</CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {activity.start_time} - {activity.end_time}
              </p>
              <Badge variant="outline" className="mt-1 text-xs">
                {activity.activity_type}
              </Badge>
            </div>
            <div>
              {status === "complete" && <CheckCircle className="w-5 h-5 text-green-600" />}
              {status === "partial" && <AlertCircle className="w-5 h-5 text-orange-600" />}
              {status === "empty" && <AlertCircle className="w-5 h-5 text-red-600" />}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {viewMode === "planning" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="font-medium">Primary Teacher:</span>
                <span className="text-blue-700">Need {activity.required_teachers.primary}</span>
              </div>
              {activity.required_teachers.assistant > 0 && (
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="font-medium">Assistant Teacher:</span>
                  <span className="text-purple-700">Need {activity.required_teachers.assistant}</span>
                </div>
              )}
              {activity.required_teachers.student_teacher > 0 && (
                <div className="flex justify-between items-center p-2 bg-teal-50 rounded">
                  <span className="font-medium">Student Teacher:</span>
                  <span className="text-teal-700">Need {activity.required_teachers.student_teacher}</span>
                </div>
              )}
            </div>
          )}

          {viewMode === "assignment" && (
            <div className="space-y-2">
              {primaryTeachers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Primary Teacher</p>
                  {primaryTeachers.map(teacher => (
                    <div key={teacher.id} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                      <span className="font-medium">{teacher.teacher_name}</span>
                      {teacher.assignment_type === "Temporary" && (
                        <Badge variant="outline" className="text-xs">Temp</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {assistantTeachers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Assistant Teacher</p>
                  {assistantTeachers.map(teacher => (
                    <div key={teacher.id} className="flex items-center justify-between p-2 bg-purple-50 rounded text-xs">
                      <span className="font-medium">{teacher.teacher_name}</span>
                      {teacher.assignment_type === "Temporary" && (
                        <Badge variant="outline" className="text-xs">Temp</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {studentTeachers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Student Teacher</p>
                  {studentTeachers.map(teacher => (
                    <div key={teacher.id} className="flex items-center justify-between p-2 bg-teal-50 rounded text-xs">
                      <span className="font-medium">{teacher.teacher_name}</span>
                    </div>
                  ))}
                </div>
              )}

              {substitutes.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Substitute</p>
                  {substitutes.map(sub => (
                    <div key={sub.id} className="p-2 bg-orange-50 rounded text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sub.teacher_name}</span>
                        <Badge variant="outline" className="text-xs">Covering</Badge>
                      </div>
                      {sub.replacing_teacher_name && (
                        <p className="text-gray-600">for {sub.replacing_teacher_name}</p>
                      )}
                      <p className="text-gray-500">
                        {sub.start_date} to {sub.end_date}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activityAssignments.length === 0 && (
                <p className="text-xs text-gray-500 italic">No teachers assigned</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onAssignTeacher(activity.id)}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Assign
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => onManageSubstitute(activity.id)}
            >
              <Users className="w-3 h-3 mr-1" />
              Substitute
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        {daysOfWeek.map(day => (
          <div key={day} className="space-y-3">
            <div className="bg-gray-100 p-3 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-900">{day}</h3>
              <p className="text-xs text-gray-600 mt-1">
                {getActivitiesForDay(day).length} activities
              </p>
            </div>
            
            <div className="space-y-2">
              {getActivitiesForDay(day).map(activity => renderActivityCard(activity))}
            </div>

            {getActivitiesForDay(day).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No activities scheduled
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
