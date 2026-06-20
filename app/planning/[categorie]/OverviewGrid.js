'use client';

import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import { getDaysInMonth, dateKey, JOURS_FR, computeAgentStats, formatAgentName } from '../config';
import { exportPlanningPDF } from './exportPdf';

// Vue d'ensemble compacte : une ligne par agent, une colonne par jour,
// + une colonne de totaux (heures / gardes / RS) pour vérifier l'équité sans calcul mental.
// Affiche le code du matin en priorité (sinon AM, sinon N) pour rester lisible ;
// un agent + une colonne ouvrent la vue détaillée filtrée.
export default function OverviewGrid({ category, agents, cellules, year, month, onSelectAgent }) {
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const codeFor = (agentId, dk) => {
    for (const m of ['M', 'AM', 'N']) {
      const c = cellules[`${agentId}|${dk}|${m}`];
      if (c) return c;
    }
    return null;
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
            <th style={{ ...thStyle, position: 'sticky', left: 0, background: '#F7F6F2', zIndex: 2, minWidth: 160, textAlign: 'left' }}>
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
            <th style={{ ...thStyle, position: 'sticky', right: 0, background: '#F7F6F2', zIndex: 2, minWidth: 130, borderLeft: '1px solid #E5E1D8' }}>
              Total mois
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => {
            const stats = category.codes.length > 0
              ? computeAgentStats(category, agent.id, cellules, year, month)
              : null;
            return (
              <tr key={agent.id}>
                <td
                  onClick={() => onSelectAgent(agent)}
                  style={{
                    ...tdStyle, position: 'sticky', left: 0, background: '#fff', zIndex: 1,
                    fontWeight: 600, color: '#1A2B3D', cursor: 'pointer', borderRight: '1px solid #E5E1D8',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formatAgentName(agent)}
                </td>
                {days.map(d => {
                  const dk = dateKey(d);
                  const code = codeFor(agent.id, dk);
                  const info = code ? category.codes.find(c => c.code === code) : null;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <td
                      key={dk}
                      onClick={() => onSelectAgent(agent, dk)}
                      style={{
                        ...tdStyle, textAlign: 'center', cursor: 'pointer',
                        background: info ? info.bg : (isWeekend ? '#FBFAF7' : '#fff'),
                        color: info ? info.color : '#D1D5DB',
                        fontWeight: 700, fontSize: 11
                      }}
                    >
                      {code || '·'}
                    </td>
                  );
                })}
                <td style={{
                  ...tdStyle, position: 'sticky', right: 0, background: '#fff', zIndex: 1,
                  borderLeft: '1px solid #E5E1D8', whiteSpace: 'nowrap'
                }}>
                  {stats ? (
                    <div style={{ display: 'flex', gap: 10, fontSize: 11.5 }}>
                      <span title="Heures travaillées sur le mois" style={{ color: '#1A2B3D', fontWeight: 700 }}>
                        {stats.heures}h
                      </span>
                      <span title="Nombre de gardes" style={{ color: '#C2410C', fontWeight: 700 }}>
                        {stats.gardes}G
                      </span>
                      <span title="Nombre de repos de garde posés" style={{ color: '#65521E', fontWeight: 700 }}>
                        {stats.rs}RS
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
