// src/components/PricePage/PricePage.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
// import { fetchTours } from '@store/tours/toursThunks.js';

const PricePage = () => {
  const { priceId } = useParams();
  const dispatch = useDispatch();

  // Извлечение данных из Redux стейта
  const price = useSelector((state) => state.tours.results.find((tour) => tour.id === priceId));
  const hotel = useSelector((state) => (price ? state.tours.hotelsCache[price.hotelID] : null));
  const loading = useSelector((state) => state.tours.isLoading);
  const error = useSelector((state) => state.tours.error);

  useEffect(() => {
    if (!price) {
      // Предполагается, что у вас есть countryID для поиска туров
      // Возможно, вам нужно получить его из другого источника или параметра маршрута
      // const countryID = '43'; // Замените на нужный способ получения countryID
      // dispatch(fetchTours(countryID));
    }
  }, [price, dispatch]);

  if (loading) return <p>Завантаження...</p>;
  if (error) return <p>Помилка: {error}</p>;
  if (!price || !hotel) return <p>Тур не знайдено</p>;

  return (
    <div className="tour-page">
      <h2>{hotel.name}</h2>
      <p>{hotel.description}</p>
      <ul>
        {hotel.services.map((service, index) => (
          <li key={index}>{service}</li>
        ))}
      </ul>
      <p>
        Ціна: {price.amount} {price.currency.toUpperCase()}
      </p>
      <p>
        Дати: {price.startDate} – {price.endDate}
      </p>
    </div>
  );
};

export default PricePage;
