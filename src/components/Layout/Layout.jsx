// src/components/Layout/Layout.jsx
import React from 'react';
import styles from './Layout.module.sass';

const Layout = ({ children }) => {
  return <div className={styles.container}>{children}</div>;
};

export default Layout;
