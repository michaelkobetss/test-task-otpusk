// src/components/TourPage/TourPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
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

import styles from './TourPage.module.sass';

// --- helpers ----------------------------------------------------
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

// ----------------------------------------------------------------

export default function TourPage() {
  const { priceId } = useParams();
  const [searchParams] = useSearchParams();
  const queryHotelId = searchParams.get('hotelId');

  const { results, toursCache } = useSelector((s) => s.tours || {});

  const [price, setPrice] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resolveHotelIdFromStore = () => {
    if (Array.isArray(results)) {
      const found = results.find((r) => String(r.id) === String(priceId));
      if (found) return found.hotelID || found.hotelId || found.hotel_id || null;
    }
    if (toursCache && typeof toursCache === 'object') {
      for (const arr of Object.values(toursCache)) {
        if (!Array.isArray(arr)) continue;
        const found = arr.find((r) => String(r.id) === String(priceId));
        if (found) return found.hotelID || found.hotelId || found.hotel_id || null;
      }
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      setPrice(null);
      setHotel(null);

      try {
        if (!priceId) {
          setError('Відсутній priceId у URL.');
          return;
        }

        const pResp = await getPrice(priceId);
        const pJson = pResp?.json ? await pResp.json() : pResp;
        if (!mounted) return;
        setPrice(pJson);

        let hotelId =
          queryHotelId ||
          resolveHotelIdFromStore() ||
          pJson?.hotelID ||
          pJson?.hotelId ||
          pJson?.hotel_id;

        if (!hotelId) {
          setError(
            'Не вдалося визначити hotelId. Відкривайте сторінку з кнопки списку турів (посилання має містити hotelId).'
          );
          return;
        }

        const hResp = await getHotel(Number(hotelId));
        const hJson = hResp?.json ? await hResp.json() : hResp;
        if (!mounted) return;

        setHotel(hJson);
      } catch (e) {
        console.error(e);
        try {
          if (e instanceof Response) {
            const payload = await e.json();
            setError(payload?.message || 'Не вдалося завантажити дані.');
          } else {
            setError(e?.message || String(e));
          }
        } catch {
          setError('Не вдалося завантажити дані.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [priceId, queryHotelId, results, toursCache]);

  const renderServices = (servicesObj) => {
    if (!servicesObj || typeof servicesObj !== 'object') return null;
    const entries = Object.entries(servicesObj).filter(([, v]) => v && v !== 'none');
    if (entries.length === 0) return <div className={styles.noServices}>Зручності відсутні</div>;

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

  if (loading)
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>Завантаження…</div>
      </div>
    );

  if (error)
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h3>Помилка</h3>
          <p>{error}</p>
          <Link to="/task2-3" className={styles.linkInline}>
            ← Повернутися до пошуку
          </Link>
        </div>
      </div>
    );

  if (!price || !hotel)
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <p>Дані не знайдено</p>
          <Link to="/task2-3" className={styles.linkInline}>
            ← Повернутися до пошуку
          </Link>
        </div>
      </div>
    );

  const country = hotel.countryName || hotel.country || 'Країна';
  const city = hotel.cityName || hotel.city || 'Місто';

  return (
    <div className={styles.wrap}>
      <article className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{hotel.name}</h1>

          <div className={styles.location}>
            <span className={styles.locItem}>
              <Public fontSize="small" /> {country}
            </span>
            <span className={styles.locItem}>
              <LocationOn fontSize="small" /> {city}
            </span>
          </div>
        </div>

        <div className={styles.media}>
          {hotel.img ? (
            <img src={hotel.img} alt={hotel.name || 'Hotel'} />
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
            <button type="button" className={styles.cta}>
              Відкрити ціну
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <Link to="/task2-3" className={styles.backLink}>
            ← Повернутися до пошуку
          </Link>
        </div>
      </article>
    </div>
  );
}
