import { configureStore } from '@reduxjs/toolkit';
import toursReducer from './tours/toursSlice';

const store = configureStore({
  reducer: {
    tours: toursReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
