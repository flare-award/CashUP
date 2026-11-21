import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Globe, X } from 'lucide-react';
import { useCashUp } from '../../state/CashUpContext';
import { Modal } from '../ui/Modal';
import styles from './PromoShowcase.module.css';

type AdBrandId = 'sunpop' | 'stride' | 'soniq' | 'crusty' | 'roasty' | 'skygo';

interface AdCampaign {
  id: AdBrandId;
  brand: string;
  domain: string;
  product: string;
  quote: string;
  priceUsd: number;
  oldPriceUsd?: number;
  pricePrefix?: string;
  promoBadge: string;
  perks: [string, string, string];
  orderActionLabel: string;
  /** Distinct vibrant palette completely independent of the host site */
  bgGradient: string;
  textColor: string;
  artBg: string;
  pillBg: string;
  pillText: string;
  ctaBg: string;
  ctaText: string;
  badgeBg: string;
  badgeText: string;
}

const AD_CAMPAIGNS: readonly AdCampaign[] = [
  {
    id: 'sunpop',
    brand: 'SUNPOP',
    domain: 'sunpop.drink',
    product: 'Манго-Юдзу Zero · 6 банок',
    quote: '«Один глоток — и будто лето включили на полную громкость.»',
    priceUsd: 4.9,
    oldPriceUsd: 6.9,
    promoBadge: '−29%',
    perks: ['Натуральный сок юдзу', '0 г сахара · 12 ккал', 'Доставка за 30 минут'],
    orderActionLabel: 'Заказать набор на сайте',
    bgGradient: 'linear-gradient(135deg, #ff512f 0%, #f09819 100%)',
    textColor: '#ffffff',
    artBg: 'rgba(255, 255, 255, 0.18)',
    pillBg: 'rgba(0, 0, 0, 0.2)',
    pillText: '#ffffff',
    ctaBg: '#ffffff',
    ctaText: '#d9381e',
    badgeBg: '#fef08a',
    badgeText: '#7c2d12',
  },
  {
    id: 'stride',
    brand: 'STRIDE',
    domain: 'stridelab.store',
    product: 'Кроссовки AirFlow Cloud',
    quote: '«Настолько лёгкие, что городской асфальт кажется облаком.»',
    priceUsd: 69,
    oldPriceUsd: 95,
    promoBadge: 'Хит сезона',
    perks: ['Вес пары всего 210 г', 'Дышащая сетка 3D-Knit', 'Бесплатная примерка'],
    orderActionLabel: 'Выбрать размер на сайте',
    bgGradient: 'linear-gradient(135deg, #1d4ed8 0%, #06b6d4 100%)',
    textColor: '#ffffff',
    artBg: 'rgba(255, 255, 255, 0.16)',
    pillBg: 'rgba(15, 23, 42, 0.26)',
    pillText: '#ffffff',
    ctaBg: '#facc15',
    ctaText: '#0f172a',
    badgeBg: '#ffffff',
    badgeText: '#1d4ed8',
  },
  {
    id: 'roasty',
    brand: 'ROASTY',
    domain: 'roasty.coffee',
    product: 'Дрип-кофе «Утро в Милане»',
    quote: '«Любимая кофейня прямо в твоей чашке ровно за 30 секунд.»',
    priceUsd: 8.4,
    oldPriceUsd: 11.2,
    promoBadge: '20 пакетов',
    perks: ['100% арабика свежей обжарки', 'Без кофемашины и турки', 'Ноты карамели и фундука'],
    orderActionLabel: 'Оформить пробный бокс',
    bgGradient: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
    textColor: '#431407',
    artBg: 'rgba(124, 45, 18, 0.09)',
    pillBg: 'rgba(124, 45, 18, 0.12)',
    pillText: '#7c2d12',
    ctaBg: '#7c2d12',
    ctaText: '#fff7ed',
    badgeBg: '#ea580c',
    badgeText: '#ffffff',
  },
  {
    id: 'soniq',
    brand: 'SONIQ',
    domain: 'soniq-sound.com',
    product: 'Наушники Pulse ANC',
    quote: '«Выключи гул всего города. Оставь только чистый звук.»',
    priceUsd: 79,
    oldPriceUsd: 109,
    promoBadge: '−28%',
    perks: ['Активное шумоподавление', 'До 48 часов без розетки', 'Мягкие амбушюры Memory'],
    orderActionLabel: 'Перейти в каталог Soniq',
    bgGradient: 'linear-gradient(135deg, #6d28d9 0%, #ec4899 100%)',
    textColor: '#ffffff',
    artBg: 'rgba(255, 255, 255, 0.16)',
    pillBg: 'rgba(0, 0, 0, 0.22)',
    pillText: '#ffffff',
    ctaBg: '#ffffff',
    ctaText: '#6d28d9',
    badgeBg: '#fbcfe8',
    badgeText: '#831843',
  },
  {
    id: 'crusty',
    brand: 'CRUSTY',
    domain: 'crustypizza.ru',
    product: '2 Римские пиццы 35 см',
    quote: '«Привезём обжигающе горячими за 25 минут — или пицца за наш счёт!»',
    priceUsd: 11.5,
    oldPriceUsd: 16,
    promoBadge: '2 по цене 1',
    perks: ['Хрустящее тесто 72 ч', 'Тянущаяся моцарелла', 'Соус в подарок к заказу'],
    orderActionLabel: 'Собрать комбо на сайте',
    bgGradient: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
    textColor: '#ffffff',
    artBg: 'rgba(255, 255, 255, 0.18)',
    pillBg: 'rgba(0, 0, 0, 0.22)',
    pillText: '#ffffff',
    ctaBg: '#fffbeb',
    ctaText: '#b91c1c',
    badgeBg: '#fef08a',
    badgeText: '#991b1b',
  },
  {
    id: 'skygo',
    brand: 'SKYGO',
    domain: 'skygo.travel',
    product: 'Билеты к тёплому морю',
    quote: '«Поменять серые будни на +28°C у океана проще, чем кажется.»',
    priceUsd: 89,
    oldPriceUsd: 139,
    pricePrefix: 'от ',
    promoBadge: 'Прямой рейс',
    perks: ['Ручная кладь 10 кг включена', 'Обмен даты без штрафа', 'Кэшбэк милями 10%'],
    orderActionLabel: 'Найти билеты на сайте',
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #14b8a6 100%)',
    textColor: '#ffffff',
    artBg: 'rgba(255, 255, 255, 0.18)',
    pillBg: 'rgba(15, 23, 42, 0.22)',
    pillText: '#ffffff',
    ctaBg: '#ffffff',
    ctaText: '#0f766e',
    badgeBg: '#fde047',
    badgeText: '#134e4a',
  },
];

const BrandLogoIcon: React.FC<{ id: AdBrandId; color: string }> = ({ id, color }) => {
  switch (id) {
    case 'sunpop':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="6" fill={color} />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
            stroke={color}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'stride':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 15L14 6l-2 6h9L10 20l2-5H3z"
            fill={color}
          />
        </svg>
      );
    case 'roasty':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <ellipse cx="12" cy="12" rx="7" ry="9" transform="rotate(-25 12 12)" stroke={color} strokeWidth="2.4" />
          <path d="M9 5c3 4 3 10 6 14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'soniq':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 13v-2a8 8 0 0 1 16 0v2"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <rect x="3" y="12" width="4" height="7" rx="2" fill={color} />
          <rect x="17" y="12" width="4" height="7" rx="2" fill={color} />
        </svg>
      );
    case 'crusty':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3L21 20H3L12 3z" stroke={color} strokeWidth="2.3" strokeLinejoin="round" />
          <circle cx="12" cy="13" r="1.6" fill={color} />
          <circle cx="9.5" cy="17" r="1.4" fill={color} />
          <circle cx="14.8" cy="16.8" r="1.4" fill={color} />
        </svg>
      );
    case 'skygo':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 4L3 11l7 2.8L13.5 21 21 4z" fill={color} />
        </svg>
      );
  }
};

const ProductMinimalArt: React.FC<{ id: AdBrandId; size?: number }> = ({
  id,
  size = 66,
}) => {
  switch (id) {
    case 'sunpop':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
          {/* Citrus slice behind can */}
          <circle cx="54" cy="26" r="15" fill="#fde047" />
          <circle cx="54" cy="26" r="11" fill="#facc15" />
          {/* Sleek soda can */}
          <rect x="22" y="16" width="28" height="50" rx="7" fill="#ffffff" />
          <rect x="22" y="29" width="28" height="22" fill="#fb923c" />
          <rect x="26" y="13" width="20" height="4" rx="2" fill="#e2e8f0" />
          <circle cx="36" cy="40" r="6" fill="#fef08a" />
          {/* Fizzy bubbles */}
          <circle cx="16" cy="24" r="2.5" fill="rgba(255,255,255,0.75)" />
          <circle cx="62" cy="52" r="3" fill="rgba(255,255,255,0.75)" />
          <circle cx="58" cy="62" r="2" fill="rgba(255,255,255,0.6)" />
        </svg>
      );

    case 'stride':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
          <g transform="rotate(-14 40 42)">
            {/* Cushioned sole */}
            <rect x="10" y="48" width="60" height="11" rx="5.5" fill="#facc15" />
            {/* Clean sneaker upper */}
            <path
              d="M14 48L22 25h15l8 11 19 4c4 1 6 4 6 8H14z"
              fill="#ffffff"
            />
            {/* Dynamic stripe */}
            <path
              d="M24 41l22-5-14 9"
              stroke="#1d4ed8"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      );

    case 'roasty':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
          {/* Aroma waves */}
          <path
            d="M32 14c0 5 4 5 4 10M44 12c0 5 4 5 4 10"
            stroke="#9a3412"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Minimalist coffee cup */}
          <path d="M20 30h34l-4 32a6 6 0 0 1-6 5H30a6 6 0 0 1-6-5l-4-32z" fill="#7c2d12" />
          <path d="M54 36h6a6 6 0 0 1 0 12h-7" stroke="#7c2d12" strokeWidth="4" fill="none" />
          <rect x="22" y="41" width="30" height="11" rx="3" fill="#fed7aa" />
        </svg>
      );

    case 'soniq':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
          <path
            d="M20 44V36a20 20 0 0 1 40 0v8"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="14" y="39" width="13" height="22" rx="6.5" fill="#fbcfe8" />
          <rect x="53" y="39" width="13" height="22" rx="6.5" fill="#fbcfe8" />
          <path
            d="M34 49l4-7 4 12 4-8 3 3"
            stroke="#fef08a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );

    case 'crusty':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
          {/* Golden crust */}
          <path d="M18 22c15-8 33-6 46 6L34 66 18 22z" fill="#fde047" />
          <path d="M16 20c16-9 36-7 50 6" stroke="#b45309" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Pepperoni toppings */}
          <circle cx="36" cy="34" r="5" fill="#dc2626" />
          <circle cx="46" cy="43" r="4.5" fill="#dc2626" />
          <circle cx="33" cy="48" r="4" fill="#dc2626" />
          {/* Fresh basil leaf */}
          <ellipse cx="41" cy="39" rx="3.5" ry="2" transform="rotate(-30 41 39)" fill="#16a34a" />
        </svg>
      );

    case 'skygo':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
          {/* Warm sun */}
          <circle cx="52" cy="26" r="13" fill="#fde047" />
          {/* Fluffy cloud */}
          <path
            d="M16 54h38a8 8 0 0 0 0-16 11 11 0 0 0-21-3 9 9 0 0 0-17 7v12z"
            fill="rgba(255,255,255,0.92)"
          />
          {/* Sleek jet */}
          <path
            d="M16 38l46-14-14 22-11-4-7 6v-8l-14-2z"
            fill="#ffffff"
          />
        </svg>
      );
  }
};

export interface PromoShowcaseProps {
  variant?: 'sidebar' | 'banner';
  initialIndex?: number;
}

export const PromoShowcase: React.FC<PromoShowcaseProps> = ({
  variant = 'sidebar',
  initialIndex = 0,
}) => {
  const { formatAmount, playSound, settings } = useCashUp();

  const [activeIdx, setActiveIdx] = useState<number>(
    initialIndex % AD_CAMPAIGNS.length
  );
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [hiddenCompletely, setHiddenCompletely] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [siteModalOpen, setSiteModalOpen] = useState<boolean>(false);
  const [orderSent, setOrderSent] = useState<boolean>(false);

  const ad = AD_CAMPAIGNS[activeIdx] ?? AD_CAMPAIGNS[0]!;

  useEffect(() => {
    if (dismissed || hiddenCompletely || paused || siteModalOpen || !settings.animationsEnabled) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % AD_CAMPAIGNS.length);
    }, 11000);
    return () => window.clearInterval(timer);
  }, [dismissed, hiddenCompletely, paused, siteModalOpen, settings.animationsEnabled]);

  if (hiddenCompletely) {
    return null;
  }

  if (dismissed) {
    return (
      <div className={styles.dismissedBar}>
        <span>Объявление скрыто</span>
        <div className={styles.dismissedActions}>
          <button
            type="button"
            className={styles.dismissedLink}
            onClick={() => {
              playSound('click');
              setActiveIdx((prev) => (prev + 1) % AD_CAMPAIGNS.length);
              setDismissed(false);
            }}
          >
            Показать другое
          </button>
          <button
            type="button"
            className={styles.dismissedLink}
            aria-label="Скрыть рекламный блок полностью"
            onClick={() => setHiddenCompletely(true)}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  const openAdvertiserSite = () => {
    playSound('select');
    setOrderSent(false);
    setSiteModalOpen(true);
  };

  const handleCloseAd = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    setDismissed(true);
  };

  const formattedPrice = `${ad.pricePrefix ?? ''}${formatAmount(ad.priceUsd)}`;
  const formattedOldPrice = ad.oldPriceUsd ? formatAmount(ad.oldPriceUsd) : null;

  return (
    <>
      {variant === 'sidebar' ? (
        <aside
          aria-label={`Реклама ${ad.brand}`}
          className={styles.sidebarCard}
          style={{ background: ad.bgGradient, color: ad.textColor }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className={styles.glowOrb} />

          {/* Top Bar: Brand Logo + Ad badge + Close X */}
          <div className={styles.topBar}>
            <div className={styles.brandMark}>
              <span
                className={styles.brandIconWrap}
                style={{ backgroundColor: ad.artBg }}
              >
                <BrandLogoIcon id={ad.id} color={ad.textColor} />
              </span>
              <span className={styles.brandName}>{ad.brand}</span>
            </div>

            <div className={styles.topRightControls}>
              <span
                className={styles.adPill}
                style={{ backgroundColor: ad.pillBg, color: ad.pillText }}
              >
                Реклама
              </span>
              <button
                type="button"
                className={styles.closeBtn}
                style={{ backgroundColor: ad.pillBg, color: ad.pillText }}
                onClick={handleCloseAd}
                aria-label="Закрыть рекламу"
                title="Закрыть рекламу"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Minimalist Product Art */}
          <div
            className={styles.sidebarVisual}
            style={{ backgroundColor: ad.artBg }}
          >
            <ProductMinimalArt id={ad.id} size={68} />
          </div>

          {/* Product + Ad Quote */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className={styles.productTitle}>{ad.product}</div>
            <p className={styles.quoteText}>{ad.quote}</p>
          </div>

          {/* Price + Promo Tag */}
          <div className={styles.priceRow}>
            <div className={styles.priceGroup}>
              <span className={`${styles.currentPrice} tabular`}>
                {formattedPrice}
              </span>
              {formattedOldPrice && (
                <span className={`${styles.oldPrice} tabular`}>
                  {formattedOldPrice}
                </span>
              )}
            </div>
            <span
              className={styles.promoTag}
              style={{ backgroundColor: ad.badgeBg, color: ad.badgeText }}
            >
              {ad.promoBadge}
            </span>
          </div>

          {/* Go to Advertiser Website CTA */}
          <button
            type="button"
            className={styles.ctaButton}
            style={{ backgroundColor: ad.ctaBg, color: ad.ctaText }}
            onClick={openAdvertiserSite}
          >
            Перейти на сайт <ExternalLink size={13} />
          </button>

          {/* Minimal Dots */}
          <div className={styles.dotsRow} role="tablist" aria-label="Рекламные баннеры">
            {AD_CAMPAIGNS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={idx === activeIdx}
                aria-label={item.brand}
                className={`${styles.dotBtn} ${
                  idx === activeIdx ? styles.dotBtnActive : ''
                }`}
                style={{ backgroundColor: ad.textColor }}
                onClick={() => {
                  playSound('click');
                  setActiveIdx(idx);
                }}
              />
            ))}
          </div>
        </aside>
      ) : (
        <section
          aria-label={`Реклама ${ad.brand}`}
          className={styles.bannerCard}
          style={{ background: ad.bgGradient, color: ad.textColor }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className={styles.glowOrb} />

          {/* Left Minimalist Illustration */}
          <div
            className={styles.bannerArtBox}
            style={{ backgroundColor: ad.artBg }}
          >
            <ProductMinimalArt id={ad.id} size={82} />
          </div>

          {/* Center: Logo + Product + Quote + Price */}
          <div className={styles.bannerCenter}>
            <div className={styles.brandMark}>
              <span
                className={styles.brandIconWrap}
                style={{ backgroundColor: ad.artBg }}
              >
                <BrandLogoIcon id={ad.id} color={ad.textColor} />
              </span>
              <span className={styles.brandName}>{ad.brand}</span>
              <span
                className={styles.promoTag}
                style={{ backgroundColor: ad.badgeBg, color: ad.badgeText, marginLeft: 4 }}
              >
                {ad.promoBadge}
              </span>
            </div>

            <div className={styles.bannerProductTitle}>{ad.product}</div>
            <p className={styles.bannerQuote}>{ad.quote}</p>

            <div className={styles.priceGroup} style={{ marginTop: 2 }}>
              <span className={`${styles.currentPrice} tabular`} style={{ fontSize: '1.14rem' }}>
                {formattedPrice}
              </span>
              {formattedOldPrice && (
                <span className={`${styles.oldPrice} tabular`} style={{ fontSize: '0.82rem' }}>
                  {formattedOldPrice}
                </span>
              )}
            </div>
          </div>

          {/* Right: Ad badge + Close X + CTA + Dots */}
          <div className={styles.bannerRight}>
            <div className={styles.topRightControls}>
              <span
                className={styles.adPill}
                style={{ backgroundColor: ad.pillBg, color: ad.pillText }}
              >
                Реклама · {ad.domain}
              </span>
              <button
                type="button"
                className={styles.closeBtn}
                style={{ backgroundColor: ad.pillBg, color: ad.pillText }}
                onClick={handleCloseAd}
                aria-label="Закрыть рекламу"
                title="Закрыть рекламу"
              >
                <X size={12} />
              </button>
            </div>

            <button
              type="button"
              className={styles.bannerCta}
              style={{ backgroundColor: ad.ctaBg, color: ad.ctaText }}
              onClick={openAdvertiserSite}
            >
              Перейти на сайт <ExternalLink size={14} />
            </button>

            <div className={styles.dotsRow}>
              {AD_CAMPAIGNS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.brand}
                  className={`${styles.dotBtn} ${
                    idx === activeIdx ? styles.dotBtnActive : ''
                  }`}
                  style={{ backgroundColor: ad.textColor }}
                  onClick={() => {
                    playSound('click');
                    setActiveIdx(idx);
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Clean Minimalist Advertiser Mini-Website Modal */}
      <Modal
        open={siteModalOpen}
        title={`${ad.brand} — ${ad.product}`}
        subtitle={`Официальная витрина ${ad.domain}`}
        onClose={() => setSiteModalOpen(false)}
      >
        <div>
          <div className={styles.domainBar}>
            <Globe size={13} />
            <span>https://{ad.domain}</span>
          </div>

          <div
            className={styles.sitePreviewHero}
            style={{ background: ad.bgGradient, color: ad.textColor }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 16,
                backgroundColor: ad.artBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ProductMinimalArt id={ad.id} size={74} />
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                  {ad.brand}
                </strong>
                <span
                  className={styles.promoTag}
                  style={{ backgroundColor: ad.badgeBg, color: ad.badgeText }}
                >
                  {ad.promoBadge}
                </span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>{ad.product}</div>
              <p style={{ fontSize: '0.86rem', fontStyle: 'italic', marginTop: 4, opacity: 0.95 }}>
                {ad.quote}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                  {formattedPrice}
                </span>
                {formattedOldPrice && (
                  <span
                    className="mono"
                    style={{ fontSize: '0.85rem', textDecoration: 'line-through', opacity: 0.75 }}
                  >
                    {formattedOldPrice}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.perksList}>
            {ad.perks.map((perk) => (
              <div key={perk} className={styles.perkCard}>
                ✓ {perk}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 10,
              marginTop: 18,
            }}
          >
            <button
              type="button"
              className="btn btnSecondary"
              onClick={() => setSiteModalOpen(false)}
            >
              Закрыть
            </button>
            <button
              type="button"
              className="btn btnPrimary"
              style={{
                background: orderSent ? undefined : ad.bgGradient,
                color: orderSent ? undefined : ad.textColor,
                border: 'none',
              }}
              onClick={() => {
                playSound('win');
                setOrderSent(true);
              }}
            >
              {orderSent ? (
                <>
                  <Check size={16} /> Промо-предложение активировано
                </>
              ) : (
                ad.orderActionLabel
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
