import React, { useEffect, useState } from 'react';

// Simple free IP geolocation API (can be swapped for a paid one for production)
const GEO_API = 'https://ipapi.co/json/';

const countryCurrencyMap = {
  US: 'USD',
  GB: 'GBP',
  NG: 'NGN',
  CA: 'CAD',
  EU: 'EUR',
  IN: 'INR',
  // ...add more as needed
};

export default function CountryCurrencySelector({ onConfirm }) {
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(GEO_API)
      .then(res => res.json())
      .then(data => {
        setCountry(data.country_code || '');
        setCurrency(countryCurrencyMap[data.country_code] || '');
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError('Could not detect your country automatically.');
      });
  }, []);

  const handleConfirm = () => {
    if (onConfirm) onConfirm({ country, currency });
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Confirm Your Country & Currency</h2>
      {loading ? (
        <div>Detecting location...</div>
      ) : (
        <>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <div style={{ margin: '1rem 0' }}>
            <label>Country:&nbsp;
              <input value={country} onChange={e => setCountry(e.target.value.toUpperCase())} maxLength={2} style={{ width: 60 }} />
            </label>
          </div>
          <div style={{ margin: '1rem 0' }}>
            <label>Currency:&nbsp;
              <input value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} maxLength={3} style={{ width: 60 }} />
            </label>
          </div>
          <button onClick={handleConfirm} style={{ padding: '0.5rem 1.5rem' }}>Confirm</button>
        </>
      )}
    </div>
  );
}
