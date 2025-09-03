import React, { useEffect, useRef, useState, useCallback } from 'react';
import Dropdown from '../Dropdown/Dropdown.jsx';
import styles from './SearchForm.module.sass';
import CloseIcon from '@mui/icons-material/Close';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useDispatch, useSelector } from 'react-redux';
import { clearInfo, setCountryID, tickRemaining } from '@store/tours/toursSlice.js';
import { cancelActiveSearch, fetchTours } from '@store/tours/toursThunks.js';
import StatusBar from './StatusBar.jsx';
import ToursList from './ToursList.jsx';
import { fetchHotelDetails, fetchToursByCity } from '@store/tours/toursThunks.js';

const SearchForm = () => {
  const dispatch = useDispatch();
  const {
    isLoading,
    error,
    info,
    results,
    countryID,
    isWaiting,
    remainingSeconds,
    emptyRetriesByCountry,
  } = useSelector((state) => state.tours);

  const [searchValue, setSearchValue] = useState('');
  const [dropdownItems, setDropdownItems] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null); // 'country' | 'city' | 'hotel'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isFirstFocus, setIsFirstFocus] = useState(true);
  const [triedDuringWait, setTriedDuringWait] = useState(false);

  const intervalRef = useRef(null);

  // Запуск таймера ожидания, если идёт процесс ожидания
  useEffect(() => {
    if (!isWaiting) {
      setTriedDuringWait(false);
      return;
    }
    intervalRef.current = setInterval(() => {
      dispatch(tickRemaining());
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isWaiting, dispatch]);

  const detectType = useCallback((item) => {
    if (item.countryID || item.value?.includes('country')) return 'country';
    if (item.cityId || item.cityID) return 'city';
    if (item.hotelId || item.hotelID) return 'hotel';
    return 'unknown';
  }, []);

  const fetchCountries = useCallback(async () => {
    try {
      const response = await getCountries();
      const countries = await response.json();
      const countriesWithType = Object.values(countries).map((country) => ({
        ...country,
        type: 'country',
      }));
      setDropdownItems(countriesWithType);
      setIsDropdownOpen(true);
    } catch (err) {
      console.error('Ошибка при загрузке стран:', err);
    }
  }, []);

  const handleSearchGeo = useCallback(
    async (value) => {
      try {
        // Если выбран тип страны, ищем страны, иначе передаём тип для поиска городов или отелей
        const params =
          selectedType && (selectedType === 'city' || selectedType === 'hotel')
            ? { query: value, type: selectedType }
            : { query: value };
        const response = await searchGeo(params);
        const data = await response.json();
        const normalized = Object.values(data).map((item) => ({
          ...item,
          type: item.type || detectType(item),
        }));
        setDropdownItems(normalized);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Ошибка при работе с API:', err);
      }
    },
    [detectType, selectedType]
  );

  // Обработка фокуса: при первом фокусе грузим страны, иначе поиск по введённому запросу
  const handleInputFocus = async () => {
    if (isFirstFocus) {
      setIsFirstFocus(false);
      await fetchCountries();
    } else if (selectedType === 'country') {
      await fetchCountries();
    } else {
      await handleSearchGeo(searchValue);
    }
  };

  const handleInputChange = async (event) => {
    const value = event.target.value;
    setSearchValue(value);
    console.log('handleInputChange', value);

    if (!value.trim()) {
      await fetchCountries();
    } else {
      await handleSearchGeo(value);
    }
  };

  const handleItemSelect = async (item) => {
    setSearchValue(item.name);
    setSelectedType(item.type);
    setSelectedItem(item);
    setIsDropdownOpen(false);

    // Обработка выбора в зависимости от типа
    if (item.type === 'country') {
      try {
        // Например, отменяем активный поиск и инициируем поиск туров по стране
        await dispatch(cancelActiveSearch());
        dispatch(setCountryID(item.id));
      } catch (e) {
        console.error(e);
      }
    } else if (item.type === 'city') {
      try {
        // Сохраняем выбранный город
        dispatch(setSelectedCity(item));
        // Запускаем поиск туров по выбранному городу
        // Передаем в thunk идентификатор города (используйте нужное поле, например, cityID или id)
        await dispatch(fetchToursByCity(item.cityID || item.cityId || item.id));
      } catch (e) {
        console.error(e);
      }
    } else if (item.type === 'hotel') {
      try {
        // Сохраняем выбранный отель
        dispatch(setSelectedHotel(item));
        // Запускаем запрос деталей отеля или поиск туров по отелю,
        // передавая идентификатор отеля (используйте hotelID или hotelId или id)
        await dispatch(fetchHotelDetails(item.hotelID || item.hotelId || item.id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    let idToUse = countryID;

    // Если пользователь явно выбрал страну (или элемент типа country)
    if (selectedType === 'country' && selectedItem) {
      const selected =
        dropdownItems.find((it) => it.type === 'country' && it.name === searchValue) ||
        selectedItem;
      if (selected) {
        idToUse = String(
          selected.id ?? selected.countryID ?? selected.value ?? selected.key ?? idToUse ?? ''
        );
        try {
          await dispatch(cancelActiveSearch());
        } catch {
          // Игнорируем
        }
        dispatch(setCountryID(idToUse));
      }
    }

    // Если выбраны город или отель
    if ((selectedType === 'city' || selectedType === 'hotel') && selectedItem) {
      idToUse = countryID || selectedItem.countryId || idToUse;
    }

    if (!idToUse) {
      console.warn('Не выбран ID страны — невозможно выполнить поиск туров');
      return;
    }

    const retriesForThisCountry = emptyRetriesByCountry?.[idToUse];
    if (typeof retriesForThisCountry === 'number' && retriesForThisCountry <= 0) {
      dispatch(clearInfo());
      return;
    }

    if (isWaiting) {
      setTriedDuringWait(true);
      return;
    }

    dispatch(clearInfo());
    dispatch(fetchTours(idToUse));
  };

  const clearInput = () => {
    setSearchValue('');
    setDropdownItems([]);
    setIsDropdownOpen(false);
    setSelectedType(null);
    setSelectedItem(null);
    setIsFirstFocus(true);
  };

  const retriesForThisCountry = emptyRetriesByCountry?.[countryID];
  const disableSubmit =
    isLoading ||
    isWaiting ||
    (typeof retriesForThisCountry === 'number' && retriesForThisCountry <= 0);

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
          <Dropdown items={dropdownItems} onItemSelect={handleItemSelect} />
        )}

        <button
          type="submit"
          className={styles['search-form__submit-button']}
          disabled={disableSubmit}
        >
          Знайти
        </button>
      </form>

      <StatusBar
        retriesForThisCountry={retriesForThisCountry}
        isLoading={isLoading}
        triedDuringWait={triedDuringWait}
        isWaiting={isWaiting}
        remainingSeconds={remainingSeconds}
        info={info}
        error={error}
      />

      {!isLoading && !isWaiting && !error && results?.length > 0 && (
        <ToursList results={results} selectedType={selectedType} selectedItem={selectedItem} />
      )}
    </div>
  );
};

export default SearchForm;
