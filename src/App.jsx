//App.jsx
import React from 'react';
import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';

import Task1 from '@pages/Task1';
import Task45 from '@pages/Task4-5';
import Layout from '@components/Layout/index.js';

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="app-container">
          <Layout>
            {/* Навигация */}

            {/* Маршруты */}
            <Routes>
              <Route path="/" element={<Navigate to="/task1" replace />} />
              <Route path="/task1" element={<Task1 />} />

              <Route path="/price/:priceId" element={<Task45 />} />

              <Route path="*" element={<div>Сторінка не знайдена!</div>} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </Provider>
  );
};

export default App;
