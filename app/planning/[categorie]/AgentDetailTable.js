'use client';

import React, { useState, useMemo } from 'react';
import { Copy, X } from 'lucide-react';
import { getWeeksMonday, dateKey, JOURS_FR, MOMENTS } from '../config';
import CellEditor from './CellEditor';

const JOURS_LUN_DIM = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function DayCell({ category, agent, day, cellules, editable, copySource, onPickCopySource, onPaste, onSetCell, onFillRange }) {
  const dk = dateKey(day.date);
  const [editingMoment, setEditingMoment] = useState(null);

  return (
    <div
      onClick={() => { if (editable && copySource && copySource !== dk) onPaste(dk); }}
      style={{
        border: '1px solid #E5E1D8', borderRadius: 10, padding: 8,
        background: day.outOfMonth ? '#FAFAF8' : '#fff',
        opacity: day.outOfMonth ? 0.5 : 1,
        minHeight: 108, display: 'flex', flexDirection: 'column', gap: 4,
        cursor: editable && copySource && copySource !== dk ? 'copy' : 'default'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: day.outOfMonth ? '#C8C5BA' : '#1A2B3D' }}>
          {day.date.getDate()}
        </span>
        {editable && !day.outOfMonth && (
          <button
            onClick={e => { e.stopPropagation(); onPickCopySource(dk); }}
            title="Copier cette journée"
            style={{
              width: 18, height: 18, border: 'none', background: 'transparent',
              color: '#C8C5BA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Copy size={11} />
          </button>
        )}
      </div>
      {MOMENTS.map(m => {
        const code = cellules[`${agent.id}|${dk}|${m.id}`];
        const info = code ? category.codes.find(c => c.code === code) : null;
        const cellId = `${dk}|${m.id}`;
        const isEditing = editingMoment === cellId;
        return (
          <div key={m.id} style={{ position: 'relative' }}>
            <button
              onClick={e => {
                e.stopPropagation();
                if (editable && !day.outOfMonth && !copySource) setEditingMoment(isEditing ? null : cellId);
              }}
              disabled={!editable || day.outOfMonth}
              title={m.label}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: 'none', borderRadius: 6, padding: '3px 6px',
                background: info ? info.bg : 'transparent',
                color: info ? info.color : '#D1D5DB',
                fontSize: 11, fontWeight: 700,
                cursor: editable && !day.outOfMonth ? 'pointer' : 'default'
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>{m.id}</span>
              <span>{code || (editable && !day.outOfMonth ? '+' : '')}</span>
            </button>
            {isEditing && (
              <CellEditor
                codes={category.codes}
                value={code}
                date={dk}
                onChange={(newCode) => onSetCell(dk, m.id, newCode)}
                onFillRange={(fromDate, toDate, fillCode) => onFillRange(fromDate, toDate, m.id, fillCode)}
                onClose={() => setEditingMoment(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AgentDetailTable({ category, agent, cellules, year, month, editable, onSetCell, onFillRange, onCopyDay }) {
  const weeks = useMemo(() => getWeeksMonday(year, month), [year, month]);
  const [copySource, setCopySource] = useState(null);

  return (
    <div>
      {editable && copySource && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          background: '#ECFAF8', border: '1px solid #BFE6E0', borderRadius: 10,
          padding: '8px 14px', fontSize: 12.5, color: '#0F766E', marginBottom: 12
        }}>
          <span>Journée copiée ({copySource}) — clique un autre jour pour coller.</span>
          <button onClick={() => setCopySource(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>
            <X size={13} /> Annuler
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {JOURS_LUN_DIM.map(j => (
          <div key={j} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {j}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
          {week.map(day => (
            <DayCell
              key={dateKey(day.date)}
              category={category}
              agent={agent}
              day={day}
              cellules={cellules}
              editable={editable}
              copySource={copySource}
              onPickCopySource={setCopySource}
              onPaste={(toDate) => { onCopyDay(copySource, toDate); setCopySource(null); }}
              onSetCell={onSetCell}
              onFillRange={onFillRange}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
