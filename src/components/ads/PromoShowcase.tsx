import React, { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Compass, Sparkles } from 'lucide-react';
import { useCashUp } from '../../state/CashUpContext';
import { Modal } from '../ui/Modal';
import styles from './PromoShowcase.module.css';

export interface EditionOption {
  id: string;
  name: string;
  code: string;
  primaryHex: string;
  secondaryHex: string;
  priceMultiplier: number;
}

export interface LuxuryCampaign {
  id: 'chronos' | 'veloce' | 'nocturne' | 'auralis';
  shortBrand: string;
  origin: string;
  serialStamp: string;
  coordLabel: string;
  title: string;
  tagline: string;
  editorialStory: string;
  basePriceUsd: number;
  ctaLabel: string;
  boutiques: string;
  specs: Array<{ label: string; value: string }>;
  editions: EditionOption[];
}

export const LUXURY_CAMPAIGNS: readonly LuxuryCampaign[] = [
  {
    id: 'chronos',
    shortBrand: 'CHRONOS VANTAGE',
    origin: 'GENÈVE · ATELIER IV',
    serialStamp: 'CAL. CV-09 · 042/150',
    coordLabel: '46°12′N 06°08′E',
    title: 'Aether Tourbillon Skeleton',
    tagline:
      'Парящий минутный турбийон на сапфировых мостах с корпусом из кованого карбона TPT и титана Grade 5.',
    editorialStory:
      'Мануфактурный калибр CV-09 собирается вручную одним часовщиком в течение 14 недель. Двойной заводной барабан с кремниевым спуском обеспечивает изохронный запас хода 96 часов при массе корпуса всего 34 грамма.',
    basePriceUsd: 48500,
    ctaLabel: 'Открыть хронограф',
    boutiques: 'ЦЮРИХ · ТОКИО · ДУБАЙ · МОНАКО',
    specs: [
      { label: 'Механизм', value: 'Cal. CV-09 Tourbillon' },
      { label: 'Запас хода', value: '96 часов · 4 Гц' },
      { label: 'Корпус', value: 'Carbon TPT / Ti Gr.5' },
      { label: 'Тираж серии', value: '150 нумер. экз.' },
    ],
    editions: [
      {
        id: 'emerald-carbon',
        name: 'Emerald Carbon TPT',
        code: 'REF. CV09-EM',
        primaryHex: '#10b981',
        secondaryHex: '#f59e0b',
        priceMultiplier: 1,
      },
      {
        id: 'rose-obsidian',
        name: 'Or Rose 5N & Obsidian',
        code: 'REF. CV09-RG',
        primaryHex: '#f59e0b',
        secondaryHex: '#f43f5e',
        priceMultiplier: 1.18,
      },
      {
        id: 'glacier-ti',
        name: 'Glacier Sapphire Ti',
        code: 'REF. CV09-TI',
        primaryHex: '#38bdf8',
        secondaryHex: '#a78bfa',
        priceMultiplier: 1.09,
      },
    ],
  },
  {
    id: 'veloce',
    shortBrand: 'VELOCE ATELIER',
    origin: 'MODENA · AERO DIVISION',
    serialStamp: 'SERIE ZERO · MONOLITH',
    coordLabel: '44°38′N 10°55′E',
    title: 'Vespera GT-Zero Coupe',
    tagline:
      'Электрический гран-туризмо с активным аэродинамическим оперением, карбоновым монококом и архитектурой 980 В.',
    editorialStory:
      'Четыре независимых осевых электромотора с мгновенной векторизацией тяги на каждом колесе позволяют проходить скоростные дуги с боковым ускорением до 1.85 g. Салон отделан базальтовым волокном и анилиновой кожей ручной выделки.',
    basePriceUsd: 215000,
    ctaLabel: 'Конфигуратор GT',
    boutiques: 'МИЛАН · ЛОНДОН · ШАНХАЙ · МЮНХЕН',
    specs: [
      { label: 'Силовая установка', value: '1 180 л.с. · Quad-Motor' },
      { label: 'Динамика 0–100', value: '1.98 сек · 340 км/ч' },
      { label: 'Батарея', value: 'Solid-State · 980 В' },
      { label: 'Запас хода', value: '790 км WLTP' },
    ],
    editions: [
      {
        id: 'verde-corsa',
        name: 'Verde Aero Satin',
        code: 'SPEC. VZ-01',
        primaryHex: '#10b981',
        secondaryHex: '#fbbf24',
        priceMultiplier: 1,
      },
      {
        id: 'nero-forgiato',
        name: 'Nero Carbonio Exposed',
        code: 'SPEC. VZ-02',
        primaryHex: '#f59e0b',
        secondaryHex: '#94a3b8',
        priceMultiplier: 1.12,
      },
      {
        id: 'argento-luna',
        name: 'Argento Liquido',
        code: 'SPEC. VZ-03',
        primaryHex: '#38bdf8',
        secondaryHex: '#10b981',
        priceMultiplier: 1.05,
      },
    ],
  },
  {
    id: 'nocturne',
    shortBrand: 'MAISON NOCTURNE',
    origin: 'PARIS · HAUTE PARFUMERIE',
    serialStamp: 'EXTRAIT 38% · N°07',
    coordLabel: '48°52′N 02°19′E',
    title: 'Obsidian N°07 Extrait Absolu',
    tagline:
      'Молекулярный парфюмерный экстракт холодной мацерации в базальтовых амфорах во флаконе ручной огранки.',
    editorialStory:
      'Редкий кашмирский чёрный шафран и смола сомалийского олибанума соединяются с абсолютом флорентийского ириса трёхлетней выдержки. Каждый хрустальный флакон полируется вручную и укомплектован футляром из мореного дуба.',
    basePriceUsd: 640,
    ctaLabel: 'Ноты композиции',
    boutiques: 'ПАРИЖ · АМСТЕРДАМ · СЕУЛ · НЬЮ-ЙОРК',
    specs: [
      { label: 'Концентрация', value: '38% Extrait Absolu' },
      { label: 'Верхние ноты', value: 'Чёрный шафран, Бергамот' },
      { label: 'Сердце и база', value: 'Ладан, Ирис, Кедр' },
      { label: 'Выдержка', value: '180 суток · 100 мл' },
    ],
    editions: [
      {
        id: 'amber-basalt',
        name: 'Flacon Basalte Noir 100 мл',
        code: 'LOT. MN-07A',
        primaryHex: '#f59e0b',
        secondaryHex: '#10b981',
        priceMultiplier: 1,
      },
      {
        id: 'emerald-collector',
        name: 'Coffret Cristal Vert 200 мл',
        code: 'LOT. MN-07E',
        primaryHex: '#10b981',
        secondaryHex: '#eab308',
        priceMultiplier: 1.75,
      },
      {
        id: 'travel-atomizer',
        name: 'Кофр Титан 3×15 мл',
        code: 'LOT. MN-07T',
        primaryHex: '#a78bfa',
        secondaryHex: '#f59e0b',
        priceMultiplier: 0.55,
      },
    ],
  },
  {
    id: 'auralis',
    shortBrand: 'AURALIS ACOUSTICS',
    origin: 'KØBENHAVN · REFERENCE LAB',
    serialStamp: 'PLANAR MK-II · PURE A',
    coordLabel: '55°40′N 12°34′E',
    title: 'Orpheus Planar Reference II',
    tagline:
      'Открытая изодинамическая акустическая система с ультратонкой золотой мембраной 0.8 мкм и двойным моно-усилителем.',
    editorialStory:
      'Цельнофрезерованная рама из авиационного алюминия устраняет корпусные резонансы, создавая голографическую звуковую сцену студийного масштаба. В комплект входит балансный лампово-транзисторный тракт класса Pure A.',
    basePriceUsd: 14800,
    ctaLabel: 'Акустический стенд',
    boutiques: 'КОПЕНГАГЕН · БЕРЛИН · ОСАКА · СТОКГОЛЬМ',
    specs: [
      { label: 'Излучатель', value: 'Планарный 0.8 мкм Au' },
      { label: 'Частотный охват', value: '5 Гц – 68 кГц' },
      { label: 'Усиление', value: 'Dual Mono · Pure Class A' },
      { label: 'Шасси', value: 'CNC Алюминий 6061-T6' },
    ],
    editions: [
      {
        id: 'anodized-gold',
        name: 'Graphite & 24K Ribbon',
        code: 'SYS. OR-24G',
        primaryHex: '#f59e0b',
        secondaryHex: '#10b981',
        priceMultiplier: 1,
      },
      {
        id: 'nordic-emerald',
        name: 'Nordic Emerald Slate',
        code: 'SYS. OR-EM2',
        primaryHex: '#10b981',
        secondaryHex: '#38bdf8',
        priceMultiplier: 1.06,
      },
      {
        id: 'raw-titanium',
        name: 'Brushed Raw Titanium',
        code: 'SYS. OR-RAW',
        primaryHex: '#94a3b8',
        secondaryHex: '#f59e0b',
        priceMultiplier: 1.14,
      },
    ],
  },
];

const CampaignArtworkSvg: React.FC<{
  id: LuxuryCampaign['id'];
  primary: string;
  secondary: string;
  size?: 'compact' | 'large';
}> = ({ id, primary, secondary, size = 'compact' }) => {
  const w = size === 'large' ? 280 : 210;
  const h = size === 'large' ? 175 : 112;

  if (id === 'chronos') {
    return (
      <svg viewBox="0 0 260 150" width={w} height={h} aria-hidden="true">
        <defs>
          <radialGradient id="cvGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.28" />
            <stop offset="100%" stopColor="#06090f" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="130" cy="75" r="70" fill="url(#cvGlow)" />
        {/* Watch lugs */}
        <path
          d="M100 12 L160 12 L168 30 L92 30 Z M92 120 L168 120 L160 138 L100 138 Z"
          fill="#182232"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1.2"
        />
        {/* Bezel & tachymeter */}
        <circle
          cx="130"
          cy="75"
          r="56"
          fill="#0b1018"
          stroke={primary}
          strokeWidth="2"
        />
        <circle
          cx="130"
          cy="75"
          r="49"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="2 5.4"
          strokeWidth="3"
        />
        {/* Skeleton bridges */}
        <line x1="88" y1="52" x2="172" y2="98" stroke="#334155" strokeWidth="2.2" />
        <line x1="88" y1="98" x2="172" y2="52" stroke="#334155" strokeWidth="2.2" />
        {/* Rotating Tourbillon Cage at 6 o'clock */}
        <g transform="translate(130, 96)">
          <g className={styles.spinSlow}>
            <circle r="15" fill="none" stroke={secondary} strokeWidth="1.6" />
            <polygon
              points="0,-14 3,-3 13,6 0,4 -13,6 -3,-3"
              fill="none"
              stroke={primary}
              strokeWidth="1.3"
            />
            <circle r="3" fill={secondary} />
          </g>
        </g>
        {/* Main hands */}
        <line
          x1="130"
          y1="75"
          x2="108"
          y2="54"
          stroke="#f8fafc"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <line
          x1="130"
          y1="75"
          x2="162"
          y2="58"
          stroke={primary}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="130" cy="75" r="4" fill={secondary} />
      </svg>
    );
  }

  if (id === 'veloce') {
    return (
      <svg viewBox="0 0 260 150" width={w} height={h} aria-hidden="true">
        {/* Aero wind-tunnel streamlines */}
        <path
          d="M16 54 Q 95 28, 178 44 T 248 56"
          fill="none"
          stroke={primary}
          strokeWidth="1.3"
          strokeOpacity="0.55"
        />
        <path
          d="M10 42 Q 98 16, 184 34 T 252 46"
          fill="none"
          stroke={secondary}
          strokeWidth="1"
          strokeDasharray="4 4"
          strokeOpacity="0.45"
        />
        {/* Ground reflection */}
        <ellipse cx="132" cy="116" rx="98" ry="8" fill={primary} fillOpacity="0.16" />
        {/* Sculpted Hyper-GT body */}
        <path
          d="M28 102 L42 82 L88 64 L146 58 L206 72 L234 90 L228 104 L34 104 Z"
          fill="#111926"
          stroke={primary}
          strokeWidth="1.8"
        />
        {/* Canopy glasshouse */}
        <path
          d="M84 66 L142 60 L184 72 L124 75 Z"
          fill="rgba(56, 189, 248, 0.16)"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.1"
        />
        {/* Laser blade headlight & rear diffuser glow */}
        <line x1="210" y1="84" x2="231" y2="89" stroke={secondary} strokeWidth="2.8" strokeLinecap="round" />
        <line x1="29" y1="88" x2="42" y2="85" stroke="#f43f5e" strokeWidth="2.6" strokeLinecap="round" />
        {/* Forged center-lock wheels */}
        {[72, 192].map((cx) => (
          <g key={cx} transform={`translate(${cx}, 103)`}>
            <circle r="17" fill="#070a10" stroke="#475569" strokeWidth="2.2" />
            <circle r="11" fill="none" stroke={primary} strokeDasharray="3 3" strokeWidth="1.5" />
            <circle r="3.5" fill={secondary} />
          </g>
        ))}
      </svg>
    );
  }

  if (id === 'nocturne') {
    return (
      <svg viewBox="0 0 260 150" width={w} height={h} aria-hidden="true">
        {/* Caustic light rays */}
        <polygon points="130,22 64,136 196,136" fill={primary} fillOpacity="0.09" />
        <polygon points="130,36 86,134 174,134" fill={secondary} fillOpacity="0.12" />
        {/* Molecular constellation */}
        <g stroke="rgba(255,255,255,0.22)" strokeWidth="1">
          <line x1="52" y1="48" x2="76" y2="34" />
          <line x1="76" y1="34" x2="92" y2="54" />
          <line x1="176" y1="44" x2="202" y2="32" />
          <line x1="202" y1="32" x2="214" y2="58" />
        </g>
        <circle cx="52" cy="48" r="2.5" fill={primary} />
        <circle cx="76" cy="34" r="3" fill={secondary} />
        <circle cx="202" cy="32" r="3" fill={primary} />
        {/* Knurled stopper & collar */}
        <rect
          x="114"
          y="18"
          width="32"
          height="20"
          rx="3"
          fill="#1e293b"
          stroke={secondary}
          strokeWidth="1.6"
        />
        <rect x="121" y="38" width="18" height="8" fill={secondary} />
        {/* Faceted Obsidian Flacon */}
        <polygon
          points="96,46 164,46 176,64 168,130 92,130 84,64"
          fill="#0c131e"
          stroke={primary}
          strokeWidth="1.8"
        />
        <polygon
          points="106,56 154,56 158,120 102,120"
          fill={secondary}
          fillOpacity="0.18"
        />
        {/* Luxury Plaque */}
        <rect
          x="108"
          y="72"
          width="44"
          height="32"
          rx="2"
          fill="#070a10"
          stroke={secondary}
          strokeWidth="1.2"
        />
        <text
          x="130"
          y="87"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="7.5"
          fontFamily="monospace"
          fontWeight="700"
        >
          N°07
        </text>
        <text
          x="130"
          y="97"
          textAnchor="middle"
          fill={primary}
          fontSize="5.5"
          fontFamily="monospace"
        >
          PARIS
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 260 150" width={w} height={h} aria-hidden="true">
      {/* Concentric acoustic wave rings */}
      {[28, 46, 64].map((r, i) => (
        <circle
          key={r}
          cx="130"
          cy="75"
          r={r}
          fill="none"
          stroke={i % 2 === 0 ? primary : secondary}
          strokeOpacity={0.35 - i * 0.08}
          strokeWidth="1.2"
          strokeDasharray={i === 1 ? '4 4' : undefined}
        />
      ))}
      {/* Monolithic Planar Speaker Pair */}
      {[92, 168].map((x) => (
        <g key={x} transform={`translate(${x}, 20)`}>
          <rect
            x="-20"
            y="0"
            width="40"
            height="110"
            rx="6"
            fill="#111826"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
          {/* Gold Planar Ribbon */}
          <rect
            x="-7"
            y="10"
            width="14"
            height="90"
            rx="2"
            fill={secondary}
            fillOpacity="0.28"
            stroke={secondary}
            strokeWidth="1.2"
          />
          {[22, 38, 54, 70, 86].map((ly) => (
            <line
              key={ly}
              x1="-5"
              y1={ly}
              x2="5"
              y2={ly}
              stroke={primary}
              strokeWidth="1.2"
            />
          ))}
        </g>
      ))}
    </svg>
  );
};

interface PromoShowcaseProps {
  variant?: 'sidebar' | 'banner';
  initialIndex?: number;
}

export const PromoShowcase: React.FC<PromoShowcaseProps> = ({
  variant = 'sidebar',
  initialIndex = 0,
}) => {
  const { formatAmount, playSound, notify } = useCashUp();
  const [activeIdx, setActiveIdx] = useState(
    initialIndex % LUXURY_CAMPAIGNS.length
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEditionIdx, setSelectedEditionIdx] = useState(0);
  const [reservedIds, setReservedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (modalOpen) return;
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % LUXURY_CAMPAIGNS.length);
      setSelectedEditionIdx(0);
    }, 14000);
    return () => window.clearInterval(timer);
  }, [modalOpen]);

  const campaign = LUXURY_CAMPAIGNS[activeIdx]!;
  const edition = campaign.editions[selectedEditionIdx] ?? campaign.editions[0]!;
  const configuredPriceUsd = Math.round(
    campaign.basePriceUsd * edition.priceMultiplier
  );
  const reserveKey = `${campaign.id}-${edition.id}`;

  const openModal = () => {
    playSound('click');
    setModalOpen(true);
  };

  const handleConciergeRequest = () => {
    playSound('select');
    setReservedIds((prev) => ({ ...prev, [reserveKey]: true }));
    notify({
      type: 'success',
      title: `${campaign.shortBrand} · Приватный показ`,
      description: `Спецификация ${edition.code} (${edition.name}) сохранена в листе ожидания.`,
    });
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <aside className={styles.sidebarCard} aria-label="Партнёрская витрина">
          <div className={styles.topMeta}>
            <span className={styles.adTag}>ПАРТНЁР · ВИТРИНА</span>
            <div className={styles.navDots} role="tablist" aria-label="Выбор коллекции">
              {LUXURY_CAMPAIGNS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeIdx}
                  aria-label={item.shortBrand}
                  className={`${styles.dotBtn} ${
                    idx === activeIdx ? styles.dotBtnActive : ''
                  }`}
                  onClick={() => {
                    playSound('click');
                    setActiveIdx(idx);
                    setSelectedEditionIdx(0);
                  }}
                />
              ))}
            </div>
          </div>

          <div
            className={styles.sidebarArtBox}
            onClick={openModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') openModal();
            }}
            aria-label={`Подробнее: ${campaign.shortBrand} ${campaign.title}`}
          >
            <span className={styles.serialBadge}>{campaign.serialStamp}</span>
            <CampaignArtworkSvg
              id={campaign.id}
              primary={edition.primaryHex}
              secondary={edition.secondaryHex}
              size="compact"
            />
          </div>

          <div>
            <div className={styles.originLabel}>{campaign.origin}</div>
            <div className={styles.sidebarTitle}>{campaign.title}</div>
            <p className={styles.sidebarTagline}>{campaign.tagline}</p>
          </div>

          <div className={styles.microSpecs}>
            {campaign.specs.slice(0, 2).map((sp) => (
              <div key={sp.label} className={styles.specChip}>
                <span>{sp.label}</span>
                <strong title={sp.value}>{sp.value}</strong>
              </div>
            ))}
          </div>

          <div className={styles.sidebarFooter}>
            <div className={styles.priceLabel}>
              <span>Ориентир бутика</span>
              <strong>{formatAmount(configuredPriceUsd)}</strong>
            </div>
            <button type="button" className={styles.ctaMini} onClick={openModal}>
              {campaign.ctaLabel} <ArrowUpRight size={13} />
            </button>
          </div>
        </aside>
      ) : (
        <section className={styles.bannerWrap} aria-label="Спецпроект партнёров">
          <div
            className={styles.bannerVisual}
            onClick={openModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') openModal();
            }}
          >
            <div className={styles.blueprintGrid} />
            <span className={styles.serialBadge}>{campaign.serialStamp}</span>
            <CampaignArtworkSvg
              id={campaign.id}
              primary={edition.primaryHex}
              secondary={edition.secondaryHex}
              size="large"
            />
            <span className={styles.cornerCoord}>{campaign.coordLabel}</span>
          </div>

          <div className={styles.bannerBody}>
            <div>
              <div className={styles.bannerTopRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={styles.adTag}>СПЕЦПРОЕКТ · РЕКЛАМА</span>
                  <span className={styles.originLabel}>{campaign.origin}</span>
                </div>
                <div className={styles.brandTabs}>
                  {LUXURY_CAMPAIGNS.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.brandTab} ${
                        idx === activeIdx ? styles.brandTabActive : ''
                      }`}
                      onClick={() => {
                        playSound('click');
                        setActiveIdx(idx);
                        setSelectedEditionIdx(0);
                      }}
                    >
                      {c.shortBrand}
                    </button>
                  ))}
                </div>
              </div>

              <h3 className={styles.bannerHeadline} style={{ marginTop: 10 }}>
                {campaign.shortBrand} — {campaign.title}
              </h3>
              <p className={styles.bannerDesc} style={{ marginTop: 6 }}>
                {campaign.tagline}
              </p>
            </div>

            <div className={styles.bannerSpecsRow}>
              {campaign.specs.map((s) => (
                <div key={s.label} className={styles.bannerSpecBox}>
                  <span>{s.label}</span>
                  <strong>{s.value}</strong>
                </div>
              ))}
            </div>

            <div className={styles.bannerBottomRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.66rem',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Стоимость исполнения
                  </span>
                  <strong className="mono" style={{ fontSize: '1.02rem' }}>
                    {formatAmount(configuredPriceUsd)}
                  </strong>
                </div>
                <span className={styles.boutiqueCities}>
                  <Compass size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  {campaign.boutiques}
                </span>
              </div>

              <button type="button" className="btn btnGold btnSm" onClick={openModal}>
                <Sparkles size={14} /> {campaign.ctaLabel} <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Detailed Interactive Boutique Modal */}
      <Modal
        open={modalOpen}
        title={`${campaign.shortBrand} — ${campaign.title}`}
        subtitle={`${campaign.origin} · ${campaign.serialStamp}`}
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <>
            <button
              type="button"
              className="btn btnSecondary"
              onClick={() => setModalOpen(false)}
            >
              Закрыть витрину
            </button>
            <button
              type="button"
              className="btn btnPrimary"
              onClick={handleConciergeRequest}
            >
              {reservedIds[reserveKey] ? (
                <>
                  <CheckCircle2 size={16} /> В листе ожидания ({edition.code})
                </>
              ) : (
                <>Запросить приватный показ · {formatAmount(configuredPriceUsd)}</>
              )}
            </button>
          </>
        }
      >
        <div className={styles.modalStage}>
          <div className={styles.blueprintGrid} />
          <span className={styles.serialBadge}>
            {edition.code} · {campaign.coordLabel}
          </span>
          <CampaignArtworkSvg
            id={campaign.id}
            primary={edition.primaryHex}
            secondary={edition.secondaryHex}
            size="large"
          />
        </div>

        <div style={{ marginBottom: 8, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Выберите исполнение серии
        </div>
        <div className={styles.editionRow}>
          {campaign.editions.map((ed, idx) => (
            <button
              key={ed.id}
              type="button"
              className={`${styles.editionPill} ${
                idx === selectedEditionIdx ? styles.editionPillActive : ''
              }`}
              onClick={() => {
                playSound('click');
                setSelectedEditionIdx(idx);
              }}
            >
              <span
                className={styles.swatchDot}
                style={{
                  background: `linear-gradient(135deg, ${ed.primaryHex}, ${ed.secondaryHex})`,
                }}
              />
              <span>{ed.name}</span>
              <span className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                {ed.code}
              </span>
            </button>
          ))}
        </div>

        <p
          style={{
            fontSize: '0.9rem',
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}
        >
          {campaign.editorialStory}
        </p>

        <div className={styles.bannerSpecsRow} style={{ marginBottom: 14 }}>
          {campaign.specs.map((s) => (
            <div key={s.label} className={styles.bannerSpecBox}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </div>

        <div className={styles.boutiqueCities}>
          Флагманские салоны: {campaign.boutiques}
        </div>
      </Modal>
    </>
  );
};
