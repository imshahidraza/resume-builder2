import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Timer from '../components/Timer';
import AnalyticsPanel from '../components/AnalyticsPanel';
import ResumePreview from '../components/ResumePreview';
import { findDuplicateSkills, autoCapitalize } from '../utils/helpers';

const API = 'http://127.0.0.1:8000';

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  dob: '',
  summary: '',
  education: [{ institution: '', degree: '', year: '' }],
  experience: [{ company: '', role: '', duration: '', description: '' }],
  skills: [''],
  projects: [{ name: '', description: '', technologies: '' }],
};

function Builder() {
  const [formData, setFormData] = useState(emptyForm);
  const [resumeId, setResumeId] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState(null);
  const [lastEdited, setLastEdited] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [shareMethod, setShareMethod] = useState('Email');
  const [recipient, setRecipient] = useState('');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    axios.get(`${API}/admin/settings`)
      .then(res => setSettings(res.data))
      .catch(() => setSettings({
        allow_download: true,
        allow_print: true,
        allow_email: true,
        allow_whatsapp: true,
        allow_password_protection: true
      }));
  }, []);

  const showMsg = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  const updateLastEdited = () => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    }) + ' – ' + now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });
    setLastEdited(formatted);
  };

  const handleBasicChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updateLastEdited();
  };

  // Education
  const handleEduChange = (i, field, value) => {
    const updated = [...formData.education];
    updated[i][field] = value;
    setFormData(prev => ({ ...prev, education: updated }));
    updateLastEdited();
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', year: '' }]
    }));
  };

  const removeEducation = (i) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== i)
    }));
  };

  // Experience
  const handleExpChange = (i, field, value) => {
    const updated = [...formData.experience];
    updated[i][field] = value;
    setFormData(prev => ({ ...prev, experience: updated }));
    updateLastEdited();
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration: '', description: '' }]
    }));
  };

  const removeExperience = (i) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, idx) => idx !== i)
    }));
  };

  // Skills
  const handleSkillChange = (i, value) => {
    const updated = [...formData.skills];
    updated[i] = value;
    setFormData(prev => ({ ...prev, skills: updated }));
    updateLastEdited();
  };

  const addSkill = () => {
    setFormData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  };

  const removeSkill = (i) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== i)
    }));
  };

  // Projects
  const handleProjChange = (i, field, value) => {
    const updated = [...formData.projects];
    updated[i][field] = value;
    setFormData(prev => ({ ...prev, projects: updated }));
    updateLastEdited();
  };

  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { name: '', description: '', technologies: '' }]
    }));
  };

  const removeProject = (i) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, idx) => idx !== i)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        skills: formData.skills.filter(s => s.trim() !== ''),
      };
      let res;
      if (resumeId) {
        res = await axios.put(`${API}/resume/${resumeId}`, payload);
        showMsg('Resume updated successfully!', 'success');
      } else {
        res = await axios.post(`${API}/resume`, payload);
        setResumeId(res.data.resume_id);
        showMsg(`Resume created! ID: ${res.data.resume_id}`, 'success');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        showMsg(detail.map(e => e.msg).join(', '), 'error');
      } else if (typeof detail === 'string') {
        showMsg(detail, 'error');
      } else {
        showMsg('Something went wrong. Check all fields.', 'error');
      }
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!resumeId) {
      showMsg('Please save your resume first by clicking Save Resume.', 'error');
      return;
    }
    try {
      const res = await axios.get(`${API}/resume/${resumeId}/download`, {
        responseType: 'blob',
      });
      const pwd = res.headers['x-pdf-password'];
      if (pwd && pwd !== 'none') setPassword(pwd);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resumeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMsg('PDF downloaded successfully!', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        showMsg(detail, 'error');
      } else {
        showMsg('Download failed. Please try again.', 'error');
      }
    }
  };

  const handleShare = async () => {
    if (!resumeId) {
      showMsg('Please save your resume first.', 'error');
      return;
    }
    if (!recipient) {
      showMsg('Please enter recipient.', 'error');
      return;
    }
    try {
      const res = await axios.post(`${API}/resume/${resumeId}/share`, {
        resume_id: resumeId,
        method: shareMethod,
        recipient: recipient,
      });
      setPassword(res.data.password);
      if (shareMethod === 'WhatsApp' && res.data.whatsapp_url) {
        window.open(res.data.whatsapp_url, '_blank');
      }
      showMsg(`Shared via ${shareMethod} successfully!`, 'success');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        showMsg(detail, 'error');
      } else {
        showMsg('Share failed. Please try again.', 'error');
      }
    }
  };

  const duplicates = findDuplicateSkills(
    formData.skills.filter(s => s.trim() !== '')
  );

  return (
    <div className="page-container">
      <h2 className="section-title">📄 Build Your Resume</h2>

      <Timer />

      {lastEdited && (
        <div className="last-edited">🕒 Last Edited: {lastEdited}</div>
      )}

      {message && (
        <div className={messageType === 'error' ? 'error' : messageType === 'warning' ? 'warning' : 'success'}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* LEFT — Form */}
        <div>
          <AnalyticsPanel formData={formData} />

          {/* Personal Info */}
          <div className="card">
            <h3 className="section-title">👤 Personal Information</h3>
            <label>Full Name</label>
            <input
              value={formData.full_name}
              onChange={e => handleBasicChange('full_name', e.target.value)}
              placeholder="Kiran Kumar"
            />
            {formData.full_name && (
              <div className="warning">
                💡 Suggestion: {autoCapitalize(formData.full_name)}
              </div>
            )}
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => handleBasicChange('email', e.target.value)}
              placeholder="kiran@gmail.com"
            />
            <label>Phone</label>
            <input
              value={formData.phone}
              onChange={e => handleBasicChange('phone', e.target.value)}
              placeholder="+91 9999999999"
            />
            <label>Date of Birth</label>
            <input
              type="date"
              value={formData.dob}
              onChange={e => handleBasicChange('dob', e.target.value)}
            />
            <label>Summary</label>
            <textarea
              rows={4}
              value={formData.summary}
              onChange={e => handleBasicChange('summary', e.target.value)}
              placeholder="Write a brief professional summary..."
            />
          </div>

          {/* Education */}
          <div className="card">
            <h3 className="section-title">🎓 Education</h3>
            {formData.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                <label>Institution</label>
                <input
                  value={edu.institution}
                  onChange={e => handleEduChange(i, 'institution', e.target.value)}
                  placeholder="University Name"
                />
                <label>Degree</label>
                <input
                  value={edu.degree}
                  onChange={e => handleEduChange(i, 'degree', e.target.value)}
                  placeholder="B.Tech Computer Science"
                />
                <label>Year</label>
                <input
                  value={edu.year}
                  onChange={e => handleEduChange(i, 'year', e.target.value)}
                  placeholder="2020 - 2024"
                />
                {formData.education.length > 1 && (
                  <button className="btn btn-danger" onClick={() => removeEducation(i)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button className="btn btn-primary" onClick={addEducation}>
              + Add Education
            </button>
          </div>

          {/* Experience */}
          <div className="card">
            <h3 className="section-title">💼 Experience</h3>
            {formData.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                <label>Company</label>
                <input
                  value={exp.company}
                  onChange={e => handleExpChange(i, 'company', e.target.value)}
                  placeholder="Company Name"
                />
                <label>Role</label>
                <input
                  value={exp.role}
                  onChange={e => handleExpChange(i, 'role', e.target.value)}
                  placeholder="Software Developer"
                />
                <label>Duration</label>
                <input
                  value={exp.duration}
                  onChange={e => handleExpChange(i, 'duration', e.target.value)}
                  placeholder="Jan 2022 - Dec 2023"
                />
                <label>Description</label>
                <textarea
                  rows={3}
                  value={exp.description}
                  onChange={e => handleExpChange(i, 'description', e.target.value)}
                  placeholder="Describe your responsibilities..."
                />
                {formData.experience.length > 1 && (
                  <button className="btn btn-danger" onClick={() => removeExperience(i)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button className="btn btn-primary" onClick={addExperience}>
              + Add Experience
            </button>
          </div>

          {/* Skills */}
          <div className="card">
            <h3 className="section-title">🛠️ Skills</h3>
            {duplicates.length > 0 && (
              <div className="warning">
                ⚠️ Duplicate skill detected: {duplicates.join(', ')}
              </div>
            )}
            {formData.skills.map((skill, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  value={skill}
                  onChange={e => handleSkillChange(i, e.target.value)}
                  placeholder="e.g. Python"
                  style={{ marginBottom: 0 }}
                />
                {formData.skills.length > 1 && (
                  <button
                    className="btn btn-danger"
                    style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
                    onClick={() => removeSkill(i)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button className="btn btn-primary" onClick={addSkill}>
              + Add Skill
            </button>
          </div>

          {/* Projects */}
          <div className="card">
            <h3 className="section-title">🚀 Projects</h3>
            {formData.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                <label>Project Name</label>
                <input
                  value={proj.name}
                  onChange={e => handleProjChange(i, 'name', e.target.value)}
                  placeholder="Project Name"
                />
                <label>Technologies</label>
                <input
                  value={proj.technologies}
                  onChange={e => handleProjChange(i, 'technologies', e.target.value)}
                  placeholder="React, Python, FastAPI"
                />
                <label>Description</label>
                <textarea
                  rows={3}
                  value={proj.description}
                  onChange={e => handleProjChange(i, 'description', e.target.value)}
                  placeholder="Describe your project..."
                />
                {formData.projects.length > 1 && (
                  <button className="btn btn-danger" onClick={() => removeProject(i)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button className="btn btn-primary" onClick={addProject}>
              + Add Project
            </button>
          </div>

          {/* Action Buttons */}
          <div className="card">
            <h3 className="section-title">⚙️ Actions</h3>

            <button
              className="btn btn-gold"
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', marginBottom: '0.8rem', fontSize: '1rem' }}
            >
              {loading ? 'Saving...' : resumeId ? '💾 Update Resume' : '💾 Save Resume'}
            </button>

            {resumeId && (
              <div style={{
                background: '#f0f2f5', padding: '0.8rem',
                borderRadius: '6px', marginBottom: '0.8rem', fontSize: '0.85rem'
              }}>
                ✅ Resume ID: <strong>{resumeId}</strong>
              </div>
            )}

            {settings?.allow_download && (
              <button
                className="btn btn-primary"
                onClick={handleDownload}
                style={{ width: '100%', marginBottom: '0.8rem' }}
              >
                📥 Download PDF
              </button>
            )}

            {password && (
              <div className="success">
                🔑 PDF Password: <strong>{password}</strong>
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.8rem', color: '#1a1a2e' }}>📤 Share Resume</h4>
              <select
                value={shareMethod}
                onChange={e => setShareMethod(e.target.value)}
              >
                {settings?.allow_email && <option value="Email">📧 Email</option>}
                {settings?.allow_whatsapp && <option value="WhatsApp">💬 WhatsApp</option>}
              </select>
              <input
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder={shareMethod === 'Email' ? 'recipient@email.com' : '+91 9999999999'}
              />
              <button
                className="btn btn-success"
                onClick={handleShare}
                style={{ width: '100%' }}
              >
                Share
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div>
          <div className="card">
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1rem'
            }}>
              <h3 className="section-title" style={{ margin: 0, border: 'none' }}>
                👁️ Live Preview
              </h3>
              <button
                className="btn btn-primary"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
            {showPreview && <ResumePreview formData={formData} />}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Builder;