'use client';

import React, { useMemo } from 'react';
import { getDaysInMonth, dateKey, JOURS_FR } from '../config';

// Vue d'ensemble compacte : une ligne par agent, une colonne par jour.
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
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => (
            <tr key={agent.id}>
              <td
                onClick={() => onSelectAgent(agent)}
                style={{
                  ...tdStyle, position: 'sticky', left: 0, background: '#fff', zIndex: 1,
                  fontWeight: 600, color: '#1A2B3D', cursor: 'pointer', borderRight: '1px solid #E5E1D8',
                  whiteSpace: 'nowrap'
                }}
              >
                {agent.nom}
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
            </tr>
          ))}
        </tbody>
      </table>
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
