'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function AddAgentRow({ onAdd, color }) {
  const [adding, setAdding] = useState(false);
  const [nom, setNom] = useState('');
  const [arrivee, setArrivee] = useState('');
  const [depart, setDepart] = useState('');

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          borderRadius: 999, border: `1.5px dashed ${color}`, background: '#fff',
          color, fontSize: 13, fontWeight: 600, cursor: 'pointer'
        }}
      >
        <Plus size={14} strokeWidth={2.5} /> Ajouter un agent
      </button>
    );
  }

  const submit = () => {
    if (nom.trim()) onAdd(nom.trim(), arrivee || null, depart || null);
    setNom(''); setArrivee(''); setDepart('');
    setAdding(false);
  };

  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap',
      background: '#fff', border: '1px solid #E5E1D8', borderRadius: 10, padding: 10
    }}>
      <div>
        <label style={labelStyle}>Nom</label>
        <input
          autoFocus
          value={nom}
          onChange={e => setNom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false); }}
          placeholder="Nom de l'agent"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Arrivée (optionnel)</label>
        <input type="date" value={arrivee} onChange={e => setArrivee(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Départ (optionnel)</label>
        <input type="date" value={depart} onChange={e => setDepart(e.target.value)} style={inputStyle} />
      </div>
      <button onClick={submit} style={{ ...iconBtnStyle, background: '#1A2B3D' }}>
        <Plus size={15} color="#fff" />
      </button>
      <button onClick={() => setAdding(false)} style={iconBtnStyle}>
        <X size={15} color="#5B6573" />
      </button>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 10.5, fontWeight: 600, color: '#9CA3AF', marginBottom: 3 };
const inputStyle = {
  padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E1D8',
  fontSize: 13, outline: 'none', width: 150
};
const iconBtnStyle = {
  background: '#F7F6F2', border: '1px solid #E5E1D8', borderRadius: 8,
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0
};
