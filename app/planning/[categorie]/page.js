'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, ChevronDown, ChevronLeft, Loader2, Pencil, Trash2,
  AlertTriangle, LayoutGrid, User, Settings2
} from 'lucide-react';
import { getPlanningCategory, MOIS_FR } from '../config';
import { usePlanning } from '../usePlanning';
import OverviewGrid from './OverviewGrid';
import AgentDetailTable from './AgentDetailTable';
import AddAgentRow from './AddAgentRow';

export default function PlanningCategoryPage() {
  const params = useParams();
  const categoryId = params.categorie;
  const category = getPlanningCategory(categoryId);

  const { planning, setCell, addAgent, removeAgent, copyDay, fillRange, error } = usePlanning();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState('overview'); // 'overview' | 'agent'
  const [selectedId, setSelectedId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!category) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", color: '#5B6573' }}>
        Catégorie de planning inconnue.
      </div>
    );
  }

  const loading = planning === null;
  const data = planning?.[categoryId] || { agents: [], cellules: {} };
  const agents = data.agents;
  const selected = agents.find(a => a.id === selectedId) || null;

  const changeMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };

  const selectAgent = (agent) => {
    setSelectedId(agent.id);
    setView('agent');
  };

  const Icon = category.icon;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <header style={{ background: '#1A2B3D', padding: '32px 24px 28px 24px', borderBottom: `4px solid ${category.color}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Link href="/planning" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94A8BD',
            fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 14
          }}>
            <ArrowLeft size={14} /> Toutes les catégories
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: category.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={category.color} />
            </div>
            <div>
              <p style={{ color: '#94A8BD', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                Planning — {category.sublabel}
              </p>
              <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>
                {category.label}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px 24px' }}>
        {!category.configured && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FEF3E2',
            border: '1px solid #FCD9A8', color: '#92400E', padding: '12px 16px',
            borderRadius: 10, fontSize: 13.5, marginBottom: 20, lineHeight: 1.5
          }}>
            <Settings2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Les codes de service pour <strong>{category.label}</strong> n'ont pas encore été définis.
              Tu peux déjà ajouter les agents, mais l'édition des créneaux sera activée une fois la légende précisée.
            </span>
          </div>
        )}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9CA3AF', padding: '40px 0', fontSize: 14 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Chargement du planning…
          </div>
        ) : (
          <>
            {/* Barre de contrôle */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Toggle vue */}
                <div style={{ display: 'flex', background: '#F0EEE7', borderRadius: 10, padding: 3, gap: 2 }}>
                  <button
                    onClick={() => setView('overview')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: 'none',
                      background: view === 'overview' ? '#fff' : 'transparent',
                      color: view === 'overview' ? '#1A2B3D' : '#9CA3AF',
                      fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      boxShadow: view === 'overview' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    <LayoutGrid size={13} /> Vue d'ensemble
                  </button>
                  <button
                    onClick={() => agents.length > 0 && setView('agent')}
                    disabled={agents.length === 0}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: 'none',
                      background: view === 'agent' ? '#fff' : 'transparent',
                      color: view === 'agent' ? '#1A2B3D' : '#9CA3AF',
                      fontSize: 12.5, fontWeight: 600, cursor: agents.length > 0 ? 'pointer' : 'not-allowed',
                      boxShadow: view === 'agent' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    <User size={13} /> Vue par agent
                  </button>
                </div>

                {/* Sélecteur agent (visible en vue agent) */}
                {view === 'agent' && (
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selected?.id || ''}
                      onChange={e => setSelectedId(e.target.value)}
                      style={{
                        padding: '9px 34px 9px 14px', borderRadius: 10, border: '1.5px solid #E5E1D8',
                        fontSize: 13.5, fontWeight: 600, color: '#1A2B3D', background: '#fff',
                        appearance: 'none', cursor: 'pointer', outline: 'none', minWidth: 180
                      }}
                    >
                      <option value="" disabled>Choisir un agent…</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                    </select>
                    <ChevronDown size={15} color="#9CA3AF" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                )}

                {/* Navigation mois */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#F7F6F2', borderRadius: 10, padding: 3 }}>
                  <button onClick={() => changeMonth(-1)} style={navBtnStyle}><ChevronLeft size={15} /></button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2B3D', padding: '0 6px', minWidth: 120, textAlign: 'center' }}>
                    {MOIS_FR[month]} {year}
                  </span>
                  <button onClick={() => changeMonth(1)} style={{ ...navBtnStyle, transform: 'rotate(180deg)' }}><ChevronLeft size={15} /></button>
                </div>
              </div>

              <button
                onClick={() => setEditMode(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 999, border: `1.5px solid ${editMode ? category.color : '#E5E1D8'}`,
                  background: editMode ? category.bg : '#fff', color: editMode ? category.color : '#5B6573',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                }}
              >
                <Pencil size={13} /> {editMode ? 'Mode édition activé' : 'Modifier le planning'}
              </button>
            </div>

            {editMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <AddAgentRow onAdd={(nom) => addAgent(categoryId, nom)} color={category.color} />
                {view === 'agent' && selected && (
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
                    onClick={() => { removeAgent(categoryId, confirmDelete.id); setSelectedId(null); setConfirmDelete(null); setView('overview'); }}
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

            {/* Contenu */}
            {view === 'overview' ? (
              <OverviewGrid
                category={category}
                agents={agents}
                cellules={data.cellules}
                year={year}
                month={month}
                onSelectAgent={selectAgent}
              />
            ) : !selected ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 14, border: '1px dashed #E5E1D8', borderRadius: 12 }}>
                Choisis un agent dans la liste ci-dessus.
              </div>
            ) : (
              <AgentDetailTable
                category={category}
                agent={selected}
                cellules={data.cellules}
                year={year}
                month={month}
                editable={editMode && category.configured}
                onSetCell={(date, moment, code) => setCell(categoryId, selected.id, date, moment, code)}
                onFillRange={(fromDate, toDate, moment, code) => fillRange(categoryId, selected.id, fromDate, toDate, moment, code)}
                onCopyDay={(fromDate, toDate) => copyDay(categoryId, selected.id, fromDate, toDate)}
              />
            )}

            {/* Légende */}
            {category.codes.length > 0 && (
              <div style={{ marginTop: 18 }}>
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
                    {category.codes.map(c => (
                      <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 8, background: c.bg, fontSize: 12 }}>
                        <span style={{ fontWeight: 800, color: c.color, minWidth: 26 }}>{c.code}</span>
                        <span style={{ color: '#5B6573' }}>{c.label}{c.detail ? ` · ${c.detail}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const navBtnStyle = {
  width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5B6573'
};
