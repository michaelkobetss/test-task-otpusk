//toursThunks.js

import { createAsyncThunk } from "@reduxjs/toolkit";
import {
    setActiveToken,
    setWaitUntil,
    clearWait,
    setInfo,
    decrementEmptyRetry,
    setHotelsCache,
} from "./toursSlice";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


const waitUntilWithAbortCheck = async (ts, { dispatch, getState, requestId }) => {
    const now = Date.now();
    if (ts <= now) return;
    dispatch(setWaitUntil(ts));
    while (Date.now() < ts) {
        // якщо запит вже не актуальний — кинемо ABORT
        if (getState().tours.currentRequestId !== requestId) {
            throw new Error("ABORTED");
        }
        // чекати по 1с
        await sleep(1000);
    }
    // коли час настав — прибираємо локальний wait
    dispatch(clearWait());
};

export const cancelActiveSearch = createAsyncThunk(
    "tours/cancelActiveSearch",
    async (_, { getState }) => {
        const { activeToken } = getState().tours;
        if (activeToken && typeof stopSearchPrices === "function") {
            try {
                await stopSearchPrices(activeToken);
            } catch {
                // ігноруємо помилки при скасуванні
            }
        }
        return true;
    }
);

/**
 * fetchTours(countryID)
 * - перевіряє кеш турів (toursCache) і повертає кешовані результати    що є
 * - кешує hotels (hotelsCache) щоб уникнути повторних getHotels вик
 * - зберігає результати в toursCache
 */
export const fetchTours = createAsyncThunk(
    "tours/fetchTours",
    async (countryID, { dispatch, getState, requestId, rejectWithValue }) => {
        const state = getState().tours;

        // 🔹 0) Якщо є кеш для цієї країни і він не пустий — одразу повертаємо
        if (state.cache?.[countryID] && state.cache[countryID].length > 0) {
            return state.cache[countryID];
        }

        // 🔹 1) якщо для цієї країни вже є emptyRetries і вони 0 — блокуємо
        const map = state.emptyRetriesByCountry || {};
        const curRetries = map[countryID];
        if (typeof curRetries === "number") {
            if (curRetries <= 0) {
                return rejectWithValue("Нічого не знайдено");
            }
            // споживаємо 1 спробу (користувач натиснув "Знайти")
            dispatch(decrementEmptyRetry(countryID));
        }

        // 🔹 2) перевірка localStorage pre-wait
        const saved = localStorage.getItem(`waitUntil_${countryID}`);
        if (saved) {
            const ts = Number(saved);
            if (!Number.isNaN(ts) && ts > Date.now()) {
                await waitUntilWithAbortCheck(ts, { dispatch, getState, requestId });
            }
        }

        // 🔹 3) старт пошуку
        let startResp;
        try {
            startResp = await startSearchPrices(countryID);
        } catch (e) {
            try {
                const parsed = await e.json();
                return rejectWithValue(parsed?.message || "Помилка старту пошуку");
            } catch {
                return rejectWithValue("Помилка старту пошуку");
            }
        }

        const { token, waitUntil } = await startResp.json();
        dispatch(setActiveToken(token));
        const startWaitTs = new Date(waitUntil).getTime();
        localStorage.setItem(`waitUntil_${countryID}`, startWaitTs);

        // 🔹 4) очікуємо дозволений час
        await waitUntilWithAbortCheck(startWaitTs, { dispatch, getState, requestId });

        // 🔹 5) пулінг результатів
        let netAttemptsLeft = 2;
        while (true) {
            if (getState().tours.currentRequestId !== requestId) {
                throw new Error("ABORTED");
            }
            try {
                const resp = await getSearchPrices(token);
                const data = await resp.json();

                if (data?.prices) {
                    // отримуємо готелі
                    let hotelsObj = {};
                    try {
                        const hResp = await getHotels(countryID);
                        hotelsObj = await hResp.json();
                    } catch {
                        hotelsObj = {};
                    }
                    const hotels = Object.values(hotelsObj || {});
                    const results = Object.values(data.prices).map((p) => {
                        const h = hotels.find((x) => String(x.id) === String(p.hotelID));
                        return {
                            id: p.id,
                            amount: p.amount,
                            currency: (p.currency || "").toUpperCase(),
                            startDate: p.startDate,
                            endDate: p.endDate,
                            hotelID: p.hotelID,
                            hotelName: h?.name || "Невідомий готель",
                            img: h?.img || "",
                        };
                    });

                    // 🔹 ⚠️ Не кешуємо пусті результати
                    if (results.length > 0) {
                        return results;
                    } else {
                        return [];
                    }
                }

                if (data?.status === "IN_PROGRESS" && data?.waitUntil) {
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
                        return rejectWithValue(payload?.message || "Помилка отримання результатів");
                    } catch {}
                }

                if (netAttemptsLeft > 0) {
                    const left = netAttemptsLeft;
                    dispatch(
                        setInfo(`Помилка мережі. Залишилось ${left} ${left === 1 ? "спроба" : "спроби"}.`)
                    );
                    netAttemptsLeft -= 1;
                    await sleep(2000);
                    continue;
                }
                return rejectWithValue("Кількість спроб вичерпана. Не вдалося отримати результати.");
            }
        }
    }
);

