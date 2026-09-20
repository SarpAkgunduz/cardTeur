import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import './MatchDetailsModal.css';

export interface MatchPlayer {
  name: string;
  email?: string;
  preferredPosition?: string;
}

interface MatchDetailsModalProps {
  leftTeam: MatchPlayer[];
  rightTeam: MatchPlayer[];
  onSkip: () => void;
  onAnnounce: (details: { location: string; date: string; time: string }) => Promise<void>;
}

// Same position buckets used on the roster preview page, reused here so the
// WhatsApp text groups players exactly the way the rest of the app does.
const POSITION_GROUPS: { key: string; labelKey: string; positions: string[] }[] = [
  { key: 'att', labelKey: 'preview.attackers', positions: ['ST', 'CF', 'LW', 'RW', 'SS', 'FW', 'LS', 'RS'] },
  { key: 'mid', labelKey: 'preview.midfielders', positions: ['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM'] },
  { key: 'def', labelKey: 'preview.defenders', positions: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'WB'] },
  { key: 'gk', labelKey: 'preview.goalkeepers', positions: ['GK'] },
];

function groupForPosition(position?: string) {
  const p = (position ?? '').toUpperCase();
  return POSITION_GROUPS.find((g) => g.positions.includes(p)) ?? POSITION_GROUPS[1]; // default: midfielders
}

const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  leftTeam,
  rightTeam,
  onSkip,
  onAnnounce,
}) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const emailCount = [...leftTeam, ...rightTeam].filter((p) => p.email).length;

  const validateFields = () => {
    const missing: string[] = [];
    if (!location.trim()) missing.push(t('mdm.location'));
    if (!date) missing.push(t('mdm.date'));
    if (!time) missing.push(t('mdm.time'));
    if (missing.length > 0) {
      setError(t('auth.fillFields', { fields: missing.join(', ') }));
      return false;
    }
    setError('');
    return true;
  };

  const handleAnnounce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;
    setSending(true);
    try {
      await onAnnounce({ location, date, time });
    } finally {
      setSending(false);
    }
  };

  // Builds a WhatsApp-friendly plain-text version of the same announcement the
  // email sends — same header/details/roster-by-position structure, using
  // WhatsApp's own *bold* / _italic_ markup in place of HTML.
  const buildWhatsAppText = () => {
    const renderTeam = (team: MatchPlayer[], label: string) => {
      const lines: string[] = [`*${label}*`];
      for (const group of POSITION_GROUPS) {
        const players = team.filter((p) => groupForPosition(p.preferredPosition).key === group.key);
        if (players.length === 0) continue;
        lines.push(`_${t(group.labelKey)}_`);
        for (const p of players) {
          lines.push(`• ${p.name}${p.preferredPosition ? ` (${p.preferredPosition})` : ''}`);
        }
      }
      return lines.join('\n');
    };

    return [
      `⚽ *CardTeur* — ${t('mdm.waHeader')}`,
      '',
      `📍 ${t('mdm.location')}: ${location}`,
      `📅 ${t('mdm.date')}: ${date}`,
      `🕐 ${t('mdm.time')}: ${time}`,
      '',
      renderTeam(leftTeam, t('match.teamA', { defaultValue: 'Team A' })),
      '',
      renderTeam(rightTeam, t('match.teamB', { defaultValue: 'Team B' })),
    ].join('\n');
  };

  const handleShareWhatsapp = () => {
    if (!validateFields()) return;
    const text = buildWhatsAppText();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mdm-backdrop">
      <div className="mdm-panel" role="dialog" aria-modal="true" aria-labelledby="mdm-title">
        <div className="mdm-header">
          <i className="bi bi-calendar2-check"></i>
          <h3 id="mdm-title">{t('mdm.title')}</h3>
        </div>

        <div className="mdm-autosave-note">
          <i className="bi bi-floppy-fill" />
          {t('mdm.autosaveNote')}
        </div>

        <p className="mdm-subtitle">
          <Trans
            i18nKey="mdm.subtitle"
            values={{ count: emailCount }}
            components={{ accent: <strong className="mdm-accent" /> }}
          />
        </p>

        <form onSubmit={handleAnnounce} noValidate>
          <div className="mdm-field">
            <label htmlFor="mdm-location">
              {t('mdm.location')} <span className="mdm-required">*</span>
            </label>
            <input
              id="mdm-location"
              className="mdm-input"
              placeholder={t('mdm.locationPh')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="mdm-field">
            <label htmlFor="mdm-date">
              {t('mdm.date')} <span className="mdm-required">*</span>
            </label>
            <input
              id="mdm-date"
              type="date"
              className="mdm-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="mdm-field">
            <label htmlFor="mdm-time">
              {t('mdm.time')} <span className="mdm-required">*</span>
            </label>
            <input
              id="mdm-time"
              type="time"
              className="mdm-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {error && <p className="mdm-error">{error}</p>}

          <button
            type="button"
            className="btn btn-ct mdm-whatsapp-btn"
            onClick={handleShareWhatsapp}
            disabled={sending}
          >
            <i className="bi bi-whatsapp"></i>
            {t('mdm.shareWhatsapp')}
          </button>

          <div className="mdm-actions">
            <button
              type="button"
              className="btn btn-ct active-mode"
              onClick={onSkip}
              disabled={sending}
            >
              {t('mdm.skip')}
            </button>
            <button
              type="submit"
              className="btn btn-ct"
              disabled={sending}
            >
              {sending ? (
                <>
                  <span className="mdm-spinner"></span>
                  {t('mdm.sending')}
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i>
                  {t('mdm.saveAnnounce')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchDetailsModal;
