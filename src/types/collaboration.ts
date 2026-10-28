export type ParticipantRole = 'host' | 'instructor' | 'participant' | 'observer';

export interface Participant {
  id: string;
  name: string;
  roomId: string;
  role: ParticipantRole;
  status: 'connected' | 'reconnecting' | 'disconnected';
  joinedAt: number;
  lastActiveAt: number;
  color: string;
}

export interface RoomCollaborationSettings {
  isBoardLocked: boolean;
  isSimulationLocked: boolean;
  allowParticipantChat: boolean;
  instructorDemonstrationMode: boolean;
}

export interface LearningRoom {
  id: string;
  code: string; // e.g. 'VIS-7824'
  title: string;
  hostParticipantId: string;
  subjectId?: string;
  activeConceptId?: string;
  activeConceptTitle?: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'paused' | 'closed';
  settings: RoomCollaborationSettings;
  participants: Participant[];
}

export type SharedOperationType = 
  | 'object_add' 
  | 'object_update' 
  | 'object_move' 
  | 'object_delete' 
  | 'annotation_add' 
  | 'concept_select' 
  | 'highlight_object';

export interface SharedWorkspaceOperation {
  operationId: string;
  roomId: string;
  actorParticipantId: string;
  actorName: string;
  operationType: SharedOperationType;
  targetObjectId?: string;
  payload: any;
  sequenceNumber: number;
  timestamp: number;
}

export interface SharedSimulationState {
  roomId: string;
  simulationType: string;
  parameters: Record<string, number>;
  isRunning: boolean;
  currentTime: number;
  stepIndex: number;
  stateVersion: number;
  updatedAt: number;
  lastActorId: string;
  lastActorName: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: ParticipantRole;
  text: string;
  timestamp: number;
}

export interface RoomSnapshot {
  room: LearningRoom;
  workspaceObjects: any[];
  simulationState: SharedSimulationState;
  recentMessages: RoomMessage[];
  sequenceNumber: number;
}

export interface ClientSyncPayload {
  lastSequenceNumber: number;
  operations: SharedWorkspaceOperation[];
  simulationState?: SharedSimulationState;
  messages: RoomMessage[];
  participants: Participant[];
}

