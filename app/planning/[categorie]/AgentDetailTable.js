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

// Renvoie le créneau prioritaire occupé ce jour-là (M > AM > N), ou 'M' par défaut si rien n'est rempli
// (pour que le "+" d'ajout reste positionné en haut, là où on commence naturellement à remplir).
function primaryMoment(agentId, dk, cellules) {
  for (const m of MOMENTS) {
    if (cellules[`${agentId}|${dk}|${m.id}`]) return m.id;
  }
  return 'M';
}

const MOMENT_ALIGN = { M: 'flex-start', AM: 'center', N: 'flex-end' };

function MomentPicker({ onSelect, onClose }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', zIndex: 45, top: 0, left: 0, right: 0,
        background: '#fff', border: '1px solid #E5E1D8', borderRadius: 10,
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)', padding: 6, display: 'flex', flexDirection: 'column', gap: 3
      }}
    >
      {MOMENTS.map(m => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 8px', borderRadius: 6, border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 11.5, fontWeight: 600, color: '#1A2B3D'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F7F6F2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {m.label}
          <span style={{ fontSize: 9, opacity: 0.5 }}>{m.id}</span>
        </button>
      ))}
      <button
        onClick={onClose}
        style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#9CA3AF' }}
      >
        Annuler
      </button>
    </div>
  );
}

function DayCell({ category, agent, day, cellules, editable, copySource, onPickCopySource, onPaste, onSetCell, onFillRange, compact }) {
  const dk = dateKey(day.date);
  const [editingMoment, setEditingMoment] = useState(null); // moment en cours d'édition (ouvre CellEditor)
  const [pickingMoment, setPickingMoment] = useState(false); // choix du créneau à éditer
  const postGarde = isPostGardeRS(agent.id, day.date, cellules);

  const activeMoment = primaryMoment(agent.id, dk, cellules);
  const code = cellules[`${agent.id}|${dk}|${activeMoment}`];
  const info = code ? category.codes.find(c => c.code === code) : null;

  const openEditorFor = (momentId) => {
    setPickingMoment(false);
    setEditingMoment(momentId);
  };

  const filledCount = MOMENTS.filter(m => cellules[`${agent.id}|${dk}|${m.id}`]).length;

  return (
    <div
      onClick={() => { if (editable && copySource && copySource !== dk) onPaste(dk); }}
      style={{
        border: postGarde ? '1.5px solid #65521E' : '1px solid #E5E1D8', borderRadius: 10,
        padding: compact ? 5 : 8,
        background: day.outOfMonth ? '#FAFAF8' : '#fff',
        opacity: day.outOfMonth ? 0.5 : 1,
        minHeight: compact ? 76 : 116, display: 'flex', flexDirection: 'column', gap: compact ? 2 : 4,
        cursor: editable && copySource && copySource !== dk ? 'copy' : 'default',
        position: 'relative', minWidth: 0, boxSizing: 'border-box', overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: compact ? 11 : 13, fontWeight: 800, color: day.outOfMonth ? '#C8C5BA' : '#1A2B3D' }}>
          {day.date.getDate()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {filledCount > 1 && (
            <span title={`${filledCount} créneaux remplis ce jour`} style={{
              fontSize: compact ? 8 : 9, fontWeight: 800, color: '#9CA3AF',
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
                width: 18, height: 18, border: 'none', background: 'transparent',
                color: '#C8C5BA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Copy size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Zone de positionnement vertical : la case occupe toute la hauteur restante,
          et le code s'aligne en haut (matin), au milieu (après-midi) ou en bas (nuit). */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: MOMENT_ALIGN[activeMoment] }}>
        <button
          onClick={e => {
            e.stopPropagation();
            if (!editable || day.outOfMonth || copySource) return;
            setPickingMoment(p => !p);
          }}
          disabled={!editable || day.outOfMonth}
          title={MOMENTS.find(m => m.id === activeMoment)?.label}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: info ? `1px solid ${info.color}40` : (editable && !day.outOfMonth ? '1.5px dashed #D1D5DB' : 'none'),
            borderRadius: 6,
            padding: compact ? '2px 4px' : '4px 7px',
            background: info ? info.bg : 'transparent',
            color: info ? info.color : '#C8C5BA',
            fontSize: compact ? 9.5 : 12, fontWeight: 800,
            cursor: editable && !day.outOfMonth ? 'pointer' : 'default'
          }}
        >
          <span style={{ fontSize: compact ? 7.5 : 9, fontWeight: 700, opacity: 0.65 }}>{activeMoment}</span>
          <span>{code || (editable && !day.outOfMonth ? <Plus size={compact ? 9 : 11} /> : '')}</span>
        </button>

        {pickingMoment && (
          <MomentPicker onSelect={openEditorFor} onClose={() => setPickingMoment(false)} />
        )}

        {editingMoment && (
          <div style={{ position: 'relative' }}>
            <CellEditor
              codes={category.codes}
              value={cellules[`${agent.id}|${dk}|${editingMoment}`]}
              date={dk}
              onChange={(newCode) => onSetCell(dk, editingMoment, newCode)}
              onFillRange={(fromDate, toDate, fillCode) => onFillRange(fromDate, toDate, editingMoment, fillCode)}
              onClose={() => setEditingMoment(null)}
            />
          </div>
        )}
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
          .planning-week-grid button span:first-child { display: none; }
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
          .planning-month-grid button span:first-child { display: none; }
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
