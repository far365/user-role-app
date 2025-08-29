import { Badge } from "@/components/ui/badge";
import type { User as UserType } from "~backend/user/types";

interface TeacherDashboardProps {
  user: UserType;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Teacher Dashboard</h3>
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant={user.userStatus === 'Active' ? 'default' : 'destructive'}
            className={user.userStatus === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {user.userStatus}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          Manage your classes, track student progress, and plan activities.
        </p>
      </div>
    </div>
  );
}
