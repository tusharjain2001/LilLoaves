import { useState } from "react";
import logoPink from "../assets/home/logo-pink.svg";
import heart from "../assets/home/heart.svg";
import flowerA from "../assets/home/flower-hero-a.svg";
import flowerB from "../assets/home/flower-hero-b.svg";
import dividerDesktop from "../assets/home/divider-scallop.svg";
import dividerMobile from "../assets/home/divider-scallop-mobile.svg";
import iconHotspring from "../assets/home/icon-hotspring.svg";
import iconChefhat from "../assets/home/icon-chefhat.svg";
import productBreads from "../assets/home/product-breads.png";
import productCookies from "../assets/home/product-cookies.png";
import productMuffins from "../assets/home/product-muffins.png";
import productCrackers from "../assets/home/product-crackers.png";
import photoCorgis from "../assets/home/photo-corgis.jpg";
import stickerSmiley from "../assets/home/sticker-smiley.svg";
import ribbonTape from "../assets/home/ribbon-tape.svg";
import cardScallop from "../assets/home/card-scallop.svg";
import blobSpecials from "../assets/home/blob-specials.svg";
import priceTab from "../assets/home/price-tab.svg";
import specialDanish from "../assets/home/special-danish.jpg";
import specialCroissants from "../assets/home/special-croissants.jpg";
import specialBagels from "../assets/home/special-bagels.jpg";
import specialDonuts from "../assets/home/special-donuts.jpg";
import iconQuotes from "../assets/home/icon-quotes.svg";
import photoTestimonial from "../assets/home/photo-testimonial.jpg";
import iconCross from "../assets/home/icon-cross.svg";
import iconPlus from "../assets/home/icon-plus.svg";

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

const SPECIALS = [
  { name: "Danish Pastries", price: "$23", img: specialDanish },
  { name: "Croissants", price: "$23", img: specialCroissants },
  { name: "Bagels", price: "$23", img: specialBagels },
  { name: "Donuts", price: "$23", img: specialDonuts },
];

const TESTIMONIAL_DOTS = [0, 1, 2, 3, 4];

const FAQS = [
  {
    q: "Do you bake everything fresh?",
    a: "Yes! Every loaf and baked good is handcrafted in small batches using quality ingredients and traditional baking methods.",
  },
  { q: "Do you offer seasonal specials?" },
  { q: "How do I place an order?" },
  { q: "Can I customize my Lunch Box Special?" },
  { q: "Do you use preservatives?" },
  { q: "How can I stay updated on new products?" },
];

/* Hero bands: 110.08px of #cc8a7a every 220.15px starting at x=4. Figma stacks a
   0.6-alpha paint inside a 0.07-opacity group, so the band lands at 0.042. */
const HERO_STRIPES = {
  backgroundImage:
    "repeating-linear-gradient(90deg, transparent 0 4px, rgba(204,138,122,0.042) 4px 114.08px, transparent 114.08px 220.154px)",
  backgroundPosition: `${CANVAS_ORIGIN} 0`,
};

/* Gingham behind Seasonal Specials: 35px bands on an 88px pitch, horizontals from
   y=0 and verticals from x=42, in #e5c5bc at 0.07. Figma stacks two copies of the
   group, but the upper copy opens with its own opaque #fbfbf8 backing rectangle,
   which hides the lower copy entirely - so only one set of bands is ever visible.
   Two CSS layers at 0.07 then give the same 0.135 at the crossings. */
const GINGHAM_BG = {
  backgroundImage: [
    "repeating-linear-gradient(180deg, rgba(229,197,188,0.07) 0 35px, transparent 35px 88px)",
    "repeating-linear-gradient(90deg, transparent 0 42px, rgba(229,197,188,0.07) 42px 77px, transparent 77px 88px)",
  ].join(","),
  backgroundPosition: `${CANVAS_ORIGIN} 0`,
};

/* 30px checkerboard, two rows tall, sitting on the section's bottom edge. Figma
   fills x=30,90,... on the upper row and x=0,60,... on the lower one, which is
   the opposite phase to what the conic gradient starts on - hence the extra 30px
   of x offset from the canvas origin. */
const CHECKERBOARD_BG = {
  backgroundImage:
    "repeating-conic-gradient(#e5c5bc 0% 25%, transparent 0% 50%)",
  backgroundSize: "60px 60px",
  backgroundPosition: "calc(50% - 690px) 0",
};

/* Two things keep a collapsed row at Figma's 71px: the vertical padding lives on
   the text column rather than the row (otherwise it stacks with the 71px toggle
   icon and every row grows to 119px), and the rule is painted on the bottom edge
   instead of being a border, since Figma's stroke sits inside the frame. */
function FaqRow({ item, isOpen, onToggle }) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-clay" />
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-[8px] text-left lg:gap-[12px]"
      >
        <div className="flex flex-1 flex-col gap-[8px] py-[17px] lg:gap-[12px] lg:py-[24px]">
          <p className="font-dm text-[17px] capitalize tracking-[-0.17px] text-cocoa lg:text-[20px] lg:leading-[23px] lg:tracking-[-0.2px]">
            {item.q}
          </p>
          {isOpen && item.a && (
            /* Figma sets this in a 892px box where Neulis Sans runs to two
               lines; DM Sans is narrower, so the box is tightened to keep the
               same two-line break (and the row's 125px height). */
            <p className="font-dm text-[14px] capitalize text-cocoa lg:w-[800px] lg:text-[16px] lg:leading-[21px]">
              {item.a}
            </p>
          )}
        </div>
        <img
          src={isOpen ? iconCross : iconPlus}
          alt=""
          className="size-[49px] shrink-0 lg:size-[71px]"
        />
      </button>
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="w-full overflow-x-hidden bg-cream">
      {/* HERO - 878px tall, navbar floats over it */}
      <section className="relative w-full overflow-hidden bg-rose">
        <div className="pointer-events-none absolute inset-0" style={HERO_STRIPES} />

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

        <div className="relative mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[27px] px-[16px] pb-[100px] pt-[60px] lg:h-[878px] lg:gap-[41px] lg:px-0 lg:pb-0 lg:pt-[200px]">
          <img
            src={logoPink}
            alt="Lil' Loaves"
            className="size-[73px] lg:size-[112px]"
          />
          <div className="flex flex-col items-center gap-[48px] lg:gap-[73.81px]">
            <div className="flex flex-col items-center gap-[25px] lg:gap-[38.24px]">
              <p className="font-parkinsans text-[16px] text-cocoa lg:text-[24px] lg:leading-[34px]">
                Welcome to Lil&rsquo; Loaves!
              </p>
              <div className="flex flex-col items-center gap-[14px] lg:gap-[22.23px]">
                {/* Fixed-height row: the display type overflows it top and
                    bottom exactly as the Figma auto-layout does. */}
                <div className="flex items-center gap-[9px] lg:h-[65.8px] lg:gap-[13.34px]">
                  <p className="font-display text-[73.5px] leading-none text-cocoa lg:text-[161.03px] lg:leading-[177px]">
                    hand
                  </p>
                  <img
                    src={heart}
                    alt=""
                    className="h-[29px] w-[35px] shrink-0 lg:h-[45.35px] lg:w-[53.35px]"
                  />
                  <p className="font-display text-[38.9px] leading-none text-cocoa lg:text-[126.11px] lg:leading-[139px]">
                    SHAPED
                  </p>
                </div>
                <p className="font-display text-[51.3px] leading-none text-transparent [-webkit-text-fill-color:transparent] [-webkit-text-stroke:1.3px_#57423d] lg:text-[166.04px] lg:leading-[105.37px] lg:[-webkit-text-stroke:2.67px_#57423d]">
                  LOAVES
                </p>
              </div>
            </div>
            <button
              type="button"
              className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[28px] py-[9px] font-parkinsans text-[13px] text-white lg:rounded-[88.92px] lg:px-[42.68px] lg:py-[14.23px] lg:text-[16px] lg:leading-[22px]"
            >
              Explore Our Menu
            </button>
          </div>
        </div>
      </section>

      {/* decorative scalloped bread divider between hero and info bar */}
      <img src={dividerMobile} alt="" className="w-full lg:hidden" />

      {/* INFO BAR - on desktop the scalloped bread edge bites 20px up into the hero */}
      <section className="relative w-full bg-cream px-[16px] py-[40px] lg:h-[363px] lg:py-0 lg:pt-[150.5px]">
        <img
          src={dividerDesktop}
          alt=""
          className="pointer-events-none absolute left-1/2 hidden h-[116px] w-[1501px] max-w-none -translate-x-1/2 lg:block"
          style={{ top: -20 }}
        />

        <div className="relative mx-auto flex w-full max-w-[1024px] flex-col items-start gap-[20px] lg:items-center lg:gap-[38px]">
          <div className="flex flex-col items-start gap-[16px] lg:h-[35px] lg:flex-row lg:items-center lg:gap-[83px]">
            {INFO_BAR.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-[8px] lg:gap-[21px]">
                <img
                  src={icon}
                  alt=""
                  className="size-[21px] shrink-0 lg:size-[35px]"
                />
                <p className="whitespace-nowrap font-dm text-[16px] text-cocoa lg:text-[20px] lg:leading-[26px]">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <p className="font-parkinsans text-[16px] text-cocoa lg:w-[1024px] lg:text-center lg:text-[20px] lg:leading-[28px]">
            From naturally fermented sourdough to freshly baked cookies and
            seasonal treats, everything we make is handcrafted in small batches
            and made to be shared.
          </p>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="w-full bg-honey px-[16px] py-[60px]">
        <div className="mx-auto flex w-full max-w-[1073.99px] flex-col items-center gap-[46px] lg:gap-[90px]">
          <div className="flex flex-col items-center gap-[39px] lg:w-[654px] lg:gap-[64px]">
            <div className="flex flex-col items-center text-center text-cocoa">
              <p className="font-display text-[18.5px] lg:text-[48px] lg:leading-[53px]">
                Our PRODUCTS
              </p>
              <p className="font-parkinsans text-[15px] lg:text-[20px] lg:leading-[28px]">
                We serve 4 delecteble items on our menu. All items are freshly
                baked straight to our bakery.
              </p>
            </div>
            <button
              type="button"
              className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[30px] py-[6px] font-parkinsans text-[12px] text-white lg:px-[48px] lg:py-[10px] lg:text-[16px] lg:leading-[22px]"
            >
              View Specials
            </button>
          </div>

          <div className="grid w-full grid-cols-2 gap-x-[16px] gap-y-[25px] lg:flex lg:w-auto lg:gap-x-[13.25px] lg:gap-y-0">
            {PRODUCTS.map(({ name, img }) => (
              <div
                key={name}
                className="flex flex-col items-center gap-[14px] lg:w-[258.56px] lg:gap-[19.89px]"
              >
                <img
                  src={img}
                  alt={name}
                  className="h-[282px] w-full object-cover lg:h-[411.87px] lg:w-[258.56px]"
                />
                <p className="font-display text-[12.8px] uppercase text-cocoa lg:text-[39.78px] lg:leading-[44px]">
                  {name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO ARE WE */}
      <section className="w-full bg-cream px-[16px] py-[60px] lg:h-[682px] lg:py-0">
        <div className="mx-auto flex h-full w-full max-w-[1188px] flex-col items-center gap-[52px] lg:flex-row lg:justify-center lg:gap-[82px]">
          <div className="flex w-full flex-col gap-[29px] text-cocoa lg:h-[346px] lg:w-[691px] lg:shrink-0">
            <p className="font-display text-[19px] uppercase lg:text-[48px] lg:leading-[53px]">
              who are we
            </p>
            <div className="flex flex-col gap-[16px] text-justify font-parkinsans text-[16px] leading-relaxed lg:gap-[14px] lg:leading-[22px]">
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

          <div className="relative w-full max-w-[352px] shrink-0 lg:w-[415px] lg:max-w-none">
            <img
              src={photoCorgis}
              alt="Our two corgis, Doc and Chief"
              className="aspect-[352/388] w-full rounded-[14px] object-cover lg:h-[458.6px] lg:w-[415px] lg:rounded-[13.4px]"
            />
            <img
              src={stickerSmiley}
              alt=""
              className="absolute -left-[6px] -top-[24px] h-[85px] w-[74px] lg:left-[35px] lg:-top-[40.7px] lg:h-[97.22px] lg:w-[84.68px]"
            />
            {/* Tape is a page-level vector in Figma sitting across the photo's
                bottom-right corner; its 132.75deg rotation is baked into the
                exported path, so it is placed by its rendered bounds. */}
            <img
              src={ribbonTape}
              alt=""
              className="absolute -bottom-[30px] -right-[12px] h-[71px] w-[100px] lg:bottom-auto lg:left-[298.46px] lg:right-auto lg:top-[432.97px] lg:h-[107.33px] lg:w-[151.43px]"
            />
          </div>
        </div>
      </section>

      {/* SEASONAL SPECIALS */}
      <section className="relative w-full overflow-hidden bg-cream px-[16px] py-[60px] lg:h-[841px] lg:py-0 lg:pt-[75px]">
        <div className="pointer-events-none absolute inset-0" style={GINGHAM_BG} />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[30px] lg:bottom-[1px] lg:h-[60px]"
          style={CHECKERBOARD_BG}
        />

        <div className="relative mx-auto flex w-full max-w-[1082px] flex-col items-center gap-[47px] lg:gap-[80px]">
          <div className="flex flex-col items-center gap-[33px] lg:gap-[56px]">
            {/* Title lockup: Figma centres the text+blob pair, not the text. */}
            {/* Blob is painted first so the wordmark sits on top of it. */}
            <div className="relative lg:h-[79px] lg:w-[272.96px]">
              <img
                src={blobSpecials}
                alt=""
                className="absolute left-[100px] top-0 h-[97px] w-[61px] -rotate-90 lg:left-[147.96px] lg:h-[79px] lg:w-[125px] lg:rotate-0"
              />
              <p className="relative font-display text-[18.1px] text-cocoa lg:absolute lg:left-0 lg:top-[18.18px] lg:w-[250px] lg:text-[48px] lg:leading-[53px]">
                SEASONAL Specials
              </p>
            </div>

            <div className="grid grid-cols-2 gap-[12px] lg:flex lg:gap-[16.92px]">
              {SPECIALS.map(({ name, price, img }) => (
                <div
                  key={name}
                  className="relative h-[258px] w-[179px] lg:h-[371.95px] lg:w-[257.81px]"
                >
                  <img
                    src={cardScallop}
                    alt=""
                    className="absolute inset-0 h-full w-full -scale-y-100"
                  />
                  <img
                    src={img}
                    alt={name}
                    className="absolute left-[6px] top-[6px] h-[197px] w-[167px] rounded-[4px] object-cover lg:left-[8.46px] lg:top-[8.46px] lg:h-[284.15px] lg:w-[240.18px] lg:rounded-[5.5px]"
                  />
                  <p className="absolute left-1/2 top-[208px] -translate-x-1/2 whitespace-nowrap font-parkinsans text-[12px] text-cocoa lg:top-[299.38px] lg:text-[16.91px] lg:leading-[24px]">
                    {name}
                  </p>
                  <div className="absolute left-1/2 top-[230px] flex h-[25px] w-[99px] -translate-x-1/2 items-center justify-center lg:top-[330.67px] lg:h-[36.37px] lg:w-[142.48px]">
                    <img
                      src={priceTab}
                      alt=""
                      className="absolute inset-0 h-full w-full"
                    />
                    <p className="relative pt-[2px] font-parkinsans text-[14px] font-medium text-cocoa lg:pt-[4px] lg:text-[20.3px] lg:leading-[28px]">
                      {price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[28px] py-[6px] font-parkinsans text-[12px] text-white lg:px-[48px] lg:py-[10px] lg:text-[16px] lg:leading-[22px]"
          >
            View Specials
          </button>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="relative w-full bg-cream px-[16px] py-[60px] lg:h-[562px] lg:py-0">
        <div className="mx-auto flex h-full w-full max-w-[1201px] flex-col gap-[25px] lg:flex-row lg:items-center lg:justify-center lg:gap-[82px]">
          <div className="relative flex flex-col gap-[25px] lg:h-[332px] lg:w-[602px] lg:shrink-0 lg:gap-[67px]">
            <img
              src={iconQuotes}
              alt=""
              className="hidden h-[61px] w-[61px] opacity-[0.33] lg:absolute lg:-left-[23.5px] lg:top-[63px] lg:block"
            />
            <div className="flex flex-col gap-[21px] text-cocoa lg:gap-[34px]">
              <p className="font-display text-[19px] uppercase lg:text-[48px] lg:leading-[53px]">
                Hear it from our customers
              </p>
              <p className="text-justify font-dm text-[16px] leading-relaxed text-bark lg:leading-[24px]">
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
            <div className="flex items-center gap-[5px] lg:hidden">
              {TESTIMONIAL_DOTS.map((i) => (
                <span
                  key={i}
                  className={`size-[6px] rounded-full ${
                    i === 0 ? "bg-cocoa" : "bg-petal"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full bg-linen px-[16px] py-[60px] lg:h-[798px] lg:px-[70px] lg:py-0 lg:pt-[84px]">
        <div className="mx-auto flex w-full max-w-[1302px] flex-col items-start gap-[22px] lg:gap-[31px]">
          <p className="font-parkinsans text-[19px] text-cocoa lg:text-[28px] lg:leading-[39px]">
            Frequently asked questions
          </p>
          <div className="flex w-full flex-col gap-[16px]">
            {FAQS.map((item, i) => (
              <FaqRow
                key={item.q}
                item={item}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq((cur) => (cur === i ? null : i))}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
