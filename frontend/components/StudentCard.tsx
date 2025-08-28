import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, Building, CheckCircle, AlertTriangle, FileText, StickyNote } from "lucide-react";
import type { Student } from "~backend/student/types";

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "transferred":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "excused":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-8 border-l-blue-500 border-4 border-blue-500 hover:border-blue-600">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {student.studentId && (
              <div className="flex items-center space-x-2 text-xs text-gray-600 mb-1">
                <span className="font-medium">ID:</span>
                <span className="font-mono">{student.studentId}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">
                {student.studentName || 'Unknown Student'}
              </h3>
            </div>
            {student.attendanceStatus && (
              <div className="flex items-center space-x-2 text-xs mt-1">
                <CheckCircle className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Attendance:</span>
                <Badge className={getAttendanceColor(student.attendanceStatus)} variant="outline">
                  {student.attendanceStatus}
                </Badge>
              </div>
            )}
          </div>
          <Badge className={getStatusColor(student.studentStatus || 'Active')}>
            {student.studentStatus || 'Active'}
          </Badge>
        </div>

        <div className="space-y-2">
          {(student.grade || student.classBuilding) && (
            <div className="flex items-center space-x-4 text-xs">
              {student.grade && (
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-600">
                    Grade {student.grade}
                  </span>
                </div>
              )}
              {student.classBuilding && (
                <div className="flex items-center space-x-2">
                  <Building className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-600">
                    {student.classBuilding}
                  </span>
                </div>
              )}
            </div>
          )}

          {student.dismissalInstructions && (
            <div className="flex items-start space-x-2 text-xs">
              <FileText className="w-3 h-3 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <span className="text-gray-600 font-medium">Dismissal:</span>
                <p className="text-gray-600 mt-1">{student.dismissalInstructions}</p>
              </div>
            </div>
          )}

          {student.otherNote && (
            <div className="flex items-start space-x-2 text-xs">
              <StickyNote className="w-3 h-3 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <span className="text-gray-600 font-medium">Note:</span>
                <p className="text-gray-600 mt-1">{student.otherNote}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
