import React from 'react';
import { NavLink } from 'react-router-dom'; // Используем NavLink для активных ссылок
import styles from './TaskNavigation.module.sass'; // Подключаем красивые стили

const TaskNavigation = () => {
  return (
    <nav className={styles.navigation}>
      <NavLink
        to="/task1"
        className={({ isActive }) => (isActive ? `${styles['active-link']}` : '')}
      >
        Завдання 1
      </NavLink>
      <NavLink
        to="/task2-3"
        className={({ isActive }) => (isActive ? `${styles['active-link']}` : '')}
      >
        Завдання 2-5
      </NavLink>
    </nav>
  );
};

export default TaskNavigation;
