import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";

interface ParentHifzPortalProps {
  user: UserType;
  onBack: () => void;
}

interface Student {
  studentId: string;
  studentName: string;
  grade: string;
}

interface HifzHistoryEntry {
  lessonDateText: string;
  recordType: string;
  surah: string;
  from: number;
  to: number;
  hifzGrade: string;
  lines: number;
  teacherId: string;
}

export function ParentHifzPortal({ user, onBack }: ParentHifzPortalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [hifzHistory, setHifzHistory] = useState<HifzHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const parentInfo = await backend.parent.getParentInfo({ username: user.loginID });
        const studentsResp = await backend.student.getStudentsByParentID({ parentId: parentInfo.parentID });
        
        setStudents(studentsResp.students.map(s => ({
          studentId: s.studentid,
          studentName: s.studentname,
          grade: s.grade
        })));
      } catch (error) {
        console.error("Failed to fetch students:", error);
        toast({
          title: "Error",
          description: "Failed to load student information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [user.loginID, toast]);

  useEffect(() => {
    if (!selectedStudent) {
      setHifzHistory([]);
      return;
    }

    const fetchHifzHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await backend.hifz.getHistoryByStudentId({
          studentId: selectedStudent,
          prevRowsCount: "50"
        });
        setHifzHistory(response.history);
      } catch (error) {
        console.error("Failed to fetch hifz history:", error);
        toast({
          title: "Error",
          description: "Failed to load hifz history",
          variant: "destructive",
        });
        setHifzHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHifzHistory();
  }, [selectedStudent, toast]);

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "Invalid Date";
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date";
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const dayName = days[date.getDay()];
      const monthName = months[date.getMonth()];
      const day = date.getDate();
      
      const suffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
          case 1: return 'st';
          case 2: return 'nd';
          case 3: return 'rd';
          default: return 'th';
        }
      };
      
      return `${dayName} ${monthName} ${day}${suffix(day)}`;
    } catch {
      return "Invalid Date";
    }
  };



  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            Active
          </Badge>
          <span className="text-sm text-gray-600">
            Last Login: {new Date(user.lastLoginDTTM || '').toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Parent Hifz Portal</h3>
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Parent Hub
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Selection</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-gray-600">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-sm text-gray-600">No students found</div>
          ) : (
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.studentId} value={s.studentId}>
                    {s.studentName} ({s.grade})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Hifz History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="text-sm text-gray-600">Loading hifz history...</div>
            ) : hifzHistory.length === 0 ? (
              <div className="text-sm text-gray-600">No hifz history found</div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-sm font-medium">Date</th>
                      <th className="text-left p-2 text-sm font-medium">Type</th>
                      <th className="text-left p-2 text-sm font-medium">Surah</th>
                      <th className="text-left p-2 text-sm font-medium">From</th>
                      <th className="text-left p-2 text-sm font-medium">To</th>
                      <th className="text-left p-2 text-sm font-medium">Grade</th>
                      <th className="text-left p-2 text-sm font-medium">Lines</th>
                      <th className="text-left p-2 text-sm font-medium">Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hifzHistory.map((entry, index) => {
                      const prevEntry = index > 0 ? hifzHistory[index - 1] : null;
                      const isDifferentDate = !prevEntry || entry.lessonDateText !== prevEntry.lessonDateText;
                      const bgColor = isDifferentDate 
                        ? (index === 0 || (prevEntry && hifzHistory.findIndex(e => e.lessonDateText === prevEntry.lessonDateText) % 2 === 0)
                          ? "bg-gray-100" 
                          : "bg-white")
                        : (hifzHistory.findIndex(e => e.lessonDateText === entry.lessonDateText) % 2 === 0
                          ? "bg-gray-100"
                          : "bg-white");
                      
                      return (
                        <tr key={index} className={`border-b hover:opacity-80 ${bgColor}`}>
                          <td className="p-2 text-sm">{formatDate(entry.lessonDateText)}</td>
                          <td className="p-2 text-sm capitalize">{entry.recordType || ''}</td>
                          <td className="p-2 text-sm">{entry.surah || ''}</td>
                          <td className="p-2 text-sm">{entry.from || ''}</td>
                          <td className="p-2 text-sm">{entry.to || ''}</td>
                          <td className="p-2">
                            <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {entry.hifzGrade || ''}
                            </span>
                          </td>
                          <td className="p-2 text-sm">{entry.lines || ''}</td>
                          <td className="p-2 text-sm">{entry.teacherId || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
