import { useCallback, useMemo } from 'react';

interface PlayerPhotoSource {
  linkedUserPhotoURL?: string;
  cardImage?: string;
  image?: string;
}

interface LinkedUserSource {
  uid: string;
  displayName?: string;
  photoURL?: string;
}

const PLAYER_PHOTO_COUNT = 43;

export function usePlayerDisplay() {
  const playerPhotoOptions = useMemo(
    () => Array.from({ length: PLAYER_PHOTO_COUNT }, (_, index) => `/assets/player${index + 1}.png`),
    []
  );

  const getPlayerCardImage = useCallback((player: PlayerPhotoSource) => (
    player.linkedUserPhotoURL || player.cardImage || player.image || ''
  ), []);

  const getLinkedUser = useCallback((
    linkedUserId: string | undefined,
    userOptions: LinkedUserSource[]
  ) => (
    linkedUserId ? userOptions.find(user => user.uid === linkedUserId) ?? null : null
  ), []);

  const getLinkedUserPhoto = useCallback((
    linkedUserId: string | undefined,
    userOptions: LinkedUserSource[]
  ) => (
    getLinkedUser(linkedUserId, userOptions)?.photoURL || ''
  ), [getLinkedUser]);

  const isLinkedPlayer = useCallback((linkedUserId: string | undefined) => Boolean(linkedUserId), []);

  return {
    playerPhotoOptions,
    getPlayerCardImage,
    getLinkedUser,
    getLinkedUserPhoto,
    isLinkedPlayer,
  };
}
