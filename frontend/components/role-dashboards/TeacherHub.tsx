import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen } from "lucide-react";
import { TeacherDashboard } from "./TeacherDashboard";
import { HifzPortal } from "../teacher/HifzPortal";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";

interface TeacherHubProps {
  user: UserType;
}

export function TeacherHub({ user }: TeacherHubProps) {
  const [showTeacherDashboard, setShowTeacherDashboard] = useState(false);
  const [showHifzPortal, setShowHifzPortal] = useState(false);
  const [currentYear, setCurrentYear] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yearResp = await backend.academic.getCurrentYear();
        setCurrentYear(yearResp.ayid);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  if (showTeacherDashboard) {
    return <TeacherDashboard user={user} onBack={() => setShowTeacherDashboard(false)} />;
  }

  if (showHifzPortal) {
    return <HifzPortal user={user} onBack={() => setShowHifzPortal(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Teacher Hub
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user.displayName}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Academic Year</div>
              <div className="text-lg font-semibold text-gray-900">{currentYear}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowTeacherDashboard(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Teacher Portal</CardTitle>
              <Users className="h-8 w-8 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage attendance, dismissal, and student records
              </p>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); setShowTeacherDashboard(true); }}>
                Attendance & Dismissal Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowHifzPortal(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Hifz Portal</CardTitle>
              <BookOpen className="h-8 w-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage Hifz progress and student memorization
              </p>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); setShowHifzPortal(true); }}>
                Hifz Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
