'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, AlertTriangle } from 'lucide-react';

export default function AskAI() {
  const [messages, setMessages] = useState([]); // [{role: 'user'|'assistant', content: string}]
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setError(null);
    const newMessages = [...messages, { role: 'user', content: question }];
    setMessages([...newMessages, { role: 'assistant', content: '' }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Réponse invalide du serveur');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: snapshot };
          return copy;
        });
      }
    } catch (e) {
      setError("Impossible d'obtenir une réponse. Réessaie dans un instant.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)',
      maxWidth: 760, margin: '0 auto', width: '100%',
    }}>
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 8px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#6B7C90', fontSize: 14, textAlign: 'center', marginTop: 60 }}>
            <MessageCircle size={30} style={{ marginBottom: 10, opacity: 0.5 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#3A4552', marginBottom: 4 }}>
              Pose une question sur un protocole, un contact, un médicament...
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.75, maxWidth: 340, margin: '0 auto' }}>
              Les réponses se basent uniquement sur les fiches du dispensaire — jamais sur des connaissances externes.
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.role === 'user' ? '#0E7490' : '#F3F6F8',
              color: m.role === 'user' ? '#fff' : '#1A2733',
              padding: '10px 14px',
              borderRadius: 14,
              fontSize: 14.5,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.content || (loading && i === messages.length - 1 ? '…' : '')}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, color: '#C2410C',
          fontSize: 13, padding: '4px 12px 8px',
        }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div style={{
        display: 'flex', gap: 8, padding: '10px 8px',
        borderTop: '1px solid #E5EAEE',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ta question..."
          rows={1}
          style={{
            flex: 1, resize: 'none', border: '1px solid #D8DEE4', borderRadius: 10,
            padding: '10px 12px', fontSize: 14.5, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? '#B8C2CC' : '#0E7490',
            color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
