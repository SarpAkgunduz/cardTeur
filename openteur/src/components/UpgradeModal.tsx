import React from 'react';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './UpgradeModal.css';

interface UpgradeModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ show, onClose, title, message }) => {
  const navigate = useNavigate();

  return (
    <Modal show={show} onHide={onClose} centered contentClassName="upgrade-modal">
      <div className="upgrade-modal__body">
        <div className="upgrade-modal__icon">
          <i className="bi bi-stars"></i>
        </div>
        <h3 className="upgrade-modal__title">{title ?? 'You have hit a Free plan limit'}</h3>
        <p className="upgrade-modal__message">
          {message ?? 'Upgrade to Premium to raise this limit and unlock more of CardTeur.'}
        </p>
        <div className="upgrade-modal__actions">
          <button
            type="button"
            className="btn btn-ct upgrade-modal__cta"
            onClick={() => { onClose(); navigate('/pricing'); }}
          >
            <i className="bi bi-arrow-up-circle-fill" style={{ marginRight: 8 }}></i>
            See plans
          </button>
          <button type="button" className="btn btn-ct upgrade-modal__dismiss" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradeModal;
