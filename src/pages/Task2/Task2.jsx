// src/pages/Task2/Task2.jsx
import React from "react";
import Layout from "@components/Layout"; // Макет страницы
import SearchTours from "@components/SearchTours"; // Импорт отдельного компонента

const Task2 = () => {
    return (
        <Layout>
            <div className="task-container">
                <SearchTours />
            </div>
        </Layout>
    );
};

export default Task2;