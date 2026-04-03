import './AppFooter.css';

const TICKER_ITEMS = [
  { label: 'ROSTER', value: 'Active' },
  { label: 'MATCH ENGINE', value: 'Online' },
  { label: 'CARDTEUR', value: 'v1.0' },
  { label: 'ELITE SCOUTING', value: 'Enabled' },
];

const AppFooter = () => (
  <footer className="ct-footer">
    <div className="ct-footer__ticker">
      {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
        <div className="ct-footer__item" key={i}>
          <span className="ct-footer__label">{item.label}:</span>
          <span className="ct-footer__value">{item.value}</span>
        </div>
      ))}
    </div>
  </footer>
);

export default AppFooter;
