import PageHero from "../components/PageHero.jsx";

import dotsBg from "../assets/gallery/dots-bg.svg";
import dotsBgMobile from "../assets/gallery/dots-bg-mobile.svg";
import iconCamera from "../assets/gallery/icon-camera.svg";
import iconQuote from "../assets/gallery/icon-quote.svg";
import heartIcon from "../assets/gallery/heart.svg";
import memoriesBlob from "../assets/gallery/memories-blob.svg";
import paginationDots from "../assets/gallery/pagination-dots.svg";
import tapeIcon from "../assets/gallery/tape.svg";
import ribbonIcon from "../assets/gallery/ribbon.svg";
import testimonialPhoto from "../assets/gallery/testimonial-photo.jpg";
import testimonialPhotoMobile from "../assets/gallery/testimonial-photo-mobile.jpg";

import photoR0C0 from "../assets/gallery/photo-r0-c0.webp";
import photoR0C1 from "../assets/gallery/photo-r0-c1.webp";
import photoR0C2 from "../assets/gallery/photo-r0-c2.webp";
import photoR1C0 from "../assets/gallery/photo-r1-c0.webp";
import photoR1C1 from "../assets/gallery/photo-r1-c1.webp";
import photoR1C2 from "../assets/gallery/photo-r1-c2.webp";
import photoR1C3 from "../assets/gallery/photo-r1-c3.webp";
import photoR2C0 from "../assets/gallery/photo-r2-c0.webp";
import photoR2C1 from "../assets/gallery/photo-r2-c1.webp";
import photoR2C2 from "../assets/gallery/photo-r2-c2.webp";
import photoR2C3 from "../assets/gallery/photo-r2-c3.webp";
import photoR3C1 from "../assets/gallery/photo-r3-c1.webp";
import photoR3C2 from "../assets/gallery/photo-r3-c2.webp";
import photoR3C3 from "../assets/gallery/photo-r3-c3.webp";
import photoR4C2 from "../assets/gallery/photo-r4-c2.webp";
import photoR4C3 from "../assets/gallery/photo-r4-c3.webp";

/* Figma's "Group 178" (247:5124) is hand-placed, not a grid: the columns run on
   a ~277.4px pitch and the rows on ~278.9px, but every tile carries its own
   size and each row sits a pixel or three off its neighbours. So the desktop
   mosaic is laid out from the board's own numbers rather than from a uniform
   grid, inside the 1075 x 1354.35 box of "Frame 2798". Column 3 of row 0 and
   column 0 of row 3 are empty by design - the heart and the "lil memories"
   lockup fill those holes. */
const DESKTOP_TILES = [
  { src: photoR0C0, x: 0, y: 0.83, w: 236.95, h: 237.78 },
  { src: photoR0C1, x: 276.86, y: 0, w: 237.78, h: 238.61 },
  { src: photoR0C2, x: 551.22, y: 0, w: 236.95, h: 237.78 },
  { src: photoR1C0, x: 0, y: 278.52, w: 239.44, h: 240.27 },
  { src: photoR1C1, x: 279.35, y: 278.52, w: 239.44, h: 240.27 },
  { src: photoR1C2, x: 558.7, y: 278.52, w: 240.27, h: 240.27 },
  { src: photoR1C3, x: 838.88, y: 280.18, w: 236.12, h: 236.12 },
  { src: photoR2C0, x: 0, y: 558.7, w: 237.78, h: 238.61 },
  { src: photoR2C1, x: 277.69, y: 558.7, w: 236.95, h: 237.78 },
  { src: photoR2C2, x: 554.54, y: 559.53, w: 237.78, h: 237.78 },
  { src: photoR2C3, x: 832.23, y: 558.7, w: 237.78, h: 238.61 },
  { src: photoR3C1, x: 276.86, y: 837.22, w: 237.78, h: 238.61 },
  { src: photoR3C2, x: 554.54, y: 837.22, w: 237.78, h: 238.61 },
  { src: photoR3C3, x: 832.23, y: 838.05, w: 237.78, h: 237.78 },
  { src: photoR4C2, x: 554.54, y: 1115.74, w: 237.78, h: 238.61 },
  { src: photoR4C3, x: 832.23, y: 1116.57, w: 237.78, h: 237.78 },
];

/* The 402 board (254:15608) reshuffles the mosaic into seven two-up rows rather
   than reflowing the desktop grid: it drops four of the sixteen tiles, reorders
   the rest, and gives every row its own gutter and cross-axis alignment - which
   is what staggers the tiles vertically. Widths are percentages of the 370px
   column so the rows still fit a phone narrower than the board.

   Sizes below are the board's px converted to % of 370, e.g. 168.72 -> 45.6%. */
const MOBILE_ROWS = [
  {
    gap: "16.32%",
    align: "items-center",
    cells: [
      { src: photoR0C2, w: "45.600%", ratio: "168.72/169.312" },
      { kind: "heart", w: "30.503%", ratio: "112.862/95.933" },
    ],
  },
  {
    gap: "7.680%",
    align: "items-end",
    cells: [
      { src: photoR0C0, w: "45.600%", ratio: "168.72/169.312" },
      { src: photoR0C1, w: "45.760%", ratio: "169.312/169.904" },
    ],
  },
  {
    gap: "7.680%",
    align: "items-center",
    cells: [
      { src: photoR1C0, w: "46.080%", ratio: "170.496/171.088" },
      { src: photoR1C1, w: "46.080%", ratio: "170.496/171.088" },
    ],
  },
  {
    gap: "8.160%",
    align: "items-center",
    cells: [
      { kind: "memories", w: "44.960%" },
      { src: photoR1C2, w: "46.240%", ratio: "1/1" },
    ],
  },
  {
    gap: "7.680%",
    align: "items-start",
    cells: [
      { src: photoR2C0, w: "45.760%", ratio: "169.312/169.904" },
      { src: photoR2C1, w: "45.600%", ratio: "168.72/169.312" },
    ],
  },
  {
    gap: "7.680%",
    align: "items-end",
    cells: [
      { src: photoR2C2, w: "45.760%", ratio: "1/1" },
      { src: photoR2C3, w: "45.760%", ratio: "169.312/169.904" },
    ],
  },
  {
    gap: "8.800%",
    align: "items-end",
    cells: [
      { src: photoR1C3, w: "45.440%", ratio: "1/1" },
      { src: photoR4C3, w: "45.760%", ratio: "1/1" },
    ],
  },
];

/* Figma "Frame 2797". "lil" sits in a 122.216px box while its line box is
   155.2px tall, which is how the board pulls "memories" up to y=100.13 - so the
   two lines are placed outright instead of stacked. The 402 board repeats the
   block at 0.4378 of this size - its 54.275px type and its 94.69x59.72 blob are
   both exactly that fraction of these numbers - so mobile scales this rather
   than restating it. */
function MemoriesLockup() {
  return (
    <div className="relative h-[255.13px] w-[379.95px]">
      <p className="absolute left-0 top-0 w-full font-greatvibes text-[123.964px] leading-[155.2px] text-cocoa">
        lil
      </p>
      <div className="absolute left-0 top-[100.13px] w-full">
        <img
          src={memoriesBlob}
          alt=""
          className="absolute left-[164.32px] top-[-0.05px] h-[136.39px] w-[216.28px] max-w-none"
        />
        <p className="relative font-greatvibes text-[123.964px] leading-[155.2px] text-cocoa">
          memories
        </p>
      </div>
    </div>
  );
}

/* Figma "Group 194". The ribbon and its three lines are siblings on the board,
   each with its own angle, so they are placed that way rather than nested in a
   single rotated block. Coordinates are the group's own 183.02 x 134.6 box; the
   402 board draws the same group at 0.6895 of it. */
function RibbonBadge() {
  return (
    <div className="relative h-[134.6px] w-[183.02px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={ribbonIcon}
          alt=""
          aria-hidden="true"
          className="h-[162.69px] w-[94.62px] max-w-none flex-none rotate-[106.14deg]"
        />
      </div>
      <div className="absolute left-[26.91px] top-[14.56px] flex h-[77.16px] w-[137.76px] items-center justify-center">
        <p className="w-[131px] flex-none rotate-[15.86deg] font-display text-[39.118px] leading-normal text-white">
          GOOD FOOD
        </p>
      </div>
      <div className="absolute left-[18.17px] top-[45.34px] flex h-[77.16px] w-[137.76px] items-center justify-center">
        <p className="w-[131px] flex-none rotate-[15.86deg] font-display text-[39.118px] leading-normal text-white">
          GOOD MOOD
        </p>
      </div>
      {/* The ampersand is the one glyph Ligema DEMO does not ship, so the board
          is already showing a fallback here - a calligraphic form that Rochester
          matches. Figma also gives it a white outline over a fill the same
          colour as the ribbon, so what reads is the outline alone, cut through
          the two white lines it overlaps. Text strokes are absent from the MCP
          output, so the width is measured off the board. */}
      <div className="absolute left-[71.6px] top-[43.88px] flex h-[49.56px] w-[40.61px] items-center justify-center">
        <p className="w-[30px] flex-none rotate-[15.86deg] font-rochester text-[39.118px] leading-normal text-[#c75e02] [-webkit-text-stroke:1.1px_#ffffff]">
          &amp;
        </p>
      </div>
    </div>
  );
}

/* Washi tape, Figma 247:5187. The SVG's own box is larger than the taped area -
   it carries the shadow - so the leaf is offset inside its 48.65 x 164.33 slot
   before the whole thing is flipped and turned. The 402 board reuses it at
   0.6895, the same fraction as the ribbon. */
function WashiTape() {
  return (
    <div className="flex h-[139.35px] w-[159.54px] items-center justify-center">
      <div className="flex-none -scale-y-100 rotate-[127.91deg]">
        <div className="relative h-[164.33px] w-[48.65px]">
          <img
            src={tapeIcon}
            alt=""
            aria-hidden="true"
            className="absolute left-[-14.51px] top-[-6.69px] h-[181.18px] w-[65.51px] max-w-none"
          />
        </div>
      </div>
    </div>
  );
}

const TESTIMONIAL = `I ordered the sourdough after seeing it online, and it completely exceeded my expectations. The crust had the perfect crunch, while the inside was incredibly soft and flavorful. You can tell every loaf is made with patience and genuine care. It's rare to find bread that tastes this fresh and homemade, and it reminded me of the kind my grandmother used to bake. Lil' Loaves has quickly become our new weekend tradition.`;

function MobileCell({ cell }) {
  if (cell.kind === "heart") {
    return (
      <img
        src={heartIcon}
        alt=""
        style={{ width: cell.w, aspectRatio: cell.ratio }}
        className="shrink-0"
      />
    );
  }

  if (cell.kind === "memories") {
    return (
      <div
        style={{ width: cell.w }}
        className="h-[111.7px] shrink-0 overflow-visible"
      >
        <div className="origin-top-left scale-[0.4378]">
          <MemoriesLockup />
        </div>
      </div>
    );
  }

  return (
    <img
      src={cell.src}
      alt=""
      style={{ width: cell.w, aspectRatio: cell.ratio }}
      className="shrink-0"
    />
  );
}

/* Figma stacks two bands of rectangles over a #f7f5f1 field: 35px verticals on
   an 88px pitch and 32.757px horizontals on an 82.757px pitch. Sampling the
   board gives #f7f5f1 for the field, #f6f2ed where one band lies and #f5efe9
   where two cross - which is one tint painted twice at 0.1, not two opaque
   fills, hence the translucent layers. */
const PLAID_BANDS = [
  "repeating-linear-gradient(90deg, rgba(238,216,202,0.1) 0 35px, transparent 35px 88px)",
  "repeating-linear-gradient(180deg, rgba(238,216,202,0.1) 0 32.757px, transparent 32.757px 82.757px)",
].join(",");

/* Desktop starts the verticals at the section's own left edge. The 402 board
   slides the same 1440-wide sheet 523px left, which puts its bands at x=5, 93,
   181... - so mobile is phase-locked to the centre of the 402 canvas instead. */
const MOSAIC_PLAID = { backgroundImage: PLAID_BANDS };
const MOSAIC_PLAID_MOBILE = {
  backgroundImage: PLAID_BANDS,
  backgroundPosition: "calc(50% - 196px) 0",
};

/* Every heading on the page is Parkinsans Medium tracked at -0.05em. The 402
   board still sets these four in Ligema DEMO at its old sizes - it predates the
   type migration the 1440 board has already been through - so the faces follow
   desktop while the sizes are the ones that reproduce the board's cap height
   (17px for the two section headings, 15px for the hero title). */
const HEADING = "font-parkinsans font-medium uppercase tracking-[-0.05em]";

export default function Gallery() {
  return (
    <main className="w-full bg-cream">
      <PageHero title="Gallery" />

      {/* A Peek Inside Lil' Loaves - Figma 247:5147 / 254:15386. Clipped on x
          only: the dot row is wider than the viewport and would scroll the page
          sideways, but it is also meant to hang past the band's bottom edge,
          which plain overflow-hidden would cut off. */}
      {/* z-10 keeps the dot row on top: the mosaic below is positioned too, so
          without it that later sibling paints its plaid over the scallop. */}
      <section className="relative z-10 w-full overflow-x-clip bg-cream">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-[40px] px-[16px] py-[60px] lg:h-[409px] lg:justify-center lg:gap-[64px] lg:px-[72px] lg:py-0">
          <div className="flex flex-col gap-[14.77px] text-cocoa lg:gap-[24px]">
            <h2
              className={`${HEADING} text-[24.3px] leading-[35.08px] lg:text-[40px] lg:leading-[57px]`}
            >
              A Peek Inside Lil&apos; Loaves
            </h2>
            {/* 21px lines on mobile and 34px on desktop, not Parkinsans' own
                normal - Figma reports the blocks at 84px and 68px tall. */}
            <p className="text-justify font-parkinsans text-[14.77px] leading-[21px] lg:w-[1126px] lg:text-[24px] lg:leading-[34px]">
              From hand-shaped loaves fresh out of the oven to sweet treats
              made with care, here&apos;s a glimpse of the moments, flavors,
              and craftsmanship that make Lil&apos; Loaves feel like home.
            </p>
          </div>

          <button
            type="button"
            className="flex cursor-pointer items-center gap-[6.15px] rounded-full bg-taupe px-[29.54px] py-[9.85px] lg:gap-[10px] lg:px-[48px] lg:py-[16px]"
          >
            <img
              src={iconCamera}
              alt=""
              className="size-[18px] shrink-0 lg:size-[24px]"
            />
            <span className="whitespace-nowrap font-parkinsans text-[16px] leading-[22px] text-white">
              Submit your Pictures Here
            </span>
          </button>
        </div>

        {/* Group 153: a row of overlapping circles, so its underside reads as a
            scallop. Both boards hang it past the band's bottom edge over the
            mosaic - 60.46px on the 1440 canvas, 32.69px on the 402 one - and
            each has its own circle count, so they are separate exports rather
            than one asset scaled. */}
        <img
          src={dotsBgMobile}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-32.69px] left-[-65px] h-[75.23px] w-[974.92px] max-w-none lg:hidden"
        />
        <img
          src={dotsBg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute hidden lg:bottom-[-60.46px] lg:left-[calc(50%-750px)] lg:block lg:h-[115.46px] lg:w-[1501px]"
        />
      </section>

      {/* Photo mosaic + lil memories - Figma 247:5076 / 254:15599. Both boards
          tuck this under the band above - 33px on desktop, 4.54px on mobile - so
          the two overlap; that slice is hidden behind the band's own fill either
          way, but the overlap is what keeps each page its designed height. The
          band above is positioned, so it paints over this section. */}
      <section className="relative mt-[-4.54px] w-full overflow-hidden bg-linen lg:mt-[-33px]">
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={MOSAIC_PLAID_MOBILE}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={MOSAIC_PLAID}
        />

        <div className="relative flex flex-col gap-[21.31px] px-[16px] pb-[98.62px] pt-[105px] lg:hidden">
          {MOBILE_ROWS.map((row, i) => (
            <div
              key={i}
              className={`flex w-full ${row.align}`}
              style={{ columnGap: row.gap }}
            >
              {row.cells.map((cell, j) => (
                <MobileCell key={j} cell={cell} />
              ))}
            </div>
          ))}
        </div>

        <div className="relative mx-auto hidden w-full max-w-[1440px] lg:block">
          <div className="relative h-[1705px] w-full">
            <div className="absolute left-[181px] top-[219px] h-[1354.35px] w-[1075px]">
              {DESKTOP_TILES.map(({ src, x, y, w, h }) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="absolute max-w-none"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${w}px`,
                    height: `${h}px`,
                  }}
                />
              ))}

              <img
                src={heartIcon}
                alt=""
                className="absolute left-[864.12px] top-[51.26px] h-[134.73px] w-[158.5px] max-w-none"
              />

              <div className="absolute left-[60.69px] top-[1075.83px]">
                <MemoriesLockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hear it from our customers - Figma 247:5174 / 254:15609. The 402 board
          stacks it and drops the opening quote mark; the 1440 one lays it out
          side by side at fixed coordinates. */}
      <section className="w-full overflow-hidden bg-cream lg:px-0 lg:py-0">
        <div className="flex flex-col items-start gap-[25px] px-[16px] py-[60px] lg:hidden">
          {/* Frame 2746 */}
          <div className="w-full">
            <h2 className={`${HEADING} text-[24.3px] leading-[44px] text-cocoa`}>
              Hear it from our customers
            </h2>
            {/* DM Sans stands in for Neulis Sans and sets a little narrower, so
                at 370px it saves a line the board does not - which would pull
                everything below it up by 21px. 0.4px of tracking restores the
                board's 10-line measure and its 252px block. Desktop is wide
                enough that its line count never changed, so it opts out. */}
            <div className="mt-[20.67px] text-justify font-dm text-[16px] leading-[21px] tracking-[0.4px] text-bark">
              <p>{TESTIMONIAL}</p>
              <p>&nbsp;</p>
              <p>-Emily R.</p>
            </div>
          </div>

          {/* Frame 2147225573 - the tape and ribbon hang outside this box, so it
              stays the positioning context for both. */}
          <div className="relative flex w-full flex-col items-center gap-[25px]">
            <img
              src={testimonialPhotoMobile}
              alt="Freshly baked sourdough loaf being sliced on a plaid cloth"
              className="h-[425px] w-full rounded-[8px] object-cover"
            />
            <img
              src={paginationDots}
              alt=""
              aria-hidden="true"
              className="h-[6.08px] w-[49.85px]"
            />
            <div className="pointer-events-none absolute left-[62.162%] top-[-46.67px] origin-top-left scale-[0.6895]">
              <RibbonBadge />
            </div>
            <div className="pointer-events-none absolute left-[-9.189%] top-[354.33px] origin-top-left scale-[0.6895]">
              <WashiTape />
            </div>
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-[1440px] lg:block">
          <div className="relative h-[561px] w-full">
            <img
              src={iconQuote}
              alt=""
              aria-hidden="true"
              className="absolute left-[88px] top-[174px] size-[61px]"
            />

            {/* Frame 2746 */}
            <div className="absolute left-[114px] top-[118.5px] h-[324px] w-[602px]">
              <h2 className={`${HEADING} text-[32px] leading-[45px] text-cocoa`}>
                Hear it from our customers
              </h2>
              {/* Figma sets Neulis Sans on 21px lines here. DM Sans stands in
                  for it project-wide, and its own normal leading is 24px, so
                  the 21 is pinned rather than inherited. */}
              <div className="mt-[34px] text-justify font-dm text-[16px] leading-[21px] text-bark">
                <p>{TESTIMONIAL}</p>
                <p>&nbsp;</p>
                <p>-Emily R.</p>
              </div>
              <img
                src={paginationDots}
                alt=""
                aria-hidden="true"
                className="absolute left-[520px] top-[314px] h-[10px] w-[82px]"
              />
            </div>

            {/* Group 183. Figma frames the shot as a 525.63 x 403.13 window on
                a wider image, trimming 7.51% off the left and 6.37% off the
                right; the export is already cut to that window, so it just
                fills the box. */}
            <div className="absolute left-[800.37px] top-[78.94px] h-[403.13px] w-[525.63px] overflow-hidden">
              <img
                src={testimonialPhoto}
                alt="Freshly baked sourdough loaf being sliced on a plaid cloth"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute left-[754px] top-[342.62px]">
              <WashiTape />
            </div>

            <div className="absolute left-[1190px] top-[17.9px]">
              <RibbonBadge />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
