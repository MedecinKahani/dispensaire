'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Settings2 } from 'lucide-react';
import { PLANNING_CATEGORIES } from './config';
import { usePlanning } from './usePlanning';

export default function PlanningHome() {
  const { planning } = usePlanning();

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F6F2',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      <header style={{
        background: '#1A2B3D', padding: '32px 24px 28px 24px',
        borderBottom: '4px solid #C2410C'
      }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94A8BD',
            fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 14
          }}>
            <ArrowLeft size={14} /> Retour à la base de référence
          </Link>
          <p style={{ color: '#94A8BD', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
            Dispensaire — Mayotte
          </p>
          <h1 style={{
            fontFamily: "'Source Serif 4', Georgia, serif", color: '#fff', fontSize: 28,
            fontWeight: 700, margin: 0
          }}>
            Planning de l'équipe
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px 80px 24px' }}>
        <p style={{ fontSize: 14, color: '#5B6573', marginBottom: 24, lineHeight: 1.6 }}>
          Choisis une catégorie pour consulter ou modifier le planning du mois.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {PLANNING_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = planning?.[cat.id]?.agents?.length ?? null;
            return (
              <Link
                key={cat.id}
                href={`/planning/${cat.id}`}
                style={{ textDecoration: 'none', minWidth: 0 }}
              >
                <div
                  style={{
                    background: '#fff', border: '1px solid #E5E1D8', borderRadius: 16,
                    padding: '24px', cursor: 'pointer', transition: 'all 0.15s ease',
                    display: 'flex', flexDirection: 'column', gap: 14, height: '100%',
                    minWidth: 0, boxSizing: 'border-box', overflow: 'hidden'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.boxShadow = `0 4px 16px ${cat.color}1a`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E1D8'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: cat.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={24} color={cat.color} strokeWidth={2.2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{
                      fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 19, fontWeight: 700,
                      color: '#1A2B3D', margin: '0 0 4px 0', overflowWrap: 'break-word'
                    }}>
                      {cat.label}
                    </h2>
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, overflowWrap: 'break-word' }}>
                      {cat.sublabel}
                      {count !== null && ` · ${count} agent${count > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {!cat.configured ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5,
                        color: '#9CA3AF', fontWeight: 600
                      }}>
                        <Settings2 size={12} /> À configurer
                      </span>
                    ) : <span />}
                    <ChevronRight size={18} color={cat.color} style={{ flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
