'use client';

import React, { useState, useMemo } from 'react';
import { Copy } from 'lucide-react';
import { getDaysInMonth, dateKey, JOURS_FR, MOMENTS } from '../config';
import CellEditor from './CellEditor';

export default function AgentDetailTable({ category, agent, cellules, year, month, editable, onSetCell, onFillRange, onCopyDay }) {
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const [editing, setEditing] = useState(null); // `${date}|${moment}`
  const [copySource, setCopySource] = useState(null);

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #E5E1D8', borderRadius: 12 }}>
      {editable && copySource && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          background: '#ECFAF8', borderBottom: '1px solid #E5E1D8', padding: '8px 14px', fontSize: 12.5, color: '#0F766E'
        }}>
          <span>Journée copiée ({copySource}) — clique une autre date pour coller, ou annule.</span>
          <button onClick={() => setCopySource(null)} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>
            Annuler
          </button>
        </div>
      )}
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
        <thead>
          <tr style={{ background: '#F7F6F2' }}>
            <th style={thStyle}>Jour</th>
            <th style={thStyle}>Date</th>
            {MOMENTS.map(m => <th key={m.id} style={thStyle}>{m.label}</th>)}
            {editable && <th style={thStyle}></th>}
          </tr>
        </thead>
        <tbody>
          {days.map(d => {
            const dk = dateKey(d);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <tr
                key={dk}
                style={{ background: isWeekend ? '#FBFAF7' : '#fff' }}
                onClick={() => {
                  if (editable && copySource && copySource !== dk) {
                    onCopyDay(copySource, dk);
                    setCopySource(null);
                  }
                }}
              >
                <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 12 }}>{JOURS_FR[d.getDay()]}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1A2B3D' }}>{d.getDate()}</td>
                {MOMENTS.map(m => {
                  const cellId = `${dk}|${m.id}`;
                  const code = cellules[`${agent.id}|${dk}|${m.id}`];
                  const info = code ? category.codes.find(c => c.code === code) : null;
                  const isEditing = editing === cellId;
                  return (
                    <td key={m.id} style={{ ...tdStyle, position: 'relative', padding: 4 }}>
                      <button
                        onClick={e => { e.stopPropagation(); if (editable && !copySource) setEditing(isEditing ? null : cellId); }}
                        disabled={!editable}
                        style={{
                          width: '100%', minHeight: 30, border: 'none', borderRadius: 7,
                          background: info ? info.bg : 'transparent',
                          color: info ? info.color : '#D1D5DB',
                          fontWeight: 700, fontSize: 12.5, cursor: editable && !copySource ? 'pointer' : 'default',
                          padding: '5px 4px'
                        }}
                      >
                        {code || (editable ? '+' : '–')}
                      </button>
                      {isEditing && (
                        <CellEditor
                          codes={category.codes}
                          value={code}
                          date={dk}
                          onChange={(newCode) => onSetCell(dk, m.id, newCode)}
                          onFillRange={(fromDate, toDate, fillCode) => onFillRange(fromDate, toDate, m.id, fillCode)}
                          onClose={() => setEditing(null)}
                        />
                      )}
                    </td>
                  );
                })}
                {editable && (
                  <td style={{ ...tdStyle, padding: 4 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setCopySource(dk); }}
                      title="Copier cette journée vers une autre date"
                      style={{
                        width: 26, height: 26, border: '1px solid #E5E1D8', borderRadius: 6,
                        background: '#fff', color: '#9CA3AF', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Copy size={12} />
                    </button>
                  </td>
                )}
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
  borderBottom: '1px solid #E5E1D8'
};
const tdStyle = {
  padding: '6px 12px', fontSize: 13, borderBottom: '1px solid #F0EEE7'
};
