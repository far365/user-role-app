import { GraduationCap } from "lucide-react";
import type { User } from "~backend/user/types";

interface TeacherDashboardProps {
  user: User;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.displayName}!</h1>
            <p className="text-gray-600">Teacher Dashboard</p>
          </div>
        </div>
        <p className="text-gray-700">
          Manage your classes, track student progress, and plan activities.
        </p>
      </div>
    </div>
  );
}
