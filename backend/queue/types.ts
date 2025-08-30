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
  status?: string;
  message?: string;
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

export interface DismissalQueueRecord {
  queueId: string;
  classBuilding: string;
  grade?: string;
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

export interface QueueStatusCount {
  dismissalQueueStatus: string;
  count: number;
}

export interface GetQueueCountByGradeResponse {
  grade: string;
  queueId: string | null;
  statusCounts: QueueStatusCount[];
  totalCount: number;
}
