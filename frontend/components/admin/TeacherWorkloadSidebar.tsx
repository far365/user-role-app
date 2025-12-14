import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { Teacher, TeacherAssignment, ScheduleActivity } from "@/types/teacher-assignment";

interface TeacherWorkloadSidebarProps {
  teachers: Teacher[];
  assignments: TeacherAssignment[];
  activities: ScheduleActivity[];
}

export function TeacherWorkloadSidebar({
  teachers,
  assignments,
  activities,
}: TeacherWorkloadSidebarProps) {
  const calculateTeacherWorkload = (teacherId: string) => {
    const teacherAssignments = assignments.filter(a => a.teacher_id === teacherId);
    
    let totalHours = 0;
    const conflicts: string[] = [];
    const assignmentDetails: { activity: ScheduleActivity; assignment: TeacherAssignment }[] = [];

    teacherAssignments.forEach(assignment => {
      const activity = activities.find(a => a.id === assignment.activity_id);
      if (activity) {
        assignmentDetails.push({ activity, assignment });
        
        const [startHour, startMin] = activity.start_time.split(':').map(Number);
        const [endHour, endMin] = activity.end_time.split(':').map(Number);
        const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
        totalHours += hours;
      }
    });

    assignmentDetails.forEach((detail1, index1) => {
      assignmentDetails.forEach((detail2, index2) => {
        if (index1 < index2 && 
            detail1.activity.day_of_week === detail2.activity.day_of_week) {
          const start1 = detail1.activity.start_time;
          const end1 = detail1.activity.end_time;
          const start2 = detail2.activity.start_time;
          const end2 = detail2.activity.end_time;
          
          if ((start1 < end2 && end1 > start2)) {
            conflicts.push(`${detail1.activity.day_of_week}: ${detail1.activity.activity_name} overlaps with ${detail2.activity.activity_name}`);
          }
        }
      });
    });

    return {
      totalHours: totalHours.toFixed(1),
      assignmentCount: teacherAssignments.length,
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
  };

  const getWorkloadStatus = (hours: number) => {
    if (hours === 0) return { status: "none", color: "gray" };
    if (hours < 15) return { status: "light", color: "green" };
    if (hours < 25) return { status: "normal", color: "blue" };
    if (hours < 35) return { status: "heavy", color: "orange" };
    return { status: "overloaded", color: "red" };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Teacher Workload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {teachers.map(teacher => {
          const workload = calculateTeacherWorkload(teacher.id);
          const hours = parseFloat(workload.totalHours);
          const status = getWorkloadStatus(hours);

          return (
            <div
              key={teacher.id}
              className={`p-3 rounded-lg border-l-4 ${
                workload.hasConflicts
                  ? 'bg-red-50 border-red-500'
                  : status.color === 'green'
                  ? 'bg-green-50 border-green-500'
                  : status.color === 'blue'
                  ? 'bg-blue-50 border-blue-500'
                  : status.color === 'orange'
                  ? 'bg-orange-50 border-orange-500'
                  : status.color === 'red'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{teacher.name}</p>
                  <p className="text-xs text-gray-600">{teacher.email}</p>
                </div>
                {workload.hasConflicts ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : hours > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    status.color === 'green'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : status.color === 'blue'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : status.color === 'orange'
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : status.color === 'red'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  }`}
                >
                  {workload.totalHours} hrs/week
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {workload.assignmentCount} assignments
                </Badge>
              </div>

              {teacher.qualifications && teacher.qualifications.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-600 mb-1">Qualifications:</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.qualifications.map((qual, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {qual}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {workload.hasConflicts && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <p className="text-xs font-semibold text-red-800 mb-1">Conflicts:</p>
                  <ul className="space-y-1">
                    {workload.conflicts.map((conflict, idx) => (
                      <li key={idx} className="text-xs text-red-700 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{conflict}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hours === 0 && (
                <p className="text-xs text-gray-500 italic mt-2">No assignments yet</p>
              )}
            </div>
          );
        })}

        <div className="pt-3 border-t">
          <p className="text-xs font-semibold text-gray-700 mb-2">Workload Legend</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Light: &lt;15 hrs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Normal: 15-25 hrs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-600">Heavy: 25-35 hrs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600">Overloaded: &gt;35 hrs</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
