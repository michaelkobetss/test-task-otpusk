// src/components/SearchForm/SearchForm.jsx
import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTours } from '@store/tours/toursThunks';
import { clearInfo, setSelectedItem, clearSelectedItem } from '@store/tours/toursSlice';
import Dropdown from '../Dropdown/Dropdown.jsx';
import styles from './SearchForm.module.sass';
import CloseIcon from '@mui/icons-material/Close';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import StatusBar from './StatusBar.jsx';
import ToursList from './ToursList.jsx';
import store from '@store/index.js';

const SearchForm = () => {
  const dispatch = useDispatch();
  const {
    results,
    isLoading,
    isWaiting,
    error,
    info,
    retriesLeft,
    remainingSeconds,
    selectedItem,
  } = useSelector((state) => state.tours);

  // локальні стейти
  const [searchValue, setSearchValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [disableSubmit, setDisableSubmit] = useState(true);

  // --- loadCountries / searchGeo ---
  const loadCountries = useCallback(async () => {
    try {
      const res = await getCountries();
      const data = await res.json();
      const items = Object.values(data).map((c) => ({ ...c, type: 'country' }));
      setDropdownItems(items);
      setIsDropdownOpen(true);
    } catch (e) {
      console.error('Помилка при завантаженні країн', e);
    }
  }, []);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchValue(value);
    dispatch(clearSelectedItem());
    setSelectedType(null);

    if (!value) {
      await loadCountries();
      return;
    }

    try {
      const res = await searchGeo(value);
      const data = await res.json();
      const items = Object.values(data);
      setDropdownItems(items);
      setIsDropdownOpen(true);
    } catch (err) {
      console.error('Помилка searchGeo', err);
    }
  };

  const handleInputFocus = async () => {
    if (selectedItem) {
      if (selectedItem.type === 'country') {
        await loadCountries();
      } else {
        try {
          const res = await searchGeo(searchValue);
          const data = await res.json();
          setDropdownItems(Object.values(data));
        } catch (err) {
          console.error('Помилка searchGeo', err);
        }
      }
      setIsDropdownOpen(true);
    } else {
      await loadCountries();
    }
  };

  const handleItemSelect = (item) => {
    setSearchValue(item.name);
    dispatch(setSelectedItem(item));
    setSelectedType(item.type);
    setIsDropdownOpen(false);
    setDisableSubmit(!item);
  };

  const clearInput = async () => {
    setSearchValue('');
    setDisableSubmit(true);
    dispatch(clearSelectedItem());
    dispatch(clearInfo());
    await loadCountries();
  };

  // --- Сабміт ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const state = store.getState().tours; // або useSelector
    // встав сюди відповідь

    dispatch(clearInfo());
    dispatch(fetchTours({ id: selectedItem.id, type: selectedItem.type }));
  };

  return (
    <div className={styles.card}>
      <form className={styles['search-form']} onSubmit={handleSubmit}>
        <h2 className={styles['search-form__title']}>Форма пошуку турів</h2>

        <div className={styles['search-form__input-wrapper']}>
          <input
            type="text"
            value={searchValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="Введіть напрямок"
            className={styles['search-form__input']}
          />
          {searchValue && (
            <CloseIcon className={styles['search-form__clear-icon']} onClick={clearInput} />
          )}
        </div>

        {isDropdownOpen && dropdownItems.length === 0 && (
          <div className={styles['search-form__no-results']}>
            <SearchOffIcon fontSize="small" />
            <span>Нічого не знайдено</span>
          </div>
        )}

        {isDropdownOpen && dropdownItems.length > 0 && (
          <Dropdown
            items={dropdownItems}
            onItemSelect={handleItemSelect}
            selectedItemId={selectedItem?.id}
          />
        )}

        <button
          type="submit"
          className={`${styles['search-form__submit-button']} ${
            isWaiting ? styles['search-form__submit-button--disabled'] : ''
          }`}
          disabled={disableSubmit || isWaiting}
        >
          Знайти
        </button>
      </form>

      <StatusBar
        retriesForThisCountry={retriesLeft}
        isLoading={isLoading}
        isWaiting={isWaiting}
        remainingSeconds={remainingSeconds}
        info={info}
        error={error}
      />

      {!isLoading && !isWaiting && !error && results?.length === 0 && (
        <div className={styles['search-form__empty']}>За вашим запитом турів не знайдено</div>
      )}

      {!isLoading && !isWaiting && !error && results?.length > 0 && (
        <ToursList results={results} selectedType={selectedType} selectedItem={selectedItem} />
      )}
    </div>
  );
};

export default SearchForm;
