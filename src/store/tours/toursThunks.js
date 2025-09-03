// src/store/tours/fetchTours.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { clearToken } from './toursSlice'; // Импортируем новый экшен

import {
  startLoading,
  stopLoading,
  setWaiting,
  clearWaiting,
  setToken,
  setResults,
  setError,
  setRetriesLeft,
  setHotelsCache,
  setResultsCache,
  incrementCountryAttempt,
  setInfo,
} from './toursSlice';

export const fetchTours = createAsyncThunk(
  'tours/fetchTours',
  async ({ id, type }, { dispatch, getState }) => {
    try {
      const key = `${type}_${id}`;
      const state = getState().tours;

      // --- Ліміт спроб на країну
      dispatch(incrementCountryAttempt(id));
      const attempts = state.countryAttempts[id] || 0;
      if (attempts > 10) {
        dispatch(setError('Вичерпано кількість спроб для цієї країни'));
        return;
      }

      // --- Перевірка кешу
      if (state.resultsCache[key]) {
        dispatch(setResults(state.resultsCache[key]));
        return;
      }

      dispatch(startLoading());
      let retries = 2;
      dispatch(setRetriesLeft(retries));

      const response = await startSearchPrices(id);
      const { token, waitUntil } = await response.json();

      dispatch(setToken(token));
      dispatch(setWaiting(new Date(waitUntil).getTime()));

      let results = null;

      const now = Date.now();
      if (waitUntil && now < new Date(waitUntil).getTime()) {
        await new Promise((res) => setTimeout(res, new Date(waitUntil).getTime() - now));
      }

      try {
        const resp = await getSearchPrices(token);

        if (resp.status === 200) {
          const data = await resp.json();
          results = Object.values(data.prices || {});

          // --- если пришёл пустой результат → ретраи -1
          if (!results || results.length === 0) {
            retries -= 1;
            dispatch(setRetriesLeft(retries));
          }

          // --- ДОКАЧУЄМО ГОТЕЛІ ---
          let hotels = state.hotelsCache[id];
          if (!hotels) {
            const hotelsResp = await getHotels(id);
            hotels = await hotelsResp.json();
            dispatch(setHotelsCache({ countryId: id, hotels }));
          }

          const enriched = results.map((tour) => {
            const hotel = hotels[tour.hotelID];
            return {
              ...tour,
              hotelName: hotel?.name || '—',
              img: hotel?.img || null,
              city: hotel?.cityName || '',
              country: hotel?.countryName || '',

              // 🔥 додаємо відсутні поля
              description: hotel?.description || null,
              services: hotel?.services || {}, // wifi, pool, parking тощо
              stars: hotel?.stars || null,
              address: hotel?.address || null,
            };
          });

          dispatch(setResultsCache({ type, id, results: enriched }));
          dispatch(setResults(enriched));
          dispatch(clearWaiting());
        } else if (resp.status === 425) {
          const { waitUntil: newWait } = await resp.json();
          dispatch(setWaiting(new Date(newWait).getTime()));
        } else {
          throw new Error(`Помилка: статус ${resp.status}`);
        }
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      dispatch(setError(err.message));
      dispatch(stopLoading());
    }
  }
);
export const removeActiveToken = () => async (dispatch, getState) => {
  const activeToken = getState().tours.token;

  if (!activeToken) return;

  try {
    await stopSearchPrices(activeToken); // предположительно асинхронная функция
  } catch (err) {
    console.error('Ошибка при остановке поиска цен:', err);
  }

  dispatch(clearToken()); // Убираем токен из состояния
};
