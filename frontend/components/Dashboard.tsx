import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Calendar, Smartphone } from "lucide-react";
import { AdminDashboard } from "./role-dashboards/AdminDashboard";
import { ParentDashboard } from "./role-dashboards/ParentDashboard";
import { TeacherDashboard } from "./role-dashboards/TeacherDashboard";
import { DispatchDashboard } from "./role-dashboards/DispatchDashboard";
import type { User as UserType } from "~backend/user/types";

interface DashboardProps {
  user: UserType;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
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

  const renderRoleDashboard = () => {
    switch (user.userRole) {
      case "Admin":
        return <AdminDashboard user={user} />;
      case "Parent":
        return <ParentDashboard user={user} />;
      case "Teacher":
        return <TeacherDashboard user={user} />;
      case "Dispatch":
        return <DispatchDashboard user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <User className="w-8 h-8 text-gray-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Welcome, {user.userName}
                </h1>
                <div className="flex items-center space-x-2">
                  <Badge className={getRoleColor(user.userRole)}>
                    {user.userRole}
                  </Badge>
                  <span className="text-sm text-gray-500">ID: {user.userID}</span>
                </div>
              </div>
            </div>
            <Button onClick={onLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <span className="font-medium">Login ID:</span> {user.loginID}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getRoleColor(user.userRole)}>
                  {user.userRole}
                </Badge>
                <span className="text-sm text-gray-600">Role</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${user.userStatus === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  <span className="font-medium">Status:</span> {user.userStatus}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Last Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {formatDate(user.lastLoginDTTM)}
                </span>
              </div>
              {user.lastDeviceID && (
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-mono text-gray-600">
                    {user.lastDeviceID}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">Created:</span>
                <br />
                {formatDate(user.createdAt)}
              </div>
              <div className="text-sm">
                <span className="font-medium">Updated:</span>
                <br />
                {formatDate(user.updatedAt)}
              </div>
            </CardContent>
          </Card>
        </div>

        {renderRoleDashboard()}
      </main>
    </div>
  );
}
