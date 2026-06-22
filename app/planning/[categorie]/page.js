'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, Loader2, Settings, Search, Users, Check, X } from 'lucide-react';
import { getPlanningCategory, formatAgentName, sortAgents } from '../config';
import { usePlanning } from '../usePlanning';
import AgentDetailTable from './AgentDetailTable';
import MultiAgentCompare from './MultiAgentCompare';

export default function PlanningCategoryEntryPage() {
  const params = useParams();
  const categoryId = params.categorie;
  const category = getPlanningCategory(categoryId);

  const { planning, setCell, copyDay, fillRange, error } = usePlanning();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const today = new Date();
  const [year] = useState(today.getFullYear());
  const [month] = useState(today.getMonth());

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

  const filteredAgents = useMemo(() => {
    if (!search.trim()) return agents;
    const q = search.trim().toLowerCase();
    return agents.filter(a => formatAgentName(a).toLowerCase().includes(q));
  }, [agents, search]);

  const compareAgents = agents.filter(a => compareIds.includes(a.id));

  const toggleCompare = (agentId) => {
    setCompareIds(ids => ids.includes(agentId) ? ids.filter(i => i !== agentId) : [...ids, agentId]);
  };

  const Icon = category.icon;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <header style={{ background: '#1A2B3D', padding: '32px 24px 28px 24px', borderBottom: `4px solid ${category.color}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Link href="/planning" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94A8BD',
            fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 14
          }}>
            <ArrowLeft size={14} /> Toutes les catégories
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: category.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={category.color} />
              </div>
              <div>
                <p style={{ color: '#94A8BD', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                  Planning — {category.sublabel}
                </p>
                <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>
                  Quel {category.label === 'Médical' ? 'médecin' : 'agent'} es-tu ?
                </h1>
              </div>
            </div>
            <Link
              href={`/planning/${categoryId}/equipe`}
              title="Gestion du planning par le chef de service"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)',
                color: '#94A8BD', fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0
              }}
            >
              <Settings size={13} /> Vue chef de service
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px 80px 24px' }}>
        {error && (
          <div style={{
            background: '#FDF1EC', border: '1px solid #F3C7B0', color: '#9A3412',
            padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9CA3AF', padding: '40px 0', fontSize: 14 }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Chargement…
          </div>
        ) : !selected && !(compareMode && showComparison && compareAgents.length >= 2) ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher mon nom…"
                  style={{
                    width: '100%', padding: '12px 14px 12px 38px', borderRadius: 12,
                    border: '1.5px solid #E5E1D8', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                    background: '#fff'
                  }}
                />
              </div>
              <button
                onClick={() => { setCompareMode(v => !v); setCompareIds([]); setShowComparison(false); }}
                title="Comparer plusieurs agendas pour trouver des jours off en commun"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderRadius: 12,
                  border: `1.5px solid ${compareMode ? category.color : '#E5E1D8'}`,
                  background: compareMode ? category.bg : '#fff', color: compareMode ? category.color : '#5B6573',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0
                }}
              >
                <Users size={15} /> Comparer
              </button>
            </div>

            {compareMode && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '-8px 0 14px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: 13, color: '#5B6573', margin: 0 }}>
                  {compareAgents.length === 0
                    ? 'Sélectionne au moins 2 agendas à comparer.'
                    : compareAgents.length === 1
                      ? 'Sélectionne encore au moins 1 agenda.'
                      : `${compareAgents.length} agendas sélectionnés.`}
                </p>
                {compareAgents.length >= 2 && (
                  <button
                    onClick={() => setShowComparison(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999,
                      border: 'none', background: category.color, color: '#fff',
                      fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Voir la comparaison ({compareAgents.length})
                  </button>
                )}
              </div>
            )}

            {filteredAgents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 14, border: '1px dashed #E5E1D8', borderRadius: 12 }}>
                {agents.length === 0
                  ? "Aucun agent enregistré pour l'instant — demande au chef de service de t'ajouter."
                  : 'Aucun résultat pour cette recherche.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredAgents.map(a => {
                  const isChecked = compareIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => compareMode ? toggleCompare(a.id) : setSelectedId(a.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 12,
                        border: `1px solid ${isChecked ? category.color : '#E5E1D8'}`,
                        background: isChecked ? category.bg : '#fff', cursor: 'pointer',
                        fontSize: 15, fontWeight: 600, color: '#1A2B3D'
                      }}
                      onMouseEnter={e => { if (!isChecked) e.currentTarget.style.borderColor = category.color; }}
                      onMouseLeave={e => { if (!isChecked) e.currentTarget.style.borderColor = '#E5E1D8'; }}
                    >
                      {formatAgentName(a)}
                      {compareMode ? (
                        <span style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          border: `1.5px solid ${isChecked ? category.color : '#D1D5DB'}`,
                          background: isChecked ? category.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isChecked && <Check size={13} color="#fff" strokeWidth={3} />}
                        </span>
                      ) : (
                        <ChevronDown size={16} color="#9CA3AF" style={{ transform: 'rotate(-90deg)' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : compareMode && showComparison && compareAgents.length >= 2 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <button
                onClick={() => setShowComparison(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                  color: '#5B6573', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0'
                }}
              >
                <ArrowLeft size={14} /> Modifier la sélection
              </button>
              <button
                onClick={() => { setCompareMode(false); setCompareIds([]); setShowComparison(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
                  color: '#9A3412', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                }}
              >
                <X size={13} /> Quitter la comparaison
              </button>
            </div>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 700, color: '#1A2B3D', margin: '0 0 16px' }}>
              {compareAgents.map(a => formatAgentName(a)).join(' · ')}
            </h2>
            <MultiAgentCompare category={category} agents={compareAgents} cellules={data.cellules} />
          </>
        ) : null}

        {!loading && !compareMode && selected && (
          <>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                color: '#5B6573', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0', marginBottom: 14
              }}
            >
              <ArrowLeft size={14} /> Changer de {category.label === 'Médical' ? 'médecin' : 'agent'}
            </button>
            <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#1A2B3D', margin: '0 0 16px' }}>
              {formatAgentName(selected)}
            </h2>
            <AgentDetailTable
              category={category}
              agent={selected}
              cellules={data.cellules}
              year={year}
              month={month}
              editable={category.configured}
              onSetCell={(date, moment, code) => setCell(categoryId, selected.id, date, moment, code)}
              onFillRange={(fromDate, toDate, moment, code) => fillRange(categoryId, selected.id, fromDate, toDate, moment, code)}
              onCopyDay={(fromDate, toDate) => copyDay(categoryId, selected.id, fromDate, toDate)}
              requireConfirm
            />
          </>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
