import React from "react";
import { NavLink } from "react-router-dom"; // Используем NavLink для активных ссылок
import styles from "./TaskNavigation.module.sass"; // Подключаем красивые стили

const TaskNavigation = () => {
    return (
        <nav className={styles.navigation}>
            <NavLink
                to="/task1"
                className={({ isActive }) =>
                    isActive ? `${styles["active-link"]}` : ""
                }
            >
                Задача 1
            </NavLink>
            <NavLink
                to="/task2"
                className={({ isActive }) =>
                    isActive ? `${styles["active-link"]}` : ""
                }
            >
                Задача 2
            </NavLink>
            <NavLink
                to="/task3"
                className={({ isActive }) =>
                    isActive ? `${styles["active-link"]}` : ""
                }
            >
                Задача 3
            </NavLink>
            <NavLink
                to="/task4"
                className={({ isActive }) =>
                    isActive ? `${styles["active-link"]}` : ""
                }
            >
                Задача 4
            </NavLink>
            <NavLink
                to="/task5"
                className={({ isActive }) =>
                    isActive ? `${styles["active-link"]}` : ""
                }
            >
                Задача 5
            </NavLink>
        </nav>
    );
};

export default TaskNavigation;