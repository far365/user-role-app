import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Users, BarChart3, Shield, List, UserPlus, GraduationCap, Truck, BookOpen, QrCode, ClipboardList } from "lucide-react";
import { ParentSetupPage } from "../admin/ParentSetupPage";
import { StudentSetupPage } from "../admin/StudentSetupPage";
import { QueueSetupPage } from "../admin/QueueSetupPage";
import { QRScanPage } from "../admin/QRScanPage";
import { FullDismissalQueuePage } from "../admin/FullDismissalQueuePage";
import type { User } from "~backend/user/types";

interface QRScannerDashboardProps {
  user: User;
}

export function QRScannerDashboard({ user }: QRScannerDashboardProps) {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

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
        <h2 className="text-xl font-bold text-gray-900 mb-2">QR Scanner Dashboard</h2>
        <p className="text-gray-600">
          Manage system settings, users, and monitor overall platform activity.
        </p>
      </div>

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
