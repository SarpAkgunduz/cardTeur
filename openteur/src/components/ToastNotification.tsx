import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

interface ToastNotificationProps {
  show: boolean;
  message: string;
  onClose: () => void;
  variant?: 'success' | 'danger' | 'warning' | 'info';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ show, message, onClose, variant = 'success' }) => {
  return (
    <ToastContainer position="bottom-end" className="p-3" style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 9999 }}>
      <Toast onClose={onClose} show={show} delay={5000} autohide={true} bg={variant}>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default ToastNotification;
