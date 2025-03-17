# Teams Meeting Timer App

A Microsoft Teams application that provides a timer functionality for meetings, allowing organizers to set and display countdown timers during presentations.

## Features

- Meeting organizer can set and control a countdown timer
- All participants can see the timer in real-time
- Visual indication when timer is running low (turns red in last 30 seconds)
- Simple, intuitive interface integrated into Teams meetings

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Create a new app registration in the Microsoft Teams Admin Center:
   - Replace the `{{YOUR_APP_ID}}` in manifest.json with your actual app ID
   - Upload the manifest.json file to Teams

4. To use in a meeting:
   - Start a Teams meeting
   - Add the Timer app from the meeting apps
   - Only the meeting organizer will see the timer controls
   - All participants will see the countdown

## Development Notes

- Built using React and Microsoft Teams JavaScript SDK
- Uses Fluent UI for Teams-native look and feel
- Supports real-time updates across all meeting participants
