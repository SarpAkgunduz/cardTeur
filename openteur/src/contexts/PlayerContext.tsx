import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Player } from '../services/api/types';
import { playerApi } from '../services';
import { useAuth } from './AuthContext';

interface PlayerContextType {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlayers = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await playerApi.getAll();
      setPlayers(data);
    } catch (err) {
      console.error('Failed to load players:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchPlayers();
    } else {
      setPlayers([]);
    }
  }, [currentUser, fetchPlayers]);

  return (
    <PlayerContext.Provider value={{ players, setPlayers, loading, refresh: fetchPlayers }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayers must be used inside PlayerProvider');
  return ctx;
};
