'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope } from 'lucide-react';

const PIN_CORRECT = '9876';
const PIN_KEY = 'kahani_medecin_auth';

export default function PinGateMedecin({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(PIN_KEY) === '1');
    setChecked(true);
  }, []);

  const handleSubmit = () => {
    if (pin === PIN_CORRECT) {
      sessionStorage.setItem(PIN_KEY, '1');
      setUnlocked(true);
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  if (!checked) return null;
  if (unlocked) return children;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F6F2'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 40,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)', width: 320, textAlign: 'center'
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: '#0F766E',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
        }}>
          <Stethoscope size={22} color="#fff" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A2B3D', margin: '0 0 6px' }}>
          CMR Kahani
        </h2>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 24px' }}>
          Code d'accès médecins
        </p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="• • • •"
          maxLength={4}
          autoFocus
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
            border: `2px solid ${error ? '#C2410C' : '#E5E1D8'}`,
            fontSize: 20, textAlign: 'center', letterSpacing: '0.3em',
            outline: 'none', marginBottom: 14, transition: 'border-color 0.2s',
            fontFamily: 'monospace'
          }}
        />
        {error && (
          <p style={{ fontSize: 12, color: '#C2410C', margin: '-8px 0 10px', fontWeight: 600 }}>
            Code incorrect
          </p>
        )}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
            background: '#0F766E', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer'
          }}
        >
          Accéder
        </button>
      </div>
    </div>
  );
}
