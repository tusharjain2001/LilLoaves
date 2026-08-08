import CategoryStrip from "../components/CategoryStrip.jsx";
import flowerYellow from "../assets/shared/flower-yellow.svg";
import heroBlobText from "../assets/about/hero-blob-text.svg";
import heroPhoto from "../assets/about/hero-photo.png";
import meetCorgis from "../assets/about/meet-corgis.png";
import quoteMark from "../assets/about/quote-mark.svg";
import patternLoaf from "../assets/about/pattern-loaf.svg";
import patternCroissant from "../assets/about/pattern-croissant.svg";
import tributeGroup from "../assets/about/tribute-group.png";
import tributeGroupMobile from "../assets/about/tribute-group-mobile.png";

/* Desktop geometry is taken verbatim from the Figma About page (node 247:7, a
   1440-wide canvas). The navbar overlays the hero there, so these are Figma's
   own absolute values with no offset applied. */
const CANVAS_ORIGIN = "calc(50% - 720px)";

const HERO_FLOWERS_DESKTOP = [
  { left: 1358, top: 92 },
  { left: 628, top: 659 },
  { left: 649, top: 120 },
  { left: 134, top: 195 },
  { left: 42, top: 565 },
  { left: 1345, top: 623 },
  { left: 1005, top: 378 },
];

const HERO_FLOWERS_MOBILE = [
  { left: 0, top: 461 },
  { left: 82, top: 143 },
  { left: 307, top: 307 },
  { left: 211, top: 572 },
];

const TRIBUTE_PARAGRAPHS = [
  "Lil’ Loaves is inspired by our two corgis, Doc and Chief (the “loaves” behind the business)—a compliment that always came during those happy pauses on our walks, whenever people stopped to admire their unmistakable shape. Unfortunately, we lost Doc in early 2026, and soon after, we lost our Dad as well—the man who supported us in everything we did. Their passing is now our tribute—our efforts to build something meaningful from losing something meaningful.",
  "Through the moments of saying “goodbye”, we’ve learned a lot. We learned to slow down and find peace in the simple rhythms, like baking. We were reminded to embrace our family and to lean on each other more often. Most of all, we learned that real healing happens when you are supported by friends, family, and community. And for all of those lessons, that is why we’re here. Lil’ Loaves is our new narrative. It’s our way of designing a life of purpose, keeping family close, and turning our craft into a mission to feed others.",
  "While some of our founding members are no longer here with us to “see the rise”, their impact on our lives is the inspiration that drives us to build something enduring. From our table to yours, we hope to welcome you to the family we’re building, one hand-shaped loaf at a time. Pets are welcome, too!",
];

/* Hero bands: 110.77px of #efd895 every 221.54px from x=0, the group sitting at
   0.12 opacity. */
const HERO_STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(239,216,149,0.12) 0 110.77px, transparent 110.77px 221.54px)",
  backgroundPosition: `${CANVAS_ORIGIN} 0`,
};

/* The 402 mobile canvas draws the same bands wider and sparser: 80.32px every
   160.65px from x=0, phase-locked to 402 the way the desktop set is to 1440. */
const MOBILE_CANVAS_ORIGIN = "calc(50% - 201px)";

const HERO_STRIPES_MOBILE = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(239,216,149,0.12) 0 80.32px, transparent 80.32px 160.65px)",
  backgroundPosition: `${MOBILE_CANVAS_ORIGIN} 0`,
};

/* Gingham behind "Meet Our Doc & Chief": 35px bands of #e5c5bc at 0.07 on an
   88px pitch - horizontals from y=0, verticals from x=37. */
const MEET_GINGHAM_BG = {
  backgroundImage: [
    "repeating-linear-gradient(180deg, rgba(229,197,188,0.07) 0 35px, transparent 35px 88px)",
    "repeating-linear-gradient(90deg, transparent 0 37px, rgba(229,197,188,0.07) 37px 72px, transparent 72px 125px)",
  ].join(","),
  backgroundPosition: `${CANVAS_ORIGIN} 0`,
};

/* The pull-quote backdrop is not a full-bleed checkerboard: Figma scatters
   twelve 120.08px patches of 20.01px #999c89 checks (at 0.9 opacity) plus twelve
   bread motifs (at 0.7), then repeats that whole 241.83px band twice. Positions
   below are band-relative; BAND_TOPS places the two copies. */
/* Patch and motif y values below are section-relative for the first band; the
   second band is the same content shifted down by one band height. */
const QUOTE_BAND_OFFSETS = [0, 241.83];

/* Mobile scales the band down, so four of them are needed to cover the section
   once it starts 69px above the top edge. */
const QUOTE_BAND_OFFSETS_MOBILE = [0, 241.83, 483.66, 725.49];

/* [x, y, flipped] - four of the twelve patches start on an empty cell rather
   than a filled one, so they carry the opposite checker phase. */
const QUOTE_PATCHES = [
  [0, 1, false], [240.17, 1, true], [480.33, 1, false],
  [719.84, 1, true], [960, 1, false], [1200.17, 1, false],
  [120.75, 121.08, false], [360.25, 121.08, true], [599.75, 121.08, false],
  [839.92, 121.08, true], [1080.75, 121.08, false], [1320.25, 121.08, false],
];

/* Half of these are mirrored horizontally, which is what keeps the scatter from
   reading as a repeat. Figma reports it as rotation -180, but the transform is
   [[-1,0,tx],[0,1,ty]] - a scaleX(-1), and a 180deg rotation would not match. */
const QUOTE_MOTIFS = [
  { x: 386.6, y: 30.35, img: patternCroissant, w: 62.03, h: 60.94, flip: true },
  { x: 1346.6, y: 30.35, img: patternCroissant, w: 62.03, h: 60.94, flip: true },
  { x: 870.27, y: 30.35, img: patternCroissant, w: 62.03, h: 60.94 },
  { x: 749.52, y: 150.32, img: patternCroissant, w: 62.03, h: 60.94, flip: true },
  { x: 267.18, y: 150.44, img: patternCroissant, w: 62.03, h: 60.94 },
  { x: 1227.18, y: 150.44, img: patternCroissant, w: 62.03, h: 60.94 },
  { x: 130.42, y: 27.68, img: patternLoaf, w: 97.87, h: 59.15 },
  { x: 1090.42, y: 27.68, img: patternLoaf, w: 97.87, h: 59.15 },
  { x: 608.75, y: 27.68, img: patternLoaf, w: 97.87, h: 59.15, flip: true },
  { x: 9, y: 151.77, img: patternLoaf, w: 97.87, h: 59.15, flip: true },
  { x: 969, y: 151.77, img: patternLoaf, w: 97.87, h: 59.15, flip: true },
  { x: 490, y: 151.77, img: patternLoaf, w: 97.87, h: 59.15 },
];

/* The conic gradient starts on an empty top-left cell, so patches that start
   filled are offset by one cell. */
const QUOTE_PATCH_BG = {
  backgroundImage: "repeating-conic-gradient(#999c89 0 25%, transparent 0 50%)",
  backgroundSize: "40.02px 40.02px",
};

/* 30px checkerboard band above the shared footer - same phase as the Home
   page's Seasonal Specials strip. */
const DIVIDER_BG = {
  backgroundImage: "repeating-conic-gradient(#e5c5bc 0 25%, transparent 0 50%)",
  backgroundSize: "60px 60px",
  backgroundPosition: "calc(50% - 690px) 0",
};

/* Same band on the 402 canvas: 20.1px cells, top row starting on a filled one. */
const DIVIDER_BG_MOBILE = {
  backgroundImage: "repeating-conic-gradient(#e5c5bc 0 25%, transparent 0 50%)",
  backgroundSize: "40.2px 40.2px",
  backgroundPosition: "calc(50% - 180.9px) 0",
};

/* One repeat of the pull-quote backdrop, laid out in the 1440 canvas's units.
   Both breakpoints render the same composition; mobile just scales the wrapper. */
function QuoteBands({ offsets }) {
  return offsets.map((bandY) => (
    <div key={bandY}>
      <div className="absolute inset-x-0 top-0 opacity-90">
        {QUOTE_PATCHES.map(([x, y, flipped], i) => (
          <span
            key={i}
            className="absolute block"
            style={{
              left: x,
              top: bandY + y,
              width: 120.08,
              height: 120.08,
              ...QUOTE_PATCH_BG,
              backgroundPosition: flipped ? "0 0" : "20.01px 0",
            }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 opacity-70">
        {QUOTE_MOTIFS.map((m, i) => (
          <img
            key={i}
            src={m.img}
            alt=""
            className={`absolute max-w-none ${m.flip ? "-scale-x-100" : ""}`}
            style={{ left: m.x, top: bandY + m.y, width: m.w, height: m.h }}
          />
        ))}
      </div>
    </div>
  ));
}

export default function About() {
  return (
    <main className="w-full overflow-x-hidden bg-cream">
      {/* HERO - 769px tall, navbar floats over it */}
      <section className="relative w-full overflow-hidden bg-vanilla">
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={HERO_STRIPES_MOBILE}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={HERO_STRIPES}
        />

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

        <div className="relative mx-auto w-full max-w-[1440px] px-[16px] pt-[124px] lg:h-[769px] lg:px-0 lg:pt-0">
          <div className="flex flex-col items-center gap-[17px] lg:absolute lg:left-[72px] lg:top-[207px] lg:h-[562px] lg:w-[1295px] lg:flex-row lg:items-start lg:gap-[17px]">
            {/* welcome card */}
            <div className="relative h-[244.69px] w-[370px] shrink-0 lg:h-[450.35px] lg:w-[681px]">
              <img
                src={heroBlobText}
                alt=""
                className="absolute left-1/2 top-1/2 h-[370px] w-[244.69px] -translate-x-1/2 -translate-y-1/2 rotate-90 lg:h-[681px] lg:w-[450.35px]"
              />
              <div className="absolute left-[34.23px] top-[56.51px] flex w-[312.95px] flex-col items-start gap-[10.32px] lg:left-[63px] lg:top-[104px] lg:w-[576px] lg:gap-[25px]">
                <h1 className="w-[296.11px] font-parkinsans text-[24px] font-medium uppercase leading-[34px] tracking-[-1.2px] text-white lg:w-[545px] lg:text-[36px] lg:leading-[50px] lg:tracking-[-1.8px]">
                  welcome to Lil&rsquo; Loaves!
                </h1>
                <p className="font-dm text-[10.87px] text-white lg:w-[576px] lg:font-parkinsans lg:text-[20px] lg:leading-[28px]">
                  We&rsquo;re a family-owned bakery with a simple mission: make
                  bread, do it right, keep family close, and our community fed.
                </p>
                <button
                  type="button"
                  className="cursor-pointer whitespace-nowrap rounded-full bg-[#fdfcf8] px-[23.19px] py-[7.73px] font-parkinsans text-[10.87px] text-cocoa lg:rounded-[88.92px] lg:px-[42.68px] lg:py-[14.23px] lg:text-[16px] lg:leading-[22px]"
                >
                  Explore Our Menu
                </button>
              </div>
            </div>

            {/* hero photo - Figma holds this as a 562x597 portrait frame turned
                -90deg inside a 597x562 slot, and crops the landscape source to
                159.61% wide at left -15.29%. Dropping the source straight in
                with object-cover laid the loaf on its side. The inner box is
                the container's dimensions swapped, so rotating it back lands
                exactly on the slot. */}
            <div className="relative h-[299px] w-[318px] shrink-0 overflow-hidden lg:h-[562px] lg:w-[597px]">
              <div className="absolute left-1/2 top-1/2 h-[318px] w-[299px] -translate-x-1/2 -translate-y-1/2 -rotate-90 overflow-hidden lg:h-[597px] lg:w-[562px]">
                <img
                  src={heroPhoto}
                  alt="Hands presenting a freshly baked braided loaf"
                  className="absolute left-[-15.29%] top-[-0.05%] h-[100.1%] w-[159.61%] max-w-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY QUICK-NAV */}
      <CategoryStrip />

      {/* MEET OUR DOC & CHIEF */}
      <section className="relative w-full overflow-hidden bg-cream lg:h-[782px]">
        <div className="pointer-events-none absolute inset-0" style={MEET_GINGHAM_BG} />
        <div className="relative mx-auto flex w-full max-w-[1079px] flex-col items-center gap-[24px] px-[16px] pb-[79.6px] pt-[86px] lg:px-0 lg:pb-[60px] lg:pt-[57px]">
          <div className="flex items-center justify-center gap-[8px] text-center font-parkinsans font-medium uppercase text-cocoa lg:h-[67px] lg:gap-[5px]">
            <p className="text-[24px] leading-[34px] tracking-[-1.2px] lg:text-[36px] lg:leading-[50px] lg:tracking-[-1.8px]">
              Meet Our Doc
            </p>
            {/* Medium on the 402 canvas, Regular at 1440 - Figma sets the two
                ampersands differently, so the weight is overridden at lg. */}
            <span className="text-[35.37px] leading-[50px] tracking-[-1.77px] text-transparent [-webkit-text-fill-color:transparent] [-webkit-text-stroke:1px_#57423d] lg:text-[48px] lg:font-normal lg:leading-[67px] lg:tracking-normal lg:[-webkit-text-stroke:2px_#57423d]">
              &amp;
            </span>
            <p className="text-[24px] leading-[34px] tracking-[-1.2px] lg:text-[36px] lg:leading-[50px] lg:tracking-[-1.8px]">
              Chief
            </p>
          </div>

          <div className="relative h-[169.4px] w-full overflow-hidden rounded-[5.49px] lg:h-[494px] lg:w-[1079px] lg:rounded-[16px]">
            <img
              src={meetCorgis}
              alt="Illustration of Doc and Chief, the two corgis behind Lil' Loaves"
              className="absolute left-[26.78%] top-[4.68%] h-[90.58%] w-[46.43%] object-contain"
            />
          </div>

          <p className="text-center font-parkinsans text-[16px] text-cocoa lg:w-[1079px] lg:text-[20px] lg:leading-[28px]">
            We created Lil&rsquo; Loaves to build something meaningful from a
            season of loss and transition. Every loaf we shape is for that
            purpose. This isn&rsquo;t just a bakery; it&rsquo;s our narrative.
          </p>
        </div>
      </section>

      {/* PULL QUOTE */}
      <section className="relative w-full overflow-hidden bg-[#eee2df] lg:h-[483px]">
        {/* The 402 canvas draws the same band at 0.5711 (patches 120.08 ->
            68.58, croissants 62.03 -> 35.43, loaves 97.87 -> 55.90 all carry
            that one ratio), starting 69px above the section and repeated four
            times to cover its 414px. */}
        <div className="pointer-events-none absolute left-1/2 top-[-69px] w-[1440px] origin-top -translate-x-1/2 scale-[0.5711] lg:hidden">
          <QuoteBands offsets={QUOTE_BAND_OFFSETS_MOBILE} />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-[1440px] -translate-x-1/2 lg:block">
          <QuoteBands offsets={QUOTE_BAND_OFFSETS} />
        </div>

        <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-center px-[40px] py-[63px] lg:h-full lg:px-0 lg:py-0">
          <div className="relative flex w-full max-w-[1199px] items-center justify-center rounded-[16px] bg-[#f7f5f1] px-[16px] py-[60px] lg:h-[242px] lg:p-[10px]">
            <img
              src={quoteMark}
              alt=""
              className="absolute left-0 top-[31px] size-[71px] opacity-[0.4] lg:left-[29px] lg:top-[60px] lg:size-[83px]"
            />
            {/* Figma sets this on one line with a double space after each
                comma, so the desktop copy keeps them and turns off collapsing. */}
            <p className="relative max-w-[290px] text-center font-parkinsans text-[32px] font-medium uppercase leading-[42px] tracking-[-1.6px] text-cocoa lg:max-w-none lg:whitespace-pre lg:text-[36px] lg:font-normal lg:leading-[50px] lg:tracking-[-1.8px]">
              {"Every loaf tells a story of love,  loss,  and new beginnings."}
            </p>
          </div>
        </div>
      </section>

      {/* TRIBUTE */}
      {/* pb carries the 16.42px of cream Figma leaves between this section and
          the checkerboard band; both are cream, so it reads as one gap. */}
      <section className="w-full bg-cream px-[16px] pb-[76.42px] pt-[60px] lg:h-[717px] lg:px-0 lg:py-[60px]">
        <div className="mx-auto flex h-full w-full max-w-[1218.29px] flex-col items-center gap-[52px] lg:flex-row lg:items-center lg:justify-center lg:gap-[18px]">
          <div className="flex w-full flex-col gap-[29px] text-cocoa lg:h-[488px] lg:w-[745px] lg:shrink-0 lg:gap-[25px]">
            <h2 className="font-parkinsans text-[20px] font-medium uppercase leading-[28px] tracking-[-1px] lg:text-[32px] lg:leading-[45px] lg:tracking-[-1.6px]">
              Tribute
            </h2>
            {/* Figma keeps this as one text node with a blank line between the
                paragraphs, so the gap equals one line box (16px Parkinsans at
                leading-normal = 22.4px). */}
            <div className="flex flex-col gap-[22px] text-justify font-parkinsans text-[16px] leading-[22px]">
              {TRIBUTE_PARAGRAPHS.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Figma's "Group 185" exported whole at each breakpoint - photo and
              tape in one file, so neither the tape's rotated position nor the
              two frames' different arrangements have to be rebuilt in CSS.
              402 canvas: 370x558.58. 1440 canvas: 455.29x597. */}
          <img
            src={tributeGroupMobile}
            alt="Doc, one of the corgis behind Lil' Loaves"
            className="w-full max-w-[370px] shrink-0 lg:hidden"
          />
          <img
            src={tributeGroup}
            alt="Doc, one of the corgis behind Lil' Loaves"
            className="hidden shrink-0 lg:block lg:h-[597px] lg:w-[455.29px]"
          />
        </div>
      </section>

      {/* checkerboard transition band above the (shared) Footer - 30px cells on
          desktop, 20.1px on the 402 canvas, each phase-locked to its own. */}
      <div className="h-[40.2px] w-full lg:hidden" style={DIVIDER_BG_MOBILE} />
      <div className="hidden h-[60px] w-full lg:block" style={DIVIDER_BG} />
    </main>
  );
}
