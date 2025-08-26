import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, ClipboardCheck } from "lucide-react";
import type { User } from "~backend/user/types";

interface TeacherDashboardProps {
  user: User;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Teacher Dashboard</h2>
        <p className="text-gray-600">
          Manage your classes, track student progress, and plan activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Active classes</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Total students</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lesson Plans</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Pending reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Your teaching schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Mathematics - Grade 3A</p>
                  <p className="text-xs text-gray-500">9:00 AM - 10:00 AM • Room 101</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Science - Grade 3B</p>
                  <p className="text-xs text-gray-500">11:00 AM - 12:00 PM • Room 102</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Reading Circle - Grade 2</p>
                  <p className="text-xs text-gray-500">2:00 PM - 3:00 PM • Library</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
            <CardDescription>Recent achievements and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Sarah completed multiplication worksheet</p>
                <p className="text-xs text-gray-500">Grade 3A • Score: 95% • 1 hour ago</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Tommy improved reading fluency</p>
                <p className="text-xs text-gray-500">Grade 2 • Reading level up • 2 hours ago</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium text-sm">Class 3B submitted science projects</p>
                <p className="text-xs text-gray-500">All 8 students • Ready for review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
