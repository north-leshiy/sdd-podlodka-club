import type { CSSProperties, ReactNode } from 'react';
import type { DesignSystem, Page, SlideMeta, SlideTransition } from '@open-slide/core';
import { MorphElement, Step, Steps, useIsActivePage, useSlidePageNumber } from '@open-slide/core';

import speakerImg from './assets/speaker.png';
import qrChannelImg from './assets/qr-techlead-stream.png';
import spekListImg from './assets/spek-list.png';
import spekChangeImg from './assets/spek-change.png';

// ─── Дизайн-токены (правятся из панели Design) ───────────────────────────────
export const design: DesignSystem = {
  palette: { bg: '#fafafe', text: '#15111f', accent: '#6f00ff' },
  fonts: {
    display: '"Montserrat", "Helvetica Neue", Arial, system-ui, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, system-ui, sans-serif',
  },
  typeScale: { hero: 128, body: 40 },
  radius: 20,
};

// ─── Локальные константы ─────────────────────────────────────────────────────
const muted = '#6b6580';
const line = 'rgba(21,17,31,0.12)';
const surface = '#ffffff';
const tint = '#f1eafb';
const accentSoft = '#b285e0';
const ink = '#1b1730';
const mono = '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';

const PAD = 140;

// ─── Шрифт Montserrat: локальные woff2, регистрируем один раз на слайд ───────
const fontUrl = (name: string) => new URL(`./assets/fonts/${name}.woff2`, import.meta.url).href;
const FONT_STYLE_ID = 'osd-webfont-sdd-podlodka-club';
const fontFace = (weight: number, subset: string, range: string) => `
@font-face { font-family: 'Montserrat'; font-style: normal; font-weight: ${weight}; font-display: swap;
  src: url('${fontUrl(`montserrat-${weight}-${subset}`)}') format('woff2'); unicode-range: ${range}; }`;
const RANGES: Record<string, string> = {
  'cyrillic-ext': 'U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F',
  cyrillic: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  'latin-ext':
    'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
  latin:
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
};
if (typeof document !== 'undefined' && !document.getElementById(FONT_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = FONT_STYLE_ID;
  style.textContent = [700, 800]
    .flatMap((w) => Object.entries(RANGES).map(([subset, range]) => fontFace(w, subset, range)))
    .join('\n');
  document.head.appendChild(style);
}

// ─── Переходы: один почерк на всю колоду ─────────────────────────────────────
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

// RISE — тихий домашний переход.
export const transition: SlideTransition = {
  duration: 200,
  exit: {
    duration: 140,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-4px)' },
    ],
  },
  enter: {
    duration: 200,
    delay: 80,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

// MORPH — схемы ролей: рамки переезжают, остальное только проявляется.
const MORPH_MS = 760;
const morphT: SlideTransition = {
  duration: 280,
  exit: { duration: 220, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: { duration: 300, delay: 110, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

// ─── Внутристраничное движение ───────────────────────────────────────────────
// Работает только на «живой» странице (data-live="1") и не трогает ещё
// не раскрытые шаги, поэтому превью и снимки всегда финальные.
const nth = Array.from({ length: 12 }, (_, i) => `.rs-stagger > :nth-child(${i + 1}) { --rs-i: ${i}; }`).join('\n');
const MOTION_CSS = `
@keyframes rs-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rs-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rs-pop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
@keyframes rs-lay { from { opacity: 0; transform: scaleX(0.35); } to { opacity: 1; transform: scaleX(1); } }
${nth}
.rs-d1 { --rs-d: 120ms; } .rs-d2 { --rs-d: 240ms; } .rs-d3 { --rs-d: 360ms; } .rs-d4 { --rs-d: 480ms; }
.rs-morph-late { --rs-t0: ${MORPH_MS}ms; }
.rs-fade { --rs-anim: rs-fade; } .rs-pop { --rs-anim: rs-pop; } .rs-lay { --rs-anim: rs-lay; }
.rs-fast { --rs-gap: 45ms; }
[data-live="1"] .rs-stagger:not([data-osd-step="pending"] *) > :not([data-osd-step]):not(.rs-static) {
  animation: var(--rs-anim, rs-rise) 440ms cubic-bezier(0, 0, 0.2, 1) both;
  animation-delay: calc(var(--rs-t0, 100ms) + var(--rs-d, 0ms) + var(--rs-i, 0) * var(--rs-gap, 90ms));
}
[data-live="1"] .rs-in:not([data-osd-step="pending"] *) {
  animation: var(--rs-anim, rs-rise) 440ms cubic-bezier(0, 0, 0.2, 1) both;
  animation-delay: calc(var(--rs-t0, 100ms) + var(--rs-d, 0ms));
}
.rs-steps-row > [data-osd-step] { flex: 1; min-width: 0; display: flex; }
.rs-steps-grid > [data-osd-step] { min-width: 0; display: flex; }
svg .rs-stagger > * { transform-box: fill-box; transform-origin: left center; }
@media (prefers-reduced-motion: reduce) { [data-live="1"] * { animation: none !important; } }
`;

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  position: 'relative',
  overflow: 'hidden',
  letterSpacing: '-0.005em',
};

// Корень страницы: fill + флаг «живой» страницы для CSS-анимаций.
const Live = ({ style, className, children }: { style?: CSSProperties; className?: string; children: ReactNode }) => {
  const live = useIsActivePage();
  return (
    <div data-live={live ? '1' : '0'} className={className} style={{ ...fill, ...style }}>
      {children}
      <style>{MOTION_CSS}</style>
    </div>
  );
};

// ─── Общие элементы ──────────────────────────────────────────────────────────
const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      className="rs-static"
      style={{
        position: 'absolute',
        left: PAD,
        right: PAD,
        bottom: 52,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 22,
        color: muted,
        letterSpacing: '0.03em',
      }}
    >
      <span>Сквозной SDD · Вебпрактик</span>
      <span>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const Eyebrow = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--osd-accent)', ...style }}>
    {children}
  </div>
);

const Heading = ({ children, size = 72 }: { children: ReactNode; size?: number }) => (
  <h2
    style={{
      fontFamily: 'var(--osd-font-display)',
      fontSize: size,
      fontWeight: 800,
      lineHeight: 1.12,
      letterSpacing: '-0.025em',
      margin: 0,
    }}
  >
    {children}
  </h2>
);

const Lead = ({ children, size = 34 }: { children: ReactNode; size?: number }) => (
  <p style={{ fontSize: size, lineHeight: 1.45, color: muted, margin: '24px 0 0', maxWidth: 1500 }}>{children}</p>
);

const A = ({ children }: { children: ReactNode }) => <span style={{ color: 'var(--osd-accent)' }}>{children}</span>;

// Стандартная контентная страница: номер темы, заголовок, тело, футер.
const Frame = ({
  n,
  title,
  lead,
  children,
  gap = 56,
  titleSize,
}: {
  n?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  gap?: number;
  titleSize?: number;
}) => (
  <Live style={{ padding: `110px ${PAD}px 0` }}>
    <div className="rs-in">
      {n && <Eyebrow style={{ marginBottom: 20 }}>{n}</Eyebrow>}
      <Heading size={titleSize}>{title}</Heading>
      {lead && <Lead>{lead}</Lead>}
    </div>
    <div style={{ marginTop: gap }}>{children}</div>
    <Footer />
  </Live>
);

// Буллет с фиолетовым маркером.
const Bullet = ({ children, size = 38 }: { children: ReactNode; size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, fontSize: size, lineHeight: 1.45 }}>
    <span style={{ flex: 'none', width: 16, height: 16, borderRadius: 4, background: 'var(--osd-accent)', marginTop: size * 0.72 - 8 }} />
    <span>{children}</span>
  </div>
);

// Выделенный вывод внизу страницы.
const Punch = ({ children, top = 56 }: { children: ReactNode; top?: number }) => (
  <div
    style={{
      marginTop: top,
      background: tint,
      borderLeft: '8px solid var(--osd-accent)',
      borderRadius: '0 var(--osd-radius) var(--osd-radius) 0',
      padding: '28px 40px',
      fontSize: 34,
      lineHeight: 1.4,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

const Card = ({ label, title, text, accent }: { label?: ReactNode; title: ReactNode; text?: ReactNode; accent?: boolean }) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      background: accent ? 'var(--osd-accent)' : surface,
      color: accent ? '#fff' : 'var(--osd-text)',
      border: `1px solid ${accent ? 'transparent' : line}`,
      borderRadius: 'var(--osd-radius)',
      padding: '36px 44px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      boxShadow: accent ? '0 24px 48px -24px rgba(111,0,255,0.55)' : 'none',
    }}
  >
    {label && (
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: accent ? 'rgba(255,255,255,0.75)' : 'var(--osd-accent)',
        }}
      >
        {label}
      </div>
    )}
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 36, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{title}</div>
    {text && <div style={{ fontSize: 27, lineHeight: 1.45, color: accent ? 'rgba(255,255,255,0.85)' : muted }}>{text}</div>}
  </div>
);

const ArrowRight = ({ width = 96 }: { width?: number }) => (
  <div style={{ flex: 'none', width, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentSoft }}>
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" aria-hidden="true">
      <path d="M2 16h40M30 4l12 12-12 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const Code = ({ children, size = 27 }: { children: ReactNode; size?: number }) => (
  <pre
    style={{
      margin: 0,
      background: ink,
      color: '#e9e4f5',
      fontFamily: mono,
      fontSize: size,
      lineHeight: 1.5,
      padding: '32px 44px',
      borderRadius: 'var(--osd-radius)',
      whiteSpace: 'pre',
    }}
  >
    {children}
  </pre>
);
const Hl = ({ children }: { children: ReactNode }) => <span style={{ color: '#c9a6ff', fontWeight: 700 }}>{children}</span>;
const Dim = ({ children }: { children: ReactNode }) => <span style={{ color: '#8a83a3' }}>{children}</span>;

const Speaker = ({ size = 120 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
    <img
      src={speakerImg}
      alt="Иван Поддубный"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        objectPosition: '50% 18%',
        border: `4px solid ${accentSoft}`,
        flex: 'none',
      }}
    />
    <div>
      <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 36, fontWeight: 700, lineHeight: 1.2 }}>Иван Поддубный</div>
      <div style={{ fontSize: 26, color: muted, marginTop: 6 }}>CTO Вебпрактик · @northleshiy</div>
    </div>
  </div>
);

// ─── Схемы ролей (абсолютные координаты; morph требует детерминированной геометрии)
type Tone = 'accent' | 'outline' | 'soft' | 'ghost' | 'dev';
const toneStyle: Record<Tone, CSSProperties> = {
  accent: { background: 'var(--osd-accent)', color: '#fff', border: '2px solid transparent' },
  outline: { background: surface, color: 'var(--osd-text)', border: `2px solid ${line}` },
  soft: { background: tint, color: 'var(--osd-text)', border: '2px solid transparent' },
  ghost: { background: 'transparent', color: muted, border: `2px dashed ${accentSoft}` },
  dev: { background: surface, color: 'var(--osd-text)', border: '2px solid var(--osd-accent)' },
};
const Box = ({
  id,
  x,
  y,
  w,
  h,
  title,
  sub,
  tone = 'outline',
  row,
  badge,
}: {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  row?: boolean;
  badge?: ReactNode;
}) => (
  <MorphElement id={id}>
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: 'border-box',
        borderRadius: 'var(--osd-radius)',
        padding: row ? '0 36px' : '28px 36px',
        display: 'flex',
        flexDirection: row ? 'row' : 'column',
        alignItems: row ? 'center' : 'flex-start',
        justifyContent: row ? 'flex-start' : 'center',
        gap: row ? 28 : 10,
        ...toneStyle[tone],
      }}
    >
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: -18,
            right: 24,
            background: ink,
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '6px 14px',
            borderRadius: 999,
          }}
        >
          {badge}
        </div>
      )}
      <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: 23, lineHeight: 1.35, opacity: tone === 'accent' ? 0.85 : 0.8 }}>{sub}</div>}
    </div>
  </MorphElement>
);
const Gate = ({ id, x, y, h = 170 }: { id: string; x: number; y: number; h?: number }) => (
  <MorphElement id={id}>
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 104,
        height: h,
        boxSizing: 'border-box',
        borderRadius: 999,
        background: surface,
        border: '2px solid var(--osd-accent)',
        color: 'var(--osd-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 700,
        lineHeight: 1.2,
      }}
    >
      quality
      <br />
      gate
    </div>
  </MorphElement>
);
const HArrow = ({ x, y, w = 60 }: { x: number; y: number; w?: number }) => (
  <svg
    className="rs-in rs-fade rs-morph-late"
    style={{ position: 'absolute', left: x, top: y - 14 }}
    width={w}
    height="28"
    viewBox={`0 0 ${w} 28`}
    fill="none"
    aria-hidden="true"
  >
    <path d={`M2 14h${w - 14}M${w - 22} 4l10 10-10 10`} stroke={accentSoft} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DiagramCaption = ({ y, children }: { y: number; children: ReactNode }) => (
  <div className="rs-in rs-fade rs-morph-late" style={{ position: 'absolute', left: PAD, right: PAD, top: y, fontSize: 30, lineHeight: 1.4, color: muted }}>
    {children}
  </div>
);
// Подложка без морфа: иначе её проявляющаяся копия ложится поверх летящих карточек.
const Band = ({ y, h, label }: { y: number; h: number; label: string }) => (
  <div
    style={{
      position: 'absolute',
      left: PAD,
      top: y,
      width: 1920 - PAD * 2,
      height: h,
      boxSizing: 'border-box',
      borderRadius: 28,
      background: tint,
      border: `2px solid ${accentSoft}`,
      padding: '18px 32px',
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--osd-accent)',
    }}
  >
    {label}
  </div>
);
const DiagramPage = ({ n, title, eyebrow, children }: { n: string; title: ReactNode; eyebrow?: ReactNode; children: ReactNode }) => (
  <Live>
    <div style={{ position: 'absolute', left: PAD, top: 110, right: PAD }}>
      <Eyebrow style={{ marginBottom: 20 }}>{n}</Eyebrow>
      <Heading size={64}>{title}</Heading>
      {eyebrow && <div style={{ marginTop: 16, fontSize: 28, color: muted }}>{eyebrow}</div>}
    </div>
    {children}
    <Footer />
  </Live>
);

// ─── Схема хендофов (SVG): две дорожки, фиксированная геометрия ──────────────
const feColor = '#f6d37a';
const beColor = '#f2a3a3';
const ctxColor = '#b7c9f2';
const ROW_H = 64;
const FE_Y = 40;
const BE_Y = FE_Y + ROW_H;
const PANEL_H = BE_Y + ROW_H + 10;

type SegKind = 'fe' | 'be' | 'ctx' | 'blk';
const segFill: Record<SegKind, string> = { fe: feColor, be: beColor, ctx: ctxColor, blk: '#ffffff' };
const Seg = ({ x, w, y, kind }: { x: number; w: number; y: number; kind: SegKind }) => (
  <rect x={x} y={y} width={w} height={ROW_H} fill={segFill[kind]} stroke={ink} strokeWidth={kind === 'blk' ? 2.5 : 1} />
);
const RowLabel = ({ y, children }: { y: number; children: string }) => (
  <text x={0} y={y + ROW_H / 2 + 9} fontSize={28} fill={ink}>
    {children}
  </text>
);
const PanelLabel = ({ children }: { children: string }) => (
  <text x={0} y={24} fontSize={26} fontWeight={800} fill={ink} letterSpacing="0.06em">
    {children}
  </text>
);
const PanelSvg = ({ children }: { children: ReactNode }) => (
  <svg width={1640} height={PANEL_H} viewBox={`0 0 1640 ${PANEL_H}`} style={{ display: 'block', overflow: 'visible' }}>
    {children}
  </svg>
);
const LegendItem = ({ color, label, stroke }: { color: string; label: string; stroke?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26, color: muted, whiteSpace: 'nowrap' }}>
    <span style={{ width: 36, height: 26, background: color, border: `${stroke ? 2 : 1}px solid ${ink}`, display: 'inline-block' }} />
    {label}
  </div>
);

const BeforeContext = () => (
  <PanelSvg>
    <PanelLabel>ДО ИИ</PanelLabel>
    <RowLabel y={FE_Y}>фронтенд</RowLabel>
    <g className="rs-stagger rs-lay">
      <Seg y={FE_Y} x={330} w={130} kind="ctx" />
      <Seg y={FE_Y} x={460} w={200} kind="fe" />
      <Seg y={FE_Y} x={660} w={100} kind="blk" />
      <Seg y={FE_Y} x={760} w={130} kind="ctx" />
      <Seg y={FE_Y} x={890} w={250} kind="fe" />
      <Seg y={FE_Y} x={1140} w={100} kind="blk" />
      <Seg y={FE_Y} x={1240} w={130} kind="ctx" />
      <Seg y={FE_Y} x={1370} w={260} kind="fe" />
    </g>
    <RowLabel y={BE_Y}>бекенд</RowLabel>
    <g className="rs-stagger rs-lay">
      <Seg y={BE_Y} x={200} w={130} kind="ctx" />
      <Seg y={BE_Y} x={330} w={230} kind="be" />
      <Seg y={BE_Y} x={560} w={100} kind="blk" />
      <Seg y={BE_Y} x={660} w={130} kind="ctx" />
      <Seg y={BE_Y} x={790} w={250} kind="be" />
      <Seg y={BE_Y} x={1040} w={100} kind="blk" />
      <Seg y={BE_Y} x={1140} w={130} kind="ctx" />
      <Seg y={BE_Y} x={1270} w={230} kind="be" />
    </g>
  </PanelSvg>
);

const AfterContext = () => (
  <PanelSvg>
    <PanelLabel>С ИИ</PanelLabel>
    <RowLabel y={FE_Y}>фронтенд</RowLabel>
    <g className="rs-stagger rs-lay rs-fast">
      <Seg y={FE_Y} x={330} w={65} kind="ctx" />
      <Seg y={FE_Y} x={395} w={65} kind="fe" />
      <Seg y={FE_Y} x={460} w={130} kind="blk" />
      <Seg y={FE_Y} x={590} w={65} kind="ctx" />
      <Seg y={FE_Y} x={655} w={65} kind="fe" />
      <Seg y={FE_Y} x={720} w={130} kind="blk" />
      <Seg y={FE_Y} x={850} w={65} kind="ctx" />
      <Seg y={FE_Y} x={915} w={65} kind="fe" />
      <Seg y={FE_Y} x={980} w={130} kind="blk" />
      <Seg y={FE_Y} x={1110} w={65} kind="ctx" />
      <Seg y={FE_Y} x={1175} w={65} kind="fe" />
      <Seg y={FE_Y} x={1240} w={130} kind="blk" />
      <Seg y={FE_Y} x={1370} w={65} kind="ctx" />
      <Seg y={FE_Y} x={1435} w={65} kind="fe" />
      <Seg y={FE_Y} x={1500} w={130} kind="blk" />
    </g>
    <RowLabel y={BE_Y}>бекенд</RowLabel>
    <g className="rs-stagger rs-lay rs-fast">
      <Seg y={BE_Y} x={200} w={65} kind="ctx" />
      <Seg y={BE_Y} x={265} w={65} kind="be" />
      <Seg y={BE_Y} x={330} w={130} kind="blk" />
      <Seg y={BE_Y} x={460} w={65} kind="ctx" />
      <Seg y={BE_Y} x={525} w={65} kind="be" />
      <Seg y={BE_Y} x={590} w={130} kind="blk" />
      <Seg y={BE_Y} x={720} w={65} kind="ctx" />
      <Seg y={BE_Y} x={785} w={65} kind="be" />
      <Seg y={BE_Y} x={850} w={130} kind="blk" />
      <Seg y={BE_Y} x={980} w={65} kind="ctx" />
      <Seg y={BE_Y} x={1045} w={65} kind="be" />
      <Seg y={BE_Y} x={1110} w={130} kind="blk" />
      <Seg y={BE_Y} x={1240} w={65} kind="ctx" />
      <Seg y={BE_Y} x={1305} w={65} kind="be" />
      <Seg y={BE_Y} x={1370} w={130} kind="blk" />
    </g>
  </PanelSvg>
);

// Дисциплина, которую вбирает универсальный инженер.
const Discipline = ({ title, status, open }: { title: string; status: string; open?: boolean }) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      background: open ? 'transparent' : surface,
      border: open ? `2px dashed ${accentSoft}` : `1px solid ${line}`,
      borderRadius: 'var(--osd-radius)',
      padding: '32px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: 600, color: open ? muted : 'var(--osd-accent)' }}>{status}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// СТРАНИЦЫ
// ═══════════════════════════════════════════════════════════════════════════════

// 01 — Обложка
const Cover: Page = () => (
  <Live
    style={{
      padding: `0 ${PAD}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundImage: 'radial-gradient(1100px 800px at 92% 10%, #e6d9ff 0%, rgba(230,217,255,0) 60%)',
    }}
  >
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: 'var(--osd-accent)' }} />
    <div className="rs-in">
      <Eyebrow style={{ fontSize: 32 }}>Podlodka Club · 5 минут</Eyebrow>
    </div>
    <div className="rs-in rs-d1" style={{ marginTop: 40, maxWidth: 1560 }}>
      <Heading size={120}>
        Как мы внедряли <A>сквозной SDD</A>
      </Heading>
    </div>
    <div className="rs-in rs-d2" style={{ fontSize: 40, lineHeight: 1.4, color: muted, marginTop: 40 }}>
      OpenSpec · все роли · практики · куда дальше
    </div>
    <div className="rs-in rs-d3" style={{ marginTop: 80 }}>
      <Speaker />
    </div>
  </Live>
);

// 02 — OpenSpec
const Chip = ({ children }: { children: ReactNode }) => (
  <div style={{ background: surface, border: `1px solid ${line}`, borderRadius: 999, padding: '18px 34px', fontSize: 32, fontWeight: 600, whiteSpace: 'nowrap' }}>
    {children}
  </div>
);
const OpenSpec: Page = () => (
  <Live style={{ padding: `0 ${PAD}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <div className="rs-in">
      <Eyebrow>01 · Фреймворк</Eyebrow>
    </div>
    <div className="rs-in rs-d1" style={{ marginTop: 36, borderLeft: '10px solid var(--osd-accent)', paddingLeft: 56 }}>
      <Heading size={104}>
        Выбрали <A>OpenSpec</A>
      </Heading>
      <Lead size={36}>Без долгих сравнений: взяли и пошли внедрять.</Lead>
    </div>
    <div className="rs-stagger rs-d2" style={{ display: 'flex', gap: 20, marginTop: 72, paddingLeft: 66 }}>
      <Chip>простой вход для всех ролей</Chip>
      <Chip>changes + specs из коробки</Chip>
      <Chip>brownfield-идеология</Chip>
    </div>
    <Footer />
  </Live>
);

// 03 — Сквозное внедрение: два трека
const Track = ({ label, title, text, people, accent }: { label: string; title: string; text: ReactNode; people: ReactNode; accent?: boolean }) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      background: surface,
      border: accent ? '3px solid var(--osd-accent)' : `1px solid ${line}`,
      borderRadius: 'var(--osd-radius)',
      padding: '40px 48px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}
  >
    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--osd-accent)' }}>{label}</div>
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{title}</div>
    <div style={{ fontSize: 30, lineHeight: 1.45, color: muted }}>{text}</div>
    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>{people}</div>
  </div>
);
const Person = ({ label, hot }: { label: string; hot?: boolean }) => (
  <div
    style={{
      fontSize: 24,
      fontWeight: 600,
      padding: '10px 20px',
      borderRadius: 999,
      whiteSpace: 'nowrap',
      background: hot ? 'var(--osd-accent)' : tint,
      color: hot ? '#fff' : 'var(--osd-text)',
    }}
  >
    {label}
  </div>
);
const TwoTracks: Page = () => (
  <Frame n="02 · Внедрение" title="Сквозное внедрение: два трека" lead="Фокус не на отдельной роли, а на всей цепочке от смысла до прода." gap={56}>
    <div className="rs-steps-row" style={{ display: 'flex', gap: 32 }}>
      <Steps>
        <Step>
          <Track
            label="основные проекты"
            title="Во все роли, без перестройки ролей"
            text="Аналитик, разработчик и QA остаются, но работают в одних спеках и одном флоу."
            people={
              <>
                <Person label="аналитик" />
                <Person label="разработчик" />
                <Person label="QA" />
              </>
            }
          />
        </Step>
        <Step>
          <Track
            accent
            label="новые продукты и внутренние"
            title="Один инженер на всё"
            text="Инженер с агентом ведёт change сам: от смысла до прода, без передач."
            people={<Person label="инженер + агент" hot />}
          />
        </Step>
      </Steps>
    </div>
    <Steps>
      <Step>
        <Punch top={48}>
          В обоих треках <A>один процесс</A> и <A>одни спеки</A>: меняется только, сколько людей ведут change.
        </Punch>
      </Step>
    </Steps>
  </Frame>
);

// 04 — Сквозное внедрение, роли не меняли
const FlowE2E: Page = () => (
  <DiagramPage n="02 · Внедрение" title="Основные проекты: все роли в одном флоу" eyebrow="Каждый делает свою работу, но в одном репо и в одном формате">
    <Box id="src" x={460} y={350} w={1000} h={110} tone="accent" title="Спеки в репозитории" sub="единый источник истины вместо Jira / Confluence" />
    <Band y={500} h={400} label="одна SDD-платформа на всю команду" />
    <Box id="an" x={200} y={570} w={400} h={170} title="Аналитик" sub="/explore · /propose" />
    <Gate id="gate1" x={630} y={570} />
    <Box id="dev" x={764} y={570} w={400} h={170} tone="dev" title="Разработчик" sub="/apply" />
    <Gate id="gate2" x={1194} y={570} />
    <Box id="prod" x={1328} y={570} w={392} h={170} tone="accent" title="merge / prod" />
    <Box id="qa" x={470} y={780} w={980} h={90} row title="Тестировщик" sub="держит quality gate после аналитика и после разработчика" />
  </DiagramPage>
);
FlowE2E.transition = morphT;

// 04 — Как выпало автотестирование: v1
const FlowV1: Page = () => (
  <DiagramPage n="03 · Автотесты" title="Как у нас «выпали» автотесты" eyebrow="v1 · по старой памяти отдали e2e тестировщикам отдельным шагом">
    <Box id="an" x={140} y={470} w={380} h={190} title="Аналитик" sub="/explore · /propose" />
    <Gate id="gate1" x={560} y={470} h={190} />
    <Box id="dev" x={704} y={470} w={380} h={190} tone="dev" title="Разработчик" sub="/apply" />
    <HArrow x={1094} y={565} w={70} />
    <Box id="qa" x={1174} y={470} w={400} h={190} tone="ghost" title="Тестировщик" sub="пишет e2e отдельным скилом" />
    <HArrow x={1584} y={565} w={36} />
    <Box id="prod" x={1624} y={470} w={156} h={190} tone="accent" title={<span style={{ fontSize: 24 }}>prod</span>} />
    <DiagramCaption y={760}>Цикл «код ↔ тесты» рвётся: агент уже ушёл, а тесты пишет другой человек в другом контексте.</DiagramCaption>
  </DiagramPage>
);
FlowV1.transition = morphT;

// 05 — v2: e2e в цикле разработчика
const FlowV2: Page = () => (
  <DiagramPage n="03 · Автотесты" title="Тесты вернули в цикл агента" eyebrow="v2 · e2e пишет и гоняет агент разработчика вместе с кодом">
    <Band y={440} h={400} label="одна SDD-платформа на всю команду" />
    <Box id="an" x={200} y={510} w={400} h={170} title="Аналитик" sub="/explore · /propose" />
    <Gate id="gate1" x={630} y={510} />
    <Box id="dev" x={764} y={510} w={400} h={170} tone="dev" title="Разработчик" sub="/apply · код ⇄ e2e" badge="+ e2e" />
    <Gate id="gate2" x={1194} y={510} />
    <Box id="prod" x={1328} y={510} w={392} h={170} tone="accent" title="merge / prod" />
    <Box id="qa" x={470} y={720} w={980} h={90} row title="Тестировщик" sub="из писателя тестов в держателя quality gate" />
    <DiagramCaption y={880}>Отдельный шаг «написать автотесты» из процесса просто исчез.</DiagramCaption>
  </DiagramPage>
);
FlowV2.transition = morphT;

// 06 — План тестирования
const TestPlan: Page = () => (
  <Frame n="04 · Планирование тестов" title="В change добавили test-plan.md" gap={56}>
    <div style={{ display: 'flex', gap: 72, alignItems: 'flex-start' }}>
      <div className="rs-in rs-d1" style={{ flex: 'none' }}>
        <Code size={28}>
          {'changes/<change-id>/\n'}
          <Dim>{'├── proposal.md    # зачем\n'}</Dim>
          <Dim>{'├── design.md      # как\n'}</Dim>
          <Dim>{'├── specs/         # дельта\n'}</Dim>
          <Dim>{'├── tasks.md       # план\n'}</Dim>
          <Hl>{'└── test-plan.md   # что проверяем'}</Hl>
        </Code>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 30, paddingTop: 12 }}>
        <Steps>
          <Step>
            <Bullet size={34}>Генерит агент из proposal и дельты спек</Bullet>
          </Step>
          <Step>
            <Bullet size={34}>Пирамида: unit / интеграция, компонентные, e2e</Bullet>
          </Step>
          <Step>
            <Bullet size={34}>Каждый тест отвечает на пункт спеки</Bullet>
          </Step>
          <Step>
            <Bullet size={34}>QA ревьюит план, а не пишет тесты руками</Bullet>
          </Step>
        </Steps>
      </div>
    </div>
  </Frame>
);

// 07 — Разработчики: фронт и бек кусками в tasks
const DevSplit: Page = () => (
  <Frame n="05 · Разработчики" title="Фронт и бек режем прямо в tasks.md" lead="Роли не меняли, поэтому план сразу делим по зонам ответственности." gap={56}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div className="rs-in rs-d1" style={{ flex: 'none' }}>
        <Code size={27}>
          <Hl>{'## Фронтенд\n'}</Hl>
          {'- [ ] Форма и состояния UI\n- [ ] Интеграция с API\n- [ ] Компонентные тесты\n'}
          <Hl>{'## Бэкенд\n'}</Hl>
          {'- [ ] Эндпоинты и валидация\n- [ ] Миграции схемы\n- [ ] Интеграционные тесты'}
        </Code>
      </div>
      <ArrowRight />
      <div className="rs-stagger rs-d2" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Card label="фронтенд-разработчик" title="/apply front" />
        <Card label="бэкенд-разработчик" title="/apply backend" />
        <div style={{ fontSize: 27, lineHeight: 1.45, color: muted }}>Каждый прогон берёт только свой раздел плана</div>
      </div>
    </div>
  </Frame>
);

// 08 — Аналитики
const Analysts: Page = () => (
  <Frame n="06 · Аналитики" title="Как заходили аналитики" gap={56}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <Steps>
        <Step>
          <Bullet>Серия встреч про риски отказа от Confluence как источника истины</Bullet>
        </Step>
        <Step>
          <Bullet>Docs as code дорог на старте, но агент окупает это кратно</Bullet>
        </Step>
        <Step>
          <Bullet>Стейкхолдерам — экспорт спек в Confluence отдельным скилом</Bullet>
        </Step>
        <Step>
          <Bullet>Пробовали UseCase вместо Gherkin: автотесты деградировали, вернули</Bullet>
        </Step>
      </Steps>
    </div>
  </Frame>
);

// 09 — Свой сервис спек
const Spek: Page = () => (
  <Live style={{ padding: `110px ${PAD}px 0` }}>
    <div style={{ display: 'flex', gap: 64, alignItems: 'flex-start' }}>
      <div className="rs-in" style={{ width: 640, flex: 'none' }}>
        <Eyebrow style={{ marginBottom: 20 }}>07 · Платформа</Eyebrow>
        <Heading size={64}>
          Свой сервис спек: <A>spek</A>
        </Heading>
        <div className="rs-stagger rs-d2" style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 48 }}>
          <Bullet size={30}>Changes с прогрессом по tasks</Bullet>
          <Bullet size={30}>Proposal · design · specs · tasks в одном окне</Bullet>
          <Bullet size={30}>Поиск, граф связей, таймлайн</Bullet>
          <Bullet size={30}>Коммиты привязаны к change</Bullet>
        </div>
      </div>
      <div className="rs-in rs-d1 rs-pop" style={{ flex: 1, minWidth: 0, position: 'relative', height: 780 }}>
        <img
          src={spekListImg}
          alt="spek: список changes с прогрессом"
          style={{ position: 'absolute', left: 0, top: 0, width: 860, borderRadius: 16, border: `1px solid ${line}`, boxShadow: '0 32px 64px -32px rgba(21,17,31,0.45)' }}
        />
        <img
          src={spekChangeImg}
          alt="spek: просмотр change"
          style={{ position: 'absolute', right: 0, bottom: 40, width: 760, borderRadius: 16, border: `1px solid ${line}`, boxShadow: '0 32px 64px -24px rgba(21,17,31,0.55)' }}
        />
      </div>
    </div>
    <Footer />
  </Live>
);

// 10 — Практики
const Practices: Page = () => (
  <Frame n="08 · Практики" title="Практики, которые прижились" gap={56}>
    <div className="rs-steps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      <Steps>
        <Step>
          <Card label="гигиена" title="Контроль открытых changes" text="Висящий change — рассинхрон источника истины. Регулярно разбираем и архивируем." />
        </Step>
        <Step>
          <Card label="качество входа" title="Скил проверки качества спеки" text="До /apply: полнота сценариев, Gherkin, критические вопросы, которые должны быть заданы." />
        </Step>
        <Step>
          <Card label="воспроизводимость" title="Контроль идентичности harness" text="У всех одни версии скилов, правил и OpenSpec. Иначе один change даёт разный результат." />
        </Step>
        <Step>
          <Card label="регламент" title="Технический change" text="Рефакторинг без правки спек: смысл, решение и план всё равно фиксируем в change." />
        </Step>
      </Steps>
    </div>
  </Frame>
);

// 11 — Хендофы
const Handoffs: Page = () => (
  <Live style={{ padding: `110px ${PAD}px 0` }}>
    <div className="rs-in">
      <Eyebrow style={{ marginBottom: 20 }}>09 · Где спотыкаемся</Eyebrow>
      <Heading size={68}>Узкое место теперь — хендофы</Heading>
    </div>
    <div style={{ marginTop: 40 }}>
      <BeforeContext />
    </div>
    <Steps>
      <Step>
        <div style={{ marginTop: 24 }}>
          <AfterContext />
        </div>
      </Step>
      <Step>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 32 }}>
          <LegendItem color={ctxColor} label="погружение" />
          <LegendItem color={feColor} label="фронт" />
          <LegendItem color={beColor} label="бек" />
          <LegendItem color="#ffffff" label="хендоф" stroke />
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 30, fontWeight: 600, maxWidth: 820, lineHeight: 1.35 }}>
            Агент сжал работу, но передача и повторное погружение не сжимаются.
          </div>
        </div>
      </Step>
    </Steps>
    <Footer />
  </Live>
);

// 12 — Универсальные инженеры
const Universal: Page = () => (
  <Frame n="10 · Куда идём" title="Основные проекты тоже ведём к универсалам" lead="В новых продуктах это уже работает. Теперь переносим модель на основные." gap={56}>
    <div className="rs-steps-row" style={{ display: 'flex', gap: 20 }}>
      <Steps>
        <Step>
          <Discipline title="Аналитика" status="закрывается" />
        </Step>
        <Step>
          <Discipline title="QA / e2e" status="закрывается" />
        </Step>
        <Step>
          <Discipline title="DevOps" status="с платформой" />
        </Step>
        <Step>
          <Discipline title="Фронт + бек" status="открытый вопрос" open />
        </Step>
      </Steps>
    </div>
    <Punch>
      Сквозной SDD как раз и делает это возможным: <A>один язык</A> и <A>один артефакт</A> на весь цикл.
    </Punch>
  </Frame>
);

// 13 — Финал
const Thanks: Page = () => (
  <Live
    style={{
      padding: `0 ${PAD}px`,
      display: 'flex',
      alignItems: 'center',
      gap: 120,
      backgroundImage: 'radial-gradient(1100px 800px at 92% 10%, #e6d9ff 0%, rgba(230,217,255,0) 60%)',
    }}
  >
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: 'var(--osd-accent)' }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="rs-in">
        <Heading size={120}>Спасибо!</Heading>
      </div>
      <div className="rs-in rs-d1" style={{ fontSize: 36, lineHeight: 1.45, color: muted, marginTop: 32, maxWidth: 900 }}>
        Внедряйте SDD сквозным образом: спеки как общий язык для людей и агентов.
      </div>
      <div className="rs-in rs-d2" style={{ marginTop: 72 }}>
        <Speaker />
      </div>
    </div>
    <div className="rs-in rs-d3 rs-pop" style={{ flex: 'none', textAlign: 'center' }}>
      <img src={qrChannelImg} alt="QR-код канала" style={{ width: 420, height: 420, borderRadius: 'var(--osd-radius)', background: '#fff', padding: 20, border: `1px solid ${line}` }} />
      <div style={{ fontSize: 26, color: muted, marginTop: 20 }}>Мой канал</div>
    </div>
  </Live>
);

export const meta: SlideMeta = {
  title: 'Сквозной SDD — Podlodka Club',
  createdAt: '2026-09-29T22:36:36.975Z',
};

export default [
  Cover,
  OpenSpec,
  TwoTracks,
  FlowE2E,
  FlowV1,
  FlowV2,
  TestPlan,
  DevSplit,
  Analysts,
  Spek,
  Practices,
  Handoffs,
  Universal,
  Thanks,
] satisfies Page[];
