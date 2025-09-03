// toursThunks.js

import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setActiveToken,
  setWaitUntil,
  clearWait,
  setInfo,
  decrementEmptyRetry,
  setHotelsCache,
} from './toursSlice';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const waitUntilWithAbortCheck = async (ts, { dispatch, getState, requestId }) => {
  const now = Date.now();
  if (ts <= now) return;
  dispatch(setWaitUntil(ts));
  while (Date.now() < ts) {
    if (getState().tours.currentRequestId !== requestId) {
      throw new Error('ABORTED');
    }
    await sleep(1000);
  }
  dispatch(clearWait());
};

export const cancelActiveSearch = createAsyncThunk(
  'tours/cancelActiveSearch',
  async (_, { getState }) => {
    const { activeToken } = getState().tours;
    if (activeToken && typeof stopSearchPrices === 'function') {
      try {
        await stopSearchPrices(activeToken);
      } catch {
        // игнорируем ошибки при отмене
      }
    }
    return true;
  }
);

export const fetchTours = createAsyncThunk(
  'tours/fetchTours',
  async (countryID, { dispatch, getState, requestId, rejectWithValue }) => {
    const state = getState().tours;

    // 🔹 0) Проверка кеша туров
    if (state.toursCache?.[countryID] && state.toursCache[countryID].length > 0) {
      return state.toursCache[countryID];
    }

    // 🔹 1) Проверка лимита пустых попыток
    const map = state.emptyRetriesByCountry || {};
    const curRetries = map[countryID];
    if (typeof curRetries === 'number') {
      if (curRetries <= 0) {
        return rejectWithValue('Нічого не знайдено');
      }
      dispatch(decrementEmptyRetry(countryID));
    }

    // 🔹 2) Проверка localStorage (ожидание)
    const saved = localStorage.getItem(`waitUntil_${countryID}`);
    if (saved) {
      const ts = Number(saved);
      if (!Number.isNaN(ts) && ts > Date.now()) {
        await waitUntilWithAbortCheck(ts, { dispatch, getState, requestId });
      }
    }

    // 🔹 3) Старт поиска
    let startResp;
    try {
      startResp = await startSearchPrices(countryID);
    } catch (e) {
      try {
        const parsed = await e.json();
        return rejectWithValue(parsed?.message || 'Помилка старту пошуку');
      } catch {
        return rejectWithValue('Помилка старту пошуку');
      }
    }

    const { token, waitUntil } = await startResp.json();
    dispatch(setActiveToken(token));
    const startWaitTs = new Date(waitUntil).getTime();
    localStorage.setItem(`waitUntil_${countryID}`, startWaitTs);

    // 🔹 4) Ждем
    await waitUntilWithAbortCheck(startWaitTs, { dispatch, getState, requestId });

    // 🔹 5) Пуллинг
    let netAttemptsLeft = 2;
    while (true) {
      if (getState().tours.currentRequestId !== requestId) {
        throw new Error('ABORTED');
      }
      try {
        const resp = await getSearchPrices(token);
        const data = await resp.json();

        if (data?.prices) {
          // 🔹 Кэширование отелей
          let hotelsObj;
          if (state.hotelsCache?.[countryID]) {
            hotelsObj = state.hotelsCache[countryID];
          } else {
            try {
              const hResp = await getHotels(countryID);
              hotelsObj = await hResp.json();
              dispatch(setHotelsCache({ countryID, hotels: hotelsObj }));
            } catch {
              hotelsObj = {};
            }
          }

          const hotels = Object.values(hotelsObj || {});
          const results = Object.values(data.prices).map((p) => {
            const h = hotels.find((x) => String(x.id) === String(p.hotelID));
            return {
              id: p.id,
              amount: p.amount,
              currency: (p.currency || '').toUpperCase(),
              startDate: p.startDate,
              endDate: p.endDate,
              hotelID: p.hotelID,
              hotelName: h?.name || 'Невідомий готель',
              img: h?.img || '',
            };
          });

          if (results.length > 0) {
            return results;
          } else {
            return [];
          }
        }

        if (data?.status === 'IN_PROGRESS' && data?.waitUntil) {
          const ts = new Date(data.waitUntil).getTime();
          await waitUntilWithAbortCheck(ts, { dispatch, getState, requestId });
          continue;
        }

        return [];
      } catch (err) {
        if (err instanceof Response) {
          try {
            const payload = await err.json();
            if (payload?.code === 425 && payload?.waitUntil) {
              const ts = new Date(payload.waitUntil).getTime();
              await waitUntilWithAbortCheck(ts, { dispatch, getState, requestId });
              continue;
            }
            return rejectWithValue(payload?.message || 'Помилка отримання результатів');
          } catch {}
        }

        if (netAttemptsLeft > 0) {
          const left = netAttemptsLeft;
          dispatch(
            setInfo(`Помилка мережі. Залишилось ${left} ${left === 1 ? 'спроба' : 'спроби'}.`)
          );
          netAttemptsLeft -= 1;
          await sleep(2000);
          continue;
        }
        return rejectWithValue('Кількість спроб вичерпана. Не вдалося отримати результати.');
      }
    }
  }
);
// Исходя из файла api.js предполагается, что глобально доступен экземпляр базы данных,
// например: window.db = new DB();

export const fetchToursByCity = createAsyncThunk(
  'tours/fetchToursByCity',
  async (cityID, { rejectWithValue }) => {
    try {
      // Получаем все отели из мока
      if (typeof window.db === 'undefined') {
        throw new Error('Нет доступа к данным');
      }
      const hotelsObj = window.db.getHotels();
      // Фильтруем отели по ID города
      const tours = Object.values(hotelsObj).filter(
        (hotel) => Number(hotel.cityId) === Number(cityID)
      );
      return tours;
    } catch (e) {
      return rejectWithValue('Не удалось загрузить туры для города.');
    }
  }
);

export const fetchHotelDetails = createAsyncThunk(
  'tours/fetchHotelDetails',
  async (hotelID, { rejectWithValue }) => {
    try {
      // Получаем детальную информацию об отеле из мока
      if (typeof window.db === 'undefined') {
        throw new Error('Нет доступа к данным');
      }
      const hotel = window.db.getHotel(Number(hotelID));
      return hotel;
    } catch (e) {
      return rejectWithValue('Не удалось загрузить информацию об отеле.');
    }
  }
);
