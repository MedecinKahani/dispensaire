'use client';

import React, { useState, useMemo } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { dateKey, getPostesForDay, getAgentsForPoste, formatAgentName } from '../config';

function SlotPicker({ category, agents, date, cellules, moment, excludeAgentId, onPick, onClose }) {
  const { disponibles, indisponibles } = useMemo(
    () => getAgentsForPoste(category, agents, date, cellules),
    [category, agents, date, cellules]
  );

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', zIndex: 50, top: '100%', left: 0, marginTop: 4,
        background: '#fff', border: '1px solid #E5E1D8', borderRadius: 10,
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)', padding: 10, width: 260,
        maxHeight: 320, overflowY: 'auto'
      }}
    >
      {disponibles.length === 0 && (
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 6px 8px' }}>
          Aucun médecin disponible ce jour pour ce créneau.
        </p>
      )}
      {disponibles.map(({ agent }) => (
        <button
          key={agent.id}
          onClick={() => { onPick(agent.id); onClose(); }}
          style={{
            display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px',
            borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#1A2B3D'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F7F6F2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {formatAgentName(agent)}
        </button>
      ))}

      {indisponibles.length > 0 && (
        <>
          <p style={{ fontSize: 10.5, fontWeight: 700, color: '#C8C5BA', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '10px 6px 4px' }}>
            Indisponibles
          </p>
          {indisponibles.map(({ agent, reason }) => (
            <div key={agent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', fontSize: 12, color: '#C8C5BA' }}>
              <span>{formatAgentName(agent)}</span>
              <span style={{ fontSize: 10.5, fontStyle: 'italic' }}>{reason}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function PosteCard({ category, agents, date, cellules, poste, onAssign, onUnassign }) {
  const dk = dateKey(date);
  const info = category.codes.find(c => c.code === poste.code);
  const [openSlot, setOpenSlot] = useState(null); // index du slot ouvert

  // Médecins déjà affectés à ce poste précis (code + moment) ce jour-là
  const assignedAgents = agents.filter(a => cellules[`${a.id}|${dk}|${poste.moment}`] === poste.code);
  const filledCount = assignedAgents.length;
  const isComplete = filledCount >= poste.slots;

  const slotsArray = Array.from({ length: poste.slots });

  return (
    <div style={{
      border: `1.5px solid ${isComplete ? '#E5E1D8' : (poste.optionnel ? '#E5E1D8' : '#F3C7B0')}`,
      borderRadius: 12, padding: 12, background: '#fff', minWidth: 150, flex: '1 1 150px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: info?.color || '#1A2B3D' }}>{poste.code}</span>
        {!isComplete && !poste.optionnel && (
          <AlertCircle size={13} color="#C2410C" />
        )}
        {poste.optionnel && (
          <span style={{ fontSize: 9.5, color: '#9CA3AF', fontWeight: 600 }}>optionnel</span>
        )}
      </div>

      {slotsArray.map((_, i) => {
        const agent = assignedAgents[i];
        const cellId = `${poste.code}-${poste.moment}-${i}`;
        return (
          <div key={i} style={{ position: 'relative', marginBottom: 6 }}>
            {agent ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: info?.bg || '#F7F6F2', color: info?.color || '#1A2B3D',
                borderRadius: 7, padding: '6px 8px', fontSize: 12, fontWeight: 600
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatAgentName(agent)}</span>
                <button
                  onClick={() => onUnassign(agent.id, poste)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, flexShrink: 0, display: 'flex' }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setOpenSlot(openSlot === cellId ? null : cellId)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  width: '100%', border: '1.5px dashed #D1D5DB', borderRadius: 7,
                  padding: '6px 8px', fontSize: 11.5, color: '#9CA3AF', cursor: 'pointer', background: '#fff'
                }}
              >
                <Plus size={12} /> à pourvoir
              </button>
            )}
            {openSlot === cellId && (
              <SlotPicker
                category={category}
                agents={agents}
                date={date}
                cellules={cellules}
                moment={poste.moment}
                onPick={(agentId) => onAssign(agentId, poste)}
                onClose={() => setOpenSlot(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PosteBoard({ category, agents, date, cellules, onSetCell }) {
  const dk = dateKey(date);
  const postesM = getPostesForDay(category.id, date).filter(p => p.moment === 'M');
  const postesAM = getPostesForDay(category.id, date).filter(p => p.moment === 'AM');
  const postesN = getPostesForDay(category.id, date).filter(p => p.moment === 'N');

  if (postesM.length === 0 && postesAM.length === 0 && postesN.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 16px', color: '#9CA3AF', fontSize: 13.5, border: '1px dashed #E5E1D8', borderRadius: 12 }}>
        Pas de structure de poste prédéfinie ce jour — utilise la vue agent pour saisir librement.
      </div>
    );
  }

  const assign = (agentId, poste) => onSetCell(agentId, dk, poste.moment, poste.code);
  const unassign = (agentId, poste) => onSetCell(agentId, dk, poste.moment, '');

  const Section = ({ title, postes }) => postes.length === 0 ? null : (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
        {title}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {postes.map(poste => (
          <PosteCard
            key={poste.code}
            category={category}
            agents={agents}
            date={date}
            cellules={cellules}
            poste={poste}
            onAssign={assign}
            onUnassign={unassign}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Section title="Matin · 7h–13h" postes={postesM} />
      <Section title="Après-midi · 13h–19h" postes={postesAM} />
      <Section title="Nuit · 19h–7h" postes={postesN} />
    </div>
  );
}
