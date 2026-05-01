import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <h1>HelpHub - Coming Soon</h1>
        <p>The complete crowdfunding platform is being set up.</p>
        <p>Backend API available at: http://localhost:5000/api</p>
      </div>
    </Router>
  );
}

export default App;
