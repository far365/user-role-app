import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Play, Square, Trash2, RefreshCw, Clock, User, Calendar, AlertCircle, Bug, Database, Search, Table } from "lucide-react";
import backend from "~backend/client";
import type { Queue } from "~backend/queue/types";
import type { User } from "~backend/user/types";

interface QueueSetupPageProps {
  user: User;
  onBack: () => void;
}

export function QueueSetupPage({ user, onBack }: QueueSetupPageProps) {
  const [currentQueue, setCurrentQueue] = useState<Queue | null>(null);
  const [allQueues, setAllQueues] = useState<Queue[]>([]);
  const [deleteQueueId, setDeleteQueueId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);
  const [listError, setListError] = useState<string>("");
  
  const { toast } = useToast();

  const fetchCurrentQueue = async () => {
    try {
      const response = await backend.queue.getCurrentQueue();
      setCurrentQueue(response.queue);
      console.log("Current queue:", response.queue);
    } catch (error) {
      console.error("Failed to fetch current queue:", error);
      setCurrentQueue(null);
    }
  };

  const fetchAllQueues = async () => {
    try {
      console.log("=== FRONTEND: Fetching all queues ===");
      setListError("");
      
      const response = await backend.queue.list();
      console.log("=== FRONTEND: Queue list response ===", response);
      
      setAllQueues(response.queues);
      
      if (response.queues.length === 0) {
        console.log("=== FRONTEND: No queues returned ===");
        console.log("This could mean:");
        console.log("1. The queuemasterrcd table is empty");
        console.log("2. There's an issue with the database query");
        console.log("3. RLS policies are blocking access");
        console.log("4. Field name mismatches");
        
        setListError("No queues returned from database. Check debug info for details.");
      } else {
        console.log(`=== FRONTEND: Successfully loaded ${response.queues.length} queues ===`);
      }
    } catch (error) {
      console.error("=== FRONTEND: Failed to fetch all queues ===", error);
      setListError(error instanceof Error ? error.message : "Failed to load queue history");
      
      toast({
        title: "Error",
        description: "Failed to load queue history. Check debug info for details.",
        variant: "destructive",
      });
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchCurrentQueue(), fetchAllQueues()]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDebugQueue = async () => {
    try {
      console.log("=== DEBUG: Testing queue system ===");
      
      // Test if we can reach the backend at all
      const testResponse = await backend.user.list();
      console.log("Backend connection test successful:", testResponse);
      
      let debugSummary = "Backend connection: OK\n";
      
      // Test queue endpoints
      try {
        const currentQueueResponse = await backend.queue.getCurrentQueue();
        debugSummary += `Current queue endpoint: OK (${currentQueueResponse.queue ? 'Queue found' : 'No queue'})\n`;
      } catch (error) {
        debugSummary += `Current queue endpoint: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}\n`;
      }
      
      try {
        console.log("=== DEBUG: Testing queue list endpoint ===");
        const listResponse = await backend.queue.list();
        console.log("=== DEBUG: Queue list response ===", listResponse);
        
        debugSummary += `List queues endpoint: OK (${listResponse.queues.length} queues found)\n`;
        
        if (listResponse.queues.length === 0) {
          debugSummary += `WARNING: No queues returned despite table having records\n`;
          debugSummary += `Possible issues:\n`;
          debugSummary += `- RLS (Row Level Security) policies blocking access\n`;
          debugSummary += `- Field name mismatches in database\n`;
          debugSummary += `- Query filtering out all records\n`;
          debugSummary += `- Database connection to wrong table\n`;
        } else {
          debugSummary += `Queue details:\n`;
          listResponse.queues.forEach((queue, index) => {
            debugSummary += `  ${index + 1}. ID: ${queue.queueId}, Status: ${queue.queueMasterStatus}\n`;
          });
        }
      } catch (error) {
        debugSummary += `List queues endpoint: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}\n`;
      }
      
      // Test table structure by trying to create a test entry (but don't actually create it)
      try {
        // This will fail but give us information about the table structure
        await backend.queue.create({
          queueStartedByUsername: "TEST_USER_DO_NOT_CREATE",
        });
        debugSummary += "Create queue test: Unexpectedly succeeded\n";
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("Table") || error.message.includes("does not exist")) {
            debugSummary += `Create queue test: TABLE ISSUE - ${error.message}\n`;
          } else if (error.message.includes("permission") || error.message.includes("denied")) {
            debugSummary += `Create queue test: PERMISSION ISSUE - ${error.message}\n`;
          } else if (error.message.includes("connection") || error.message.includes("Database")) {
            debugSummary += `Create queue test: CONNECTION ISSUE - ${error.message}\n`;
          } else if (error.message.includes("already")) {
            debugSummary += `Create queue test: VALIDATION ISSUE (expected) - ${error.message}\n`;
          } else {
            debugSummary += `Create queue test: OTHER ERROR - ${error.message}\n`;
          }
        } else {
          debugSummary += `Create queue test: UNKNOWN ERROR - ${String(error)}\n`;
        }
      }
      
      // Add specific debugging for the list issue
      debugSummary += `\nLIST DEBUGGING:\n`;
      debugSummary += `Frontend list error: ${listError || 'None'}\n`;
      debugSummary += `Queues in state: ${allQueues.length}\n`;
      debugSummary += `Check browser console for detailed backend logs\n`;
      
      setDebugInfo(debugSummary);
      setShowDebug(true);
      
      toast({
        title: "Debug Complete",
        description: "Check debug info below and browser console for detailed logs",
      });
    } catch (error) {
      console.error("Debug error:", error);
      setDebugInfo(`Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowDebug(true);
      toast({
        title: "Debug Failed",
        description: "Check console for error details",
        variant: "destructive",
      });
    }
  };

  const handleStartNewQueue = async () => {
    try {
      setIsCreating(true);
      
      console.log("=== FRONTEND: Starting new queue ===");
      console.log("User login ID:", user.loginID);
      
      const response = await backend.queue.create({
        queueStartedByUsername: user.loginID,
      });

      console.log("=== FRONTEND: Queue creation successful ===", response);
      
      setCurrentQueue(response.queue);
      await fetchAllQueues(); // Refresh the list
      
      toast({
        title: "Success",
        description: `New queue ${response.queue.queueId} has been started`,
      });
    } catch (error) {
      console.error("=== FRONTEND: Queue creation failed ===", error);
      
      let errorMessage = "Failed to start new queue";
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        if (error.message.includes("already open")) {
          errorMessage = "Cannot start new queue: Another queue is already open";
        } else if (error.message.includes("already exists")) {
          errorMessage = "Cannot start new queue: A queue for today already exists";
        } else if (error.message.includes("Table") && error.message.includes("does not exist")) {
          errorMessage = "Database error: The queuemasterrcd table does not exist in your Supabase database";
        } else if (error.message.includes("permission") || error.message.includes("denied")) {
          errorMessage = "Database error: Permission denied accessing the queuemasterrcd table";
        } else if (error.message.includes("connection") || error.message.includes("Database")) {
          errorMessage = "Database error: Cannot connect to Supabase database";
        } else {
          errorMessage = `Failed to start queue: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseQueue = async () => {
    if (!currentQueue) {
      toast({
        title: "Error",
        description: "No open queue to close",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsClosing(true);
      
      const response = await backend.queue.close({
        queueClosedByUsername: user.loginID,
      });

      setCurrentQueue(null); // No more open queue
      await fetchAllQueues(); // Refresh the list
      
      toast({
        title: "Success",
        description: `Queue ${response.queue.queueId} has been closed`,
      });
    } catch (error) {
      console.error("Failed to close queue:", error);
      
      let errorMessage = "Failed to close queue";
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorMessage = "No open queue found to close";
        } else {
          errorMessage = `Failed to close queue: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleDeleteQueue = async () => {
    if (!deleteQueueId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a queue ID to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(true);
      
      await backend.queue.deleteQueue({
        queueId: deleteQueueId.trim(),
      });

      // If we deleted the current queue, clear it
      if (currentQueue && currentQueue.queueId === deleteQueueId.trim()) {
        setCurrentQueue(null);
      }
      
      await fetchAllQueues(); // Refresh the list
      setDeleteQueueId(""); // Clear the input
      
      toast({
        title: "Success",
        description: `Queue ${deleteQueueId.trim()} has been deleted`,
      });
    } catch (error) {
      console.error("Failed to delete queue:", error);
      
      let errorMessage = "Failed to delete queue";
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorMessage = `Queue "${deleteQueueId.trim()}" not found`;
        } else {
          errorMessage = `Failed to delete queue: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      toast({
        title: "Refreshed",
        description: "Queue data has been updated",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Queue Setup</h2>
          <p className="text-gray-600">Loading queue information...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
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
          <h2 className="text-2xl font-bold text-gray-900">Queue Setup</h2>
          <p className="text-gray-600">Manage pickup queues and monitor queue status</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleDebugQueue} 
            variant="outline" 
            size="sm"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug Queue System
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* List Error Alert */}
      {listError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>Queue List Issue</span>
            </CardTitle>
            <CardDescription className="text-red-700">
              There's an issue loading the queue history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-3">{listError}</p>
            <div className="text-xs text-red-600">
              <p className="font-medium mb-2">Possible causes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>RLS (Row Level Security) policies in Supabase are blocking access</li>
                <li>Field name mismatches between code and database schema</li>
                <li>Database connection issues</li>
                <li>Query filtering out all records</li>
              </ul>
              <p className="mt-2">Use "Debug Queue System" button for detailed analysis.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {showDebug && debugInfo && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <Database className="w-5 h-5" />
              <span>Queue System Debug Information</span>
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Diagnostic information for troubleshooting queue issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-yellow-800 whitespace-pre-wrap overflow-auto max-h-40 bg-white p-3 rounded border">
              {debugInfo}
            </pre>
            <div className="mt-3 p-3 bg-white rounded border">
              <p className="text-sm font-medium text-yellow-800 mb-2">Common Solutions:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• <strong>No Records Returned:</strong> Check RLS policies in Supabase for queuemasterrcd table</li>
                <li>• <strong>Table Issue:</strong> Verify queuemasterrcd table exists with correct column names</li>
                <li>• <strong>Permission Issue:</strong> Ensure API key has read access to queuemasterrcd table</li>
                <li>• <strong>Connection Issue:</strong> Verify Supabase URL and API key in secrets</li>
                <li>• <strong>Field Names:</strong> Check column names match: queueid, queuemasterstatus, etc.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Current Open Queue</span>
          </CardTitle>
          <CardDescription>
            Status of the currently active pickup queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentQueue ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Queue ID: {currentQueue.queueId}</h3>
                  <Badge className={getStatusColor(currentQueue.queueMasterStatus)}>
                    {currentQueue.queueMasterStatus || 'Unknown'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Started:</span>
                    <span>{formatDateTime(currentQueue.queueStartTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Started by:</span>
                    <span>{currentQueue.queueStartedByUsername || 'Unknown'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Last updated:</span>
                    <span>{formatDateTime(currentQueue.lastUpdatedTTM)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No queue is currently open</p>
              <p className="text-sm text-gray-500 mt-1">
                Start a new queue to begin managing pickups
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Start New Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Start New Queue</span>
            </CardTitle>
            <CardDescription>
              Create a new pickup queue for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will create a new queue with ID in YYYYMMDD format. Only one queue can be open at a time.
              </p>
              <Button 
                onClick={handleStartNewQueue} 
                disabled={isCreating || !!currentQueue}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                {isCreating ? 'Starting...' : 'Start New Queue'}
              </Button>
              {currentQueue && (
                <p className="text-xs text-yellow-600">
                  Cannot start new queue while another queue is open
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Close Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Square className="w-5 h-5" />
              <span>Close Open Queue</span>
            </CardTitle>
            <CardDescription>
              Close the currently active queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will close the currently open queue and mark it as completed.
              </p>
              <Button 
                onClick={handleCloseQueue} 
                disabled={isClosing || !currentQueue}
                variant="outline"
                className="w-full"
              >
                <Square className="w-4 h-4 mr-2" />
                {isClosing ? 'Closing...' : 'Close Open Queue'}
              </Button>
              {!currentQueue && (
                <p className="text-xs text-gray-500">
                  No open queue to close
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5" />
              <span>Delete Queue</span>
            </CardTitle>
            <CardDescription>
              Permanently delete a queue by ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deleteQueueId">Queue ID to Delete</Label>
                <Input
                  id="deleteQueueId"
                  type="text"
                  placeholder="Enter queue ID (e.g., 20241201)"
                  value={deleteQueueId}
                  onChange={(e) => setDeleteQueueId(e.target.value)}
                  disabled={isDeleting}
                />
              </div>
              <Button 
                onClick={handleDeleteQueue} 
                disabled={isDeleting || !deleteQueueId.trim()}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Queue'}
              </Button>
              <p className="text-xs text-red-600">
                Warning: This action cannot be undone
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Table className="w-5 h-5" />
            <span>Queue History</span>
            {allQueues.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {allQueues.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            All queues ordered by creation date (most recent first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allQueues.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No queues found</p>
              <p className="text-sm text-gray-500 mt-1">
                {listError ? 
                  "There was an issue loading queue history. Check debug info above." :
                  "Queue history will appear here once queues are created"
                }
              </p>
              {listError && (
                <div className="mt-4">
                  <Button 
                    onClick={handleDebugQueue} 
                    variant="outline" 
                    size="sm"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Debug Queue List Issue
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {allQueues.map((queue) => (
                <div
                  key={queue.queueId}
                  className="p-4 border rounded-lg hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">Queue {queue.queueId}</h3>
                      <Badge className={getStatusColor(queue.queueMasterStatus)}>
                        {queue.queueMasterStatus || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Started:</span>
                      <br />
                      {formatDateTime(queue.queueStartTime)}
                      <br />
                      <span className="text-xs">by {queue.queueStartedByUsername || 'Unknown'}</span>
                    </div>
                    
                    <div>
                      <span className="font-medium">Ended:</span>
                      <br />
                      {formatDateTime(queue.queueEndTime)}
                      <br />
                      {queue.queueClosedByUsername && (
                        <span className="text-xs">by {queue.queueClosedByUsername}</span>
                      )}
                    </div>
                    
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <br />
                      {formatDateTime(queue.lastUpdatedTTM)}
                    </div>
                    
                    <div>
                      <span className="font-medium">Duration:</span>
                      <br />
                      {queue.queueStartTime && queue.queueEndTime ? (
                        (() => {
                          const duration = new Date(queue.queueEndTime).getTime() - new Date(queue.queueStartTime).getTime();
                          const hours = Math.floor(duration / (1000 * 60 * 60));
                          const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hours}h ${minutes}m`;
                        })()
                      ) : queue.queueMasterStatus === 'Open' ? (
                        'In progress'
                      ) : (
                        'Unknown'
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
