import { useNavigate, useLocation } from 'react-router-dom';

const PARENT_ROUTES: Record<string, string> = {
  '/add': '/manage',
  '/edit-player': '/manage',
  '/preview': '/',
  '/match': '/',
  '/manage': '/',
};

const BackButton = ({
  parent,
  fallback = '/',
  position = 'static',
  top = '20px',
  right = '20px',
  className = ''
}: {
  parent?: string;
  fallback?: string;
  position?: 'static' | 'absolute';
  top?: string;
  right?: string;
  className?: string;
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Find the parent route based on the current pathname
  // Example: '/edit-player/abc123' → '/manage'
  const routeEntries = Object.entries(PARENT_ROUTES);
  const matchedEntry = routeEntries.find(function(pair) {
    const routeKey = pair[0];
    return location.pathname.startsWith(routeKey);
  });
  const matchedParent = matchedEntry !== undefined ? matchedEntry[1] : undefined;

  // If parent prop is provided use it, otherwise use the one found from the map
  const resolvedParent = parent !== undefined ? parent : matchedParent;

  const handleClick = () => {
    // 1) parent route takes priority
    if (resolvedParent !== undefined) {
      navigate(resolvedParent);
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
        className={`btn btn-ct ${className}`}
        onClick={handleClick}
      >
        <i className="bi bi-arrow-left-circle-fill" style={{ marginRight: 8, fontSize: '1.1em' }}></i>
        Back
      </button>
    </div>
  );
};

export default BackButton;
