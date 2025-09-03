import { createAsyncThunk } from '@reduxjs/toolkit';
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
} from './toursSlice';

// ⚠️ ці функції мають бути імпортовані з API
// import { startSearchPrices, getSearchPrices, getHotels } from '@/api';

export const fetchTours = createAsyncThunk(
  'tours/fetchTours',
  async ({ id, type }, { dispatch, getState }) => {
    try {
      const key = `${type}_${id}`;
      const state = getState().tours;

      // --- Перевірка кешу
      if (state.resultsCache[key]) {
        dispatch(setResults(state.resultsCache[key]));
        return;
      }

      dispatch(startLoading());
      let retries = 2;
      dispatch(setRetriesLeft(retries));

      const response = await startSearchPrices(id);
      let { token, waitUntil } = await response.json(); // 🔹 let

      dispatch(setToken(token));
      dispatch(setWaiting(new Date(waitUntil).getTime()));

      let results = null;

      while (!results && retries >= 0) {
        const now = Date.now();
        if (waitUntil && now < new Date(waitUntil).getTime()) {
          await new Promise((res) => setTimeout(res, new Date(waitUntil).getTime() - now));
        }

        try {
          const resp = await getSearchPrices(token);

          if (resp.status === 200) {
            const data = await resp.json();
            results = Object.values(data.prices || {});

            // --- ДОКАЧИВАЕМ ОТЕЛИ ---
            const state = getState().tours;
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
              };
            });

            // --- Зберігаємо в кеш
            dispatch(setResultsCache({ type, id, results: enriched }));
            dispatch(setResults(enriched));
            dispatch(clearWaiting());
            return;
          } else if (resp.status === 425) {
            const { waitUntil: newWait } = await resp.json();

            // 🔹 оновлюємо waitUntil
            waitUntil = newWait;

            dispatch(setWaiting(new Date(newWait).getTime()));
            continue;
          } else {
            throw new Error(`Помилка: статус ${resp.status}`);
          }
        } catch (err) {
          retries -= 1;
          dispatch(setRetriesLeft(retries));
          if (retries < 0) {
            dispatch(setError(err.message));
            dispatch(stopLoading());
            return;
          }
        }
      }
    } catch (err) {
      dispatch(setError(err.message));
      dispatch(stopLoading());
    }
  }
);
