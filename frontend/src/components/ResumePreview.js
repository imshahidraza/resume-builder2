import React from 'react';

function ResumePreview({ formData }) {
  const {
    full_name, email, phone, summary,
    education, experience, skills, projects
  } = formData;

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      fontFamily: 'Georgia, serif',
      fontSize: '0.85rem',
      lineHeight: '1.6',
      minHeight: '600px'
    }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #1a1a2e', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#1a1a2e', marginBottom: '0.3rem' }}>
          {full_name || 'Your Name'}
        </h1>
        <p style={{ color: '#666', fontSize: '0.8rem' }}>
          {email || 'email@example.com'} | {phone || '000-000-0000'}
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: '#1a1a2e', fontSize: '0.9rem', textTransform: 'uppercase',
            letterSpacing: '0.1em', borderBottom: '1px solid #f0c060', paddingBottom: '0.3rem',
            marginBottom: '0.5rem' }}>
            Summary
          </h3>
          <p style={{ color: '#444' }}>{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: '#1a1a2e', fontSize: '0.9rem', textTransform: 'uppercase',
            letterSpacing: '0.1em', borderBottom: '1px solid #f0c060', paddingBottom: '0.3rem',
            marginBottom: '0.5rem' }}>
            Experience
          </h3>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '0.8rem' }}>
              <strong>{exp.role}</strong> — {exp.company}
              <span style={{ color: '#888', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                {exp.duration}
              </span>
              <p style={{ color: '#555', marginTop: '0.2rem' }}>{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: '#1a1a2e', fontSize: '0.9rem', textTransform: 'uppercase',
            letterSpacing: '0.1em', borderBottom: '1px solid #f0c060', paddingBottom: '0.3rem',
            marginBottom: '0.5rem' }}>
            Education
          </h3>
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <strong>{edu.degree}</strong> — {edu.institution}
              <span style={{ color: '#888', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                {edu.year}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: '#1a1a2e', fontSize: '0.9rem', textTransform: 'uppercase',
            letterSpacing: '0.1em', borderBottom: '1px solid #f0c060', paddingBottom: '0.3rem',
            marginBottom: '0.5rem' }}>
            Skills
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {skills.map((skill, i) => (
              <span key={i} style={{
                background: '#f0f2f5', padding: '0.2rem 0.6rem',
                borderRadius: '4px', fontSize: '0.78rem', color: '#1a1a2e'
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ color: '#1a1a2e', fontSize: '0.9rem', textTransform: 'uppercase',
            letterSpacing: '0.1em', borderBottom: '1px solid #f0c060', paddingBottom: '0.3rem',
            marginBottom: '0.5rem' }}>
            Projects
          </h3>
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '0.8rem' }}>
              <strong>{proj.name}</strong>
              <span style={{ color: '#888', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                {proj.technologies}
              </span>
              <p style={{ color: '#555', marginTop: '0.2rem' }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResumePreview;