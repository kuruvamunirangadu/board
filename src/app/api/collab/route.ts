import { NextRequest, NextResponse } from 'next/server';
import { collaborationServer } from '@/features/collaboration/collaboration-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list_rooms';
    const roomId = searchParams.get('roomId');
    const participantId = searchParams.get('participantId');
    const lastSequenceNumber = parseInt(searchParams.get('lastSeq') || '0', 10);

    if (action === 'list_rooms') {
      const rooms = collaborationServer.listActiveRooms();
      return NextResponse.json({ success: true, rooms });
    }

    if (action === 'snapshot') {
      if (!roomId) {
        return NextResponse.json({ success: false, error: 'roomId parameter is required' }, { status: 400 });
      }
      const snapshot = collaborationServer.getSnapshot(roomId);
      return NextResponse.json({ success: true, snapshot });
    }

    if (action === 'sync') {
      if (!roomId || !participantId) {
        return NextResponse.json(
          { success: false, error: 'roomId and participantId parameters are required' },
          { status: 400 }
        );
      }
      const syncResult = collaborationServer.syncClient(roomId, participantId, lastSequenceNumber);
      return NextResponse.json({ success: true, sync: syncResult });
    }

    return NextResponse.json({ success: false, error: `Unknown GET action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, actorId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action parameter in request body' }, { status: 400 });
    }

    switch (action) {
      case 'create_room': {
        const { title, hostName, subjectId, activeConceptId, activeConceptTitle, initialSettings } = body;
        const result = collaborationServer.createRoom(title || 'Collaborative Workspace', hostName || 'Instructor', {
          subjectId,
          activeConceptId,
          activeConceptTitle,
          initialSettings,
        });
        const snapshot = collaborationServer.getSnapshot(result.room.id);
        return NextResponse.json({
          success: true,
          room: result.room,
          participant: result.hostParticipant,
          snapshot,
        });
      }

      case 'join_room': {
        const { roomIdentifier, participantName, role } = body;
        if (!roomIdentifier || !participantName) {
          return NextResponse.json(
            { success: false, error: 'roomIdentifier and participantName are required' },
            { status: 400 }
          );
        }
        const result = collaborationServer.joinRoom(roomIdentifier, participantName, role || 'participant');
        return NextResponse.json({
          success: true,
          room: result.room,
          participant: result.participant,
          snapshot: result.snapshot,
        });
      }

      case 'apply_operation': {
        if (!roomId || !actorId || !body.operation) {
          return NextResponse.json(
            { success: false, error: 'roomId, actorId, and operation are required' },
            { status: 400 }
          );
        }
        const appliedOp = collaborationServer.applyOperation(roomId, actorId, body.operation);
        return NextResponse.json({ success: true, operation: appliedOp });
      }

      case 'update_simulation': {
        if (!roomId || !actorId || !body.patch) {
          return NextResponse.json(
            { success: false, error: 'roomId, actorId, and patch are required' },
            { status: 400 }
          );
        }
        const updatedSim = collaborationServer.updateSimulationState(roomId, actorId, body.patch);
        return NextResponse.json({ success: true, simulationState: updatedSim });
      }

      case 'update_settings': {
        if (!roomId || !actorId || !body.settings) {
          return NextResponse.json(
            { success: false, error: 'roomId, actorId, and settings are required' },
            { status: 400 }
          );
        }
        const updatedRoom = collaborationServer.updateRoomSettings(
          roomId,
          actorId,
          body.settings,
          body.conceptBroadcast
        );
        return NextResponse.json({ success: true, room: updatedRoom });
      }

      case 'post_message': {
        if (!roomId || !actorId || !body.text) {
          return NextResponse.json(
            { success: false, error: 'roomId, actorId, and text are required' },
            { status: 400 }
          );
        }
        const message = collaborationServer.postMessage(roomId, actorId, body.text);
        return NextResponse.json({ success: true, message });
      }

      case 'sync': {
        if (!roomId || !actorId) {
          return NextResponse.json({ success: false, error: 'roomId and actorId are required' }, { status: 400 });
        }
        const lastSeq = body.lastSequenceNumber || 0;
        const syncResult = collaborationServer.syncClient(roomId, actorId, lastSeq);
        return NextResponse.json({ success: true, sync: syncResult });
      }

      case 'leave_room': {
        if (roomId && actorId) {
          collaborationServer.leaveRoom(roomId, actorId);
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

