import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { GraduationCap, Users, Clock, CheckCircle, RefreshCw, AlertCircle, Edit, XCircle } from "lucide-react";
import { StudentStatusEditDialog } from "../teacher/StudentStatusEditDialog";
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
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<DismissalQueueRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (selectedGrade) {
      const interval = setInterval(() => {
        handleRefresh();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [selectedGrade]);

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

  const loadDismissalQueue = async (grade: string) => {
    setIsLoading(true);
    try {
      console.log(`Loading dismissal queue for grade: ${grade}`);
      
      const response = await backend.queue.getQueueListByGrade({ grade });
      console.log("Dismissal queue response:", response);
      
      setDismissalRecords(response.records);
      setCurrentQueueId(response.queueId);
      calculateStatusCounts(response.records);
      setLastRefresh(new Date());
      
      toast({
        title: "Queue Loaded",
        description: `Loaded dismissal queue for ${grade} (${response.totalCount} students)`,
      });
    } catch (error) {
      console.error("Failed to load dismissal queue:", error);
      
      // Clear data on error
      setDismissalRecords([]);
      setCurrentQueueId(null);
      calculateStatusCounts([]);
      
      let errorMessage = "Failed to load dismissal queue";
      if (error instanceof Error) {
        if (error.message.includes("No open queue")) {
          errorMessage = "No open queue found. Please ensure a queue is started.";
        } else {
          errorMessage = `Failed to load dismissal queue: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReleaseStudent = async (studentId: string) => {
    try {
      // TODO: Implement backend endpoint to update student status
      // await backend.queue.updateDismissalStatus({ studentId, status: 'Released' });
      
      // For now, update locally
      const updatedRecords = dismissalRecords.map(record => 
        record.studentId === studentId 
          ? { ...record, dismissalQueueStatus: 'Released' }
          : record
      );
      
      setDismissalRecords(updatedRecords);
      calculateStatusCounts(updatedRecords);
      
      const student = dismissalRecords.find(r => r.studentId === studentId);
      toast({
        title: "Student Released",
        description: `${student?.studentName} has been marked as released`,
      });
    } catch (error) {
      console.error("Failed to release student:", error);
      toast({
        title: "Error",
        description: "Failed to update student status",
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

  const handleStatusUpdated = (studentId: string, newStatus: string) => {
    const updatedRecords = dismissalRecords.map(record => 
      record.studentId === studentId 
        ? { ...record, dismissalQueueStatus: newStatus }
        : record
    );
    
    setDismissalRecords(updatedRecords);
    calculateStatusCounts(updatedRecords);
    setIsEditDialogOpen(false);
    setSelectedStudent(null);
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
        <div className="text-right">
          {lastRefresh && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          )}
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
            {selectedGrade && (
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
          <CardDescription>
            Select a class/grade to monitor and filter students by status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <div>Status</div>
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
                    {record.dismissalQueueStatus === 'Standby' && (
                      <Button
                        onClick={() => handleReleaseStudent(record.studentId || '')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1 h-7"
                      >
                        Release
                      </Button>
                    )}
                    {record.dismissalQueueStatus === 'InQueue' && (
                      <Button
                        onClick={() => handleReleaseStudent(record.studentId || '')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1 h-7"
                      >
                        Release
                      </Button>
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
