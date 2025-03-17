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
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isTeamsInitialized, setIsTeamsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [hasTimerControl, setHasTimerControl] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [debugContext, setDebugContext] = useState({
    userId: '',
    organizerId: '',
    meetingId: '',
    roles: [],
    capabilities: [],
    frameContext: '',
    initError: ''
  });

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        // Check if we're running in Teams
        if (window.parent === window.self) {
          console.log('Running outside of Teams - skipping Teams initialization');
          setHasTimerControl(true);
          return;
        }

        // Initialize Teams SDK
        await microsoftTeams.initialize();
        setIsTeamsInitialized(true);

        // Get context using callback style
        microsoftTeams.getContext((context) => {
          console.log('Teams Context:', context);
          
          // If we're in the settings frame, save the settings and notify success
          if (context.frameContext === 'settings') {
            microsoftTeams.settings.setValidityState(true);
            microsoftTeams.settings.registerOnSaveHandler((saveEvent) => {
              microsoftTeams.settings.setSettings({
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
            organizerId: context?.meeting?.organizer?.id || 'Not available',
            meetingId: context?.meeting?.id || 'Not available',
            roles: context?.meeting?.roles || [],
            capabilities: context?.app?.capabilities || [],
            frameContext: context?.frameContext || 'Unknown',
            initError: ''
          });

          // Check if user is organizer
          const isOrg = context?.userObjectId === context?.meeting?.organizer?.id;
          setIsOrganizer(isOrg);
          
          // Set timer control for organizer
          if (isOrg) {
            setHasTimerControl(true);
            setUserRole('organizer');
          } else if (context?.meeting?.isPresenter) {
            setHasTimerControl(true);
            setUserRole('presenter');
          }
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
          if (isTeamsInitialized && hasTimerControl) {
            broadcastTimerState(newTime, isRunning, isPaused);
          }
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setIsPaused(false);
      if (isTeamsInitialized && hasTimerControl) {
        broadcastTimerState(0, false, false);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeLeft, hasTimerControl, isTeamsInitialized]);

  const broadcastTimerState = async (time, running, paused) => {
    try {
      if (!isTeamsInitialized) return;

      const context = await microsoftTeams.meeting.getMeetingDetails();
      const participants = context.conversation.conversationParticipants || [];
      
      for (const participant of participants) {
        try {
          await microsoftTeams.messages.sendMessage({
            message: {
              timeLeft: time,
              isRunning: running,
              isPaused: paused
            },
            messageTarget: "timerUpdate",
            participantId: participant.user.id
          });
        } catch (err) {
          console.log('Error sending message to participant:', err);
        }
      }
    } catch (err) {
      console.log('Error broadcasting timer state:', err);
    }
  };

  const startTimer = () => {
    const minutes = parseInt(inputMinutes) || 0;
    const seconds = parseInt(inputSeconds) || 0;
    
    if (minutes >= 0 && seconds >= 0 && (minutes > 0 || seconds > 0)) {
      const newTime = (minutes * 60) + seconds;
      setTimeLeft(newTime);
      setIsRunning(true);
      setIsPaused(false);
      setInputMinutes('');
      setInputSeconds('');
      if (isTeamsInitialized && hasTimerControl) {
        broadcastTimerState(newTime, true, false);
      }
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
    if (isTeamsInitialized && hasTimerControl) {
      broadcastTimerState(0, false, false);
    }
  };

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    if (isTeamsInitialized && hasTimerControl) {
      broadcastTimerState(timeLeft, isRunning, newPausedState);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (value, type) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (type === 'minutes') {
      setInputMinutes(numericValue);
    } else {
      // Ensure seconds are between 0 and 59
      const seconds = parseInt(numericValue) || 0;
      if (seconds <= 59) {
        setInputSeconds(numericValue);
      }
    }
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

          {(!isTeamsInitialized || hasTimerControl) ? (
            <div className="controls">
              <div className="time-inputs">
                <div className="time-input-container">
                  <label htmlFor="minutes">Minutes</label>
                  <input
                    id="minutes"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={inputMinutes}
                    onChange={(e) => handleInputChange(e.target.value, 'minutes')}
                    disabled={isRunning}
                  />
                </div>
                <div className="time-input-container">
                  <label htmlFor="seconds">Seconds</label>
                  <input
                    id="seconds"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={inputSeconds}
                    onChange={(e) => handleInputChange(e.target.value, 'seconds')}
                    disabled={isRunning}
                  />
                </div>
              </div>
              
              <div className="button-group">
                <Button
                  primary
                  content={isRunning ? "Running..." : "Start Timer"}
                  onClick={startTimer}
                  disabled={isRunning || (!inputMinutes && !inputSeconds)}
                />
                {isRunning && (
                  <Button
                    content={isPaused ? "Resume" : "Pause"}
                    onClick={togglePause}
                    style={{
                      backgroundColor: isPaused ? '#5cb85c' : '#f0ad4e',
                      color: 'white'
                    }}
                  />
                )}
                <Button
                  content="Stop Timer"
                  onClick={stopTimer}
                  disabled={!isRunning}
                  style={{
                    backgroundColor: '#d9534f',
                    color: 'white'
                  }}
                />
              </div>
            </div>
          ) : (
            <Text size="small" content="You don't have permission to control the timer. Only the meeting organizer and presenters can control the timer." />
          )}

          {isPaused && (
            <div className="pause-indicator">
              Timer Paused
            </div>
          )}

          {hasTimerControl && (
            <div className="role-indicator">
              <Text size="small" content={`You have timer control as: ${userRole}`} />
            </div>
          )}

          <div className="debug-info" style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
            <p>Debug Info:</p>
            <p>Is Organizer: {isOrganizer ? 'Yes' : 'No'}</p>
            <p>Has Timer Control: {hasTimerControl ? 'Yes' : 'No'}</p>
            <p>User Role: {userRole || 'Unknown'}</p>
            <p>Teams Initialized: {isTeamsInitialized ? 'Yes' : 'No'}</p>
            <p>User ID: {debugContext.userId}</p>
            <p>Organizer ID: {debugContext.organizerId}</p>
            <p>Meeting ID: {debugContext.meetingId}</p>
            <p>Frame Context: {debugContext.frameContext}</p>
            <p>Available Roles: {JSON.stringify(debugContext.roles)}</p>
            <p>Capabilities: {JSON.stringify(debugContext.capabilities)}</p>
            <p style={{ color: '#ff4444' }}>Initialization Error: {debugContext.initError || 'None'}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
