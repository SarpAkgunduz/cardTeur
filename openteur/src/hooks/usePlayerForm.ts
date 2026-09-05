import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { playerApi } from '../services';
import { validatePlayer } from '../utils/validatePlayer';
import type { StatField } from '../components/StatGrid';
import { apiRequest } from '../services/api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { usePlayers } from '../contexts/PlayerContext';
import { calculateAverage, computeCardTitle } from '../utils/playerRating';

export interface UserOption {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export function usePlayerForm() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const { players, createPlayer, updatePlayer } = usePlayers();

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // User linking
  const [linkedUserId, setLinkedUserId] = useState('');
  const [selfOption, setSelfOption] = useState<UserOption | null>(null);
  const [friendOptions, setFriendOptions] = useState<UserOption[]>([]);

  // Identity
  const [name, setName] = useState('');
  const [cardImage, setCardImage] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState<number | string>('');
  const [marketValue, setMarketValue] = useState<number | string>('');
  const [preferredPosition, setPreferredPosition] = useState('');
  const [activeStatTab, setActiveStatTab] = useState<'gk' | 'offensive' | 'defensive'>('offensive');

  // Offensive stats
  const [dribbling, setDribbling] = useState(0);
  const [shotAccuracy, setShotAccuracy] = useState(0);
  const [shotSpeed, setShotSpeed] = useState(0);
  const [headers, setHeaders] = useState(0);
  const [longPass, setLongPass] = useState(0);
  const [shortPass, setShortPass] = useState(0);
  const [ballControl, setBallControl] = useState(0);
  const [positioning, setPositioning] = useState(0);
  const [vision, setVision] = useState(0);

  // Defensive stats
  const [tackling, setTackling] = useState(0);
  const [interceptions, setInterceptions] = useState(0);
  const [marking, setMarking] = useState(0);
  const [defensiveIQ, setDefensiveIQ] = useState(0);

  // Athleticism stats
  const [speed, setSpeed] = useState(0);
  const [strength, setStrength] = useState(0);
  const [stamina, setStamina] = useState(0);

  // GK stats
  const [diving, setDiving] = useState(0);
  const [handling, setHandling] = useState(0);
  const [kicking, setKicking] = useState(0);
  const [reflexes, setReflexes] = useState(0);
  const [gkPositioning, setGkPositioning] = useState(0);
  const [gkSpeed, setGkSpeed] = useState(0);

  // Fetch current user profile and friend list on mount
  useEffect(() => {
    if (!currentUser) return;

    apiRequest<UserOption>('/users/me')
      .then(setSelfOption)
      .catch(() => {
        setSelfOption({
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email || 'Me',
          photoURL: currentUser.photoURL || '',
        });
      });

    apiRequest<UserOption[]>('/users/friends')
      .then(setFriendOptions)
      .catch(() => {});
  }, [currentUser]);

  // Derived: self + friends as selectable user options
  const userOptions: UserOption[] = [
    ...(selfOption ? [selfOption] : []),
    ...friendOptions,
  ];

  // Load player data if in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    const cachedPlayer = players.find(player => player._id === id);
    const loadPlayer = cachedPlayer ? Promise.resolve(cachedPlayer) : playerApi.getById(id);

    loadPlayer
      .then((player) => {
        setName(player.name);
        setCardImage(player.cardImage);
        setJerseyNumber(player.jerseyNumber);
        setMarketValue(player.marketValue ?? '');
        setPreferredPosition(player.preferredPosition);
        setDribbling(player.dribbling ?? 0);
        setShotAccuracy(player.shotAccuracy ?? 0);
        setShotSpeed(player.shotSpeed ?? 0);
        setHeaders(player.headers ?? 0);
        setLongPass(player.longPass ?? 0);
        setShortPass(player.shortPass ?? 0);
        setBallControl(player.ballControl ?? 0);
        setPositioning(player.positioning ?? 0);
        setVision(player.vision ?? 0);
        setTackling(player.tackling ?? 0);
        setInterceptions(player.interceptions ?? 0);
        setMarking(player.marking ?? 0);
        setDefensiveIQ(player.defensiveIQ ?? 0);
        setSpeed(player.speed ?? 0);
        setStrength(player.strength ?? 0);
        setStamina(player.stamina ?? 0);
        setDiving(player.diving ?? 0);
        setHandling(player.handling ?? 0);
        setKicking(player.kicking ?? 0);
        setReflexes(player.reflexes ?? 0);
        setGkPositioning(player.gkPositioning ?? 0);
        setGkSpeed(player.gkSpeed ?? 0);
        setLinkedUserId(player.linkedUserId ?? '');
      })
      .catch((error) => {
        console.error('Failed to fetch player:', error);
        setToastMsg('Failed to load player data');
        setShowToast(true);
      });
  }, [id, isEditMode, players]);

  // Calculated overalls
  const offensiveOverall = calculateAverage([dribbling, shotAccuracy, shotSpeed, headers, ballControl, vision, positioning, longPass, shortPass]);
  const defensiveOverall = calculateAverage([tackling, interceptions, marking]);
  const athleticismOverall = calculateAverage([speed, strength, stamina]);
  const gkOverall = calculateAverage([diving, handling, kicking, reflexes, gkPositioning, gkSpeed]);

  const isGK = preferredPosition === 'GK';

  const cardTitle = computeCardTitle({
    offensiveOverall,
    defensiveOverall,
    athleticismOverall,
    gkOverall,
    isGK,
  });

  // Stat field groups
  const gkFields: StatField[] = [
    { id: 'diving',        label: t('stats.diving'),        value: diving,        setter: setDiving },
    { id: 'handling',      label: t('stats.handling'),      value: handling,      setter: setHandling },
    { id: 'kicking',       label: t('stats.kicking'),       value: kicking,       setter: setKicking },
    { id: 'reflexes',      label: t('stats.reflexes'),      value: reflexes,      setter: setReflexes },
    { id: 'gkPositioning', label: t('stats.gkPositioning'), value: gkPositioning, setter: setGkPositioning },
    { id: 'gkSpeed',       label: t('stats.gkSpeed'),       value: gkSpeed,       setter: setGkSpeed },
  ];

  const offensiveFields: StatField[] = [
    { id: 'dribbling',    label: t('stats.dribbling'),    value: dribbling,    setter: setDribbling },
    { id: 'shotAccuracy', label: t('stats.shotAccuracy'), value: shotAccuracy, setter: setShotAccuracy },
    { id: 'shotSpeed',    label: t('stats.shotSpeed'),    value: shotSpeed,    setter: setShotSpeed },
    { id: 'headers',      label: t('stats.headers'),      value: headers,      setter: setHeaders },
    { id: 'longPass',     label: t('stats.longPass'),     value: longPass,     setter: setLongPass },
    { id: 'shortPass',    label: t('stats.shortPass'),    value: shortPass,    setter: setShortPass },
    { id: 'ballControl',  label: t('stats.ballControl'),  value: ballControl,  setter: setBallControl },
    { id: 'positioning',  label: t('stats.positioning'),  value: positioning,  setter: setPositioning },
    { id: 'vision',       label: t('stats.vision'),       value: vision,       setter: setVision },
  ];

  const defensiveFields: StatField[] = [
    { id: 'tackling',      label: t('stats.tackling'),      value: tackling,      setter: setTackling },
    { id: 'interceptions', label: t('stats.interceptions'), value: interceptions, setter: setInterceptions },
    { id: 'marking',       label: t('stats.marking'),       value: marking,       setter: setMarking },
    { id: 'defensiveIQ',   label: t('stats.defensiveIQ'),   value: defensiveIQ,   setter: setDefensiveIQ },
  ];

  const athleticismFields: StatField[] = [
    { id: 'speed',    label: t('stats.speed'),    value: speed,    setter: setSpeed },
    { id: 'strength', label: t('stats.strength'), value: strength, setter: setStrength },
    { id: 'stamina',  label: t('stats.stamina'),  value: stamina,  setter: setStamina },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPlayer = {
      name,
      linkedUserId: linkedUserId || undefined,
      jerseyNumber: Number(jerseyNumber),
      preferredPosition,
      // cardTitle is not sent — backend computes it as a virtual
      marketValue: marketValue !== '' ? Number(marketValue) : undefined,
      cardImage,
      offensiveOverall,
      defensiveOverall,
      athleticismOverall,
      dribbling, shotAccuracy, shotSpeed, headers, longPass, shortPass, ballControl, positioning, vision,
      tackling, interceptions, marking, defensiveIQ,
      speed, strength, stamina,
      gkOverall, diving, handling, kicking, reflexes, gkPositioning, gkSpeed,
    };

    // Frontend validation — check all rules before hitting the backend
    const validationError = validatePlayer(newPlayer, isGK, jerseyNumber, marketValue);
    if (validationError) {
      setToastMsg(validationError);
      setShowToast(true);
      return;
    }

    try {
      let payload = newPlayer;
      if (cardImage.startsWith('data:')) {
        const { url } = await apiRequest<{ url: string }>('/uploads/image', {
          method: 'POST',
          body: JSON.stringify({ imageDataUrl: cardImage }),
        });
        payload = { ...newPlayer, cardImage: url };
      }
      if (isEditMode && id) {
        await updatePlayer(id, payload);
        setToastMsg('Player updated successfully!');
      } else {
        await createPlayer(payload);
        setToastMsg('Player added successfully!');
      }
      setShowToast(true);
      setTimeout(() => navigate('/manage'), 3000);
    } catch (error) {
      console.error('Error saving player:', error);
      setToastMsg(`Error ${isEditMode ? 'updating' : 'adding'} player.`);
      setShowToast(true);
    }
  };

  return {
    isEditMode,
    name, setName,
    cardImage, setCardImage,
    jerseyNumber, setJerseyNumber,
    marketValue, setMarketValue,
    preferredPosition, setPreferredPosition,
    activeStatTab, setActiveStatTab,
    offensiveOverall, defensiveOverall, athleticismOverall, gkOverall,
    isGK, cardTitle,
    gkFields, offensiveFields, defensiveFields, athleticismFields,
    linkedUserId, setLinkedUserId,
    userOptions,
    showToast, setShowToast, toastMsg,
    handleSubmit,
  };
}
