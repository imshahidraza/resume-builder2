import React from 'react';
import {
  countWords,
  countCharacters,
  countParagraphs,
  estimateReadingTime,
  getFullResumeText,
} from '../utils/helpers';

function AnalyticsPanel({ formData }) {
  const fullText = getFullResumeText(formData);
  const words = countWords(fullText);
  const characters = countCharacters(fullText);
  const paragraphs = countParagraphs(fullText);
  const readingTime = estimateReadingTime(fullText);

  return (
    <div className="analytics-panel">
      <div className="section-title" style={{ color: '#f0c060', borderColor: '#f0c060' }}>
        📊 Resume Content Analytics
      </div>

      <div className="analytics-grid">
        <div className="analytics-item">
          <div className="analytics-value">{words}</div>
          <div className="analytics-label">Words</div>
        </div>
        <div className="analytics-item">
          <div className="analytics-value">{characters}</div>
          <div className="analytics-label">Characters</div>
        </div>
        <div className="analytics-item">
          <div className="analytics-value">{paragraphs}</div>
          <div className="analytics-label">Paragraphs</div>
        </div>
        <div className="analytics-item">
          <div className="analytics-value">{readingTime} min</div>
          <div className="analytics-label">Reading Time</div>
        </div>
        <div className="analytics-item">
          <div className="analytics-value"
            style={{ color: words > 700 ? '#e74c3c' : words >= 300 ? '#27ae60' : '#f0c060' }}>
            {words > 700 ? '⚠️ Long' : words >= 300 ? '✅ Good' : '📝 Short'}
          </div>
          <div className="analytics-label">Length Status</div>
        </div>
        <div className="analytics-item">
          <div className="analytics-value">300–700</div>
          <div className="analytics-label">Recommended</div>
        </div>
      </div>

      {words > 700 && (
        <div style={{
          marginTop: '1rem',
          background: 'rgba(231,76,60,0.2)',
          border: '1px solid #e74c3c',
          borderRadius: '6px',
          padding: '0.7rem 1rem',
          fontSize: '0.85rem',
          color: '#ff6b6b'
        }}>
          ⚠️ Warning: The recommended resume length is under 700 words.
        </div>
      )}
    </div>
  );
}

export default AnalyticsPanel;