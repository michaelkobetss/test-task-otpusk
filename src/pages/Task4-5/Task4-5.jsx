import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import styles from './Task45.module.sass';

export default function Task45() {
  const { priceId } = useParams();
  const { state } = useLocation();
  const hotelId = state?.hotelId;

  const [hotel, setHotel] = useState(null);
  const [price, setPrice] = useState(null);

  useEffect(() => {
    if (hotelId) {
      getHotel(Number(hotelId))
        .then((res) => res.json())
        .then((data) => setHotel(data));
    }
  }, [hotelId]);

  useEffect(() => {
    if (priceId) {
      getPrice(priceId)
        .then((res) => res.json())
        .then((data) => setPrice(data));
    }
  }, [priceId]);

  if (!hotel || !price) return <p>Завантаження...</p>;

  const startDate = new Date(price.startDate).toLocaleDateString('uk-UA');
  const endDate = new Date(price.endDate).toLocaleDateString('uk-UA');

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{hotel.name}</h2>
      <p className={styles.location}>
        <span className="material-icons">location_on</span>
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
          {Object.entries(hotel.services || {}).map(([key, value]) => (
            <div key={key} className={styles.serviceItem}>
              <span className="material-icons">{getServiceIcon(key)}</span>
              <span>{translateService(key)}</span>
              {value === 'yes' && <span className={styles.ok}>✓</span>}
            </div>
          ))}
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

function getServiceIcon(key) {
  switch (key) {
    case 'wifi':
      return 'wifi';
    case 'aquapark':
      return 'pool';
    case 'tennis_court':
      return 'sports_tennis';
    case 'laundry':
      return 'local_laundry_service';
    case 'parking':
      return 'local_parking';
    default:
      return 'check_circle';
  }
}

function translateService(key) {
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
