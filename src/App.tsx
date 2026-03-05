import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MapPin, Globe, Calendar,
  Plane, Sparkles
} from 'lucide-react';
import {
  ComposableMap, Geographies, Geography, Marker
} from 'react-simple-maps';

// ═══════════════════════════════════════
// DATA
// ═══════════════════════════════════════
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const KR_CITIES = [
  { name: '서울', coords: [126.978, 37.566] as [number, number], date: '2024.03 ~', memo: '홍대, 이태원, 명동, 여의도' },
  { name: '인천', coords: [126.705, 37.456] as [number, number], date: '2024.05', memo: '차이나타운 데이트' },
  { name: '춘천', coords: [127.729, 37.881] as [number, number], date: '2024.09', memo: '닭갈비 먹방 여행' },
  { name: '홍천', coords: [127.889, 37.697] as [number, number], date: '2024.08', memo: '비발디파크' },
  { name: '원주', coords: [127.946, 37.342] as [number, number], date: '2024.10', memo: '소금산 출렁다리' },
  { name: '강릉', coords: [128.876, 37.751] as [number, number], date: '2024.11', memo: '경포대 & 안목해변 카페' },
  { name: '속초', coords: [128.591, 38.207] as [number, number], date: '2024.11', memo: '설악산 케이블카' },
  { name: '동해', coords: [129.114, 37.524] as [number, number], date: '2024.11', memo: '묵호항 일출' },
];

const WORLD_PLACES = [
  { name: 'Hong Kong', nameKr: '홍콩', flag: '🇭🇰', coords: [114.169, 22.319] as [number, number], startDate: '2024.07.15', endDate: '2024.07.19', memo: '빅토리아 피크 야경' },
  { name: 'Macau', nameKr: '마카오', flag: '🇲🇴', coords: [113.543, 22.198] as [number, number], startDate: '2024.07.19', endDate: '2024.07.21', memo: '세나도 광장 & 에그타르트' },
  { name: 'Da Nang', nameKr: '다낭', flag: '🇻🇳', coords: [108.202, 16.054] as [number, number], startDate: '2025.01.10', endDate: '2025.01.15', memo: '바나힐 & 미케비치' },
  { name: 'New Zealand', nameKr: '뉴질랜드', flag: '🇳🇿', coords: [174.763, -36.848] as [number, number], startDate: '2025.02.20', endDate: '2025.03.02', memo: '남섬 로드트립' },
];

const VISITED_COUNTRIES = ['China', 'Vietnam', 'New Zealand'];

const TIMELINE = [
  { date: '2024.03.14', title: '첫 데이트', place: '홍대 카페거리', cat: 'cafe' },
  { date: '2024.04.20', title: '벚꽃 나들이', place: '여의도 한강공원', cat: 'outdoor' },
  { date: '2024.06.15', title: '부산 여행', place: '해운대', cat: 'travel' },
  { date: '2024.08.10', title: '100일 기념', place: '이태원 레스토랑', cat: 'restaurant' },
  { date: '2024.12.25', title: '크리스마스', place: '명동', cat: 'date' },
];

// ═══════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 150 } },
};
const fadeScale = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, damping: 20, stiffness: 150 } },
};

// ═══════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════
const AuroraBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute w-72 h-72 rounded-full blur-[100px]"
      style={{ background: 'radial-gradient(circle, #F2D7D5 0%, transparent 70%)', top: '-8%', left: '-5%', animation: 'aurora 8s ease-in-out infinite' }} />
    <div className="absolute w-56 h-56 rounded-full blur-[90px]"
      style={{ background: 'radial-gradient(circle, #F0DCC8 0%, transparent 70%)', top: '40%', right: '-10%', animation: 'aurora 10s ease-in-out infinite 2s' }} />
    <div className="absolute w-48 h-48 rounded-full blur-[80px]"
      style={{ background: 'radial-gradient(circle, #E8C9D4 0%, transparent 70%)', bottom: '10%', left: '10%', animation: 'aurora 12s ease-in-out infinite 4s' }} />
  </div>
);

const FloatingHearts = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[
      { size: 12, top: '15%', left: '8%', delay: 0, dur: 3.5 },
      { size: 8, top: '25%', right: '12%', delay: 1.2, dur: 4 },
      { size: 10, top: '60%', left: '85%', delay: 2.5, dur: 3 },
      { size: 6, top: '75%', left: '15%', delay: 0.8, dur: 4.5 },
    ].map((h, i) => (
      <motion.div key={i} className="absolute"
        style={{ top: h.top, left: h.left, right: (h as any).right }}
        animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0], opacity: [0.12, 0.25, 0.12] }}
        transition={{ repeat: Infinity, duration: h.dur, delay: h.delay, ease: 'easeInOut' }}>
        <Heart size={h.size} fill="#C9918F" color="#C9918F" />
      </motion.div>
    ))}
  </div>
);

const Glass = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div variants={fadeUp}
    className={`bg-white/50 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(109,58,93,0.06),inset_0_1px_0_rgba(255,255,255,0.6)] rounded-3xl transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(109,58,93,0.1)] ${className}`}>
    {children}
  </motion.div>
);

const DeepCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div variants={fadeScale}
    className={`bg-gradient-to-br from-plum/90 to-charcoal/95 backdrop-blur-xl border border-plum-light/20 shadow-[0_16px_48px_rgba(43,30,50,0.3)] rounded-3xl overflow-hidden relative ${className}`}>
    {children}
  </motion.div>
);

// ═══════════════════════════════════════
// TAB BUTTON
// ═══════════════════════════════════════
const TabBtn = ({ id, icon: Icon, label, active, set }: { id: string; icon: any; label: string; active: string; set: (s: string) => void }) => {
  const isActive = active === id;
  return (
    <button onClick={() => set(id)}
      className={`relative flex flex-col items-center gap-0.5 border-none bg-transparent p-2 transition-all duration-300 cursor-pointer ${isActive ? 'text-plum' : 'text-warm-gray'}`}>
      {isActive && (
        <motion.div layoutId="tab-glow" className="absolute -inset-1 bg-blush/50 rounded-2xl -z-10"
          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} />
      )}
      <motion.div whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 400 }}>
        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} fill={isActive ? '#6B3A5D' : 'none'} />
      </motion.div>
      <span className={`text-[9px] tracking-wider uppercase ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
  );
};

// ═══════════════════════════════════════
// 1. HOME VIEW
// ═══════════════════════════════════════
const HomeView = () => (
  <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="px-6 space-y-5">
    {/* Header */}
    <motion.div variants={fadeUp} className="flex justify-between items-start pt-2">
      <div>
        <h1 className="font-display text-3xl font-semibold italic text-plum tracking-tight leading-none">
          Happy <span className="text-dusty-rose">&hearts;</span> Paul
        </h1>
        <p className="text-[10px] text-warm-gray mt-1 tracking-[0.2em] uppercase font-medium">our little universe</p>
      </div>
      <div className="flex -space-x-3">
        <div className="w-10 h-10 rounded-full border-[2.5px] border-cream bg-gradient-to-br from-champagne to-blush flex items-center justify-center text-[9px] font-bold text-plum shadow-sm">NG</div>
        <div className="w-10 h-10 rounded-full border-[2.5px] border-cream bg-gradient-to-br from-blush to-dusty-rose/30 flex items-center justify-center text-[9px] font-bold text-plum shadow-sm">WH</div>
      </div>
    </motion.div>

    {/* D-Day Hero */}
    <motion.div variants={fadeScale} className="relative">
      <div className="bg-gradient-to-br from-white/60 via-blush/20 to-champagne/30 backdrop-blur-xl border border-white/70 rounded-[2rem] p-7 text-center relative overflow-hidden shadow-[0_12px_48px_rgba(201,145,143,0.15)]">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full border-[3px] border-dusty-rose/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full border-[2px] border-terracotta/10" />
        <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} className="absolute top-5 right-6 opacity-[0.07]">
          <Heart size={70} fill="#6B3A5D" />
        </motion.div>
        <p className="font-display text-lg italic text-dusty-rose tracking-wide">
          <span className="font-body text-[10px] not-italic uppercase tracking-[0.3em] text-warm-gray block mb-1">since 2024</span>
          나겸 <Heart size={14} className="inline text-dusty-rose fill-dusty-rose mx-1" /> 우현
        </p>
        <h2 className="shimmer-text font-display text-7xl font-bold mt-3 pb-1 tracking-tight leading-none">D+589</h2>
        <p className="text-warm-gray mt-3 text-[11px] font-medium tracking-wide">우리의 사랑이 시작된 지 589일째</p>
      </div>
    </motion.div>

    {/* Bento Grid */}
    <div className="grid grid-cols-2 gap-3">
      <Glass className="col-span-2 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terracotta/15 to-champagne/30 flex items-center justify-center">
            <Sparkles size={16} className="text-terracotta" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.15em] text-warm-gray font-semibold block">Next</span>
            <p className="font-display text-xl font-semibold text-charcoal italic leading-tight">600th Day</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-terracotta bg-terracotta/10 px-2.5 py-0.5 rounded-full">D-11</span>
      </Glass>

      <Glass className="col-span-1 p-4 flex flex-col justify-between min-h-[120px] bg-gradient-to-br from-white/40 to-blush/20!">
        <Plane size={16} className="text-plum-light" />
        <div>
          <p className="font-display text-2xl font-semibold text-charcoal italic leading-tight">4</p>
          <p className="text-[9px] text-warm-gray uppercase tracking-wider mt-0.5">Abroad Travel</p>
        </div>
      </Glass>

      <Glass className="col-span-1 p-4 flex flex-col justify-between min-h-[120px]">
        <MapPin size={16} className="text-dusty-rose" />
        <div>
          <p className="font-display text-2xl font-semibold text-charcoal italic">8</p>
          <p className="text-[9px] text-warm-gray uppercase tracking-wider mt-0.5">Korea Travel</p>
        </div>
      </Glass>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════
// 2. TIMELINE VIEW
// ═══════════════════════════════════════
const CAT_STYLES: Record<string, { bg: string; emoji: string }> = {
  cafe: { bg: 'bg-amber-50 text-amber-700', emoji: '☕' },
  outdoor: { bg: 'bg-emerald-50 text-emerald-600', emoji: '🌿' },
  travel: { bg: 'bg-sky-50 text-sky-600', emoji: '✈️' },
  restaurant: { bg: 'bg-terracotta/10 text-terracotta', emoji: '🍽️' },
  date: { bg: 'bg-plum/10 text-plum', emoji: '💑' },
};

const TimelineView = () => {
  const [filter, setFilter] = useState('all');
  const cats = [
    { id: 'all', label: '전체' }, { id: 'cafe', label: '카페' },
    { id: 'restaurant', label: '맛집' }, { id: 'travel', label: '여행' },
    { id: 'outdoor', label: '야외' }, { id: 'date', label: '데이트' },
  ];
  const filtered = filter === 'all' ? TIMELINE : TIMELINE.filter(d => d.cat === filter);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="px-6 space-y-5">
      <motion.div variants={fadeUp} className="pt-2">
        <h2 className="font-display text-3xl italic text-charcoal">Our Story</h2>
        <p className="text-[10px] text-warm-gray mt-1 tracking-[0.15em] uppercase">every moment matters</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {cats.map(c => (
          <button key={c.id} onClick={() => setFilter(c.id)}
            className={`px-4 py-2 rounded-full text-[10px] font-semibold tracking-wide whitespace-nowrap border-none cursor-pointer transition-all duration-300
              ${filter === c.id ? 'bg-plum text-white shadow-[0_4px_16px_rgba(107,58,93,0.3)]' : 'bg-white/60 text-warm-gray hover:bg-white/80 shadow-sm'}`}>
            {c.label}
          </button>
        ))}
      </motion.div>

      <div className="ml-3 border-l-[2px] border-blush pl-7 space-y-6 relative">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, idx) => (
            <motion.div key={item.date}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200, delay: idx * 0.06 }}
              className="relative">
              <div className="absolute -left-[33px] top-3 w-4 h-4 rounded-full bg-dusty-rose border-[3px] border-cream shadow-[0_0_0_3px_rgba(201,145,143,0.2)]" />
              <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl p-5 shadow-[0_4px_24px_rgba(109,58,93,0.06)] hover:shadow-[0_8px_32px_rgba(109,58,93,0.1)] transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold text-dusty-rose tracking-wider">{item.date}</span>
                    <h4 className="font-display text-lg italic text-charcoal mt-0.5 leading-tight">{item.title}</h4>
                    <p className="text-[10px] text-warm-gray flex items-center gap-1 mt-2"><MapPin size={10} strokeWidth={2.5} /> {item.place}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${CAT_STYLES[item.cat].bg}`}>
                    {CAT_STYLES[item.cat].emoji}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// 3. KOREA MAP VIEW
// ═══════════════════════════════════════
// Match visited cities to municipality NAME_1 (metro cities) or NAME_2 (counties/cities)
const VISITED_METROS = new Set(['Seoul', 'Incheon']);
const VISITED_MUNICIPALITIES = new Set(['Chuncheon', 'Hongcheon', 'Wonju', 'Gangneung', 'Sokcho', 'Donghae']);

const KoreaMapView = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="px-6 space-y-5">
      <motion.div variants={fadeUp} className="flex justify-between items-end pt-2">
        <div>
          <h2 className="font-display text-3xl italic text-charcoal">Korea</h2>
          <p className="text-[10px] text-warm-gray mt-1 tracking-[0.15em] uppercase">우리가 함께한 곳</p>
        </div>
        <span className="text-[10px] font-bold text-plum bg-blush/50 px-3 py-1 rounded-full">{KR_CITIES.length}개 도시</span>
      </motion.div>

      {/* Municipality-level Korea Map */}
      <motion.div variants={fadeScale} className="relative">
        <div className="bg-gradient-to-b from-champagne/20 via-white/40 to-blush/10 border border-white/60 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(109,58,93,0.08)]">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [127.8, 36.0], scale: 5800 }}
            width={400} height={520}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter(geo => ['North Korea', 'N. Korea', 'Japan', 'China'].some(n => geo.properties.name?.includes(n)))
                  .map(geo => (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill="#F0EBE3" stroke="#E0D8D0" strokeWidth={0.5}
                      style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }} />
                  ))
              }
            </Geographies>

            <Geographies geography="/geo/korea-municipalities.json">
              {({ geographies }) =>
                geographies.map(geo => {
                  const province = geo.properties.NAME_1;
                  const city = geo.properties.NAME_2;
                  const isVisited = VISITED_METROS.has(province) || VISITED_MUNICIPALITIES.has(city);
                  const isHovered = hovered === `${province}-${city}`;
                  return (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill={isHovered ? '#E8B4B2' : isVisited ? '#F2D7D5' : '#FAF0ED'}
                      stroke={isVisited ? '#C9918F' : '#E8DDD8'} strokeWidth={0.3}
                      onMouseEnter={() => setHovered(`${province}-${city}`)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        default: { outline: 'none', transition: 'fill 0.2s' },
                        hover: { outline: 'none', fill: '#E8B4B2' },
                        pressed: { outline: 'none' },
                      }} />
                  );
                })
              }
            </Geographies>

            {KR_CITIES.map((city, i) => (
              <Marker key={city.name} coordinates={city.coords}>
                <circle r={10} fill="#C9918F" opacity={0.15}>
                  <animate attributeName="r" values="6;14;6" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
                  <animate attributeName="opacity" values="0.2;0;0.2" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
                </circle>
                <circle r={4} fill="#6B3A5D" stroke="#FFF8F0" strokeWidth={2} />
                <text textAnchor="middle" y={-12}
                  style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 10, fontWeight: 700,
                    fill: '#2D2A32', paintOrder: 'stroke', stroke: '#FFF8F0',
                    strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                  {city.name}
                </text>
              </Marker>
            ))}
          </ComposableMap>
        </div>
      </motion.div>

      {/* Trip List */}
      <motion.div variants={fadeUp}>
        <p className="text-[9px] text-warm-gray uppercase tracking-[0.2em] mb-3 font-semibold">Travel Log</p>
        <div className="space-y-2.5">
          {KR_CITIES.map((city, i) => (
            <motion.div key={city.name}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="flex items-center gap-3 bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl px-4 py-3 shadow-[0_2px_12px_rgba(109,58,93,0.05)]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blush to-champagne flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-plum" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-base italic text-charcoal">{city.name}</h4>
                  <span className="text-[9px] text-dusty-rose font-semibold bg-blush/30 px-2 py-0.5 rounded-full shrink-0 ml-2">{city.date}</span>
                </div>
                <p className="text-[10px] text-warm-gray mt-0.5 truncate">{city.memo}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// 4. WORLD MAP VIEW
// ═══════════════════════════════════════
const WorldMapView = () => (
  <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="px-6 space-y-5">
    <motion.div variants={fadeUp} className="flex justify-between items-end pt-2">
      <div>
        <h2 className="font-display text-3xl italic text-charcoal">World</h2>
        <p className="text-[10px] text-warm-gray mt-1 tracking-[0.15em] uppercase">our passport stamps</p>
      </div>
      <span className="text-[10px] font-bold text-white bg-gradient-to-r from-plum to-dusty-rose px-3 py-1 rounded-full shadow-lg shadow-plum/20">
        {WORLD_PLACES.length} places
      </span>
    </motion.div>

    {/* World Map */}
    <DeepCard className="p-0">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [130, 5], scale: 200 }}
        width={500}
        height={420}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const name = geo.properties.name;
              const isVisited = VISITED_COUNTRIES.some(c => name?.includes(c));
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isVisited ? '#C9918F' : '#3D3545'}
                  stroke="#4A4252"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: isVisited ? '#D4A0A0' : '#4A4252' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* City markers with glow */}
        {WORLD_PLACES.map((place, i) => (
          <Marker key={place.name} coordinates={place.coords}>
            <circle r={10} fill="#C9918F" opacity={0.3}>
              <animate attributeName="r" values="6;14;6" dur="3s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
            </circle>
            <circle r={4} fill="#F2D7D5" stroke="#FFF8F0" strokeWidth={1.5} />
            <text
              textAnchor="middle"
              y={-10}
              style={{
                fontFamily: 'Pretendard, sans-serif',
                fontSize: 9,
                fontWeight: 700,
                fill: '#F2D7D5',
                paintOrder: 'stroke',
                stroke: 'rgba(45,42,50,0.8)',
                strokeWidth: 2.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }}
            >
              {place.nameKr}
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </DeepCard>

    {/* Trip List */}
    <motion.div variants={fadeUp}>
      <p className="text-[9px] text-warm-gray uppercase tracking-[0.2em] mb-3 font-semibold">Travel Log</p>
      <div className="space-y-2.5">
        {WORLD_PLACES.map((place, i) => (
          <motion.div key={place.name}
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center gap-3 bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl px-4 py-3.5 shadow-[0_2px_12px_rgba(109,58,93,0.05)]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blush to-champagne flex items-center justify-center shrink-0">
              <span className="text-xl">{place.flag}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base italic text-charcoal">{place.nameKr}</h4>
                <span className="text-[8px] text-warm-gray font-medium shrink-0 ml-2">{place.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-dusty-rose font-semibold flex items-center gap-1">
                  <Calendar size={9} /> {place.startDate} ~ {place.endDate}
                </span>
              </div>
              <p className="text-[10px] text-warm-gray mt-0.5 truncate">{place.memo}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>

    {/* Dream destinations */}
    <motion.div variants={fadeUp}>
      <p className="text-[9px] text-warm-gray uppercase tracking-[0.2em] mb-3 px-1 font-semibold">Dream Destinations</p>
      <div className="flex gap-2 flex-wrap">
        {['Switzerland 🇨🇭', 'Iceland 🇮🇸', 'Greece 🇬🇷', 'Hawaii 🌺'].map(d => (
          <span key={d} className="text-[10px] text-plum-light bg-blush/30 px-3 py-1.5 rounded-full border border-blush/50 font-medium">{d}</span>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

// ═══════════════════════════════════════
// APP
// ═══════════════════════════════════════
const App = () => {
  const [tab, setTab] = useState('home');

  return (
    <div className="min-h-screen bg-cream flex justify-center items-center p-0 md:p-6 font-body">
      <div className="w-full h-dvh md:w-[390px] md:h-[844px] bg-cream md:rounded-[3.5rem] md:shadow-[0_25px_80px_rgba(45,42,50,0.15)] md:border-[7px] md:border-charcoal/90 overflow-hidden relative flex flex-col">

        {/* Desktop-only status bar */}
        <div className="hidden md:flex h-12 w-full justify-between items-center px-8 pt-5 pb-2 z-50">
          <span className="text-[11px] font-semibold text-charcoal/60 tracking-wide">9:41</span>
          <div className="w-[90px] h-[25px] bg-charcoal rounded-full" />
          <div className="flex gap-1 items-center">
            <div className="w-[18px] h-[10px] rounded-sm border-[1.5px] border-charcoal/50" />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-28 pt-4 md:pt-2 relative">
          <AuroraBackground />
          <FloatingHearts />
          <AnimatePresence mode="wait">
            {tab === 'home' && <HomeView key="home" />}
            {tab === 'korea' && <KoreaMapView key="korea" />}
            {tab === 'world' && <WorldMapView key="world" />}
          </AnimatePresence>
        </div>

        {/* Bottom navigation */}
        <nav className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] max-w-[340px] h-[72px] bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-white/80 shadow-[0_8px_40px_rgba(109,58,93,0.12)] z-50 flex items-center justify-around px-3">
          <TabBtn id="home" icon={Heart} label="Home" active={tab} set={setTab} />
          <TabBtn id="korea" icon={MapPin} label="Korea" active={tab} set={setTab} />
          <TabBtn id="world" icon={Globe} label="World" active={tab} set={setTab} />
        </nav>
      </div>
    </div>
  );
};

export default App;
