'use client';

import { useState, useEffect, useCallback } from 'react';

export function usePlanning(categorie = 'medical') {
  const [planning, setPlanning] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/planning?categorie=${categorie}`);
      const data = await res.json();
      setPlanning(data.planning || null);
    } catch (e) {
      setError('Impossible de charger le planning.');
    }
  }, [categorie]);

  useEffect(() => { load(); }, [load]);

  const call = useCallback(async (body) => {
    try {
      const res = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setError('Enregistrement impossible. Réessaie.');
        return null;
      }
      setPlanning(data.planning);
      setError(null);
      return data;
    } catch (e) {
      setError('Connexion perdue. Réessaie dans un instant.');
      return null;
    }
  }, []);

  const setCell = useCallback((cat, agentId, date, moment, code) =>
    call({ action: 'setCell', categorie: cat, agentId, date, moment, code }), [call]);

  const addAgent = useCallback((cat, nomFamille, prenom, arrivee, depart) =>
    call({ action: 'addAgent', categorie: cat, nomFamille, prenom, arrivee, depart }), [call]);

  const removeAgent = useCallback((cat, agentId) =>
    call({ action: 'removeAgent', categorie: cat, agentId }), [call]);

  const renameAgent = useCallback((cat, agentId, nomFamille, prenom) =>
    call({ action: 'renameAgent', categorie: cat, agentId, nomFamille, prenom }), [call]);

  const updateAgentDates = useCallback((cat, agentId, arrivee, depart) =>
    call({ action: 'updateAgentDates', categorie: cat, agentId, arrivee, depart }), [call]);

  const copyDay = useCallback((cat, agentId, fromDate, toDate) =>
    call({ action: 'copyDay', categorie: cat, agentId, fromDate, toDate }), [call]);

  const fillRange = useCallback((cat, agentId, fromDate, toDate, moment, code) =>
    call({ action: 'fillRange', categorie: cat, agentId, fromDate, toDate, moment, code }), [call]);

  const setGuide = useCallback((cat, agentId, date, guideId) =>
    call({ action: 'setGuide', categorie: cat, agentId, date, guideId }), [call]);

  const toggleFerie = useCallback((cat, date) =>
    call({ action: 'toggleFerie', categorie: cat, date }), [call]);

  return { planning, setCell, addAgent, removeAgent, renameAgent, updateAgentDates, copyDay, fillRange, setGuide, toggleFerie, error };
}
