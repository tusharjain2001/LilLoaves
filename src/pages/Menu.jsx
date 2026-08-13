import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CategoryStrip from "../components/CategoryStrip.jsx";
import SeasonalSpecials from "../components/SeasonalSpecials.jsx";
import FaqSection from "../components/FaqSection.jsx";
import { useCart } from "../context/CartContext.jsx";
import {
  fetchCategories,
  fetchProducts,
  fetchFeatured,
  fetchByTagSlug,
  fetchProductBySlug,
} from "../lib/woo.js";
import { fetchQuote } from "../lib/quote.js";
import PLACEHOLDER_PRODUCT_IMAGE from "../lib/placeholderImage.js";
import flowerYellow from "../assets/shared/flower-yellow.svg";
import blobButton from "../assets/menu/blob-button.svg";
import blobSpecials from "../assets/menu/blob-specials.svg";
import blobSampler from "../assets/menu/blob-sampler.svg";
import lunchboxIconsSprite from "../assets/menu/lunchbox-icons-sprite.png";
import lunchboxArrowLeft from "../assets/menu/lunchbox-arrow-left.svg";
import lunchboxArrowRight from "../assets/menu/lunchbox-arrow-right.svg";
import iconRoundPlus from "../assets/menu/icon-round-plus.svg";
import radioSelected from "../assets/menu/radio-selected.svg";
import radioUnselected from "../assets/menu/radio-unselected.svg";

/* Desktop geometry is taken verbatim from the Figma Menu page (node 247:13050,
   a 1440-wide canvas). The navbar overlays the hero there, so the hero runs from
   y=0 and these are Figma's own absolute values. */
const CANVAS_ORIGIN = "calc(50% - 720px)";

/* Hero bands: 110.77px of #efd895 every 221.54px from x=0, the group sitting at
   0.12 opacity - the same wash as the About hero. */
const HERO_STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(239,216,149,0.12) 0 110.77px, transparent 110.77px 221.54px)",
  backgroundPosition: `${CANVAS_ORIGIN} 0`,
};

const HERO_FLOWERS_DESKTOP = [
  { left: 110, top: 171 },
  { left: 1269, top: 171 },
  { left: 321, top: 275 },
  { left: 1040, top: 275 },
];

const HERO_FLOWERS_MOBILE = [
  { left: -17, top: 82 },
  { left: 346, top: 271 },
];

/* 30px checkerboard band between "Our Menu" and the Lunch Box section - same
   phase as the strip on the Seasonal Specials section. */
const CHECKERBOARD_BG = {
  backgroundImage: "repeating-conic-gradient(#e5c5bc 0 25%, transparent 0 50%)",
  backgroundSize: "60px 60px",
  backgroundPosition: "calc(50% - 690px) 0",
};

/* Scalloped seam under the Lunch Box/Sampler Box carousel: 17 circles of
   r=57.73 spaced 86.6 apart, filled with the section's own #f4e7e3 so the
   pink edge reads as bumps. They overlap, so they are split across two
   gradient layers that each tile at double the pitch. */
const SCALLOP_DESKTOP = {
  backgroundImage: [
    "radial-gradient(circle at 27.73px 57.73px, #f4e7e3 57.73px, transparent 57.74px)",
    "radial-gradient(circle at 114.33px 57.73px, #f4e7e3 57.73px, transparent 57.74px)",
  ].join(","),
  backgroundSize: "173.2px 115.46px",
  backgroundRepeat: "repeat-x",
  backgroundPosition: `${CANVAS_ORIGIN} 0`,
};

const SCALLOP_MOBILE = {
  backgroundImage:
    "radial-gradient(circle at 50% 0%, #f4e7e3 37.6px, transparent 37.7px)",
  backgroundSize: "56.23px 38px",
  backgroundRepeat: "repeat-x",
};

// Shown for any money figure whose quote hasn't landed yet - same convention
// as Cart.jsx's PENDING: never a fabricated $0.00, never blank beside a
// label.
const PENDING = "—";

// A staged add-on always starts at a quantity of one - this is a UI step
// amount ("add one more of this"), not a catalog fact, so it is the one
// number in the add-on copy that is fine to be a constant rather than come
// from the product.
const ADDON_STEP = 1;

// Confirmed live against the real store (wp-cli, not guessed): the parallel
// agent building these in WooCommerce landed on sampler-*-choice/-addon,
// not a samplerbox-* prefix. fetchByTagSlug already degrades an unmatched
// or not-yet-tagged slug to [], so a slot simply renders nothing if this
// ever drifts again - never a crash.
const SAMPLER_BREAD_TAG = "sampler-bread-choice";
const SAMPLER_CRACKER_TAG = "sampler-cracker-choice";
const SAMPLER_ADDON_BREAD_TAG = "sampler-bread-addon";
const SAMPLER_ADDON_CRACKER_TAG = "sampler-cracker-addon";

/* Crop windows into the shared lunchbox-icons-sprite.png - each "what's
   inside" icon zooms into a different region of one collage photo, exactly
   as exported from Figma. Reused byte-for-byte by the Sampler Box's own
   "what's inside" row (confirmed against Figma node 379:2 - it crops the
   exact same sprite at the exact same coordinates). */
const LUNCHBOX_INSIDE = [
  {
    label: "Bread",
    desc: "Choice of Sourdough or Japanese Bread",
    gap: 27.76,
    crop: { height: "238.96%", width: "265.38%", left: "0%", top: "-61.04%" },
  },
  {
    label: "CRAckers",
    desc: "Choice of 5oz bag of Chief’s or Doc’s crackers",
    gap: 24.79,
    crop: {
      height: "242.11%",
      width: "317.24%",
      left: "-119.54%",
      top: "-68.42%",
    },
  },
  {
    label: "DESsert",
    desc: "Choice of Cookies (6) or Muffins (4)",
    gap: 30.74,
    crop: {
      height: "238.96%",
      width: "324.71%",
      left: "-224.71%",
      top: "-66.23%",
    },
  },
];

const SAMPLERBOX_INSIDE = [
  {
    label: "Bread",
    desc: "Mini-loaves of either our OG Sourdough or Japanese Milk Bread",
    gap: LUNCHBOX_INSIDE[0].gap,
    crop: LUNCHBOX_INSIDE[0].crop,
  },
  {
    label: "CRAckers",
    desc: "Either the trial bags of Doc’s Cheddar Cracks or Chief’s White Cheddar Crackers",
    gap: LUNCHBOX_INSIDE[1].gap,
    crop: LUNCHBOX_INSIDE[1].crop,
  },
  {
    label: "Sweets",
    desc: "(1) Blueberry Muffin, (1) Chocolate Orange Muffin, (1) White Chocolate Lemon Cookie and (1) Chocolate Chip Cookie",
    gap: LUNCHBOX_INSIDE[2].gap,
    crop: LUNCHBOX_INSIDE[2].crop,
  },
];

// A tag-fetched product only needs its name and photo to render as a chooser
// option; shared by the Lunch Box and Sampler Box tag-loading effects below.
function toBoxOption(p) {
  return { name: p.name, img: p.images[0]?.src ?? PLACEHOLDER_PRODUCT_IMAGE };
}

// Some of the Sampler Box's add-ons turned out to be the same *variable*
// crackers already sold on the main menu (confirmed live: sampler-cracker-
// addon tags Doc's/Chief's, both variable with real pack sizes) - fetchByTagSlug
// already runs every result through the same /variations merge as the main
// menu, so a variable addon already carries `packSizes` here. Selling one
// needs a variation id, exactly like BreadCard's pack-size pills, and the
// cart line needs an options.size tag so it can never silently merge its
// quantity into an unrelated pack size of the same product already in the
// cart (the same bug class the pack-size work fixed for the menu grid). A
// simple addon (the bread mini-loaf-priced full loaves) has no packSizes and
// needs none of this - it's already an ordinary line.
function addonPurchaseInfo(addon) {
  const packSize = addon.packSizes?.[0];
  return {
    priceFormatted: packSize ? packSize.priceFormatted : addon.priceFormatted,
    variationId: packSize?.id,
    options: packSize ? { size: packSize.name } : undefined,
  };
}

function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* Drives a persistent 3-slot [prev][current][next] track. Going "next" slides
   the track to reveal the right-hand slot; going "previous" slides it to
   reveal the left-hand one - the two visibly move in opposite directions,
   and because the offset always animates from the resting -100% rather than
   snapping between arbitrary indices, wrapping from the last panel back to
   the first keeps travelling the same direction instead of reversing.
   With reduced motion, go() swaps the index directly and the track never
   leaves its resting offset, so nothing slides. */
function useCarousel(count, reducedMotion) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0); // -1 previous, +1 next, 0 idle

  const go = (direction) => {
    if (reducedMotion) {
      setIndex((i) => (i + direction + count) % count);
      return;
    }
    if (dir !== 0) return; // one transition in flight at a time
    setDir(direction);
  };

  const handleTransitionEnd = () => {
    if (dir === 0) return;
    setIndex((i) => (i + dir + count) % count);
    setDir(0);
  };

  const prevIndex = (index - 1 + count) % count;
  const nextIndex = (index + 1) % count;
  const offset = dir === 1 ? -200 : dir === -1 ? 0 : -100;
  const trackStyle = {
    transform: `translateX(${offset}%)`,
    // Only ever animated while dir is non-zero (an active go()); the
    // snap-back to resting -100% after handleTransitionEnd resets dir to 0
    // in the same render that resets the offset, so it lands instantly
    // instead of visibly sliding backwards.
    transition: dir === 0 ? "none" : "transform 420ms ease",
  };

  return { index, prevIndex, nextIndex, dir, trackStyle, go, handleTransitionEnd };
}

function useSwipe(onSwipe) {
  const startX = useRef(null);
  const SWIPE_THRESHOLD = 40;
  return {
    onTouchStart: (e) => {
      startX.current = e.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (e) => {
      if (startX.current === null) return;
      const deltaX = (e.changedTouches[0]?.clientX ?? startX.current) - startX.current;
      startX.current = null;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
      onSwipe(deltaX < 0 ? 1 : -1);
    },
  };
}

/* Renders one synced slot of the carousel (title row or body). The two
   off-screen slots stay in the DOM only while actively animating towards
   them (dir matches their side) - at rest they're empty, so only one
   panel's content (and its data-fetching, its cart handlers) exists at a
   time. aria-hidden + inert keeps a mid-transition off-screen slot out of
   the tab order and the accessibility tree. */
function CarouselTrack({ carousel, panels, field, onTransitionEnd, testId, outerClassName = "" }) {
  const { index, prevIndex, nextIndex, dir, trackStyle } = carousel;
  return (
    <div className={`w-full overflow-hidden ${outerClassName}`}>
      <div className="flex" style={trackStyle} onTransitionEnd={onTransitionEnd} data-testid={testId}>
        <div className="w-full shrink-0" aria-hidden="true" inert>
          {dir === -1 ? panels[prevIndex][field] : null}
        </div>
        <div className="w-full shrink-0">{panels[index][field]}</div>
        <div className="w-full shrink-0" aria-hidden="true" inert>
          {dir === 1 ? panels[nextIndex][field] : null}
        </div>
      </div>
    </div>
  );
}

function BreadCard({ item, qty, onAdd, onInc, onDec, onSelectPackSize }) {
  return (
    <div className="relative w-full max-w-[370px] rounded-[13px] border-[0.8px] border-shell p-[6px] pb-[13px] lg:w-[348px] lg:rounded-[13.22px] lg:p-[6.37px] lg:pb-[12.74px]">
      {/* The whole card opens the product page. It is an overlay rather than a
          wrapper because the cart controls are buttons, and an <a> may not
          contain them - they sit back above it at z-20.
          The z-10 is load-bearing: the image container below is `relative`, so
          at z-auto it would paint over this link in tree order and swallow
          every click on the photo. */}
      <Link
        to={`/product/${item.slug}`}
        aria-label={item.name}
        className="absolute inset-0 z-10 rounded-[13px] lg:rounded-[13.22px]"
      />
      <div className="flex flex-col gap-[13px] lg:gap-[11.94px]">
        <div className="relative h-[220px] w-full overflow-hidden rounded-[12px] lg:h-[273.87px] lg:rounded-[12.1px]">
          <img
            src={item.img}
            alt={item.name}
            className="h-full w-full object-cover"
          />
          {/* Figma's gradient runs solid at the image's top edge and fades out
              46% of the way down. */}
          <div className="absolute inset-x-0 top-0 h-[70px] bg-gradient-to-b from-[#57423d] to-transparent lg:h-[126.58px]" />
          {/* Pack-size pills (Muffins/Cookies/Crackers only - never rendered,
              not even empty, for a product with none, so a bread's card is
              byte-for-byte what it was before pack sizes existed). z-20 to
              clear the full-card <Link> above at z-10, same reasoning as the
              price/actions row below. */}
          {item.packSizes && item.packSizes.length > 0 && (
            <div className="absolute left-[15.414px] top-[20.9px] z-20 flex items-center gap-[8.67px]">
              {item.packSizes.map((size) => {
                const isSelected = size.id === item.selectedPackSizeId;
                return (
                  <button
                    key={size.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!size.purchasable}
                    onClick={() => onSelectPackSize(size.id)}
                    className={`cursor-pointer whitespace-nowrap rounded-[15.414px] px-[7.707px] py-[3.854px] font-parkinsans text-[13.487px] text-[#57423d] disabled:cursor-not-allowed disabled:opacity-50 ${
                      isSelected ? "bg-[#fff3d4]" : "bg-[#f7f5f1]"
                    }`}
                  >
                    {size.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-[20px] px-[13px] lg:gap-[28.66px] lg:px-[12.74px]">
          <div className="flex flex-col gap-[3px] lg:gap-[3.18px]">
            <p className="font-parkinsans text-[18px] font-semibold text-cocoa lg:text-[20px] lg:leading-[28px]">
              {item.name}
            </p>
            {/* Figma gives every card a 66px (three-line) description box; our
                Parkinsans is narrower so some would otherwise fall to two lines
                and lift that card's price row. */}
            <p className="font-parkinsans text-[14px] text-clay lg:h-[66px] lg:text-[16px] lg:leading-[22px]">
              {item.desc}
            </p>
          </div>
          <div className="relative z-20 flex items-center gap-[16px] lg:gap-[28.66px]">
            <p className="font-parkinsans text-[19px] text-cocoa lg:w-[140.52px] lg:text-[22.29px] lg:leading-[31px]">
              {item.price}
            </p>
            {!item.inStock ? (
              /* The other two states are a fixed 140.52px pill, which the 348px
                 card sizes to land flush on the row's right edge. "Sold out" is
                 half that wide, so left-packed it stopped short and broke the
                 column the pills form down the grid - ml-auto puts its right
                 edge back on theirs. Mobile packs its actions after the price
                 rather than to the edge, so it keeps that. */
              <span className="font-parkinsans text-[13px] font-semibold text-taupe lg:ml-auto">
                Sold out
              </span>
            ) : qty > 0 ? (
              <div className="flex w-[141px] shrink-0 items-center justify-between rounded-full border-[1.65px] border-taupe px-[13px] py-[6px] font-parkinsans text-[13px] font-semibold text-taupe lg:w-[140.52px] lg:rounded-[79.61px] lg:px-[12.74px] lg:py-[6.37px] lg:text-[12.74px]">
                <button type="button" onClick={onDec} className="cursor-pointer px-[4px]">
                  -
                </button>
                <span>{qty}</span>
                <button type="button" onClick={onInc} className="cursor-pointer px-[4px]">
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAdd}
                className="shrink-0 cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[16px] py-[6px] font-parkinsans text-[15px] text-white lg:grid lg:h-[30.74px] lg:w-[140.52px] lg:place-items-center lg:rounded-[79.61px] lg:px-0 lg:py-0 lg:text-[16px]"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Every heading inside the two box sections.
 *
 * These were `font-display`, which is Ligema DEMO - a decorative face whose
 * lowercase renders script-like, so "LUNCH BOX Specials" came out in two
 * apparent fonts and "WHAT'S INSIDE" came out wide and light. Figma sets all
 * of them in Parkinsans Medium (nodes 247:13061, 247:13068, 247:13088,
 * 247:13096) with -1.6px tracking at 32px, -1.2px at 24px and -1px at 20px -
 * the same -0.05em at every size, so it is written once as an em value
 * instead of three pixel values that would drift apart.
 *
 * Alignment is deliberately NOT in here: the three section headings are
 * centred and the BREAD/CRACKERS/DESSERT labels are left-aligned, and two
 * competing text-align utilities on one element resolve by stylesheet order,
 * not by the order they appear in the class string.
 */
const BOX_HEADING = "font-parkinsans font-medium uppercase tracking-[-0.05em] text-cocoa";

/* Shared by the Lunch Box and Sampler Box sections - the icon+text row
   "joined by round plus icons" (WHAT'S INSIDE / HERE IS WHAT'S INSIDE THE
   PACK). Only the heading copy and item text differ between them; the icon
   sprite, crop math and layout are identical (confirmed against Figma). */
function WhatsInsideRow({ heading, items }) {
  return (
    <div className="flex w-full flex-col items-center gap-[16px] lg:gap-[15.87px]">
      <p className={`${BOX_HEADING} text-center text-[19px] lg:text-[32px]`}>
        {heading}
      </p>
      <div className="flex w-full flex-col gap-[20px] rounded-[16px] bg-[rgba(251,251,248,0.57)] p-[16px] lg:flex-row lg:items-center lg:justify-center lg:gap-[20.82px] lg:rounded-[15.87px] lg:p-[15.87px]">
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {/* Figma gives each of the three a slightly different
                icon-to-text gap. */}
            <div className="flex items-center gap-[16px] lg:gap-[var(--icon-gap)]" style={{ "--icon-gap": `${item.gap}px` }}>
              <div className="relative grid size-[54px] shrink-0 place-items-center overflow-hidden rounded-full bg-shell lg:size-[96.19px]">
                <img
                  src={lunchboxIconsSprite}
                  alt=""
                  className="absolute max-w-none"
                  style={item.crop}
                />
              </div>
              <div className="flex flex-col gap-[4px] text-cocoa">
                <p className={`${BOX_HEADING} text-[16px] lg:text-[24px]`}>
                  {item.label}
                </p>
                <p className="font-parkinsans text-[13px] lg:text-[19.83px] lg:leading-[28px]">
                  {item.desc}
                </p>
              </div>
            </div>
            {i < items.length - 1 && (
              <img
                src={iconRoundPlus}
                alt=""
                className="size-[20px] shrink-0 self-center lg:size-[31.73px]"
              />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/* One "Choose your X" card: a step badge, options with a radio dot, and -
   only when the caller passes them - optional paid add-on rows below the
   options (Sampler Box's bread/cracker add-ons; the Lunch Box passes none
   and renders exactly as it always has). */
/**
 * Drives one horizontally scrolling options row.
 *
 * The row's native scrollbar is hidden (see the row's classes) for two
 * reasons: a chunky grey bar is wrong against this palette, and - because it
 * only appears in the card that actually overflows - it ate height from that
 * card alone and knocked its radio dots out of line with the other two.
 *
 * This replaces it with arrows that only exist while there is somewhere to
 * go, so a two-option card renders exactly as Figma draws it and nothing is
 * hidden without a way to reach it.
 */
function useHorizontalScroller(deps) {
  const ref = useRef(null);
  const [reach, setReach] = useState({ left: false, right: false });

  const measureFrom = (el) => {
    if (!el) return;
    // A sub-pixel slack: scrollLeft is fractional on zoomed/HiDPI displays,
    // so an exact comparison leaves the arrow enabled at the very end.
    const max = el.scrollWidth - el.clientWidth;
    setReach({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
  };

  // Reads the element off the event rather than the ref, so nothing touches
  // ref.current during render.
  const onScroll = (event) => measureFrom(event.currentTarget);

  useEffect(() => {
    const measure = () => measureFrom(ref.current);
    measure();
    const el = ref.current;
    // jsdom has no ResizeObserver; the measure above still runs, so tests
    // see the initial state rather than crashing.
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Just under one option, so the row always lands mid-option and it stays
  // obvious there is more - snap-start then settles it onto the next one.
  const page = (direction) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.5, behavior: "smooth" });
  };

  return { ref, reach, onScroll, page };
}

/* The round scroll arrow either side of an overflowing options row. Reuses
   the carousel's own triangle so it reads as part of the same section.

   lunchbox-arrow-left.svg and -right.svg are byte-identical - both point
   right - so the left one has to be turned, exactly as the carousel below
   already does it. Rendering the file named "left" without rotating it is
   why both arrows pointed the same way.

   Kept small and below the options rather than floating over them: sitting
   on top of a photograph it covered part of whatever it was pointing at. */
function ScrollArrow({ direction, disabled, onClick }) {
  const isLeft = direction === "left";
  return (
    <button
      type="button"
      aria-label={isLeft ? "Show previous options" : "Show more options"}
      disabled={disabled}
      onClick={onClick}
      className="grid size-[22px] cursor-pointer place-items-center rounded-full border border-shell bg-white transition-opacity disabled:cursor-default disabled:opacity-30 lg:size-[26px]"
    >
      <img
        src={lunchboxArrowRight}
        alt=""
        className={`h-[9px] w-[8px] lg:h-[11px] lg:w-[9px] ${isLeft ? "rotate-180" : ""}`}
      />
    </button>
  );
}

function LunchboxGroup({ step, title, options, selected, onSelect, addons, addonQty, onAddonAdd, onAddonInc, onAddonDec }) {
  // Destructured, not kept as one object: the react-hooks/refs rule treats
  // any property read off a value that holds a ref as a render-time ref access.
  const { ref: optionsRef, reach, onScroll, page } = useHorizontalScroller([options.length]);

  return (
    // No explicit height, deliberately: the row above sets lg:items-stretch,
    // and a flex item only stretches while its own height is `auto`. An
    // lg:h-full here resolved to 100% of an auto-height row - i.e. back to
    // content height - and silently cancelled the stretch, which is why the
    // three cards still ended at different heights.
    <div className="box-border flex w-full flex-col items-center gap-[24px] rounded-[16px] border border-shell bg-cream p-[16px] lg:w-[393.65px] lg:gap-[32px] lg:rounded-[15.87px] lg:border-[0.99px] lg:p-[15.87px]">
      {/* w-full, and min-w-0 on the row below: without a definite width here
          the auto-sized column would simply grow to fit all the options and
          they would never scroll - it would just overflow the card. */}
      <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-[16px] lg:gap-[23.8px]">
        <div className="flex items-center justify-center gap-[12px] lg:h-[39px] lg:gap-[9.92px]">
          <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-cocoa font-parkinsans text-[13px] text-white lg:size-[29.75px] lg:text-[19.83px] lg:leading-[19.83px]">
            {step}
          </span>
          <p className={`${BOX_HEADING} whitespace-nowrap text-center text-[14px] lg:text-[20px]`}>
            {title}
          </p>
        </div>
        {/* Two options fill the row exactly as Figma draws it: a basis of
            "half the row minus half the gap", twice, plus the one gap
            between them, sums to 100% - so the common case is untouched.

            Beyond two, the row scrolls sideways rather than wrapping. It
            used to wrap, which turned Dessert's five options into three
            stacked rows and a lone centred orphan, tripling the card's
            height and breaking the three cards' alignment. Scrolling keeps
            every card the same height whatever the owner tags, and keeps the
            options on one line as designed. `shrink-0` is what stops the
            browser compressing five options to fit instead of scrolling.

            items-stretch + justify-between on each option pins the radio
            dot to the bottom, so the dots line up whether a name wraps to
            two lines ("Sourdough Bread") or four ("Chief's White Cheddar
            Cayenne Crackers"). Paired with flex-1 up the chain, that also
            makes the dots line up *between* cards, not just within one. */}
        <div className="flex w-full min-w-0 flex-1">
          <div
            ref={optionsRef}
            onScroll={onScroll}
            className="flex w-full min-w-0 snap-x snap-mandatory items-stretch gap-[12px] overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] lg:gap-[23.8px] [&::-webkit-scrollbar]:hidden"
          >
          {options.map((opt) => {
            const isSelected = selected === opt.name;
            return (
              <button
                key={opt.name}
                type="button"
                onClick={() => onSelect(opt.name)}
                /* Figma outlines the chosen option (nodes 379:306 / 379:309 /
                   379:310): a terracotta hairline at radius 17 with 4px of
                   padding and 8px below. The unselected state carries the
                   same border width and padding in transparent, so choosing
                   one never nudges the row by a pixel. */
                className={`flex shrink-0 grow-0 basis-[calc(50%-6px)] snap-start cursor-pointer flex-col items-center justify-between gap-[12px] rounded-[17px] border px-[4px] pb-[8px] pt-[4px] transition-colors lg:basis-[calc(50%-11.9px)] lg:gap-[23.8px] ${
                  isSelected ? "border-terracotta" : "border-transparent"
                }`}
              >
                <div className="flex w-full flex-col items-center gap-[8px] lg:gap-[14px]">
                  <img
                    src={opt.img}
                    alt={opt.name}
                    className="h-[100px] w-full rounded-[10px] object-cover lg:h-[134px] lg:rounded-[15.87px]"
                  />
                  <p className="text-center font-parkinsans text-[13px] text-cocoa lg:text-[19.83px] lg:leading-[28px]">
                    {opt.name}
                  </p>
                </div>
                <img
                  src={isSelected ? radioSelected : radioUnselected}
                  alt={isSelected ? "Selected" : "Not selected"}
                  className="size-[10px] lg:size-[17.85px]"
                />
              </button>
            );
          })}
          </div>
        </div>

        {/* Below the options, never over them - and rendered in every card,
            not only the ones that overflow. `invisible` still occupies its
            space, so all three cards reserve the same strip and the radio
            dots above stay on one line. Both arrows always show, the
            unusable one dimmed, so the pair never shifts as you scroll. */}
        <div
          className={`flex shrink-0 items-center justify-center gap-[14px] ${
            reach.left || reach.right ? "" : "invisible"
          }`}
        >
          <ScrollArrow direction="left" disabled={!reach.left} onClick={() => page(-1)} />
          <ScrollArrow direction="right" disabled={!reach.right} onClick={() => page(1)} />
        </div>
      </div>
      {addons && addons.length > 0 && (
        <div className="flex w-full flex-col gap-[12px] lg:gap-[16px]">
          {addons.map((addon) => {
            const qty = addonQty(addon.id);
            // A variable addon (e.g. the cracker add-ons, which turned out
            // to be the same pack-sized crackers already on the main menu)
            // prices from its first pack size, not its own price field -
            // same convention as BreadCard's pack-size pills.
            const { priceFormatted } = addonPurchaseInfo(addon);
            return (
              <div
                key={addon.id}
                className="flex w-full items-center gap-[17px] rounded-[8px] border border-shell py-[8px] pl-[16px] pr-[8px]"
              >
                <p className="flex-1 font-parkinsans text-[13px] text-cocoa lg:text-[16px]">
                  {`Add (${ADDON_STEP}) ${addon.name}?`}
                </p>
                {qty > 0 ? (
                  <div className="flex w-[66px] shrink-0 items-center justify-between rounded-[6.623px] border border-terracotta px-[6.623px] py-[3.312px] font-parkinsans text-[13px] text-terracotta lg:text-[16px]">
                    <button
                      type="button"
                      aria-label={`Decrease ${addon.name} quantity`}
                      onClick={() => onAddonDec(addon)}
                      className="cursor-pointer"
                    >
                      -
                    </button>
                    <span>{qty}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${addon.name} quantity`}
                      onClick={() => onAddonInc(addon)}
                      className="cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={`Add ${addon.name}, +${priceFormatted}`}
                    onClick={() => onAddonAdd(addon)}
                    className="w-[66px] shrink-0 cursor-pointer rounded-[6.623px] bg-terracotta py-[3.312px] font-parkinsans text-[13px] text-white lg:text-[16px]"
                  >
                    {`+${priceFormatted}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Shared by the Lunch Box's and Sampler Box's own price/cart bars - both are
// a "- qty +" pill of the exact same geometry (confirmed against Figma nodes
// 379:109 and the existing Lunch Box bar). labelPrefix disambiguates the two
// bars' aria-labels since the carousel can, briefly, have both mounted.
function BoxQtyStepper({ qty, onInc, onDec, labelPrefix }) {
  return (
    <div className="flex items-center gap-[24px] rounded-full border-2 border-taupe px-[15px] py-[8px] font-parkinsans text-[16px] font-semibold text-taupe lg:h-[56px] lg:w-[170px] lg:justify-between lg:rounded-[96.34px] lg:px-[15.41px] lg:py-0">
      <button type="button" aria-label={`Decrease ${labelPrefix} quantity`} onClick={onDec} className="cursor-pointer">
        -
      </button>
      <span>{qty}</span>
      <button type="button" aria-label={`Increase ${labelPrefix} quantity`} onClick={onInc} className="cursor-pointer">
        +
      </button>
    </div>
  );
}

export default function Menu() {
  const cart = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  // Keyed by product id -> chosen variation id. Absent for any product not
  // yet touched, which is why the render loop below defaults to
  // `packSizes[0].id` rather than treating "absent" as "nothing selected".
  const [selectedPackSizes, setSelectedPackSizes] = useState({});
  const [selectedBread, setSelectedBread] = useState("");
  const [selectedCracker, setSelectedCracker] = useState("");
  const [selectedDessert, setSelectedDessert] = useState("");
  const [lunchboxQty, setLunchboxQty] = useState(1);
  const [lunchbox, setLunchbox] = useState({ bread: [], cracker: [], dessert: [] });
  const [lunchBoxProduct, setLunchBoxProduct] = useState(null);
  // The loading state is otherwise indistinguishable from the empty state
  // (both show zero visible products), so every visitor would see "More
  // treats coming soon!" flash before the real catalogue lands.
  const [loading, setLoading] = useState(true);

  // Sampler Box - same shape of state as the Lunch Box above, plus its own
  // paid add-ons (keyed by product id -> staged quantity) and its own live
  // quote for the bottom bar, since unlike the Lunch Box its total isn't
  // just one product's own price.
  const [samplerbox, setSamplerbox] = useState({
    bread: [],
    cracker: [],
    addonsBread: [],
    addonsCracker: [],
  });
  const [samplerBoxProduct, setSamplerBoxProduct] = useState(null);
  const [selectedSamplerBread, setSelectedSamplerBread] = useState("");
  const [selectedSamplerCracker, setSelectedSamplerCracker] = useState("");
  const [samplerAddonQty, setSamplerAddonQty] = useState({});
  const [samplerQty, setSamplerQty] = useState(1);
  const [samplerQuote, setSamplerQuote] = useState(null);

  const reducedMotion = usePrefersReducedMotion();
  const carousel = useCarousel(2, reducedMotion);
  const swipe = useSwipe(carousel.go);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchCategories(),
      fetchProducts(),
      fetchFeatured(),
      fetchProductBySlug("lunch-box"),
    ]).then(([cats, prods, feat, lunchBox]) => {
      if (!active) return;
      setCategories(cats);
      setProducts(prods);
      setActiveCategory((current) => current ?? cats[0]?.slug ?? null);
      setSpecials(
        feat.slice(0, 4).map((p) => ({
          name: p.name,
          price: p.priceFormatted,
          img: p.images[0]?.src ?? PLACEHOLDER_PRODUCT_IMAGE,
        })),
      );
      setLunchBoxProduct(lunchBox);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchByTagSlug("lunchbox-bread"),
      fetchByTagSlug("lunchbox-cracker"),
      fetchByTagSlug("lunchbox-dessert"),
    ]).then(([bread, cracker, dessert]) => {
      if (!active) return;
      setLunchbox({
        bread: bread.map(toBoxOption),
        cracker: cracker.map(toBoxOption),
        dessert: dessert.map(toBoxOption),
      });
      setSelectedBread(bread[0]?.name ?? "");
      setSelectedCracker(cracker[0]?.name ?? "");
      setSelectedDessert(dessert[0]?.name ?? "");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchByTagSlug(SAMPLER_BREAD_TAG),
      fetchByTagSlug(SAMPLER_CRACKER_TAG),
      fetchByTagSlug(SAMPLER_ADDON_BREAD_TAG),
      fetchByTagSlug(SAMPLER_ADDON_CRACKER_TAG),
      fetchProductBySlug("sampler-box"),
    ]).then(([bread, cracker, addonsBread, addonsCracker, samplerBox]) => {
      if (!active) return;
      setSamplerbox({
        bread: bread.map(toBoxOption),
        cracker: cracker.map(toBoxOption),
        // Add-on rows need the full product (id, name, priceFormatted) to
        // become an ordinary cart line, not just the name/photo a chooser
        // option needs - so these are kept as fetchByTagSlug returned them.
        addonsBread,
        addonsCracker,
      });
      setSelectedSamplerBread(bread[0]?.name ?? "");
      setSelectedSamplerCracker(cracker[0]?.name ?? "");
      setSamplerBoxProduct(samplerBox);
    });
    return () => {
      active = false;
    };
  }, []);

  const addonQty = (id) => samplerAddonQty[id] ?? 0;
  const setAddonQty = (id, qty) =>
    setSamplerAddonQty((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: qty };
    });
  const handleAddonAdd = (addon) => setAddonQty(addon.id, ADDON_STEP);
  const handleAddonInc = (addon) => setAddonQty(addon.id, addonQty(addon.id) + 1);
  const handleAddonDec = (addon) => setAddonQty(addon.id, addonQty(addon.id) - 1);

  const allSamplerAddons = [...samplerbox.addonsBread, ...samplerbox.addonsCracker];
  const handleAddSamplerBox = () => {
    if (!samplerBoxProduct) return;
    cart.add(samplerBoxProduct, samplerQty, {
      bread: selectedSamplerBread,
      cracker: selectedSamplerCracker,
    });
    // Ordinary product lines, not part of the box's own options - each
    // add-on is its own line with its own id, exactly like adding it from a
    // menu card would be. A variable addon (the crackers) also carries the
    // variation id and an options.size tag, same as a pack-size pill, so it
    // can't silently merge its quantity into a different pack size of the
    // same product already in the cart.
    allSamplerAddons.forEach((addon) => {
      const qty = addonQty(addon.id);
      if (qty <= 0) return;
      const info = addonPurchaseInfo(addon);
      cart.add(addon, qty, info.options, info.variationId);
    });
  };

  // The bottom bar's figure is a live server quote of the box at its current
  // quantity plus whichever add-ons are staged - never summed in React. A
  // string key of "id:variationId:qty" triples (not the lines array itself)
  // so the debounce effect below only re-quotes when something actually
  // priced changed.
  const samplerAddonLines = allSamplerAddons
    .map((addon) => {
      const qty = addonQty(addon.id);
      if (qty <= 0) return null;
      return { id: addon.id, qty, variationId: addonPurchaseInfo(addon).variationId };
    })
    .filter(Boolean);
  const samplerLines = samplerBoxProduct
    ? [{ id: samplerBoxProduct.id, qty: samplerQty }, ...samplerAddonLines]
    : [];
  const samplerLinesKey = samplerLines
    .map((l) => `${l.id}:${l.variationId ?? 0}:${l.qty}`)
    .join(",");

  useEffect(() => {
    // Nothing to quote yet (the box hasn't loaded) - samplerQuote is already
    // null from its initial state, so there's nothing to reset here.
    if (samplerLines.length === 0) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchQuote({ lines: samplerLines, signal: controller.signal }).then((result) => {
        if (controller.signal.aborted) return;
        setSamplerQuote(result);
      });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samplerLinesKey]);

  const activeItems = products.filter((p) =>
    p.categories.some((c) => c.slug === activeCategory),
  );

  const lunchBoxTitle = (
    <div className="flex flex-col items-center gap-[12px] lg:w-[890px] lg:gap-[19px]">
      {/* Two faces, not one: Figma sets "LUNCH BOX" in Parkinsans Regular
          (387:6399) and "specials" in Rochester on its blob (387:6398). It
          was a single font-display string, and Ligema DEMO's script-like
          lowercase made the second word *look* like a different face while
          the first came out wrong. Same lockup the Sampler Box title below
          already uses. */}
      <div className="flex items-center justify-center gap-[6px] lg:gap-[10px]">
        <p className="font-parkinsans text-[15.2px] uppercase tracking-[-0.05em] text-cocoa lg:text-[33.6px]">
          LUNCH BOX
        </p>
        <div className="relative inline-flex items-center justify-center">
          <img
            src={blobSpecials}
            alt=""
            className="absolute h-[43px] w-[68px] lg:h-[94.8px] lg:w-[150px]"
          />
          <p className="relative font-rochester text-[19.6px] text-cocoa lg:text-[43.2px]">
            specials
          </p>
        </div>
      </div>
      <p className="max-w-[828px] text-center font-parkinsans text-[15px] text-cocoa lg:w-[828px] lg:text-[20px] lg:leading-[34px]">
        A thoughtfully curated meal featuring fresh bread, handcrafted
        crackers, and a sweet treat; perfect for lunch, gifting, or
        sharing.
      </p>
    </div>
  );

  const lunchBoxBody = (
    <div className="flex w-full flex-col items-center gap-[48px] lg:w-[1294px] lg:gap-[92.22px]">
      <WhatsInsideRow heading="WHAT’S INSIDE" items={LUNCHBOX_INSIDE} />

      <div className="flex w-full flex-col items-center gap-[24px] lg:gap-[34.7px]">
        <div className="flex flex-col items-center text-center text-cocoa">
          <p className={`${BOX_HEADING} text-center text-[19px] lg:text-[32px]`}>
            BUILD YOUR LUNCH BOX
          </p>
          <p className="font-parkinsans text-[14px] lg:text-[20px] lg:leading-[28px]">
            Select one option from each category
          </p>
        </div>
        {/* lg:items-stretch, so all three cards are as tall as the
            tallest. Their natural heights differ by however many lines
            the longest product name happens to wrap to - "Chief's White
            Cheddar Cayenne Crackers" is four lines where "Sourdough
            Bread" is two - which left the row visibly ragged. Figma
            stretches them too (nodes 247:13111 / 247:13131 wrap their
            cards in a self-stretch row with h-full). */}
        <div className="flex w-full flex-col items-center gap-[24px] lg:flex-row lg:flex-wrap lg:items-stretch lg:justify-center lg:gap-[47.6px]">
          <LunchboxGroup
            step={1}
            title="The Main Loaf"
            options={lunchbox.bread}
            selected={selectedBread}
            onSelect={setSelectedBread}
          />
          <LunchboxGroup
            step={2}
            title="The Salty Crunch"
            options={lunchbox.cracker}
            selected={selectedCracker}
            onSelect={setSelectedCracker}
          />
          <LunchboxGroup
            step={3}
            title="The Sweet Pack"
            options={lunchbox.dessert}
            selected={selectedDessert}
            onSelect={setSelectedDessert}
          />
        </div>
      </div>

      {/* Price / cart bar */}
      <div className="flex w-full flex-col items-start gap-[16px] lg:h-[56px] lg:w-[1286px] lg:flex-row lg:items-center lg:gap-[33px]">
        <div className="grid place-items-center rounded-[16px] bg-[#cc8a7a] px-[16px] py-[8px] lg:h-[55px] lg:w-[123px] lg:px-0 lg:py-0">
          <p className="font-parkinsans text-[22px] text-white lg:text-[28px] lg:leading-[39px]">
            {lunchBoxProduct?.priceFormatted}
          </p>
        </div>
        <p className="font-parkinsans text-[16px] text-cocoa lg:w-[723.47px] lg:text-[20px] lg:leading-[28px]">
          One complete lunch box
          <br />
          with your selections
        </p>
        <div className="flex items-center gap-[16px] lg:gap-[33px]">
          <BoxQtyStepper
            qty={lunchboxQty}
            onInc={() => setLunchboxQty((q) => q + 1)}
            onDec={() => setLunchboxQty((q) => Math.max(1, q - 1))}
            labelPrefix="Lunch Box"
          />
          <button
            type="button"
            aria-label="Add Lunch Box to Cart"
            onClick={() => {
              if (!lunchBoxProduct) return;
              cart.add(lunchBoxProduct, lunchboxQty, {
                bread: selectedBread,
                cracker: selectedCracker,
                dessert: selectedDessert,
              });
            }}
            className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[24px] py-[16px] font-parkinsans text-[16px] text-white lg:grid lg:h-[54px] lg:w-[170.53px] lg:place-items-center lg:rounded-[96.35px] lg:px-0 lg:py-0"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );

  const samplerBoxTitle = (
    <div className="flex flex-col items-center gap-[12px] lg:w-[890px] lg:gap-[19px]">
      {/* Same lockup family as the site's other script-word titles ("Our
          PRODUCTS", "SEASONAL specials"): a plain uppercase word next to a
          cursive one, the cursive word sitting on its own blob (node 379:2's
          own asset - it isn't blob-specials, a byte comparison confirmed a
          different shape). Centered via flex rather than Figma's absolute
          offsets, which are tuned to Figma's own text metrics, not ours. */}
      <div className="flex items-center justify-center gap-[6px] lg:gap-[10px]">
        <p className="font-parkinsans text-[15.2px] font-medium uppercase tracking-[-0.76px] text-cocoa lg:text-[33.6px] lg:tracking-[-1.68px]">
          SAmpler
        </p>
        <div className="relative inline-flex items-center justify-center">
          <img src={blobSampler} alt="" className="absolute h-[43px] w-[68px] lg:h-[94.8px] lg:w-[150px]" />
          <p className="relative font-rochester text-[19.6px] text-cocoa lg:text-[43.2px]">box</p>
        </div>
      </div>
      <p className="max-w-[680px] text-center font-parkinsans text-[15px] text-cocoa lg:w-[680px] lg:text-[24px] lg:leading-[34px]">
        Can’t decide between sweet, savory, crusty, or cheesy? Good news: You
        don’t have to.
      </p>
    </div>
  );

  const samplerBoxBody = (
    <div className="flex w-full flex-col items-center gap-[48px] lg:w-[1294px] lg:gap-[92.22px]">
      <WhatsInsideRow heading="HERE IS WHAT’S INSIDE THE PACK" items={SAMPLERBOX_INSIDE} />

      <div className="flex w-full flex-col items-center gap-[24px] lg:gap-[34.7px]">
        <div className="flex flex-col items-center text-center text-cocoa">
          <p className={`${BOX_HEADING} text-center text-[19px] lg:text-[32px]`}>
            YOU CAN CHOOSE AMONG THESE
          </p>
          <p className="font-parkinsans text-[14px] lg:text-[20px] lg:leading-[28px]">
            Select one option from each category
          </p>
        </div>
        <div className="flex w-full flex-col items-center gap-[24px] lg:flex-row lg:flex-wrap lg:items-stretch lg:justify-center lg:gap-[47.6px]">
          <LunchboxGroup
            step={1}
            title="CHoose your Bread"
            options={samplerbox.bread}
            selected={selectedSamplerBread}
            onSelect={setSelectedSamplerBread}
            addons={samplerbox.addonsBread}
            addonQty={addonQty}
            onAddonAdd={handleAddonAdd}
            onAddonInc={handleAddonInc}
            onAddonDec={handleAddonDec}
          />
          <LunchboxGroup
            step={2}
            title="CHoose your Crackers"
            options={samplerbox.cracker}
            selected={selectedSamplerCracker}
            onSelect={setSelectedSamplerCracker}
            addons={samplerbox.addonsCracker}
            addonQty={addonQty}
            onAddonAdd={handleAddonAdd}
            onAddonInc={handleAddonInc}
            onAddonDec={handleAddonDec}
          />
        </div>
      </div>

      {/* Price / cart bar - subtotalFormatted is the box's own line plus
          every staged add-on line, summed server-side by /quote; nothing
          here adds money in React. */}
      <div className="flex w-full flex-col items-start gap-[16px] lg:h-[56px] lg:w-[1286px] lg:flex-row lg:items-center lg:gap-[33px]">
        <div className="grid place-items-center rounded-[16px] bg-[#cc8a7a] px-[16px] py-[8px] lg:h-[55px] lg:w-[123px] lg:px-0 lg:py-0">
          <p className="font-parkinsans text-[22px] text-white lg:text-[28px] lg:leading-[39px]">
            {samplerQuote?.subtotalFormatted || PENDING}
          </p>
        </div>
        <p className="font-parkinsans text-[16px] text-cocoa lg:w-[723.47px] lg:text-[20px] lg:leading-[28px]">
          One complete lunch box
          <br />
          with your selections
        </p>
        <div className="flex items-center gap-[16px] lg:gap-[33px]">
          <BoxQtyStepper
            qty={samplerQty}
            onInc={() => setSamplerQty((q) => q + 1)}
            onDec={() => setSamplerQty((q) => Math.max(1, q - 1))}
            labelPrefix="Sampler Box"
          />
          <button
            type="button"
            aria-label="Add Sampler Box to Cart"
            onClick={handleAddSamplerBox}
            className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[24px] py-[16px] font-parkinsans text-[16px] text-white lg:grid lg:h-[54px] lg:w-[170.53px] lg:place-items-center lg:rounded-[96.35px] lg:px-0 lg:py-0"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );

  const panels = [
    { name: "Lunch Box", title: lunchBoxTitle, body: lunchBoxBody },
    { name: "Sampler Box", title: samplerBoxTitle, body: samplerBoxBody },
  ];

  return (
    <main className="w-full overflow-x-hidden bg-cream">
      {/* HERO - 405px tall, navbar floats over it */}
      <section className="relative w-full overflow-hidden bg-vanilla">
        <div className="pointer-events-none absolute inset-0" style={HERO_STRIPES} />

        <div className="pointer-events-none absolute inset-0 lg:hidden">
          {HERO_FLOWERS_MOBILE.map((f, i) => (
            <img
              key={i}
              src={flowerYellow}
              alt=""
              className="absolute h-[71.88px] w-[79.41px] opacity-[0.36]"
              style={{ left: f.left, top: f.top }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-[1440px] -translate-x-1/2 lg:block">
          {HERO_FLOWERS_DESKTOP.map((f, i) => (
            <img
              key={i}
              src={flowerYellow}
              alt=""
              className="absolute h-[71.88px] w-[79.41px] opacity-[0.36]"
              style={{ left: f.left, top: f.top }}
            />
          ))}
        </div>

        <div className="relative mx-auto h-[360px] w-full max-w-[1440px] lg:h-[405px]">
          {/* Blob art is drawn vertically in Figma; rotate it a quarter turn and
              pin it to the button's centre so it sits behind the label. */}
          <div className="absolute left-1/2 top-[154px] h-[86px] w-[310px] -translate-x-1/2 lg:left-[521px] lg:top-[211px] lg:h-[113.86px] lg:w-[410px] lg:translate-x-0">
            <img
              src={blobButton}
              alt=""
              className="absolute left-1/2 top-1/2 h-[310px] w-[86px] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 lg:h-[409.93px] lg:w-[113.86px]"
            />
            <p className="relative grid h-full place-items-center px-[16px] text-center font-display text-[15.2px] uppercase text-white lg:px-0 lg:text-[48px] lg:leading-[53px]">
              VIEW OUR Products
            </p>
          </div>
        </div>
      </section>

      <CategoryStrip />

      {/* Figma runs the specials backdrop up under the last 7px of the
          category strip. */}
      <SeasonalSpecials specials={specials} className="lg:-mt-[7px]" />

      {/* OUR MENU */}
      <section className="w-full bg-cream px-[16px] py-[60px] lg:h-[1049px] lg:px-0 lg:py-0 lg:pt-[124.24px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[40px] lg:gap-[64px]">
          <div className="flex flex-col items-center gap-[12px] text-center text-cocoa lg:w-[758px] lg:gap-[19px]">
            <p className="font-display text-[19px] lg:text-[48px] lg:leading-[53px]">
              Our MENU
            </p>
            {/* Figma flows this in a 758px box over three lines; our Parkinsans
                is narrower, so the box is tightened to the widest value that
                keeps the same three-line shape. */}
            <p className="max-w-[758px] font-parkinsans text-[15px] lg:w-[580px] lg:text-[20px] lg:leading-[28.33px]">
              We offer a variety of delicacies from 4 types of baked items, you
              can click on add to cart any time you desire to place an order
              offline or online.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-[500px] grid-cols-2 gap-x-[20px] gap-y-[16px] lg:flex lg:w-auto lg:max-w-none lg:gap-[38px]">
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setActiveCategory(c.slug)}
                className={`box-border cursor-pointer whitespace-nowrap rounded-full bg-[#eaebe7] px-[20px] py-[8px] font-parkinsans text-[18px] text-cocoa lg:h-[50px] lg:rounded-[100px] lg:px-[32px] lg:py-0 lg:text-[24px] lg:leading-[34px] ${
                  activeCategory === c.slug
                    ? "border-2 border-[#969985]"
                    : "border-2 border-transparent"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col items-center gap-[20px] lg:flex-row lg:items-center lg:justify-center lg:gap-[16px]">
            {!loading && activeItems.length === 0 ? (
              <p className="py-[40px] text-center font-parkinsans text-[16px] text-clay">
                More treats coming soon!
              </p>
            ) : (
              activeItems.map((p) => {
                // Muffins/Cookies/Crackers carry real pack sizes from
                // woo.js's /variations merge; breads and Lunch Box have no
                // `packSizes` at all, so every branch below falls back to
                // the product's own price/stock, byte-for-byte the old
                // behaviour. Undefined until touched, so it defaults to the
                // wp-admin-ordered first pack size rather than "none chosen".
                const packSizes = p.packSizes ?? [];
                const hasPackSizes = packSizes.length > 0;
                const selectedVariationId = hasPackSizes
                  ? (selectedPackSizes[p.id] ?? packSizes[0].id)
                  : null;
                const selectedPackSize = hasPackSizes
                  ? packSizes.find((s) => s.id === selectedVariationId) ?? packSizes[0]
                  : null;
                const item = {
                  slug: p.slug,
                  name: p.name,
                  desc: p.summary,
                  price: selectedPackSize ? selectedPackSize.priceFormatted : p.priceFormatted,
                  img: p.images[0]?.src ?? PLACEHOLDER_PRODUCT_IMAGE,
                  inStock: selectedPackSize ? selectedPackSize.inStock : p.inStock,
                  packSizes,
                  selectedPackSizeId: selectedVariationId,
                };
                // Scoped to the currently selected pack size, not the
                // product overall - two sizes of one cookie are separate
                // cart lines (separate variationId), so the stepper must
                // reflect only the size on screen right now.
                const qty =
                  cart.lines.find(
                    (l) => l.id === p.id && (hasPackSizes ? l.variationId === selectedVariationId : !l.variationId),
                  )?.qty ?? 0;
                const cartProduct = selectedPackSize
                  ? { ...p, priceFormatted: selectedPackSize.priceFormatted }
                  : p;
                const cartOptions = selectedPackSize ? { size: selectedPackSize.name } : undefined;
                return (
                  <BreadCard
                    key={p.id}
                    item={item}
                    qty={qty}
                    onAdd={() => cart.add(cartProduct, 1, cartOptions, selectedVariationId)}
                    onInc={() => cart.setQty(p.id, qty + 1, cartOptions)}
                    onDec={() => cart.setQty(p.id, qty - 1, cartOptions)}
                    onSelectPackSize={(variationId) =>
                      setSelectedPackSizes((prev) => ({ ...prev, [p.id]: variationId }))
                    }
                  />
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* checkerboard band bridging Our Menu and the Lunch Box/Sampler Box carousel */}
      <div
        className="h-[20px] w-full lg:-mt-[3px] lg:h-[60px]"
        style={CHECKERBOARD_BG}
      />

      {/* LUNCH BOX / SAMPLER BOX carousel - two panels looping continuously
          in both directions. No fixed section height any more: the two
          panels are genuinely different heights (the Sampler Box's add-on
          rows), so the section sizes to whichever panel is showing. */}
      <section className="relative w-full bg-[#f4e7e3] px-[16px] py-[60px] lg:px-0 lg:pb-[148px] lg:pt-[136px]">
        <div
          className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[48px] lg:gap-[127px]"
          data-testid="menu-carousel"
          onTouchStart={swipe.onTouchStart}
          onTouchEnd={swipe.onTouchEnd}
        >
          <div className="flex w-full items-center justify-center gap-[16px] lg:gap-[64px]">
            <button
              type="button"
              aria-label={`Previous: ${panels[carousel.prevIndex].name}`}
              onClick={() => carousel.go(-1)}
              className="shrink-0 cursor-pointer"
            >
              <img
                src={lunchboxArrowLeft}
                alt=""
                className="h-[14px] w-[12px] rotate-180 lg:h-[23.85px] lg:w-[20.36px]"
              />
            </button>
            <CarouselTrack carousel={carousel} panels={panels} field="title" outerClassName="lg:w-[890px]" />
            <button
              type="button"
              aria-label={`Next: ${panels[carousel.nextIndex].name}`}
              onClick={() => carousel.go(1)}
              className="shrink-0 cursor-pointer"
            >
              <img
                src={lunchboxArrowRight}
                alt=""
                className="h-[14px] w-[12px] lg:h-[23.85px] lg:w-[20.36px]"
              />
            </button>
          </div>

          <CarouselTrack
            carousel={carousel}
            panels={panels}
            field="body"
            onTransitionEnd={carousel.handleTransitionEnd}
            testId="menu-carousel-track"
          />
        </div>
      </section>

      {/* Cream gap between the pink section and the FAQ, which the scallop
          bumps hang down into. */}
      <div className="hidden lg:block lg:h-[42.34px]" />

      {/* Scalloped seam: mobile keeps it in flow, desktop hangs it off the FAQ
          so the pink bumps overlap both the gap and the FAQ's top edge. */}
      <div className="h-[38px] w-full lg:hidden" style={SCALLOP_MOBILE} />

      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 z-10 hidden h-[115.46px] lg:block"
          style={{ ...SCALLOP_DESKTOP, top: -90 }}
        />
        <FaqSection />
      </div>
    </main>
  );
}
