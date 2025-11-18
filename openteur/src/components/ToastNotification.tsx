import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

interface ToastNotificationProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ show, message, onClose }) => {
  return (
    <ToastContainer position="bottom-end" className="p-3">
      <Toast onClose={onClose} show={show} delay={5000} autohide={true} bg="success">
        <Toast.Body>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default ToastNotification;
