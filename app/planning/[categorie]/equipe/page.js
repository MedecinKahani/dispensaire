'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2,
  AlertTriangle, Settings2, CalendarDays
} from 'lucide-react';
import { getPlanningCategory, MOIS_FR, JOURS_FR, formatAgentName, sortAgents } from '../../config';
import { usePlanning } from '../../usePlanning';
import OverviewGrid from '../OverviewGrid';
import AgentDetailTable from '../AgentDetailTable';
import PosteBoard from '../PosteBoard';
import WeekPosteBoard from '../WeekPosteBoard';
import AddAgentRow from '../AddAgentRow';
import PinGate from './PinGate';

const SCALES = [
  { id: 'jour', label: 'Jour' },
  { id: 'semaine', label: 'Semaine' },
  { id: 'mois', label: 'Mois' },
];

function mondayOf(date) {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  return d;
}

export default function PlanningCategoryEquipePage() {
  const params = useParams();
  const categoryId = params.categorie;
  const category = getPlanningCategory(categoryId);

  const { planning, setCell, addAgent, removeAgent, copyDay, fillRange, setGuide, toggleFerie, error } = usePlanning();

  const today = new Date();
  const [scale, setScale] = useState('jour');
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [agentView, setAgentView] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editMode, setEditMode] = useState(true);
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
  const agents = sortAgents(data.agents);
  const selected = agents.find(a => a.id === selectedId) || null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weekDays = useMemo(() => {
    const monday = mondayOf(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const navigate = (delta) => {
    const d = new Date(currentDate);
    if (scale === 'jour') d.setDate(d.getDate() + delta);
    else if (scale === 'semaine') d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  const selectAgent = (agent) => {
    setSelectedId(agent.id);
    setAgentView(true);
  };

  const Icon = category.icon;

  const periodLabel = scale === 'jour'
    ? `${JOURS_FR[currentDate.getDay()]} ${currentDate.getDate()} ${MOIS_FR[month].toLowerCase()} ${year}`
    : scale === 'semaine'
      ? `Semaine du ${weekDays[0].getDate()} au ${weekDays[6].getDate()} ${MOIS_FR[weekDays[6].getMonth()].toLowerCase()}`
      : `${MOIS_FR[month]} ${year}`;

  return (
    <PinGate>
    <div style={{ minHeight: '100vh', background: '#F7F6F2', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <header style={{ background: '#1A2B3D', padding: '32px 24px 28px 24px', borderBottom: `4px solid ${category.color}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Link href={`/planning/${categoryId}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94A8BD',
            fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 14
          }}>
            <ArrowLeft size={14} /> Retour à la sélection du médecin
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: category.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={category.color} />
            </div>
            <div>
              <p style={{ color: '#94A8BD', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                Gestion du planning — {category.sublabel}
              </p>
              <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>
                {category.label}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 80px 24px' }}>
        {!category.configured && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FEF3E2',
            border: '1px solid #FCD9A8', color: '#92400E', padding: '12px 16px',
            borderRadius: 10, fontSize: 13.5, marginBottom: 20, lineHeight: 1.5
          }}>
            <Settings2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Les postes et codes pour <strong>{category.label}</strong> n'ont pas encore été définis.
              Tu peux déjà ajouter les agents en attendant.
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
            <div style={{ display: 'flex', gap: 10, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: '#F0EEE7', borderRadius: 10, padding: 3, gap: 2 }}>
                  {SCALES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setScale(s.id)}
                      style={{
                        padding: '7px 16px', borderRadius: 8, border: 'none',
                        background: scale === s.id ? '#fff' : 'transparent',
                        color: scale === s.id ? category.color : '#9CA3AF',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        boxShadow: scale === s.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#F7F6F2', borderRadius: 10, padding: 3 }}>
                  <button onClick={() => navigate(-1)} style={navBtnStyle}><ChevronLeft size={15} /></button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A2B3D', padding: '0 8px', minWidth: 170, textAlign: 'center' }}>
                    {periodLabel}
                  </span>
                  <button onClick={() => navigate(1)} style={navBtnStyle}><ChevronRight size={15} /></button>
                </div>

                <button onClick={goToday} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8,
                  border: '1px solid #E5E1D8', background: '#fff', color: '#5B6573', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}>
                  <CalendarDays size={12} /> Aujourd'hui
                </button>
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
                <Pencil size={13} /> {editMode ? 'Mode édition activé' : 'Mode lecture seule'}
              </button>
            </div>

            {editMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 12, flexWrap: 'wrap' }}>
                <AddAgentRow
                  onAdd={(nomFamille, prenom, arrivee, depart) => addAgent(categoryId, nomFamille, prenom, arrivee, depart)}
                  color={category.color}
                />
                <button
                  onClick={() => setAgentView(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    borderRadius: 999, border: `1px solid ${agentView ? category.color : '#E5E1D8'}`,
                    background: agentView ? category.bg : '#fff', color: agentView ? category.color : '#5B6573',
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Vue par agent {agentView ? '(activée)' : ''}
                </button>
              </div>
            )}

            {confirmDelete && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                background: '#FDF1EC', border: '1px solid #F3C7B0', borderRadius: 10,
                padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#9A3412'
              }}>
                <span>Retirer définitivement « {formatAgentName(confirmDelete)} » et tout son planning ?</span>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => { removeAgent(categoryId, confirmDelete.id); setSelectedId(null); setConfirmDelete(null); }}
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

            {scale === 'jour' && (
              <PosteBoard
                category={category}
                agents={agents}
                date={currentDate}
                cellules={data.cellules}
                onSetCell={(agentId, date, moment, code) => setCell(categoryId, agentId, date, moment, code)}
                feries={data.feries || []}
                onToggleFerie={(date) => toggleFerie(categoryId, date)}
              />
            )}

            {scale === 'semaine' && (
              <WeekPosteBoard
                category={category}
                agents={agents}
                weekDays={weekDays}
                cellules={data.cellules}
                onSetCell={(agentId, date, moment, code) => setCell(categoryId, agentId, date, moment, code)}
                feries={data.feries || []}
                onToggleFerie={(date) => toggleFerie(categoryId, date)}
              />
            )}

            {scale === 'mois' && (
              <OverviewGrid
                category={category}
                agents={agents}
                cellules={data.cellules}
                year={year}
                month={month}
                onSelectAgent={selectAgent}
                onRemoveAgent={(agent) => removeAgent(categoryId, agent.id)}
                onSetCell={(agentId, dk, moment, code) => setCell(categoryId, agentId, dk, moment, code)}
                guides={data.guides || {}}
                onSetGuide={(agentId, date, guideId) => setGuide(categoryId, agentId, date, guideId)}
                feries={data.feries || []}
                onToggleFerie={(date) => toggleFerie(categoryId, date)}
              />
            )}

            {agentView && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #E5E1D8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selected?.id || ''}
                      onChange={e => setSelectedId(e.target.value)}
                      style={{
                        padding: '9px 34px 9px 14px', borderRadius: 10, border: '1.5px solid #E5E1D8',
                        fontSize: 13.5, fontWeight: 600, color: '#1A2B3D', background: '#fff',
                        appearance: 'none', cursor: 'pointer', outline: 'none', minWidth: 200
                      }}
                    >
                      <option value="" disabled>Choisir un agent…</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{formatAgentName(a)}</option>)}
                    </select>
                    <ChevronDown size={15} color="#9CA3AF" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                  {selected && (
                    <button
                      onClick={() => setConfirmDelete(selected)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                        borderRadius: 999, border: '1.5px solid #E5E1D8', background: '#fff',
                        color: '#9A3412', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} /> Retirer {formatAgentName(selected)}
                    </button>
                  )}
                </div>
                {!selected ? (
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
              </div>
            )}

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
    </PinGate>
  );
}

const navBtnStyle = {
  width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5B6573'
};
