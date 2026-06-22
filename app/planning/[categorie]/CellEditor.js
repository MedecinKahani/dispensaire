'use client';

import React, { useState } from 'react';
import { ArrowRightToLine } from 'lucide-react';

export default function CellEditor({ codes, value, date, onChange, onFillRange, onClose, agents = [], onSetGuide }) {
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeEnd, setRangeEnd] = useState('');
  const [pendingCode, setPendingCode] = useState(null);
  const [guideMode, setGuideMode] = useState(false); // étape guide après DEB
  const [selectedGuideId, setSelectedGuideId] = useState('');

  if (guideMode) {
    return (
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', zIndex: 40, top: '100%', left: 0, marginTop: 4,
          background: '#fff', border: '1px solid #E5E1D8', borderRadius: 10,
          boxShadow: '0 8px 28px rgba(0,0,0,0.16)', padding: 14, width: 240,
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: '#1A2B3D', margin: '0 0 8px 0' }}>
          Qui montre le service ?
        </p>
        <select
          value={selectedGuideId}
          onChange={e => setSelectedGuideId(e.target.value)}
          style={{
            width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E1D8',
            fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box'
          }}
        >
          <option value="">— Personne (optionnel) —</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>
              {a.nomFamille ? `${a.nomFamille} ${a.prenom || ''}`.trim() : (a.nom || a.id)}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => { onChange(pendingCode); onClose(); }}
            style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid #E5E1D8', background: '#fff', color: '#5B6573', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Passer
          </button>
          <button
            onClick={() => {
              onChange(pendingCode);
              if (selectedGuideId && onSetGuide) onSetGuide(date, selectedGuideId);
              onClose();
            }}
            style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: '#1A2B3D', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Valider
          </button>
        </div>
      </div>
    );
  }

  if (rangeMode) {
    return (
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', zIndex: 40, top: '100%', left: 0, marginTop: 4,
          background: '#fff', border: '1px solid #E5E1D8', borderRadius: 10,
          boxShadow: '0 8px 28px rgba(0,0,0,0.16)', padding: 14, width: 240,
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: '#1A2B3D', margin: '0 0 8px 0' }}>
          Appliquer « {pendingCode} » jusqu'au :
        </p>
        <input
          type="date"
          value={rangeEnd}
          min={date}
          onChange={e => setRangeEnd(e.target.value)}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E1D8',
            fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => { setRangeMode(false); }}
            style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid #E5E1D8', background: '#fff', color: '#5B6573', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            disabled={!rangeEnd}
            onClick={() => { onFillRange(date, rangeEnd, pendingCode); onClose(); }}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 7, border: 'none',
              background: rangeEnd ? '#1A2B3D' : '#D1D5DB', color: '#fff', fontSize: 12.5,
              fontWeight: 600, cursor: rangeEnd ? 'pointer' : 'not-allowed'
            }}
          >
            Appliquer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', zIndex: 40, top: '100%', left: 0, marginTop: 4,
        background: '#fff', border: '1px solid #E5E1D8', borderRadius: 10,
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)', padding: 8, width: 250,
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4
      }}
    >
      <button
        onClick={() => { onChange(''); onClose(); }}
        style={{
          gridColumn: '1 / -1', padding: '6px 8px', borderRadius: 6, border: '1px dashed #D1D5DB',
          background: '#fff', color: '#9CA3AF', fontSize: 12, fontWeight: 600, cursor: 'pointer'
        }}
      >
        Effacer la case
      </button>
      {codes.map(c => (
        <div key={c.code} style={{ position: 'relative', display: 'flex' }}>
          <button
            onClick={() => {
              // Si DEB et qu'on a des agents, ouvrir le popup guide AVANT d'appeler onChange
              if (c.code === 'DEB' && agents.length > 0 && onSetGuide) {
                setPendingCode(c.code);
                setGuideMode(true);
              } else {
                onChange(c.code);
                onClose();
              }
            }}
            title={c.label + (c.detail ? ` (${c.detail})` : '')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              padding: '6px 6px', borderRadius: '6px 0 0 6px', border: `1.5px solid ${value === c.code ? c.color : '#E5E1D8'}`,
              borderRight: 'none',
              background: value === c.code ? c.bg : '#fff', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.code}</span>
          </button>
          <button
            onClick={() => { setPendingCode(c.code); setRangeMode(true); }}
            title="Appliquer sur plusieurs jours"
            style={{
              width: 22, border: `1.5px solid ${value === c.code ? c.color : '#E5E1D8'}`,
              borderRadius: '0 6px 6px 0', background: value === c.code ? c.bg : '#FAFAF8',
              color: c.color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <ArrowRightToLine size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}
