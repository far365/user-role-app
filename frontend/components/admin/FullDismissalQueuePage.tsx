import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, RefreshCw, Clock, AlertCircle, GraduationCap, Users, Play, Pause, Building, User, Phone } from "lucide-react";
import backend from "~backend/client";
import type { User } from "~backend/user/types";
import type { Grade } from "~backend/grades/types";

interface FullDismissalQueuePageProps {
  user: User;
  onBack: () => void;
}

interface StatusCounts {
  standby: number;
  inQueue: number;
  released: number;
  collected: number;
  unknown: number;
  noShow: number;
  earlyDismissal: number;
  directPickup: number;
  latePickup: number;
  afterCare: number;
  total: number;
}

interface GradeQueueData {
  grade: string;
  building: string;
  queueId: string | null;
  statusCounts: StatusCounts;
  records: DismissalQueueRecord[];
  isLoading: boolean;
  error?: string;
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

export function FullDismissalQueuePage({ user, onBack }: FullDismissalQueuePageProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeQueueData, setGradeQueueData] = useState<GradeQueueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  
  // Auto-refresh state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Auto-refresh countdown and refresh logic
  useEffect(() => {
    if (autoRefreshEnabled && gradeQueueData.length > 0) {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }

      // Start countdown from 30 seconds
      setCountdown(30);
      
      const newIntervalId = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Time to refresh
            handleRefresh();
            return 30; // Reset  countdown
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
      // Clear interval if auto-refresh is disabled
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setCountdown(30);
    }
  }, [autoRefreshEnabled, gradeQueueData.length]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Load grades and initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load grades
        const gradesResponse = await backend.grades.list();
        setGrades(gradesResponse.grades);
        
        // Initialize grade queue data
        const initialGradeData: GradeQueueData[] = gradesResponse.grades.map(grade => ({
          grade: grade.name,
          building: grade.building,
          queueId: null,
          statusCounts: {
            standby: 0,
            inQueue: 0,
            released: 0,
            collected: 0,
            unknown: 0,
            noShow: 0,
            earlyDismissal: 0,
            directPickup: 0,
            latePickup: 0,
            afterCare: 0,
            total: 0
          },
          records: [],
          isLoading: true
        }));
        
        setGradeQueueData(initialGradeData);
        
        // Load dismissal queue data for all grades
        await loadAllGradeData(gradesResponse.grades);
        
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

  const loadAllGradeData = async (gradesToLoad: Grade[]) => {
    const promises = gradesToLoad.map(grade => loadGradeQueueData(grade.name));
    await Promise.all(promises);
    setLastRefresh(new Date());
  };

  const loadGradeQueueData = async (gradeName: string) => {
    try {
      console.log(`Loading dismissal queue for grade: ${gradeName}`);
      
      const response = await backend.queue.getQueueListByGrade({ grade: gradeName });
      console.log(`Dismissal queue response for ${gradeName}:`, response);
      
      const statusCounts = calculateStatusCounts(response.records);
      
      // Update the specific grade data
      setGradeQueueData(prev => 
        prev.map(gradeData => 
          gradeData.grade === gradeName 
            ? {
                ...gradeData,
                queueId: response.queueId,
                statusCounts,
                records: response.records,
                isLoading: false,
                error: undefined
              }
            : gradeData
        )
      );
      
      // Set current queue ID from the first successful response
      if (response.queueId && !currentQueueId) {
        setCurrentQueueId(response.queueId);
      }
      
    } catch (error) {
      console.error(`Failed to load dismissal queue for grade ${gradeName}:`, error);
      
      // Update the specific grade data with error
      setGradeQueueData(prev => 
        prev.map(gradeData => 
          gradeData.grade === gradeName 
            ? {
                ...gradeData,
                queueId: null,
                statusCounts: {
                  standby: 0,
                  inQueue: 0,
                  released: 0,
                  collected: 0,
                  unknown: 0,
                  noShow: 0,
                  earlyDismissal: 0,
                  directPickup: 0,
                  latePickup: 0,
                  afterCare: 0,
                  total: 0
                },
                records: [],
                isLoading: false,
                error: error instanceof Error ? error.message : "Failed to load data"
              }
            : gradeData
        )
      );
    }
  };

  const calculateStatusCounts = (records: DismissalQueueRecord[]): StatusCounts => {
    const counts = {
      standby: 0,
      inQueue: 0,
      released: 0,
      collected: 0,
      unknown: 0,
      noShow: 0,
      earlyDismissal: 0,
      directPickup: 0,
      latePickup: 0,
      afterCare: 0,
      total: records.length
    };

    records.forEach(record => {
      switch (record.dismissalQueueStatus) {
        case 'Standby':
          counts.standby++;
          break;
        case 'InQueue':
          counts.inQueue++;
          break;
        case 'Released':
          counts.released++;
          break;
        case 'Collected':
          counts.collected++;
          break;
        case 'Unknown':
          counts.unknown++;
          break;
        case 'NoShow':
          counts.noShow++;
          break;
        case 'EarlyDismissal':
          counts.earlyDismissal++;
          break;
        case 'DirectPickup':
          counts.directPickup++;
          break;
        case 'LatePickup':
          counts.latePickup++;
          break;
        case 'AfterCare':
          counts.afterCare++;
          break;
      }
    });

    return counts;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAllGradeData(grades);
      
      // Reset countdown after manual refresh
      if (autoRefreshEnabled) {
        setCountdown(30);
      }
      
      if (!isRefreshing) {
        toast({
          title: "Refreshed",
          description: "Dismissal queue data has been updated for all grades",
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
      case 'Standby':
        return 'bg-yellow-100 text-yellow-800';
      case 'InQueue':
        return 'bg-blue-100 text-blue-800';
      case 'Released':
        return 'bg-green-100 text-green-800';
      case 'Collected':
        return 'bg-gray-100 text-gray-800';
      case 'Unknown':
        return 'bg-red-100 text-red-800';
      case 'NoShow':
        return 'bg-orange-100 text-orange-800';
      case 'EarlyDismissal':
        return 'bg-purple-100 text-purple-800';
      case 'DirectPickup':
        return 'bg-indigo-100 text-indigo-800';
      case 'LatePickup':
        return 'bg-teal-100 text-teal-800';
      case 'AfterCare':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeCount = (count: number) => {
    if (count === 0) return null;
    return (
      <Badge variant="secondary" className="ml-1 text-xs">
        {count}
      </Badge>
    );
  };

  const getTotalCounts = () => {
    return gradeQueueData.reduce((totals, gradeData) => ({
      standby: totals.standby + gradeData.statusCounts.standby,
      inQueue: totals.inQueue + gradeData.statusCounts.inQueue,
      released: totals.released + gradeData.statusCounts.released,
      collected: totals.collected + gradeData.statusCounts.collected,
      unknown: totals.unknown + gradeData.statusCounts.unknown,
      noShow: totals.noShow + gradeData.statusCounts.noShow,
      earlyDismissal: totals.earlyDismissal + gradeData.statusCounts.earlyDismissal,
      directPickup: totals.directPickup + gradeData.statusCounts.directPickup,
      latePickup: totals.latePickup + gradeData.statusCounts.latePickup,
      afterCare: totals.afterCare + gradeData.statusCounts.afterCare,
      total: totals.total + gradeData.statusCounts.total
    }), {
      standby: 0,
      inQueue: 0,
      released: 0,
      collected: 0,
      unknown: 0,
      noShow: 0,
      earlyDismissal: 0,
      directPickup: 0,
      latePickup: 0,
      afterCare: 0,
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
          <h2 className="text-2xl font-bold text-gray-900">Full Dismissal Queue by Grade</h2>
          <p className="text-gray-600">Loading dismissal queue data...</p>
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
      {/* Back Button */}
      <div>
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Full Dismissal Queue by Grade</h2>
          <p className="text-gray-600">
            Complete overview of dismissal queue status across all grades
          </p>
          {currentQueueId && (
            <Badge variant="secondary" className="mt-2">
              Queue: {currentQueueId}
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Queue Overview</span>
          </CardTitle>
          <CardDescription>
            Real-time status of all students across all grades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Last Updated and Auto-refresh controls */}
          <div className="space-y-3">
            {/* Last Updated */}
            {lastRefresh && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              </div>
            )}
            
            {/* Auto-refresh controls */}
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
                
                {autoRefreshEnabled && gradeQueueData.length > 0 && (
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

          {/* School-wide Status Summary */}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div className="text-sm font-medium text-slate-800">Total Students</div>
            <div className="text-2xl font-bold text-slate-900">{totalCounts.total}</div>
          </div>
					
					<div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <div className="text-sm font-medium text-yellow-800">Standby</div>
              <div className="text-lg font-bold text-yellow-900">{totalCounts.standby}</div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-sm font-medium text-blue-800">InQueue</div>
              <div className="text-lg font-bold text-blue-900">{totalCounts.inQueue}</div>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="text-sm font-medium text-green-800">Released</div>
              <div className="text-lg font-bold text-green-900">{totalCounts.released}</div>
            </div>
            
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <div className="text-sm font-medium text-gray-800">Collected</div>
              <div className="text-lg font-bold text-gray-900">{totalCounts.collected}</div>
            </div>
            
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <div className="text-sm font-medium text-red-800">Unknown</div>
              <div className="text-lg font-bold text-red-900">{totalCounts.unknown}</div>
            </div>
            
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <div className="text-sm font-medium text-orange-800">NoShow</div>
              <div className="text-lg font-bold text-orange-900">{totalCounts.noShow}</div>
            </div>
            
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
              <div className="text-sm font-medium text-purple-800">Early</div>
              <div className="text-lg font-bold text-purple-900">{totalCounts.earlyDismissal}</div>
            </div>
            
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
              <div className="text-sm font-medium text-indigo-800">Direct</div>
              <div className="text-lg font-bold text-indigo-900">{totalCounts.directPickup}</div>
            </div>
            
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-center">
              <div className="text-sm font-medium text-teal-800">Late</div>
              <div className="text-lg font-bold text-teal-900">{totalCounts.latePickup}</div>
            </div>
            
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
              <div className="text-sm font-medium text-pink-800">AfterCare</div>
              <div className="text-lg font-bold text-pink-900">{totalCounts.afterCare}</div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Grade-by-Grade Breakdown */}
      <div className="space-y-4">
        {gradeQueueData.map((gradeData) => (
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
                      <Building className="w-3 h-3" />
                      <span>Building {gradeData.building}</span>
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
              
              {/* Status Summary for Grade */}
              <div className="flex flex-wrap gap-2 mt-3">
                {gradeData.statusCounts.standby > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Standby: {gradeData.statusCounts.standby}
                  </Badge>
                )}
                {gradeData.statusCounts.inQueue > 0 && (
                  <Badge className="bg-blue-100 text-blue-800">
                    InQueue: {gradeData.statusCounts.inQueue}
                  </Badge>
                )}
                {gradeData.statusCounts.released > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    Released: {gradeData.statusCounts.released}
                  </Badge>
                )}
                {gradeData.statusCounts.collected > 0 && (
                  <Badge className="bg-gray-100 text-gray-800">
                    Collected: {gradeData.statusCounts.collected}
                  </Badge>
                )}
                {gradeData.statusCounts.unknown > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    Unknown: {gradeData.statusCounts.unknown}
                  </Badge>
                )}
                {gradeData.statusCounts.noShow > 0 && (
                  <Badge className="bg-orange-100 text-orange-800">
                    NoShow: {gradeData.statusCounts.noShow}
                  </Badge>
                )}
                {gradeData.statusCounts.earlyDismissal > 0 && (
                  <Badge className="bg-purple-100 text-purple-800">
                    Early: {gradeData.statusCounts.earlyDismissal}
                  </Badge>
                )}
                {gradeData.statusCounts.directPickup > 0 && (
                  <Badge className="bg-indigo-100 text-indigo-800">
                    Direct: {gradeData.statusCounts.directPickup}
                  </Badge>
                )}
                {gradeData.statusCounts.latePickup > 0 && (
                  <Badge className="bg-teal-100 text-teal-800">
                    Late: {gradeData.statusCounts.latePickup}
                  </Badge>
                )}
                {gradeData.statusCounts.afterCare > 0 && (
                  <Badge className="bg-pink-100 text-pink-800">
                    AfterCare: {gradeData.statusCounts.afterCare}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            {/* Expanded Student List */}
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
                    <p className="text-sm text-gray-600">No students in dismissal queue</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-4 gap-4 p-2 bg-gray-50 rounded text-sm font-medium text-gray-700">
                      <div>Student Name</div>
                      <div>Status</div>
                      <div>Contact</div>
                      <div>Method</div>
                    </div>
                    
                    {/* Student Rows */}
                    {gradeData.records.map((record) => (
                      <div 
                        key={`${record.queueId}-${record.studentId}`}
                        className="grid grid-cols-4 gap-4 p-2 border rounded text-sm hover:bg-gray-50"
                      >
                        <div className="font-medium">
                          {record.studentName || 'Unknown Student'}
                        </div>
                        
                        <div>
                          <Badge className={getStatusColor(record.dismissalQueueStatus)}>
                            {record.dismissalQueueStatus}
                          </Badge>
                        </div>
                        
                        <div className="text-gray-600">
                          <div className="flex items-center space-x-1">
                            {record.parentName || record.alternateName ? (
                              <>
                                <User className="w-3 h-3" />
                                <span>{record.alternateName || record.parentName}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">No contact</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-gray-600">
                          {record.addToQueueMethod}
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

      {/* No Queue Message */}
      {!currentQueueId && !isLoading && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center text-yellow-800">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">No Active Queue</p>
              <p className="text-sm">No dismissal queue is currently active. Please start a queue to view student data.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
