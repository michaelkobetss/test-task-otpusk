// src/store/tours/toursSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedItem: null,
  searchType: null,

  results: [],
  searchResults: {},
  hotelsCache: {},
  resultsCache: {},

  isLoading: false,
  isWaiting: false,
  error: null,
  info: null,

  token: null,
  waitUntil: null,
  retriesLeft: 2,
  remainingSeconds: 0,

  countryAttempts: {}, // { countryId: count }
};

const toursSlice = createSlice({
  name: 'tours',
  initialState,
  reducers: {
    setSelectedItem: (state, action) => {
      state.selectedItem = action.payload;
      state.searchType = action.payload?.type || null;
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },

    startLoading: (state) => {
      state.isLoading = true;
      state.error = null;
      state.info = null;
      state.results = [];
    },
    stopLoading: (state) => {
      state.isLoading = false;
    },

    setWaiting: (state, action) => {
      state.isWaiting = true;
      state.waitUntil = action.payload;
    },
    clearWaiting: (state) => {
      state.isWaiting = false;
      state.waitUntil = null;
    },

    setToken: (state, action) => {
      state.token = action.payload;
    },

    setResults: (state, action) => {
      state.results = action.payload;
      state.isLoading = false;
      state.isWaiting = false;
      state.error = null;
      state.info = action.payload.length === 0 ? 'За вашим запитом турів не знайдено' : null;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isWaiting = false;
    },

    setInfo: (state, action) => {
      state.info = action.payload;
    },
    clearInfo: (state) => {
      state.info = null;
    },

    setRetriesLeft: (state, action) => {
      state.retriesLeft = action.payload;

      // повідомлення тільки якщо залишилось < 2
      if (action.payload < 2) {
        state.info = `Залишилось спроб: ${action.payload}`;
      }
    },

    // --- кеш готелів
    setHotelsCache: (state, action) => {
      const { countryId, hotels } = action.payload;
      state.hotelsCache[countryId] = hotels;
    },

    // --- кеш результатів
    setResultsCache: (state, action) => {
      const { type, id, results } = action.payload;
      const key = `${type}_${id}`;
      state.resultsCache[key] = results;
    },

    // --- спроби на країну
    incrementCountryAttempt: (state, action) => {
      const countryId = action.payload;
      state.countryAttempts[countryId] = (state.countryAttempts[countryId] || 0) + 1;
    },
  },
});

export const {
  setSelectedItem,
  clearSelectedItem,
  startLoading,
  stopLoading,
  setWaiting,
  clearWaiting,
  setToken,
  setResults,
  setError,
  setInfo,
  clearInfo,
  setRetriesLeft,
  setHotelsCache,
  setResultsCache,
  incrementCountryAttempt,
} = toursSlice.actions;

export default toursSlice.reducer;
