import { configureStore } from '@reduxjs/toolkit';
import toursReducer from './tours/toursSlice';

const store = configureStore({
  reducer: {
    tours: toursReducer,
  },
  // Убедитесь, что middleware включено
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // (опционально) отключаем проверки сериализуемости
    }),
});

export default store;
