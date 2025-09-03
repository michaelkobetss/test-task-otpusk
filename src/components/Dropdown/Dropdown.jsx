import React from 'react';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import HotelIcon from '@mui/icons-material/Hotel';
import styles from './Dropdown.module.sass';

const Dropdown = ({ items = [], onItemSelect, selectedItemId = null }) => {
  return (
    <ul className={styles.dropdown}>
      {/* Если список пуст — отображаем сообщение */}
      {items.length === 0 && <li className={styles.dropdown__noitems}>Нічого не знайдено</li>}

      {/* Отображение элементов списка */}
      {items.map((item) => (
        <li
          key={item.id}
          className={`${styles.dropdown__item} ${
            item.id === selectedItemId ? styles['dropdown__item--selected'] : ''
          }`}
          onClick={() => onItemSelect(item)}
        >
          <span className={styles.dropdown__icon}>
            {item.type === 'country' && item.flag && (
              <img src={item.flag} alt="Country flag" className={styles.dropdown__flag} />
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
