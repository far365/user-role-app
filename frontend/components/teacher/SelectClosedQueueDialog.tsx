import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import backend from "~backend/client";
import type { Queue } from "~backend/queue/types";

interface SelectClosedQueueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onQueueSelected?: (queueId: string) => void;
}

export function SelectClosedQueueDialog({
  isOpen,
  onClose,
  onQueueSelected
}: SelectClosedQueueDialogProps) {
  const [closedQueues, setClosedQueues] = useState<Queue[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadClosedQueues();
    }
  }, [isOpen]);

  const loadClosedQueues = async () => {
    setIsLoading(true);
    try {
      console.log("Loading closed queues...");
      const response = await backend.queue.list();
      
      // Filter for closed queues only
      const closed = response.queues.filter(queue => queue.queueMasterStatus === "Closed");
      
      console.log(`Found ${closed.length} closed queues out of ${response.queues.length} total queues`);
      setClosedQueues(closed);
      
      // Clear selection when loading new data
      setSelectedQueueId("");
      
    } catch (error) {
      console.error("Failed to load closed queues:", error);
      toast({
        title: "Error",
        description: "Failed to load closed queues",
        variant: "destructive",
      });
      setClosedQueues([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    if (!selectedQueueId) {
      toast({
        title: "No Selection",
        description: "Please select a closed queue to update",
        variant: "destructive",
      });
      return;
    }

    // Call the callback if provided
    if (onQueueSelected) {
      onQueueSelected(selectedQueueId);
    }

    toast({
      title: "Queue Selected",
      description: `Selected queue: ${selectedQueueId}`,
    });

    onClose();
  };

  const handleCancel = () => {
    setSelectedQueueId("");
    onClose();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Closed Queue</DialogTitle>
          <DialogDescription>
            Choose a closed queue to update. Only queues with "Closed" status are shown.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading closed queues...</span>
            </div>
          ) : closedQueues.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>No closed queues found</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Found {closedQueues.length} closed queue{closedQueues.length !== 1 ? 's' : ''}
              </div>
              
              <RadioGroup value={selectedQueueId} onValueChange={setSelectedQueueId}>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {closedQueues.map((queue) => (
                    <div key={queue.queueId} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={queue.queueId} id={queue.queueId} className="mt-1" />
                      <Label htmlFor={queue.queueId} className="flex-1 cursor-pointer">
                        <div className="space-y-1">
                          <div className="font-medium">Queue ID: {queue.queueId}</div>
                          <div className="text-sm text-gray-600">
                            <div>Started: {formatDate(queue.queueStartTime)}</div>
                            <div>Closed: {formatDate(queue.queueEndTime)}</div>
                            <div>Started by: {queue.queueStartedByUsername || "Unknown"}</div>
                            <div>Closed by: {queue.queueClosedByUsername || "Unknown"}</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!selectedQueueId || isLoading}
          >
            Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}