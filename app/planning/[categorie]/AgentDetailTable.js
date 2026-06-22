'use client';

import React, { useState, useMemo } from 'react';
import { Copy, X, ChevronLeft, ChevronRight, CalendarRange, Moon, Plus } from 'lucide-react';
import { getWeeksMonday, dateKey, JOURS_FR, MOMENTS, isPostGardeRS, isCancelledCode, cancelledCodeValue, makeCancelledCode } from '../config';
import CellEditor from './CellEditor';

const JOURS_LUN_DIM = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function mondayOf(date) {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  return d;
}

function DayHeader({ agent, day, cellules, editable, onPickCopySource, compact }) {
  const dk = dateKey(day.date);
  const postGarde = isPostGardeRS(agent.id, day.date, cellules);
  const filledCount = MOMENTS.filter(m => cellules[`${agent.id}|${dk}|${m.id}`]).length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0 2px 4px', minWidth: 0 }}>
      <span style={{ fontSize: compact ? 11 : 14, fontWeight: 800, color: day.outOfMonth ? '#C8C5BA' : '#1A2B3D' }}>
        {day.date.getDate()}
      </span>
      {postGarde && (
        <span title="Repos de garde (lendemain de garde)" style={{ display: 'flex', color: '#65521E', flexShrink: 0 }}>
          <Moon size={compact ? 9 : 11} fill="#65521E" />
        </span>
      )}
      {filledCount > 1 && (
        <span title={`${filledCount} créneaux remplis ce jour`} style={{
          fontSize: compact ? 7 : 8.5, fontWeight: 800, color: '#9CA3AF',
          background: '#F0EEE7', borderRadius: 999, padding: '1px 3px', flexShrink: 0
        }}>
          +{filledCount - 1}
        </span>
      )}
      {editable && !day.outOfMonth && !compact && (
        <button
          className="planning-copy-btn"
          onClick={e => { e.stopPropagation(); onPickCopySource(dk); }}
          title="Copier cette journée"
          style={{
            width: 14, height: 14, border: 'none', background: 'transparent',
            color: '#C8C5BA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}
        >
          <Copy size={9} />
        </button>
      )}
    </div>
  );
}

const CODES_JOURNEE_ENTIERE = ['CA', 'CF', 'ADM', 'X'];

function ConfirmChangeDialog({ label, onConfirm, onCancel }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: 4,
        background: '#fff', border: '1.5px solid #1A2B3D', borderRadius: 10,
        boxShadow: '0 8px 28px rgba(0,0,0,0.2)', padding: 12, width: 220
      }}
    >
      <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1A2B3D', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid #E5E1D8', background: '#fff', color: '#5B6573', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: '#1A2B3D', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Confirmer
        </button>
      </div>
    </div>
  );
}

function DayCell({ category, agent, day, cellules, editable, copySource, onPaste, onSetCell, onFillRange, compact, requireConfirm }) {
  const dk = dateKey(day.date);
  const [editingMoment, setEditingMoment] = useState(null); // cellId (date|moment) en cours d'édition
  const [pendingChange, setPendingChange] = useState(null); // { moments: [...], finalValue, label } en attente de confirmation
  const postGarde = isPostGardeRS(agent.id, day.date, cellules);

  // Code journée entière (CA/CF) : un seul badge sur toute la case, plutôt que répété sur les 3 bandes.
  const journeeCode = MOMENTS
    .map(m => cellules[`${agent.id}|${dk}|${m.id}`])
    .find(raw => CODES_JOURNEE_ENTIERE.includes(cancelledCodeValue(raw)));
  const journeeCancelled = isCancelledCode(journeeCode);
  const journeeCodeValue = journeeCancelled ? cancelledCodeValue(journeeCode) : journeeCode;
  const journeeInfo = journeeCodeValue ? category.codes.find(c => c.code === journeeCodeValue) : null;

  const applyChange = (momentId, currentRawCode, newCode) => {
    // CA/CF : s'applique à toute la journée (M+AM+N), incompatible avec tout autre poste le même jour.
    if (CODES_JOURNEE_ENTIERE.includes(newCode)) {
      const finalValues = MOMENTS.map(m => ({ moment: m.id, finalValue: newCode }));
      if (!requireConfirm) {
        finalValues.forEach(({ moment, finalValue }) => onSetCell(dk, moment, finalValue));
        return;
      }
      setPendingChange({
        moments: finalValues,
        label: `Marquer toute la journée du ${dk} en « ${newCode} » ?`
      });
      return;
    }

    // newCode === '' signifie suppression : si on a la confirmation activée et qu'il y avait
    // déjà quelque chose, on marque comme "annulé" plutôt que d'effacer la trace.
    const wasFilled = currentRawCode && !isCancelledCode(currentRawCode);
    const isClearing = newCode === '' || newCode === null;

    // Si on efface/modifie un créneau qui faisait partie d'un CA/CF journée entière,
    // on libère les 3 créneaux d'un coup (sinon les 2 autres resteraient bloqués en CA/CF résiduel).
    if (currentRawCode && CODES_JOURNEE_ENTIERE.includes(cancelledCodeValue(currentRawCode))) {
      const baseCode = cancelledCodeValue(currentRawCode);
      const finalValues = MOMENTS.map(m => ({
        moment: m.id,
        finalValue: isClearing
          ? (requireConfirm ? makeCancelledCode(baseCode) : '')
          : (m.id === momentId ? newCode : ''),
      }));
      if (!requireConfirm) {
        finalValues.forEach(({ moment, finalValue }) => onSetCell(dk, moment, finalValue));
        return;
      }
      const label = isClearing
        ? `Marquer toute la journée « ${baseCode} » comme annulée ?`
        : `Remplacer « ${baseCode} » de la journée par « ${newCode} » sur ${MOMENTS.find(m => m.id === momentId)?.label.toLowerCase()} ?`;
      setPendingChange({ moments: finalValues, label });
      return;
    }

    const finalValue = isClearing
      ? (requireConfirm && wasFilled ? makeCancelledCode(cancelledCodeValue(currentRawCode)) : '')
      : newCode;

    if (!requireConfirm) {
      onSetCell(dk, momentId, finalValue);
      return;
    }

    const label = isClearing
      ? (wasFilled ? `Marquer « ${cancelledCodeValue(currentRawCode)} » comme annulé ?` : 'Effacer cette case ?')
      : `Confirmer « ${newCode} » le ${dk} ?`;
    setPendingChange({ moments: [{ moment: momentId, finalValue }], label });
  };

  const confirmPending = () => {
    pendingChange.moments.forEach(({ moment, finalValue }) => onSetCell(dk, moment, finalValue));
    setPendingChange(null);
  };

  // Affichage compact : un seul badge journée entière si CA/CF détecté
  if (journeeCodeValue) {
    return (
      <div
        onClick={() => { if (editable && copySource && copySource !== dk) onPaste(dk); }}
        style={{
          border: '1px solid #E5E1D8', borderRadius: 10,
          padding: compact ? 3 : 5,
          background: day.outOfMonth ? '#FAFAF8' : '#fff',
          opacity: day.outOfMonth ? 0.5 : 1,
          height: '100%', display: 'flex', flexDirection: 'column',
          cursor: editable && copySource && copySource !== dk ? 'copy' : 'default',
          position: 'relative', minWidth: 0, boxSizing: 'border-box'
        }}
      >
        <button
          onClick={e => {
            e.stopPropagation();
            if (editable && !day.outOfMonth && !copySource) setEditingMoment(editingMoment === 'journee' ? null : 'journee');
          }}
          disabled={!editable || day.outOfMonth}
          title={journeeCancelled ? `Journée annulée (était : ${journeeCodeValue})` : `${journeeCodeValue} — journée entière`}
          style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px ${journeeCancelled ? 'dashed' : 'solid'} ${journeeInfo?.color || '#9CA3AF'}40`,
            borderRadius: 7,
            background: journeeInfo ? (journeeCancelled ? `${journeeInfo.bg}99` : journeeInfo.bg) : '#F0EEE7',
            color: journeeInfo?.color || '#9CA3AF',
            opacity: journeeCancelled ? 0.5 : 1,
            fontSize: compact ? 11 : 14, fontWeight: 800,
            textDecoration: journeeCancelled ? 'line-through' : 'none',
            cursor: editable && !day.outOfMonth ? 'pointer' : 'default',
            boxSizing: 'border-box'
          }}
        >
          {journeeCodeValue}
        </button>
        {editingMoment === 'journee' && !pendingChange && (
          <CellEditor
            codes={category.codes}
            value={journeeCodeValue}
            date={dk}
            onChange={(newCode) => { applyChange('M', journeeCode, newCode); setEditingMoment(null); }}
            onFillRange={() => {}}
            onClose={() => setEditingMoment(null)}
          />
        )}
        {pendingChange && (
          <ConfirmChangeDialog
            label={pendingChange.label}
            onConfirm={confirmPending}
            onCancel={() => setPendingChange(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => { if (editable && copySource && copySource !== dk) onPaste(dk); }}
      style={{
        border: postGarde ? '1.5px solid #65521E' : '1px solid #E5E1D8', borderRadius: 10,
        padding: compact ? 3 : 5,
        background: day.outOfMonth ? '#FAFAF8' : (postGarde ? '#F0EEE7' : '#fff'),
        opacity: day.outOfMonth ? 0.5 : 1,
        height: '100%', display: 'flex', flexDirection: 'column', gap: compact ? 2 : 3,
        cursor: editable && copySource && copySource !== dk ? 'copy' : 'default',
        position: 'relative', minWidth: 0, boxSizing: 'border-box'
      }}
    >
      {/* 3 bandes fixes empilées (matin/après-midi/nuit), chacune = exactement 1/3 de la case.
          Une bande remplie occupe tout son espace en bloc plein coloré ; une bande vide reste neutre. */}
      {MOMENTS.map(m => {
        const rawCode = cellules[`${agent.id}|${dk}|${m.id}`];
        const cancelled = isCancelledCode(rawCode);
        const code = cancelled ? cancelledCodeValue(rawCode) : rawCode;
        const info = code ? category.codes.find(c => c.code === code) : null;
        const cellId = `${dk}|${m.id}`;
        const isEditing = editingMoment === cellId;
        const isPending = pendingChange && pendingChange.moments.some(pc => pc.moment === m.id);
        return (
          <div key={m.id} style={{ position: 'relative', flex: '1 1 0', minHeight: 0 }}>
            <button
              onClick={e => {
                e.stopPropagation();
                if (editable && !day.outOfMonth && !copySource) setEditingMoment(isEditing ? null : cellId);
              }}
              disabled={!editable || day.outOfMonth}
              title={cancelled ? `${m.label} — créneau annulé (était : ${code})` : m.label}
              style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: info ? `1px ${cancelled ? 'dashed' : 'solid'} ${info.color}40` : (editable && !day.outOfMonth ? '1px dashed #E5E1D8' : 'none'),
                borderRadius: 6,
                background: info ? (cancelled ? `${info.bg}99` : info.bg) : 'transparent',
                color: info ? info.color : '#D1D5DB',
                opacity: cancelled ? 0.5 : 1,
                fontSize: compact ? 10 : 13, fontWeight: 800,
                textDecoration: cancelled ? 'line-through' : 'none',
                cursor: editable && !day.outOfMonth ? 'pointer' : 'default',
                boxSizing: 'border-box'
              }}
            >
              {code || (editable && !day.outOfMonth ? <Plus size={compact ? 9 : 11} /> : '')}
            </button>
            {isEditing && !isPending && (
              <CellEditor
                codes={category.codes}
                value={code}
                date={dk}
                onChange={(newCode) => { applyChange(m.id, rawCode, newCode); setEditingMoment(null); }}
                onFillRange={(fromDate, toDate, fillCode) => onFillRange(fromDate, toDate, m.id, fillCode)}
                onClose={() => setEditingMoment(null)}
              />
            )}
            {isPending && pendingChange.moments[0].moment === m.id && (
              <ConfirmChangeDialog
                label={pendingChange.label}
                onConfirm={confirmPending}
                onCancel={() => setPendingChange(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekGrid({ category, agent, week, cellules, editable, copySource, onPickCopySource, onPaste, onSetCell, onFillRange, compact, requireConfirm }) {
  return (
    <div style={{ marginBottom: compact ? 3 : 6 }}>
      <div className={compact ? 'planning-week-row planning-week-row--compact' : 'planning-week-row'} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: compact ? 3 : 6 }}>
        {week.map(day => (
          <DayHeader
            key={dateKey(day.date)}
            agent={agent}
            day={day}
            cellules={cellules}
            editable={editable}
            onPickCopySource={onPickCopySource}
            compact={compact}
          />
        ))}
      </div>
      <div
        className={compact ? 'planning-cells-row planning-cells-row--compact' : 'planning-cells-row'}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: compact ? 3 : 6, height: compact ? 64 : 150 }}
      >
        {week.map(day => (
          <DayCell
            key={dateKey(day.date)}
            category={category}
            agent={agent}
            day={day}
            cellules={cellules}
            editable={editable}
            copySource={copySource}
            onPaste={onPaste}
            onSetCell={onSetCell}
            onFillRange={onFillRange}
            compact={compact}
            requireConfirm={requireConfirm}
          />
        ))}
      </div>
    </div>
  );
}

export default function AgentDetailTable({ category, agent, cellules, year, month, editable, onSetCell, onFillRange, onCopyDay, requireConfirm }) {
  const allWeeks = useMemo(() => getWeeksMonday(year, month), [year, month]);
  const [copySource, setCopySource] = useState(null);
  const [mode, setMode] = useState('semaine'); // 'semaine' | 'mois'

  const today = new Date();
  const [weekAnchor, setWeekAnchor] = useState(mondayOf(today));

  // La semaine affichée est calculée directement depuis weekAnchor (navigation libre,
  // indépendante du mois/année figés transmis par le parent au montage). Le "mois de
  // référence" de la semaine est celui où tombe la majorité de ses jours, pour décider
  // quels jours apparaissent grisés (hors-mois) en cas de semaine à cheval.
  const currentWeek = useMemo(() => {
    const monday = mondayOf(weekAnchor);
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
    const monthCounts = {};
    week.forEach(d => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });
    const refMonthKey = Object.keys(monthCounts).reduce((a, b) => monthCounts[a] >= monthCounts[b] ? a : b);
    const [refYear, refMonth] = refMonthKey.split('-').map(Number);
    return week.map(d => ({ date: d, outOfMonth: d.getFullYear() !== refYear || d.getMonth() !== refMonth }));
  }, [weekAnchor]);

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
            requireConfirm={requireConfirm}
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
              requireConfirm={requireConfirm}
            />
          ))}
        </div>
      )}

      <style>{`
        .planning-week-grid, .planning-month-grid { container-type: inline-size; }

        /* Vue semaine (mode par défaut) */
        @media (max-width: 600px) {
          .planning-week-grid .planning-week-row,
          .planning-week-grid .planning-cells-row { gap: 4px !important; }
          .planning-week-grid button { padding: 3px 4px !important; font-size: 11px !important; }
          .planning-week-grid .planning-cells-row { height: 110px !important; }
        }
        @media (max-width: 460px) {
          .planning-week-grid button { padding: 2px 3px !important; font-size: 10px !important; }
          .planning-week-grid .planning-cells-row { height: 96px !important; }
          .planning-week-grid .planning-copy-btn { display: none !important; }
        }
        @media (max-width: 360px) {
          .planning-week-grid .planning-week-row,
          .planning-week-grid .planning-cells-row { gap: 3px !important; }
          .planning-week-grid button { font-size: 9px !important; }
          .planning-week-grid .planning-cells-row { height: 86px !important; }
        }

        /* Vue mois (compacte) */
        @media (max-width: 640px) {
          .planning-month-grid button { padding: 1px 2px !important; font-size: 8px !important; }
          .planning-month-grid .planning-week-row,
          .planning-month-grid .planning-cells-row { gap: 2px !important; }
          .planning-month-grid .planning-cells-row { height: 48px !important; }
        }
        @media (max-width: 420px) {
          .planning-month-grid button { font-size: 7px !important; }
          .planning-month-grid .planning-cells-row { height: 40px !important; }
        }
      `}</style>
    </div>
  );
}

const navBtnStyle = {
  width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5B6573'
};
