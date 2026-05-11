import React, { useState } from 'react';
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

  const emailCount = [...leftTeam, ...rightTeam].filter((p) => p.email).length;

  const handleAnnounce = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!location.trim()) missing.push('Location');
    if (!date) missing.push('Date');
    if (!time) missing.push('Time');
    if (missing.length > 0) {
      setError(`Please fill: ${missing.join(', ')}`);
      return;
    }
    setError('');
    setSending(true);
    try {
      await onAnnounce({ location, date, time });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mdm-backdrop">
      <div className="mdm-panel" role="dialog" aria-modal="true" aria-labelledby="mdm-title">
        <div className="mdm-header">
          <i className="bi bi-calendar2-check"></i>
          <h3 id="mdm-title">Match Details</h3>
        </div>

        <p className="mdm-subtitle">
          Fill in the match info. Emails will be sent to{' '}
          <strong className="mdm-accent">{emailCount}</strong> player
          {emailCount !== 1 ? 's' : ''} who have an email address.
        </p>

        <form onSubmit={handleAnnounce} noValidate>
          <div className="mdm-field">
            <label htmlFor="mdm-location">
              Location <span className="mdm-required">*</span>
            </label>
            <input
              id="mdm-location"
              className="mdm-input"
              placeholder="e.g. City Sports Center, Pitch 3"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="mdm-field">
            <label htmlFor="mdm-date">
              Date <span className="mdm-required">*</span>
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
              Time <span className="mdm-required">*</span>
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

          <div className="mdm-actions">
            <button
              type="button"
              className="btn btn-ct active-mode"
              onClick={onSkip}
              disabled={sending}
            >
              Skip
            </button>
            <button
              type="submit"
              className="btn btn-ct"
              disabled={sending}
            >
              {sending ? (
                <>
                  <span className="mdm-spinner"></span>
                  Sending...
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i>
                  Save &amp; Announce
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
