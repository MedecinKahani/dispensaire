'use client';

import React, { useMemo, useState } from 'react';
import { Download, Trash2, X, Check } from 'lucide-react';
import { getDaysInMonth, dateKey, JOURS_FR, computeAgentStats, formatAgentName, isCancelledCode, cancelledCodeValue } from '../config';
import { exportPlanningPDF } from './exportPdf';

// Vue d'ensemble compacte : une ligne par agent, une colonne par jour,
// + une colonne de totaux (heures / gardes / RS) pour vérifier l'équité sans calcul mental.
// Affiche le code du matin en priorité (sinon AM, sinon N) pour rester lisible ;
// un agent + une colonne ouvrent la vue détaillée filtrée.
export default function OverviewGrid({ category, agents, cellules, year, month, onSelectAgent, onRemoveAgent }) {
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const [confirmingId, setConfirmingId] = useState(null);

  const codesFor = (agentId, dk) => {
    return ['M', 'AM', 'N']
      .map(m => cellules[`${agentId}|${dk}|${m}`])
      .filter(Boolean);
  };

  if (agents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 14, border: '1px dashed #E5E1D8', borderRadius: 12 }}>
        Aucun agent enregistré pour l'instant.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button
          onClick={() => exportPlanningPDF(category, agents, cellules, year, month)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            borderRadius: 999, border: '1.5px solid #1A2B3D', background: '#1A2B3D',
            color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Download size={13} /> Exporter en PDF (direction affaires médicales)
        </button>
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid #E5E1D8', borderRadius: 12 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#F7F6F2' }}>
            <th style={{ ...thStyle, position: 'sticky', left: 0, background: '#F7F6F2', zIndex: 2, minWidth: 190, textAlign: 'left' }}>
              Agent
            </th>
            {days.map(d => {
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <th key={dateKey(d)} style={{ ...thStyle, minWidth: 34, background: isWeekend ? '#F0EEE7' : '#F7F6F2' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: '#9CA3AF' }}>{JOURS_FR[d.getDay()]}</div>
                  <div>{d.getDate()}</div>
                </th>
              );
            })}
            <th style={{ ...thStyle, position: 'sticky', right: 0, background: '#F7F6F2', zIndex: 2, minWidth: 170, borderLeft: '1px solid #E5E1D8' }}>
              Moy. semaine / Gardes
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => {
            const stats = category.codes.length > 0
              ? computeAgentStats(category, agent.id, cellules, year, month)
              : null;
            const isConfirming = confirmingId === agent.id;
            return (
              <tr key={agent.id}>
                <td
                  style={{
                    ...tdStyle, position: 'sticky', left: 0, background: isConfirming ? '#FDF1EC' : '#fff', zIndex: 1,
                    fontWeight: 600, color: '#1A2B3D', borderRight: '1px solid #E5E1D8',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isConfirming ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11.5, color: '#9A3412' }}>Supprimer ?</span>
                      <button
                        onClick={() => { onRemoveAgent(agent); setConfirmingId(null); }}
                        title="Confirmer la suppression"
                        style={{ display: 'flex', border: 'none', background: '#9A3412', color: '#fff', borderRadius: 5, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        title="Annuler"
                        style={{ display: 'flex', border: '1px solid #E5E1D8', background: '#fff', color: '#5B6573', borderRadius: 5, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="planning-agent-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span onClick={() => onSelectAgent(agent)} style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatAgentName(agent)}
                      </span>
                      {onRemoveAgent && (
                        <button
                          className="planning-agent-delete-btn"
                          onClick={(e) => { e.stopPropagation(); setConfirmingId(agent.id); }}
                          title="Supprimer cet agent"
                          style={{
                            display: 'flex', border: 'none', background: 'transparent', color: '#D1D5DB',
                            cursor: 'pointer', flexShrink: 0, padding: 2
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                {days.map(d => {
                  const dk = dateKey(d);
                  const codes = codesFor(agent.id, dk);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <td
                      key={dk}
                      onClick={() => onSelectAgent(agent, dk)}
                      style={{
                        ...tdStyle, textAlign: 'center', cursor: 'pointer', padding: '3px 4px',
                        background: codes.length === 0 ? (isWeekend ? '#FBFAF7' : '#fff') : undefined,
                      }}
                    >
                      {codes.length === 0 ? (
                        <span style={{ color: '#D1D5DB', fontWeight: 700, fontSize: 11 }}>·</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'stretch' }}>
                          {codes.map((rawCode, i) => {
                            const cancelled = isCancelledCode(rawCode);
                            const code = cancelled ? cancelledCodeValue(rawCode) : rawCode;
                            const info = category.codes.find(c => c.code === code);
                            return (
                              <span
                                key={i}
                                title={cancelled ? `Créneau annulé (était : ${code})` : undefined}
                                style={{
                                  display: 'block', borderRadius: 4, padding: '1px 3px',
                                  background: info ? (cancelled ? `${info.bg}99` : info.bg) : '#F0EEE7',
                                  color: info ? info.color : '#9CA3AF',
                                  fontWeight: 700, fontSize: codes.length > 1 ? 9.5 : 11,
                                  lineHeight: 1.4, opacity: cancelled ? 0.5 : 1,
                                  textDecoration: cancelled ? 'line-through' : 'none'
                                }}
                              >
                                {code === 'RG' ? '\u00A0' : code}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td style={{
                  ...tdStyle, position: 'sticky', right: 0, background: '#fff', zIndex: 1,
                  borderLeft: '1px solid #E5E1D8', whiteSpace: 'nowrap'
                }}>
                  {stats ? (
                    <div style={{ display: 'flex', gap: 10, fontSize: 11.5 }}>
                      <span title="Moyenne d'heures par semaine sur le mois (base 4,33 semaines)" style={{ color: '#1A2B3D', fontWeight: 700 }}>
                        {stats.heuresParSemaine.toFixed(1)}h/sem
                      </span>
                      <span title="Nombre de gardes de nuit" style={{ color: '#C2410C', fontWeight: 700 }}>
                        {stats.gardesNuit}GN
                      </span>
                      <span title="Nombre de gardes de jour (week-end)" style={{ color: '#B45309', fontWeight: 700 }}>
                        {stats.gardesJour}GJ
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: '#D1D5DB', fontSize: 11 }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <style>{`
        .planning-agent-delete-btn { opacity: 0; transition: opacity 0.12s; }
        .planning-agent-row:hover .planning-agent-delete-btn { opacity: 1; }
        .planning-agent-delete-btn:hover { color: #9A3412 !important; }
      `}</style>
    </div>
  );
}

const thStyle = {
  padding: '8px 6px', textAlign: 'center', fontSize: 11, fontWeight: 700,
  color: '#5B6573', borderBottom: '1px solid #E5E1D8', whiteSpace: 'nowrap'
};
const tdStyle = {
  padding: '7px 10px', fontSize: 12.5, borderBottom: '1px solid #F0EEE7'
};
