import { useEffect, useState } from "react";
import SeasonalSpecials from "../components/SeasonalSpecials.jsx";
import FaqSection from "../components/FaqSection.jsx";
import { fetchFeatured } from "../lib/woo.js";
import PLACEHOLDER_PRODUCT_IMAGE from "../lib/placeholderImage.js";
import logoPink from "../assets/home/logo-pink.svg";
import heart from "../assets/home/heart.svg";
import flowerA from "../assets/home/flower-hero-a.svg";
import flowerB from "../assets/home/flower-hero-b.svg";
import dividerDesktop from "../assets/home/divider-scallop.svg";
import dividerMobile from "../assets/home/divider-scallop-mobile.svg";
import dividerDotsMobile from "../assets/home/divider-dots-mobile.svg";
import iconHotspring from "../assets/home/icon-hotspring.svg";
import iconChefhat from "../assets/home/icon-chefhat.svg";
import productBreads from "../assets/home/product-breads.png";
import productCookies from "../assets/home/product-cookies.png";
import productMuffins from "../assets/home/product-muffins.png";
import productCrackers from "../assets/home/product-crackers.png";
import whoAreWe from "../assets/home/whoarewe.png";
import iconQuotes from "../assets/home/icon-quotes.svg";
import photoTestimonial from "../assets/home/photo-testimonial.jpg";

/* Desktop geometry below is taken verbatim from the Figma home page (node
   247:9590, a 1440-wide canvas). Full-bleed background patterns are phase-locked
   to that canvas with CANVAS_ORIGIN so they line up at 1440 and keep tiling
   seamlessly on wider screens. */
const CANVAS_ORIGIN = "calc(50% - 720px)";

const HERO_FLOWERS_DESKTOP = [
  { left: 111, top: 203, img: flowerA },
  { left: 1141, top: 203, img: flowerA },
  { left: 295, top: 459, img: flowerA },
  { left: 1389, top: 339, img: flowerA },
  { left: -26, top: 519, img: flowerA },
  { left: 1101, top: 609, img: flowerB },
  { left: 239, top: 800, img: flowerA },
  { left: 1340, top: 764, img: flowerA },
];

const HERO_FLOWERS_MOBILE = [
  { left: 327, top: 46, img: flowerA },
  { left: 0, top: 108, img: flowerA },
  { left: 261, top: 275, img: flowerB },
  { left: 34, top: 437, img: flowerA },
  { left: 354, top: 504, img: flowerA },
];

const INFO_BAR = [
  { icon: iconHotspring, label: "100% Freshly Baked" },
  { icon: iconChefhat, label: "Homegrown Brand" },
];

const PRODUCTS = [
  { name: "Breads", img: productBreads },
  { name: "Cookies", img: productCookies },
  { name: "Muffins", img: productMuffins },
  { name: "Crackers", img: productCrackers },
];

/* Specials come from whichever products the bakery stars as Featured in
   WooCommerce. No prices are passed - the home page's cards drop the price tab
   (the Menu page's copy of the same section keeps it). */

const TESTIMONIAL_DOTS = [0, 1, 2, 3, 4];

/* Hero bands: 110.08px of #cc8a7a every 220.15px starting at x=4. Figma stacks a
   0.6-alpha paint inside a 0.07-opacity group, so the band lands at 0.042. */
const HERO_STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(90deg, transparent 0 4px, rgba(204,138,122,0.042) 4px 114.08px, transparent 114.08px 220.154px)",
  backgroundPosition: `${CANVAS_ORIGIN} 0`,
};

/* The 402 mobile canvas redraws the same bands wider and sparser: 80.32px every
   160.65px from x=0. Phase-locked to 402 the way the desktop set is to 1440. */
const MOBILE_CANVAS_ORIGIN = "calc(50% - 201px)";

const HERO_STRIPES_MOBILE = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(204,138,122,0.042) 0 80.323px, transparent 80.323px 160.646px)",
  backgroundPosition: `${MOBILE_CANVAS_ORIGIN} 0`,
};

export default function Home() {
  const [specials, setSpecials] = useState([]);

  useEffect(() => {
    let active = true;
    fetchFeatured().then((products) => {
      if (!active) return;
      setSpecials(
        products.slice(0, 4).map((p) => ({
          name: p.name,
          price: p.priceFormatted,
          img: p.images[0]?.src ?? PLACEHOLDER_PRODUCT_IMAGE,
        })),
      );
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="w-full overflow-x-hidden bg-cream">
      {/* HERO - 878px tall, navbar floats over it */}
      <section className="relative w-full overflow-hidden bg-rose">
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={HERO_STRIPES_MOBILE}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={HERO_STRIPES}
        />

        {/* decorative flowers, pinned to the 1440 canvas */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          {HERO_FLOWERS_MOBILE.map((f, i) => (
            <img
              key={i}
              src={f.img}
              alt=""
              className="absolute h-[71.88px] w-[79.41px]"
              style={{ left: f.left, top: f.top }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-[1440px] -translate-x-1/2 lg:block">
          {HERO_FLOWERS_DESKTOP.map((f, i) => (
            <img
              key={i}
              src={f.img}
              alt=""
              className="absolute h-[71.88px] w-[79.41px]"
              style={{ left: f.left, top: f.top }}
            />
          ))}
        </div>

        <div className="relative mx-auto flex h-[640px] w-full max-w-[1440px] flex-col items-center gap-[26.61px] px-[16px] pt-[135px] lg:h-[878px] lg:gap-[41px] lg:px-0 lg:pt-[190px]">
          <img
            src={logoPink}
            alt="Lil' Loaves"
            className="size-[72.7px] lg:size-[112px]"
          />
          <div className="flex flex-col items-center gap-[47.91px] lg:gap-[63.86px]">
            <div className="flex flex-col items-center gap-[24.82px] lg:gap-[34px]">
              <p className="font-parkinsans text-[15.58px] leading-[22px] text-cocoa lg:text-[24px] lg:leading-[34px]">
                Welcome to Lil&rsquo; Loaves!
              </p>
              {/* Figma's "Group 208": a 612x221.14 box whose four pieces are
                  placed by their own coordinates rather than by an auto-layout,
                  because the row and LOAVES deliberately overlap - "hand" runs
                  to y=121 while LOAVES starts at y=108. The whole lockup is
                  scaled down as one unit on mobile. Figma's 402 frame is that
                  same group at exactly 0.6046 - every size in it (105.28 ->
                  63.649, 76 -> 45.948, 86.932 -> 52.557) and the box itself
                  (612x221.14 -> 370x133.70) carry that one factor. */}
              <div className="h-[133.7px] w-[370px] lg:h-[221.14px] lg:w-[612px]">
                <div className="relative h-[221.14px] w-[612px] origin-top-left scale-[0.6046] lg:scale-100">
                  {/* Figma weights "hand" up with a 2px outward stroke in the
                      text colour rather than a bolder cut - the face has only a
                      Regular. -webkit-text-stroke is centred, so 4px gives the
                      same 2px of outward growth, and matching fill and stroke
                      colours make the inward half invisible. */}
                  <p className="absolute left-[3.58px] top-0 h-[121px] font-fallin text-[105.28px] leading-[121px] text-cocoa [-webkit-text-stroke:4px_#57423d]">
                    hand
                  </p>
                  <img
                    src={heart}
                    alt=""
                    className="absolute left-[266.05px] top-[27px] h-[56.01px] w-[65.9px]"
                  />
                  <p className="absolute left-[348.42px] top-[8px] font-mailray text-[76px] leading-[91px] tracking-[2.28px] text-cocoa">
                    SHAPED
                  </p>
                  <p className="absolute left-0 top-[108px] w-[612px] text-center font-mailray text-[86.93px] leading-[114.4px] tracking-[6.09px] text-transparent [-webkit-text-fill-color:transparent] [-webkit-text-stroke:2.67px_#57423d]">
                    LOAVES
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[27.71px] py-[9.24px] font-parkinsans text-[12.98px] text-white lg:rounded-[88.92px] lg:px-[42.68px] lg:py-[14.23px] lg:text-[16px] lg:leading-[22px]"
            >
              Explore Our Menu
            </button>
          </div>
        </div>
      </section>

      {/* INFO BAR - the scalloped bread edge bites up into the hero: 20px on
          desktop, 52px on mobile (Figma puts it at y=588 of a 640px hero). */}
      <section className="relative w-full bg-cream px-[16px] pb-[60px] pt-[68px] lg:h-[363px] lg:py-0 lg:pt-[150.5px]">
        <img
          src={dividerMobile}
          alt=""
          className="pointer-events-none absolute left-1/2 h-[82px] w-[402px] max-w-none -translate-x-1/2 lg:hidden"
          style={{ top: -52 }}
        />
        <img
          src={dividerDesktop}
          alt=""
          className="pointer-events-none absolute left-1/2 hidden h-[116px] w-[1501px] max-w-none -translate-x-1/2 lg:block"
          style={{ top: -20 }}
        />

        <div className="relative mx-auto flex w-full max-w-[1024px] flex-col items-center gap-[20px] lg:gap-[38px]">
          <div className="flex flex-col items-start gap-[12px] lg:h-[35px] lg:flex-row lg:items-center lg:gap-[83px]">
            {INFO_BAR.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-[7.85px] lg:gap-[21px]">
                <img
                  src={icon}
                  alt=""
                  className="size-[21.2px] shrink-0 lg:size-[35px]"
                />
                <p className="whitespace-nowrap font-dm text-[16px] text-cocoa lg:text-[20px] lg:leading-[26px]">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center font-parkinsans text-[16px] leading-[22px] text-cocoa lg:w-[1024px] lg:text-[20px] lg:leading-[28px]">
            From naturally fermented sourdough to freshly baked cookies and
            seasonal treats, everything we make is handcrafted in small batches
            and made to be shared.
          </p>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="relative w-full bg-honey px-[16px] py-[60px]">
        {/* Mobile scallops the honey section's bottom edge with a row of cream
            circles; the next section paints over their lower half. */}
        <img
          src={dividerDotsMobile}
          alt=""
          className="pointer-events-none absolute bottom-[-30.92px] left-1/2 h-[90.92px] w-[1182px] max-w-none -translate-x-1/2 lg:hidden"
        />
        <div className="relative mx-auto flex w-full max-w-[1073.99px] flex-col items-center gap-[46px] lg:gap-[90px]">
          <div className="flex w-full flex-col items-center gap-[39.34px] lg:w-[654px] lg:gap-[64px]">
            <div className="flex flex-col items-center gap-[8px] text-center text-cocoa">
              {/* Title lockup: Figma sets the script word in Rochester and the
                  uppercase word in Parkinsans, bottom-aligned to a shared edge. */}
              {/* 23.32px, not a space: Figma's "Our" sits in a 90px box whose
                  glyphs stop at 66.68, and a Rochester space is only 11px. */}
              <p className="flex items-end justify-center gap-[14.27px] whitespace-nowrap lg:gap-[23.32px]">
                <span className="font-rochester text-[29.37px] leading-[38px] lg:text-[48px] lg:leading-[62px]">
                  Our
                </span>
                <span className="font-parkinsans text-[22.03px] leading-[31px] tracking-[-1.1px] lg:text-[36px] lg:leading-[50px] lg:tracking-[-1.8px]">
                  PRODUCTS
                </span>
              </p>
              <p className="font-parkinsans text-[14.75px] leading-[21px] lg:text-[20px] lg:leading-[28px]">
                We serve 4 delecteble items on our menu. All items are freshly
                baked straight to our bakery.
              </p>
            </div>
            <button
              type="button"
              className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[29.51px] py-[6.15px] font-parkinsans text-[12.29px] text-white lg:px-[48px] lg:py-[10px] lg:text-[16px] lg:leading-[22px]"
            >
              View All Products
            </button>
          </div>

          <div className="grid w-full grid-cols-2 gap-x-[16px] gap-y-[25px] lg:flex lg:w-auto lg:gap-x-[13.25px] lg:gap-y-0">
            {PRODUCTS.map(({ name, img }) => (
              <div
                key={name}
                className="flex flex-col items-center gap-[13.62px] lg:w-[258.56px] lg:gap-[19.89px]"
              >
                <img
                  src={img}
                  alt={name}
                  className="h-[282.1px] w-full object-cover lg:h-[411.87px] lg:w-[258.56px]"
                />
                <p className="font-parkinsans text-[16.4px] font-medium uppercase leading-[30px] text-cocoa lg:text-[24px] lg:leading-[34px]">
                  {name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO ARE WE */}
      <section className="relative w-full bg-cream px-[16px] py-[60px] lg:h-[682px] lg:py-0">
        <div className="mx-auto flex h-full w-full max-w-[1188px] flex-col items-center gap-[52px] lg:flex-row lg:justify-center lg:gap-[82px]">
          <div className="flex w-full flex-col gap-[29px] text-cocoa lg:h-[338px] lg:w-[691px] lg:shrink-0">
            <p className="font-parkinsans text-[20px] font-medium uppercase leading-[28px] tracking-[-1px] lg:text-[32px] lg:leading-[45px] lg:tracking-[-1.6px]">
              who are we
            </p>
            {/* Figma separates the paragraphs with an empty line, so the gap is
                one line box (16px Parkinsans at leading-normal = 22.4px). */}
            <div className="flex flex-col gap-[22px] text-justify font-parkinsans text-[16px] leading-[22px]">
              <p>
                Lil&rsquo; Loaves is inspired by our two corgis, Doc and Chief
                (the &ldquo;loaves&rdquo; behind the business) a compliment that
                always came during those happy pauses on our walks, whenever
                people stopped to admire their unmistakable shape.
              </p>
              <p>
                Unfortunately, we lost Doc in early 2026, and soon after, we
                lost our Dad as well the man who supported us in everything we
                did. Their passing is now our tribute our efforts to build
                something meaningful from losing something meaningful.
              </p>
              <p>
                Through the moments of saying &ldquo;goodbye&rdquo;,
                we&rsquo;ve learned a lot. We learned to slow down and find
                peace in the simple rhythms, like baking. We were reminded to
                embrace our family and to lean on each other more often. Most
                of all, we learned that real healing happens when you are
                supported by friends, family, and community.
              </p>
            </div>
          </div>

          {/* Photo, smiley sticker and corner tape come in as one 458x540 export
              rather than three layers. Inside it the photo sits at (0, 50) at
              415x458 - exactly the box this column used to occupy - so the div
              keeps that box and the image is hung off it: 458/415 = 110.36% wide,
              pulled up 50/458.6 = 10.9% of the box's height. Both ratios are
              unitless, so the mobile 352.46x388.41 box scales the whole group. */}
          <div className="relative aspect-[352.46/388.41] w-full max-w-[352.46px] shrink-0 lg:aspect-auto lg:h-[458.6px] lg:w-[415px] lg:max-w-none">
            <img
              src={whoAreWe}
              alt="Our two corgis, Doc and Chief"
              className="absolute left-0 top-[-10.9%] w-[110.36%] max-w-none"
            />
          </div>
        </div>
      </section>

      <SeasonalSpecials
        specials={specials}
        withPriceTab={false}
        ctaLabel="View Specials in Menu"
      />

      {/* TESTIMONIAL */}
      <section className="relative w-full bg-cream px-[16px] py-[60px] lg:h-[562px] lg:py-0">
        <div className="mx-auto flex h-full w-full max-w-[1201px] flex-col gap-[25px] lg:flex-row lg:items-center lg:justify-center lg:gap-[82px]">
          <div className="relative flex flex-col gap-[25px] lg:h-[332px] lg:w-[602px] lg:shrink-0 lg:gap-[67px]">
            <img
              src={iconQuotes}
              alt=""
              className="hidden h-[61px] w-[61px] opacity-[0.33] lg:absolute lg:-left-[23.5px] lg:top-[63px] lg:block"
            />
            <div className="flex flex-col gap-[20.67px] text-cocoa lg:gap-[34px]">
              <p className="font-parkinsans text-[20px] font-medium uppercase leading-[28px] tracking-[-1px] lg:text-[32px] lg:leading-[45px] lg:tracking-[-1.6px]">
                Hear it from our customers
              </p>
              <p className="text-justify font-parkinsans text-[16px] leading-[22px] text-bark">
                I ordered the sourdough after seeing it online, and it
                completely exceeded my expectations. The crust had the perfect
                crunch, while the inside was incredibly soft and flavorful. You
                can tell every loaf is made with patience and genuine care.
                It&rsquo;s rare to find bread that tastes this fresh and
                homemade, and it reminded me of the kind my grandmother used to
                bake. Lil&rsquo; Loaves has quickly become our new weekend
                tradition.
                <br />
                <br />
                -Emily R.
              </p>
            </div>
            <div className="hidden items-center gap-[8px] lg:flex lg:self-end">
              {TESTIMONIAL_DOTS.map((i) => (
                <span
                  key={i}
                  className={`size-[10px] rounded-full ${
                    i === 0 ? "bg-cocoa" : "bg-petal"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-[25px] lg:w-[517px] lg:shrink-0">
            <img
              src={photoTestimonial}
              alt="Slicing a freshly baked loaf of sourdough"
              className="aspect-[370/425] w-full rounded-[8px] object-cover lg:h-[362.58px] lg:w-[517px] lg:rounded-[13.7px]"
            />
            <div className="flex items-center gap-[4.86px] lg:hidden">
              {TESTIMONIAL_DOTS.map((i) => (
                <span
                  key={i}
                  className={`size-[6.08px] rounded-full ${
                    i === 0 ? "bg-cocoa" : "bg-petal"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <FaqSection />
    </main>
  );
}
