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

import photoR0C0 from "../assets/gallery/photo-r0-c0.png";
import photoR0C1 from "../assets/gallery/photo-r0-c1.png";
import photoR0C2 from "../assets/gallery/photo-r0-c2.png";
import photoR1C0 from "../assets/gallery/photo-r1-c0.png";
import photoR1C1 from "../assets/gallery/photo-r1-c1.png";
import photoR1C2 from "../assets/gallery/photo-r1-c2.png";
import photoR1C3 from "../assets/gallery/photo-r1-c3.png";
import photoR2C0 from "../assets/gallery/photo-r2-c0.png";
import photoR2C1 from "../assets/gallery/photo-r2-c1.png";
import photoR2C2 from "../assets/gallery/photo-r2-c2.png";
import photoR2C3 from "../assets/gallery/photo-r2-c3.png";
import photoR3C1 from "../assets/gallery/photo-r3-c1.png";
import photoR3C2 from "../assets/gallery/photo-r3-c2.png";
import photoR3C3 from "../assets/gallery/photo-r3-c3.png";
import photoR4C2 from "../assets/gallery/photo-r4-c2.png";
import photoR4C3 from "../assets/gallery/photo-r4-c3.png";

/* Desktop mosaic: 4 columns x 5 rows, read left-to-right/top-to-bottom.
   CSS grid auto-placement fills each row in source order, so the
   col-span-2 "text" tile and the blank filler tile just need to sit in
   the right spot in this list - no explicit col/row coordinates needed. */
const DESKTOP_GRID = [
  { kind: "photo", src: photoR0C0 },
  { kind: "photo", src: photoR0C1 },
  { kind: "photo", src: photoR0C2 },
  { kind: "heart" },
  { kind: "photo", src: photoR1C0 },
  { kind: "photo", src: photoR1C1 },
  { kind: "photo", src: photoR1C2 },
  { kind: "photo", src: photoR1C3 },
  { kind: "photo", src: photoR2C0 },
  { kind: "photo", src: photoR2C1 },
  { kind: "photo", src: photoR2C2 },
  { kind: "photo", src: photoR2C3 },
  { kind: "empty" },
  { kind: "photo", src: photoR3C1 },
  { kind: "photo", src: photoR3C2 },
  { kind: "photo", src: photoR3C3 },
  { kind: "text" },
  { kind: "photo", src: photoR4C2 },
  { kind: "photo", src: photoR4C3 },
];

/* Mobile mosaic: 2 columns x 7 rows, plain sequential flow. */
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

function GridCell({ cell }) {
  if (cell.kind === "empty") {
    return <div className="aspect-square" aria-hidden="true" />;
  }

  if (cell.kind === "heart") {
    return (
      <div className="flex aspect-square items-center justify-center">
        <img src={heartIcon} alt="" className="h-[70px] w-auto lg:h-[135px]" />
      </div>
    );
  }

  if (cell.kind === "text") {
    return (
      <div className="col-span-1 flex flex-col justify-center lg:col-span-2">
        <p className="font-script text-[37.8px] leading-[0.82] text-cocoa lg:text-[86.8px]">
          Lil
        </p>
        <div className="relative w-fit">
          <img
            src={memoriesBlob}
            alt=""
            className="pointer-events-none absolute -right-[14px] top-1/2 h-[64px] w-auto -translate-y-1/2 rotate-[-90deg] lg:-right-[36px] lg:h-[216px]"
          />
          <p className="relative font-script text-[37.8px] leading-[0.82] text-cocoa lg:text-[86.8px]">
            Memories
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-square overflow-hidden">
      <img src={cell.src} alt="" className="h-full w-full" />
    </div>
  );
}

export default function Gallery() {
  return (
    <main className="w-full bg-cream">
      <PageHero title="Gallery" />

      {/* A Peek Inside Lil' Loaves */}
      <section className="relative w-full overflow-hidden bg-cream">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-[40px] px-[16px] py-[60px] lg:h-[409px] lg:justify-center lg:gap-[64px] lg:px-[72px] lg:py-0">
          <div className="flex flex-col gap-[15px] text-cocoa lg:gap-[24px]">
            <h2 className="font-ligema text-[18.5px] uppercase leading-[1] lg:text-[30.4px]">
              A Peek Inside Lil&apos; Loaves
            </h2>
            <p className="font-parkinsans text-[15px] text-justify lg:w-[1126px] lg:text-[24px]">
              From hand-shaped loaves fresh out of the oven to sweet treats
              made with care, here&apos;s a glimpse of the moments, flavors,
              and craftsmanship that make Lil&apos; Loaves feel like home.
            </p>
          </div>

          <div className="flex items-center gap-[6px] rounded-full bg-taupe px-[30px] py-[10px] lg:gap-[10px] lg:px-[48px] lg:py-[16px]">
            <img src={iconCamera} alt="" className="size-[18px] lg:size-[24px]" />
            <span className="whitespace-nowrap font-parkinsans text-[16px] text-white">
              Submit your Pictures Here
            </span>
          </div>
        </div>

        <img
          src={dotsBg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[-32px] h-[75px] w-full lg:bottom-[-58px] lg:h-[115px]"
        />
      </section>

      {/* Photo mosaic + Lil' Memories */}
      <section className="w-full bg-cream pb-[60px] pt-[56px] lg:pb-[130px] lg:pt-[186px]">
        <div className="mx-auto w-full max-w-[1440px] px-[16px] lg:px-[181px]">
          <div className="grid grid-cols-2 gap-[16px] lg:hidden">
            {MOBILE_GRID.map((cell, i) => (
              <GridCell key={i} cell={cell} />
            ))}
          </div>

          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-[40px]">
            {DESKTOP_GRID.map((cell, i) => (
              <GridCell key={i} cell={cell} />
            ))}
          </div>
        </div>
      </section>

      {/* Hear it from our customers */}
      <section className="w-full bg-cream px-[16px] py-[60px] lg:px-0 lg:py-[79px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[40px] lg:flex-row lg:items-center lg:justify-center lg:gap-[38px]">
          {/* Text column */}
          <div className="relative flex flex-col gap-[25px] lg:w-[602px] lg:shrink-0">
            <img
              src={iconQuote}
              alt=""
              aria-hidden="true"
              className="absolute -left-[6px] -top-[36px] hidden h-[61px] w-[61px] lg:-left-[26px] lg:top-[59px] lg:block"
            />

            <div className="flex flex-col gap-[20px] lg:gap-[34px]">
              <h2 className="font-ligema text-[15.2px] uppercase leading-[1] text-cocoa lg:text-[22.8px]">
                Hear it from our customers
              </h2>
              <div className="font-dm text-[16px] text-justify text-[#2e2017]">
                <p>
                  I ordered the sourdough after seeing it online, and it
                  completely exceeded my expectations. The crust had the
                  perfect crunch, while the inside was incredibly soft and
                  flavorful. You can tell every loaf is made with patience
                  and genuine care. It&apos;s rare to find bread that tastes
                  this fresh and homemade, and it reminded me of the kind my
                  grandmother used to bake. Lil&apos; Loaves has quickly
                  become our new weekend tradition.
                </p>
                <p className="mt-[20px]">-Emily R.</p>
              </div>
            </div>

            <img
              src={paginationDots}
              alt=""
              aria-hidden="true"
              className="h-[10px] w-[82px] self-center lg:self-end"
            />
          </div>

          {/* Image column - lg width includes the washi tape's left overhang,
              so the photo itself (below) sits flush against the right side,
              matching how the design groups the photo + tape together. */}
          <div className="lg:w-[572px] lg:shrink-0">
            <div className="relative lg:ml-auto lg:w-[526px]">
              <img
                src={testimonialPhotoMobile}
                alt="Freshly baked sourdough loaf being sliced on a plaid cloth"
                className="h-[300px] w-full rounded-[8px] object-cover lg:hidden"
              />
              <img
                src={testimonialPhoto}
                alt="Freshly baked sourdough loaf being sliced on a plaid cloth"
                className="hidden h-[403px] w-full rounded-[8px] object-cover lg:block"
              />

              <img
                src={tapeIcon}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[22px] -left-[18px] h-[120px] w-[38px] rotate-[128deg] scale-y-[-1] lg:-bottom-[12px] lg:left-[39px] lg:h-[164px] lg:w-[49px]"
              />

              <div className="absolute -right-[10px] -top-[18px] h-[100px] w-[136px] lg:-right-[73px] lg:-top-[62px] lg:h-[136px] lg:w-[183px]">
                <img
                  src={ribbonIcon}
                  alt=""
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-[136px] w-[100px] -translate-x-1/2 -translate-y-1/2 rotate-[106deg] lg:h-[183px] lg:w-[136px]"
                />
                <div className="absolute inset-0 flex rotate-[16deg] flex-col items-center justify-center leading-[1.05]">
                  <span className="font-ligema text-[7.1px] uppercase text-white lg:text-[18.6px]">
                    Good Food
                  </span>
                  <span className="font-ligema text-[7.1px] uppercase text-[#c75e02] lg:text-[18.6px]">
                    &amp;
                  </span>
                  <span className="font-ligema text-[7.1px] uppercase text-white lg:text-[18.6px]">
                    Good Mood
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
