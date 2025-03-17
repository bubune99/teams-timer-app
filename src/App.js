import React, { useState, useEffect } from 'react';
import { Button, Flex, Text } from '@fluentui/react-northstar';
import * as microsoftTeams from "@microsoft/teams-js";
import './App.css';

function App() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputSeconds, setInputSeconds] = useState('');
  const [isTeamsInitialized, setIsTeamsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [debugContext, setDebugContext] = useState({
    userId: '',
    frameContext: '',
    initError: ''
  });

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        // Check if we're running in Teams
        if (window.parent === window.self) {
          console.log('Running outside of Teams - skipping Teams initialization');
          return;
        }

        // Initialize Teams SDK
        await microsoftTeams.initialize();
        setIsTeamsInitialized(true);

        // Get user context
        microsoftTeams.getContext((context) => {
          console.log('Teams Context:', context);
          
          // If we're in the settings frame, save the settings and notify success
          if (context.frameContext === 'settings') {
            microsoftTeams.settings.setValidityState(true);
            microsoftTeams.settings.registerOnSaveHandler((saveEvent) => {
              microsoftTeams.settings.setConfig({
                entityId: 'timer',
                contentUrl: window.location.origin + window.location.pathname,
                suggestedDisplayName: 'Meeting Timer'
              });
              saveEvent.notifySuccess();
            });
            return;
          }

          // Store debug info
          setDebugContext({
            userId: context?.userObjectId || 'Not available',
            frameContext: context?.frameContext || 'Unknown',
            initError: ''
          });
        });

      } catch (err) {
        console.error('Teams initialization error:', err);
        setError(err.message);
        setDebugContext(prev => ({
          ...prev,
          initError: err.message || 'Teams initialization error'
        }));
      }
    };

    initializeTeams();
  }, []);

  useEffect(() => {
    let timer;
    if (isRunning && !isPaused && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          return newTime;
        });
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
    
    if (minutes >= 0 && seconds >= 0 && (minutes > 0 || seconds > 0)) {
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
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
  };

  if (error) {
    return (
      <div className="app-container">
        <Text error content={`Error: ${error}`} />
        <Text content="The app will work with limited functionality." />
      </div>
    );
  }

  return (
    <div className="app-container">
      {debugContext.frameContext === 'settings' ? (
        <div className="settings-container">
          <Text size="large" weight="bold" content="Meeting Timer Configuration" />
          <Text content="Click Save to add the timer to your meeting." />
        </div>
      ) : (
        <>
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

          <div className="debug-info" style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
            <p>Debug Info:</p>
            <p>Teams Initialized: {isTeamsInitialized ? 'Yes' : 'No'}</p>
            <p>User ID: {debugContext.userId}</p>
            <p>Frame Context: {debugContext.frameContext}</p>
            <p style={{ color: '#ff4444' }}>Initialization Error: {debugContext.initError || 'None'}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
