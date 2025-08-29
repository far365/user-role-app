import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Play, Square, Trash2, RefreshCw, Clock, User, Calendar, AlertCircle, Table, CheckCircle, XCircle, Database } from "lucide-react";
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
  const [dismissalQueueStatus, setDismissalQueueStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [closeQueueStatus, setCloseQueueStatus] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  
  const { toast } = useToast();

  const fetchCurrentQueue = async () => {
    try {
      const response = await backend.queue.getCurrentQueue();
      setCurrentQueue(response.queue);
    } catch (error) {
      console.error("Failed to fetch current queue:", error);
      setCurrentQueue(null);
    }
  };

  const fetchAllQueues = async () => {
    try {
      const response = await backend.queue.list();
      setAllQueues(response.queues);
    } catch (error) {
      console.error("Failed to fetch all queues:", error);
      toast({
        title: "Error",
        description: "Failed to load queue history",
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

  const handleStartNewQueue = async () => {
    try {
      setIsCreating(true);
      setDismissalQueueStatus(null);
      setCloseQueueStatus(null);
      
      const response = await backend.queue.create({
        queueStartedByUsername: user.loginID,
      });
      
      setCurrentQueue(response.queue);
      await fetchAllQueues(); // Refresh the list
      
      // Check the backend logs to determine if the Supabase function was successful
      // Since the function result isn't returned in the API response, we'll show a general success message
      // and let the user know to check the dismissal queue
      setDismissalQueueStatus({
        success: true,
        message: "Queue created successfully. Dismissal queue auto-build function has been executed. Check the dismissal queue table to verify student records were populated."
      });
      
      toast({
        title: "Success",
        description: `New queue ${response.queue.queueId} has been started and dismissal queue auto-build function executed`,
      });
    } catch (error) {
      console.error("Queue creation failed:", error);
      
      let errorMessage = "Failed to start new queue";
      if (error instanceof Error) {
        if (error.message.includes("already open")) {
          errorMessage = "Cannot start new queue: Another queue is already open. Please close the open queue first.";
        } else if (error.message.includes("already exists")) {
          if (error.message.includes("must be deleted")) {
            errorMessage = "Cannot start new queue: A queue for today already exists and must be deleted before starting a new one.";
          } else {
            errorMessage = "Cannot start new queue: A queue for today already exists";
          }
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
      
      setDismissalQueueStatus({
        success: false,
        message: errorMessage
      });
      
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
      setCloseQueueStatus(null);
      setDismissalQueueStatus(null);
      
      console.log("[Frontend] Calling close queue with Supabase function");
      const response = await backend.queue.close({
        queueClosedByUsername: user.loginID,
      });

      console.log("[Frontend] Close queue response:", response);

      setCurrentQueue(null); // No more open queue
      await fetchAllQueues(); // Refresh the list
      
      // Show success status with details about the Supabase function
      setCloseQueueStatus({
        success: true,
        message: `Queue ${response.queue.queueId} has been closed successfully using Supabase function.`,
        details: "The close_currently_open_queue() function was executed successfully. All dismissal queue records with 'Standby' status have been updated to 'Unknown'."
      });
      
      toast({
        title: "Success",
        description: `Queue ${response.queue.queueId} has been closed using Supabase function`,
      });
    } catch (error) {
      console.error("Failed to close queue:", error);
      
      let errorMessage = "Failed to close queue";
      let errorDetails = "";
      
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorMessage = "No open queue found to close";
          errorDetails = "The Supabase function could not find an open queue to close.";
        } else if (error.message.includes("User not found")) {
          errorMessage = "User not found in database";
          errorDetails = "Could not find user record to determine userid for the Supabase function.";
        } else {
          errorMessage = `Failed to close queue: ${error.message}`;
          errorDetails = "The Supabase close_currently_open_queue() function encountered an error.";
        }
      }
      
      setCloseQueueStatus({
        success: false,
        message: errorMessage,
        details: errorDetails
      });
      
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

  // Check if we can start a new queue
  const canStartNewQueue = () => {
    // Can't start if there's already an open queue
    if (currentQueue) {
      return false;
    }
    
    // Check if there's already a queue for today (YYYYMMDD format)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayQueueId = `${year}${month}${day}`;
    
    const existingTodayQueue = allQueues.find(queue => queue.queueId === todayQueueId);
    
    return !existingTodayQueue;
  };

  const getStartQueueDisabledReason = () => {
    if (currentQueue) {
      return "Cannot start new queue while another queue is open";
    }
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayQueueId = `${year}${month}${day}`;
    
    const existingTodayQueue = allQueues.find(queue => queue.queueId === todayQueueId);
    
    if (existingTodayQueue) {
      return `A queue for today (${todayQueueId}) already exists and must be deleted first`;
    }
    
    return null;
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
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Dismissal Queue Status */}
      {dismissalQueueStatus && (
        <Card className={dismissalQueueStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${dismissalQueueStatus.success ? "text-green-800" : "text-red-800"}`}>
              {dismissalQueueStatus.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>Dismissal Queue Auto-Build Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${dismissalQueueStatus.success ? "text-green-700" : "text-red-700"}`}>
              {dismissalQueueStatus.message}
            </p>
            {dismissalQueueStatus.success && (
              <p className="text-xs text-green-600 mt-2">
                The Supabase function auto_build_dismissal_queue() has been executed. Check your dismissal queue table to verify that eligible students (Active status, Present attendance) have been added with 'Standby' status.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Close Queue Status */}
      {closeQueueStatus && (
        <Card className={closeQueueStatus.success ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${closeQueueStatus.success ? "text-blue-800" : "text-red-800"}`}>
              {closeQueueStatus.success ? (
                <Database className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>Supabase Queue Close Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${closeQueueStatus.success ? "text-blue-700" : "text-red-700"}`}>
              {closeQueueStatus.message}
            </p>
            {closeQueueStatus.details && (
              <p className={`text-xs mt-2 ${closeQueueStatus.success ? "text-blue-600" : "text-red-600"}`}>
                {closeQueueStatus.details}
              </p>
            )}
            {closeQueueStatus.success && (
              <p className="text-xs text-blue-600 mt-2">
                The Supabase function close_currently_open_queue(userid) was executed successfully. This function handles both closing the queue and updating dismissal queue statuses automatically.
              </p>
            )}
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
              Create a new pickup queue for today and auto-build dismissal queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will create a new queue with ID in YYYYMMDD format and automatically call the Supabase function to populate the dismissal queue with eligible students.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Auto-Build Process:</strong> After queue creation, the system will call SELECT public.auto_build_dismissal_queue() to populate eligible students (Active status, Present attendance) into the dismissal queue with 'Standby' status.
                </p>
              </div>
              <Button 
                onClick={handleStartNewQueue} 
                disabled={isCreating || !canStartNewQueue()}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                {isCreating ? 'Starting & Building Queue...' : 'Start New Queue'}
              </Button>
              {!canStartNewQueue() && (
                <p className="text-xs text-yellow-600">
                  {getStartQueueDisabledReason()}
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
              Close the currently active queue using Supabase function
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will call the Supabase function close_currently_open_queue() to close the queue and update dismissal statuses.
              </p>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-800">
                  <strong>Supabase Function:</strong> Calls close_currently_open_queue(userid) which automatically closes the queue and updates all 'Standby' dismissal records to 'Unknown' status.
                </p>
              </div>
              <Button 
                onClick={handleCloseQueue} 
                disabled={isClosing || !currentQueue}
                variant="outline"
                className="w-full"
              >
                <Square className="w-4 h-4 mr-2" />
                {isClosing ? 'Closing with Supabase...' : 'Close Open Queue'}
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
                Queue history will appear here once queues are created
              </p>
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
