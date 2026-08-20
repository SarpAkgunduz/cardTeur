import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import Card from '../components/Card';
import ComparePanel from '../components/ComparePanel';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastNotification from '../components/ToastNotification';
import UpgradeModal from '../components/UpgradeModal';
import PlanUsageMeter from '../components/PlanUsageMeter';
import { Player } from '../services';
import { usePlayers } from '../contexts/PlayerContext';
import { usePlayerDisplay } from '../hooks/usePlayerDisplay';
import { useAuth } from '../contexts/AuthContext';
import { isPlanLimitError } from '../services/api/apiClient';
import { apiRequest } from '../services/api/apiClient';
import './PlayersPage.css';
import './PreviewPage.css';

const POSITION_GROUPS = [
  { key: 'gk',  labelKey: 'preview.goalkeepers', icon: 'bi-person-fill',     positions: ['GK'] },
  { key: 'def', labelKey: 'preview.defenders',   icon: 'bi-shield-fill',      positions: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'WB'] },
  { key: 'mid', labelKey: 'preview.midfielders', icon: 'bi-arrow-left-right', positions: ['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM'] },
  { key: 'att', labelKey: 'preview.attackers',   icon: 'bi-lightning-fill',   positions: ['ST', 'CF', 'LW', 'RW', 'SS', 'FW', 'LS', 'RS'] },
];

interface VisibleCrew {
  _id: string;
  name: string;
  ownerUid: string;
  playerIds: string[];
  editorUids?: string[];
  players?: Player[];
}

type RandomTier = 'bronze' | 'silver' | 'gold';

const RANDOM_TIERS: Array<{ id: RandomTier; label: string; range: [number, number] }> = [
  { id: 'bronze', label: 'Bronze', range: [41, 59] },
  { id: 'silver', label: 'Silver', range: [60, 84] },
  { id: 'gold', label: 'Gold', range: [85, 89] },
];

const RANDOM_POSITIONS = ['CB', 'RB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'LM', 'RM'];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFrom = <T,>(items: T[]) => items[randomInt(0, items.length - 1)];

const getNextRandomPlayerNumber = (players: Player[], label: string) => {
  const pattern = new RegExp(`^${label} Player (\\d+)$`, 'i');
  const highest = players.reduce((max, player) => {
    const match = player.name?.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return highest + 1;
};

const PlayersPage = () => {
  const { players, error: fetchError, deletePlayer, createPlayer } = usePlayers();
  const { getPlayerCardImage, playerPhotoOptions } = usePlayerDisplay();
  const { currentUser, limits } = useAuth();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'edit' | 'byPosition'>('edit');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [randomPickerOpen, setRandomPickerOpen] = useState(false);
  const [generatingTier, setGeneratingTier] = useState<RandomTier | null>(null);
  const [compareSelection, setCompareSelection] = useState<Player[]>([]);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const navigate = useNavigate();

  // "By position" view state — mirrors the old PreviewPage: read-only roster
  // grouped GK -> DEF -> MID -> ATT, with a crew filter to see teammates' cards.
  const [crews, setCrews] = useState<VisibleCrew[]>([]);
  const [crewsLoading, setCrewsLoading] = useState(true);
  const [selectedCrewId, setSelectedCrewId] = useState('');

  useEffect(() => {
    if (viewMode !== 'byPosition' || crews.length > 0) return;
    apiRequest<VisibleCrew[]>('/crews')
      .then(setCrews)
      .catch(() => setCrews([]))
      .finally(() => setCrewsLoading(false));
  }, [viewMode]);

  const sharedCrews = useMemo(
    () => crews.filter(crew => crew.ownerUid !== currentUser?.uid),
    [crews, currentUser]
  );

  const visiblePlayers = useMemo(() => {
    const selectedCrew = crews.find(crew => crew._id === selectedCrewId);
    if (selectedCrew) return selectedCrew.players ?? [];

    const map = new Map<string, Player>();
    players.forEach(player => map.set(player._id, player));

    sharedCrews.flatMap(crew => crew.players ?? []).forEach(player => {
      if (player?._id && !map.has(player._id)) map.set(player._id, player);
    });

    return [...map.values()];
  }, [players, crews, sharedCrews, selectedCrewId]);

  const editablePlayerIds = useMemo(() => {
    const ids = new Set(players.map(player => player._id));
    crews.forEach(crew => {
      const canEditCrew = crew.ownerUid === currentUser?.uid || (crew.editorUids ?? []).includes(currentUser?.uid ?? '');
      if (canEditCrew) crew.playerIds.forEach(id => ids.add(id));
    });
    return ids;
  }, [players, crews, currentUser]);

  const byPositionLoading = crewsLoading;

  const positionSections = POSITION_GROUPS.map(group => ({
    ...group,
    players: visiblePlayers.filter(p =>
      group.positions.includes((p.preferredPosition ?? '').toUpperCase())
    ),
  })).filter(s => s.players.length > 0);

  const ungroupedPlayers = visiblePlayers.filter(p => {
    const pos = (p.preferredPosition ?? '').toUpperCase();
    return !POSITION_GROUPS.some(g => g.positions.includes(pos));
  });

  const handleDelete = (id: string) => setConfirm({
    message: t('players.deleteConfirmText'),
    onConfirm: async () => {
      setConfirm(null);
      try {
        await deletePlayer(id);
        setToastMsg(t('players.deletedToast'));
        setToastVariant('success');
        setShowToast(true);
      } catch (error) {
        console.error('Delete error:', error);
        setToastMsg(t('players.deleteFailed'));
        setToastVariant('danger');
        setShowToast(true);
      }
    },
  });

  const handleEdit = (id: string) => {
    navigate(`/edit-player/${id}`);
  };

  const handleCompareSelect = (player: Player) => {
    if (!compareSelection.some(p => p._id === player._id)) {
      const updated = [...compareSelection, player];
      setCompareSelection(updated);
    }
  };

  const handleRemoveFromCompare = (id: string) => {
    setCompareSelection(prev => prev.filter(p => p._id !== id));
  };

  const handleCloseCompare = () => {
    setCompareSelection([]);
    setCompareMode(false);
  };

  const buildRandomPlayer = (tier: RandomTier) => {
    const option = RANDOM_TIERS.find(item => item.id === tier) ?? RANDOM_TIERS[0];
    const [min, max] = option.range;
    const target = randomInt(min, max);
    const position = randomFrom(RANDOM_POSITIONS);
    const variance = tier === 'gold' ? 4 : tier === 'silver' ? 7 : 9;
    const stat = () => Math.max(min, Math.min(max, target + randomInt(-variance, variance)));
    const sequence = getNextRandomPlayerNumber(players, option.label);

    return {
      name: `${option.label} Player ${sequence}`,
      email: '',
      cardImage: randomFrom(playerPhotoOptions),
      jerseyNumber: randomInt(1, 99),
      marketValue: target * 100000,
      preferredPosition: position,
      offensiveOverall: stat(),
      defensiveOverall: stat(),
      athleticismOverall: stat(),
      dribbling: stat(),
      shotAccuracy: stat(),
      shotSpeed: stat(),
      headers: stat(),
      longPass: stat(),
      shortPass: stat(),
      ballControl: stat(),
      positioning: stat(),
      vision: stat(),
      tackling: stat(),
      interceptions: stat(),
      marking: stat(),
      defensiveIQ: stat(),
      speed: stat(),
      strength: stat(),
      stamina: stat(),
      gkOverall: 0,
      diving: 0,
      handling: 0,
      kicking: 0,
      reflexes: 0,
      gkPositioning: 0,
      gkSpeed: 0,
    };
  };

  const handleGenerateRandomPlayer = async (tier: RandomTier) => {
    setGeneratingTier(tier);
    try {
      const player = await createPlayer(buildRandomPlayer(tier));
      setToastMsg(t('players.generatedToast', { name: player.name }));
      setToastVariant('success');
      setShowToast(true);
      setRandomPickerOpen(false);
    } catch (error) {
      if (isPlanLimitError(error)) {
        setRandomPickerOpen(false);
        setShowUpgrade(true);
      } else {
        console.error('Generate random player error:', error);
        setToastMsg(t('players.generateFailed'));
        setToastVariant('danger');
        setShowToast(true);
      }
    } finally {
      setGeneratingTier(null);
    }
  };

  const atPlayerLimit = limits.maxPlayers !== Infinity && players.length >= limits.maxPlayers;

  const handleAddPlayer = () => {
    if (atPlayerLimit) {
      setShowUpgrade(true);
      return;
    }
    navigate('/add');
  };

  return (
    <div className="page-wrapper" style={{ marginRight: compareSelection.length > 0 ? '500px' : '0px' }}>
      <div className="page-container">
        <div className="content-card">
          {/* Header and Buttons */}
          <div className="page-header players-page__header">
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title players-page__title">{t('players.title')}</h2>
            {viewMode === 'edit' && (
              <div className="players-page__actions" data-tutorial="roster-tools">
                <button
                  className={`btn btn-ct ${compareMode ? 'active-mode' : ''}`}
                  onClick={() => {
                    const next = !compareMode;
                    setCompareMode(next);
                    setCompareSelection([]);
                    if (next) {
                      setEditMode(false);
                      setDeleteMode(false);
                    }
                  }}
                >
                  <i className={`bi ${compareMode ? 'bi-x-circle-fill' : 'bi-columns-gap'}`} style={{ marginRight: 8 }}></i>
                  {compareMode ? t('players.cancelCompare') : t('players.compare')}
                </button>
                <button
                  className={`btn btn-ct ${editMode ? 'active-mode' : ''}`}
                  onClick={() => {
                    const next = !editMode;
                    setEditMode(next);
                    if (next) {
                      setCompareMode(false);
                      setCompareSelection([]);
                      setDeleteMode(false);
                    }
                  }}
                >
                  <i className={`bi ${editMode ? 'bi-x-circle-fill' : 'bi-pencil-fill'}`} style={{ marginRight: 8 }}></i>
                  {editMode ? t('players.cancelEdit') : t('players.editPlayer')}
                </button>
                <button
                  className={`btn btn-ct ${deleteMode ? 'active-mode' : ''}`}
                  onClick={() => {
                    const next = !deleteMode;
                    setDeleteMode(next);
                    if (next) {
                      setCompareMode(false);
                      setCompareSelection([]);
                      setEditMode(false);
                    }
                  }}
                >
                  <i className={`bi ${deleteMode ? 'bi-x-circle-fill' : 'bi-trash-fill'}`} style={{ marginRight: 8 }}></i>
                  {deleteMode ? t('common.cancel') : t('players.deletePlayer')}
                </button>
                <button
                  className="btn btn-ct"
                  id="createCard"
                  data-tutorial="roster-add"
                  onClick={handleAddPlayer}
                >
                  <i className="bi bi-person-plus-fill" style={{ marginRight: 8 }}></i>
                  {t('players.addPlayer')}
                </button>
              </div>
            )}
        </div>

        <div className="players-page__view-tabs">
          <button
            className={`btn btn-ct players-page__view-tab ${viewMode === 'edit' ? 'players-page__view-tab--active' : ''}`}
            onClick={() => setViewMode('edit')}
          >
            <i className="bi bi-pencil-fill" style={{ marginRight: 8 }}></i>
            {t('players.viewEdit')}
          </button>
          <button
            className={`btn btn-ct players-page__view-tab ${viewMode === 'byPosition' ? 'players-page__view-tab--active' : ''}`}
            onClick={() => setViewMode('byPosition')}
          >
            <i className="bi bi-diagram-3-fill" style={{ marginRight: 8 }}></i>
            {t('players.viewByPosition')}
          </button>
        </div>

        {viewMode === 'edit' && (
          <>
            <div className="players-page__meter-row">
              <PlanUsageMeter label={t('players.cards')} used={players.length} limit={limits.maxPlayers} />
            </div>

            {/* Players Grid */}
            {fetchError ? (
              <p className="empty-message" style={{ color: '#ff6b6b' }}>⚠️ {fetchError}</p>
            ) : (
              <div className="players-grid">
                <div className="players-grid__item">
                  <button
                    type="button"
                    className="random-player-card"
                    data-tutorial="roster-random"
                    onClick={() => setRandomPickerOpen(true)}
                    aria-label="Generate random player"
                  >
                    <span className="random-player-card__question">?</span>
                    <span className="random-player-card__title">{t('players.randomTitle')}</span>
                    <span className="random-player-card__subtitle">{t('players.randomSubtitle')}</span>
                  </button>
                </div>
                {players.map((player) => (
                <div key={player._id} className="players-grid__item">
                    <Card
                      _id={player._id}
                      name={player.name}
                      cardImage={getPlayerCardImage(player)}
                      preferredPosition={player.preferredPosition}
                      cardTitle={player.cardTitle}
                      offensiveOverall={player.offensiveOverall}
                      defensiveOverall={player.defensiveOverall}
                      athleticismOverall={player.athleticismOverall}
                      gkOverall={player.gkOverall}
                      reflexes={player.reflexes}
                      handling={player.handling}
                      diving={player.diving}
                      deleteMode={deleteMode}
                      onDelete={() => handleDelete(player._id)}
                      editMode={editMode}
                      onEdit={() => handleEdit(player._id)}
                      compareMode={compareMode}
                      onCompareSelect={() => handleCompareSelect(player)}
                      isCompareSelected={compareSelection.some(p => p._id === player._id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === 'byPosition' && (
          <>
            <div className="preview-filter">
              <label className="preview-filter__label" htmlFor="rosterCrewFilter">{t('preview.rosterScope')}</label>
              <select
                id="rosterCrewFilter"
                className="preview-filter__select"
                value={selectedCrewId}
                onChange={event => setSelectedCrewId(event.target.value)}
                disabled={crewsLoading || crews.length === 0}
              >
                <option value="">
                  {crewsLoading
                    ? t('common.loading')
                    : crews.length === 0
                      ? t('preview.noCrew')
                      : `${t('preview.allPlayers')} (${visiblePlayers.length})`}
                </option>
                {crews.map(crew => (
                  <option key={crew._id} value={crew._id}>
                    {crew.name} ({crew.players?.length ?? 0})
                  </option>
                ))}
              </select>
            </div>

            {byPositionLoading && <p className="empty-message">{t('preview.loadingPlayers')}</p>}

            {!byPositionLoading && visiblePlayers.length === 0 && (
              <p className="empty-message">{t('preview.noPlayers')}</p>
            )}

            {!byPositionLoading && visiblePlayers.length > 0 && (
              <div className="preview-sections" data-tutorial="preview-sections">
                {positionSections.map(section => (
                  <div key={section.key} className="preview-section">
                    <div className="preview-section__header">
                      <i className={`bi ${section.icon} preview-section__icon`}></i>
                      <span className="preview-section__label">{t(section.labelKey)}</span>
                      <span className="preview-section__count">{section.players.length}</span>
                    </div>
                    <div className="preview-grid">
                      {section.players.map((player, idx) => (
                        <div
                          key={player._id}
                          className="preview-card-wrapper"
                          style={{ animationDelay: `${idx * 0.06}s` }}
                        >
                          <Card
                            _id={player._id}
                            name={player.name}
                            preferredPosition={player.preferredPosition}
                            offensiveOverall={player.offensiveOverall}
                            defensiveOverall={player.defensiveOverall}
                            athleticismOverall={player.athleticismOverall}
                            gkOverall={player.gkOverall}
                            reflexes={player.reflexes}
                            handling={player.handling}
                            diving={player.diving}
                            cardImage={getPlayerCardImage(player)}
                            cardTitle={player.cardTitle}
                            editMode={editablePlayerIds.has(player._id)}
                            onEdit={() => navigate(`/edit-player/${player._id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {ungroupedPlayers.length > 0 && (
                  <div className="preview-section">
                    <div className="preview-section__header">
                      <i className="bi bi-person-fill preview-section__icon"></i>
                      <span className="preview-section__label">{t('common.other')}</span>
                      <span className="preview-section__count">{ungroupedPlayers.length}</span>
                    </div>
                    <div className="preview-grid">
                      {ungroupedPlayers.map((player, idx) => (
                        <div
                          key={player._id}
                          className="preview-card-wrapper"
                          style={{ animationDelay: `${idx * 0.06}s` }}
                        >
                          <Card
                            _id={player._id}
                            name={player.name}
                            preferredPosition={player.preferredPosition}
                            offensiveOverall={player.offensiveOverall}
                            defensiveOverall={player.defensiveOverall}
                            athleticismOverall={player.athleticismOverall}
                            gkOverall={player.gkOverall}
                            reflexes={player.reflexes}
                            handling={player.handling}
                            diving={player.diving}
                            cardImage={getPlayerCardImage(player)}
                            cardTitle={player.cardTitle}
                            editMode={editablePlayerIds.has(player._id)}
                            onEdit={() => navigate(`/edit-player/${player._id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {randomPickerOpen && (
        <div className="random-player-modal" role="dialog" aria-modal="true" aria-label="Generate random player">
          <button
            type="button"
            className="random-player-modal__backdrop"
            aria-label="Close random player generator"
            onClick={() => setRandomPickerOpen(false)}
          />
          <div className="random-player-modal__content">
            <div className="random-player-modal__hero">
              <div className="random-player-card random-player-card--modal">
                <span className="random-player-card__question">?</span>
                <span className="random-player-card__title">{t('players.randomTitle')}</span>
                <span className="random-player-card__subtitle">{t('players.randomModalSub')}</span>
              </div>
            </div>
            <div className="random-player-modal__choices">
              {RANDOM_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  className={`random-tier-card random-tier-card--${tier.id}`}
                  onClick={() => handleGenerateRandomPlayer(tier.id)}
                  disabled={generatingTier !== null}
                >
                  <span className="random-tier-card__overall">?</span>
                  <span className="random-tier-card__mark">?</span>
                  <span className="random-tier-card__name">{t(`players.${tier.id}`)}</span>
                  <span className="random-tier-card__range">{tier.range[0]}-{tier.range[1]} OVR</span>
                  <span className="random-tier-card__action">
                    {generatingTier === tier.id ? t('players.generating') : t('players.unlock')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compare Panel */}
      <ComparePanel
        show={compareSelection.length > 0}
        onClose={handleCloseCompare}
        players={compareSelection}
        onRemovePlayer={handleRemoveFromCompare}
      />

      <ConfirmDialog
        show={confirm !== null}
        message={confirm?.message ?? ''}
        onConfirm={confirm?.onConfirm ?? (() => {})}
        onCancel={() => setConfirm(null)}
      />

      <ToastNotification
        show={showToast}
        message={toastMsg}
        onClose={() => setShowToast(false)}
        variant={toastVariant}
      />

      <UpgradeModal
        show={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title={t('players.upgradeTitle', { limit: limits.maxPlayers })}
        message={t('players.upgradeMessage')}
      />
    </div>
  );
};

export default PlayersPage;
