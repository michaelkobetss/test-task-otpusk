import React from "react";
import PublicIcon from "@mui/icons-material/Public"; // Иконка для стран (глобус)
import LocationCityIcon from "@mui/icons-material/LocationCity"; // Иконка для городов
import HotelIcon from "@mui/icons-material/Hotel"; // Иконка для отелей
import styles from "./Dropdown.module.sass"; // Подключение модулей правильно

const Dropdown = ({ items, onItemSelect }) => {
    return (
        <ul className={styles.dropdown}>
            {items.map((item) => (
                <li
                    key={item.id}
                    className={styles.dropdown__item}
                    onClick={() => onItemSelect(item)}
                >
                       <span className={styles.dropdown__icon}>
                           {/* Отображаем иконки Material Icons в зависимости от типа элемента */}
                           {item.type === "country" && <PublicIcon />}
                           {item.type === "city" && <LocationCityIcon />}
                           {item.type === "hotel" && <HotelIcon />}
                       </span>
                    <span className={styles.dropdown__text}>{item.name}</span>
                </li>
            ))}
        </ul>
    );
};

export default Dropdown;