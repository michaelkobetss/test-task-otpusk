import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Task1 from "@pages/Task1";
import Task2 from "@pages/Task2";
import Task3 from "@pages/Task3";
import Task4 from "@pages/Task4";
import Task5 from "@pages/Task5";
import Layout from "@components/Layout/index.js";
import TaskNavigation from "@components/TaskNavigation"; // Импортируем новый компонент

const App = () => {
    return (
        <Router>
            <div className="app-container">
                <Layout>
                    {/* Навигация */}
                    <TaskNavigation />

                    {/* Маршруты */}
                    <Routes>
                        <Route
                            path="/"
                            element={<Navigate to="/task1" replace />} // Редирект с "/"
                        />
                        <Route path="/task1" element={<Task1 />} />
                        <Route path="/task2" element={<Task2 />} />
                        <Route path="/task3" element={<Task3 />} />
                        <Route path="/task4" element={<Task4 />} />
                        <Route path="/task5" element={<Task5 />} />
                        <Route
                            path="*"
                            element={<div>Страница не найдена!</div>} // Обработка неизвестных маршрутов
                        />
                    </Routes>
                </Layout>
            </div>
        </Router>
    );
};

export default App;