import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="page-container">
      <div style={{
        textAlign: 'center',
        padding: '4rem 2rem',
      }}>
        <h1 style={{
          fontSize: '3rem',
          color: '#1a1a2e',
          marginBottom: '1rem',
          fontWeight: '700'
        }}>
          📄 Resume Builder
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          marginBottom: '2rem',
          maxWidth: '500px',
          margin: '0 auto 2rem'
        }}>
          Create a professional resume in minutes.
          Download as PDF, share via Email or WhatsApp.
        </p>

        <Link to="/builder">
          <button className="btn btn-gold" style={{ fontSize: '1rem', padding: '0.8rem 2.5rem' }}>
            🚀 Start Building
          </button>
        </Link>
      </div>

      {/* Features */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
        marginTop: '3rem'
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>⚡</div>
          <h3 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>Fast & Easy</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Fill in your details and get a professional resume instantly.
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>🔒</div>
          <h3 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>Password Protected</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Your PDF is secured with a unique password.
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>📤</div>
          <h3 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>Easy Sharing</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Share your resume via Email or WhatsApp in one click.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;