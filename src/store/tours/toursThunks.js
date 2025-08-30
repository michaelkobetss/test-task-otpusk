import { createAsyncThunk } from "@reduxjs/toolkit";
import {
    setActiveToken,
    setWaitUntil,
    clearWait,
    setInfo,
    decrementEmptyRetry,
} from "./toursSlice";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Чекаємо до ts — але не тикаємо UI-лічильник (компонент робить tickRemaining щосекунди).
 * Тільки встановлюємо початковий waitUntil.
 */
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
        // не диспатчимо tick тут — UI робить це сам
        await sleep(1000);
    }
    // коли час настав — прибираємо локальний wait; thunk продовжить виконання
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
 * - підтримує локальний pre-wait (localStorage waitUntil_{countryID})
 * - якщо для поточної країни є встановлені emptyRetries і вони <=0 — блокує
 * - якщо emptyRetries >0 — зменшує (споживає) одну спробу перед стартом
 * - виконує startSearchPrices → чекати waitUntil → getSearchPrices (пулінг / retry)
 */
export const fetchTours = createAsyncThunk(
    "tours/fetchTours",
    async (countryID, { dispatch, getState, requestId, rejectWithValue }) => {
        // 0) якщо для цієї країни вже є emptyRetries і вони 0 — блокуємо
        const map = getState().tours.emptyRetriesByCountry || {};
        const curRetries = map[countryID];
        if (typeof curRetries === "number") {
            if (curRetries <= 0) {
                return rejectWithValue("Нічого не знайдено");
            }
            // споживаємо 1 спробу (користувач натиснув "Знайти")
            dispatch(decrementEmptyRetry(countryID));
        }

        // 1) перевірка localStorage pre-wait
        const saved = localStorage.getItem(`waitUntil_${countryID}`);
        if (saved) {
            const ts = Number(saved);
            if (!Number.isNaN(ts) && ts > Date.now()) {
                await waitUntilWithAbortCheck(ts, { dispatch, getState, requestId });
            }
        }

        // 2) старт пошуку
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

        // 3) очікуємо дозволений час (thunk чекає, UI тикатиме лічильник)
        await waitUntilWithAbortCheck(startWaitTs, { dispatch, getState, requestId });

        // 4) пулінг результатів з retry на мережеві/невідомі помилки (2 спроби)
        let netAttemptsLeft = 2;
        while (true) {
            // перевірка на abort (якщо currentRequestId змінився)
            if (getState().tours.currentRequestId !== requestId) {
                throw new Error("ABORTED");
            }

            try {
                const resp = await getSearchPrices(token);
                const data = await resp.json();

                if (data?.prices) {
                    // додатково витягуємо інформацію по готелях
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

                    return results;
                }

                // IN_PROGRESS / 425 style
                if (data?.status === "IN_PROGRESS" && data?.waitUntil) {
                    const ts = new Date(data.waitUntil).getTime();
                    await waitUntilWithAbortCheck(ts, { dispatch, getState, requestId });
                    continue;
                }

                // якщо прийшло щось інше — вважаємо пустим
                return [];
            } catch (err) {
                // Server response with 425 and waitUntil (може кидати Response)
                if (err instanceof Response) {
                    try {
                        const payload = await err.json();
                        if (payload?.code === 425 && payload?.waitUntil) {
                            const ts = new Date(payload.waitUntil).getTime();
                            await waitUntilWithAbortCheck(ts, { dispatch, getState, requestId });
                            continue;
                        }
                        return rejectWithValue(payload?.message || "Помилка отримання результатів");
                    } catch {
                        // якщо не можемо парсити — падаємо в сетеві/невідомі
                    }
                }

                // мережеві/невідомі помилки — retry до 2 разів з повідомленням
                if (netAttemptsLeft > 0) {
                    const left = netAttemptsLeft;
                    dispatch(setInfo(`Помилка мережі. Залишилось ${left} ${left === 1 ? "спроба" : "спроби"}.`));
                    netAttemptsLeft -= 1;
                    await sleep(2000);
                    continue;
                }

                return rejectWithValue("Кількість спроб вичерпана. Не вдалося отримати результати.");
            }
        }
    }
);
