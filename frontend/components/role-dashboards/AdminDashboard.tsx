import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
        <p className="text-gray-600">
          Manage system settings, users, and monitor overall platform activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('queue-setup')}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <List className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Queue Setup</CardTitle>
            <CardDescription>Configure and manage queue systems</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handleNavigate('queue-setup'); }}>
              Open Queue Setup
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('parent-setup')}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Parent Setup</CardTitle>
            <CardDescription>Manage parent accounts and information</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handleNavigate('parent-setup'); }}>
              Open Parent Setup
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('student-setup')}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
              <BookOpen className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-lg">Student Setup</CardTitle>
            <CardDescription>Manage student records and enrollment</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handleNavigate('student-setup'); }}>
              Open Student Setup
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('teacher-setup')}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Teacher Setup</CardTitle>
            <CardDescription>Configure teacher accounts and classes</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handleNavigate('teacher-setup'); }}>
              Open Teacher Setup
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('dispatcher-setup')}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
              <Truck className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg">Dispatcher Setup</CardTitle>
            <CardDescription>Manage dispatch operations and routes</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handleNavigate('dispatcher-setup'); }}>
              Open Dispatcher Setup
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('user-setup')}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
              <UserPlus className="h-6 w-6 text-indigo-600" />
            </div>
            <CardTitle className="text-lg">User Setup</CardTitle>
            <CardDescription>Create and manage user accounts</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handleNavigate('user-setup'); }}>
              Open User Setup
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('analytics')}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-2">
              <BarChart3 className="h-6 w-6 text-teal-600" />
            </div>
            <CardTitle className="text-lg">Analytics</CardTitle>
            <CardDescription>View reports and system analytics</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handleNavigate('analytics'); }}>
              Open Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('security')}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-2">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-lg">Security</CardTitle>
            <CardDescription>Security settings and monitoring</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handleNavigate('security'); }}>
              Open Security
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
