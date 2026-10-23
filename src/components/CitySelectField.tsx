'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

export const COMMON_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Sargodha',
  'Bahawalpur', 'Sukkur', 'Larkana', 'Sheikhupura', 'Rahim Yar Khan',
  'Mardan', 'Gujrat', 'Abbottabad', 'Mingora', 'Mirpur Khas', 'Nawabshah',
  'Okara', 'Kasur', 'Jhelum', 'Dera Ghazi Khan', 'Gwadar', 'Muzaffarabad',
  'Gilgit', 'Skardu',
];
const CUSTOM = '__custom_city__';

type CitySelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
};

/** Searchable-by-native-select city list with an explicit free-text custom-city mode. */
export const CitySelectField: React.FC<CitySelectFieldProps> = ({
  value,
  onChange,
  disabled = false,
  id,
  placeholder = 'Select city',
  className = '',
}) => {
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    if (value && !COMMON_CITIES.some((city) => city.toLowerCase() === value.trim().toLowerCase())) {
      setCustomMode(true);
    } else if (value) {
      setCustomMode(false);
    }
  }, [value]);

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="relative min-w-0">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <select
          id={id}
          disabled={disabled}
          value={customMode ? CUSTOM : value || ''}
          onChange={(event) => {
            if (event.target.value === CUSTOM) {
              setCustomMode(true);
              onChange('');
            } else {
              setCustomMode(false);
              onChange(event.target.value);
            }
          }}
          className={`w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 min-h-[40px] ${className}`}
        >
          <option value="">{placeholder}</option>
          {value && !customMode && !COMMON_CITIES.some((city) => city.toLowerCase() === value.trim().toLowerCase()) && (
            <option value={value}>{value}</option>
          )}
          {COMMON_CITIES.map((city) => <option value={city} key={city}>{city}</option>)}
          <option value={CUSTOM}>＋ Enter a custom city…</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
      </div>
      {customMode && (
        <input
          aria-label="Custom city"
          disabled={disabled}
          autoComplete="address-level2"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type any city or service area"
          className="w-full min-w-0 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 min-h-[40px]"
        />
      )}
    </div>
  );
};
