import { useEffect, useRef, useState } from 'react';
import './Dropdown.css';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

function Dropdown({ value, onChange, options, disabled, className, ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={rootRef} className={`ct-dropdown ${disabled ? 'ct-dropdown--disabled' : ''} ${className ?? ''}`}>
      <button
        type="button"
        className="ct-dropdown__trigger"
        onClick={() => !disabled && setOpen(prev => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="ct-dropdown__value">{selected?.label ?? ''}</span>
        <i className={`bi bi-chevron-down ct-dropdown__arrow ${open ? 'ct-dropdown__arrow--open' : ''}`} />
      </button>
      {open && (
        <ul className="ct-dropdown__list" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`ct-dropdown__option ${opt.value === value ? 'ct-dropdown__option--selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.value === value && <i className="bi bi-check2 ct-dropdown__check" />}
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dropdown;
