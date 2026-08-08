import PageHero from "../components/PageHero.jsx";

import dotsBg from "../assets/gallery/dots-bg.svg";
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

/* Mobile mosaic: 2 columns, plain sequential flow. Kept as-is pending its own
   Figma frame; the tiles are the same scallop-masked exports. */
const MOBILE_GRID = [
  { kind: "photo", src: photoR0C0 },
  { kind: "heart" },
  { kind: "photo", src: photoR0C1 },
  { kind: "photo", src: photoR0C2 },
  { kind: "photo", src: photoR1C0 },
  { kind: "photo", src: photoR1C1 },
  { kind: "text" },
  { kind: "photo", src: photoR1C2 },
  { kind: "photo", src: photoR1C3 },
  { kind: "photo", src: photoR2C0 },
  { kind: "photo", src: photoR2C1 },
  { kind: "photo", src: photoR2C2 },
  { kind: "photo", src: photoR2C3 },
  { kind: "photo", src: photoR3C1 },
];

/* Figma "Frame 2797". "lil" sits in a 122.216px box while its line box is
   155.2px tall, which is how the board pulls "memories" up to y=100.13 - so the
   two lines are placed outright instead of stacked. Drawn once at the board's
   own size and scaled down for the mobile cell. */
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
   single rotated block. Coordinates are the group's own 183.02 x 134.6 box. */
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

const TESTIMONIAL = `I ordered the sourdough after seeing it online, and it completely exceeded my expectations. The crust had the perfect crunch, while the inside was incredibly soft and flavorful. You can tell every loaf is made with patience and genuine care. It's rare to find bread that tastes this fresh and homemade, and it reminded me of the kind my grandmother used to bake. Lil' Loaves has quickly become our new weekend tradition.`;

function MobileCell({ cell }) {
  if (cell.kind === "heart") {
    return (
      <div className="flex aspect-square items-center justify-center">
        <img src={heartIcon} alt="" className="h-[70px] w-[82.4px]" />
      </div>
    );
  }

  if (cell.kind === "text") {
    return (
      <div className="flex items-center">
        <div className="relative h-[107.03px] w-[159.4px]">
          <div className="absolute left-0 top-0 origin-top-left scale-[0.4195]">
            <MemoriesLockup />
          </div>
        </div>
      </div>
    );
  }

  return <img src={cell.src} alt="" className="aspect-square w-full" />;
}

/* Figma stacks two bands of rectangles over a #f7f5f1 field: 35px verticals on
   an 88px pitch and 32.757px horizontals on an 82.757px pitch, both starting at
   the section's own top-left. Sampling the board gives #f7f5f1 for the field,
   #f6f2ed where one band lies and #f5efe9 where two cross - which is one tint
   painted twice at 0.1, not two opaque fills, hence the translucent layers. */
const MOSAIC_PLAID = {
  backgroundColor: "#f7f5f1",
  backgroundImage: [
    "repeating-linear-gradient(90deg, rgba(238,216,202,0.1) 0 35px, transparent 35px 88px)",
    "repeating-linear-gradient(180deg, rgba(238,216,202,0.1) 0 32.757px, transparent 32.757px 82.757px)",
  ].join(","),
};

/* Both section headings are Parkinsans Medium tracked at -0.05em, same as the
   hero title. */
const HEADING = "font-parkinsans font-medium uppercase tracking-[-0.05em]";

export default function Gallery() {
  return (
    <main className="w-full bg-cream">
      <PageHero title="Gallery" />

      {/* A Peek Inside Lil' Loaves - Figma "Frame 2795" (247:5147). Clipped on
          x only: the dot row is wider than the viewport and would scroll the
          page sideways, but it is also meant to hang past the band's bottom
          edge, which plain overflow-hidden would cut off. */}
      <section className="relative w-full overflow-x-clip bg-cream">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-[40px] px-[16px] py-[60px] lg:h-[409px] lg:justify-center lg:gap-[64px] lg:px-[72px] lg:py-0">
          <div className="flex flex-col gap-[15px] text-cocoa lg:gap-[24px]">
            <h2
              className={`${HEADING} text-[18.5px] leading-normal lg:text-[40px] lg:leading-[57px]`}
            >
              A Peek Inside Lil&apos; Loaves
            </h2>
            {/* 34px lines, not Parkinsans' own 36px normal - Figma reports the
                two-line block at 68px tall. */}
            <p className="text-justify font-parkinsans text-[15px] lg:w-[1126px] lg:text-[24px] lg:leading-[34px]">
              From hand-shaped loaves fresh out of the oven to sweet treats
              made with care, here&apos;s a glimpse of the moments, flavors,
              and craftsmanship that make Lil&apos; Loaves feel like home.
            </p>
          </div>

          <button
            type="button"
            className="flex cursor-pointer items-center gap-[6px] rounded-full bg-taupe px-[30px] py-[10px] lg:gap-[10px] lg:px-[48px] lg:py-[16px]"
          >
            <img
              src={iconCamera}
              alt=""
              className="size-[18px] shrink-0 lg:size-[24px]"
            />
            <span className="whitespace-nowrap font-parkinsans text-[16px] text-white">
              Submit your Pictures Here
            </span>
          </button>
        </div>

        {/* Group 153: 18 circles of r=57.73 on an 86.6px pitch, so the row's
            underside reads as a scallop. Figma runs it from x=-30 to x=1471 and
            hangs it 60.46px past the band's bottom edge, over the mosaic. */}
        <img
          src={dotsBg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[-32px] h-[75px] w-full lg:inset-x-auto lg:bottom-[-60.46px] lg:left-[calc(50%-750px)] lg:h-[115.46px] lg:w-[1501px]"
        />
      </section>

      {/* Photo mosaic + lil memories - Figma "Frame 2799" (247:5076). The board
          starts it at y=781, 33px under the band above, so the two overlap;
          that slice is hidden behind the band's own fill either way, but the
          overlap is what keeps the page its designed 3506px. The band above is
          positioned, so it paints over this section's background. */}
      <section
        className="w-full overflow-hidden pb-[60px] pt-[56px] lg:mt-[-33px] lg:py-0"
        style={MOSAIC_PLAID}
      >
        <div className="px-[16px] lg:hidden">
          <div className="grid grid-cols-2 gap-[16px]">
            {MOBILE_GRID.map((cell, i) => (
              <MobileCell key={i} cell={cell} />
            ))}
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-[1440px] lg:block">
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

      {/* Hear it from our customers - Figma "Frame 2747" (247:5174), 561px. */}
      <section className="w-full overflow-hidden bg-cream px-[16px] py-[60px] lg:px-0 lg:py-0">
        {/* Mobile keeps the stacked flow; desktop is the board's own 1440x561
            arrangement, where the tape and ribbon overhang the photo. */}
        <div className="flex flex-col gap-[40px] lg:hidden">
          <div className="flex flex-col gap-[25px]">
            <div className="flex flex-col gap-[20px]">
              <h2
                className={`${HEADING} text-[15.2px] leading-normal text-cocoa`}
              >
                Hear it from our customers
              </h2>
              <div className="text-justify font-dm text-[16px] text-bark">
                <p>{TESTIMONIAL}</p>
                <p className="mt-[20px]">-Emily R.</p>
              </div>
            </div>
            <img
              src={paginationDots}
              alt=""
              aria-hidden="true"
              className="h-[10px] w-[82px] self-center"
            />
          </div>

          <div className="relative">
            <img
              src={testimonialPhotoMobile}
              alt="Freshly baked sourdough loaf being sliced on a plaid cloth"
              className="h-[300px] w-full rounded-[8px] object-cover"
            />
            <img
              src={tapeIcon}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-[22px] -left-[18px] h-[120px] w-[38px] -scale-y-100 rotate-[128deg]"
            />
            {/* Same badge as desktop, scaled to the 136x100 slot it occupies
                here. Its own frame has not been checked against Figma yet. */}
            <div className="absolute -right-[10px] -top-[18px] h-[100px] w-[136px]">
              <div className="origin-top-left scale-[0.7431]">
                <RibbonBadge />
              </div>
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

            {/* Washi tape. The SVG's own box is larger than the taped area - it
                carries the shadow - so the leaf is offset inside its
                48.65 x 164.33 slot before the whole thing is flipped and turned. */}
            <div className="absolute left-[754px] top-[342.62px] flex h-[139.35px] w-[159.54px] items-center justify-center">
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

            <div className="absolute left-[1190px] top-[17.9px]">
              <RibbonBadge />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
