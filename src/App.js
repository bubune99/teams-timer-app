import React, { useState, useEffect } from 'react';
import { Button, Text } from '@fluentui/react-northstar';
import * as microsoftTeams from "@microsoft/teams-js";
import './App.css';

function App() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputSeconds, setInputSeconds] = useState('');

  useEffect(() => {
    microsoftTeams.initialize();
  }, []);

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
      <Text size="large" weight="bold" content="Meeting Timer" />
      
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
          <Button
            primary
            content="Set"
            onClick={handleSet}
            disabled={isRunning}
          />
        </div>

        <div className="button-group">
          {!isRunning ? (
            <Button
              primary
              content="Start"
              onClick={handleStart}
              disabled={timeLeft === 0}
            />
          ) : (
            <Button
              primary
              content={isPaused ? "Resume" : "Pause"}
              onClick={handlePause}
            />
          )}
          <Button
            content="Reset"
            onClick={handleReset}
            disabled={timeLeft === 0 && !isRunning}
          />
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
