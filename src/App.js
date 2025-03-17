import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputSeconds, setInputSeconds] = useState('');

  useEffect(() => {
    let timer;
    if (isRunning && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setIsPaused(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSet = () => {
    const minutes = parseInt(inputMinutes) || 0;
    const seconds = parseInt(inputSeconds) || 0;
    
    if (minutes > 0 || seconds > 0) {
      const newTime = (minutes * 60) + seconds;
      setTimeLeft(newTime);
      setInputMinutes('');
      setInputSeconds('');
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
  };

  return (
    <div className="app-container">
      <h1>Meeting Timer</h1>
      
      <div className={`timer-display ${timeLeft <= 30 && !isPaused ? 'timer-red' : ''}`}>
        {formatTime(timeLeft)}
      </div>

      <div className="controls">
        <div className="input-group">
          <input
            type="number"
            min="0"
            max="59"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
            placeholder="Min"
            className="time-input"
          />
          <span>:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={inputSeconds}
            onChange={(e) => setInputSeconds(e.target.value)}
            placeholder="Sec"
            className="time-input"
          />
          <button
            onClick={handleSet}
            disabled={isRunning}
            className="button primary"
          >
            Set
          </button>
        </div>

        <div className="button-group">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={timeLeft === 0}
              className="button primary"
            >
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="button primary"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
          )}
          <button
            onClick={handleReset}
            disabled={timeLeft === 0 && !isRunning}
            className="button"
          >
            Reset
          </button>
        </div>
      </div>

      {isPaused && (
        <div className="pause-indicator">
          Timer Paused
        </div>
      )}
    </div>
  );
}

export default App;
