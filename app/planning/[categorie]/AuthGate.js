'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, Loader2 } from 'lucide-react';

// Stockage session : { role, agentId, nom, prenom, codePostal }
function getSessionKey(codePostal, role) {
  return `kahani_auth_${codePostal}_${role}`;
}

export default function AuthGate({ codePostal, dispensaireNom, color, role, children }) {
  const [status, setStatus] = useState('checking'); // checking | locked | firstLogin | unlocked
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    const key = getSessionKey(codePostal, role);
    const stored = sessionStorage.getItem(key);
    if (stored) {
      setSessionData(JSON.parse(stored));
      setStatus('unlocked');
    } else {
      setStatus('locked');
    }
  }, [codePostal, role]);

  const handleSubmit = async () => {
    if (!matricule.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/auth?codePostal=${codePostal}&matricule=${matricule.trim()}`);
      const data = await res.json();

      if (role === 'chef') {
        if (data.role === 'chef') {
          const session = { role: 'chef', dispensaire: data.dispensaire, codePostal };
          sessionStorage.setItem(getSessionKey(codePostal, role), JSON.stringify(session));
          setSessionData(session);
          setStatus('unlocked');
        } else {
          setError('Matricule chef incorrect');
          setMatricule('');
        }
      } else {
        // Médecin
        if (data.role === 'medecin') {
          const session = { role: 'medecin', agentId: data.agentId, nom: data.nom, prenom: data.prenom, codePostal };
          sessionStorage.setItem(getSessionKey(codePostal, role), JSON.stringify(session));
          setSessionData(session);
          setStatus('unlocked');
        } else if (data.role === 'nouveau') {
          setStatus('firstLogin');
        } else {
          setError('Matricule introuvable');
          setMatricule('');
        }
      }
    } catch (e) {
      setError('Erreur de connexion');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!nom.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codePostal, matricule: matricule.trim(), nomFamille: nom, prenom }),
      });
      const data = await res.json();
      if (res.ok) {
        const session = { role: 'medecin', agentId: data.agentId, nom: data.nom, prenom: data.prenom, codePostal };
        sessionStorage.setItem(getSessionKey(codePostal, role), JSON.stringify(session));
        setSessionData(session);
        setStatus('unlocked');
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (e) {
      setError('Erreur de connexion');
    }
    setLoading(false);
  };

  if (status === 'checking') return null;

  if (status === 'unlocked') {
    return typeof children === 'function' ? children(sessionData) : children;
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F6F2'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 40,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)', width: 340, textAlign: 'center'
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
        }}>
          <Stethoscope size={24} color="#fff" />
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A2B3D', margin: '0 0 4px' }}>
          {dispensaireNom}
        </h2>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 24px' }}>
          {status === 'firstLogin'
            ? 'Première connexion — renseignez vos informations'
            : role === 'chef' ? 'Accès chef de service' : 'Accès médecins'}
        </p>

        {status === 'locked' && (
          <>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textAlign: 'left', marginBottom: 6 }}>
              Matricule {role === 'chef' ? 'chef' : 'médecin'}
            </label>
            <input
              type="text"
              value={matricule}
              onChange={e => setMatricule(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={role === 'chef' ? 'ex. 97670' : 'ex. 023799'}
              autoFocus
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
                border: `2px solid ${error ? '#C2410C' : '#E5E1D8'}`,
                fontSize: 16, outline: 'none', marginBottom: 12, letterSpacing: '0.1em',
              }}
            />
          </>
        )}

        {status === 'firstLogin' && (
          <>
            <p style={{ fontSize: 12, color: '#1A2B3D', background: '#F0F9FF', borderRadius: 8, padding: '8px 12px', marginBottom: 16, textAlign: 'left' }}>
              Matricule <strong>{matricule}</strong> non reconnu. Créez votre profil :
            </p>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Nom de famille (ex. DUPONT)"
              autoFocus
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box', border: '2px solid #E5E1D8', fontSize: 14, outline: 'none', marginBottom: 10 }}
            />
            <input
              type="text"
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              placeholder="Prénom (ex. Jean)"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box', border: '2px solid #E5E1D8', fontSize: 14, outline: 'none', marginBottom: 14 }}
            />
          </>
        )}

        {error && (
          <p style={{ fontSize: 12, color: '#C2410C', marginBottom: 10, fontWeight: 600 }}>{error}</p>
        )}

        <button
          onClick={status === 'firstLogin' ? handleRegister : handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
            background: loading ? '#9CA3AF' : color, color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          {status === 'firstLogin' ? 'Créer mon profil' : 'Accéder'}
        </button>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
