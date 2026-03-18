import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000';

function Admin() {
  const [secret, setSecret] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [shareHistory, setShareHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('resumes');

  const showMsg = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleLogin = async () => {
    try {
      const res = await axios.get(`${API}/admin/resumes`, {
        headers: { secret }
      });
      setResumes(res.data);
      setLoggedIn(true);
      fetchAll();
    } catch (err) {
      showMsg('Invalid admin secret.', 'error');
    }
  };

  const fetchAll = async () => {
    try {
      const [r, l, s, st] = await Promise.all([
        axios.get(`${API}/admin/resumes`, { headers: { secret } }),
        axios.get(`${API}/admin/logs`, { headers: { secret } }),
        axios.get(`${API}/admin/share-history`, { headers: { secret } }),
        axios.get(`${API}/admin/settings`),
      ]);
      setResumes(r.data);
      setLogs(l.data);
      setShareHistory(s.data);
      setSettings(st.data);
    } catch (err) {
      showMsg('Failed to fetch data.', 'error');
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm(`Delete ${resumeId}?`)) return;
    try {
      await axios.delete(`${API}/resume/${resumeId}`);
      showMsg(`${resumeId} deleted.`);
      fetchAll();
    } catch (err) {
      showMsg('Delete failed.', 'error');
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      await axios.put(`${API}/admin/settings`, settings, {
        headers: { secret }
      });
      showMsg('Settings updated!');
    } catch (err) {
      showMsg('Failed to update settings.', 'error');
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!loggedIn) {
    return (
      <div className="page-container">
        <div className="card" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
          <h2 className="section-title">🔐 Admin Login</h2>
          <label>Admin Secret Key</label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Enter admin secret"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          <button className="btn btn-gold" onClick={handleLogin} style={{ width: '100%' }}>
            Login
          </button>
          {message && (
            <div className={message.type === 'error' ? 'error' : 'success'} style={{ marginTop: '1rem' }}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="section-title">🛠️ Admin Panel</h2>

      {message && (
        <div className={message.type === 'error' ? 'error' : 'success'}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['resumes', 'logs', 'share', 'settings'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-gold' : 'btn-primary'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'resumes' && '📄 Resumes'}
            {tab === 'logs' && '📋 Activity Logs'}
            {tab === 'share' && '📤 Share History'}
            {tab === 'settings' && '⚙️ Settings'}
          </button>
        ))}
      </div>

      {/* Resumes Tab */}
      {activeTab === 'resumes' && (
        <div className="card">
          <h3 className="section-title">📄 All Resumes ({resumes.length})</h3>
          {resumes.length === 0 ? (
            <p style={{ color: '#888' }}>No resumes yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#1a1a2e', color: 'white' }}>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Resume ID</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Downloads</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '0.7rem' }}><strong>{r.resume_id}</strong></td>
                    <td style={{ padding: '0.7rem' }}>{r.full_name}</td>
                    <td style={{ padding: '0.7rem' }}>{r.email}</td>
                    <td style={{ padding: '0.7rem' }}>
                      <span style={{ background: '#f0c060', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600' }}>
                        {r.download_count}
                      </span>
                    </td>
                    <td style={{ padding: '0.7rem' }}>
                      <button className="btn btn-danger" style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }}
                        onClick={() => handleDelete(r.resume_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="card">
          <h3 className="section-title">📋 Activity Logs ({logs.length})</h3>
          {logs.length === 0 ? (
            <p style={{ color: '#888' }}>No logs yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#1a1a2e', color: 'white' }}>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Resume ID</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Action</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '0.7rem' }}>{log.resume_id}</td>
                    <td style={{ padding: '0.7rem' }}>{log.action}</td>
                    <td style={{ padding: '0.7rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Share History Tab */}
      {activeTab === 'share' && (
        <div className="card">
          <h3 className="section-title">📤 Share History ({shareHistory.length})</h3>
          {shareHistory.length === 0 ? (
            <p style={{ color: '#888' }}>No share history yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#1a1a2e', color: 'white' }}>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Resume ID</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Method</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Recipient</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {shareHistory.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '0.7rem' }}>{s.resume_id}</td>
                    <td style={{ padding: '0.7rem' }}>
                      <span style={{ background: s.method === 'Email' ? '#d4edda' : '#cce5ff', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                        {s.method}
                      </span>
                    </td>
                    <td style={{ padding: '0.7rem' }}>{s.recipient}</td>
                    <td style={{ padding: '0.7rem' }}>{new Date(s.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="card">
          <h3 className="section-title">⚙️ Feature Controls</h3>
          {[
            { key: 'allow_download', label: '📥 Allow Download' },
            { key: 'allow_print', label: '🖨️ Allow Print' },
            { key: 'allow_email', label: '📧 Allow Email' },
            { key: 'allow_whatsapp', label: '💬 Allow WhatsApp' },
            { key: 'allow_password_protection', label: '🔒 Password Protection' },
          ].map(({ key, label }) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '0.8rem 0',
              borderBottom: '1px solid #eee'
            }}>
              <span style={{ fontWeight: '500' }}>{label}</span>
              <button
                className={`btn ${settings[key] ? 'btn-success' : 'btn-danger'}`}
                style={{ width: 'auto', padding: '0.4rem 1.2rem' }}
                onClick={() => toggleSetting(key)}
              >
                {settings[key] ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
          <button
            className="btn btn-gold"
            onClick={handleSettingsUpdate}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            💾 Save Settings
          </button>
        </div>
      )}
    </div>
  );
}

export default Admin;