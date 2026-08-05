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
import photoCorgis from "../assets/home/photo-corgis.png";
import stickerSmiley from "../assets/home/sticker-smiley.svg";
import ribbonTape from "../assets/home/ribbon-tape.svg";
import cardScallop from "../assets/home/card-scallop.svg";
import blobSpecials from "../assets/home/blob-specials.svg";
import priceTab from "../assets/home/price-tab.svg";
import specialDanish from "../assets/home/special-danish.png";
import specialCroissants from "../assets/home/special-croissants.png";
import specialBagels from "../assets/home/special-bagels.png";
import specialDonuts from "../assets/home/special-donuts.png";
import iconQuotes from "../assets/home/icon-quotes.svg";
import photoTestimonial from "../assets/home/photo-testimonial.png";
import iconCross from "../assets/home/icon-cross.svg";
import iconPlus from "../assets/home/icon-plus.svg";

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

/* Same repeating-column technique as Navbar/PageHero STRIPES, tuned to the
   hero's faint clay-tinted bands (110px period mobile-adapted / 220px desktop). */
const HERO_STRIPES =
  "bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_80px,rgba(204,138,122,0.07)_80px,rgba(204,138,122,0.07)_160px)] lg:bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_110px,rgba(204,138,122,0.07)_110px,rgba(204,138,122,0.07)_220px)]";

/* Gingham-style plaid wash + checkerboard border used behind the Seasonal
   Specials cards in the Figma file (dozens of individual rectangles there) -
   reproduced here as a CSS pattern rather than hand-authoring an SVG. */
const PLAID_BG = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(240,220,215,0.5) 0px, rgba(240,220,215,0.5) 35px, transparent 35px, transparent 88px), repeating-linear-gradient(0deg, rgba(240,220,215,0.5) 0px, rgba(240,220,215,0.5) 35px, transparent 35px, transparent 88px)",
};

const CHECKERBOARD_BG = {
  backgroundImage:
    "repeating-conic-gradient(#f0dcd7 0% 25%, transparent 0% 50%)",
  backgroundSize: "20px 20px",
};

function FaqRow({ item, isOpen, onToggle }) {
  return (
    <div className="w-full border-b border-clay">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-[8px] py-[17px] text-left lg:gap-[12px] lg:py-[24px]"
      >
        <div className="flex flex-1 flex-col gap-[8px] lg:gap-[12px]">
          <p className="capitalize font-dm text-[17px] tracking-[-0.17px] text-cocoa lg:text-[20px] lg:tracking-[-0.2px]">
            {item.q}
          </p>
          {isOpen && item.a && (
            <p className="font-dm text-[14px] text-cocoa lg:text-[16px]">
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
      {/* HERO */}
      <section className={`relative w-full overflow-hidden bg-rose ${HERO_STRIPES}`}>
        <div className="relative mx-auto w-full max-w-[1440px]">
          {/* decorative flowers */}
          <div className="lg:hidden">
            {HERO_FLOWERS_MOBILE.map((f, i) => (
              <img
                key={i}
                src={f.img}
                alt=""
                className="absolute h-[72px] w-[79px]"
                style={{ left: f.left, top: f.top }}
              />
            ))}
          </div>
          <div className="hidden lg:block">
            {HERO_FLOWERS_DESKTOP.map((f, i) => (
              <img
                key={i}
                src={f.img}
                alt=""
                className="absolute h-[72px] w-[79px]"
                style={{ left: f.left, top: f.top }}
              />
            ))}
          </div>

          <div className="relative flex flex-col items-center gap-[27px] px-[16px] pb-[100px] pt-[60px] lg:gap-[41px] lg:pb-[135px] lg:pt-[80px]">
            <img
              src={logoPink}
              alt="Lil' Loaves"
              className="size-[73px] lg:size-[112px]"
            />
            <div className="flex flex-col items-center gap-[48px] lg:gap-[74px]">
              <div className="flex flex-col items-center gap-[25px] lg:gap-[38px]">
                <p className="font-parkinsans text-[16px] text-cocoa lg:text-[24px]">
                  Welcome to Lil&rsquo; Loaves!
                </p>
                <div className="flex flex-col items-center gap-[14px] lg:gap-[22px]">
                  <div className="flex items-center gap-[9px] lg:gap-[13px]">
                    <p className="font-script text-[73.5px] leading-none text-cocoa lg:text-[112.7px]">
                      hand
                    </p>
                    <img
                      src={heart}
                      alt=""
                      className="h-[29px] w-[35px] lg:h-[45px] lg:w-[53px]"
                    />
                    <p className="font-ligema text-[38.9px] leading-none text-cocoa lg:text-[59.8px]">
                      SHAPED
                    </p>
                  </div>
                  <p className="[-webkit-text-stroke:1.3px_#57423d] [-webkit-text-fill-color:transparent] font-ligema text-[51.3px] leading-none text-transparent lg:text-[78.8px] lg:[-webkit-text-stroke:2px_#57423d]">
                    LOAVES
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[28px] py-[9px] font-parkinsans text-[13px] text-white lg:px-[43px] lg:py-[14px] lg:text-[16px]"
              >
                Explore Our Menu
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* decorative scalloped bread divider between hero and info bar */}
      <img src={dividerMobile} alt="" className="w-full lg:hidden" />
      <img src={dividerDesktop} alt="" className="hidden w-full lg:block" />

      {/* INFO BAR */}
      <section className="w-full bg-cream px-[16px] py-[40px] lg:py-[10px]">
        <div className="mx-auto flex w-full max-w-[1024px] flex-col items-start gap-[20px] lg:items-center lg:gap-[38px]">
          <div className="flex flex-col items-start gap-[16px] lg:flex-row lg:items-center lg:gap-[83px]">
            {INFO_BAR.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-[8px] lg:gap-[21px]">
                <img src={icon} alt="" className="size-[21px] lg:size-[35px]" />
                <p className="whitespace-nowrap font-dm text-[16px] text-cocoa lg:text-[20px]">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <p className="font-parkinsans text-[16px] text-cocoa lg:text-center lg:text-[20px]">
            From naturally fermented sourdough to freshly baked cookies and
            seasonal treats, everything we make is handcrafted in small
            batches and made to be shared.
          </p>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="w-full bg-[#f7ebca] px-[16px] py-[60px]">
        <div className="mx-auto flex w-full max-w-[1024px] flex-col items-center gap-[46px] lg:gap-[90px]">
          <div className="flex flex-col items-center gap-[39px] lg:gap-[64px]">
            <div className="flex flex-col items-center gap-[10px] text-center text-cocoa">
              <p className="font-ligema text-[18.5px] lg:text-[22.8px]">
                <span className="font-script">Our</span> PRODUCTS
              </p>
              <p className="font-parkinsans text-[15px] lg:text-[20px]">
                We serve 4 delecteble items on our menu. All items are
                freshly baked straight to our bakery.
              </p>
            </div>
            <button
              type="button"
              className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[30px] py-[6px] font-parkinsans text-[12px] text-white lg:px-[48px] lg:py-[10px] lg:text-[16px]"
            >
              View Specials
            </button>
          </div>

          <div className="grid w-full grid-cols-2 gap-x-[16px] gap-y-[25px] lg:flex lg:w-auto lg:gap-x-[13px] lg:gap-y-0">
            {PRODUCTS.map(({ name, img }) => (
              <div key={name} className="flex flex-col items-center gap-[14px] lg:w-[259px] lg:gap-[20px]">
                <img
                  src={img}
                  alt={name}
                  className="h-[282px] w-full object-cover lg:h-[412px] lg:w-[259px]"
                />
                <p className="font-ligema text-[12.8px] uppercase text-cocoa lg:text-[19px]">
                  {name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO ARE WE */}
      <section className="w-full bg-cream px-[16px] py-[60px] lg:py-[100px]">
        <div className="mx-auto flex w-full max-w-[1188px] flex-col items-center gap-[52px] lg:flex-row lg:items-center lg:justify-center lg:gap-[82px]">
          <div className="flex w-full flex-col gap-[29px] text-cocoa lg:w-[691px] lg:shrink-0">
            <p className="font-ligema text-[19px] uppercase lg:text-[22.8px]">
              who are we
            </p>
            <div className="flex flex-col gap-[16px] text-justify font-parkinsans text-[16px] leading-relaxed">
              <p>
                Lil&rsquo; Loaves is inspired by our two corgis, Doc and
                Chief (the &ldquo;loaves&rdquo; behind the business) a
                compliment that always came during those happy pauses on our
                walks, whenever people stopped to admire their unmistakable
                shape.
              </p>
              <p>
                Unfortunately, we lost Doc in early 2026, and soon after, we
                lost our Dad as well the man who supported us in everything
                we did. Their passing is now our tribute our efforts to
                build something meaningful from losing something meaningful.
              </p>
              <p>
                Through the moments of saying &ldquo;goodbye&rdquo;,
                we&rsquo;ve learned a lot. We learned to slow down and find
                peace in the simple rhythms, like baking. We were reminded
                to embrace our family and to lean on each other more often.
                Most of all, we learned that real healing happens when you
                are supported by friends, family, and community.
              </p>
            </div>
          </div>

          <div className="relative w-full max-w-[352px] shrink-0 lg:w-[415px] lg:max-w-none">
            <img
              src={photoCorgis}
              alt="Our two corgis, Doc and Chief"
              className="aspect-[352/388] w-full rounded-[14px] object-cover lg:aspect-[415/459] lg:rounded-[13px]"
            />
            <img
              src={stickerSmiley}
              alt=""
              className="absolute -left-[6px] -top-[24px] h-[85px] w-[74px] lg:left-[35px] lg:-top-[41px] lg:h-[97px] lg:w-[85px]"
            />
            <img
              src={ribbonTape}
              alt=""
              className="absolute -bottom-[24px] -right-[16px] h-[65px] w-[19px] rotate-[45deg] lg:-bottom-[10px] lg:-right-[24px] lg:h-[80px] lg:w-[24px]"
            />
          </div>
        </div>
      </section>

      {/* SEASONAL SPECIALS */}
      <section className="relative w-full overflow-hidden bg-cream px-[16px] py-[60px] lg:py-[75px]">
        <div className="pointer-events-none absolute inset-0" style={PLAID_BG} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[20px]" style={CHECKERBOARD_BG} />

        <div className="relative mx-auto flex w-full max-w-[1024px] flex-col items-center gap-[47px] lg:gap-[80px]">
          <div className="flex flex-col items-center gap-[33px] lg:gap-[56px]">
            <div className="relative inline-flex items-center justify-center">
              <img
                src={blobSpecials}
                alt=""
                className="absolute left-[100px] h-[97px] w-[61px] -rotate-90 lg:left-[148px] lg:h-[125px] lg:w-[79px]"
              />
              <p className="relative font-ligema text-[18.1px] text-cocoa lg:text-[22.8px]">
                SEASONAL <span className="font-script">Specials</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-[12px] gap-y-[12px] lg:flex lg:gap-x-[17px]">
              {SPECIALS.map(({ name, price, img }) => (
                <div
                  key={name}
                  className="relative h-[258px] w-[179px] lg:h-[372px] lg:w-[259px]"
                >
                  <img
                    src={cardScallop}
                    alt=""
                    className="absolute inset-0 h-full w-full -scale-y-100"
                  />
                  <img
                    src={img}
                    alt={name}
                    className="absolute left-[6px] top-[6px] h-[197px] w-[167px] rounded-[4px] object-cover lg:left-[8px] lg:top-[8px] lg:h-[284px] lg:w-[240px] lg:rounded-[6px]"
                  />
                  <div className="absolute left-1/2 top-[230px] flex h-[25px] w-[99px] -translate-x-1/2 items-center justify-center lg:top-[331px] lg:h-[36px] lg:w-[142px]">
                    <img src={priceTab} alt="" className="absolute inset-0 h-full w-full" />
                    <p className="relative pt-[2px] font-parkinsans text-[14px] font-medium text-cocoa lg:text-[20px]">
                      {price}
                    </p>
                  </div>
                  <p className="absolute top-[208px] left-1/2 -translate-x-1/2 whitespace-nowrap font-parkinsans text-[12px] text-cocoa lg:top-[299px] lg:text-[17px]">
                    {name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[28px] py-[6px] font-parkinsans text-[12px] text-white lg:px-[48px] lg:py-[10px] lg:text-[16px]"
          >
            View Specials
          </button>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="relative w-full bg-cream px-[16px] py-[60px] lg:py-[100px]">
        <div className="mx-auto flex w-full max-w-[1201px] flex-col gap-[25px] lg:flex-row lg:items-center lg:justify-center lg:gap-[82px]">
          <div className="relative flex flex-col gap-[25px] lg:w-[602px] lg:shrink-0 lg:gap-[67px]">
            <img
              src={iconQuotes}
              alt=""
              className="hidden h-[61px] w-[61px] lg:absolute lg:-left-[24px] lg:top-[63px] lg:block"
            />
            <div className="flex flex-col gap-[21px] text-cocoa lg:gap-[34px]">
              <p className="font-ligema text-[19px] uppercase lg:text-[22.8px]">
                Hear it from our customers
              </p>
              <p className="text-justify font-dm text-[16px] leading-relaxed text-[#2e2017]">
                I ordered the sourdough after seeing it online, and it
                completely exceeded my expectations. The crust had the
                perfect crunch, while the inside was incredibly soft and
                flavorful. You can tell every loaf is made with patience and
                genuine care. It&rsquo;s rare to find bread that tastes this
                fresh and homemade, and it reminded me of the kind my
                grandmother used to bake. Lil&rsquo; Loaves has quickly
                become our new weekend tradition.
                <br />
                <br />
                -Emily R.
              </p>
            </div>
            <div className="hidden items-center gap-[8px] lg:flex">
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
              className="aspect-[370/425] w-full rounded-[8px] object-cover lg:aspect-[517/363] lg:rounded-[14px]"
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
      <section className="w-full bg-[#f7f5f1] px-[16px] py-[60px] lg:px-[70px] lg:py-[80px]">
        <div className="mx-auto flex w-full max-w-[1302px] flex-col items-start gap-[22px] lg:gap-[31px]">
          <p className="font-parkinsans text-[19px] text-cocoa lg:text-[28px]">
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
