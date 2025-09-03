import { createSlice } from '@reduxjs/toolkit';

const getSecondsPhrase = (s) => {
  const n = Math.abs(s);
  const d = n % 10;
  const ex = n % 100;
  if (ex >= 11 && ex <= 19) return `${n} секунд`;
  if (d === 1) return `${n} секунду`;
  if (d >= 2 && d <= 4) return `${n} секунди`;
  return `${n} секунд`;
};

const initialState = {
  results: [],
  toursCache: {},
  hotelsCache: {},
  selectedCity: null,
  selectedHotel: null,

  isLoading: false,
  error: null,
  info: null,

  countryID: '43',

  isWaiting: false,
  waitUntil: null,
  remainingSeconds: null,

  currentRequestId: null,
  activeToken: null,

  emptyRetriesByCountry: {},
  hasSearched: false,
};

const setInfoMessage = (state, text) => {
  state.info = text;
  state.error = null;
};

const toursSlice = createSlice({
  name: 'tours',
  initialState,
  reducers: {
    setCountryID(state, action) {
      state.countryID = action.payload;
      state.results = [];
      state.error = null;
      state.info = null;
      state.isWaiting = false;
      state.waitUntil = null;
      state.remainingSeconds = null;
      state.currentRequestId = null;
    },
    setSelectedCity(state, action) {
      state.selectedCity = action.payload;
      state.selectedHotel = null; // Сброс отеля, если выбран новый город
      state.results = []; // Можно сбросить результаты
    },

    // Добавляем обработку выбора отеля
    setSelectedHotel(state, action) {
      state.selectedHotel = action.payload;
      state.selectedCity = null; // Сброс города, если выбран отель
      state.results = []; // Можно сбросить результаты
    },

    // встановлюємо час очікування
    setWaitUntil(state, action) {
      const ts = action.payload;
      state.isWaiting = true;
      state.waitUntil = ts;
      const diff = Math.max(Math.ceil((ts - Date.now()) / 1000), 0);
      state.remainingSeconds = diff;
      setInfoMessage(state, `Зачекайте ${getSecondsPhrase(diff)} перед новим запитом`);
    },

    // тікає раз на секунду
    tickRemaining(state) {
      if (!state.isWaiting || state.remainingSeconds == null) return;
      if (state.remainingSeconds > 1) {
        state.remainingSeconds -= 1;
        setInfoMessage(
          state,
          `Зачекайте ${getSecondsPhrase(state.remainingSeconds)} перед новим запитом`
        );
      } else {
        state.remainingSeconds = 0;
        state.isWaiting = false;
        state.waitUntil = null;
        state.info = null; // прибираємо повідомлення
      }
    },

    clearWait(state) {
      state.isWaiting = false;
      state.waitUntil = null;
      state.remainingSeconds = null;
      state.info = null;
    },

    setActiveToken(state, action) {
      state.activeToken = action.payload;
    },

    setInfo(state, action) {
      setInfoMessage(state, action.payload);
    },

    clearInfo(state) {
      state.info = null;
    },

    setEmptyRetriesForCountry(state, action) {
      const { countryID, value } = action.payload;
      state.emptyRetriesByCountry = {
        ...state.emptyRetriesByCountry,
        [countryID]: value,
      };
      if (value > 0) {
        setInfoMessage(
          state,
          `За цими критеріями турів не знайдено. Можна оновити ще ${value} ${value === 1 ? 'раз' : 'рази'}.`
        );
      } else {
        setInfoMessage(state, `Нічого не знайдено.`);
      }
    },

    decrementEmptyRetry(state, action) {
      const countryID = action.payload;
      const cur = state.emptyRetriesByCountry?.[countryID];
      if (typeof cur === 'number') {
        const next = Math.max(cur - 1, 0);
        state.emptyRetriesByCountry = { ...state.emptyRetriesByCountry, [countryID]: next };
        if (next > 0) {
          setInfoMessage(
            state,
            `Спроба оновлення. Залишилось ${next} ${next === 1 ? 'раз' : 'рази'}.`
          );
        } else {
          setInfoMessage(state, `Нічого не знайдено.`);
        }
      }
    },

    clearEmptyRetriesForCountry(state, action) {
      const cid = action.payload;
      if (state.emptyRetriesByCountry?.[cid] !== undefined) {
        const copy = { ...state.emptyRetriesByCountry };
        delete copy[cid];
        state.emptyRetriesByCountry = copy;
      }
    },

    setHotelsCache(state, action) {
      const { countryID, hotels } = action.payload;
      state.hotelsCache = { ...state.hotelsCache, [countryID]: hotels };
    },

    clearToursCache(state) {
      state.toursCache = {};
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase('tours/fetchTours/pending', (state, action) => {
        state.currentRequestId = action.meta.requestId;
        state.isLoading = true;
        state.error = null;
        setInfoMessage(state, 'Пошук турів...');
      })

      .addCase('tours/fetchTours/fulfilled', (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          state.currentRequestId = null;
          return;
        }
        state.isLoading = false;
        state.currentRequestId = null;
        state.error = null;
        state.info = null;
        state.isWaiting = false;
        state.waitUntil = null;
        state.remainingSeconds = null;

        const countryID = action.meta.arg;
        const payload = action.payload || [];

        state.results = payload;
        state.hasSearched = true;

        if (payload.length > 0) {
          state.toursCache = { ...state.toursCache, [countryID]: payload };
          setInfoMessage(state, `Знайдено ${payload.length} турів`);
          if (state.emptyRetriesByCountry?.[countryID] !== undefined) {
            const copy = { ...state.emptyRetriesByCountry };
            delete copy[countryID];
            state.emptyRetriesByCountry = copy;
          }
        } else {
          if (state.emptyRetriesByCountry?.[countryID] === undefined) {
            state.emptyRetriesByCountry = { ...state.emptyRetriesByCountry, [countryID]: 2 };
            setInfoMessage(state, 'За цими критеріями турів не знайдено. Можна оновити ще 2 рази.');
          } else {
            const cur = state.emptyRetriesByCountry[countryID];
            setInfoMessage(
              state,
              cur > 0
                ? `За цими критеріями турів не знайдено. Залишилось ${cur} ${cur === 1 ? 'спроба' : 'спроби'}.`
                : `Нічого не знайдено.`
            );
          }
        }
      })

      .addCase('tours/fetchTours/rejected', (state, action) => {
        if (action.error?.message === 'ABORTED') {
          state.currentRequestId = null;
          return;
        }
        state.isLoading = false;
        state.currentRequestId = null;
        state.isWaiting = false;
        state.waitUntil = null;
        state.remainingSeconds = null;
        state.error = action.payload || action.error?.message || 'Не вдалося отримати результати.';
        state.info = null; // прибираємо інфо при помилці
      })

      .addCase('tours/cancelActiveSearch/fulfilled', (state) => {
        state.activeToken = null;
        state.isWaiting = false;
        state.waitUntil = null;
        state.remainingSeconds = null;
        state.isLoading = false;
        state.info = null;
        state.currentRequestId = null;
      });
  },
});

export const {
  setCountryID,
  setWaitUntil,
  tickRemaining,
  clearWait,
  setActiveToken,
  setInfo,
  clearInfo,
  setEmptyRetriesForCountry,
  decrementEmptyRetry,
  clearEmptyRetriesForCountry,
  setHotelsCache,
  clearToursCache,
} = toursSlice.actions;

export default toursSlice.reducer;
