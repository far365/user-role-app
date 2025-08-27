import { Button } from "@/components/ui/button";
import { Settings, Users, BarChart3, Shield, List, UserPlus, GraduationCap, Truck, BookOpen } from "lucide-react";
import type { User } from "~backend/user/types";

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const handleNavigate = (page: string) => {
    // TODO: Implement navigation to specific admin pages
    console.log(`Navigate to ${page}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
        <p className="text-gray-600">
          Manage system settings, users, and monitor overall platform activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Button 
          variant="outline" 
          className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all duration-200 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800"
          onClick={() => handleNavigate('queue-setup')}
        >
          <List className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold text-lg">Queue Setup</div>
            <div className="text-sm opacity-80">Configure and manage queue systems</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all duration-200 border-green-200 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800"
          onClick={() => handleNavigate('parent-setup')}
        >
          <Users className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold text-lg">Parent Setup</div>
            <div className="text-sm opacity-80">Manage parent accounts and information</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all duration-200 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 hover:text-yellow-800"
          onClick={() => handleNavigate('student-setup')}
        >
          <BookOpen className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold text-lg">Student Setup</div>
            <div className="text-sm opacity-80">Manage student records and enrollment</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all duration-200 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800"
          onClick={() => handleNavigate('teacher-setup')}
        >
          <GraduationCap className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold text-lg">Teacher Setup</div>
            <div className="text-sm opacity-80">Configure teacher accounts and classes</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all duration-200 border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-800"
          onClick={() => handleNavigate('dispatcher-setup')}
        >
          <Truck className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold text-lg">Dispatcher Setup</div>
            <div className="text-sm opacity-80">Manage dispatch operations and routes</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all duration-200 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800"
          onClick={() => handleNavigate('user-setup')}
        >
          <UserPlus className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold text-lg">User Setup</div>
            <div className="text-sm opacity-80">Create and manage user accounts</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all duration-200 border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800"
          onClick={() => handleNavigate('analytics')}
        >
          <BarChart3 className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold text-lg">Analytics</div>
            <div className="text-sm opacity-80">View reports and system analytics</div>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto p-6 flex flex-col items-center space-y-3 hover:shadow-md transition-all duration-200 border-red-200 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800"
          onClick={() => handleNavigate('security')}
        >
          <Shield className="h-8 w-8" />
          <div className="text-center">
            <div className="font-semibold text-lg">Security</div>
            <div className="text-sm opacity-80">Security settings and monitoring</div>
          </div>
        </Button>
      </div>
    </div>
  );
}
