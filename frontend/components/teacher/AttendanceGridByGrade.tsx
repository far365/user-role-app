import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Bug } from "lucide-react";
import backend from "~backend/client";

interface AttendanceGridProps {
  grade: string;
  startDate: string;
  endDate: string;
}

interface AttendanceRecord {
  grade: string;
  parentid: string;
  parentname: string;
  queueid: number;
  studentid: string;
  studentname: string;
  arrival_status?: string;
}

interface StudentAttendance {
  studentid: string;
  studentname: string;
  parentid: string;
  parentname: string;
  dates: Map<string, string | undefined>;
}

export function AttendanceGridByGrade({ grade, startDate, endDate }: AttendanceGridProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWeekends, setShowWeekends] = useState(false);
  const [debugPayload, setDebugPayload] = useState<any>(null);
  const [debugResponse, setDebugResponse] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAttendanceData();
  }, [grade, startDate, endDate]);

  const loadAttendanceData = async () => {
    setIsLoading(true);
    try {
      const payload = {
        p_start_date: startDate,
        p_end_date: endDate,
        p_grade: grade,
      };
      setDebugPayload(payload);

      const response = await backend.queue.getHistorybyGradeParentStudent(payload);

      setDebugResponse(response);
      setRecords(response.records as any);
    } catch (error) {
      console.error("Failed to load attendance data:", error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDateRange = (): Date[] => {
    const dates: Date[] = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (showWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
        dates.push(new Date(d));
      }
    }

    return dates;
  };

  const organizeStudentData = (): StudentAttendance[] => {
    const studentMap = new Map<string, StudentAttendance>();

    records.forEach(record => {
      const key = record.studentid;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentid: record.studentid,
          studentname: record.studentname,
          parentid: record.parentid,
          parentname: record.parentname,
          dates: new Map(),
        });
      }

      const student = studentMap.get(key)!;
      const queueIdStr = record.queueid.toString();
      const year = queueIdStr.substring(0, 4);
      const month = queueIdStr.substring(4, 6);
      const day = queueIdStr.substring(6, 8);
      const dateKey = `${year}-${month}-${day}`;
      student.dates.set(dateKey, record.arrival_status);
    });

    return Array.from(studentMap.values()).sort((a, b) => 
      a.studentname.localeCompare(b.studentname)
    );
  };

  const getWeekNumber = (date: Date): number => {
    const start = new Date(startDate);
    const diffTime = date.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
  };

  const formatDateHeader = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  const formatDayOfWeek = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const dates = generateDateRange();
  const students = organizeStudentData();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
        <p className="text-gray-600">Loading attendance data...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>Attendance Grid - {grade}</CardTitle>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2"
            >
              <Bug className="w-4 h-4" />
              Debug
            </Button>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-weekends"
                checked={showWeekends}
                onCheckedChange={setShowWeekends}
              />
              <Label htmlFor="show-weekends" className="text-sm">Show Weekends</Label>
            </div>
          </div>
        </div>
        <CardDescription>
          {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showDebug && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Request Payload:</h4>
              <pre className="bg-white p-3 rounded border overflow-x-auto text-xs">
                {JSON.stringify(debugPayload, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response:</h4>
              <pre className="bg-white p-3 rounded border overflow-x-auto text-xs max-h-96">
                {JSON.stringify(debugResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-white border border-gray-300 p-2 text-left font-semibold min-w-[150px]">
                  Student
                </th>
                <th className="sticky left-[150px] z-20 bg-white border border-gray-300 p-2 text-left font-semibold min-w-[150px]">
                  Parent
                </th>
                {dates.map((date, idx) => {
                  const weekNum = getWeekNumber(date);
                  const bgColor = weekNum % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50';
                  return (
                    <th
                      key={idx}
                      className={`border border-gray-300 p-1 text-center font-normal ${bgColor}`}
                    >
                      <div className="text-xs">{formatDayOfWeek(date)}</div>
                      <div className="text-xs font-semibold">{formatDateHeader(date)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={dates.length + 2} className="text-center py-8 text-gray-500">
                    No attendance data found for this grade and date range
                  </td>
                </tr>
              ) : (
                students.map((student, studentIdx) => (
                  <tr key={studentIdx} className="hover:bg-blue-50">
                    <td className="sticky left-0 z-10 bg-white border border-gray-300 p-2 font-medium">
                      {student.studentname}
                    </td>
                    <td className="sticky left-[150px] z-10 bg-white border border-gray-300 p-2 text-gray-600">
                      {student.parentname}
                    </td>
                    {dates.map((date, dateIdx) => {
                      const dateKey = date.toISOString().split('T')[0];
                      const arrivalStatus = student.dates.get(dateKey);
                      const isAttendanceDay = arrivalStatus && ['OnTime', 'Tardy', 'NoShow', 'ExcusedDelay'].includes(arrivalStatus);
                      const weekNum = getWeekNumber(date);
                      const baseBgColor = weekNum % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50';
                      const cellBgColor = isAttendanceDay ? 'bg-green-100' : baseBgColor;
                      
                      return (
                        <td
                          key={dateIdx}
                          className={`border border-gray-300 p-2 text-center ${cellBgColor}`}
                        >
                          <input
                            type="checkbox"
                            checked={!!isAttendanceDay}
                            readOnly
                            className="w-4 h-4 cursor-default"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
