import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, User, Calendar } from "lucide-react";
import type { User as UserType } from "~backend/user/types";

interface TeacherDashboardProps {
  user: UserType;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Teacher":
        return "bg-blue-100 text-blue-800";
      case "Parent":
        return "bg-green-100 text-green-800";
      case "Dispatch":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-gray-900 mb-1">
                Welcome back, {user.displayName}!
              </CardTitle>
              <div className="flex items-center space-x-3">
                <Badge className={getRoleColor(user.userRole)}>
                  {user.userRole}
                </Badge>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${user.userStatus === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600">{user.userStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Manage your classes, track student progress, and plan activities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span>
                <span className="font-medium">User ID:</span> {user.userID}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>
                <span className="font-medium">Last Login:</span> {formatDate(user.lastLoginDTTM)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
