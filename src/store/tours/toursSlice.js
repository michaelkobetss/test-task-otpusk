import { createSlice } from "@reduxjs/toolkit";

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
    cache: {},

    isLoading: false,
    error: null,
    info: null,

    countryID: "43",

    isWaiting: false,
    waitUntil: null,
    remainingSeconds: null,

    currentRequestId: null,
    activeToken: null,

    // мапа countryID -> remaining retries after empty result
    emptyRetriesByCountry: {},
};

const toursSlice = createSlice({
    name: "tours",
    initialState,
    reducers: {
        // зміна країни — очищаємо видимі результати і статуси (щоб не було "старих" результатів)
        setCountryID(state, action) {
            state.countryID = action.payload;
            state.results = [];
            state.error = null;
            state.info = null;

            // зупиняємо UI-таймер/очікування
            state.isWaiting = false;
            state.waitUntil = null;
            state.remainingSeconds = null;

            // скасуємо currentRequestId локально (щоб laufing thunks помітили зміну)
            state.currentRequestId = null;
            // не чіпаємо activeToken тут — cancelActiveSearch відповідає за серверне скасування
        },

        setWaitUntil(state, action) {
            const ts = action.payload;
            state.isWaiting = true;
            state.waitUntil = ts;
            const diff = Math.max(Math.ceil((ts - Date.now()) / 1000), 0);
            state.remainingSeconds = diff;
            state.info = `Зачекайте ${getSecondsPhrase(diff)} перед новим запитом`;
        },

        // лише UI-тик (компонент викликає щосекунди)
        tickRemaining(state) {
            if (!state.isWaiting || state.remainingSeconds == null) return;
            if (state.remainingSeconds > 1) {
                state.remainingSeconds -= 1;
                state.info = `Зачекайте ${getSecondsPhrase(state.remainingSeconds)} перед новим запитом`;
            } else {
                // дійшли до нуля — прибираємо повідомлення чекання (thunk може ще робити запит)
                state.remainingSeconds = 0;
                state.isWaiting = false;
                state.waitUntil = null;
                state.info = null;
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
            state.info = action.payload;
        },

        clearInfo(state) {
            state.info = null;
        },

        // встановити лічильник спроб для країни (наприклад, 2)
        setEmptyRetriesForCountry(state, action) {
            const { countryID, value } = action.payload;
            state.emptyRetriesByCountry = {
                ...state.emptyRetriesByCountry,
                [countryID]: value,
            };
            // показати інфо
            if (value > 0) {
                state.info = `За цими критеріями турів не знайдено. Можна оновити ще ${value} ${value === 1 ? "раз" : "рази"}.`;
            } else {
                state.info = `Нічого не знайдено.`;
            }
        },

        // зменшити лічильник спроб для країни на 1 (коли користувач натиснув "Знайти" після empty)
        decrementEmptyRetry(state, action) {
            const countryID = action.payload;
            const cur = state.emptyRetriesByCountry?.[countryID];
            if (typeof cur === "number") {
                const next = Math.max(cur - 1, 0);
                state.emptyRetriesByCountry = { ...state.emptyRetriesByCountry, [countryID]: next };
                if (next > 0) {
                    state.info = `Спроба оновлення. Залишилось ${next} ${next === 1 ? "раз" : "рази"}.`;
                } else {
                    state.info = `Нічого не знайдено.`;
                }
            }
        },

        // при успішному ненульовому результаті — прибрати лічильник
        clearEmptyRetriesForCountry(state, action) {
            const cid = action.payload;
            if (state.emptyRetriesByCountry?.[cid] !== undefined) {
                const copy = { ...state.emptyRetriesByCountry };
                delete copy[cid];
                state.emptyRetriesByCountry = copy;
            }
        },
    },

    extraReducers: (builder) => {
        builder
        .addCase("tours/fetchTours/pending", (state, action) => {
            state.currentRequestId = action.meta.requestId;
            state.isLoading = true;
            state.error = null;
            // results залишаємо поки не прийде новий
        })

        .addCase("tours/fetchTours/fulfilled", (state, action) => {
            // якщо відповідь застаріла — ігноруємо
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
            state.cache = { ...state.cache, [countryID]: payload };

            if (payload.length === 0) {
                // якщо для цієї країни ще не було лічильника — встановимо 2
                if (state.emptyRetriesByCountry?.[countryID] === undefined) {
                    state.emptyRetriesByCountry = { ...state.emptyRetriesByCountry, [countryID]: 2 };
                    state.info = `За цими критеріями турів не знайдено. Можна оновити ще 2 рази.`;
                } else {
                    // інакше залишаємо існуючий лічильник (він зменшується при submit)
                    const cur = state.emptyRetriesByCountry[countryID];
                    state.info =
                        cur > 0
                            ? `За цими критеріями турів не знайдено. Залишилось ${cur} ${cur === 1 ? "спроба" : "спроби"}.`
                            : `Нічого не знайдено.`;
                }
            } else {
                // успіх — очищуємо лічильник для країни
                if (state.emptyRetriesByCountry?.[countryID] !== undefined) {
                    const copy = { ...state.emptyRetriesByCountry };
                    delete copy[countryID];
                    state.emptyRetriesByCountry = copy;
                }
            }
        })

        .addCase("tours/fetchTours/rejected", (state, action) => {
            // якщо це ABORT — ігноруємо (скасовано через зміну країни)
            if (action.error?.message === "ABORTED") {
                state.currentRequestId = null;
                return;
            }
            state.isLoading = false;
            state.currentRequestId = null;
            state.isWaiting = false;
            state.waitUntil = null;
            state.remainingSeconds = null;

            state.error = action.payload || action.error?.message || "Не вдалося отримати результати.";
        })

        .addCase("tours/cancelActiveSearch/fulfilled", (state) => {
            // скасували активний пошук
            state.activeToken = null;
            state.isWaiting = false;
            state.waitUntil = null;
            state.remainingSeconds = null;
            state.isLoading = false;
            state.info = null;
            // дуже важливо: помітимо, що тепер немає currentRequestId → running thunk побачить це та ABORT
            state.currentRequestId = null;
        });
    },
});

export const {
    setCountryID,
    setWaitUntil,
    tickRemaining: _tickRemaining,
    tickRemaining,
    clearWait,
    setActiveToken,
    setInfo,
    clearInfo,
    setEmptyRetriesForCountry,
    decrementEmptyRetry,
    clearEmptyRetriesForCountry,
} = toursSlice.actions;

export default toursSlice.reducer;
