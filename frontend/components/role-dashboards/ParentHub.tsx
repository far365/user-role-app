import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, Users, CalendarX, BookOpen, DollarSign, FileCheck } from "lucide-react";
import { ParentDashboard } from "./ParentDashboard";
import { ManageAbsencesPage } from "../parent/ManageAbsencesPage";
import { ParentHifzPortal } from "../parent/ParentHifzPortal";
import { QRCodeGenerator } from "../QRCodeGenerator";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";
import type { ParentInfo } from "~backend/parent/get_parent_info";

interface ParentHubProps {
  user: UserType;
}

interface StudentWithDismissalStatus {
  studentId: string;
  studentName: string;
  grade: string;
}

export function ParentHub({ user }: ParentHubProps) {
  const [showParentDashboard, setShowParentDashboard] = useState(false);
  const [showManageAbsences, setShowManageAbsences] = useState(false);
  const [showHifzPortal, setShowHifzPortal] = useState(false);
  const [currentYear, setCurrentYear] = useState<string>("");
  const [studentData, setStudentData] = useState<StudentWithDismissalStatus[]>([]);
  const [parentData, setParentData] = useState<ParentInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yearResp = await backend.academic.getCurrentYear();
        setCurrentYear(yearResp.ayid);

        const parentInfo = await backend.parent.getParentInfo({ username: user.loginID });
        setParentData(parentInfo);
        
        const studentsResp = await backend.student.getStudentsByParentID({ parentId: parentInfo.parentID });
        
        setStudentData(studentsResp.students.map(s => ({
          studentId: s.studentid,
          studentName: s.studentname,
          grade: s.grade
        })));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, [user.loginID]);

  if (showParentDashboard) {
    return <ParentDashboard user={user} />;
  }

  if (showManageAbsences) {
    return <ManageAbsencesPage students={studentData} onBack={() => setShowManageAbsences(false)} />;
  }

  if (showHifzPortal) {
    return <ParentHifzPortal user={user} onBack={() => setShowHifzPortal(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Parent Hub
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

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Upcoming Event/Activities Reminder(s)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700">
              Group Photos
            </div>
          </CardContent>
        </Card>

        {parentData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Parent QR Code (Dismissal)</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeGenerator
                name={parentData.parentName || 'Parent'}
                phone={parentData.parentPhoneMain || ''}
                title="Parent Contact"
                parentID={parentData.parentID}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowParentDashboard(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Parent Portal</CardTitle>
              <Users className="h-8 w-8 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View student information, dismissal status, and parent contact details
              </p>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); setShowParentDashboard(true); }}>
                Parent Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowManageAbsences(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Manage Absences</CardTitle>
              <CalendarX className="h-8 w-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Submit and manage absence requests for your students
              </p>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); setShowManageAbsences(true); }}>
                Manage Absences <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowHifzPortal(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Hifz Portal</CardTitle>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View your students' hifz progress and history
              </p>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); setShowHifzPortal(true); }}>
                Hifz Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowHifzPortal(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Payments & Receipts</CardTitle>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Make Payments and view Receipts
              </p>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); setShowHifzPortal(true); }}>
                Payment Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

				          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowHifzPortal(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">Permission for Activities</CardTitle>
              <FileCheck className="h-8 w-8 text-teal-600" />
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Permission for Activities
              </p>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); setShowHifzPortal(true); }}>
                Permissions Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

				
				</div>
      </div>
    </div>
  );
}
