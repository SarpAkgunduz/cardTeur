import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import Crew from '../models/Crew';
import Player from '../models/Player';
import User from '../models/User';

const router = Router();
router.use(requireAuth);

// GET /api/crews — list owned crews + crews the user has been added to
router.get('/', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const linkedPlayers = await Player.find({ linkedUserId: uid }).select('_id').lean();
    const linkedPlayerIds = linkedPlayers.map(p => String(p._id));
    const crews = await Crew.find({
      $or: [
        { ownerUid: uid },
        { memberUids: uid },
        { editorUids: uid },
        { playerIds: { $in: linkedPlayerIds } },
      ],
    }).sort({ createdAt: 1 });

    const visiblePlayerIds = [...new Set(crews.flatMap(crew => crew.playerIds))];
    const visiblePlayers = visiblePlayerIds.length > 0
      ? await Player.find({ _id: { $in: visiblePlayerIds } }).lean()
      : [];
    const linkedUids = [...new Set(visiblePlayers.map(player => player.linkedUserId).filter(Boolean) as string[])];
    const linkedUsers = linkedUids.length > 0
      ? await User.find({ uid: { $in: linkedUids } }).select('uid photoURL').lean()
      : [];
    const photoByUid = new Map(linkedUsers.map(user => [user.uid, user.photoURL]));
    const playersById = new Map(visiblePlayers.map(player => [
      String(player._id),
      {
        ...player,
        linkedUserPhotoURL: player.linkedUserId ? photoByUid.get(player.linkedUserId) : undefined,
      },
    ]));

    res.json(crews.map(crew => {
      const crewPlayers = crew.playerIds
        .map(id => playersById.get(String(id)))
        .filter((player): player is NonNullable<typeof player> => Boolean(player));
      const linkedMemberUids = crewPlayers
        .map(player => player.linkedUserId)
        .filter(Boolean) as string[];
      return {
        ...crew.toObject(),
        memberUids: [...new Set([...(crew.memberUids ?? []), ...linkedMemberUids])],
        players: crewPlayers,
      };
    }));
  } catch {
    res.status(500).json({ error: 'Failed to fetch crews' });
  }
});

// POST /api/crews — create a new crew
router.post('/', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const crew = await Crew.create({ ownerUid: uid, name: name.trim(), playerIds: [], memberUids: [], editorUids: [] });
    res.status(201).json(crew);
  } catch {
    res.status(500).json({ error: 'Failed to create crew' });
  }
});

// POST /api/crews/:id/editors/:editorUid — grant roster edit permission to a crew member
router.post('/:id/editors/:editorUid', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const editorUid = String(req.params.editorUid);
  try {
    const crew = await Crew.findOne({ _id: req.params.id, ownerUid: uid });
    if (!crew) return res.status(404).json({ error: 'Crew not found' });
    if (editorUid === uid) return res.status(400).json({ error: 'Owner already has full access' });
    const linkedMember = await Player.exists({
      _id: { $in: crew.playerIds },
      linkedUserId: editorUid,
    });
    if (!crew.memberUids.includes(editorUid) && !linkedMember) {
      return res.status(400).json({ error: 'Editor must be a crew member' });
    }

    const updated = await Crew.findOneAndUpdate(
      { _id: req.params.id, ownerUid: uid },
      { $addToSet: { editorUids: editorUid } },
      { new: true }
    );
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to add editor' });
  }
});

// DELETE /api/crews/:id/editors/:editorUid — revoke roster edit permission
router.delete('/:id/editors/:editorUid', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const editorUid = String(req.params.editorUid);
  try {
    const updated = await Crew.findOneAndUpdate(
      { _id: req.params.id, ownerUid: uid },
      { $pull: { editorUids: editorUid } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Crew not found' });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to remove editor' });
  }
});

// PUT /api/crews/:id — rename a crew
router.put('/:id', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const crew = await Crew.findOneAndUpdate(
      { _id: req.params.id, ownerUid: uid },
      { name: name.trim() },
      { new: true }
    );
    if (!crew) return res.status(404).json({ error: 'Crew not found' });
    res.json(crew);
  } catch {
    res.status(500).json({ error: 'Failed to update crew' });
  }
});

// DELETE /api/crews/:id — delete a crew
router.delete('/:id', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  try {
    const crew = await Crew.findOneAndDelete({ _id: req.params.id, ownerUid: uid });
    if (!crew) return res.status(404).json({ error: 'Crew not found' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete crew' });
  }
});

// POST /api/crews/:id/players/:playerId — add player to crew
router.post('/:id/players/:playerId', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const playerId = String(req.params.playerId);
  try {
    const player = await Player.findOne({ _id: playerId, ownerUid: uid }).select('linkedUserId');
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const addToSet: { playerIds: string; memberUids?: string } = { playerIds: playerId };
    if (player.linkedUserId) addToSet.memberUids = player.linkedUserId;

    const crew = await Crew.findOneAndUpdate(
      { _id: req.params.id, ownerUid: uid },
      { $addToSet: addToSet },
      { new: true }
    );
    if (!crew) return res.status(404).json({ error: 'Crew not found' });
    res.json(crew);
  } catch {
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// DELETE /api/crews/:id/players/:playerId — remove player from crew
router.delete('/:id/players/:playerId', async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const playerId = String(req.params.playerId);
  try {
    const player = await Player.findOne({ _id: playerId, ownerUid: uid }).select('linkedUserId');
    const crew = await Crew.findOneAndUpdate(
      { _id: req.params.id, ownerUid: uid },
      { $pull: { playerIds: playerId } },
      { new: true }
    );
    if (!crew) return res.status(404).json({ error: 'Crew not found' });

    if (player?.linkedUserId) {
      const stillLinkedCount = await Player.countDocuments({
        _id: { $in: crew.playerIds },
        linkedUserId: player.linkedUserId,
      });

      if (stillLinkedCount === 0) {
        const updatedCrew = await Crew.findOneAndUpdate(
          { _id: req.params.id, ownerUid: uid },
          { $pull: { memberUids: player.linkedUserId } },
          { new: true }
        );
        return res.json(updatedCrew ?? crew);
      }
    }

    res.json(crew);
  } catch {
    res.status(500).json({ error: 'Failed to remove player' });
  }
});

export default router;
