// src/components/HotelCard/HotelCard.jsx
import React from 'react';
import {
  CalendarMonth,
  Check,
  LocalLaundryService,
  LocalParking,
  LocationOn,
  Pool,
  Public,
  Restaurant,
  SportsTennis,
  Wifi,
} from '@mui/icons-material';
import styles from './HotelCard.module.sass';

const SERVICE_LABELS = {
  wifi: 'Wi-Fi',
  aquapark: 'Басейн',
  tennis_court: 'Теніс',
  laundry: 'Пральня',
  parking: 'Паркінг',
  food: 'Харчування',
};

const SERVICE_ICONS = {
  wifi: Wifi,
  aquapark: Pool,
  tennis_court: SportsTennis,
  laundry: LocalLaundryService,
  parking: LocalParking,
  food: Restaurant,
};

export default function HotelCard({ hotel, price }) {
  if (!hotel) return null;

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString('uk-UA', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';

  const formatMoney = (amount, currency) =>
    `${Number(amount).toLocaleString('uk-UA')} ${(currency || '').toUpperCase()}`;

  const renderServices = (servicesObj) => {
    if (!servicesObj || typeof servicesObj !== 'object') {
      return <div className={styles.noServices}>Зручності відсутні</div>;
    }
    const entries = Object.entries(servicesObj).filter(([, v]) => v && v !== 'none');
    if (entries.length === 0) {
      return <div className={styles.noServices}>Зручності відсутні</div>;
    }
    return entries.map(([key]) => {
      const Icon = SERVICE_ICONS[key] || Check;
      return (
        <span key={key} className={styles.badge}>
          <Icon fontSize="small" />
          {SERVICE_LABELS[key] || key}
        </span>
      );
    });
  };

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>{hotel.name}</h1>
        <div className={styles.location}>
          <span className={styles.locItem}>
            <Public fontSize="small" /> {hotel.countryName}
          </span>
          <span className={styles.locItem}>
            <LocationOn fontSize="small" /> {hotel.cityName}
          </span>
        </div>
      </div>

      <div className={styles.media}>
        {hotel.img ? (
          <img src={hotel.img} alt={hotel.name} />
        ) : (
          <div className={styles.noImage}>No image</div>
        )}
      </div>

      {hotel.description && (
        <div className={styles.section}>
          <div className={styles.h3}>Опис</div>
          <p className={styles.text}>{hotel.description}</p>
        </div>
      )}

      {hotel.services && (
        <div className={styles.section}>
          <div className={styles.h3}>Сервіси</div>
          <div className={styles.badges}>{renderServices(hotel.services)}</div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.h3}>Дата</div>
        <div className={styles.row}>
          <CalendarMonth fontSize="small" />
          <span>
            {formatDate(price.startDate)}
            {price.endDate ? ` — ${formatDate(price.endDate)}` : ''}
          </span>
        </div>
        <div className={styles.priceLine}>
          <div className={styles.total}>{formatMoney(price.amount, price.currency)}</div>
        </div>
      </div>
    </article>
  );
}
