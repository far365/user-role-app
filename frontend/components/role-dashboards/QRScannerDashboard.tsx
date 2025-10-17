import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, UserPlus } from "lucide-react";
import { QRScanPage } from "../admin/QRScanPage";
import { StudentQRVerifyPage } from "../admin/StudentQRVerifyPage";
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

  if (currentPage === 'student-qr-verify') {
    return <StudentQRVerifyPage user={user} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">QR Scanner Dashboard</h2>
        <p className="text-gray-600">
          Scan QR codes to update student dismissal status.
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
          onClick={() => handleNavigate('student-qr-verify')}
        >
          <UserPlus className="h-5 w-5 mr-3" />
          Generate QR Code for Student
        </Button>
      </div>
    </div>
  );
}
