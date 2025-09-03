// components/SearchForm/ToursList.jsx
import { Link } from 'react-router-dom';
import styles from './SearchForm.module.sass';

const ToursList = ({ results }) => (
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
          З {new Date(tour.startDate).toLocaleDateString('uk-UA')} до{' '}
          {new Date(tour.endDate).toLocaleDateString('uk-UA')}
        </p>
        <p className={styles.price}>
          {tour.amount.toLocaleString('uk-UA')} {tour.currency}
        </p>

        <Link
          to={`/price/${tour.id}`}
          state={{ hotelId: tour.hotelID }} // 👈 передаємо додатково hotelId
          className={styles.linkButton}
        >
          Відкрити ціну
        </Link>
      </li>
    ))}
  </ul>
);

export default ToursList;
