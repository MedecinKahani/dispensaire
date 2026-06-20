'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { dateKey, JOURS_FR, MOIS_FR } from '../config';

const CODES_OFF = ['CA', 'CF', 'RS', 'X'];

function mondayOf(date) {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  return d;
}

function isOffThisDay(agentId, dk, cellules) {
  return ['M', 'AM', 'N'].some(m => CODES_OFF.includes(cellules[`${agentId}|${dk}|${m}`]));
}

export default function MultiAgentCompare({ category, agents, cellules }) {
  const today = new Date();
  const [weekAnchor, setWeekAnchor] = useState(mondayOf(today));

  const week = useMemo(() => {
    const monday = mondayOf(weekAnchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekAnchor]);

  const navigateWeek = (delta) => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + delta * 7);
    setWeekAnchor(d);
  };

  const commonOffDays = useMemo(() => {
    return week.filter(d => {
      const dk = dateKey(d);
      return agents.every(a => isOffThisDay(a.id, dk, cellules));
    }).map(d => dateKey(d));
  }, [week, agents, cellules]);

  const weekLabel = `${week[0].getDate()} – ${week[6].getDate()} ${MOIS_FR[week[6].getMonth()].toLowerCase()}`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#F7F6F2', borderRadius: 10, padding: 3 }}>
          <button onClick={() => navigateWeek(-1)} style={navBtnStyle}><ChevronLeft size={15} /></button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2B3D', padding: '0 8px', minWidth: 150, textAlign: 'center', textTransform: 'capitalize' }}>
            {weekLabel}
          </span>
          <button onClick={() => navigateWeek(1)} style={navBtnStyle}><ChevronRight size={15} /></button>
        </div>
        {commonOffDays.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#0F766E' }}>
            <Sparkles size={13} /> {commonOffDays.length} jour{commonOffDays.length > 1 ? 's' : ''} off en commun
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #E5E1D8', borderRadius: 12 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: '#F7F6F2' }}>
              <th style={{ ...thStyle, textAlign: 'left', minWidth: 140 }}>Agent</th>
              {week.map(d => {
                const dk = dateKey(d);
                const isCommonOff = commonOffDays.includes(dk);
                return (
                  <th key={dk} style={{ ...thStyle, minWidth: 64, background: isCommonOff ? '#ECFAF8' : '#F7F6F2' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 600, color: '#9CA3AF' }}>{JOURS_FR[d.getDay()]}</div>
                    <div style={{ color: isCommonOff ? '#0F766E' : '#1A2B3D' }}>{d.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {agents.map(agent => (
              <tr key={agent.id}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1A2B3D', whiteSpace: 'nowrap' }}>{agent.nom}</td>
                {week.map(d => {
                  const dk = dateKey(d);
                  const isCommonOff = commonOffDays.includes(dk);
                  const codes = ['M', 'AM', 'N']
                    .map(m => cellules[`${agent.id}|${dk}|${m}`])
                    .filter(Boolean);
                  const display = codes[0] || '·';
                  const off = isOffThisDay(agent.id, dk, cellules);
                  return (
                    <td
                      key={dk}
                      style={{
                        ...tdStyle, textAlign: 'center', fontWeight: 700, fontSize: 12,
                        background: isCommonOff ? '#ECFAF8' : (off ? '#F8F2E6' : '#fff'),
                        color: isCommonOff ? '#0F766E' : (off ? '#65521E' : '#9CA3AF')
                      }}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '8px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700,
  color: '#5B6573', borderBottom: '1px solid #E5E1D8'
};
const tdStyle = {
  padding: '8px 10px', fontSize: 13, borderBottom: '1px solid #F0EEE7'
};
const navBtnStyle = {
  width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5B6573'
};
