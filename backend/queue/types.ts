export type QueueStatus = "Open" | "Closed";

export interface Queue {
  queueId: string;
  queueStartTime: Date | null;
  queueStartedByUsername: string | null;
  queueEndTime: Date | null;
  queueClosedByUsername: string | null;
  queueMasterStatus: QueueStatus | null;
  lastUpdatedTTM: Date | null;
  archivedDTTM: Date | null;
}

export interface CreateQueueRequest {
  queueStartedByUsername: string;
}

export interface CreateQueueResponse {
  queue: Queue;
}

export interface GetCurrentQueueResponse {
  queue: Queue | null;
}

export interface CloseQueueRequest {
  queueClosedByUsername: string;
}

export interface CloseQueueResponse {
  queue: Queue;
}

export interface DeleteQueueRequest {
  queueId: string;
}

export interface DeleteQueueResponse {
  success: boolean;
}

export interface ListQueuesResponse {
  queues: Queue[];
}
