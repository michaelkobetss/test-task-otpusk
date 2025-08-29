import React, { useState } from "react";
import Dropdown from "../Dropdown/Dropdown.jsx";
import styles from "./SearchForm.module.sass";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import {SearchOff} from "@mui/icons-material"; // Імпортуємо сумний смайлик

const SearchForm = () => {
    const [searchValue, setSearchValue] = useState("");
    const [dropdownItems, setDropdownItems] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedType, setSelectedType] = useState(null); // Тип выбранного значения (country, city, hotel)
    const [isFirstFocus, setIsFirstFocus] = useState(true); // Отслеживание первого фокуса

    const fetchCountries = async () => {
        try {
            const response = await getCountries();
            const countries = await response.json();
            const countriesWithType = Object.values(countries).map((country) => ({
                ...country,
                type: "country",
            }));
            setDropdownItems(countriesWithType);
            setIsDropdownOpen(true);
        } catch (error) {
            console.error("Ошибка при загрузке стран:", error);
        }
    };

    // Обработка фокуса на инпуте
    const handleInputFocus = async () => {
        try {
            if (isFirstFocus) {
                // Если первое нажатие, показываем только страны
                setIsFirstFocus(false); // Сбрасываем этот флаг для последующих фокусов
                await fetchCountries();
            } else if (selectedType === "country") {
                // Если выбрана страна, также показываем страны
                await fetchCountries();
            } else {
                // Для других типов выполняем поиск
                const response = await searchGeo(searchValue);
                const results = await response.json();
                // Убираем страны из результата
                const filteredResults = Object.values(results).filter(
                    (item) => item.type !== "country"
                );
                setDropdownItems(filteredResults);
                setIsDropdownOpen(true);
            }
        } catch (error) {
            console.error("Ошибка при загрузке данных:", error);
        }
    };

    // Изменение значения инпута
    const handleInputChange = async (event) => {
        const value = event.target.value;
        setSearchValue(value);

        try {
            if (value.trim() === "") {
                fetchCountries();
            } else {
                const response = await searchGeo(value);
                const results = await response.json();
                // Если вбили новое значение, убираем страны
                const filteredResults = Object.values(results).filter(
                    (item) => item.type !== "country" || selectedType === "country"
                );
                setDropdownItems(filteredResults);
                setIsDropdownOpen(true);
            }
        } catch (error) {
            console.error("Ошибка при работе с API:", error);
        }
    };

    // Выбираем элемент из списка
    const handleItemSelect = (item) => {
        setSearchValue(item.name);
        setSelectedType(item.type); // Сохраняем тип (country, city, hotel)
        setIsDropdownOpen(false);
    };

    // Сабмит формы
    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Submitted value:", searchValue);
        setIsDropdownOpen(false); // Скрываем меню при сабмите
    };

    // Очистка инпута
    const clearInput = () => {
        setSearchValue("");
        setDropdownItems([]);
        setIsDropdownOpen(false);
        setSelectedType(null); // Сбрасываем тип
        setIsFirstFocus(true);
    };

    return (
        <div className={styles.card}>
            <form className={styles["search-form"]} onSubmit={handleSubmit}>
                <h2 className={styles["search-form__title"]}>Форма пошуку турів</h2>

                {/* Инпут с обработчиками */}
                <div className={styles["search-form__input-wrapper"]}>
                    <input
                        type="text"
                        value={searchValue}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSubmit(e); // Сабмит при нажатии Enter
                            }
                        }}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        placeholder="Введіть напрямок"
                        className={styles["search-form__input"]}
                    />
                    {searchValue && (
                        <CloseIcon
                            className={styles["search-form__clear-icon"]}
                            onClick={clearInput}
                        />
                    )}
                </div>

                {/* Уведомление о том, что ничего не найдено */}
                {isDropdownOpen && dropdownItems.length === 0 && (
                    <div className={styles["search-form__no-results"]}>
                        <SearchOffIcon fontSize="small" />
                        <span>Нічого не знайдено</span>
                    </div>
                )}

                {/* Выпадающий список */}
                {isDropdownOpen && dropdownItems.length > 0 && (
                    <Dropdown items={dropdownItems} onItemSelect={handleItemSelect} />
                )}

                <button type="submit" className={styles["search-form__submit-button"]}>
                    Знайти
                </button>
            </form>
        </div>
    );
};

export default SearchForm;