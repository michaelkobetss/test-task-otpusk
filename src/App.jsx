//App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";

import Task1 from "@pages/Task1";
import Task23 from "@pages/Task2-3";
import Task45 from "@pages/Task4-5";
import Layout from "@components/Layout/index.js";
import TaskNavigation from "@components/TaskNavigation";

const App = () => {
    return (
        <Provider store={store}>   {/* ✅ Оборачиваем всё в Provider */}
            <Router>
                <div className="app-container">
                    <Layout>
                        {/* Навигация */}
                        <TaskNavigation />

                        {/* Маршруты */}
                        <Routes>
                            <Route
                                path="/"
                                element={<Navigate to="/task1" replace />}
                            />
                            <Route path="/task1" element={<Task1 />} />
                            <Route path="/task2-3" element={<Task23 />} />
                            <Route path="/price/:priceId" element={<Task45 />} />

                            <Route
                                path="*"
                                element={<div>Сторінка не знайдена!</div>}
                            />
                        </Routes>
                    </Layout>
                </div>
            </Router>
        </Provider>
    );
};

export default App;
