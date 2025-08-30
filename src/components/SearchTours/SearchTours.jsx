import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CircularProgress from "@mui/material/CircularProgress";
import { Link } from "react-router-dom";
import {
    setCountryID,
    tickRemaining,
    clearInfo,
} from "@store/tours/toursSlice.js";
import { fetchTours, cancelActiveSearch } from "@store/tours/toursThunks.js";
import styles from "./SearchTours.module.sass";

const SearchTours = () => {
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
        hasSearched,
    } = useSelector((s) => s.tours);

    const [triedDuringWait, setTriedDuringWait] = useState(false);

    const intervalRef = useRef(null);
    useEffect(() => {
        if (isWaiting) {
            if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                    dispatch(tickRemaining());
                }, 1000);
            }
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setTriedDuringWait(false);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isWaiting, dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const retriesForThisCountry = emptyRetriesByCountry?.[countryID];
        if (typeof retriesForThisCountry === "number" && retriesForThisCountry <= 0) {
            dispatch(clearInfo());
            return;
        }
        if (isWaiting) {
            setTriedDuringWait(true);
            return;
        }
        dispatch(clearInfo());
        dispatch(fetchTours(countryID));
    };

    const handleCountryChange = async (e) => {
        const newId = e.target.value;
        await dispatch(cancelActiveSearch());
        dispatch(setCountryID(newId));
    };

    const retriesForThisCountry = emptyRetriesByCountry?.[countryID];
    const disableSubmit =
        isLoading ||
        (typeof retriesForThisCountry === "number" && retriesForThisCountry <= 0);

    const showEmptyHint =
        hasSearched && !isWaiting && !isLoading && !error && results && results.length === 0;

    return (
        <div className={styles.searchContainer}>
            <h1>Пошук турів</h1>

            <form onSubmit={handleSubmit} className={styles.searchForm}>
                <label className={styles.formLabel}>
                    Виберіть країну:
                    <select
                        value={countryID}
                        onChange={handleCountryChange}
                        className={styles.selectInput}
                    >
                        <option value="43">Єгипет</option>
                        <option value="115">Туреччина</option>
                        <option value="34">Греція</option>
                    </select>
                </label>

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={disableSubmit}
                >
                    Знайти тури
                </button>
            </form>

            <div className={styles.statusBar}>
                {typeof retriesForThisCountry === "number" &&
                    retriesForThisCountry <= 0 &&
                    !isLoading && (
                        <div className={styles.error}>Ліміт спроб оновлення вичерпано.</div>
                    )}

                {isLoading && (
                    <div className={styles.loaderInline}>
                        <CircularProgress size={20} />
                        <span className={styles.loaderText}>Завантаження...</span>
                    </div>
                )}

                {triedDuringWait && isWaiting && (
                    <div className={styles.info}>
                        Зачекайте {remainingSeconds} сек...
                    </div>
                )}

                {info && <div className={styles.info}>{info}</div>}
                {error && <div className={styles.error}>{error}</div>}
            </div>



            {!isLoading && !isWaiting && !error && results && results.length > 0 && (
                <ul className={styles.resultsList}>
                    {results.map((tour) => (
                        <li key={tour.id} className={styles.resultItem}>
                            {tour.img ? (
                                <img src={tour.img} alt={`Готель ${tour.hotelName}`} />
                            ) : (
                                <div className={styles.noImage}>No image</div>
                            )}
                            <p>Готель: {tour.hotelName}</p>
                            <p>
                                {tour.country} {tour.city}
                            </p>
                            <p>
                                З {new Date(tour.startDate).toLocaleDateString("uk-UA")} до{" "}
                                {new Date(tour.endDate).toLocaleDateString("uk-UA")}
                            </p>
                            <p className={styles.price}>
                                {tour.amount.toLocaleString("uk-UA")} {tour.currency}
                            </p>

                            <Link
                                to={`/price/${tour.id}`}
                                className={styles.linkButton}
                            >
                                Відкрити ціну
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchTours;
