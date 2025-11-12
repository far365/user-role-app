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

interface ProgressStats {
  memorization: number;
  revision: number;
  meaning: number;
  memorizationHistory: number[];
  revisionHistory: number[];
  meaningHistory: number[];
}

export function ParentHifzPortal({ user, onBack }: ParentHifzPortalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [hifzHistory, setHifzHistory] = useState<HifzHistoryEntry[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    memorization: 0,
    revision: 0,
    meaning: 0,
    memorizationHistory: [],
    revisionHistory: [],
    meaningHistory: []
  });
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
        
        const totalLines = 6236;
        let memTotal = 0;
        let revTotal = 0;
        let meanTotal = 0;
        const memHist: number[] = [];
        const revHist: number[] = [];
        const meanHist: number[] = [];
        
        response.history.forEach((entry) => {
          const lines = entry.lines || 0;
          const type = entry.recordType?.toLowerCase() || '';
          
          if (type === 'memorization') {
            memTotal += lines;
            memHist.push(lines);
          } else if (type === 'revision') {
            revTotal += lines;
            revHist.push(lines);
          } else if (type === 'meaning') {
            meanTotal += lines;
            meanHist.push(lines);
          }
        });
        
        setProgressStats({
          memorization: Math.round((memTotal / totalLines) * 100),
          revision: Math.round((revTotal / totalLines) * 100),
          meaning: Math.round((meanTotal / totalLines) * 100),
          memorizationHistory: memHist.slice(0, 15).reverse(),
          revisionHistory: revHist.slice(0, 15).reverse(),
          meaningHistory: meanHist.slice(0, 15).reverse()
        });
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
            <div className="flex items-center gap-4">
              <div className="flex-1">
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
              </div>
              {selectedStudent && (
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  Target Graduation: Dec 2026
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <ProgressCircle
                  label="Memorization"
                  percentage={progressStats.memorization}
                  color="text-green-600"
                  bgColor="stroke-green-600"
                  history={progressStats.memorizationHistory}
                  historyColor="bg-green-500"
                />
                <ProgressCircle
                  label="Revision"
                  percentage={progressStats.revision}
                  color="text-orange-600"
                  bgColor="stroke-orange-600"
                  history={progressStats.revisionHistory}
                  historyColor="bg-orange-500"
                />
                <ProgressCircle
                  label="Meaning"
                  percentage={progressStats.meaning}
                  color="text-yellow-600"
                  bgColor="stroke-yellow-600"
                  history={progressStats.meaningHistory}
                  historyColor="bg-yellow-500"
                />
              </div>
            </CardContent>
          </Card>

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
        </>
      )}
    </div>
  );
}

interface ProgressCircleProps {
  label: string;
  percentage: number;
  color: string;
  bgColor: string;
  history: number[];
  historyColor: string;
}

function ProgressCircle({ label, percentage, color, bgColor, history, historyColor }: ProgressCircleProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const maxHistory = Math.max(...history, 1);

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className={bgColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{percentage}%</span>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="flex items-end justify-center space-x-1 h-12 w-full px-2">
        {history.length > 0 ? (
          history.map((value, index) => {
            const height = Math.max((value / maxHistory) * 100, 5);
            return (
              <div
                key={index}
                className={`flex-1 ${historyColor} rounded-sm opacity-70`}
                style={{ height: `${height}%` }}
                title={`${value} lines`}
              />
            );
          })
        ) : (
          <div className="text-xs text-gray-400">No data</div>
        )}
      </div>
    </div>
  );
}
