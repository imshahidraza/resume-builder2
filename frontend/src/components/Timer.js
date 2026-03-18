import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:8000';

function Timer() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API}/time-status`);
        setTimeLeft(res.data.remaining_seconds);
        setAllowed(res.data.allowed);
      } catch (err) {
        console.error('Timer fetch failed');
      }
    };

    fetchStatus();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setAllowed(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (timeLeft === null) return null;

  return (
    <div className={`timer ${!allowed ? 'expired' : ''}`}>
      {allowed ? (
        <>
          <div className="timer-text">Time Remaining to Submit</div>
          <div className="timer-count">{formatTime(timeLeft)}</div>
        </>
      ) : (
        <>
          <div className="timer-text">⚠️ Time Expired</div>
          <div className="timer-count">Resume submission time has expired.</div>
        </>
      )}
    </div>
  );
}

export default Timer;