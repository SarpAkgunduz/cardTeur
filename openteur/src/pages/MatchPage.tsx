import { useState } from 'react';
import BackButton from '../components/BackButton';

const MatchPage = () => {
  const [selectedMode, setSelectedMode] = useState<'advance' | 'standard' | null>(null);

  const handleModeSelect = (mode: 'advance' | 'standard') => {
    setSelectedMode(mode);
    // Burada maç kurulumu başlayacak
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <div className="back-button-container">
            <BackButton position="static" />
          </div>
          <h1 className="page-title">Select Match Mode</h1>
        </div>
        
        <div className="content-card">
          <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="gradient-button"
              style={{ 
                padding: '40px', 
                fontSize: '1.3rem', 
                minWidth: '250px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '15px'
              }}
              onClick={() => handleModeSelect('advance')}
            >
              <div style={{ fontSize: '3rem' }}>⚡</div>
              <h2 style={{ margin: 0 }}>Advance Match</h2>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Detailed statistics and advanced tactics</p>
            </button>

            <button 
              className="gradient-button"
              style={{ 
                padding: '40px', 
                fontSize: '1.3rem', 
                minWidth: '250px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '15px'
              }}
              onClick={() => handleModeSelect('standard')}
            >
              <div style={{ fontSize: '3rem' }}>⚽</div>
              <h2 style={{ margin: 0 }}>Standard Match</h2>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Quick match with basic rules</p>
            </button>
          </div>

          {selectedMode && (
            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '1.2rem', color: '#4A7C9B' }}>
              <p>Selected: <strong>{selectedMode === 'advance' ? 'Advance Match' : 'Standard Match'}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchPage;
  