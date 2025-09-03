import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Wifi as WifiIcon,
  Pool as PoolIcon,
  SportsTennis as TennisIcon,
  LocalLaundryService as LaundryIcon,
  LocalParking as ParkingIcon,
  CheckCircle as DefaultIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import styles from './PricePage.module.sass';

export default function PricePage() {
  const { priceId } = useParams();
  const { state } = useLocation();
  const hotelId = state?.hotelId;

  const [hotel, setHotel] = useState(null);
  const [price, setPrice] = useState(null);

  useEffect(() => {
    if (hotelId) {
      getHotel(Number(hotelId))
        .then((res) => res.json())
        .then((data) => setHotel(data))
        .catch((err) => {
          console.error(err);
          setHotel(null);
        });
    }
  }, [hotelId]);

  useEffect(() => {
    if (priceId) {
      getPrice(priceId)
        .then((res) => res.json())
        .then((data) => setPrice(data))
        .catch((err) => {
          console.error(err);
          setPrice(null);
        });
    }
  }, [priceId]);

  if (!hotel || !price) {
    return (
      <div className={styles.card}>
        <h3>Завантаження...</h3>
        {/* Пример использования иконки из MUI */}
        <div>
          <SearchOffIcon />
        </div>
      </div>
    );
  }

  const startDate = new Date(price.startDate).toLocaleDateString('uk-UA');
  const endDate = new Date(price.endDate).toLocaleDateString('uk-UA');

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{hotel.name}</h2>
      <p className={styles.location}>
        <LocationOnIcon />
        {hotel.countryName} &nbsp; | &nbsp; {hotel.cityName}
      </p>

      <img src={hotel.img} alt={hotel.name} className={styles.image} />

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Опис</h3>
        <p className={styles.description}>{hotel.description ?? 'Опис недоступний'}</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Сервіси</h3>
        <div className={styles.services}>
          {Object.entries(hotel.services || {}).map(([key, value]) =>
            value === 'yes' ? (
              <div key={key} className={styles.serviceItem}>
                <span>{getServiceIconComponent(key)}</span>
                <span>{getServiceTranslation(key)}</span>
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.date}>
          {startDate} – {endDate}
        </p>
        <p className={styles.price}>
          {price.amount.toLocaleString('uk-UA')} {price.currency.toUpperCase()}
        </p>
      </div>

      <Link to="/" className={styles.linkButton}>
        Назад до результатів
      </Link>
    </div>
  );
}

/**
 * Возвращает компонент иконки, соответствующий типу сервиса
 * @param {string} key
 */
function getServiceIconComponent(key) {
  switch (key) {
    case 'wifi':
      return <WifiIcon />;
    case 'aquapark':
      return <PoolIcon />;
    case 'tennis_court':
      return <TennisIcon />;
    case 'laundry':
      return <LaundryIcon />;
    case 'parking':
      return <ParkingIcon />;
    default:
      return <DefaultIcon />;
  }
}

/**
 * Возвращает перевод сервиса
 * @param {string} key
 */
function getServiceTranslation(key) {
  switch (key) {
    case 'wifi':
      return 'Wi-Fi';
    case 'aquapark':
      return 'Басейн';
    case 'tennis_court':
      return 'Теніс';
    case 'laundry':
      return 'Пральня';
    case 'parking':
      return 'Паркінг';
    default:
      return key;
  }
}
