// src/components/TourPage/TourPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "./TourPage.module.sass";

const formatDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
        : "";

const formatMoney = (amount, currency) =>
    `${Number(amount).toLocaleString("uk-UA")} ${(currency || "").toUpperCase()}`;

const SERVICE_LABELS = {
    wifi: "Wi-Fi",
    aquapark: "Аквапарк",
    tennis_court: "Теніс",
    laundry: "Пральня",
    parking: "Паркінг",
};

export default function TourPage() {
    const { priceId } = useParams();
    const [searchParams] = useSearchParams();
    const queryHotelId = searchParams.get("hotelId");

    // пробуем найти hotelId в сторе (fallback)
    const { results, toursCache } = useSelector((s) => s.tours || {});

    const [price, setPrice] = useState(null);
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const resolveHotelIdFromStore = () => {
        if (Array.isArray(results)) {
            const found = results.find((r) => String(r.id) === String(priceId));
            if (found) return found.hotelID || found.hotelId || found.hotel_id || null;
        }
        if (toursCache && typeof toursCache === "object") {
            for (const arr of Object.values(toursCache)) {
                if (!Array.isArray(arr)) continue;
                const found = arr.find((r) => String(r.id) === String(priceId));
                if (found) return found.hotelID || found.hotelId || found.hotel_id || null;
            }
        }
        return null;
    };

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            setLoading(true);
            setError(null);
            setPrice(null);
            setHotel(null);

            try {
                if (!priceId) {
                    setError("Відсутній priceId у URL.");
                    return;
                }

                // getPrice возвращает Response (в api.js) — безопасно парсим
                const pResp = await getPrice(priceId);
                const pJson = pResp?.json ? await pResp.json() : pResp;
                if (!mounted) return;
                setPrice(pJson);

                // определяем hotelId: сначала query param, затем стор, затем поле в самом price (если вдруг)
                let hotelId = queryHotelId || resolveHotelIdFromStore() || pJson?.hotelID || pJson?.hotelId || pJson?.hotel_id;
                if (!hotelId) {
                    setError(
                        "Не вдалося визначити hotelId. Відкривайте сторінку з кнопки списку турів (посилання має містити hotelId)."
                    );
                    return;
                }

                // getHotel тоже возвращает Response — парсим
                const hResp = await getHotel(Number(hotelId));
                const hJson = hResp?.json ? await hResp.json() : hResp;
                if (!mounted) return;

                setHotel(hJson);
            } catch (e) {
                console.error(e);
                try {
                    if (e instanceof Response) {
                        const payload = await e.json();
                        setError(payload?.message || "Не вдалося завантажити дані.");
                    } else {
                        setError(e?.message || String(e));
                    }
                } catch {
                    setError("Не вдалося завантажити дані.");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        run();
        return () => {
            mounted = false;
        };
        // включаем в deps results/toursCache, чтобы fallback мог сработать после загрузки результата в стор
    }, [priceId, queryHotelId, results, toursCache]);

    const renderServices = (servicesObj) => {
        if (!servicesObj || typeof servicesObj !== "object") return null;
        const entries = Object.entries(servicesObj).filter(([, v]) => v && v !== "none");
        if (entries.length === 0) return <div className={styles.noServices}>Зручності відсутні</div>;
        return entries.map(([key]) => (
            <span key={key} className={styles.badge}>
        {SERVICE_LABELS[key] || key}
      </span>
        ));
    };

    if (loading)
        return (
            <div className={styles.wrap}>
                <div className={styles.card}>Завантаження...</div>
            </div>
        );
    if (error)
        return (
            <div className={styles.wrap}>
                <div className={styles.card}>
                    <h3>Помилка</h3>
                    <p>{error}</p>
                    <Link to="/task2-3">← Повернутися до пошуку</Link>
                </div>
            </div>
        );

    if (!price || !hotel)
        return (
            <div className={styles.wrap}>
                <div className={styles.card}>
                    <p>Дані не знайдено</p>
                    <Link to="/task2-3">← Повернутися до пошуку</Link>
                </div>
            </div>
        );

    return (
        <div className={styles.wrap}>
            <article className={styles.card}>
                <div className={styles.media}>
                    {hotel.img ? <img src={hotel.img} alt={hotel.name || "Hotel"} /> : <div className={styles.noImage}>No image</div>}
                </div>

                <div className={styles.section}>
                    <h1 className={styles.title}>{hotel.name}</h1>
                    <div className={styles.location}>
                        {hotel.countryName || hotel.country || "Країна"} • {hotel.cityName || hotel.city || "Місто"}
                    </div>
                </div>

                {hotel.description && (
                    <div className={styles.section}>
                        <h3 className={styles.h3}>Опис готелю</h3>
                        <p className={styles.text}>{hotel.description}</p>
                    </div>
                )}

                {hotel.services && (
                    <div className={styles.section}>
                        <h3 className={styles.h3}>Зручності</h3>
                        <div className={styles.badges}>{renderServices(hotel.services)}</div>
                    </div>
                )}

                <div className={styles.section}>
                    <h3 className={styles.h3}>Пропозиція</h3>
                    <div className={styles.priceBlock}>
                        <div className={styles.row}>
                            <span className={styles.dim}>Початок:</span>
                            <span>{formatDate(price.startDate)}</span>
                        </div>
                        <div className={styles.row}>
                            <span className={styles.dim}>Кінець:</span>
                            <span>{formatDate(price.endDate)}</span>
                        </div>
                        <div className={styles.total}>{formatMoney(price.amount, price.currency)}</div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <Link to="/task3" className={styles.backLink}>
                        ← Повернутися до пошуку
                    </Link>
                </div>
            </article>
        </div>
    );
}
