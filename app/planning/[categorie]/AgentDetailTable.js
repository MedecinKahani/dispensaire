'use client';

import React, { useState, useMemo } from 'react';
import { Copy, X, ChevronLeft, ChevronRight, CalendarRange, Moon, Plus } from 'lucide-react';
import { getWeeksMonday, dateKey, JOURS_FR, MOMENTS, isPostGardeRS } from '../config';
import CellEditor from './CellEditor';

const JOURS_LUN_DIM = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function mondayOf(date) {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  return d;
}

function DayCell({ category, agent, day, cellules, editable, copySource, onPickCopySource, onPaste, onSetCell, onFillRange, compact }) {
  const dk = dateKey(day.date);
  const [editingMoment, setEditingMoment] = useState(null); // cellId (date|moment) en cours d'édition
  const postGarde = isPostGardeRS(agent.id, day.date, cellules);

  const filledCount = MOMENTS.filter(m => cellules[`${agent.id}|${dk}|${m.id}`]).length;

  return (
    <div
      onClick={() => { if (editable && copySource && copySource !== dk) onPaste(dk); }}
      style={{
        border: postGarde ? '1.5px solid #65521E' : '1px solid #E5E1D8', borderRadius: 10,
        padding: compact ? 4 : 6,
        background: day.outOfMonth ? '#FAFAF8' : '#fff',
        opacity: day.outOfMonth ? 0.5 : 1,
        minHeight: compact ? 76 : 130, display: 'flex', flexDirection: 'column', gap: compact ? 2 : 4,
        cursor: editable && copySource && copySource !== dk ? 'copy' : 'default',
        position: 'relative', minWidth: 0, boxSizing: 'border-box', overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: compact ? '1px 2px' : '2px 2px' }}>
        <span style={{ fontSize: compact ? 11 : 13, fontWeight: 800, color: day.outOfMonth ? '#C8C5BA' : '#1A2B3D' }}>
          {day.date.getDate()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {filledCount > 1 && (
            <span title={`${filledCount} créneaux remplis ce jour`} style={{
              fontSize: compact ? 7.5 : 9, fontWeight: 800, color: '#9CA3AF',
              background: '#F0EEE7', borderRadius: 999, padding: '1px 4px'
            }}>
              +{filledCount - 1}
            </span>
          )}
          {postGarde && (
            <span title="Repos de garde (lendemain de garde)" style={{ display: 'flex', color: '#65521E' }}>
              <Moon size={compact ? 10 : 12} fill="#65521E" />
            </span>
          )}
          {editable && !day.outOfMonth && !compact && (
            <button
              className="planning-copy-btn"
              onClick={e => { e.stopPropagation(); onPickCopySource(dk); }}
              title="Copier cette journée"
              style={{
                width: 16, height: 16, border: 'none', background: 'transparent',
                color: '#C8C5BA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}
            >
              <Copy size={10} />
            </button>
          )}
        </div>
      </div>

      {/* 3 bandes fixes empilées (matin/après-midi/nuit), chacune = 1/3 de la hauteur restante.
          Une bande remplie occupe tout son espace en bloc plein coloré ; une bande vide reste neutre. */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: compact ? 2 : 3, minHeight: 0 }}>
        {MOMENTS.map(m => {
          const code = cellules[`${agent.id}|${dk}|${m.id}`];
          const info = code ? category.codes.find(c => c.code === code) : null;
          const cellId = `${dk}|${m.id}`;
          const isEditing = editingMoment === cellId;
          return (
            <div key={m.id} style={{ position: 'relative', flex: 1, minHeight: 0 }}>
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (editable && !day.outOfMonth && !copySource) setEditingMoment(isEditing ? null : cellId);
                }}
                disabled={!editable || day.outOfMonth}
                title={m.label}
                style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: info ? `1px solid ${info.color}40` : (editable && !day.outOfMonth ? '1px dashed #E5E1D8' : 'none'),
                  borderRadius: 6,
                  background: info ? info.bg : 'transparent',
                  color: info ? info.color : '#D1D5DB',
                  fontSize: compact ? 10 : 13, fontWeight: 800,
                  cursor: editable && !day.outOfMonth ? 'pointer' : 'default',
                  boxSizing: 'border-box'
                }}
              >
                {code || (editable && !day.outOfMonth ? <Plus size={compact ? 9 : 11} /> : '')}
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
    </div>
  );
}

function WeekGrid({ category, agent, week, cellules, editable, copySource, onPickCopySource, onPaste, onSetCell, onFillRange, compact }) {
  return (
    <div className={compact ? 'planning-week-row planning-week-row--compact' : 'planning-week-row'} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: compact ? 3 : 6, marginBottom: compact ? 3 : 6 }}>
      {week.map(day => (
        <DayCell
          key={dateKey(day.date)}
          category={category}
          agent={agent}
          day={day}
          cellules={cellules}
          editable={editable}
          copySource={copySource}
          onPickCopySource={onPickCopySource}
          onPaste={onPaste}
          onSetCell={onSetCell}
          onFillRange={onFillRange}
          compact={compact}
        />
      ))}
    </div>
  );
}

export default function AgentDetailTable({ category, agent, cellules, year, month, editable, onSetCell, onFillRange, onCopyDay }) {
  const allWeeks = useMemo(() => getWeeksMonday(year, month), [year, month]);
  const [copySource, setCopySource] = useState(null);
  const [mode, setMode] = useState('semaine'); // 'semaine' | 'mois'

  const today = new Date();
  const [weekAnchor, setWeekAnchor] = useState(mondayOf(today));

  const currentWeek = useMemo(() => {
    return allWeeks.find(w => dateKey(w[0].date) === dateKey(mondayOf(weekAnchor)))
      || [...Array(7)].map((_, i) => {
        const d = new Date(mondayOf(weekAnchor));
        d.setDate(d.getDate() + i);
        return { date: d, outOfMonth: d.getMonth() !== month };
      });
  }, [allWeeks, weekAnchor, month]);

  const navigateWeek = (delta) => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + delta * 7);
    setWeekAnchor(d);
  };

  const weekLabel = `${currentWeek[0].date.getDate()} – ${currentWeek[6].date.getDate()} ${currentWeek[6].date.toLocaleDateString('fr-FR', { month: 'long' })}`;

  const handlePaste = (toDate) => { onCopyDay(copySource, toDate); setCopySource(null); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        {mode === 'semaine' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#F7F6F2', borderRadius: 10, padding: 3 }}>
            <button onClick={() => navigateWeek(-1)} style={navBtnStyle}><ChevronLeft size={15} /></button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2B3D', padding: '0 8px', minWidth: 150, textAlign: 'center', textTransform: 'capitalize' }}>
              {weekLabel}
            </span>
            <button onClick={() => navigateWeek(1)} style={navBtnStyle}><ChevronRight size={15} /></button>
          </div>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2B3D' }}>Mois complet</span>
        )}

        <button
          onClick={() => setMode(m => m === 'semaine' ? 'mois' : 'semaine')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999,
            border: '1px solid #E5E1D8', background: '#fff', color: '#5B6573',
            fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}
        >
          <CalendarRange size={13} /> {mode === 'semaine' ? 'Voir le mois complet' : 'Revenir à la semaine'}
        </button>
      </div>

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

      <div className={mode === 'mois' ? 'planning-week-row planning-week-row--compact' : 'planning-week-row'} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: mode === 'mois' ? 3 : 6, marginBottom: 6 }}>
        {JOURS_LUN_DIM.map(j => (
          <div key={j} style={{ fontSize: mode === 'mois' ? 9.5 : 11, fontWeight: 700, color: '#9CA3AF', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em', overflow: 'hidden' }}>
            {mode === 'mois' ? j.slice(0, 2) : j}
          </div>
        ))}
      </div>

      {mode === 'semaine' ? (
        <div className="planning-week-grid">
          <WeekGrid
            category={category} agent={agent} week={currentWeek} cellules={cellules}
            editable={editable} copySource={copySource} onPickCopySource={setCopySource}
            onPaste={handlePaste} onSetCell={onSetCell} onFillRange={onFillRange} compact={false}
          />
        </div>
      ) : (
        <div className="planning-month-grid">
          {allWeeks.map((week, wi) => (
            <WeekGrid
              key={wi}
              category={category} agent={agent} week={week} cellules={cellules}
              editable={editable} copySource={copySource} onPickCopySource={setCopySource}
              onPaste={handlePaste} onSetCell={onSetCell} onFillRange={onFillRange} compact={true}
            />
          ))}
        </div>
      )}

      <style>{`
        .planning-week-grid, .planning-month-grid { container-type: inline-size; }

        /* Vue semaine (mode par défaut) : on réduit progressivement avant de masquer le label M/AM/N */
        @media (max-width: 600px) {
          .planning-week-row, .planning-week-grid .planning-week-row { gap: 4px !important; }
          .planning-week-grid button { padding: 3px 4px !important; font-size: 10px !important; }
          .planning-week-grid .planning-week-row > div > div { min-height: 92px !important; padding: 5px !important; }
        }
        @media (max-width: 460px) {
          .planning-week-grid button { padding: 2px 3px !important; font-size: 9px !important; }
          .planning-week-grid .planning-week-row > div > div { min-height: 78px !important; padding: 4px !important; }
          .planning-week-grid .planning-copy-btn { display: none !important; }
        }
        @media (max-width: 360px) {
          .planning-week-row { gap: 3px !important; }
          .planning-week-grid button { font-size: 8px !important; }
        }

        /* Vue mois (compacte) */
        @media (max-width: 640px) {
          .planning-month-grid button { padding: 1px 2px !important; font-size: 8px !important; }
          .planning-month-grid .planning-week-row { gap: 2px !important; }
          .planning-month-grid .planning-week-row > div > div { min-height: 52px !important; padding: 2px !important; gap: 1px !important; }
        }
        @media (max-width: 420px) {
          .planning-month-grid button { font-size: 7px !important; }
          .planning-month-grid .planning-week-row > div > div { min-height: 44px !important; }
        }
      `}</style>
    </div>
  );
}

const navBtnStyle = {
  width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5B6573'
};
