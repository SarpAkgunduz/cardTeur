import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Player, CreatePlayerDto, UpdatePlayerDto } from '../services/api/types';
import { playerApi } from '../services/api/playerApi';
import { apiRequest } from '../services/api/apiClient';
import { useAuth } from './AuthContext';

interface LinkedUser {
  uid: string;
  photoURL?: string;
}

interface PlayerContextType {
  players: Player[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<Player[]>;
  createPlayer: (data: CreatePlayerDto) => Promise<Player>;
  updatePlayer: (id: string, data: UpdatePlayerDto) => Promise<Player>;
  deletePlayer: (id: string) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<Promise<Player[]> | null>(null);

  const enrichPlayers = useCallback(async (data: Player[]): Promise<Player[]> => {
    const linkedUids = [...new Set(data.map(p => p.linkedUserId).filter(Boolean) as string[])];
    if (linkedUids.length === 0) return data;
    try {
      const users = await apiRequest<LinkedUser[]>('/users/lookup-by-uids', {
        method: 'POST',
        body: JSON.stringify({ uids: linkedUids }),
      });
      const photoByUid = new Map(users.map(u => [u.uid, u.photoURL]));
      return data.map(p => ({
        ...p,
        linkedUserPhotoURL: p.linkedUserId ? photoByUid.get(p.linkedUserId) : undefined,
      }));
    } catch {
      return data;
    }
  }, []);

  const fetchPlayers = useCallback(async (): Promise<Player[]> => {
    if (!currentUser) {
      setPlayers([]);
      setError(null);
      return [];
    }
    if (inFlightRef.current) return inFlightRef.current;

    setLoading(true);
    setError(null);

    const request = playerApi.getAll()
      .then(async (data) => {
        const enriched = await enrichPlayers(data);
        setPlayers(enriched);
        return enriched;
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load players.');
        throw err;
      })
      .finally(() => {
        setLoading(false);
        inFlightRef.current = null;
      });

    inFlightRef.current = request;
    return request;
  }, [currentUser, enrichPlayers]);

  useEffect(() => {
    if (currentUser) {
      fetchPlayers().catch(() => {});
    } else {
      inFlightRef.current = null;
      setPlayers([]);
      setError(null);
      setLoading(false);
    }
  }, [currentUser, fetchPlayers]);

  const createPlayer = useCallback(async (data: CreatePlayerDto) => {
    const created = await playerApi.create(data);
    const [enriched] = await enrichPlayers([created]);
    setPlayers(prev => [...prev, enriched]);
    return enriched;
  }, [enrichPlayers]);

  const updatePlayer = useCallback(async (id: string, data: UpdatePlayerDto) => {
    const updated = await playerApi.update(id, data);
    const [enriched] = await enrichPlayers([updated]);
    setPlayers(prev => prev.map(p => p._id === id ? enriched : p));
    return enriched;
  }, [enrichPlayers]);

  const deletePlayer = useCallback(async (id: string) => {
    await playerApi.delete(id);
    setPlayers(prev => prev.filter(p => p._id !== id));
  }, []);

  return (
    <PlayerContext.Provider value={{ players, loading, error, refresh: fetchPlayers, createPlayer, updatePlayer, deletePlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayers must be inside PlayerProvider');
  return ctx;
};
