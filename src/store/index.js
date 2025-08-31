//index.js
import { configureStore } from '@reduxjs/toolkit';
import toursReducer from './tours/toursSlice';

const store = configureStore({
  reducer: {
    tours: toursReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
