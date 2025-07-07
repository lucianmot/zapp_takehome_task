import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import InventoryScreen from './screens/InventoryScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/inventory" element={<InventoryScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
