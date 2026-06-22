'use client';

import { useState, useEffect, useCallback } from 'react';

export function usePlanning() {
  const [planning, setPlanning] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/planning');
      const data = await res.json();
      setPlanning(data.planning || null);
    } catch (e) {
      setError('Impossible de charger le planning.');
    }
  }, []);

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

  const setCell = useCallback((categorie, agentId, date, moment, code) =>
    call({ action: 'setCell', categorie, agentId, date, moment, code }), [call]);

  const addAgent = useCallback((categorie, nomFamille, prenom, arrivee, depart) =>
    call({ action: 'addAgent', categorie, nomFamille, prenom, arrivee, depart }), [call]);

  const removeAgent = useCallback((categorie, agentId) =>
    call({ action: 'removeAgent', categorie, agentId }), [call]);

  const renameAgent = useCallback((categorie, agentId, nomFamille, prenom) =>
    call({ action: 'renameAgent', categorie, agentId, nomFamille, prenom }), [call]);

  const updateAgentDates = useCallback((categorie, agentId, arrivee, depart) =>
    call({ action: 'updateAgentDates', categorie, agentId, arrivee, depart }), [call]);

  const copyDay = useCallback((categorie, agentId, fromDate, toDate) =>
    call({ action: 'copyDay', categorie, agentId, fromDate, toDate }), [call]);

  const fillRange = useCallback((categorie, agentId, fromDate, toDate, moment, code) =>
    call({ action: 'fillRange', categorie, agentId, fromDate, toDate, moment, code }), [call]);

  return { planning, setCell, addAgent, removeAgent, renameAgent, updateAgentDates, copyDay, fillRange, error };
}
