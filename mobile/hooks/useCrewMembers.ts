import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api/apiClient';

export interface CrewMemberProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface CrewMemberSource {
  memberUids?: string[];
  editorUids?: string[];
}

export function useCrewMembers(crews: CrewMemberSource[], extraUids: string[] = []) {
  const [memberMap, setMemberMap] = useState<Record<string, CrewMemberProfile>>({});
  const [loading, setLoading] = useState(false);

  const uids = useMemo(() => [
    ...new Set([
      ...extraUids,
      ...crews.flatMap(crew => [
        ...(crew.memberUids ?? []),
        ...(crew.editorUids ?? []),
      ]),
    ].filter(Boolean)),
  ], [crews, extraUids]);

  useEffect(() => {
    if (uids.length === 0) {
      setMemberMap({});
      return;
    }

    setLoading(true);
    apiRequest<CrewMemberProfile[]>('/users/lookup-by-uids', {
      method: 'POST',
      body: JSON.stringify({ uids }),
    })
      .then((users) => {
        const nextMap: Record<string, CrewMemberProfile> = {};
        users.forEach(user => { nextMap[user.uid] = user; });
        setMemberMap(nextMap);
      })
      .catch(() => setMemberMap({}))
      .finally(() => setLoading(false));
  }, [uids]);

  return { memberMap, loading };
}
