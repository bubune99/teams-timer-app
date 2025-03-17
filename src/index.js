import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { Provider, teamsTheme } from '@fluentui/react-northstar';
import './index.css';

ReactDOM.render(
  <Provider theme={teamsTheme}>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </Provider>,
  document.getElementById('root')
);
