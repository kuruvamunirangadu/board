import {
  LearningRoom,
  Participant,
  ParticipantRole,
  RoomCollaborationSettings,
  RoomMessage,
  RoomSnapshot,
  SharedSimulationState,
  SharedWorkspaceOperation,
  SharedOperationType,
} from '@/types/collaboration';

export type CollabEventCallback<T> = (data: T) => void;

export class CollaborationClient {
  private currentRoom: LearningRoom | null = null;
  private currentParticipant: Participant | null = null;
  private currentSimulationState: SharedSimulationState | null = null;
  private workspaceObjects: any[] = [];
  private messages: RoomMessage[] = [];
  private lastSequenceNumber = 0;
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private isConnected = false;

  // Event Listeners
  private roomListeners: Set<CollabEventCallback<LearningRoom>> = new Set();
  private participantsListeners: Set<CollabEventCallback<Participant[]>> = new Set();
  private simulationListeners: Set<CollabEventCallback<SharedSimulationState>> = new Set();
  private operationListeners: Set<CollabEventCallback<SharedWorkspaceOperation>> = new Set();
  private messageListeners: Set<CollabEventCallback<RoomMessage>> = new Set();
  private errorListeners: Set<CollabEventCallback<string>> = new Set();
  private statusListeners: Set<CollabEventCallback<boolean>> = new Set();

  public getRoom(): LearningRoom | null {
    return this.currentRoom;
  }

  public getParticipant(): Participant | null {
    return this.currentParticipant;
  }

  public getSimulationState(): SharedSimulationState | null {
    return this.currentSimulationState;
  }

  public getWorkspaceObjects(): any[] {
    return this.workspaceObjects;
  }

  public getMessages(): RoomMessage[] {
    return this.messages;
  }

  public isHostOrInstructor(): boolean {
    if (!this.currentParticipant) return false;
    return this.currentParticipant.role === 'host' || this.currentParticipant.role === 'instructor';
  }

  // Subscription methods
  public onRoomChange(cb: CollabEventCallback<LearningRoom>): () => void {
    this.roomListeners.add(cb);
    return () => this.roomListeners.delete(cb);
  }

  public onParticipantsChange(cb: CollabEventCallback<Participant[]>): () => void {
    this.participantsListeners.add(cb);
    return () => this.participantsListeners.delete(cb);
  }

  public onSimulationStateChange(cb: CollabEventCallback<SharedSimulationState>): () => void {
    this.simulationListeners.add(cb);
    return () => this.simulationListeners.delete(cb);
  }

  public onOperation(cb: CollabEventCallback<SharedWorkspaceOperation>): () => void {
    this.operationListeners.add(cb);
    return () => this.operationListeners.delete(cb);
  }

  public onMessage(cb: CollabEventCallback<RoomMessage>): () => void {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  public onError(cb: CollabEventCallback<string>): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  public onStatusChange(cb: CollabEventCallback<boolean>): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private notifyError(message: string) {
    this.errorListeners.forEach((cb) => cb(message));
  }

  private setConnectionStatus(connected: boolean) {
    this.isConnected = connected;
    this.statusListeners.forEach((cb) => cb(connected));
  }

  /**
   * Create a new room as host
   */
  public async createRoom(
    title: string,
    hostName: string,
    options?: {
      subjectId?: string;
      activeConceptId?: string;
      activeConceptTitle?: string;
      initialSettings?: Partial<RoomCollaborationSettings>;
    }
  ): Promise<{ room: LearningRoom; participant: Participant }> {
    try {
      const response = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_room',
          title,
          hostName,
          ...options,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create room');
      }

      this.currentRoom = data.room;
      this.currentParticipant = data.participant;
      this.hydrateSnapshot(data.snapshot);
      this.setConnectionStatus(true);
      this.startPolling();

      return { room: data.room, participant: data.participant };
    } catch (err: any) {
      this.notifyError(err.message || 'Failed to create room');
      throw err;
    }
  }

  /**
   * Join an existing room
   */
  public async joinRoom(
    roomIdentifier: string,
    participantName: string,
    role: ParticipantRole = 'participant'
  ): Promise<{ room: LearningRoom; participant: Participant }> {
    try {
      const response = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_room',
          roomIdentifier,
          participantName,
          role,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to join room');
      }

      this.currentRoom = data.room;
      this.currentParticipant = data.participant;
      this.hydrateSnapshot(data.snapshot);
      this.setConnectionStatus(true);
      this.startPolling();

      return { room: data.room, participant: data.participant };
    } catch (err: any) {
      this.notifyError(err.message || 'Failed to join room');
      throw err;
    }
  }

  /**
   * Leave current room
   */
  public async leaveRoom(): Promise<void> {
    this.stopPolling();
    if (this.currentRoom && this.currentParticipant) {
      try {
        await fetch('/api/collab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave_room',
            roomId: this.currentRoom.id,
            actorId: this.currentParticipant.id,
          }),
        });
      } catch (e) {
        // ignore network error on leaving
      }
    }
    this.currentRoom = null;
    this.currentParticipant = null;
    this.currentSimulationState = null;
    this.workspaceObjects = [];
    this.messages = [];
    this.lastSequenceNumber = 0;
    this.setConnectionStatus(false);
  }

  /**
   * Hydrate full snapshot
   */
  public hydrateSnapshot(snapshot: RoomSnapshot) {
    this.currentRoom = snapshot.room;
    this.workspaceObjects = snapshot.workspaceObjects || [];
    this.currentSimulationState = snapshot.simulationState;
    this.messages = snapshot.recentMessages || [];
    this.lastSequenceNumber = snapshot.sequenceNumber;

    this.roomListeners.forEach((cb) => cb(this.currentRoom!));
    this.participantsListeners.forEach((cb) => cb(this.currentRoom!.participants));
    if (this.currentSimulationState) {
      this.simulationListeners.forEach((cb) => cb(this.currentSimulationState!));
    }
  }

  /**
   * Send a shared workspace operation
   */
  public async sendOperation(
    operationType: SharedOperationType,
    payload: any,
    targetObjectId?: string
  ): Promise<SharedWorkspaceOperation | null> {
    if (!this.currentRoom || !this.currentParticipant) {
      this.notifyError('Not connected to a room');
      return null;
    }

    try {
      const operationId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const opPayload = {
        operationId,
        actorParticipantId: this.currentParticipant.id,
        actorName: this.currentParticipant.name,
        operationType,
        targetObjectId,
        payload,
      };

      const res = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_operation',
          roomId: this.currentRoom.id,
          actorId: this.currentParticipant.id,
          operation: opPayload,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to apply operation');
      }

      this.lastSequenceNumber = data.operation.sequenceNumber;
      this.applyLocalOperation(data.operation);
      return data.operation;
    } catch (err: any) {
      this.notifyError(err.message || 'Operation failed');
      return null;
    }
  }

  /**
   * Update synchronized simulation state
   */
  public async updateSimulation(
    patch: Partial<SharedSimulationState>
  ): Promise<SharedSimulationState | null> {
    if (!this.currentRoom || !this.currentParticipant) {
      this.notifyError('Not connected to a room');
      return null;
    }

    try {
      const res = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_simulation',
          roomId: this.currentRoom.id,
          actorId: this.currentParticipant.id,
          patch,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update simulation');
      }

      this.currentSimulationState = data.simulationState;
      this.simulationListeners.forEach((cb) => cb(this.currentSimulationState!));
      return data.simulationState;
    } catch (err: any) {
      this.notifyError(err.message || 'Simulation update failed');
      return null;
    }
  }

  /**
   * Update room settings & demonstration mode (Host/Instructor only)
   */
  public async updateSettings(
    settings: Partial<RoomCollaborationSettings>,
    conceptBroadcast?: { conceptId: string; conceptTitle: string }
  ): Promise<LearningRoom | null> {
    if (!this.currentRoom || !this.currentParticipant) {
      this.notifyError('Not connected to a room');
      return null;
    }

    try {
      const res = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          roomId: this.currentRoom.id,
          actorId: this.currentParticipant.id,
          settings,
          conceptBroadcast,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }

      this.currentRoom = data.room;
      this.roomListeners.forEach((cb) => cb(this.currentRoom!));
      return data.room;
    } catch (err: any) {
      this.notifyError(err.message || 'Settings update failed');
      return null;
    }
  }

  /**
   * Post chat message
   */
  public async sendMessage(text: string): Promise<RoomMessage | null> {
    if (!this.currentRoom || !this.currentParticipant) {
      this.notifyError('Not connected to a room');
      return null;
    }

    try {
      const res = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'post_message',
          roomId: this.currentRoom.id,
          actorId: this.currentParticipant.id,
          text,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      this.messages.push(data.message);
      this.messageListeners.forEach((cb) => cb(data.message));
      return data.message;
    } catch (err: any) {
      this.notifyError(err.message || 'Message send failed');
      return null;
    }
  }

  /**
   * Start periodic background sync polling (1000ms)
   */
  public startPolling(intervalMs = 1200) {
    this.stopPolling();
    this.pollIntervalTimer = setInterval(() => {
      this.pollSync();
    }, intervalMs);
  }

  public stopPolling() {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
  }

  /**
   * Sync check against server
   */
  public async pollSync(): Promise<void> {
    if (this.isPolling || !this.currentRoom || !this.currentParticipant) return;
    this.isPolling = true;

    try {
      const res = await fetch(
        `/api/collab?action=sync&roomId=${this.currentRoom.id}&participantId=${this.currentParticipant.id}&lastSeq=${this.lastSequenceNumber}`
      );
      const data = await res.json();

      if (data.success && data.sync) {
        const sync = data.sync;

        // Process new operations
        if (sync.operations && sync.operations.length > 0) {
          for (const op of sync.operations) {
            this.applyLocalOperation(op);
            this.operationListeners.forEach((cb) => cb(op));
          }
          this.lastSequenceNumber = sync.latestSequenceNumber;
        }

        // Update simulation if newer
        if (
          sync.simulationState &&
          (!this.currentSimulationState ||
            sync.simulationState.stateVersion > this.currentSimulationState.stateVersion)
        ) {
          this.currentSimulationState = sync.simulationState;
          this.simulationListeners.forEach((cb) => cb(this.currentSimulationState!));
        }

        // Update participants & room settings
        if (sync.participants) {
          this.currentRoom.participants = sync.participants;
          this.participantsListeners.forEach((cb) => cb(sync.participants));
        }
        if (sync.room) {
          this.currentRoom = sync.room;
          this.roomListeners.forEach((cb) => cb(this.currentRoom!));
        }

        // Update messages
        if (sync.messages && sync.messages.length > this.messages.length) {
          this.messages = sync.messages;
          if (sync.messages.length > 0) {
            const latest = sync.messages[sync.messages.length - 1];
            this.messageListeners.forEach((cb) => cb(latest));
          }
        }
      }
    } catch (e) {
      // transient network glitch
    } finally {
      this.isPolling = false;
    }
  }

  private applyLocalOperation(op: SharedWorkspaceOperation) {
    switch (op.operationType) {
      case 'object_add': {
        if (op.payload?.object) {
          const idx = this.workspaceObjects.findIndex((o) => o.id === op.payload.object.id);
          if (idx >= 0) {
            this.workspaceObjects[idx] = op.payload.object;
          } else {
            this.workspaceObjects.push(op.payload.object);
          }
        }
        break;
      }
      case 'object_update':
      case 'object_move': {
        if (op.targetObjectId) {
          const obj = this.workspaceObjects.find((o) => o.id === op.targetObjectId);
          if (obj && op.payload) {
            Object.assign(obj, op.payload);
          }
        }
        break;
      }
      case 'object_delete': {
        if (op.targetObjectId) {
          this.workspaceObjects = this.workspaceObjects.filter((o) => o.id !== op.targetObjectId);
        }
        break;
      }
      case 'concept_select': {
        if (this.currentRoom && op.payload?.conceptId) {
          this.currentRoom.activeConceptId = op.payload.conceptId;
          this.currentRoom.activeConceptTitle =
            op.payload.conceptTitle || this.currentRoom.activeConceptTitle;
          this.roomListeners.forEach((cb) => cb(this.currentRoom!));
        }
        break;
      }
    }
  }
}

// Global client singleton
export const collabClient = new CollaborationClient();

