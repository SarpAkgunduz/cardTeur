import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import ToastNotification from '../components/ToastNotification';
import StatGrid from '../components/StatGrid';
import { usePlayerForm } from '../hooks/usePlayerForm';
import { usePlayerDisplay } from '../hooks/usePlayerDisplay';
import './AddPlayerForm.css';

const AddPlayerForm = () => {
  const { t } = useTranslation();
  const {
    isEditMode,
    name, setName,
    cardImage, setCardImage,
    jerseyNumber, setJerseyNumber,
    marketValue, setMarketValue,
    preferredPosition, setPreferredPosition,
    activeStatTab, setActiveStatTab,
    offensiveOverall, defensiveOverall, athleticismOverall, gkOverall,
    cardTitle,
    linkedUserId, setLinkedUserId,
    userOptions,
    gkFields, offensiveFields, defensiveFields, athleticismFields,
    showToast, setShowToast, toastMsg,
    handleSubmit,
  } = usePlayerForm();
  const {
    playerPhotoOptions,
    getLinkedUser,
    getLinkedUserPhoto,
    isLinkedPlayer,
  } = usePlayerDisplay();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [draftPhoto, setDraftPhoto] = useState('');

  const linkedUser = getLinkedUser(linkedUserId, userOptions);
  const linkedUserPhoto = getLinkedUserPhoto(linkedUserId, userOptions);
  const isLinkedToUser = isLinkedPlayer(linkedUserId);

  const openPhotoModal = () => {
    if (isLinkedToUser) return;
    setDraftPhoto(cardImage);
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
  };

  const selectDraftPhoto = () => {
    setCardImage(draftPhoto);
    setIsPhotoModalOpen(false);
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <ToastNotification
          show={showToast}
          message={toastMsg}
          onClose={() => setShowToast(false)}
        />

        <div className="content-card">
          <div className="back-button-container" style={{ marginBottom: '20px' }}>
            <BackButton position="static" />
          </div>

          <h2 className="page-title" style={{ marginBottom: '30px' }}>
            {isEditMode ? t('playerForm.editTitle') : t('playerForm.createTitle')}
          </h2>

          <form onSubmit={handleSubmit}>

            {/* ── SECTION 1: IDENTITY ── */}
            <div className="form-section">
              <div className="form-section-header">
                <i className="bi bi-person-badge-fill"></i>
                <span>{t('playerForm.identity')}</span>
              </div>
              <div className="identity-grid">
                <div className="stat-field">
                  <label htmlFor="name">{t('playerForm.playerName')}</label>
                  <input
                    id="name"
                    className="form-control-dark"
                    placeholder={t('playerForm.playerNamePh')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="stat-field">
                  <label htmlFor="jerseyNumber">{t('playerForm.jerseyNumber')}</label>
                  <input
                    id="jerseyNumber"
                    className="form-control-dark"
                    placeholder={t('playerForm.jerseyPh')}
                    type="number"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                  />
                </div>
                <div className="stat-field">
                  <label htmlFor="marketValue">{t('playerForm.marketValue')}</label>
                  <input
                    id="marketValue"
                    type="number"
                    min={0}
                    className="form-control-dark"
                    placeholder={t('playerForm.marketValuePh')}
                    value={marketValue}
                    onChange={(e) => setMarketValue(e.target.value)}
                  />
                </div>
                <div className="stat-field">
                  <label htmlFor="preferredPosition">{t('playerForm.preferredPosition')}</label>
                  <select
                    id="preferredPosition"
                    className="form-select-dark"
                    value={preferredPosition}
                    onChange={(e) => {
                      setPreferredPosition(e.target.value);
                      setActiveStatTab(e.target.value === 'GK' ? 'gk' : 'offensive');
                    }}
                  >
                    <option value="">-- Choose --</option>
                    <option value="ST">Striker (ST)</option>
                    <option value="LW">Left Winger (LW)</option>
                    <option value="RW">Right Winger (RW)</option>
                    <option value="CAM">Attacking Mid (CAM)</option>
                    <option value="CM">Central Mid (CM)</option>
                    <option value="CDM">Defensive Mid (CDM)</option>
                    <option value="LB">Left Back (LB)</option>
                    <option value="RB">Right Back (RB)</option>
                    <option value="CB">Center Back (CB)</option>
                    <option value="GK">Goalkeeper (GK)</option>
                    <option value="LM">Left Mid (LM)</option>
                    <option value="RM">Right Mid (RM)</option>
                  </select>
                </div>
                <div className="stat-field full-width">
                  <label>{t('playerForm.linkToUser')}</label>
                  <div className="user-picker-grid">
                    {userOptions.map((u) => {
                      const isLinked = linkedUserId === u.uid;
                      return (
                        <button
                          key={u.uid}
                          type="button"
                          className={`user-picker-item ${isLinked ? 'user-picker-item--selected' : ''}`}
                          onClick={() => {
                            if (isLinked) {
                              setLinkedUserId('');
                            } else {
                              setLinkedUserId(u.uid);
                            }
                          }}
                          aria-label={u.displayName}
                        >
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="user-picker-avatar" />
                          ) : (
                            <div className="user-picker-avatar user-picker-avatar--placeholder">
                              <i className="bi bi-person-fill" />
                            </div>
                          )}
                          <span className="user-picker-name">{u.displayName}</span>
                          {isLinked && <div className="user-picker-check"><i className="bi bi-check-circle-fill" /></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="stat-field full-width">
                  <label>{t('playerForm.photo')} {linkedUserId && <span className="photo-linked-note">(managed from linked account)</span>}</label>
                  <div className={`photo-selector ${isLinkedToUser ? 'photo-selector--locked' : ''}`}>
                    <div className="photo-selector__preview">
                      {isLinkedToUser && linkedUserPhoto ? (
                        <img src={linkedUserPhoto} alt={`${linkedUser?.displayName ?? 'Linked account'} profile`} />
                      ) : cardImage ? (
                        <img src={cardImage} alt="Selected player" />
                      ) : (
                        <i className={isLinkedToUser ? 'bi bi-person-circle' : 'bi bi-person-bounding-box'} />
                      )}
                    </div>
                    <div className="photo-selector__meta">
                      <span className="photo-selector__title">
                        {isLinkedToUser && linkedUserPhoto
                          ? 'Linked account photo'
                          : cardImage
                            ? 'Photo selected'
                            : 'No photo selected'}
                      </span>
                      <span className="photo-selector__hint">
                        {isLinkedToUser && linkedUserPhoto
                          ? 'Photo selection is managed from the linked account profile.'
                          : isLinkedToUser
                            ? 'The linked account has no profile photo, so this player keeps the saved system photo.'
                          : 'Open the gallery to choose from all player photos.'}
                      </span>
                    </div>
                    <div className="photo-selector__actions">
                      {!isLinkedToUser && (
                        <>
                          <button
                            type="button"
                            className="photo-selector__btn"
                            onClick={openPhotoModal}
                          >
                            <i className="bi bi-images" /> {t('playerForm.choosePhoto')}
                          </button>
                          {cardImage && (
                            <button
                              type="button"
                              className="photo-selector__btn photo-selector__btn--ghost"
                              onClick={() => setCardImage('')}
                            >
                              Clear
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 2–4: STATS (tabbed) ── */}
            <div className="form-section">
              {/* Tab bar */}
              <div className="stat-tabs">
                {preferredPosition === 'GK' && (
                  <button
                    type="button"
                    className={`stat-tab ${activeStatTab === 'gk' ? 'active' : ''}`}
                    onClick={() => setActiveStatTab('gk')}
                  >
                    <i className="bi bi-shield-shaded me-1"></i>GK Stats
                  </button>
                )}
                <button
                  type="button"
                  className={`stat-tab ${activeStatTab === 'offensive' ? 'active' : ''}`}
                  onClick={() => setActiveStatTab('offensive')}
                >
                  <i className="bi bi-lightning-fill me-1"></i>{t('playerForm.offensive')}
                </button>
                <button
                  type="button"
                  className={`stat-tab ${activeStatTab === 'defensive' ? 'active' : ''}`}
                  onClick={() => setActiveStatTab('defensive')}
                >
                  <i className="bi bi-shield-fill me-1"></i>{t('playerForm.defensive')} &amp; {t('playerForm.athleticism')}
                </button>
              </div>

              {/* GK Stats tab */}
              {activeStatTab === 'gk' && preferredPosition === 'GK' && (
                <StatGrid fields={gkFields} style={{ marginTop: 16 }} />
              )}

              {/* Offensive Stats tab */}
              {activeStatTab === 'offensive' && (
                <StatGrid fields={offensiveFields} style={{ marginTop: 16 }} />
              )}

              {/* Defensive & Athleticism tab */}
              {activeStatTab === 'defensive' && (
                <>
                  <p className="stat-subheader" style={{ marginTop: 16 }}>{t('playerForm.defensive')}</p>
                  <StatGrid fields={defensiveFields} />
                  <p className="stat-subheader" style={{ marginTop: 24 }}>{t('playerForm.athleticism')}</p>
                  <StatGrid fields={athleticismFields} />
                </>
              )}
            </div>

            {/* ── SECTION 5: SUMMARY & SUBMIT ── */}
            <div className="form-section">
              <div className="form-section-header">
                <i className="bi bi-clipboard-check-fill"></i>
                <span>{t('playerForm.summary')}</span>
              </div>

              <div className="overall-badges-row">
                {preferredPosition === 'GK' ? (
                  <div className="overall-badge">
                    <span className="badge-title">{t('playerForm.goalkeeper')}</span>
                    <span className="badge-value">{gkOverall}</span>
                    <span className="badge-label">{t('playerForm.ovr')}</span>
                  </div>
                ) : (
                  <>
                    <div className="overall-badge">
                      <span className="badge-title">{t('playerForm.offensive')}</span>
                      <span className="badge-value">{offensiveOverall}</span>
                      <span className="badge-label">{t('playerForm.ovr')}</span>
                    </div>
                    <div className="overall-badge">
                      <span className="badge-title">{t('playerForm.defensive')}</span>
                      <span className="badge-value">{defensiveOverall}</span>
                      <span className="badge-label">{t('playerForm.ovr')}</span>
                    </div>
                    <div className="overall-badge">
                      <span className="badge-title">{t('playerForm.athleticism')}</span>
                      <span className="badge-value">{athleticismOverall}</span>
                      <span className="badge-label">{t('playerForm.ovr')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="card-title-row">
                <span className={`card-title-pill ${cardTitle}`}>
                  {cardTitle.charAt(0).toUpperCase() + cardTitle.slice(1)}
                </span>
              </div>

              <div className="form-submit-row">
                <button type="submit" className="btn btn-ct">
                  <i className={`bi ${isEditMode ? 'bi-pencil-fill' : 'bi-person-plus-fill'} me-2`}></i>
                  {isEditMode ? t('common.save') : t('players.addPlayer')}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {isPhotoModalOpen && (
        <div className="photo-modal" role="dialog" aria-modal="true" aria-label="Choose player photo">
          <button className="photo-modal__backdrop" type="button" onClick={closePhotoModal} aria-label="Close photo selector" />
          <div className="photo-modal__panel">
            <div className="photo-modal__header">
              <div>
                <div className="photo-modal__eyebrow">{t('playerForm.photo')}</div>
                <h3 className="photo-modal__title">{t('playerForm.choosePhoto')}</h3>
              </div>
              <button className="photo-modal__close" type="button" onClick={closePhotoModal} aria-label="Close">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="photo-modal__body">
              <aside className="photo-modal__selected">
                <div className="photo-modal__selected-frame">
                  {draftPhoto ? (
                    <img src={draftPhoto} alt="Selected draft player" />
                  ) : (
                    <i className="bi bi-person-bounding-box" />
                  )}
                </div>
                <span>{draftPhoto ? 'Ready to select' : 'No photo selected'}</span>
              </aside>

              <div className="photo-modal__grid">
                {playerPhotoOptions.map((src, index) => {
                  const selected = draftPhoto === src;
                  return (
                    <button
                      key={src}
                      type="button"
                      className={`photo-picker-item ${selected ? 'photo-picker-item--selected' : ''}`}
                      onClick={() => setDraftPhoto(src)}
                      aria-label={`Player photo ${index + 1}`}
                    >
                      <img src={src} alt={`player ${index + 1}`} />
                      {selected && (
                        <div className="photo-picker-check">
                          <i className="bi bi-check-circle-fill" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="photo-modal__footer">
              <button type="button" className="photo-modal__btn photo-modal__btn--ghost" onClick={closePhotoModal}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="photo-modal__btn"
                onClick={selectDraftPhoto}
                disabled={!draftPhoto}
              >
                Select Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPlayerForm;
