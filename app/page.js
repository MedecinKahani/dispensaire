'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, X, Phone, Stethoscope, ChevronRight, AlertTriangle, Loader2, Trash2, Edit3, Upload, Check, Compass, Siren, Repeat, Calendar, Baby, Pill, Sparkles } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'caribou',
    label: 'Caribou — Bienvenue',
    icon: Compass,
    color: '#0F766E',
    bg: '#ECFAF8',
    description: 'Mayotte, arrivée, culture mahoraise, organisation Kahani'
  },
  {
    id: 'vitales',
    label: 'Urgences vitales',
    icon: Siren,
    color: '#C2410C',
    bg: '#FDF1EC',
    description: 'Pronostic vital engagé : ACR, anaphylaxie, CVO, état de mal...'
  },
  {
    id: 'courantes',
    label: 'Consultations courantes',
    icon: Stethoscope,
    color: '#B45309',
    bg: '#FEF3E2',
    description: 'Motifs fréquents non vitaux : angine, GEA, dermato, otite...'
  },
  {
    id: 'chronique',
    label: 'Suivi chronique',
    icon: Repeat,
    color: '#15803D',
    bg: '#ECFDF3',
    description: 'Diabète, HTA, drépanocytose, VIH, hépatite B... suivi au long cours'
  },
  {
    id: 'annuaire',
    label: 'Annuaire & Avis Spé',
    icon: Phone,
    color: '#0E7490',
    bg: '#EBF6F8',
    description: 'Contacts, spécialistes, filières d\'évacuation'
  },
  {
    id: 'pediatrie',
    label: 'Pédiatrie',
    icon: Baby,
    color: '#5B21B6',
    bg: '#F2EBFB',
    description: 'Protocoles pédiatriques adaptés au dispensaire (Le P\'tit Mwana)'
  },
  {
    id: 'pharmacie',
    label: 'Pharmacie',
    icon: Pill,
    color: '#B91C1C',
    bg: '#FEECEC',
    description: 'Livret du médicament — stock disponible au CMR de Kahani'
  }
];

// La génération d'ID et la clé de stockage sont maintenant gérées côté serveur (app/api/fiches/route.js)

function useFiches() {
  const [fiches, setFiches] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/fiches');
      const data = await res.json();
      setFiches(data.fiches || []);
    } catch (e) {
      setFiches([]);
      setError('Impossible de charger la base. Vérifie ta connexion.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const call = useCallback(async (body) => {
    try {
      const res = await fetch('/api/fiches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.error) {
        setError('Enregistrement impossible. Réessaie.');
        return null;
      }
      setFiches(data.fiches);
      setError(null);
      return data;
    } catch (e) {
      setError('Connexion perdue. Tes modifications ne sont pas encore sauvegardées — réessaie dans un instant.');
      return null;
    }
  }, []);

  const addFiche = useCallback((fiche) => call({ action: 'add', fiche }), [call]);

  const addFichesBulk = useCallback(async (newFiches) => {
    const data = await call({ action: 'bulkAdd', fiches: newFiches });
    return data ? data.added : 0;
  }, [call]);

  const updateFiche = useCallback((id, patch) => call({ action: 'update', id, patch }), [call]);

  const deleteFiche = useCallback((id) => call({ action: 'delete', id }), [call]);

  return { fiches, addFiche, addFichesBulk, updateFiche, deleteFiche, error, reload: load };
}

function CategoryBadge({ catId, size = 'sm' }) {
  const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES.find(c => c.id === 'caribou');
  const Icon = cat.icon;
  const px = size === 'sm' ? '4px 10px' : '6px 14px';
  const fs = size === 'sm' ? '12px' : '13px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: px, borderRadius: 999, background: cat.bg, color: cat.color,
      fontSize: fs, fontWeight: 600, letterSpacing: '0.01em'
    }}>
      <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2.5} />
      {cat.label}
    </span>
  );
}

function IntroModal({ onClose, onSeeFiches }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,43,61,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, zIndex: 100
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%',
          padding: '24px 24px 22px 24px', position: 'relative',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute', top: 14, right: 14, background: '#F3F1EC', border: 'none',
            borderRadius: 999, width: 30, height: 30, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#5B6573'
          }}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={18} color="#C2410C" strokeWidth={2.5} />
          <h2 style={{
            fontFamily: "'Source Serif 4', Georgia, serif", color: '#1A2B3D',
            fontSize: 19, fontWeight: 700, margin: 0
          }}>
            À quoi sert ce site ?
          </h2>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#4B5563', margin: '0 0 16px 0' }}>
          Ce site rassemble les fiches pratiques de l'équipe du dispensaire de Kahani : protocoles, conduites à tenir, contacts et informations utiles au quotidien. Chaque fiche est écrite et mise à jour par les médecins qui l'utilisent.
        </p>

        {/* Aperçu de la barre de recherche IA */}
        <div style={{
          background: '#1A2B3D', borderRadius: 12, padding: '14px 16px', marginBottom: 8
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#6B7C90" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <div style={{
              background: '#fff', borderRadius: 10, padding: '10px 40px 10px 38px',
              fontSize: 13.5, color: '#9CA3AF'
            }}>
              Décris le symptôme ou la question…
            </div>
            <Sparkles size={15} color="#C2410C" style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: '#4B5563', margin: '0 0 18px 0' }}>
          <strong style={{ color: '#1A2B3D' }}>Recherche intelligente (IA)</strong> — tape un symptôme, une question ou un terme familier ("bébé qui tousse", "allergie pénicilline"), pas besoin des mots exacts de la fiche.
        </p>

        <button
          onClick={onSeeFiches}
          style={{
            width: '100%', padding: '12px 18px', borderRadius: 10, border: 'none',
            background: '#1A2B3D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer'
          }}
        >
          Voir les fiches par catégorie
        </button>
      </div>
    </div>
  );
}

function FicheCard({ fiche, onClick }) {
  const cat = CATEGORIES.find(c => c.id === fiche.category) || CATEGORIES.find(c => c.id === 'caribou');
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', width: '100%', background: '#fff',
        border: '1px solid #E5E1D8', borderRadius: 14, padding: '18px 20px',
        cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex',
        flexDirection: 'column', gap: 10, position: 'relative'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.boxShadow = `0 2px 12px ${cat.color}1a`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E1D8'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <h3 style={{
          fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18, fontWeight: 600,
          color: '#1A2B3D', margin: 0, lineHeight: 1.3
        }}>
          {fiche.title}
        </h3>
        <ChevronRight size={18} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 3 }} />
      </div>
      {fiche.summary && (
        <p style={{ margin: 0, fontSize: 14, color: '#5B6573', lineHeight: 1.5 }}>
          {fiche.summary.length > 120 ? fiche.summary.slice(0, 120) + '…' : fiche.summary}
        </p>
      )}
      <CategoryBadge catId={fiche.category} />
    </button>
  );
}

function FicheDetail({ fiche, onClose, onEdit, onDelete }) {
  if (!fiche) return null;
  const cat = CATEGORIES.find(c => c.id === fiche.category) || CATEGORIES.find(c => c.id === 'caribou');
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,43,61,0.4)', zIndex: 50,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '0', overflowY: 'auto'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: '100%', maxWidth: 760, minHeight: '100vh',
          padding: '0 0 60px 0', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{
          position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #E5E1D8',
          padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5
        }}>
          <CategoryBadge catId={fiche.category} size="md" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onEdit(fiche)} aria-label="Modifier" style={iconBtnStyle}>
              <Edit3 size={18} color="#5B6573" />
            </button>
            <button onClick={() => onDelete(fiche)} aria-label="Supprimer" style={iconBtnStyle}>
              <Trash2 size={18} color="#5B6573" />
            </button>
            <button onClick={onClose} aria-label="Fermer" style={iconBtnStyle}>
              <X size={20} color="#5B6573" />
            </button>
          </div>
        </div>
        <div style={{ padding: '36px 32px 0 32px' }}>
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 30, fontWeight: 700,
            color: '#1A2B3D', margin: '0 0 8px 0', lineHeight: 1.2
          }}>
            {fiche.title}
          </h1>
          {fiche.updatedAt && (
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 28px 0' }}>
              Mis à jour le {new Date(fiche.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          <div style={{
            fontSize: 16, lineHeight: 1.75, color: '#2D3744', whiteSpace: 'pre-wrap',
            fontFamily: "'Inter', system-ui, sans-serif"
          }}>
            {fiche.content}
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle = {
  background: '#F7F6F2', border: '1px solid #E5E1D8', borderRadius: 8,
  width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer'
};

function ImportPanel({ onImport, onCancel }) {
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(null);

  const validCategoryIds = CATEGORIES.map(c => c.id);

  const handleParse = (text) => {
    setRaw(text);
    setDone(null);
    if (!text.trim()) { setParsed(null); setParseError(null); return; }
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Le JSON doit être un tableau de fiches.');
      const cleaned = data.map((f, i) => {
        if (!f.title || !f.content) throw new Error(`Fiche #${i + 1} : titre ou contenu manquant.`);
        return {
          title: String(f.title).trim(),
          category: validCategoryIds.includes(f.category) ? f.category : 'caribou',
          summary: f.summary ? String(f.summary).trim() : '',
          content: String(f.content).trim()
        };
      });
      setParsed(cleaned);
      setParseError(null);
    } catch (e) {
      setParsed(null);
      setParseError(e.message || 'JSON invalide.');
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    const count = await onImport(parsed);
    setImporting(false);
    setDone(count);
    setRaw('');
    setParsed(null);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,43,61,0.4)', zIndex: 60,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto'
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', width: '100%', maxWidth: 680, minHeight: '100vh', padding: '0 0 60px 0'
      }}>
        <div style={{
          position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #E5E1D8',
          padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 700, margin: 0, color: '#1A2B3D' }}>
            Import en masse
          </h2>
          <button onClick={onCancel} style={iconBtnStyle}><X size={20} color="#5B6573" /></button>
        </div>

        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ fontSize: 14, color: '#5B6573', lineHeight: 1.6, margin: 0 }}>
            Colle ici un tableau JSON de fiches : <code style={{ background: '#F7F6F2', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>
              [{'{'}"title", "category", "summary", "content"{'}'}, ...]
            </code>
            <br />Catégories valides : {CATEGORIES.map(c => c.id).join(', ')}.
          </p>

          <textarea
            value={raw}
            onChange={e => handleParse(e.target.value)}
            placeholder='[{"title": "...", "category": "urgences", "summary": "...", "content": "..."}]'
            rows={14}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5 }}
          />

          {parseError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9A3412', fontSize: 13, background: '#FDF1EC', padding: '10px 14px', borderRadius: 8 }}>
              <AlertTriangle size={15} style={{ flexShrink: 0 }} /> {parseError}
            </div>
          )}

          {parsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0E7490', fontSize: 13, background: '#EBF6F8', padding: '10px 14px', borderRadius: 8 }}>
              <Check size={15} style={{ flexShrink: 0 }} /> {parsed.length} fiche{parsed.length > 1 ? 's' : ''} prête{parsed.length > 1 ? 's' : ''} à importer.
            </div>
          )}

          {done !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803D', fontSize: 13, background: '#F0FDF4', padding: '10px 14px', borderRadius: 8 }}>
              <Check size={15} style={{ flexShrink: 0 }} /> {done} fiche{done > 1 ? 's' : ''} importée{done > 1 ? 's' : ''} avec succès.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E1D8',
              background: '#fff', color: '#5B6573', fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>
              Fermer
            </button>
            <button
              disabled={!parsed || importing}
              onClick={handleImport}
              style={{
                padding: '10px 22px', borderRadius: 10, border: 'none',
                background: parsed && !importing ? '#1A2B3D' : '#D1D5DB', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: parsed && !importing ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {importing && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              Importer {parsed ? `(${parsed.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FicheForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0].id);
  const [summary, setSummary] = useState(initial?.summary || '');
  const [content, setContent] = useState(initial?.content || '');

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,43,61,0.4)', zIndex: 60,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto'
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', width: '100%', maxWidth: 680, minHeight: '100vh', padding: '0 0 60px 0'
      }}>
        <div style={{
          position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #E5E1D8',
          padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, fontWeight: 700, margin: 0, color: '#1A2B3D' }}>
            {initial ? 'Modifier la fiche' : 'Nouvelle fiche'}
          </h2>
          <button onClick={onCancel} style={iconBtnStyle}><X size={20} color="#5B6573" /></button>
        </div>

        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <label style={labelStyle}>Catégorie</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                      borderRadius: 999, border: `1.5px solid ${active ? cat.color : '#E5E1D8'}`,
                      background: active ? cat.bg : '#fff', color: active ? cat.color : '#5B6573',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <Icon size={14} strokeWidth={2.5} /> {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Titre</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex : Torsion testiculaire — conduite à tenir"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Résumé court (optionnel — affiché dans la liste)</label>
            <input
              value={summary} onChange={e => setSummary(e.target.value)}
              placeholder="Une phrase pour repérer la fiche en un coup d'œil"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Contenu</label>
            <textarea
              value={content} onChange={e => setContent(e.target.value)}
              placeholder="Colle ou écris ici le contenu complet de la fiche…"
              rows={14}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1.6 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={onCancel} style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E1D8',
              background: '#fff', color: '#5B6573', fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>
              Annuler
            </button>
            <button
              disabled={!canSave}
              onClick={() => onSave({ title: title.trim(), category, summary: summary.trim(), content: content.trim() })}
              style={{
                padding: '10px 22px', borderRadius: 10, border: 'none',
                background: canSave ? '#1A2B3D' : '#D1D5DB', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed'
              }}
            >
              Enregistrer la fiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#1A2B3D', marginBottom: 8 };
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E5E1D8',
  fontSize: 15, color: '#1A2B3D', fontFamily: "'Inter', system-ui, sans-serif", boxSizing: 'border-box',
  outline: 'none'
};

export default function App() {
  const { fiches, addFiche, addFichesBulk, updateFiche, deleteFiche, error } = useFiches();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedFiche, setSelectedFiche] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFiche, setEditingFiche] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('dispensaire_intro_vue')) {
        setShowIntro(true);
      }
    } catch (e) { /* localStorage indisponible, tant pis */ }
  }, []);

  const closeIntro = () => {
    setShowIntro(false);
    try { localStorage.setItem('dispensaire_intro_vue', '1'); } catch (e) { /* ignore */ }
  };

  // Recherche IA : ids pertinents renvoyés par Claude pour la requête en cours
  const [aiIds, setAiIds] = useState(null);
  const [aiQuery, setAiQuery] = useState(''); // requête à laquelle correspond aiIds
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false); // désactive l'IA après un échec, repli silencieux sur le texte

  const handleQueryChange = (value) => {
    setQuery(value);
    if (value.trim()) setActiveCategory(null); // une recherche cherche toutes catégories confondues
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || aiUnavailable) {
      setAiIds(null);
      setAiQuery('');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
          signal: controller.signal
        });
        const data = await res.json();
        if (data.ids === null) {
          // Pas de clé configurée ou erreur côté serveur : on désactive l'IA pour cette session
          setAiUnavailable(true);
          setAiIds(null);
        } else {
          setAiIds(data.ids);
          setAiQuery(q);
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          setAiUnavailable(true);
          setAiIds(null);
        }
      } finally {
        setAiLoading(false);
      }
    }, 450);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, aiUnavailable]);

  const filtered = useMemo(() => {
    if (!fiches) return [];
    const q = query.trim();

    // Sans recherche : on respecte le filtre catégorie (navigation par onglet)
    if (!q) {
      const list = activeCategory ? fiches.filter(f => f.category === activeCategory) : fiches;
      return [...list].sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    }

    // Avec une recherche : on cherche dans TOUTES les catégories, le filtre catégorie est ignoré
    if (aiIds !== null && aiQuery === q) {
      const rank = new Map(aiIds.map((id, i) => [id, i]));
      return fiches
        .filter(f => rank.has(f.id))
        .sort((a, b) => rank.get(a.id) - rank.get(b.id));
    }

    // Sinon (IA pas encore revenue, ou indisponible) : recherche texte classique
    const ql = q.toLowerCase();
    return [...fiches.filter(f =>
      f.title.toLowerCase().includes(ql) ||
      (f.summary || '').toLowerCase().includes(ql) ||
      (f.content || '').toLowerCase().includes(ql)
    )].sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  }, [fiches, query, activeCategory, aiIds, aiQuery]);

  const handleSave = (data) => {
    if (editingFiche) {
      updateFiche(editingFiche.id, data);
    } else {
      addFiche(data);
    }
    setShowForm(false);
    setEditingFiche(null);
    setSelectedFiche(null);
  };

  const handleDelete = (fiche) => {
    if (window.confirm(`Supprimer définitivement « ${fiche.title} » ?`)) {
      deleteFiche(fiche.id);
      setSelectedFiche(null);
    }
  };
  const loading = fiches === null;

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F6F2',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        background: '#1A2B3D', padding: '32px 24px 28px 24px',
        borderBottom: '4px solid #C2410C'
      }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <p style={{ color: '#94A8BD', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
            Dispensaire — Mayotte
          </p>
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif", color: '#fff', fontSize: 28,
            fontWeight: 700, margin: '0 0 20px 0'
          }}>
            Base de référence de l'équipe
          </h1>
          <div style={{ position: 'relative' }}>
            <Search size={19} color="#6B7C90" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Décris le symptôme ou la question : bébé qui tousse, allergie pénicilline…"
              style={{
                width: '100%', padding: '14px 46px 14px 46px', borderRadius: 12, border: 'none',
                fontSize: 16, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            />
            {query.trim().length >= 2 && !aiUnavailable && (
              aiLoading ? (
                <Loader2
                  size={17} color="#C2410C" className="spin"
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }}
                />
              ) : (
                <Sparkles
                  size={17} color="#C2410C"
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}
                />
              )
            )}
          </div>
          <p style={{ color: '#6B7C90', fontSize: 12, margin: '8px 0 0 2px' }}>
            <Sparkles size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
            Recherche intelligente : comprend les symptômes et le sens de la question, pas seulement les mots-clés
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '28px 24px 80px 24px' }}>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, background: '#FDF1EC',
            border: '1px solid #F3C7B0', color: '#9A3412', padding: '12px 16px',
            borderRadius: 10, fontSize: 14, marginBottom: 20
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Lien pour rouvrir l'explication du site */}
        <button
          onClick={() => setShowIntro(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            color: '#0E7490', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 0 20px 0'
          }}
        >
          <Sparkles size={13} strokeWidth={2.5} /> À quoi sert ce site ?
        </button>

        {/* Category filters */}
        <div id="categories-fiches" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(active ? null : cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  borderRadius: 999, border: `1.5px solid ${active ? cat.color : '#E5E1D8'}`,
                  background: active ? cat.bg : '#fff', color: active ? cat.color : '#5B6573',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                <Icon size={14} strokeWidth={2.5} /> {cat.label}
              </button>
            );
          })}
          <Link href="/planning" style={{ textDecoration: 'none' }}>
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 999, border: '1.5px solid #C2410C',
                background: '#FDF1EC', color: '#C2410C',
                fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Calendar size={14} strokeWidth={2.5} /> Planning de l'équipe
            </span>
          </Link>
        </div>

        {/* New fiche button */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <button
            onClick={() => { setEditingFiche(null); setShowForm(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
              borderRadius: 10, border: '1.5px dashed #C2410C', background: '#FDF1EC',
              color: '#C2410C', fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: 1,
              justifyContent: 'center'
            }}
          >
            <Plus size={18} strokeWidth={2.5} /> Ajouter une fiche
          </button>
          <button
            onClick={() => setShowImport(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
              borderRadius: 10, border: '1.5px solid #E5E1D8', background: '#fff',
              color: '#5B6573', fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <Upload size={16} strokeWidth={2.5} /> Import en masse
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10, color: '#9CA3AF' }}>
            <Loader2 size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            Chargement de la base…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            {fiches.length === 0 ? (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#5B6573', margin: '0 0 6px 0' }}>
                  La base est vide pour l'instant
                </p>
                <p style={{ fontSize: 14, margin: 0 }}>
                  Ajoute la première fiche avec le bouton ci-dessus.
                </p>
              </>
            ) : (
              <p style={{ fontSize: 15 }}>Aucune fiche ne correspond à « {query} ».</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(fiche => (
              <FicheCard key={fiche.id} fiche={fiche} onClick={() => setSelectedFiche(fiche)} />
            ))}
          </div>
        )}
      </main>

      {showIntro && (
        <IntroModal
          onClose={closeIntro}
          onSeeFiches={() => {
            closeIntro();
            document.getElementById('categories-fiches')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}

      {selectedFiche && !showForm && (
        <FicheDetail
          fiche={selectedFiche}
          onClose={() => setSelectedFiche(null)}
          onEdit={(f) => { setEditingFiche(f); setShowForm(true); }}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <FicheForm
          initial={editingFiche}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingFiche(null); }}
        />
      )}

      {showImport && (
        <ImportPanel
          onImport={async (fichesList) => addFichesBulk(fichesList)}
          onCancel={() => setShowImport(false)}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input:focus, textarea:focus { border-color: #1A2B3D !important; }
      `}</style>
    </div>
  );
}
