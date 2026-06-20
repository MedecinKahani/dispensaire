'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { dateKey, getPostesForDay, getAgentsForPoste, JOURS_FR, formatAgentName } from '../config';

function MiniSlotPicker({ category, agents, date, cellules, onPick, onClose }) {
  const { disponibles, indisponibles } = getAgentsForPoste(category, agents, date, cellules);
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: 4,
        background: '#fff', border: '1px solid #E5E1D8', borderRadius: 10,
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)', padding: 8, width: 200, maxHeight: 260, overflowY: 'auto'
      }}
    >
      {disponibles.length === 0 && (
        <p style={{ fontSize: 11.5, color: '#9CA3AF', margin: '4px 6px' }}>Aucun disponible</p>
      )}
      {disponibles.map(({ agent }) => (
        <button
          key={agent.id}
          onClick={() => { onPick(agent.id); onClose(); }}
          style={{
            display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px',
            borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: '#1A2B3D'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F7F6F2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {formatAgentName(agent)}
        </button>
      ))}
      {indisponibles.length > 0 && (
        <p style={{ fontSize: 10, color: '#D1D5DB', margin: '8px 6px 2px' }}>
          {indisponibles.length} indisponible{indisponibles.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

function DayColumn({ category, agents, date, cellules, onSetCell }) {
  const dk = dateKey(date);
  const postes = getPostesForDay(category.id, date);
  const [openKey, setOpenKey] = useState(null);

  return (
    <div style={{ flex: '1 1 0', minWidth: 130, border: '1px solid #E5E1D8', borderRadius: 12, padding: 10, background: '#fff' }}>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: '#1A2B3D', margin: '0 0 8px', textAlign: 'center' }}>
        {JOURS_FR[date.getDay()]} {date.getDate()}
      </p>

      {postes.length === 0 ? (
        <p style={{ fontSize: 10.5, color: '#C8C5BA', textAlign: 'center', padding: '8px 0' }}>—</p>
      ) : (
        postes.map(poste => {
          const assigned = agents.filter(a => cellules[`${a.id}|${dk}|${poste.moment}`] === poste.code);
          const info = category.codes.find(c => c.code === poste.code);
          const slotsArray = Array.from({ length: poste.slots });
          return (
            <div key={poste.code} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 9.5, fontWeight: 700, color: '#9CA3AF', margin: '0 0 3px' }}>{poste.code}</p>
              {slotsArray.map((_, i) => {
                const agent = assigned[i];
                const key = `${poste.code}-${i}`;
                return (
                  <div key={key} style={{ position: 'relative', marginBottom: 3 }}>
                    {agent ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: info?.bg, color: info?.color, borderRadius: 6,
                        padding: '4px 6px', fontSize: 10.5, fontWeight: 600
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatAgentName(agent)}</span>
                        <button
                          onClick={() => onSetCell(agent.id, dk, poste.moment, '')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, display: 'flex', flexShrink: 0 }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOpenKey(openKey === key ? null : key)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                          width: '100%', border: '1px dashed #D1D5DB', borderRadius: 6,
                          padding: '4px 6px', fontSize: 10, color: '#C8C5BA', cursor: 'pointer', background: '#fff'
                        }}
                      >
                        <Plus size={10} />
                      </button>
                    )}
                    {openKey === key && (
                      <MiniSlotPicker
                        category={category}
                        agents={agents}
                        date={date}
                        cellules={cellules}
                        onPick={(agentId) => onSetCell(agentId, dk, poste.moment, poste.code)}
                        onClose={() => setOpenKey(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function WeekPosteBoard({ category, agents, weekDays, cellules, onSetCell }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {weekDays.map(d => (
        <DayColumn
          key={dateKey(d)}
          category={category}
          agents={agents}
          date={d}
          cellules={cellules}
          onSetCell={onSetCell}
        />
      ))}
    </div>
  );
}
