import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import backend from "~backend/client";

export function TeacherHub() {
  const navigate = useNavigate();
  const [currentYear, setCurrentYear] = useState<string>("");
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; role: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearResp, profileResp] = await Promise.all([
          backend.academic.getCurrentYear(),
          backend.user.profile(),
        ]);
        setCurrentYear(yearResp.academicYear);
        setUserInfo({
          firstName: profileResp.firstName,
          lastName: profileResp.lastName,
          role: profileResp.role,
        });
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
                Teacher Hub
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome, {userInfo?.firstName} {userInfo?.lastName}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Academic Year</div>
              <div className="text-lg font-semibold text-gray-900">{currentYear}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/teacher-dashboard")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Teacher Portal</CardTitle>
              <Users className="h-8 w-8 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage attendance, dismissal, and student records
              </p>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate("/teacher-dashboard"); }}>
                Open Teacher Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
