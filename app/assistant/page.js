'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AskAI from './AskAI';

export default function AssistantPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC', padding: '24px 16px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6, color: '#5B6573',
            fontSize: 13.5, fontWeight: 600,
          }}>
            <ArrowLeft size={16} /> Retour
          </span>
        </Link>
        <span style={{ color: '#D8DEE4' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5B21B6', fontWeight: 700, fontSize: 15 }}>
          <Sparkles size={17} strokeWidth={2.5} /> Assistant IA — Dispensaire
        </span>
      </div>
      <AskAI />
    </div>
  );
}
