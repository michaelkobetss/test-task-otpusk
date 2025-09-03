// components/SearchForm/HotelsList.jsx
import HotelCard from '../HotelCard/HotelCard.jsx';
import styles from './SearchForm.module.sass';

const HotelsList = ({ hotelResults }) => (
  <ul className={styles.resultsList}>
    {hotelResults.map(({ hotel, price }) => (
      <li key={hotel.id} className={styles.resultItem}>
        <HotelCard hotel={hotel} price={price} />
      </li>
    ))}
  </ul>
);

export default HotelsList;
