import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, GraduationCap, AlertCircle, Heart } from "lucide-react";
import type { Student } from "~backend/student/types";

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  const formatDate = (date: Date | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

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

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900 text-sm">
              {student.studentName || 'Unknown Student'}
            </h3>
          </div>
          <Badge className={getStatusColor(student.studentStatus || 'Active')}>
            {student.studentStatus || 'Active'}
          </Badge>
        </div>

        <div className="space-y-2">
          {student.studentID && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="font-medium">ID:</span>
              <span className="font-mono">{student.studentID}</span>
            </div>
          )}

          {(student.grade || student.class) && (
            <div className="flex items-center space-x-2 text-xs">
              <GraduationCap className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">
                {student.grade && student.class 
                  ? `Grade ${student.grade} - ${student.class}`
                  : student.grade 
                    ? `Grade ${student.grade}`
                    : student.class
                      ? `Class ${student.class}`
                      : 'Grade/Class not specified'
                }
              </span>
            </div>
          )}

          {student.dateOfBirth && (
            <div className="flex items-center space-x-2 text-xs">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">
                Born: {formatDate(student.dateOfBirth)}
              </span>
            </div>
          )}

          {student.emergencyContact && (
            <div className="flex items-center space-x-2 text-xs">
              <AlertCircle className="w-3 h-3 text-orange-500" />
              <span className="text-gray-600">
                Emergency: {student.emergencyContact}
              </span>
            </div>
          )}

          {student.medicalInfo && (
            <div className="flex items-center space-x-2 text-xs">
              <Heart className="w-3 h-3 text-red-500" />
              <span className="text-gray-600">
                Medical: {student.medicalInfo}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
