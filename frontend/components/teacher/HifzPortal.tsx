import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";

interface HifzPortalProps {
  user: UserType;
  onBack: () => void;
}

export function HifzPortal({ user, onBack }: HifzPortalProps) {
  const [currentYear, setCurrentYear] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yearResp = await backend.academic.getCurrentYear();
        setCurrentYear(yearResp.academicYear);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hifz Portal
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Academic Year</div>
              <div className="text-lg font-semibold text-gray-900">{currentYear}</div>
            </div>
          </div>
        </div>

        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Teacher Hub Portal
        </Button>
      </div>
    </div>
  );
}
