'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, ChevronDown, Loader2, Plus, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';

// Légende des codes du planning (cf. tableau mensuel de service du dispensaire)
const CODES = [
  { code: 'K1', label: 'Zone Centre K1', detail: '7h – 13h', color: '#0E7490', bg: '#EBF6F8' },
  { code: 'K2', label: 'Zone Centre K2', detail: '14h – 17h', color: '#0E7490', bg: '#EBF6F8' },
  { code: 'K3', label: 'Zone Centre K3', detail: '13h – 19h', color: '#0E7490', bg: '#EBF6F8' },
  { code: 'MAO', label: 'Médecin d\'accueil / tri', detail: '7h – 13h', color: '#B45309', bg: '#FEF3E2' },
  { code: 'KRO', label: 'Consultation chronique', detail: '7h – 13h', color: '#B45309', bg: '#FEF3E2' },
  { code: 'S', label: 'Consultation à Sada', detail: '7h – 13h', color: '#B45309', bg: '#FEF3E2' },
  { code: 'G', label: 'Garde', detail: '19h – 7h', color: '#C2410C', bg: '#FDF1EC' },
  { code: 'RS', label: 'Repos de garde', detail: '', color: '#65521E', bg: '#F8F2E6' },
  { code: 'CA', label: 'Congés', detail: '', color: '#15803D', bg: '#ECFDF3' },
  { code: 'CF', label: 'Congés', detail: '', color: '#15803D', bg: '#ECFDF3' },
  { code: 'ADM', label: 'Administratif (chef de service)', detail: '', color: '#5B21B6', bg: '#F2EBFB' },
  { code: 'DEB', label: 'Début de contrat', detail: '', color: '#1A2B3D', bg: '#EEF1F4' },
  { code: 'FIN', label: 'Fin de contrat', detail: '', color: '#1A2B3D', bg: '#EEF1F4' },
  { code: 'X', label: 'Avant / après contrat', detail: '', color: '#9CA3AF', bg: '#F3F4F6' },
];

const MOMENTS = [
  { id: 'M', label: 'Matin' },
  { id: 'AM', label: 'Après-midi' },
  { id: 'N', label: 'Nuit' },
];

function codeInfo(code) {
  return CODES.find(c => c.code === code);
}

function useePlanning() {
  const [planning, setPlanning] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/planning');
      const data = await res.json();
      setPlanning(data.planning || { medecins: [], cellules: {} });
    } catch (e) {
      setPlanning({ medecins: [], cellules: {} });
      setError('Impossible de charger le planning.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const call = useCallback(async (body) => {
    try {
      const res = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.error) {
        setError('Enregistrement impossible. Réessaie.');
        return null;
      }
      setPlanning(data.planning);
      setError(null);
      return data;
    } catch (e) {
      setError('Connexion perdue. Réessaie dans un instant.');
      return null;
    }
  }, []);

  const setCell = useCallback((medecinId, date, moment, code) => call({ action: 'setCell', medecinId, date, moment, code }), [call]);
  const addMedecin = useCallback((nom) => call({ action: 'addMedecin', nom }), [call]);
  const removeMedecin = useCallback((medecinId) => call({ action: 'removeMedecin', medecinId }), [call]);
  const renameMedecin = useCallback((medecinId, nom) => call({ action: 'renameMedecin', medecinId, nom }), [call]);

  return { planning, setCell, addMedecin, removeMedecin, renameMedecin, error };
}

function getDaysInMonth(year, month) {
  // month: 0-indexed
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const JOURS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function CellEditor({ value, onChange, onClose }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', zIndex: 30, top: '100%', left: 0, marginTop: 4,
        background: '#fff', border: '1px solid #E5E1D8', borderRadius: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: 8, width: 220,
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
      {CODES.map(c => (
        <button
          key={c.code}
          onClick={() => { onChange(c.code); onClose(); }}
          title={c.label + (c.detail ? ` (${c.detail})` : '')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${value === c.code ? c.color : '#E5E1D8'}`,
            background: value === c.code ? c.bg : '#fff', cursor: 'pointer', textAlign: 'left'
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.code}</span>
        </button>
      ))}
    </div>
  );
}

function PlanningTable({ medecin, year, month, cellules, onSetCell, editable }) {
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const [editing, setEditing] = useState(null); // `${date}|${moment}`

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #E5E1D8', borderRadius: 12 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
        <thead>
          <tr style={{ background: '#F7F6F2' }}>
            <th style={thStyle}>Jour</th>
            <th style={thStyle}>Date</th>
            {MOMENTS.map(m => <th key={m.id} style={thStyle}>{m.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {days.map(d => {
            const dk = dateKey(d);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <tr key={dk} style={{ background: isWeekend ? '#FBFAF7' : '#fff' }}>
                <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>{JOURS_FR[d.getDay()]}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1A2B3D' }}>{d.getDate()}</td>
                {MOMENTS.map(m => {
                  const cellId = `${dk}|${m.id}`;
                  const code = cellules[`${medecin.id}|${dk}|${m.id}`];
                  const info = code ? codeInfo(code) : null;
                  const isEditing = editing === cellId;
                  return (
                    <td key={m.id} style={{ ...tdStyle, position: 'relative', padding: 4 }}>
                      <button
                        onClick={() => editable && setEditing(isEditing ? null : cellId)}
                        disabled={!editable}
                        style={{
                          width: '100%', minHeight: 30, border: 'none', borderRadius: 7,
                          background: info ? info.bg : 'transparent',
                          color: info ? info.color : '#D1D5DB',
                          fontWeight: 700, fontSize: 12.5, cursor: editable ? 'pointer' : 'default',
                          padding: '5px 4px'
                        }}
                      >
                        {code || (editable ? '+' : '–')}
                      </button>
                      {isEditing && (
                        <CellEditor
                          value={code}
                          onChange={(newCode) => onSetCell(medecin.id, dk, m.id, newCode)}
                          onClose={() => setEditing(null)}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  padding: '10px 12px', textAlign: 'left', fontSize: 11.5, fontWeight: 700,
  color: '#5B6573', textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: '1px solid #E5E1D8', position: 'sticky', top: 0, background: '#F7F6F2'
};
const tdStyle = {
  padding: '6px 12px', fontSize: 13, borderBottom: '1px solid #F0EEE7'
};

function AddMedecinRow({ onAdd }) {
  const [adding, setAdding] = useState(false);
  const [nom, setNom] = useState('');

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
          borderRadius: 999, border: '1.5px dashed #C2410C', background: '#FDF1EC',
          color: '#C2410C', fontSize: 13, fontWeight: 600, cursor: 'pointer'
        }}
      >
        <Plus size={14} strokeWidth={2.5} /> Ajouter un médecin
      </button>
    );
  }

  const submit = () => {
    if (nom.trim()) onAdd(nom.trim());
    setNom('');
    setAdding(false);
  };

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        autoFocus
        value={nom}
        onChange={e => setNom(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false); }}
        placeholder="Nom du médecin"
        style={{
          padding: '7px 12px', borderRadius: 8, border: '1.5px solid #E5E1D8',
          fontSize: 13, outline: 'none', width: 180
        }}
      />
      <button onClick={submit} style={{ ...iconBtnStyle, background: '#1A2B3D' }}>
        <Plus size={15} color="#fff" />
      </button>
      <button onClick={() => setAdding(false)} style={iconBtnStyle}>
        <X size={15} color="#5B6573" />
      </button>
    </div>
  );
}

const iconBtnStyle = {
  background: '#F7F6F2', border: '1px solid #E5E1D8', borderRadius: 8,
  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0
};

export default function PlanningCaribou() {
  const { planning, setCell, addMedecin, removeMedecin, renameMedecin, error } = useePlanning();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedId, setSelectedId] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const medecins = planning?.medecins || [];
  const selected = medecins.find(m => m.id === selectedId) || medecins[0] || null;

  const changeMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };

  const loading = planning === null;

  return (
    <div style={{
      marginTop: 32, paddingTop: 28, borderTop: '1px solid #E5E1D8'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={19} color="#0F766E" />
          <h2 style={{
            fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 700,
            color: '#1A2B3D', margin: 0
          }}>
            Planning médical
          </h2>
        </div>
        <button
          onClick={() => setEditMode(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 999, border: `1.5px solid ${editMode ? '#0F766E' : '#E5E1D8'}`,
            background: editMode ? '#ECFAF8' : '#fff', color: editMode ? '#0F766E' : '#5B6573',
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Pencil size={13} /> {editMode ? 'Mode édition activé' : 'Modifier le planning'}
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, background: '#FDF1EC',
          border: '1px solid #F3C7B0', color: '#9A3412', padding: '10px 14px',
          borderRadius: 10, fontSize: 13, marginBottom: 16
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9CA3AF', padding: '24px 0', fontSize: 14 }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Chargement du planning…
        </div>
      ) : (
        <>
          {/* Sélecteur médecin + mois */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
              <select
                value={selected?.id || ''}
                onChange={e => setSelectedId(e.target.value)}
                style={{
                  width: '100%', padding: '9px 36px 9px 14px', borderRadius: 10,
                  border: '1.5px solid #E5E1D8', fontSize: 14, fontWeight: 600, color: '#1A2B3D',
                  background: '#fff', appearance: 'none', cursor: 'pointer', outline: 'none'
                }}
              >
                {medecins.length === 0 && <option value="">Aucun médecin enregistré</option>}
                {medecins.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
              <ChevronDown size={16} color="#9CA3AF" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F7F6F2', borderRadius: 10, padding: 4 }}>
              <button onClick={() => changeMonth(-1)} style={{ ...iconBtnStyle, border: 'none', background: 'transparent' }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2B3D', padding: '0 8px', minWidth: 130, textAlign: 'center' }}>
                {MOIS_FR[month]} {year}
              </span>
              <button onClick={() => changeMonth(1)} style={{ ...iconBtnStyle, border: 'none', background: 'transparent' }}>›</button>
            </div>
          </div>

          {editMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <AddMedecinRow onAdd={addMedecin} />
              {selected && (
                <button
                  onClick={() => setConfirmDelete(selected)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    borderRadius: 999, border: '1.5px solid #E5E1D8', background: '#fff',
                    color: '#9A3412', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} /> Retirer {selected.nom}
                </button>
              )}
            </div>
          )}

          {confirmDelete && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              background: '#FDF1EC', border: '1px solid #F3C7B0', borderRadius: 10,
              padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#9A3412'
            }}>
              <span>Retirer définitivement « {confirmDelete.nom} » et tout son planning ?</span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => { removeMedecin(confirmDelete.id); setSelectedId(null); setConfirmDelete(null); }}
                  style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#9A3412', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #E5E1D8', background: '#fff', color: '#5B6573', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {!selected ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF', fontSize: 14, border: '1px dashed #E5E1D8', borderRadius: 12 }}>
              Aucun médecin enregistré pour l'instant.{editMode ? '' : ' Active le mode édition pour en ajouter.'}
            </div>
          ) : (
            <PlanningTable
              medecin={selected}
              year={year}
              month={month}
              cellules={planning.cellules}
              onSetCell={setCell}
              editable={editMode}
            />
          )}

          {/* Légende */}
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setShowLegend(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                color: '#5B6573', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: '4px 0'
              }}
            >
              <ChevronDown size={14} style={{ transform: showLegend ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              {showLegend ? 'Masquer la légende des codes' : 'Voir la légende des codes'}
            </button>
            {showLegend && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {CODES.map(c => (
                  <div
                    key={c.code}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px',
                      borderRadius: 8, background: c.bg, fontSize: 12
                    }}
                  >
                    <span style={{ fontWeight: 800, color: c.color, minWidth: 26 }}>{c.code}</span>
                    <span style={{ color: '#5B6573' }}>
                      {c.label}{c.detail ? ` · ${c.detail}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
