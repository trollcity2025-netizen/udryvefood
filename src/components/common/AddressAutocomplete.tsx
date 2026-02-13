'use client';

import { useMemo, useState } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { useLoadScript } from '@react-google-maps/api';

interface AddressAutocompleteProps {
  onSelect: (address: string, lat: number, lng: number) => void;
  onInputChange?: (value: string) => void;
  defaultValue?: string;
}

export default function AddressAutocomplete({ onSelect, onInputChange, defaultValue = '' }: AddressAutocompleteProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isMock = !apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY';

  if (isMock) {
    return <MockAddressInput onSelect={onSelect} onInputChange={onInputChange} defaultValue={defaultValue} />;
  }

  return <GoogleAddressInput apiKey={apiKey} onSelect={onSelect} onInputChange={onInputChange} defaultValue={defaultValue} />;
}

function MockAddressInput({ onSelect, onInputChange, defaultValue }: AddressAutocompleteProps) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    if (onInputChange) onInputChange(val);
    
    // Simulate selection on change or debounce it (simplified for mock)
    // We'll just provide a fake lat/lng for any address entered
    onSelect(val, 40.7128, -74.0060); // Default to NYC
  };

  return (
    <div className="relative">
       <input
        value={value}
        onChange={handleChange}
        className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border transition-all text-slate-900 placeholder:text-slate-400"
        placeholder="Enter your address (Mock Mode)"
        autoComplete="street-address"
      />
      <p className="text-xs text-orange-600 mt-1">Google Maps API not configured. Using mock address mode.</p>
    </div>
  );
}

function GoogleAddressInput({ apiKey, onSelect, onInputChange, defaultValue }: AddressAutocompleteProps & { apiKey: string }) {
  const libraries = useMemo(() => ['places'], []);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: libraries as any,
  });

  if (!isLoaded) return <div className="p-3 border rounded-lg bg-slate-50 text-slate-500 text-sm">Loading address search...</div>;

  return <PlacesAutocomplete onSelect={onSelect} onInputChange={onInputChange} defaultValue={defaultValue} />;
}

function PlacesAutocomplete({ onSelect, onInputChange, defaultValue }: AddressAutocompleteProps) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'us' },
    },
    debounce: 300,
    defaultValue,
    initOnMount: !!defaultValue,
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (onInputChange) {
      onInputChange(e.target.value);
    }
  };

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect(address, lat, lng);
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={handleInput}
        disabled={!ready}
        className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border transition-all text-slate-900 placeholder:text-slate-400"
        placeholder="Search for your delivery address..."
        autoComplete="off"
      />
      {status === 'OK' && (
        <ul className="absolute z-50 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm mt-1">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="cursor-pointer select-none relative py-3 pl-3 pr-9 hover:bg-orange-50 text-slate-900 border-b border-slate-50 last:border-none"
            >
              <span className="block truncate">{description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
