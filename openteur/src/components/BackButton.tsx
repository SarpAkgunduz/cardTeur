import { useNavigate, useLocation } from 'react-router-dom';

const BackButton = ({
  to,                 // optional target path (e.g. '/')
  fallback = '/',     // fallback if history can't go back
  position = 'static',
  top = '20px',
  right = '20px',
  className = ''
}: {
  to?: string;
  fallback?: string;
  position?: 'static' | 'absolute';
  top?: string;
  right?: string;
  className?: string;
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    // 1) explicit target wins
    if (to) {
      navigate(to);
      return;
    }

    // 2) try location.state.from (set when navigating to the current page)
    //    e.g. navigate('/match', { state: { from: '/add' } })
    const from = (location.state && (location.state as any).from) as string | undefined;
    if (from) {
      navigate(from);
      return;
    }

    // 3) fall back to history.back if available, otherwise fallback path
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <div
      style={
        position === 'absolute'
          ? { position: 'absolute', top, right }
          : {}
      }
    >
      <button
        className={`btn btn-secondary ${className} gradient-button`}
        onClick={handleClick}
      >
        ⬅️ Back
      </button>
    </div>
  );
};

export default BackButton;
