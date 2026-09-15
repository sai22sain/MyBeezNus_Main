import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const API_URL = process.env.REACT_APP_API_URL ?? '';

const CATEGORIES = [
  { value: 'bug', label: 'Bug / something not working' },
  { value: 'feature', label: 'Feature request' },
  { value: 'billing', label: 'Billing / payment issue' },
  { value: 'account', label: 'Account issue' },
  { value: 'other', label: 'Other' },
];

const STATUS_COLORS = {
  open: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
  closed: '#6b7280',
};

function Support() {
  const [form, setForm] = useState({ category: 'bug', subject: '', message: '' });
  const [tickets, setTickets] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyErr, setReplyErr] = useState('');

  const authedFetch = useCallback(async (method, url, body) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ''}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      const r = await authedFetch('GET', `${API_URL}/api/support/mine`);
      setTickets(r.tickets || []);
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleSubmit = async () => {
    const subject = form.subject.trim();
    const message = form.message.trim();
    if (subject.length < 3) { setMsg('Subject must be at least 3 characters.'); return; }
    if (message.length < 5) { setMsg('Please describe the issue (at least 5 characters).'); return; }
    setBusy(true);
    setMsg('');
    try {
      await authedFetch('POST', `${API_URL}/api/support`, { app: 'billing', ...form, subject, message });
      setForm(p => ({ ...p, subject: '', message: '' }));
      setMsg('Ticket submitted. Our team will get back to you here.');
      await loadTickets();
    } catch (e) {
      setMsg('Could not submit ticket: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleFollowUp = async (ticketId) => {
    const text = replyText.trim();
    if (text.length < 1) { setReplyErr('Write a message first.'); return; }
    setReplyBusy(true);
    setReplyErr('');
    try {
      await authedFetch('POST', `${API_URL}/api/support/${ticketId}/replies`, { message: text });
      setReplyText('');
      setReplyFor(null);
      await loadTickets();
    } catch (e) {
      setReplyErr(e.message);
    } finally {
      setReplyBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div>
          <h1>Get Assistance</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 13 }}>
            Raise a ticket or add follow-ups — our team will reply right here
          </p>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon"><i className="fas fa-plus-circle"></i></div>
          <div>
            <div className="settings-section-title">Raise a new ticket</div>
            <div className="settings-section-sub">Tell us what you need help with</div>
          </div>
        </div>
        <div className="settings-section-body">
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input
              value={form.subject}
              maxLength={120}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="Short summary (e.g. Bill PDF not opening)"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={4}
              maxLength={4000}
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Tell us what happened, what you expected and what went wrong..."
            />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={busy} style={{ padding: '9px 22px' }}>
            {busy ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Submit ticket</>}
          </button>
          {msg && <div style={{ fontSize: 13, marginTop: 8, color: 'var(--color-text-muted)' }}>{msg}</div>}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon"><i className="fas fa-comments"></i></div>
          <div>
            <div className="settings-section-title">Your tickets</div>
            <div className="settings-section-sub">Open a ticket to see details and add follow-ups</div>
          </div>
        </div>
        <div className="settings-section-body">
          {loading && <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}><i className="fas fa-spinner fa-spin"></i> Loading...</div>}

          {!loading && tickets.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              No tickets yet. Raise your first one above.
            </div>
          )}

          {tickets.map(t => {
            const canReply = t.status !== 'closed';
            return (
              <div key={t.id} className="support-ticket-card">
                <div className="support-ticket-head">
                  <strong>{t.subject}</strong>
                  <span className="support-ticket-status" style={{ color: STATUS_COLORS[t.status] || '#3b82f6' }}>
                    {String(t.status).replace('_', ' ')}
                  </span>
                </div>
                <div className="support-ticket-meta">
                  {new Date(t.created_at).toLocaleString('en-IN')} &middot; {t.app}
                </div>

                <div className="support-ticket-msg">{t.message}</div>

                {t.admin_reply && (
                  <div className="support-ticket-reply support-ticket-reply--admin">
                    <strong><i className="fas fa-user-shield"></i> Support:</strong> {t.admin_reply}
                  </div>
                )}

                {(t.replies || []).map(r => (
                  <div key={r.id} className={`support-ticket-reply support-ticket-reply--${r.sender}`}>
                    <strong>
                      <i className={`fas ${r.sender === 'admin' ? 'fa-user-shield' : 'fa-user'}`}></i>{' '}
                      {r.sender === 'admin' ? 'Support' : 'You'}:
                    </strong>{' '}
                    {r.message}
                    <div className="support-ticket-meta" style={{ marginTop: 2 }}>
                      {new Date(r.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}

                {canReply && (
                  replyFor === t.id ? (
                    <div className="support-followup">
                      <textarea
                        rows={3}
                        maxLength={4000}
                        autoFocus
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Add a follow-up comment..."
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-primary" onClick={() => handleFollowUp(t.id)} disabled={replyBusy} style={{ padding: '7px 16px' }}>
                          {replyBusy ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send</>}
                        </button>
                        <button className="btn btn-ghost" onClick={() => { setReplyFor(null); setReplyText(''); setReplyErr(''); }} style={{ padding: '7px 16px' }}>
                          Cancel
                        </button>
                      </div>
                      {replyErr && <div style={{ fontSize: 12, marginTop: 6, color: 'var(--color-danger)' }}>{replyErr}</div>}
                    </div>
                  ) : (
                    <button className="btn btn-ghost support-followup-btn" onClick={() => { setReplyFor(t.id); setReplyText(''); setReplyErr(''); }}>
                      <i className="fas fa-reply"></i> Add follow-up
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ paddingBottom: 40 }} />
    </div>
  );
}

export default Support;