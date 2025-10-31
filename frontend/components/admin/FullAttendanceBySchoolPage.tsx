import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, RefreshCw, Clock, AlertCircle, GraduationCap, Users, Play, Pause, User as UserIcon } from "lucide-react";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import type { Grade } from "~backend/grades/types";

interface FullAttendanceBySchoolPageProps {
  user: User;
  onBack: () => void;
}

interface StatusCounts {
  present: number;
  absent: number;
  tardy: number;
  excused: number;
  unexcused: number;
  unknown: number;
  total: number;
}

interface GradeAttendanceData {
  grade: string;
  queueId: string | null;
  statusCounts: StatusCounts;
  records: AttendanceRecord[];
  isLoading: boolean;
  error?: string;
}

interface AttendanceRecord {
  queueid: string;
  studentid: string;
  StudentName: string;
  AttendanceStatusAndTime: string;
  DismissalStatusAndTime: string;
  DismissalMethod: string;
  DismissalPickupBy: string;
  grade: string;
  attendanceStatus: string;
}

export function FullAttendanceBySchoolPage({ user, onBack }: FullAttendanceBySchoolPageProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeAttendanceData, setGradeAttendanceData] = useState<GradeAttendanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (autoRefreshEnabled && gradeAttendanceData.length > 0) {
      if (intervalId) {
        clearInterval(intervalId);
      }

      setCountdown(30);
      
      const newIntervalId = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleRefresh();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      setIntervalId(newIntervalId);

      return () => {
        if (newIntervalId) {
          clearInterval(newIntervalId);
        }
      };
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setCountdown(30);
    }
  }, [autoRefreshEnabled, gradeAttendanceData.length]);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        const gradesResponse = await backend.grades.list();
        setGrades(gradesResponse.grades);
        
        const initialGradeData: GradeAttendanceData[] = gradesResponse.grades.map(grade => ({
          grade: grade.name,
          queueId: null,
          statusCounts: {
            present: 0,
            absent: 0,
            tardy: 0,
            excused: 0,
            unexcused: 0,
            unknown: 0,
            total: 0
          },
          records: [],
          isLoading: true
        }));
        
        setGradeAttendanceData(initialGradeData);
        
        await loadFullAttendanceData();
        
      } catch (error) {
        console.error("Failed to load initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load grade information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [toast]);

  const loadFullAttendanceData = async () => {
    try {
      console.log('Loading full attendance data');
      
      const response = await backend.queue.getAttendanceDismissalStatusFullQueue();
      console.log('Full attendance response:', response);
      
      const enrichedRecords = response.data.map(record => ({
        ...record,
        attendanceStatus: extractAttendanceStatus(record.AttendanceStatusAndTime)
      }));
      
      const queueId = enrichedRecords.length > 0 ? enrichedRecords[0].queueid : null;
      if (queueId) {
        setCurrentQueueId(queueId);
      }
      
      setGradeAttendanceData(prev => 
        prev.map(gradeData => {
          const gradeRecords = enrichedRecords.filter(r => r.grade === gradeData.grade);
          const statusCounts = calculateStatusCounts(gradeRecords);
          
          return {
            ...gradeData,
            queueId,
            statusCounts,
            records: gradeRecords,
            isLoading: false,
            error: undefined
          };
        })
      );
      
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Failed to load full attendance data:', error);
      
      setGradeAttendanceData(prev => 
        prev.map(gradeData => ({
          ...gradeData,
          queueId: null,
          statusCounts: {
            present: 0,
            absent: 0,
            tardy: 0,
            excused: 0,
            unexcused: 0,
            unknown: 0,
            total: 0
          },
          records: [],
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load data"
        }))
      );
    }
  };

  const extractAttendanceStatus = (statusAndTime: string): string => {
    const match = statusAndTime.match(/Attendance:\s*(\w+)/);
    return match ? match[1] : 'Unknown';
  };

  const calculateStatusCounts = (records: AttendanceRecord[]): StatusCounts => {
    const counts = {
      present: 0,
      absent: 0,
      tardy: 0,
      excused: 0,
      unexcused: 0,
      unknown: 0,
      total: records.length
    };

    records.forEach(record => {
      switch (record.attendanceStatus) {
        case 'Present':
          counts.present++;
          break;
        case 'Absent':
          counts.absent++;
          break;
        case 'Tardy':
          counts.tardy++;
          break;
        case 'Excused':
          counts.excused++;
          break;
        case 'Unexcused':
          counts.unexcused++;
          break;
        case 'Unknown':
          counts.unknown++;
          break;
      }
    });

    return counts;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadFullAttendanceData();
      
      if (autoRefreshEnabled) {
        setCountdown(30);
      }
      
      if (!isRefreshing) {
        toast({
          title: "Refreshed",
          description: "Attendance data has been updated for all grades",
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    if (enabled) {
      setCountdown(30);
    }
  };

  const toggleGradeExpansion = (gradeName: string) => {
    setExpandedGrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gradeName)) {
        newSet.delete(gradeName);
      } else {
        newSet.add(gradeName);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Tardy':
        return 'bg-yellow-100 text-yellow-800';
      case 'Excused':
        return 'bg-blue-100 text-blue-800';
      case 'Unexcused':
        return 'bg-orange-100 text-orange-800';
      case 'Unknown':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalCounts = () => {
    return gradeAttendanceData.reduce((totals, gradeData) => ({
      present: totals.present + gradeData.statusCounts.present,
      absent: totals.absent + gradeData.statusCounts.absent,
      tardy: totals.tardy + gradeData.statusCounts.tardy,
      excused: totals.excused + gradeData.statusCounts.excused,
      unexcused: totals.unexcused + gradeData.statusCounts.unexcused,
      unknown: totals.unknown + gradeData.statusCounts.unknown,
      total: totals.total + gradeData.statusCounts.total
    }), {
      present: 0,
      absent: 0,
      tardy: 0,
      excused: 0,
      unexcused: 0,
      unknown: 0,
      total: 0
    });
  };

  const totalCounts = getTotalCounts();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Full Attendance by School</h2>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Full Attendance by School</h2>
          <p className="text-gray-600">
            Complete overview of attendance status across all grades
          </p>
          {currentQueueId && (
            <Badge variant="secondary" className="mt-2">
              Queue: {currentQueueId}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Attendance Overview</span>
          </CardTitle>
          <CardDescription>
            Real-time attendance status of all students across all grades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {lastRefresh && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-refresh"
                    checked={autoRefreshEnabled}
                    onCheckedChange={handleAutoRefreshToggle}
                  />
                  <Label htmlFor="auto-refresh" className="text-sm text-gray-600">
                    Auto-refresh
                  </Label>
                </div>
                
                {autoRefreshEnabled && gradeAttendanceData.length > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    {isRefreshing ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Next: {countdown}s</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh All
              </Button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div className="text-sm font-medium text-slate-800">Total Students</div>
            <div className="text-2xl font-bold text-slate-900">{totalCounts.total}</div>
          </div>
					
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="text-sm font-medium text-green-800">Present</div>
              <div className="text-lg font-bold text-green-900">{totalCounts.present}</div>
            </div>
            
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <div className="text-sm font-medium text-red-800">Absent</div>
              <div className="text-lg font-bold text-red-900">{totalCounts.absent}</div>
            </div>
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <div className="text-sm font-medium text-yellow-800">Tardy</div>
              <div className="text-lg font-bold text-yellow-900">{totalCounts.tardy}</div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-sm font-medium text-blue-800">Excused</div>
              <div className="text-lg font-bold text-blue-900">{totalCounts.excused}</div>
            </div>
            
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <div className="text-sm font-medium text-orange-800">Unexcused</div>
              <div className="text-lg font-bold text-orange-900">{totalCounts.unexcused}</div>
            </div>
            
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <div className="text-sm font-medium text-gray-800">Unknown</div>
              <div className="text-lg font-bold text-gray-900">{totalCounts.unknown}</div>
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="space-y-4">
        {gradeAttendanceData.map((gradeData) => (
          <Card key={gradeData.grade} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleGradeExpansion(gradeData.grade)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">
                      {gradeData.grade}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      {gradeData.isLoading && (
                        <span className="text-blue-600">Loading...</span>
                      )}
                      {gradeData.error && (
                        <span className="text-red-600">Error loading data</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {gradeData.statusCounts.total} students
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {expandedGrades.has(gradeData.grade) ? '▼' : '▶'}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {gradeData.statusCounts.present > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    Present: {gradeData.statusCounts.present}
                  </Badge>
                )}
                {gradeData.statusCounts.absent > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    Absent: {gradeData.statusCounts.absent}
                  </Badge>
                )}
                {gradeData.statusCounts.tardy > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Tardy: {gradeData.statusCounts.tardy}
                  </Badge>
                )}
                {gradeData.statusCounts.excused > 0 && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Excused: {gradeData.statusCounts.excused}
                  </Badge>
                )}
                {gradeData.statusCounts.unexcused > 0 && (
                  <Badge className="bg-orange-100 text-orange-800">
                    Unexcused: {gradeData.statusCounts.unexcused}
                  </Badge>
                )}
                {gradeData.statusCounts.unknown > 0 && (
                  <Badge className="bg-gray-100 text-gray-800">
                    Unknown: {gradeData.statusCounts.unknown}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            {expandedGrades.has(gradeData.grade) && (
              <CardContent className="pt-0">
                {gradeData.isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading students...</p>
                  </div>
                ) : gradeData.error ? (
                  <div className="text-center py-4">
                    <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600">{gradeData.error}</p>
                  </div>
                ) : gradeData.records.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No student data available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-4 p-2 bg-gray-50 rounded text-sm font-medium text-gray-700">
                      <div>Student Name</div>
                      <div>Attendance Status</div>
                      <div>Status Time</div>
                    </div>
                    
                    {gradeData.records.map((record) => (
                      <div 
                        key={`${record.queueid}-${record.studentid}`}
                        className="grid grid-cols-3 gap-4 p-2 border rounded text-sm hover:bg-gray-50"
                      >
                        <div className="font-medium">
                          {record.StudentName || 'Unknown Student'}
                        </div>
                        
                        <div>
                          <Badge className={getStatusColor(record.attendanceStatus)}>
                            {record.attendanceStatus}
                          </Badge>
                        </div>
                        
                        <div className="text-gray-600">
                          {record.AttendanceStatusAndTime.replace(/Attendance:\s*\w+\s*at\s*/i, '')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {!currentQueueId && !isLoading && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center text-yellow-800">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">No Active Queue</p>
              <p className="text-sm">No queue is currently active. Please start a queue to view student data.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
