import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MapPin, Globe, Calendar,
  Plane, Sparkles, Camera, Plus, X, Trash2, Pencil
} from 'lucide-react';
import { supabase } from './supabase';
import {
  ComposableMap, Geographies, Geography, Marker
} from 'react-simple-maps';

// ═══════════════════════════════════════
// DATA & TYPES
// ═══════════════════════════════════════
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type KoreaTravel = {
  id: string; name: string; lng: number; lat: number; date: string; memo: string;
  emoji: string; gradient: string; map_name: string; is_metro: boolean;
  label_dx: number; label_dy: number; created_at: string;
};
type WorldTravel = {
  id: string; name: string; name_kr: string; flag: string; lng: number; lat: number;
  start_date: string; end_date: string; memo: string; emoji: string; gradient: string;
  map_countries: string; created_at: string;
};

// Country code → flag emoji
const ccToFlag = (cc: string) => cc.toUpperCase().replace(/./g, c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65));

// Geocoding via OpenStreetMap Nominatim
const geocode = async (query: string, country?: string): Promise<{ lng: number; lat: number; displayName: string; engName: string; countryCode: string; flag: string } | null> => {
  try {
    const params = new URLSearchParams({ q: query, format: 'json', limit: '1', 'accept-language': 'en', addressdetails: '1' });
    if (country) params.set('countrycodes', country);
    const res = await window.fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    const data = await res.json();
    if (data.length === 0) return null;
    const { lon, lat, display_name, name, address } = data[0];
    const cc = address?.country_code || '';
    return { lng: parseFloat(lon), lat: parseFloat(lat), displayName: display_name, engName: name, countryCode: cc, flag: cc ? ccToFlag(cc) : '' };
  } catch { return null; }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDebounce = (ms: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (fn: () => void) => { clearTimeout(timer); timer = setTimeout(fn, ms); };
};

const EMOJI_OPTIONS = ['📍','🏙️','🌊','🏔️','🎢','🍗','☕','🏡','🛍️','🔐','⛷️','🌅','🪨','🌉','🚡','🥟','🍞','🏯','🏠','🎡','🏖️','🌃','🎰','🐑','✈️','🗼','🎭','🍜'];
const GRADIENT_OPTIONS = [
  'from-indigo-100 to-violet-100', 'from-red-100 to-rose-100', 'from-cyan-100 to-sky-100',
  'from-emerald-100 to-teal-100', 'from-amber-100 to-orange-100', 'from-pink-100 to-fuchsia-100',
  'from-yellow-100 to-amber-100', 'from-sky-100 to-blue-100', 'from-green-100 to-emerald-100',
  'from-violet-100 to-purple-100', 'from-rose-100 to-pink-100', 'from-orange-100 to-rose-100',
  'from-lime-100 to-emerald-100', 'from-stone-100 to-gray-200', 'from-yellow-100 to-green-100',
  'from-purple-100 to-indigo-100',
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
const START_DATE = new Date('2024-07-25T00:00:00+09:00');

// Gallery image crop component — KakaoTalk-style crop box
const GalleryCropView = ({ src, onDone, onCancel }: { src: string; onDone: (blob: Blob) => void; onCancel: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  // crop box in display coordinates
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const dragMode = useRef<'move' | 'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0, cw: 0, ch: 0 });

  const CONTAINER_W = 300;
  const MIN_CROP = 40;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // fit image into container width
      const ratio = CONTAINER_W / img.width;
      const dw = CONTAINER_W;
      const dh = Math.round(img.height * ratio);
      setDisplaySize({ w: dw, h: dh });
      // default crop: centered, 80% of the smaller dimension
      const side = Math.min(dw, dh) * 0.8;
      setCrop({ x: (dw - side) / 2, y: (dh - side) / 2, w: side, h: side });
      setImgLoaded(true);
    };
    img.src = src;
  }, [src]);

  const clampCrop = (c: { x: number; y: number; w: number; h: number }) => {
    let { x, y, w, h } = c;
    w = Math.max(MIN_CROP, Math.min(w, displaySize.w));
    h = Math.max(MIN_CROP, Math.min(h, displaySize.h));
    x = Math.max(0, Math.min(x, displaySize.w - w));
    y = Math.max(0, Math.min(y, displaySize.h - h));
    return { x, y, w, h };
  };

  const getPointerPos = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { px: e.clientX - rect.left, py: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent, mode: 'move' | 'tl' | 'tr' | 'bl' | 'br') => {
    e.preventDefault();
    e.stopPropagation();
    dragMode.current = mode;
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y, cw: crop.w, ch: crop.h };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragMode.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const { cx, cy, cw, ch } = dragStart.current;

    if (dragMode.current === 'move') {
      setCrop(clampCrop({ x: cx + dx, y: cy + dy, w: cw, h: ch }));
    } else {
      let nx = cx, ny = cy, nw = cw, nh = ch;
      if (dragMode.current === 'tl') { nx = cx + dx; ny = cy + dy; nw = cw - dx; nh = ch - dy; }
      else if (dragMode.current === 'tr') { ny = cy + dy; nw = cw + dx; nh = ch - dy; }
      else if (dragMode.current === 'bl') { nx = cx + dx; nw = cw - dx; nh = ch + dy; }
      else if (dragMode.current === 'br') { nw = cw + dx; nh = ch + dy; }
      setCrop(clampCrop({ x: nx, y: ny, w: nw, h: nh }));
    }
  };

  const onPointerUp = () => { dragMode.current = null; };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !canvasRef.current) return;
    const scaleX = img.width / displaySize.w;
    const scaleY = img.height / displaySize.h;
    const sx = crop.x * scaleX;
    const sy = crop.y * scaleY;
    const sw = crop.w * scaleX;
    const sh = crop.h * scaleY;
    // Output max 1200px wide, keep aspect ratio
    const maxOut = 1200;
    const outW = sw > sh ? maxOut : Math.round(maxOut * (sw / sh));
    const outH = sh > sw ? maxOut : Math.round(maxOut * (sh / sw));
    const canvas = canvasRef.current;
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    canvas.toBlob(blob => { if (blob) onDone(blob); }, 'image/jpeg', 0.9);
  };

  if (!imgLoaded) return <div className="h-48 flex items-center justify-center text-warm-gray text-xs">로딩 중...</div>;

  const handle = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
    const cursors = { tl: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize', br: 'nwse-resize' };
    const positions = {
      tl: { left: crop.x - 6, top: crop.y - 6 },
      tr: { left: crop.x + crop.w - 6, top: crop.y - 6 },
      bl: { left: crop.x - 6, top: crop.y + crop.h - 6 },
      br: { left: crop.x + crop.w - 6, top: crop.y + crop.h - 6 },
    };
    return (
      <div
        onPointerDown={e => onPointerDown(e, corner)}
        style={{ position: 'absolute', ...positions[corner], width: 12, height: 12, cursor: cursors[corner], zIndex: 3 }}>
        <div style={{
          width: 12, height: 12, borderRadius: 2, background: '#fff',
          border: '2px solid #C9918F', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div ref={containerRef}
          style={{ width: displaySize.w, height: displaySize.h, position: 'relative', touchAction: 'none', userSelect: 'none' }}
          className="rounded-xl overflow-hidden"
          onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
          {/* Image */}
          <img src={src} alt="crop" draggable={false}
            style={{ width: displaySize.w, height: displaySize.h, display: 'block', pointerEvents: 'none' }} />
          {/* Dark overlay — 4 rects around the crop box */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: displaySize.w, height: crop.y, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'absolute', top: crop.y, left: 0, width: crop.x, height: crop.h, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'absolute', top: crop.y, left: crop.x + crop.w, width: displaySize.w - crop.x - crop.w, height: crop.h, background: 'rgba(0,0,0,0.45)' }} />
          <div style={{ position: 'absolute', top: crop.y + crop.h, left: 0, width: displaySize.w, height: displaySize.h - crop.y - crop.h, background: 'rgba(0,0,0,0.45)' }} />
          {/* Crop border */}
          <div style={{ position: 'absolute', left: crop.x, top: crop.y, width: crop.w, height: crop.h, border: '2px solid #fff', boxSizing: 'border-box', zIndex: 2 }}>
            {/* Grid lines */}
            <div style={{ position: 'absolute', left: '33.33%', top: 0, width: 1, height: '100%', background: 'rgba(255,255,255,0.3)' }} />
            <div style={{ position: 'absolute', left: '66.66%', top: 0, width: 1, height: '100%', background: 'rgba(255,255,255,0.3)' }} />
            <div style={{ position: 'absolute', top: '33.33%', left: 0, height: 1, width: '100%', background: 'rgba(255,255,255,0.3)' }} />
            <div style={{ position: 'absolute', top: '66.66%', left: 0, height: 1, width: '100%', background: 'rgba(255,255,255,0.3)' }} />
          </div>
          {/* Drag area (move crop box) */}
          <div
            onPointerDown={e => onPointerDown(e, 'move')}
            style={{ position: 'absolute', left: crop.x, top: crop.y, width: crop.w, height: crop.h, cursor: 'move', zIndex: 2 }} />
          {/* Corner handles */}
          {handle('tl')}{handle('tr')}{handle('bl')}{handle('br')}
        </div>
      </div>
      <p className="text-[10px] text-warm-gray text-center">네모를 드래그해서 원하는 부분을 선택하세요</p>
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 text-warm-gray text-sm border-none cursor-pointer">다른 사진</button>
        <button onClick={handleConfirm}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-dusty-rose to-plum text-white text-sm font-semibold border-none cursor-pointer shadow-lg">확인</button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

const DEFAULT_PROFILES = {
  ng: 'https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg',
  wh: 'https://cdn.pixabay.com/photo/2023/08/18/15/02/dog-8198719_640.jpg',
};

const ProfileCropModal = ({ onDone, onClose }: { onDone: (blob: Blob) => void; onClose: () => void }) => {
  const [src, setSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const dragMode = useRef<'move' | 'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0, cw: 0, ch: 0 });

  const CONTAINER_W = 280;
  const MIN_CROP = 40;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const ratio = CONTAINER_W / img.width;
      const dw = CONTAINER_W;
      const dh = Math.round(img.height * ratio);
      setDisplaySize({ w: dw, h: dh });
      // Default: square crop centered, 70% of smaller side
      const side = Math.min(dw, dh) * 0.7;
      setCrop({ x: (dw - side) / 2, y: (dh - side) / 2, w: side, h: side });
      setSrc(url);
    };
    img.src = url;
  };

  const clampCrop = (c: { x: number; y: number; w: number; h: number }) => {
    let { x, y, w, h } = c;
    // Keep square
    const size = Math.max(MIN_CROP, Math.min(w, h, displaySize.w, displaySize.h));
    w = size; h = size;
    x = Math.max(0, Math.min(x, displaySize.w - w));
    y = Math.max(0, Math.min(y, displaySize.h - h));
    return { x, y, w, h };
  };

  const onPointerDown = (e: React.PointerEvent, mode: 'move' | 'tl' | 'tr' | 'bl' | 'br') => {
    e.preventDefault();
    e.stopPropagation();
    dragMode.current = mode;
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y, cw: crop.w, ch: crop.h };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragMode.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const { cx, cy, cw, ch } = dragStart.current;

    if (dragMode.current === 'move') {
      setCrop(clampCrop({ x: cx + dx, y: cy + dy, w: cw, h: ch }));
    } else {
      // For square constraint, use the larger delta
      const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      let ns = cw;
      if (dragMode.current === 'tl') ns = cw - d;
      else if (dragMode.current === 'br') ns = cw + d;
      else if (dragMode.current === 'tr') ns = cw + d;
      else if (dragMode.current === 'bl') ns = cw - d;
      ns = Math.max(MIN_CROP, ns);
      let nx = cx, ny = cy;
      if (dragMode.current === 'tl') { nx = cx + (cw - ns); ny = cy + (ch - ns); }
      else if (dragMode.current === 'tr') { ny = cy + (ch - ns); }
      else if (dragMode.current === 'bl') { nx = cx + (cw - ns); }
      setCrop(clampCrop({ x: nx, y: ny, w: ns, h: ns }));
    }
  };

  const onPointerUp = () => { dragMode.current = null; };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !canvasRef.current) return;
    const scaleX = img.width / displaySize.w;
    const scaleY = img.height / displaySize.h;
    const sx = crop.x * scaleX;
    const sy = crop.y * scaleY;
    const sw = crop.w * scaleX;
    const sh = crop.h * scaleY;
    const size = 256;
    const canvas = canvasRef.current;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    // Circle clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    canvas.toBlob(blob => { if (blob) onDone(blob); }, 'image/jpeg', 0.9);
  };

  const handle = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
    const positions = {
      tl: { left: crop.x - 6, top: crop.y - 6 },
      tr: { left: crop.x + crop.w - 6, top: crop.y - 6 },
      bl: { left: crop.x - 6, top: crop.y + crop.h - 6 },
      br: { left: crop.x + crop.w - 6, top: crop.y + crop.h - 6 },
    };
    const cursors = { tl: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize', br: 'nwse-resize' };
    return (
      <div onPointerDown={e => onPointerDown(e, corner)}
        style={{ position: 'absolute', ...positions[corner], width: 12, height: 12, cursor: cursors[corner], zIndex: 3 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: '#fff', border: '2px solid #C9918F', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-charcoal/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-cream rounded-3xl p-5 w-full max-w-[320px] shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg italic text-charcoal">프로필 사진</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-warm-gray"><X size={18} /></button>
        </div>

        {!src ? (
          <>
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-40 rounded-2xl border-2 border-dashed border-blush flex flex-col items-center justify-center gap-2 bg-white/30 cursor-pointer">
              <Camera size={28} className="text-dusty-rose" />
              <span className="text-[11px] text-warm-gray">사진을 선택하세요</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div ref={containerRef}
                style={{ width: displaySize.w, height: displaySize.h, position: 'relative', touchAction: 'none', userSelect: 'none' }}
                className="rounded-xl overflow-hidden"
                onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
                <img src={src} alt="crop" draggable={false}
                  style={{ width: displaySize.w, height: displaySize.h, display: 'block', pointerEvents: 'none' }} />
                {/* Dark overlay */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: displaySize.w, height: crop.y, background: 'rgba(0,0,0,0.45)' }} />
                <div style={{ position: 'absolute', top: crop.y, left: 0, width: crop.x, height: crop.h, background: 'rgba(0,0,0,0.45)' }} />
                <div style={{ position: 'absolute', top: crop.y, left: crop.x + crop.w, width: displaySize.w - crop.x - crop.w, height: crop.h, background: 'rgba(0,0,0,0.45)' }} />
                <div style={{ position: 'absolute', top: crop.y + crop.h, left: 0, width: displaySize.w, height: displaySize.h - crop.y - crop.h, background: 'rgba(0,0,0,0.45)' }} />
                {/* Circle preview overlay */}
                <div style={{
                  position: 'absolute', left: crop.x, top: crop.y, width: crop.w, height: crop.h,
                  borderRadius: '50%', border: '2px solid #fff', boxSizing: 'border-box', zIndex: 2,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.15)',
                }} />
                {/* Drag area */}
                <div onPointerDown={e => onPointerDown(e, 'move')}
                  style={{ position: 'absolute', left: crop.x, top: crop.y, width: crop.w, height: crop.h, cursor: 'move', zIndex: 2, borderRadius: '50%' }} />
                {handle('tl')}{handle('tr')}{handle('bl')}{handle('br')}
              </div>
            </div>
            <p className="text-[10px] text-warm-gray text-center">원을 드래그해서 원하는 부분을 선택하세요</p>
            <div className="flex gap-2">
              <button onClick={() => { setSrc(null); setDisplaySize({ w: 0, h: 0 }); }}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-warm-gray text-sm border-none cursor-pointer">다른 사진</button>
              <button onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-dusty-rose to-plum text-white text-sm font-semibold border-none cursor-pointer shadow-lg">완료</button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

const HomeView = () => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const dday = Math.floor((now.getTime() - START_DATE.getTime()) / 86400000) + 1;
  const [koreaCount, setKoreaCount] = useState(0);
  const [worldCount, setWorldCount] = useState(0);
  const [profileNg, setProfileNg] = useState(DEFAULT_PROFILES.ng);
  const [profileWh, setProfileWh] = useState(DEFAULT_PROFILES.wh);
  const [editingProfile, setEditingProfile] = useState<'ng' | 'wh' | null>(null);

  useEffect(() => {
    supabase.from('korea_travels').select('id', { count: 'exact', head: true }).then(({ count }) => setKoreaCount(count || 0));
    supabase.from('world_travels').select('id', { count: 'exact', head: true }).then(({ count }) => setWorldCount(count || 0));
    // Load saved profiles
    const { data: ngData } = supabase.storage.from('photos').getPublicUrl('profile-ng.jpg');
    const { data: whData } = supabase.storage.from('photos').getPublicUrl('profile-wh.jpg');
    // Check if custom profiles exist by trying to load them
    const img1 = new Image();
    img1.onload = () => setProfileNg(ngData.publicUrl + '?t=' + Date.now());
    img1.onerror = () => {};
    img1.src = ngData.publicUrl + '?t=' + Date.now();
    const img2 = new Image();
    img2.onload = () => setProfileWh(whData.publicUrl + '?t=' + Date.now());
    img2.onerror = () => {};
    img2.src = whData.publicUrl + '?t=' + Date.now();
  }, []);

  const handleProfileDone = async (blob: Blob) => {
    if (!editingProfile) return;
    const who = editingProfile;
    const fileName = `profile-${who}.jpg`;
    const setter = who === 'ng' ? setProfileNg : setProfileWh;
    // Immediately show preview from blob
    setter(URL.createObjectURL(blob));
    setEditingProfile(null);
    // Upload in background
    await supabase.storage.from('photos').remove([fileName]);
    const { error } = await supabase.storage.from('photos').upload(fileName, blob, { contentType: 'image/jpeg' });
    if (error) { alert('프로필 업로드 실패: ' + error.message); return; }
    const { data } = supabase.storage.from('photos').getPublicUrl(fileName);
    setter(data.publicUrl + '?t=' + Date.now());
  };

  // Milestones: 600일, 2주년(2026.07.25), 1000일, ...
  const anniversary2 = Math.floor((new Date('2026-07-25T00:00:00+09:00').getTime() - START_DATE.getTime()) / 86400000) + 1;
  const milestones = [
    { day: 600, label: '600th Day' },
    { day: anniversary2, label: '2nd Anniversary' },
    { day: 1000, label: '1000th Day' },
  ];
  const nextMilestone = milestones.find(m => m.day > dday) || milestones[milestones.length - 1];
  const daysUntilNext = nextMilestone.day - dday;
  return (
  <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="px-6 space-y-5">
    {/* Header with profiles */}
    <motion.div variants={fadeUp} className="flex justify-between items-start pt-2">
      <div>
        <h1 className="font-display text-3xl font-semibold italic text-plum tracking-tight leading-none">
          Happy <span className="text-dusty-rose">&hearts;</span> Paul
        </h1>
        <p className="text-[10px] text-warm-gray mt-1 tracking-[0.2em] uppercase font-medium">our little universe</p>
      </div>
      <div className="flex -space-x-2">
        <div className="w-11 h-11 rounded-full border-[2.5px] border-cream shadow-md overflow-hidden cursor-pointer" onClick={() => setEditingProfile('ng')}>
          <img src={profileNg} alt="cat" className="w-full h-full object-cover" />
        </div>
        <div className="w-11 h-11 rounded-full border-[2.5px] border-cream shadow-md overflow-hidden cursor-pointer" onClick={() => setEditingProfile('wh')}>
          <img src={profileWh} alt="golden" className="w-full h-full object-cover" />
        </div>
      </div>
    </motion.div>

    {/* D-Day Hero Card */}
    <motion.div variants={fadeScale} className="relative">
      <div className="bg-gradient-to-br from-white/70 via-blush/25 to-champagne/40 backdrop-blur-xl border border-white/70 rounded-[2rem] p-7 text-center relative overflow-hidden shadow-[0_12px_48px_rgba(201,145,143,0.18)]">
        {/* Floral decorations */}
        <div className="absolute -top-3 -left-3 text-3xl opacity-20 rotate-[-15deg]">🌸</div>
        <div className="absolute -top-1 right-8 text-2xl opacity-15 rotate-[20deg]">🌷</div>
        <div className="absolute bottom-3 -right-1 text-2xl opacity-15 rotate-[-10deg]">🌿</div>
        <div className="absolute bottom-2 left-6 text-xl opacity-10 rotate-[25deg]">🌺</div>

        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full border-[3px] border-dusty-rose/8" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full border-[2px] border-terracotta/8" />
        <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }} className="absolute top-5 right-6 opacity-[0.06]">
          <Heart size={70} fill="#6B3A5D" />
        </motion.div>

        {/* Profile pair */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full border-[3px] border-white shadow-lg overflow-hidden mx-auto cursor-pointer" onClick={() => setEditingProfile('ng')}>
              <img src={profileNg} alt="나겸" className="w-full h-full object-cover" />
            </motion.div>
            <p className="text-[11px] font-semibold text-plum mt-1.5">나겸</p>
          </div>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
            <Heart size={22} className="text-dusty-rose fill-dusty-rose" />
          </motion.div>
          <div className="text-center">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
              className="w-16 h-16 rounded-full border-[3px] border-white shadow-lg overflow-hidden mx-auto cursor-pointer" onClick={() => setEditingProfile('wh')}>
              <img src={profileWh} alt="우현" className="w-full h-full object-cover" />
            </motion.div>
            <p className="text-[11px] font-semibold text-plum mt-1.5">우현</p>
          </div>
        </div>

        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-warm-gray mb-1">since 2024.07.25</p>
        <h2 className="shimmer-text font-display text-7xl font-bold mt-1 pb-1 tracking-tight leading-none">D+{dday}</h2>
        <p className="text-warm-gray mt-3 text-[11px] font-medium tracking-wide">우리의 사랑이 시작된 지 {dday}일째</p>
      </div>
    </motion.div>

    {/* Bento Grid */}
    <div className="grid grid-cols-2 gap-3">
      <Glass className="col-span-2 p-5 flex items-center justify-between relative overflow-hidden">
        <div className="absolute -right-2 -top-2 text-3xl opacity-10 rotate-12">🎉</div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terracotta/15 to-champagne/30 flex items-center justify-center">
            <Sparkles size={16} className="text-terracotta" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-[0.15em] text-warm-gray font-semibold block">Next Milestone</span>
            <p className="font-display text-xl font-semibold text-charcoal italic leading-tight">{nextMilestone.label}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-terracotta bg-terracotta/10 px-2.5 py-0.5 rounded-full">D-{daysUntilNext}</span>
      </Glass>

      <Glass className="col-span-1 p-4 flex flex-col justify-between min-h-[120px] bg-gradient-to-br from-white/40 to-blush/20! relative overflow-hidden">
        <div className="absolute -bottom-1 -right-1 text-2xl opacity-10">✈️</div>
        <Plane size={16} className="text-plum-light" />
        <div>
          <p className="font-display text-2xl font-semibold text-charcoal italic leading-tight">{worldCount}</p>
          <p className="text-[9px] text-warm-gray uppercase tracking-wider mt-0.5">Abroad Travel</p>
        </div>
      </Glass>

      <Glass className="col-span-1 p-4 flex flex-col justify-between min-h-[120px] relative overflow-hidden">
        <div className="absolute -bottom-1 -right-1 text-2xl opacity-10">🗺️</div>
        <MapPin size={16} className="text-dusty-rose" />
        <div>
          <p className="font-display text-2xl font-semibold text-charcoal italic">{koreaCount}</p>
          <p className="text-[9px] text-warm-gray uppercase tracking-wider mt-0.5">Korea Travel</p>
        </div>
      </Glass>
    </div>

    {/* Love quote */}
    <motion.div variants={fadeUp} className="text-center py-2">
      <p className="font-display text-sm italic text-dusty-rose/60 leading-relaxed">"Every love story is beautiful,<br/>but ours is my favorite."</p>
    </motion.div>

    {/* Profile Crop Modal */}
    <AnimatePresence>
      {editingProfile && <ProfileCropModal onDone={handleProfileDone} onClose={() => setEditingProfile(null)} />}
    </AnimatePresence>
  </motion.div>
);
};

// ═══════════════════════════════════════
// 3. KOREA MAP VIEW
// ═══════════════════════════════════════
const KoreaMapView = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [cities, setCities] = useState<KoreaTravel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [pinOk, setPinOk] = useState(false);
  const [pin, setPin] = useState('');
  const [delTarget, setDelTarget] = useState<KoreaTravel | null>(null);
  const [delPin, setDelPin] = useState('');
  const [editTarget, setEditTarget] = useState<KoreaTravel | null>(null);
  const [form, setForm] = useState({ name: '', lng: '', lat: '', date: '', memo: '', emoji: '📍', gradient: GRADIENT_OPTIONS[0], map_name: '', is_metro: false });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');

  const fetch = async () => {
    const { data } = await supabase.from('korea_travels').select('*').order('date', { ascending: false });
    if (data) setCities(data);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const visitedMetros = new Set(cities.filter(c => c.is_metro).map(c => c.map_name));
  const visitedMunis = new Set(cities.filter(c => !c.is_metro).map(c => c.map_name));

  const doGeocode = async (name: string) => {
    if (name.length < 2) { setGeoStatus(''); return; }
    setGeoLoading(true); setGeoStatus('검색 중...');
    const result = await geocode(name, 'kr');
    if (result) {
      setForm(f => ({ ...f, lng: String(result.lng), lat: String(result.lat), map_name: result.engName }));
      setGeoStatus(`${result.engName} (${result.lng.toFixed(3)}, ${result.lat.toFixed(3)})`);
    } else {
      setGeoStatus('위치를 찾을 수 없어요');
    }
    setGeoLoading(false);
  };
  const debounceRef = useRef(makeDebounce(600));
  const handleGeocode = (name: string) => { setForm(f => ({ ...f, name })); debounceRef.current(() => doGeocode(name)); };

  const resetForm = () => setForm({ name: '', lng: '', lat: '', date: '', memo: '', emoji: '📍', gradient: GRADIENT_OPTIONS[0], map_name: '', is_metro: false });

  const openEdit = (c: KoreaTravel) => {
    setEditTarget(c);
    setForm({ name: c.name, lng: String(c.lng), lat: String(c.lat), date: c.date, memo: c.memo, emoji: c.emoji, gradient: c.gradient, map_name: c.map_name, is_metro: c.is_metro });
    setGeoStatus('');
    setPinOk(true);
    setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!form.name || !form.lng || !form.lat) return;
    const payload = {
      name: form.name, lng: parseFloat(form.lng), lat: parseFloat(form.lat),
      date: form.date, memo: form.memo, emoji: form.emoji, gradient: form.gradient,
      map_name: form.map_name || form.name, is_metro: form.is_metro,
    };
    if (editTarget) {
      const { error } = await supabase.from('korea_travels').update(payload).eq('id', editTarget.id);
      if (error) { alert('수정 실패: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('korea_travels').insert(payload);
      if (error) { alert('추가 실패: ' + error.message); return; }
    }
    resetForm(); setEditTarget(null); setGeoStatus(''); setShowAdd(false);
    fetch();
  };

  const handleDel = async () => {
    if (!delTarget) return;
    await supabase.from('korea_travels').delete().eq('id', delTarget.id);
    setDelTarget(null); setDelPin('');
    fetch();
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="px-6 space-y-5">
      <motion.div variants={fadeUp} className="flex justify-between items-end pt-2">
        <div>
          <h2 className="font-display text-3xl italic text-charcoal">Korea</h2>
          <p className="text-[10px] text-warm-gray mt-1 tracking-[0.15em] uppercase">우리가 함께한 곳</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-plum bg-blush/50 px-3 py-1 rounded-full">{cities.length}개 도시</span>
          <button onClick={() => setShowAdd(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-dusty-rose to-plum flex items-center justify-center shadow-lg shadow-plum/20 border-none cursor-pointer">
            <Plus size={14} className="text-white" />
          </button>
        </div>
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => { setShowAdd(false); setPinOk(false); setPin(''); setEditTarget(null); resetForm(); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cream rounded-3xl p-5 w-full max-w-[340px] shadow-2xl space-y-3 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              {!pinOk ? (
                <>
                  <h3 className="font-display text-xl italic text-charcoal text-center">PIN</h3>
                  <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value)}
                    className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-2xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose font-display text-charcoal" placeholder="····" />
                  <button onClick={() => { if (pin === UPLOAD_PIN) setPinOk(true); else { setPin(''); alert('PIN이 틀렸어요!'); } }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-dusty-rose to-plum text-white font-semibold text-sm border-none cursor-pointer">확인</button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg italic text-charcoal">{editTarget ? '여행지 수정' : '새 여행지 추가'}</h3>
                    <button onClick={() => { setShowAdd(false); setPinOk(false); setEditTarget(null); resetForm(); }} className="bg-transparent border-none cursor-pointer text-warm-gray"><X size={18} /></button>
                  </div>
                  <div>
                    <input value={form.name} onChange={e => handleGeocode(e.target.value)} placeholder="도시 이름 (예: 부산)"
                      className="w-full py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                    {geoStatus && (
                      <p className={`text-[10px] mt-1 px-1 flex items-center gap-1 ${geoLoading ? 'text-warm-gray' : form.lng ? 'text-emerald-500' : 'text-red-400'}`}>
                        {geoLoading ? <span className="inline-block w-3 h-3 border border-warm-gray border-t-dusty-rose rounded-full animate-spin" /> : form.lng ? '✓' : '✗'} {geoStatus}
                      </p>
                    )}
                  </div>
                  <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="날짜 (예: 2025.03)"
                    className="w-full py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                  <input value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="한줄 메모"
                    className="w-full py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                  <label className="flex items-center gap-2 text-[11px] text-charcoal cursor-pointer">
                    <input type="checkbox" checked={form.is_metro} onChange={e => setForm({ ...form, is_metro: e.target.checked })} className="accent-dusty-rose" />
                    광역시 (전체 색칠)
                  </label>
                  <div>
                    <p className="text-[10px] text-warm-gray mb-1.5">아이콘</p>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_OPTIONS.map(e => (
                        <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                          className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border-none cursor-pointer transition-all ${form.emoji === e ? 'bg-plum/20 scale-110 shadow-sm' : 'bg-white/40 hover:bg-white/60'}`}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-warm-gray mb-1.5">색상</p>
                    <div className="flex flex-wrap gap-1.5">
                      {GRADIENT_OPTIONS.map(g => (
                        <button key={g} onClick={() => setForm({ ...form, gradient: g })}
                          className={`w-7 h-7 rounded-lg bg-gradient-to-br ${g} border-2 cursor-pointer transition-all ${form.gradient === g ? 'border-plum scale-110' : 'border-transparent'}`} />
                      ))}
                    </div>
                  </div>
                  <button onClick={handleAdd} disabled={!form.name || !form.lng || !form.lat}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-dusty-rose to-plum text-white font-semibold text-sm border-none cursor-pointer shadow-lg disabled:opacity-40">{editTarget ? '수정하기' : '추가하기'}</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {delTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => { setDelTarget(null); setDelPin(''); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-cream rounded-3xl p-5 w-full max-w-[300px] shadow-2xl space-y-3 text-center"
              onClick={e => e.stopPropagation()}>
              <p className="text-lg">{delTarget.emoji}</p>
              <p className="font-display text-base italic text-charcoal">{delTarget.name} 삭제할까요?</p>
              <input type="password" inputMode="numeric" maxLength={4} value={delPin} onChange={e => setDelPin(e.target.value)}
                placeholder="PIN 입력" className="w-full text-center text-lg tracking-[0.3em] py-2 rounded-xl border border-red-200 bg-white/60 outline-none focus:border-red-400 text-charcoal" />
              <div className="flex gap-2">
                <button onClick={() => { setDelTarget(null); setDelPin(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-warm-gray text-sm border-none cursor-pointer">취소</button>
                <button onClick={() => { if (delPin === UPLOAD_PIN) handleDel(); else { setDelPin(''); alert('PIN이 틀렸어요!'); } }}
                  className="flex-1 py-2.5 rounded-xl bg-red-400 text-white text-sm font-semibold border-none cursor-pointer">삭제</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <motion.div variants={fadeScale} className="relative">
        <div className="bg-gradient-to-b from-champagne/20 via-white/40 to-blush/10 border border-white/60 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(109,58,93,0.08)]">
          <ComposableMap projection="geoMercator" projectionConfig={{ center: [127.8, 36.5], scale: 5400 }} width={400} height={520} style={{ width: '100%', height: 'auto' }}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) => geographies
                .filter(geo => ['North Korea', 'N. Korea', 'Japan', 'China'].some(n => geo.properties.name?.includes(n)))
                .map(geo => (
                  <Geography key={geo.rsmKey} geography={geo} fill="#F0EBE3" stroke="#E0D8D0" strokeWidth={0.5}
                    style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }} />
                ))}
            </Geographies>
            <Geographies geography="/geo/korea-municipalities.json">
              {({ geographies }) => geographies.map(geo => {
                const province = geo.properties.NAME_1;
                const city = geo.properties.NAME_2;
                const isVisited = visitedMetros.has(province) || visitedMunis.has(city);
                const isHovered = hovered === `${province}-${city}`;
                return (
                  <Geography key={geo.rsmKey} geography={geo}
                    fill={isHovered ? '#E8B4B2' : isVisited ? '#F2D7D5' : '#FAF0ED'}
                    stroke={isVisited ? '#C9918F' : '#E8DDD8'} strokeWidth={0.3}
                    onMouseEnter={() => setHovered(`${province}-${city}`)} onMouseLeave={() => setHovered(null)}
                    style={{ default: { outline: 'none', transition: 'fill 0.2s' }, hover: { outline: 'none', fill: '#E8B4B2' }, pressed: { outline: 'none' } }} />
                );
              })}
            </Geographies>
            {cities.map((c, i) => (
              <Marker key={c.id} coordinates={[c.lng, c.lat]}>
                <circle r={10} fill="#C9918F" opacity={0.15}>
                  <animate attributeName="r" values="6;14;6" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
                  <animate attributeName="opacity" values="0.2;0;0.2" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
                </circle>
                <circle r={3.5} fill="#6B3A5D" stroke="#FFF8F0" strokeWidth={1.5} />
                <text textAnchor={c.label_dx ? (c.label_dx > 0 ? 'start' : 'end') : 'middle'} x={c.label_dx || 0} y={c.label_dy || -10}
                  style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 8, fontWeight: 700, fill: '#2D2A32', paintOrder: 'stroke', stroke: '#FFF8F0', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                  {c.name}
                </text>
              </Marker>
            ))}
          </ComposableMap>
        </div>
      </motion.div>

      {/* Travel Log */}
      <motion.div variants={fadeUp}>
        <p className="text-[9px] text-warm-gray uppercase tracking-[0.2em] mb-3 font-semibold">Travel Log</p>
        <div className="space-y-2.5">
          {loading ? (
            <div className="text-center py-8"><div className="inline-block w-6 h-6 border-2 border-blush border-t-dusty-rose rounded-full animate-spin" /></div>
          ) : cities.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
              className="flex items-center gap-3 bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl px-4 py-3.5 shadow-[0_2px_12px_rgba(109,58,93,0.05)] group">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                <span className="text-xl">{c.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-[15px] italic text-charcoal">{c.name}</h4>
                  <span className="text-[9px] text-dusty-rose font-semibold bg-blush/30 px-2 py-0.5 rounded-full shrink-0 ml-2">{c.date}</span>
                </div>
                {c.memo && <p className="text-[10px] text-warm-gray mt-0.5 truncate">{c.memo}</p>}
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                  className="bg-transparent border-none cursor-pointer text-warm-gray/40 hover:text-plum p-1"><Pencil size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDelTarget(c); }}
                  className="bg-transparent border-none cursor-pointer text-warm-gray/40 hover:text-red-400 p-1"><Trash2 size={13} /></button>
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
const WorldMapView = () => {
  const [places, setPlaces] = useState<WorldTravel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [pinOk, setPinOk] = useState(false);
  const [pin, setPin] = useState('');
  const [delTarget, setDelTarget] = useState<WorldTravel | null>(null);
  const [delPin, setDelPin] = useState('');
  const [editTarget, setEditTarget] = useState<WorldTravel | null>(null);
  const [form, setForm] = useState({ name: '', name_kr: '', flag: '', lng: '', lat: '', start_date: '', end_date: '', memo: '', emoji: '✈️', gradient: GRADIENT_OPTIONS[0], map_countries: '' });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');

  const fetch = async () => {
    const { data } = await supabase.from('world_travels').select('*').order('start_date', { ascending: false });
    if (data) setPlaces(data);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const visitedCountries = [...new Set(places.flatMap(p => (p.map_countries || '').split(',').map(s => s.trim()).filter(Boolean)))];

  const doWorldGeocode = async (nameKr: string) => {
    if (nameKr.length < 2) { setGeoStatus(''); return; }
    setGeoLoading(true); setGeoStatus('검색 중...');
    const result = await geocode(nameKr);
    if (result) {
      setForm(f => ({ ...f, lng: String(result.lng), lat: String(result.lat), name: f.name || result.engName, flag: result.flag || f.flag }));
      setGeoStatus(`${result.flag} ${result.engName} (${result.lng.toFixed(3)}, ${result.lat.toFixed(3)})`);
    } else {
      setGeoStatus('위치를 찾을 수 없어요');
    }
    setGeoLoading(false);
  };
  const debounceRef = useRef(makeDebounce(600));
  const handleWorldGeocode = (nameKr: string) => { setForm(f => ({ ...f, name_kr: nameKr })); debounceRef.current(() => doWorldGeocode(nameKr)); };

  const resetForm = () => setForm({ name: '', name_kr: '', flag: '', lng: '', lat: '', start_date: '', end_date: '', memo: '', emoji: '✈️', gradient: GRADIENT_OPTIONS[0], map_countries: '' });

  const openEdit = (p: WorldTravel) => {
    setEditTarget(p);
    setForm({ name: p.name, name_kr: p.name_kr, flag: p.flag, lng: String(p.lng), lat: String(p.lat), start_date: p.start_date, end_date: p.end_date, memo: p.memo, emoji: p.emoji, gradient: p.gradient, map_countries: p.map_countries });
    setGeoStatus('');
    setPinOk(true);
    setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!form.name_kr || !form.lng || !form.lat) return;
    const payload = {
      name: form.name, name_kr: form.name_kr, flag: form.flag, lng: parseFloat(form.lng), lat: parseFloat(form.lat),
      start_date: form.start_date, end_date: form.end_date, memo: form.memo, emoji: form.emoji, gradient: form.gradient, map_countries: form.map_countries,
    };
    if (editTarget) {
      const { error } = await supabase.from('world_travels').update(payload).eq('id', editTarget.id);
      if (error) { alert('수정 실패: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('world_travels').insert(payload);
      if (error) { alert('추가 실패: ' + error.message); return; }
    }
    resetForm(); setEditTarget(null); setGeoStatus(''); setShowAdd(false);
    fetch();
  };

  const handleDel = async () => {
    if (!delTarget) return;
    await supabase.from('world_travels').delete().eq('id', delTarget.id);
    setDelTarget(null); setDelPin('');
    fetch();
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="px-6 space-y-5">
      <motion.div variants={fadeUp} className="flex justify-between items-end pt-2">
        <div>
          <h2 className="font-display text-3xl italic text-charcoal">World</h2>
          <p className="text-[10px] text-warm-gray mt-1 tracking-[0.15em] uppercase">our passport stamps</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-white bg-gradient-to-r from-plum to-dusty-rose px-3 py-1 rounded-full shadow-lg shadow-plum/20">
            {places.length} places
          </span>
          <button onClick={() => setShowAdd(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-dusty-rose to-plum flex items-center justify-center shadow-lg shadow-plum/20 border-none cursor-pointer">
            <Plus size={14} className="text-white" />
          </button>
        </div>
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => { setShowAdd(false); setPinOk(false); setPin(''); setEditTarget(null); resetForm(); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cream rounded-3xl p-5 w-full max-w-[340px] shadow-2xl space-y-3 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              {!pinOk ? (
                <>
                  <h3 className="font-display text-xl italic text-charcoal text-center">PIN</h3>
                  <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value)}
                    className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-2xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose font-display text-charcoal" placeholder="····" />
                  <button onClick={() => { if (pin === UPLOAD_PIN) setPinOk(true); else { setPin(''); alert('PIN이 틀렸어요!'); } }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-dusty-rose to-plum text-white font-semibold text-sm border-none cursor-pointer">확인</button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg italic text-charcoal">{editTarget ? '해외여행 수정' : '새 해외여행 추가'}</h3>
                    <button onClick={() => { setShowAdd(false); setPinOk(false); setEditTarget(null); resetForm(); }} className="bg-transparent border-none cursor-pointer text-warm-gray"><X size={18} /></button>
                  </div>
                  <div>
                    <input value={form.name_kr} onChange={e => handleWorldGeocode(e.target.value)} placeholder="도시/국가 이름 (예: 도쿄)"
                      className="w-full py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                    {geoStatus && (
                      <p className={`text-[10px] mt-1 px-1 flex items-center gap-1 ${geoLoading ? 'text-warm-gray' : form.lng ? 'text-emerald-500' : 'text-red-400'}`}>
                        {geoLoading ? <span className="inline-block w-3 h-3 border border-warm-gray border-t-dusty-rose rounded-full animate-spin" /> : form.lng ? '✓' : '✗'} {geoStatus}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="영문 이름 (자동입력)"
                      className="py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                    <input value={form.flag} onChange={e => setForm({ ...form, flag: e.target.value })} placeholder="국기 (예: 🇯🇵)"
                      className="py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal text-center" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} placeholder="시작일 (2025.03.01)"
                      className="py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                    <input value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} placeholder="종료일 (2025.03.05)"
                      className="py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                  </div>
                  <input value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="한줄 메모"
                    className="w-full py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                  <input value={form.map_countries} onChange={e => setForm({ ...form, map_countries: e.target.value })} placeholder="지도 국가명 (예: Japan)"
                    className="w-full py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                  <div>
                    <p className="text-[10px] text-warm-gray mb-1.5">아이콘</p>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_OPTIONS.map(e => (
                        <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                          className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border-none cursor-pointer transition-all ${form.emoji === e ? 'bg-plum/20 scale-110 shadow-sm' : 'bg-white/40 hover:bg-white/60'}`}>{e}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-warm-gray mb-1.5">색상</p>
                    <div className="flex flex-wrap gap-1.5">
                      {GRADIENT_OPTIONS.map(g => (
                        <button key={g} onClick={() => setForm({ ...form, gradient: g })}
                          className={`w-7 h-7 rounded-lg bg-gradient-to-br ${g} border-2 cursor-pointer transition-all ${form.gradient === g ? 'border-plum scale-110' : 'border-transparent'}`} />
                      ))}
                    </div>
                  </div>
                  <button onClick={handleAdd} disabled={!form.name_kr || !form.lng || !form.lat}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-dusty-rose to-plum text-white font-semibold text-sm border-none cursor-pointer shadow-lg disabled:opacity-40">{editTarget ? '수정하기' : '추가하기'}</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {delTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => { setDelTarget(null); setDelPin(''); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-cream rounded-3xl p-5 w-full max-w-[300px] shadow-2xl space-y-3 text-center"
              onClick={e => e.stopPropagation()}>
              <p className="text-lg">{delTarget.emoji} {delTarget.flag}</p>
              <p className="font-display text-base italic text-charcoal">{delTarget.name_kr} 삭제할까요?</p>
              <input type="password" inputMode="numeric" maxLength={4} value={delPin} onChange={e => setDelPin(e.target.value)}
                placeholder="PIN 입력" className="w-full text-center text-lg tracking-[0.3em] py-2 rounded-xl border border-red-200 bg-white/60 outline-none focus:border-red-400 text-charcoal" />
              <div className="flex gap-2">
                <button onClick={() => { setDelTarget(null); setDelPin(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-warm-gray text-sm border-none cursor-pointer">취소</button>
                <button onClick={() => { if (delPin === UPLOAD_PIN) handleDel(); else { setDelPin(''); alert('PIN이 틀렸어요!'); } }}
                  className="flex-1 py-2.5 rounded-xl bg-red-400 text-white text-sm font-semibold border-none cursor-pointer">삭제</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* World Map */}
      <DeepCard className="p-0">
        <ComposableMap projection="geoMercator" projectionConfig={{ center: [130, 5], scale: 200 }} width={500} height={420} style={{ width: '100%', height: 'auto' }}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) => geographies.map(geo => {
              const name = geo.properties.name;
              const isVisited = visitedCountries.some(c => name?.includes(c));
              return (
                <Geography key={geo.rsmKey} geography={geo} fill={isVisited ? '#C9918F' : '#3D3545'} stroke="#4A4252" strokeWidth={0.4}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none', fill: isVisited ? '#D4A0A0' : '#4A4252' }, pressed: { outline: 'none' } }} />
              );
            })}
          </Geographies>
          {places.map((p, i) => (
            <Marker key={p.id} coordinates={[p.lng, p.lat]}>
              <circle r={10} fill="#C9918F" opacity={0.3}>
                <animate attributeName="r" values="6;14;6" dur="3s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
              </circle>
              <circle r={4} fill="#F2D7D5" stroke="#FFF8F0" strokeWidth={1.5} />
              <text textAnchor="middle" y={-10}
                style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 9, fontWeight: 700, fill: '#F2D7D5', paintOrder: 'stroke', stroke: 'rgba(45,42,50,0.8)', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                {p.name_kr}
              </text>
            </Marker>
          ))}
        </ComposableMap>
      </DeepCard>

      {/* Travel Log */}
      <motion.div variants={fadeUp}>
        <p className="text-[9px] text-warm-gray uppercase tracking-[0.2em] mb-3 font-semibold">Travel Log</p>
        <div className="space-y-2.5">
          {loading ? (
            <div className="text-center py-8"><div className="inline-block w-6 h-6 border-2 border-blush border-t-dusty-rose rounded-full animate-spin" /></div>
          ) : places.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
              className="flex items-center gap-3 bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl px-4 py-3.5 shadow-[0_2px_12px_rgba(109,58,93,0.05)] group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center shrink-0 shadow-sm`}>
                <span className="text-xl leading-none">{p.emoji}</span>
                <span className="text-[8px] mt-0.5">{p.flag}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-[15px] italic text-charcoal">{p.name_kr}</h4>
                  <span className="text-[8px] text-warm-gray font-medium shrink-0 ml-2">{p.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-dusty-rose font-semibold flex items-center gap-1">
                    <Calendar size={9} /> {p.start_date} ~ {p.end_date}
                  </span>
                </div>
                {p.memo && <p className="text-[10px] text-warm-gray mt-0.5 truncate">{p.memo}</p>}
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                  className="bg-transparent border-none cursor-pointer text-warm-gray/40 hover:text-plum p-1"><Pencil size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDelTarget(p); }}
                  className="bg-transparent border-none cursor-pointer text-warm-gray/40 hover:text-red-400 p-1"><Trash2 size={13} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Dream destinations */}
      <motion.div variants={fadeUp}>
        <p className="text-[9px] text-warm-gray uppercase tracking-[0.2em] mb-3 px-1 font-semibold">Dream Destinations</p>
        <div className="flex gap-2 flex-wrap">
          {['Australia 🇦🇺', 'Chongqing 🇨🇳', 'Shanghai 🇨🇳', 'Canada 🇨🇦'].map(d => (
            <span key={d} className="text-[10px] text-plum-light bg-blush/30 px-3 py-1.5 rounded-full border border-blush/50 font-medium">{d}</span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// 5. GALLERY VIEW
// ═══════════════════════════════════════
type GalleryItem = { id: string; image_url: string; caption: string; date: string; created_at: string };
type SortMode = 'newest' | 'oldest' | 'date-desc' | 'date-asc';

const UPLOAD_PIN = '0725';
const PER_PAGE = 8;

const formatUploadDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const sortItems = (items: GalleryItem[], mode: SortMode) => {
  const sorted = [...items];
  switch (mode) {
    case 'newest': return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest': return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'date-desc': return sorted.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    case 'date-asc': return sorted.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }
};

const GalleryView = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [pin, setPin] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewItem, setViewItem] = useState<GalleryItem | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [showDeletePin, setShowDeletePin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editPinOk, setEditPinOk] = useState(false);
  const [sort, setSort] = useState<SortMode>('newest');
  const [page, setPage] = useState(1);
  const [imgLoaded, setImgLoaded] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchGallery = async () => {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchGallery(); }, []);
  useEffect(() => { setPage(1); }, [sort]);

  const sorted = sortItems(items, sort);
  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paged = sorted.slice(0, page * PER_PAGE);
  const hasMore = page < totalPages;

  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropDone = (blob: Blob) => {
    const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
    setSelectedFile(file);
    setPreview(URL.createObjectURL(blob));
    setCropSrc(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !caption.trim()) return;
    setUploading(true);
    const fileName = `${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase.storage.from('photos').upload(fileName, selectedFile);
    if (uploadErr) { alert('Upload failed'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
    await supabase.from('gallery').insert({ image_url: publicUrl, caption: caption.trim(), date: date || null });
    setCaption(''); setDate(''); setPreview(null); setSelectedFile(null);
    setShowUpload(false); setUploading(false);
    fetchGallery();
  };

  const handleDelete = async (item: GalleryItem) => {
    const fileName = item.image_url.split('/').pop();
    if (fileName) await supabase.storage.from('photos').remove([fileName]);
    await supabase.from('gallery').delete().eq('id', item.id);
    setViewItem(null);
    fetchGallery();
  };

  const startEdit = () => {
    if (!viewItem) return;
    setEditCaption(viewItem.caption);
    setEditDate(viewItem.date || '');
    setEditing(true);
    setEditPinOk(false);
    setEditPin('');
  };

  const handleEditSave = async () => {
    if (!viewItem) return;
    const { error } = await supabase.from('gallery').update({ caption: editCaption.trim(), date: editDate || null }).eq('id', viewItem.id);
    if (error) { alert('수정 실패: ' + error.message); return; }
    setViewItem({ ...viewItem, caption: editCaption.trim(), date: editDate });
    setEditing(false);
    fetchGallery();
  };

  const sortLabels: Record<SortMode, string> = {
    'newest': '최신 업로드', 'oldest': '오래된순',
    'date-desc': '날짜 최신순', 'date-asc': '날짜 오래된순',
  };
  const sortKeys: SortMode[] = ['newest', 'oldest', 'date-desc', 'date-asc'];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="px-6 space-y-4">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex justify-between items-end pt-2">
        <div>
          <h2 className="font-display text-3xl italic text-charcoal">Gallery</h2>
          <p className="text-[10px] text-warm-gray mt-1 tracking-[0.15em] uppercase">
            {items.length > 0 ? `${items.length} memories` : 'our precious moments'}
          </p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-dusty-rose to-plum flex items-center justify-center shadow-lg shadow-plum/20 border-none cursor-pointer">
          <Plus size={18} className="text-white" />
        </button>
      </motion.div>

      {/* Sort Bar */}
      {items.length > 1 && (
        <motion.div variants={fadeUp} className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {sortKeys.map(key => (
            <button key={key} onClick={() => setSort(key)}
              className={`text-[10px] whitespace-nowrap px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                sort === key
                  ? 'bg-plum text-white border-plum font-semibold shadow-sm'
                  : 'bg-white/40 text-warm-gray border-white/60 hover:bg-white/60'
              }`}>
              {sortLabels[key]}
            </button>
          ))}
        </motion.div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => setShowUpload(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cream rounded-3xl p-6 w-full max-w-[340px] shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}>

              {!pinVerified ? (
                <>
                  <h3 className="font-display text-xl italic text-charcoal text-center">PIN</h3>
                  <p className="text-[11px] text-warm-gray text-center">업로드하려면 PIN을 입력하세요</p>
                  <input type="password" inputMode="numeric" maxLength={4} value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-2xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose font-display text-charcoal"
                    placeholder="····" />
                  <button onClick={() => { if (pin === UPLOAD_PIN) setPinVerified(true); else { setPin(''); alert('PIN이 틀렸어요!'); } }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-dusty-rose to-plum text-white font-semibold text-sm border-none cursor-pointer shadow-lg shadow-plum/20">
                    확인
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl italic text-charcoal">New Memory</h3>
                    <button onClick={() => setShowUpload(false)} className="bg-transparent border-none cursor-pointer text-warm-gray"><X size={20} /></button>
                  </div>

                  {cropSrc ? (
                    <GalleryCropView src={cropSrc} onDone={handleCropDone} onCancel={() => { setCropSrc(null); if (fileRef.current) fileRef.current.value = ''; }} />
                  ) : preview ? (
                    <div className="relative rounded-2xl overflow-hidden">
                      <img src={preview} alt="preview" className="w-full h-48 object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button onClick={() => { setPreview(null); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                          className="w-7 h-7 rounded-full bg-charcoal/60 flex items-center justify-center border-none cursor-pointer">
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full h-40 rounded-2xl border-2 border-dashed border-blush flex flex-col items-center justify-center gap-2 bg-white/30 cursor-pointer">
                      <Camera size={28} className="text-dusty-rose" />
                      <span className="text-[11px] text-warm-gray">사진을 선택하세요</span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

                  <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)}
                    placeholder="한줄글을 적어주세요"
                    className="w-full py-3 px-4 rounded-2xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal placeholder:text-warm-gray/50" />

                  <input type="text" value={date} onChange={(e) => setDate(e.target.value)}
                    placeholder="날짜 (예: 2024.12.25)"
                    className="w-full py-3 px-4 rounded-2xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal placeholder:text-warm-gray/50" />

                  <button onClick={handleUpload} disabled={uploading || !selectedFile || !caption.trim()}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-dusty-rose to-plum text-white font-semibold text-sm border-none cursor-pointer shadow-lg shadow-plum/20 disabled:opacity-40">
                    {uploading ? '업로드 중...' : '업로드'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Detail Modal */}
      <AnimatePresence>
        {viewItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => { setViewItem(null); setShowDeletePin(false); setDeletePin(''); setEditing(false); setEditPinOk(false); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cream rounded-3xl overflow-hidden w-full max-w-[340px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <img src={viewItem.image_url} alt={viewItem.caption} className="w-full max-h-[50vh] object-cover" />
                <button onClick={() => { setViewItem(null); setShowDeletePin(false); setDeletePin(''); setEditing(false); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-charcoal/50 backdrop-blur-sm flex items-center justify-center border-none cursor-pointer">
                  <X size={16} className="text-white" />
                </button>
              </div>
              <div className="p-5 space-y-2.5">
                {editing ? (
                  !editPinOk ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-warm-gray text-center">수정하려면 PIN을 입력하세요</p>
                      <input type="password" inputMode="numeric" maxLength={4} value={editPin}
                        onChange={e => setEditPin(e.target.value)} placeholder="····"
                        className="w-full text-center text-xl tracking-[0.5em] py-2.5 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-charcoal" />
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(false)}
                          className="flex-1 py-2 rounded-xl bg-gray-100 text-warm-gray text-[11px] border-none cursor-pointer">취소</button>
                        <button onClick={() => { if (editPin === UPLOAD_PIN) setEditPinOk(true); else { setEditPin(''); alert('PIN이 틀렸어요!'); } }}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-dusty-rose to-plum text-white text-[11px] font-semibold border-none cursor-pointer">확인</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input type="text" value={editCaption} onChange={e => setEditCaption(e.target.value)} placeholder="한줄글"
                        className="w-full py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                      <input type="text" value={editDate} onChange={e => setEditDate(e.target.value)} placeholder="날짜 (예: 2024.12.25)"
                        className="w-full py-2.5 px-3 rounded-xl border border-blush/50 bg-white/60 outline-none focus:border-dusty-rose text-sm text-charcoal" />
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(false)}
                          className="flex-1 py-2 rounded-xl bg-gray-100 text-warm-gray text-[11px] border-none cursor-pointer">취소</button>
                        <button onClick={handleEditSave} disabled={!editCaption.trim()}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-dusty-rose to-plum text-white text-[11px] font-semibold border-none cursor-pointer disabled:opacity-40">저장</button>
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    <p className="font-display text-lg italic text-charcoal leading-snug">{viewItem.caption}</p>
                    <div className="flex items-center gap-3">
                      {viewItem.date && (
                        <span className="text-[10px] text-dusty-rose font-semibold flex items-center gap-1 bg-blush/30 px-2.5 py-1 rounded-full">
                          <Calendar size={10} /> {viewItem.date}
                        </span>
                      )}
                      <span className="text-[9px] text-warm-gray/60">
                        업로드: {formatUploadDate(viewItem.created_at)}
                      </span>
                    </div>
                    {showDeletePin ? (
                      <div className="flex gap-2 pt-1">
                        <input type="password" inputMode="numeric" maxLength={4} value={deletePin}
                          onChange={(e) => setDeletePin(e.target.value)}
                          placeholder="PIN"
                          className="flex-1 text-center text-sm tracking-[0.3em] py-2 rounded-xl border border-red-200 bg-white/60 outline-none focus:border-red-400 text-charcoal" />
                        <button onClick={() => {
                          if (deletePin === UPLOAD_PIN) { handleDelete(viewItem); setShowDeletePin(false); setDeletePin(''); }
                          else { setDeletePin(''); alert('PIN이 틀렸어요!'); }
                        }}
                          className="px-4 py-2 rounded-xl bg-red-400 text-white text-[11px] font-semibold border-none cursor-pointer">확인</button>
                        <button onClick={() => { setShowDeletePin(false); setDeletePin(''); }}
                          className="px-3 py-2 rounded-xl bg-gray-100 text-warm-gray text-[11px] border-none cursor-pointer">취소</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3 pt-1">
                        <button onClick={startEdit}
                          className="text-[11px] text-plum/70 bg-transparent border-none cursor-pointer flex items-center gap-1 hover:text-plum transition-colors">
                          <Pencil size={12} /> 수정
                        </button>
                        <button onClick={() => setShowDeletePin(true)}
                          className="text-[11px] text-red-400/70 bg-transparent border-none cursor-pointer flex items-center gap-1 hover:text-red-500 transition-colors">
                          <Trash2 size={12} /> 삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery Grid */}
      {loading ? (
        <motion.div variants={fadeUp} className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-blush border-t-dusty-rose rounded-full animate-spin" />
          <p className="text-warm-gray text-[11px] mt-3">불러오는 중...</p>
        </motion.div>
      ) : items.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-16 space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-blush/20 flex items-center justify-center">
            <Camera size={32} className="text-dusty-rose" />
          </div>
          <p className="text-charcoal text-sm font-medium">아직 사진이 없어요</p>
          <p className="text-[10px] text-warm-gray/60">+ 버튼을 눌러 첫 번째 추억을 남겨보세요</p>
        </motion.div>
      ) : (
        <>
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2.5">
            {paged.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => setViewItem(item)}
                className="cursor-pointer group">
                <div className="bg-white/50 backdrop-blur-lg border border-white/60 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(109,58,93,0.05)] transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-[0_4px_20px_rgba(109,58,93,0.12)]">
                  <div className="aspect-[4/5] overflow-hidden relative bg-blush/10">
                    {!imgLoaded.has(item.id) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-blush/40 border-t-dusty-rose rounded-full animate-spin" />
                      </div>
                    )}
                    <img src={item.image_url} alt={item.caption}
                      onLoad={() => setImgLoaded(prev => new Set(prev).add(item.id))}
                      className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imgLoaded.has(item.id) ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <div className="p-2.5 space-y-1">
                    <p className="text-[11px] text-charcoal font-medium truncate leading-tight">{item.caption}</p>
                    <div className="flex items-center justify-between">
                      {item.date && <span className="text-[9px] text-dusty-rose font-semibold">{item.date}</span>}
                      <span className="text-[8px] text-warm-gray/40 ml-auto">{formatUploadDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Load More */}
          {hasMore && (
            <motion.div variants={fadeUp} className="text-center pt-2 pb-4">
              <button onClick={() => setPage(p => p + 1)}
                className="text-[11px] text-plum font-semibold bg-white/50 backdrop-blur-lg border border-white/60 px-6 py-2.5 rounded-full cursor-pointer hover:bg-white/70 transition-colors shadow-sm">
                더 보기 ({page * PER_PAGE} / {sorted.length})
              </button>
            </motion.div>
          )}

          {/* Page indicator */}
          {!hasMore && items.length > PER_PAGE && (
            <motion.div variants={fadeUp} className="text-center pb-4">
              <p className="text-[10px] text-warm-gray/40">모든 추억을 불러왔어요</p>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

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
            {tab === 'gallery' && <GalleryView key="gallery" />}
            {tab === 'korea' && <KoreaMapView key="korea" />}
            {tab === 'world' && <WorldMapView key="world" />}
          </AnimatePresence>
        </div>

        {/* Bottom navigation */}
        <nav className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] max-w-[340px] h-[72px] bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-white/80 shadow-[0_8px_40px_rgba(109,58,93,0.12)] z-50 flex items-center justify-around px-3">
          <TabBtn id="home" icon={Heart} label="Home" active={tab} set={setTab} />
          <TabBtn id="gallery" icon={Camera} label="Gallery" active={tab} set={setTab} />
          <TabBtn id="korea" icon={MapPin} label="Korea" active={tab} set={setTab} />
          <TabBtn id="world" icon={Globe} label="World" active={tab} set={setTab} />
        </nav>
      </div>
    </div>
  );
};

export default App;
