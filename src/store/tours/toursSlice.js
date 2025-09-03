import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedItem: null,
  searchType: null,

  results: [],
  searchResults: {},
  hotelsCache: {},

  resultsCache: {}, // ✅ кеш для результатів пошуку (type + id)

  isLoading: false,
  isWaiting: false,
  error: null,

  token: null,
  waitUntil: null,
  retriesLeft: 2,
  info: null,
  remainingSeconds: 0,
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

    // --- для пошуку турів
    startLoading: (state) => {
      state.isLoading = true;
      state.error = null;
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
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isWaiting = false;
    },

    setRetriesLeft: (state, action) => {
      state.retriesLeft = action.payload;
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

    // --- статус бар
    setInfo: (state, action) => {
      state.info = action.payload;
    },
    setRemainingSeconds: (state, action) => {
      state.remainingSeconds = action.payload;
    },
    clearInfo: (state) => {
      state.info = null;
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
  setRetriesLeft,
  setHotelsCache,
  setResultsCache,
  setInfo,
  setRemainingSeconds,
  clearInfo,
} = toursSlice.actions;

export default toursSlice.reducer;
