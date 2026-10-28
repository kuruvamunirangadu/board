import {
  LearningRoom,
  Participant,
  ParticipantRole,
  RoomCollaborationSettings,
  RoomMessage,
  RoomSnapshot,
  SharedSimulationState,
  SharedWorkspaceOperation,
} from '@/types/collaboration';

interface InternalRoomData {
  room: LearningRoom;
  workspaceObjects: any[];
  simulationState: SharedSimulationState;
  operations: SharedWorkspaceOperation[];
  messages: RoomMessage[];
  sequenceCounter: number;
  seenOperationIds: Set<string>;
}

// Global server-side room registry (authoritative)
class CollaborationServerStore {
  private rooms: Map<string, InternalRoomData> = new Map();
  private codeToRoomId: Map<string, string> = new Map();

  constructor() {
    this.seedDemoRoom();
  }

  private seedDemoRoom() {
    const demoRoomId = 'room-visios-demo';
    const demoCode = 'VIS-1010';
    const initialTime = Date.now();

    const host: Participant = {
      id: 'part-prof-ada',
      name: 'Prof. Ada Lovelace',
      roomId: demoRoomId,
      role: 'instructor',
      status: 'connected',
      joinedAt: initialTime - 60000,
      lastActiveAt: initialTime,
      color: '#06b6d4',
    };

    const student: Participant = {
      id: 'part-student-kai',
      name: 'Kai (Student)',
      roomId: demoRoomId,
      role: 'participant',
      status: 'connected',
      joinedAt: initialTime - 30000,
      lastActiveAt: initialTime,
      color: '#a855f7',
    };

    const room: LearningRoom = {
      id: demoRoomId,
      code: demoCode,
      title: 'Physics Lab: Nonlinear Pendulum & Phase Space',
      hostParticipantId: host.id,
      subjectId: 'physics',
      activeConceptId: 'pendulum-nonlinear',
      activeConceptTitle: 'Nonlinear Pendulum & Phase Space',
      createdAt: initialTime - 60000,
      updatedAt: initialTime,
      status: 'active',
      settings: {
        isBoardLocked: false,
        isSimulationLocked: false,
        allowParticipantChat: true,
        instructorDemonstrationMode: false,
      },
      participants: [host, student],
    };

    const initialObjects = [
      {
        id: 'obj-intro-note',
        type: 'text',
        text: 'Welcome to Collaborative Physics Lab!\nToday we explore nonlinear damping and resonance.',
        x: 100,
        y: 80,
        color: '#38bdf8',
        fontSize: 18,
      },
      {
        id: 'obj-sim-box',
        type: 'simulation',
        simulationType: 'pendulum',
        parameters: { length: 2.0, gravity: 9.81, damping: 0.05, mass: 1.0 },
        x: 450,
        y: 80,
      },
    ];

    const simulationState: SharedSimulationState = {
      roomId: demoRoomId,
      simulationType: 'pendulum',
      parameters: { length: 2.0, gravity: 9.81, damping: 0.05, mass: 1.0, initialAngle: 0.785 },
      isRunning: true,
      currentTime: 1.45,
      stepIndex: 87,
      stateVersion: 1,
      updatedAt: initialTime,
      lastActorId: host.id,
      lastActorName: host.name,
    };

    const initialMessages: RoomMessage[] = [
      {
        id: 'msg-seed-1',
        roomId: demoRoomId,
        senderId: host.id,
        senderName: host.name,
        senderRole: 'instructor',
        text: 'Class is starting. Please observe the real-time symplectic pendulum simulation.',
        timestamp: initialTime - 50000,
      },
      {
        id: 'msg-seed-2',
        roomId: demoRoomId,
        senderId: student.id,
        senderName: student.name,
        senderRole: 'participant',
        text: 'Connected! What happens when damping is set to 0?',
        timestamp: initialTime - 20000,
      },
    ];

    this.rooms.set(demoRoomId, {
      room,
      workspaceObjects: initialObjects,
      simulationState,
      operations: [],
      messages: initialMessages,
      sequenceCounter: 2,
      seenOperationIds: new Set(['seed-1', 'seed-2']),
    });

    this.codeToRoomId.set(demoCode, demoRoomId);
  }

  private generateCode(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `VIS-${num}`;
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  // Helper to pick participant color
  private getParticipantColor(index: number): string {
    const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];
    return colors[index % colors.length];
  }

  /**
   * Create a new room
   */
  public createRoom(
    title: string,
    hostName: string,
    options?: {
      subjectId?: string;
      activeConceptId?: string;
      activeConceptTitle?: string;
      initialSettings?: Partial<RoomCollaborationSettings>;
    }
  ): { room: LearningRoom; hostParticipant: Participant } {
    const roomId = this.generateId('room');
    let code = this.generateCode();
    while (this.codeToRoomId.has(code)) {
      code = this.generateCode();
    }

    const hostId = this.generateId('part');
    const now = Date.now();

    const host: Participant = {
      id: hostId,
      name: hostName.trim() || 'Host Instructor',
      roomId,
      role: 'host',
      status: 'connected',
      joinedAt: now,
      lastActiveAt: now,
      color: this.getParticipantColor(0),
    };

    const settings: RoomCollaborationSettings = {
      isBoardLocked: options?.initialSettings?.isBoardLocked ?? false,
      isSimulationLocked: options?.initialSettings?.isSimulationLocked ?? false,
      allowParticipantChat: options?.initialSettings?.allowParticipantChat ?? true,
      instructorDemonstrationMode: options?.initialSettings?.instructorDemonstrationMode ?? false,
    };

    const room: LearningRoom = {
      id: roomId,
      code,
      title: title.trim() || 'Collaborative Workspace',
      hostParticipantId: hostId,
      subjectId: options?.subjectId || 'physics',
      activeConceptId: options?.activeConceptId || 'pendulum-motion',
      activeConceptTitle: options?.activeConceptTitle || 'Oscillations & Periodic Motion',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      settings,
      participants: [host],
    };

    const initialObjects = [
      {
        id: this.generateId('obj'),
        type: 'text',
        text: `Room: ${room.title}\nHost: ${host.name}`,
        x: 100,
        y: 100,
        color: '#06b6d4',
        fontSize: 16,
      },
    ];

    const simulationState: SharedSimulationState = {
      roomId,
      simulationType: 'pendulum',
      parameters: { length: 2.0, gravity: 9.81, damping: 0.05, mass: 1.0, initialAngle: 0.785 },
      isRunning: false,
      currentTime: 0,
      stepIndex: 0,
      stateVersion: 1,
      updatedAt: now,
      lastActorId: hostId,
      lastActorName: host.name,
    };

    const initialMessage: RoomMessage = {
      id: this.generateId('msg'),
      roomId,
      senderId: hostId,
      senderName: host.name,
      senderRole: 'host',
      text: `Room ${code} created. Share the code to invite students.`,
      timestamp: now,
    };

    this.rooms.set(roomId, {
      room,
      workspaceObjects: initialObjects,
      simulationState,
      operations: [],
      messages: [initialMessage],
      sequenceCounter: 0,
      seenOperationIds: new Set(),
    });

    this.codeToRoomId.set(code, roomId);

    return { room, hostParticipant: host };
  }

  /**
   * Join an existing room by ID or Code
   */
  public joinRoom(
    roomIdentifier: string,
    participantName: string,
    role: ParticipantRole = 'participant'
  ): { room: LearningRoom; participant: Participant; snapshot: RoomSnapshot } {
    let roomId = roomIdentifier;
    if (this.codeToRoomId.has(roomIdentifier.toUpperCase().trim())) {
      roomId = this.codeToRoomId.get(roomIdentifier.toUpperCase().trim())!;
    }

    const roomData = this.rooms.get(roomId);
    if (!roomData) {
      throw new Error(`Room with code or ID "${roomIdentifier}" not found.`);
    }

    if (roomData.room.status === 'closed') {
      throw new Error('This room has been closed by the host.');
    }

    const now = Date.now();
    const cleanName = participantName.trim() || 'Learner';

    // Check if participant already exists in room with same name/id
    let participant = roomData.room.participants.find(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (participant) {
      participant.status = 'connected';
      participant.lastActiveAt = now;
    } else {
      participant = {
        id: this.generateId('part'),
        name: cleanName,
        roomId,
        role,
        status: 'connected',
        joinedAt: now,
        lastActiveAt: now,
        color: this.getParticipantColor(roomData.room.participants.length),
      };
      roomData.room.participants.push(participant);
    }

    roomData.room.updatedAt = now;

    // Post join system message
    const joinMsg: RoomMessage = {
      id: this.generateId('msg'),
      roomId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'host',
      text: `${participant.name} joined the room.`,
      timestamp: now,
    };
    roomData.messages.push(joinMsg);

    return {
      room: roomData.room,
      participant,
      snapshot: this.getSnapshot(roomId),
    };
  }

  /**
   * Get full room snapshot
   */
  public getSnapshot(roomId: string): RoomSnapshot {
    const roomData = this.rooms.get(roomId);
    if (!roomData) {
      throw new Error(`Room ${roomId} not found.`);
    }

    return {
      room: JSON.parse(JSON.stringify(roomData.room)),
      workspaceObjects: JSON.parse(JSON.stringify(roomData.workspaceObjects)),
      simulationState: JSON.parse(JSON.stringify(roomData.simulationState)),
      recentMessages: JSON.parse(JSON.stringify(roomData.messages.slice(-50))),
      sequenceNumber: roomData.sequenceCounter,
    };
  }

  /**
   * Apply a shared workspace operation
   */
  public applyOperation(
    roomId: string,
    actorId: string,
    operation: Omit<SharedWorkspaceOperation, 'sequenceNumber' | 'timestamp' | 'roomId'>
  ): SharedWorkspaceOperation {
    const roomData = this.rooms.get(roomId);
    if (!roomData) throw new Error(`Room ${roomId} not found.`);

    const actor = roomData.room.participants.find((p) => p.id === actorId);
    if (!actor) throw new Error(`Participant ${actorId} not found in room.`);

    // Check Board Lock permission
    if (
      roomData.room.settings.isBoardLocked &&
      actor.role !== 'host' &&
      actor.role !== 'instructor'
    ) {
      throw new Error('Workspace is currently locked by the instructor.');
    }

    // Deduplication
    if (operation.operationId && roomData.seenOperationIds.has(operation.operationId)) {
      const existing = roomData.operations.find((o) => o.operationId === operation.operationId);
      if (existing) return existing;
    }

    const now = Date.now();
    roomData.sequenceCounter += 1;

    const fullOp: SharedWorkspaceOperation = {
      ...operation,
      roomId,
      sequenceNumber: roomData.sequenceCounter,
      timestamp: now,
    };

    if (operation.operationId) {
      roomData.seenOperationIds.add(operation.operationId);
    }

    // Apply mutation to in-memory workspaceObjects
    switch (fullOp.operationType) {
      case 'object_add': {
        if (fullOp.payload?.object) {
          const existingIdx = roomData.workspaceObjects.findIndex(
            (o) => o.id === fullOp.payload.object.id
          );
          if (existingIdx >= 0) {
            roomData.workspaceObjects[existingIdx] = fullOp.payload.object;
          } else {
            roomData.workspaceObjects.push(fullOp.payload.object);
          }
        }
        break;
      }
      case 'object_update':
      case 'object_move': {
        if (fullOp.targetObjectId) {
          const obj = roomData.workspaceObjects.find((o) => o.id === fullOp.targetObjectId);
          if (obj && fullOp.payload) {
            Object.assign(obj, fullOp.payload);
          }
        }
        break;
      }
      case 'object_delete': {
        if (fullOp.targetObjectId) {
          roomData.workspaceObjects = roomData.workspaceObjects.filter(
            (o) => o.id !== fullOp.targetObjectId
          );
        }
        break;
      }
      case 'concept_select': {
        if (fullOp.payload?.conceptId) {
          roomData.room.activeConceptId = fullOp.payload.conceptId;
          roomData.room.activeConceptTitle =
            fullOp.payload.conceptTitle || roomData.room.activeConceptTitle;
        }
        break;
      }
      case 'annotation_add':
      case 'highlight_object': {
        // Broadcast-only operation or add annotation object
        if (fullOp.payload?.annotation) {
          roomData.workspaceObjects.push(fullOp.payload.annotation);
        }
        break;
      }
    }

    roomData.operations.push(fullOp);
    roomData.room.updatedAt = now;
    actor.lastActiveAt = now;

    return fullOp;
  }

  /**
   * Update synchronized simulation state
   */
  public updateSimulationState(
    roomId: string,
    actorId: string,
    patch: Partial<SharedSimulationState>
  ): SharedSimulationState {
    const roomData = this.rooms.get(roomId);
    if (!roomData) throw new Error(`Room ${roomId} not found.`);

    const actor = roomData.room.participants.find((p) => p.id === actorId);
    if (!actor) throw new Error(`Participant ${actorId} not found in room.`);

    // Check Simulation Lock permission
    if (
      roomData.room.settings.isSimulationLocked &&
      actor.role !== 'host' &&
      actor.role !== 'instructor'
    ) {
      throw new Error('Simulation controls are currently locked by the instructor.');
    }

    const now = Date.now();
    const updatedParameters = {
      ...roomData.simulationState.parameters,
      ...(patch.parameters || {}),
    };

    roomData.simulationState = {
      ...roomData.simulationState,
      ...patch,
      parameters: updatedParameters,
      stateVersion: roomData.simulationState.stateVersion + 1,
      updatedAt: now,
      lastActorId: actor.id,
      lastActorName: actor.name,
    };

    roomData.room.updatedAt = now;
    actor.lastActiveAt = now;

    return JSON.parse(JSON.stringify(roomData.simulationState));
  }

  /**
   * Update room settings & demonstration mode (Host/Instructor only)
   */
  public updateRoomSettings(
    roomId: string,
    actorId: string,
    settingsPatch: Partial<RoomCollaborationSettings>,
    conceptBroadcast?: { conceptId: string; conceptTitle: string }
  ): LearningRoom {
    const roomData = this.rooms.get(roomId);
    if (!roomData) throw new Error(`Room ${roomId} not found.`);

    const actor = roomData.room.participants.find((p) => p.id === actorId);
    if (!actor) throw new Error(`Participant ${actorId} not found in room.`);

    if (actor.role !== 'host' && actor.role !== 'instructor') {
      throw new Error('Only the room host or instructor can change room settings.');
    }

    const now = Date.now();
    roomData.room.settings = {
      ...roomData.room.settings,
      ...settingsPatch,
    };

    if (conceptBroadcast) {
      roomData.room.activeConceptId = conceptBroadcast.conceptId;
      roomData.room.activeConceptTitle = conceptBroadcast.conceptTitle;
    }

    roomData.room.updatedAt = now;
    actor.lastActiveAt = now;

    return JSON.parse(JSON.stringify(roomData.room));
  }

  /**
   * Post a chat message in the room
   */
  public postMessage(
    roomId: string,
    actorId: string,
    text: string
  ): RoomMessage {
    const roomData = this.rooms.get(roomId);
    if (!roomData) throw new Error(`Room ${roomId} not found.`);

    const actor = roomData.room.participants.find((p) => p.id === actorId);
    if (!actor) throw new Error(`Participant ${actorId} not found in room.`);

    if (
      !roomData.room.settings.allowParticipantChat &&
      actor.role !== 'host' &&
      actor.role !== 'instructor'
    ) {
      throw new Error('Chat is currently disabled for participants by the instructor.');
    }

    const cleanText = text.trim();
    if (!cleanText) throw new Error('Message text cannot be empty.');

    const now = Date.now();
    const msg: RoomMessage = {
      id: this.generateId('msg'),
      roomId,
      senderId: actor.id,
      senderName: actor.name,
      senderRole: actor.role,
      text: cleanText,
      timestamp: now,
    };

    roomData.messages.push(msg);
    actor.lastActiveAt = now;

    return msg;
  }

  /**
   * Sync updates for a client polling or reconnecting
   */
  public syncClient(
    roomId: string,
    actorId: string,
    lastSequenceNumber: number
  ): {
    operations: SharedWorkspaceOperation[];
    simulationState: SharedSimulationState;
    messages: RoomMessage[];
    participants: Participant[];
    room: LearningRoom;
    latestSequenceNumber: number;
  } {
    const roomData = this.rooms.get(roomId);
    if (!roomData) throw new Error(`Room ${roomId} not found.`);

    const actor = roomData.room.participants.find((p) => p.id === actorId);
    if (actor) {
      actor.lastActiveAt = Date.now();
      actor.status = 'connected';
    }

    const newOperations = roomData.operations.filter(
      (op) => op.sequenceNumber > lastSequenceNumber
    );

    return {
      operations: newOperations,
      simulationState: JSON.parse(JSON.stringify(roomData.simulationState)),
      messages: JSON.parse(JSON.stringify(roomData.messages.slice(-50))),
      participants: JSON.parse(JSON.stringify(roomData.room.participants)),
      room: JSON.parse(JSON.stringify(roomData.room)),
      latestSequenceNumber: roomData.sequenceCounter,
    };
  }

  /**
   * Leave room or mark disconnected
   */
  public leaveRoom(roomId: string, actorId: string): void {
    const roomData = this.rooms.get(roomId);
    if (!roomData) return;

    const actor = roomData.room.participants.find((p) => p.id === actorId);
    if (actor) {
      actor.status = 'disconnected';
      actor.lastActiveAt = Date.now();
    }
  }

  /**
   * List all active rooms (for discovery / debug)
   */
  public listActiveRooms(): LearningRoom[] {
    return Array.from(this.rooms.values()).map((r) => JSON.parse(JSON.stringify(r.room)));
  }
}

// Export singleton instance
export const collaborationServer = new CollaborationServerStore();

