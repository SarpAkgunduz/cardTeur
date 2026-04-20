import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { playerApi } from '../services';
import { validatePlayer } from '../utils/validatePlayer';
import type { StatField } from '../components/StatGrid';

const calculateAverage = (stats: number[]) =>
  stats.length ? Math.round(stats.reduce((a, b) => a + b, 0) / stats.length) : 0;

export function usePlayerForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Identity
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  // Load player data if in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    playerApi.getById(id)
      .then((player) => {
        setName(player.name);
        setEmail(player.email ?? '');
        setCardImage(player.cardImage);
        setJerseyNumber(player.jerseyNumber);
        setMarketValue(player.marketValue);
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
      })
      .catch((error) => {
        console.error('Failed to fetch player:', error);
        setToastMsg('Failed to load player data');
        setShowToast(true);
      });
  }, [id, isEditMode]);

  // Calculated overalls
  const offensiveOverall = calculateAverage([dribbling, shotAccuracy, shotSpeed, headers, ballControl, vision, positioning, longPass, shortPass]);
  const defensiveOverall = calculateAverage([tackling, interceptions, marking]);
  const athleticismOverall = calculateAverage([speed, strength, stamina]);
  const gkOverall = calculateAverage([diving, handling, kicking, reflexes, gkPositioning, gkSpeed]);

  const isGK = preferredPosition === 'GK';

  // Card title
  let cardTitle: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
  if (isGK) {
    if (gkOverall >= 90) cardTitle = 'platinum';
    else if (gkOverall >= 80) cardTitle = 'gold';
    else if (gkOverall >= 60) cardTitle = 'silver';
  } else {
    const defScore = (defensiveOverall + athleticismOverall) / 2;
    const offScore = (offensiveOverall + athleticismOverall) / 2;
    if (defScore >= 95 || offScore >= 95) cardTitle = 'platinum';
    else if (defScore >= 85 || offScore>= 85) cardTitle = 'gold';
    else if (defScore >= 60 || offScore>= 60) cardTitle = 'silver';
  }

  // Stat field groups
  const gkFields: StatField[] = [
    { id: 'diving',        label: 'Diving',      value: diving,        setter: setDiving },
    { id: 'handling',      label: 'Handling',    value: handling,      setter: setHandling },
    { id: 'kicking',       label: 'Kicking',     value: kicking,       setter: setKicking },
    { id: 'reflexes',      label: 'Reflexes',    value: reflexes,      setter: setReflexes },
    { id: 'gkPositioning', label: 'Positioning', value: gkPositioning, setter: setGkPositioning },
    { id: 'gkSpeed',       label: 'Speed',       value: gkSpeed,       setter: setGkSpeed },
  ];

  const offensiveFields: StatField[] = [
    { id: 'dribbling',    label: 'Dribbling',     value: dribbling,    setter: setDribbling },
    { id: 'shotAccuracy', label: 'Shot Accuracy', value: shotAccuracy, setter: setShotAccuracy },
    { id: 'shotSpeed',    label: 'Shot Speed',    value: shotSpeed,    setter: setShotSpeed },
    { id: 'headers',      label: 'Headers',       value: headers,      setter: setHeaders },
    { id: 'longPass',     label: 'Long Pass',     value: longPass,     setter: setLongPass },
    { id: 'shortPass',    label: 'Short Pass',    value: shortPass,    setter: setShortPass },
    { id: 'ballControl',  label: 'Ball Control',  value: ballControl,  setter: setBallControl },
    { id: 'positioning',  label: 'Positioning',   value: positioning,  setter: setPositioning },
    { id: 'vision',       label: 'Vision',        value: vision,       setter: setVision },
  ];

  const defensiveFields: StatField[] = [
    { id: 'tackling',      label: 'Tackling',      value: tackling,      setter: setTackling },
    { id: 'interceptions', label: 'Interceptions', value: interceptions, setter: setInterceptions },
    { id: 'marking',       label: 'Marking',       value: marking,       setter: setMarking },
    { id: 'defensiveIQ',   label: 'Defensive IQ',  value: defensiveIQ,   setter: setDefensiveIQ },
  ];

  const athleticismFields: StatField[] = [
    { id: 'speed',    label: 'Speed',    value: speed,    setter: setSpeed },
    { id: 'strength', label: 'Strength', value: strength, setter: setStrength },
    { id: 'stamina',  label: 'Stamina',  value: stamina,  setter: setStamina },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPlayer = {
      name,
      email: email.trim() || undefined,
      jerseyNumber: Number(jerseyNumber),
      preferredPosition,
      // cardTitle is not sent — backend computes it as a virtual
      marketValue: marketValue !== '' ? Number(marketValue) : 0,
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
      if (isEditMode && id) {
        await playerApi.update(id, newPlayer);
        setToastMsg('Player updated successfully!');
      } else {
        await playerApi.create(newPlayer);
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
    email, setEmail,
    cardImage, setCardImage,
    jerseyNumber, setJerseyNumber,
    marketValue, setMarketValue,
    preferredPosition, setPreferredPosition,
    activeStatTab, setActiveStatTab,
    offensiveOverall, defensiveOverall, athleticismOverall, gkOverall,
    isGK, cardTitle,
    gkFields, offensiveFields, defensiveFields, athleticismFields,
    showToast, setShowToast, toastMsg,
    handleSubmit,
  };
}
