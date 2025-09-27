import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { GraduationCap, Users, Clock, CheckCircle, RefreshCw, AlertCircle, Edit, XCircle, Play, Pause } from "lucide-react";
import { StudentStatusEditDialog } from "../teacher/StudentStatusEditDialog";
import { SlideReleaseButton } from "../teacher/SlideReleaseButton";
import backend from "~backend/client";
import type { User as UserType } from "~backend/user/types";
import type { Grade } from "~backend/grades/types";

interface TeacherDashboardProps {
  user: UserType;
}

interface DismissalQueueRecord {
  queueId: string;
  classBuilding: string;
  grade: string;
  dismissalQueueStatus: string;
  parentId?: string;
  studentId?: string;
  studentName?: string;
  parentName?: string;
  alternateName?: string;
  qrScannedAt?: Date;
  addToQueueMethod: string;
  qrScannedAtBuilding?: string;
  dismissedAt?: Date;
  dismissedByName?: string;
  dismissStatus?: string;
  studentSelfDismiss?: boolean;
  dismissIssue?: string;
  pickupConfirmedDTTM?: Date;
  pickupConfirmedByName?: string;
  pickupIssue?: string;
}

interface StatusCounts {
  total: number;
  standby: number;
  inQueue: number;
  released: number;
  collected: number;
}

type StatusFilter = 'all' | 'standby' | 'inQueue' | 'released' | 'collected';

interface AttendanceCount {
  status: string;
  count: number;
}

interface DismissalCount {
  status: string;
  count: number;
}

interface AttendanceDismissalCounts {
  attendance: AttendanceCount[];
  dismissal: DismissalCount[];
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [dismissalRecords, setDismissalRecords] = useState<DismissalQueueRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DismissalQueueRecord[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    total: 0,
    standby: 0,
    inQueue: 0,
    released: 0,
    collected: 0
  });
  const [attendanceDismissalCounts, setAttendanceDismissalCounts] = useState<AttendanceDismissalCounts | null>(null);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<DismissalQueueRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);
  
  // Debug state for API response
  const [debugApiResponse, setDebugApiResponse] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Auto-refresh state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Auto-refresh countdown and refresh logic
  useEffect(() => {
    if (selectedGrade && autoRefreshEnabled) {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }

      // Start countdown from 10 seconds
      setCountdown(10);
      
      const newIntervalId = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Time to refresh
            handleRefresh();
            return 10; // Reset countdown
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
      // Clear interval if auto-refresh is disabled or no grade selected
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setCountdown(10);
    }
  }, [selectedGrade, autoRefreshEnabled]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Load grades on component mount
  useEffect(() => {
    const loadGrades = async () => {
      try {
        const response = await backend.grades.list();
        setGrades(response.grades);
      } catch (error) {
        console.error("Failed to load grades:", error);
        toast({
          title: "Error",
          description: "Failed to load grade list",
          variant: "destructive",
        });
      }
    };

    loadGrades();
  }, [toast]);

  // Filter records when activeFilter or dismissalRecords change
  useEffect(() => {
    filterRecords();
  }, [activeFilter, dismissalRecords]);

  const parseAttendanceDismissalData = (response: any): AttendanceDismissalCounts => {
    console.log("🔍 PARSING DEBUG - Starting to parse response:", response);
    
    // Default empty data if parsing fails
    const defaultData: AttendanceDismissalCounts = {
      attendance: [],
      dismissal: []
    };
    
    if (!response || !response.data || !Array.isArray(response.data)) {
      console.log("🔍 PARSING DEBUG - Invalid response structure");
      return defaultData;
    }
    
    // Function to parse individual status-count data string
    // Example: "ATTENDANCE:Unknown,0|OnTime,5|OnTime-M,2|Tardy,1|Tardy-M,0|NoShow,0"
    const parseCountData = (dataString: string) => {
      console.log("🔍 PARSING DEBUG - Processing data string:", dataString);
      
      if (!dataString || typeof dataString !== 'string') {
        console.log("🔍 PARSING DEBUG - Invalid data string");
        return [];
      }
      
      // Split by colon to separate the prefix (ATTENDANCE/DISMISSAL) from the data
      const colonIndex = dataString.indexOf(':');
      if (colonIndex === -1) {
        console.log("🔍 PARSING DEBUG - No colon found in data string");
        return [];
      }
      
      const prefix = dataString.substring(0, colonIndex);
      const countsString = dataString.substring(colonIndex + 1);
      
      console.log("🔍 PARSING DEBUG - Prefix:", prefix);
      console.log("🔍 PARSING DEBUG - Counts string:", countsString);
      
      if (!countsString) {
        console.log("🔍 PARSING DEBUG - Empty counts string");
        return [];
      }
      
      // Split by pipe (|) to get individual status,count pairs
      const pairs = countsString.split('|');
      console.log("🔍 PARSING DEBUG - Status-count pairs:", pairs);
      
      const result = pairs.map((pair, index) => {
        const [status, countStr] = pair.split(',');
        const count = parseInt(countStr, 10) || 0;
        console.log(`🔍 PARSING DEBUG - Pair ${index}: status="${status}", count=${count}`);
        return { status: status || '', count };
      });
      
      console.log("🔍 PARSING DEBUG - Parsed result:", result);
      return result;
    };

    try {
      let attendanceData = '';
      let dismissalData = '';
      
      console.log("🔍 PARSING DEBUG - Searching through response.data items:");
      
      // Find attendance and dismissal strings in the response
      for (let i = 0; i < response.data.length; i++) {
        const item = response.data[i];
        console.log(`🔍 PARSING DEBUG - Item ${i}:`, item, typeof item);
        
        if (typeof item === 'string') {
          if (item.startsWith('ATTENDANCE:')) {
            attendanceData = item;
            console.log("🔍 PARSING DEBUG - Found attendance data:", attendanceData);
          } else if (item.startsWith('DISMISSAL:')) {
            dismissalData = item;
            console.log("🔍 PARSING DEBUG - Found dismissal data:", dismissalData);
          }
        }
      }
      
      const parsedResult = {
        attendance: attendanceData ? parseCountData(attendanceData) : [],
        dismissal: dismissalData ? parseCountData(dismissalData) : []
      };
      
      console.log("🔍 PARSING DEBUG - Final parsed result:", parsedResult);
      return parsedResult;
      
    } catch (error) {
      console.error("🔍 PARSING DEBUG - Error during parsing:", error);
      return defaultData;
    }
  };

  const loadAttendanceDismissalCounts = async (grade: string) => {
    try {
      const timezone = 'America/Chicago';
      const requestPayload = { 
        sch_tz: timezone, 
        p_grade: grade 
      };
      
      console.log("🚀 ATTENDANCE API DEBUG - SENDING REQUEST:");
      console.log("  API Endpoint: queue.attendanceAndDismissalQueueCountsByGrade");
      console.log("  Request Payload:", JSON.stringify(requestPayload, null, 2));
      console.log("  Grade:", grade);
      console.log("  Timezone:", timezone);
      
      const response = await backend.queue.attendanceAndDismissalQueueCountsByGrade(requestPayload);
      
      console.log("📥 ATTENDANCE API DEBUG - RECEIVED RESPONSE:");
      console.log("  Full Response Object:", response);
      console.log("  Response Type:", typeof response);
      console.log("  Response Stringified:", JSON.stringify(response, null, 2));
      
      if (response && response.data) {
        console.log("  Response.data:", response.data);
        console.log("  Response.data Type:", typeof response.data);
        console.log("  Response.data Length:", Array.isArray(response.data) ? response.data.length : 'not an array');
        if (Array.isArray(response.data)) {
          response.data.forEach((item, index) => {
            console.log(`  Response.data[${index}]:`, item, typeof item);
          });
        }
      }
      
      const parsedCounts = parseAttendanceDismissalData(response);
      console.log("🔄 ATTENDANCE API DEBUG - PARSED RESULT:");
      console.log("  Parsed Counts:", JSON.stringify(parsedCounts, null, 2));
      
      // Store the raw response for debug display
      setDebugApiResponse(response);
      setAttendanceDismissalCounts(parsedCounts);
      
      // Show a toast with the API status
      toast({
        title: "Attendance API Called",
        description: `Grade: ${grade}, Response received: ${response ? 'Yes' : 'No'}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("❌ ATTENDANCE API DEBUG - ERROR:");
      console.error("  Error Object:", error);
      console.error("  Error Message:", error instanceof Error ? error.message : 'Unknown error');
      console.error("  Error Stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      setAttendanceDismissalCounts(null);
      
      // Show error toast
      toast({
        title: "Attendance API Error",
        description: `Failed to load attendance data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const loadDismissalQueue = async (grade: string) => {
    setIsLoading(true);
    try {
      console.log(`Loading dismissal queue for grade: ${grade}`);
      
      // Load both dismissal queue and attendance/dismissal counts
      const [queueResponse] = await Promise.allSettled([
        backend.queue.getQueueListByGrade({ grade }),
        loadAttendanceDismissalCounts(grade)
      ]);
      
      if (queueResponse.status === 'fulfilled') {
        console.log("Dismissal queue response:", queueResponse.value);
        
        setDismissalRecords(queueResponse.value.records);
        setCurrentQueueId(queueResponse.value.queueId);
        calculateStatusCounts(queueResponse.value.records);
        setLastRefresh(new Date());
        
        if (!isRefreshing) {
          toast({
            title: "Queue Loaded",
            description: `Loaded dismissal queue for ${grade} (${queueResponse.value.totalCount} students)`,
          });
        }
      } else {
        throw queueResponse.reason;
      }
    } catch (error) {
      console.error("Failed to load dismissal queue:", error);
      
      // Clear data on error
      setDismissalRecords([]);
      setCurrentQueueId(null);
      setAttendanceDismissalCounts(null);
      calculateStatusCounts([]);
      
      let errorMessage = "Failed to load dismissal queue";
      if (error instanceof Error) {
        if (error.message.includes("No open queue")) {
          errorMessage = "No open queue found. Please ensure a queue is started.";
        } else {
          errorMessage = `Failed to load dismissal queue: ${error.message}`;
        }
      }
      
      if (!isRefreshing) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStatusCounts = (records: DismissalQueueRecord[]) => {
    const counts = {
      total: records.length,
      standby: records.filter(r => r.dismissalQueueStatus === 'Standby').length,
      inQueue: records.filter(r => r.dismissalQueueStatus === 'InQueue').length,
      released: records.filter(r => r.dismissalQueueStatus === 'Released').length,
      collected: records.filter(r => r.dismissalQueueStatus === 'Collected').length,
    };
    setStatusCounts(counts);
  };

  const filterRecords = () => {
    let filtered = dismissalRecords;
    
    switch (activeFilter) {
      case 'standby':
        filtered = dismissalRecords.filter(r => r.dismissalQueueStatus === 'Standby');
        break;
      case 'inQueue':
        filtered = dismissalRecords.filter(r => r.dismissalQueueStatus === 'InQueue');
        break;
      case 'released':
        filtered = dismissalRecords.filter(r => r.dismissalQueueStatus === 'Released');
        break;
      case 'collected':
        filtered = dismissalRecords.filter(r => r.dismissalQueueStatus === 'Collected');
        break;
      default:
        filtered = dismissalRecords;
    }
    
    setFilteredRecords(filtered);
  };

  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    setActiveFilter('all');
    loadDismissalQueue(grade);
  };

  const handleStatusFilter = (filter: StatusFilter) => {
    setActiveFilter(filter);
  };

  const handleRefresh = async () => {
    if (!selectedGrade) return;
    
    setIsRefreshing(true);
    try {
      await loadDismissalQueue(selectedGrade);
      // Reset countdown after manual refresh
      if (autoRefreshEnabled) {
        setCountdown(10);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    if (enabled) {
      setCountdown(10);
    }
  };

  const handleReleaseStudent = async (studentId: string) => {
    if (!currentQueueId) {
      toast({
        title: "Error",
        description: "No active queue found",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Releasing student ${studentId} in queue ${currentQueueId}`);
      
      const response = await backend.queue.updateDismissalStatusByStudent({
        studentId: studentId,
        queueId: currentQueueId,
        newStatus: "Released",
        dismissedByName: user.displayName
      });

      console.log("Release student response:", response);

      if (response.success) {
        // Update the local state with the new status
        const updatedRecords = dismissalRecords.map(record => 
          record.studentId === studentId 
            ? { 
                ...record, 
                dismissalQueueStatus: "Released",
                dismissedAt: response.updatedRecord.dismissedAt,
                dismissedByName: response.updatedRecord.dismissedByName
              }
            : record
        );
        
        setDismissalRecords(updatedRecords);
        calculateStatusCounts(updatedRecords);
        
        const student = dismissalRecords.find(r => r.studentId === studentId);
        toast({
          title: "Student Released",
          description: `${student?.studentName || 'Student'} has been marked as released`,
        });
      }
    } catch (error) {
      console.error("Failed to release student:", error);
      
      let errorMessage = "Failed to update student status";
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorMessage = "Student record not found in dismissal queue";
        } else {
          errorMessage = `Failed to release student: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = (studentId: string) => {
    const student = dismissalRecords.find(r => r.studentId === studentId);
    if (student) {
      setSelectedStudent(student);
      setIsEditDialogOpen(true);
    }
  };

  const handleStatusUpdated = async (studentId: string, newStatus: string) => {
    if (!currentQueueId) {
      toast({
        title: "Error",
        description: "No active queue found",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Updating student ${studentId} status to ${newStatus} in queue ${currentQueueId}`);
      
      const response = await backend.queue.updateDismissalStatusByStudent({
        studentId: studentId,
        queueId: currentQueueId,
        newStatus: newStatus,
        dismissedByName: user.displayName
      });

      console.log("Update student status response:", response);

      if (response.success) {
        // Update the local state with the new status
        const updatedRecords = dismissalRecords.map(record => 
          record.studentId === studentId 
            ? { 
                ...record, 
                dismissalQueueStatus: newStatus,
                dismissedAt: response.updatedRecord.dismissedAt,
                dismissedByName: response.updatedRecord.dismissedByName
              }
            : record
        );
        
        setDismissalRecords(updatedRecords);
        calculateStatusCounts(updatedRecords);
        setIsEditDialogOpen(false);
        setSelectedStudent(null);
        
        toast({
          title: "Status Updated",
          description: `Student status has been updated to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error("Failed to update student status:", error);
      
      let errorMessage = "Failed to update student status";
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorMessage = "Student record not found in dismissal queue";
        } else if (error.message.includes("Invalid status")) {
          errorMessage = "Invalid status value provided";
        } else {
          errorMessage = `Failed to update status: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Standby':
        return 'bg-yellow-100 text-yellow-800';
      case 'InQueue':
        return 'bg-blue-100 text-blue-800';
      case 'Released':
        return 'bg-green-100 text-green-800';
      case 'Collected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilterButtonClass = (filter: StatusFilter, count: number) => {
    const isActive = activeFilter === filter;
    const baseClass = "flex-1 text-center p-3 rounded-lg border transition-all";
    
    if (count === 0) {
      return `${baseClass} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }
    
    if (isActive) {
      return `${baseClass} bg-blue-600 text-white border-blue-600`;
    }
    
    return `${baseClass} bg-white text-gray-700 border-gray-300 hover:bg-gray-50`;
  };

  const formatLastLogin = (lastLogin: Date | null) => {
    if (!lastLogin) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return lastLogin.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={user.userStatus === 'Active' ? 'default' : 'destructive'}
              className={user.userStatus === 'Active' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {user.userStatus}
            </Badge>
            <span className="text-sm text-gray-500">
              Last login: {formatLastLogin(user.lastLoginDTTM)}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 whitespace-nowrap">Teacher Dashboard</h3>
          <p className="text-sm text-gray-600">
            Manage student dismissal queue and track pickup status.
          </p>
        </div>
      </div>

      {/* Status Count Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <CardTitle>Status Count</CardTitle>
              {currentQueueId && (
                <Badge variant="secondary" className="ml-2">
                  Queue: {currentQueueId}
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Select a class/grade to monitor and filter students by status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Last Updated and Auto-refresh controls */}
          <div className="space-y-3">
            {/* Last Updated on its own line */}
            {lastRefresh && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              </div>
            )}
            
            {/* Auto-refresh controls on separate line */}
            <div className="flex items-center justify-end space-x-4">
              {/* Auto-refresh controls */}
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
                
                {autoRefreshEnabled && selectedGrade && (
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

              {selectedGrade && (
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  size="sm"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Now
                </Button>
              )}
            </div>
          </div>

          {/* Grade Selection */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedGrade} onValueChange={handleGradeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class/Grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.name} value={grade.name}>
                      {grade.name} - Building {grade.building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Filter Buttons */}
          {selectedGrade && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <button
                onClick={() => handleStatusFilter('all')}
                className={getFilterButtonClass('all', statusCounts.total)}
                disabled={statusCounts.total === 0}
              >
                <div>
                  <div className="font-semibold">Full Roster</div>
                  <div className="text-lg">{statusCounts.total}</div>
                </div>
              </button>
              
              <button
                onClick={() => handleStatusFilter('standby')}
                className={getFilterButtonClass('standby', statusCounts.standby)}
                disabled={statusCounts.standby === 0}
              >
                <div>
                  <div className="font-semibold">Standby</div>
                  <div className="text-lg">{statusCounts.standby}</div>
                </div>
              </button>
              
              <button
                onClick={() => handleStatusFilter('inQueue')}
                className={getFilterButtonClass('inQueue', statusCounts.inQueue)}
                disabled={statusCounts.inQueue === 0}
              >
                <div>
                  <div className="font-semibold">InQueue</div>
                  <div className="text-lg">{statusCounts.inQueue}</div>
                </div>
              </button>
              
              <button
                onClick={() => handleStatusFilter('released')}
                className={getFilterButtonClass('released', statusCounts.released)}
                disabled={statusCounts.released === 0}
              >
                <div>
                  <div className="font-semibold">Released</div>
                  <div className="text-lg">{statusCounts.released}</div>
                </div>
              </button>
              
              <button
                onClick={() => handleStatusFilter('collected')}
                className={getFilterButtonClass('collected', statusCounts.collected)}
                disabled={statusCounts.collected === 0}
              >
                <div>
                  <div className="font-semibold">Collected</div>
                  <div className="text-lg">{statusCounts.collected}</div>
                </div>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance and Dismissal Counts Grid */}
      {selectedGrade && attendanceDismissalCounts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Attendance & Dismissal Overview</span>
            </CardTitle>
            <CardDescription>
              Daily attendance and dismissal status counts for {selectedGrade}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 border-r">Attendance</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Dismissal</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Determine the maximum number of rows needed */}
                  {Array.from({ 
                    length: Math.max(
                      attendanceDismissalCounts.attendance.length, 
                      attendanceDismissalCounts.dismissal.length
                    ) 
                  }).map((_, index) => {
                    const attendanceItem = attendanceDismissalCounts.attendance[index];
                    const dismissalItem = attendanceDismissalCounts.dismissal[index];
                    
                    return (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 border-r">
                          {attendanceItem ? (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">
                                {attendanceItem.status}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {attendanceItem.count}
                              </span>
                            </div>
                          ) : (
                            <div className="h-6"></div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {dismissalItem ? (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">
                                {dismissalItem.status}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {dismissalItem.count}
                              </span>
                            </div>
                          ) : (
                            <div className="h-6"></div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information Section */}
      {selectedGrade && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>API Debug Information</span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                {showDebugInfo ? 'Hide' : 'Show'} Debug Info
              </Button>
            </div>
            <CardDescription>
              Raw API request/response data for troubleshooting
            </CardDescription>
          </CardHeader>
          {showDebugInfo && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">API Request Parameters:</h4>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                    <div>sch_tz: "America/Chicago"</div>
                    <div>p_grade: "{selectedGrade}"</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Raw API Response:</h4>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm max-h-60 overflow-auto">
                    <pre>{debugApiResponse ? JSON.stringify(debugApiResponse, null, 2) : 'No response yet - select a grade to trigger API call'}</pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Parsed Data:</h4>
                  <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm max-h-60 overflow-auto">
                    <pre>{attendanceDismissalCounts ? JSON.stringify(attendanceDismissalCounts, null, 2) : 'No parsed data available'}</pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Expected Format:</h4>
                  <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                    <div className="font-semibold mb-2">Expected API response format:</div>
                    <div className="font-mono text-xs bg-white p-2 rounded border">
                      {`{
  "data": [
    "ATTENDANCE:Unknown,0|OnTime,5|OnTime-M,2|Tardy,1|Tardy-M,0|NoShow,0",
    "DISMISSAL:Unknown,0|StandBy,3|InQueue,2|Collected,1|EarlyDismissal,0|DirectPickup,0|LatePickup,0|After Care,0"
  ]
}`}
                    </div>
                    <div className="mt-3">
                      <div className="font-semibold">Parsing Rules:</div>
                      <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                        <li>Each string starts with "ATTENDANCE:" or "DISMISSAL:"</li>
                        <li>Status-count pairs are separated by "|" (pipe)</li>
                        <li>Each pair format: "Status,Count" (comma-separated)</li>
                        <li>Example: "OnTime,5" means 5 students with OnTime status</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {debugApiResponse && debugApiResponse.data && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Parsing Breakdown:</h4>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                      {debugApiResponse.data.map((item: any, index: number) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <div className="font-semibold">Data Item {index}:</div>
                          <div className="font-mono text-xs bg-white p-2 rounded border mt-1">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                          </div>
                          {typeof item === 'string' && (
                            <div className="mt-2">
                              {item.startsWith('ATTENDANCE:') && (
                                <div>
                                  <span className="text-blue-600 font-medium">→ ATTENDANCE DATA:</span>
                                  <div className="ml-4 text-xs">
                                    {item.substring(11).split('|').map((pair, pairIndex) => {
                                      const [status, count] = pair.split(',');
                                      return (
                                        <div key={pairIndex} className="flex justify-between w-40">
                                          <span>{status}:</span>
                                          <span className="font-medium">{count}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {item.startsWith('DISMISSAL:') && (
                                <div>
                                  <span className="text-green-600 font-medium">→ DISMISSAL DATA:</span>
                                  <div className="ml-4 text-xs">
                                    {item.substring(10).split('|').map((pair, pairIndex) => {
                                      const [status, count] = pair.split(',');
                                      return (
                                        <div key={pairIndex} className="flex justify-between w-40">
                                          <span>{status}:</span>
                                          <span className="font-medium">{count}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {!item.startsWith('ATTENDANCE:') && !item.startsWith('DISMISSAL:') && (
                                <div className="text-orange-600 text-xs">
                                  ⚠️ Unexpected format - should start with ATTENDANCE: or DISMISSAL:
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Student List Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Student List</span>
            {selectedGrade && (
              <Badge variant="secondary" className="ml-2">
                {filteredRecords.length} students
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedGrade 
              ? `Students in ${selectedGrade} - ${activeFilter === 'all' ? 'All statuses' : activeFilter} status`
              : "Select a grade to view students"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedGrade ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No grade selected</p>
              <p className="text-sm text-gray-500 mt-1">
                Please select a class/grade to view the dismissal queue
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading dismissal queue...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No students found</p>
              <p className="text-sm text-gray-500 mt-1">
                {activeFilter === 'all' 
                  ? "No students in the dismissal queue for this grade"
                  : `No students with ${activeFilter} status`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                <div>Student Name</div>
                <div>A & D Status</div>
                <div>
                  <div>Parent/</div>
                  <div>Contact</div>
                </div>
                <div>Action</div>
              </div>
              
              {/* Student Rows */}
              {filteredRecords.map((record) => (
                <div 
                  key={`${record.queueId}-${record.studentId}`}
                  className="grid grid-cols-4 gap-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {record.studentName || 'Unknown Student'}
                    </div>
                    <Button
                      onClick={() => handleEditStudent(record.studentId || '')}
                      variant="outline"
                      size="sm"
                      className="mt-1 h-6 px-2 text-xs bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  <div>
                    <Badge className={getStatusColor(record.dismissalQueueStatus)}>
                      {record.dismissalQueueStatus}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {record.alternateName || record.parentName || 'No contact'}
                  </div>
                  
                  <div>
                    {(record.dismissalQueueStatus === 'Standby' || record.dismissalQueueStatus === 'InQueue') && (
                      <SlideReleaseButton
                        onRelease={() => handleReleaseStudent(record.studentId || '')}
                        studentName={record.studentName}
                      />
                    )}
                    {(record.dismissalQueueStatus === 'Released' || record.dismissalQueueStatus === 'Collected') && (
                      <span className="text-sm text-gray-500">Complete</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Status Edit Dialog */}
      {selectedStudent && (
        <StudentStatusEditDialog
          student={selectedStudent}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedStudent(null);
          }}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
