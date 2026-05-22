import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Player } from '../services/api/types';
import { playerApi } from '../services';
import { apiRequest } from '../services/api/apiClient';
import type { CreatePlayerDto, UpdatePlayerDto } from '../services/api/types';
import { useAuth } from './AuthContext';

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

interface LinkedUser {
  uid: string;
  photoURL?: string;
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<Promise<Player[]> | null>(null);

  const enrichPlayers = useCallback(async (data: Player[]): Promise<Player[]> => {
    const linkedUids = [...new Set(data.map(player => player.linkedUserId).filter(Boolean) as string[])];
    if (linkedUids.length === 0) return data;

    try {
      const users = await apiRequest<LinkedUser[]>('/users/lookup-by-uids', {
        method: 'POST',
        body: JSON.stringify({ uids: linkedUids }),
      });
      const photoByUid = new Map(users.map(user => [user.uid, user.photoURL]));
      return data.map(player => ({
        ...player,
        linkedUserPhotoURL: player.linkedUserId ? photoByUid.get(player.linkedUserId) || undefined : undefined,
      }));
    } catch (err) {
      console.error('Failed to load linked user photos:', err);
      return data;
    }
  }, []);

  const fetchPlayers = useCallback(async () => {
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
        const message = err?.message || 'Failed to load players.';
        setError(message);
        console.error('Failed to load players:', err);
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
    setPlayers(prev => prev.map(player => player._id === id ? enriched : player));
    return enriched;
  }, [enrichPlayers]);

  const deletePlayer = useCallback(async (id: string) => {
    await playerApi.delete(id);
    setPlayers(prev => prev.filter(player => player._id !== id));
  }, []);

  return (
    <PlayerContext.Provider value={{
      players,
      loading,
      error,
      refresh: fetchPlayers,
      createPlayer,
      updatePlayer,
      deletePlayer,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayers must be used inside PlayerProvider');
  return ctx;
};
