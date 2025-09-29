import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, BarChart3, Shield, List, UserPlus, GraduationCap, Truck, BookOpen, QrCode, ClipboardList, UserX, UserCheck, LogOut } from "lucide-react";
import { ParentSetupPage } from "../admin/ParentSetupPage";
import { StudentSetupPage } from "../admin/StudentSetupPage";
import { QueueSetupPage } from "../admin/QueueSetupPage";
import { QRScanPage } from "../admin/QRScanPage";
import { FullDismissalQueuePage } from "../admin/FullDismissalQueuePage";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import type { Grade } from "~backend/grades/types";

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await backend.grades.list();
        setGrades(response.grades);
      } catch (error) {
        console.error("Failed to fetch grades:", error);
      }
    };
    fetchGrades();
  }, []);

  if (currentPage === 'qr-scan') {
    return <QRScanPage user={user} onBack={handleBackToDashboard} />;
  }

  if (currentPage === 'queue-setup') {
    return <QueueSetupPage user={user} onBack={handleBackToDashboard} />;
  }

  if (currentPage === 'parent-setup') {
    return <ParentSetupPage onBack={handleBackToDashboard} />;
  }

  if (currentPage === 'student-setup') {
    return <StudentSetupPage onBack={handleBackToDashboard} />;
  }

  if (currentPage === 'full-dismissal-queue') {
    return <FullDismissalQueuePage user={user} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
        <p className="text-gray-600">
          Manage system settings, users, and monitor overall platform activity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Grade Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Grade
            </label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a grade..." />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade.name} value={grade.name}>
                    {grade.name.charAt(0).toUpperCase() + grade.name.slice(1).replace('-', ' ')} - Building {grade.building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              disabled={!selectedGrade}
              className={`flex-1 ${!selectedGrade ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 hover:border-red-300'}`}
            >
              <UserX className="h-4 w-4 mr-2" />
              Absence
            </Button>
            
            <Button 
              variant="outline" 
              disabled={!selectedGrade}
              className={`flex-1 ${!selectedGrade ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50 hover:border-green-300'}`}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Attendance
            </Button>
            
            <Button 
              variant="outline" 
              disabled={!selectedGrade}
              className={`flex-1 ${!selectedGrade ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 hover:border-blue-300'}`}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Dismissal
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-green-700 hover:text-green-800 hover:bg-green-50"
          onClick={() => handleNavigate('qr-scan')}
        >
          <QrCode className="h-5 w-5 mr-3" />
          Scan QR Code
        </Button>

        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-blue-700 hover:text-blue-800 hover:bg-blue-50"
          onClick={() => handleNavigate('queue-setup')}
        >
          <List className="h-5 w-5 mr-3" />
          Queue Setup
        </Button>

        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-purple-700 hover:text-purple-800 hover:bg-purple-50"
          onClick={() => handleNavigate('full-dismissal-queue')}
        >
          <ClipboardList className="h-5 w-5 mr-3" />
          Full Dismissal Queue by Grade
        </Button>

        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-green-700 hover:text-green-800 hover:bg-green-50"
          onClick={() => handleNavigate('parent-setup')}
        >
          <Users className="h-5 w-5 mr-3" />
          Parent Setup
        </Button>

        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50"
          onClick={() => handleNavigate('student-setup')}
        >
          <BookOpen className="h-5 w-5 mr-3" />
          Student Setup
        </Button>

        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-purple-700 hover:text-purple-800 hover:bg-purple-50"
          onClick={() => handleNavigate('teacher-setup')}
        >
          <GraduationCap className="h-5 w-5 mr-3" />
          Teacher Setup
        </Button>

        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-orange-700 hover:text-orange-800 hover:bg-orange-50"
          onClick={() => handleNavigate('dispatcher-setup')}
        >
          <Truck className="h-5 w-5 mr-3" />
          Dispatcher Setup
        </Button>

        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50"
          onClick={() => handleNavigate('user-setup')}
        >
          <UserPlus className="h-5 w-5 mr-3" />
          User Setup
        </Button>

        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-teal-700 hover:text-teal-800 hover:bg-teal-50"
          onClick={() => handleNavigate('analytics')}
        >
          <BarChart3 className="h-5 w-5 mr-3" />
          Analytics
        </Button>

        <Button 
          variant="ghost" 
          className="justify-start h-12 px-4 text-red-700 hover:text-red-800 hover:bg-red-50"
          onClick={() => handleNavigate('security')}
        >
          <Shield className="h-5 w-5 mr-3" />
          Security
        </Button>
      </div>
    </div>
  );
}
