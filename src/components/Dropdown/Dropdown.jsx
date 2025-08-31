import React from 'react';
import LocationCityIcon from '@mui/icons-material/LocationCity'; // Иконка для городов
import HotelIcon from '@mui/icons-material/Hotel'; // Иконка для отелей
import styles from './Dropdown.module.sass';

const Dropdown = ({ items, onItemSelect }) => {
  return (
    <ul className={styles.dropdown}>
      {items.map((item) => (
        <li key={item.id} className={styles.dropdown__item} onClick={() => onItemSelect(item)}>
          <span className={styles.dropdown__icon}>
            {item.type === 'country' && (
              <img src={item.flag} alt={`${item.name} flag`} className={styles.dropdown__flag} />
            )}
            {item.type === 'city' && <LocationCityIcon />}
            {item.type === 'hotel' && <HotelIcon />}
          </span>
          <span className={styles.dropdown__text}>{item.name}</span>
        </li>
      ))}
    </ul>
  );
};

export default Dropdown;
