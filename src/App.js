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

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        // Check if we're running in Teams
        if (window.parent === window.self) {
          console.log('Running outside of Teams - skipping Teams initialization');
          return;
        }

        await microsoftTeams.app.initialize();
        setIsTeamsInitialized(true);

        // Check if user is meeting organizer
        try {
          const context = await microsoftTeams.meeting.getMeetingDetails();
          console.log('Meeting context:', context);
          
          // Get current user's ID
          const userContext = await microsoftTeams.app.getContext();
          console.log('User context:', userContext);
          
          if (context.meeting?.organizer?.userId === userContext.user.id) {
            setIsOrganizer(true);
          }
        } catch (meetingError) {
          console.log('Error getting meeting details:', meetingError);
          // Don't throw error here, just log it and continue
        }

        // Register handlers
        microsoftTeams.app.registerOnThemeChangeHandler((theme) => {
          console.log('Theme changed:', theme);
        });

        try {
          await microsoftTeams.messages.registerMessageHandler("timerUpdate", (message) => {
            if (message.timeLeft !== undefined) setTimeLeft(message.timeLeft);
            if (message.isRunning !== undefined) setIsRunning(message.isRunning);
            if (message.isPaused !== undefined) setIsPaused(message.isPaused);
          });
        } catch (messageError) {
          console.log('Error registering message handler:', messageError);
          // Don't throw error here, just log it and continue
        }
      } catch (err) {
        console.log('Teams initialization error:', err);
        setError(err.message);
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
          if (isTeamsInitialized && isOrganizer) {
            broadcastTimerState(newTime, isRunning, isPaused);
          }
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      setIsPaused(false);
      if (isTeamsInitialized && isOrganizer) {
        broadcastTimerState(0, false, false);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeLeft, isOrganizer, isTeamsInitialized]);

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
      if (isTeamsInitialized && isOrganizer) {
        broadcastTimerState(newTime, true, false);
      }
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
    if (isTeamsInitialized && isOrganizer) {
      broadcastTimerState(0, false, false);
    }
  };

  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    if (isTeamsInitialized && isOrganizer) {
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
      <Text size="large" weight="bold" content="Meeting Timer" />
      
      <div className={`timer-display ${timeLeft <= 30 && !isPaused ? 'timer-red' : ''}`}>
        {formatTime(timeLeft)}
      </div>

      {(!isTeamsInitialized || isOrganizer) ? (
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
        <Text size="small" content="Only the meeting organizer can control the timer" />
      )}

      {isPaused && (
        <div className="pause-indicator">
          Timer Paused
        </div>
      )}
    </div>
  );
}

export default App;
