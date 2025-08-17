import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CountryCurrencySelector from '../components/CountryCurrencySelector';

export default function CountryCurrencyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleConfirm = ({ country, currency }: { country: string; currency: string }) => {
    // Optionally, save to backend here
    navigate('/payment', {
      state: {
        ...location.state,
        country,
        currency,
      },
    });
  };

  return <CountryCurrencySelector onConfirm={handleConfirm} />;
}
