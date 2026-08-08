import { Fragment, useEffect, useState } from "react";
import CategoryStrip from "../components/CategoryStrip.jsx";
import SeasonalSpecials from "../components/SeasonalSpecials.jsx";
import FaqSection from "../components/FaqSection.jsx";
import { fetchCategories, fetchProducts, fetchFeatured } from "../lib/woo.js";
import flowerYellow from "../assets/shared/flower-yellow.svg";
import blobButton from "../assets/menu/blob-button.svg";
import blobSpecials from "../assets/menu/blob-specials.svg";
import lunchboxIconsSprite from "../assets/menu/lunchbox-icons-sprite.png";
import lunchboxSourdough from "../assets/menu/lunchbox-sourdough.jpg";
import lunchboxJapaneseMilk from "../assets/menu/lunchbox-japanese-milk.jpg";
import lunchboxChiefsCrackers from "../assets/menu/lunchbox-chiefs-crackers.jpg";
import lunchboxDocsCrackers from "../assets/menu/lunchbox-docs-crackers.jpg";
import lunchboxCookies from "../assets/menu/lunchbox-cookies.jpg";
import lunchboxMuffins from "../assets/menu/lunchbox-muffins.jpg";
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

/* Scalloped seam under the Lunch Box section: 17 circles of r=57.73 spaced 86.6
   apart, filled with the section's own #f4e7e3 so the pink edge reads as bumps.
   They overlap, so they are split across two gradient layers that each tile at
   double the pitch. */
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

/* Crop windows into the shared lunchbox-icons-sprite.png - each "what's
   inside" icon zooms into a different region of one collage photo, exactly
   as exported from Figma. */
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

/* nameW is Figma's own text-box width for each label, which is what makes all
   but "Soudough" break over two lines. */
const BREAD_OPTIONS = [
  { name: "Soudough", img: lunchboxSourdough, nameW: 169.56 },
  { name: "Japanese Milk Bread", img: lunchboxJapaneseMilk, nameW: 140 },
];

const CRACKER_OPTIONS = [
  { name: "Chief’s Crackers (5oz)", img: lunchboxChiefsCrackers, nameW: 160 },
  { name: "Doc’s Crackers (5oz)", img: lunchboxDocsCrackers, nameW: 147 },
];

const DESSERT_OPTIONS = [
  { name: "Cookies (Pack of 6)", img: lunchboxCookies, nameW: 109 },
  { name: "Muffins (Pack of 4)", img: lunchboxMuffins, nameW: 108 },
];

function BreadCard({ item, qty, onAdd, onInc, onDec }) {
  return (
    <div className="w-full max-w-[370px] rounded-[13px] border-[0.8px] border-shell p-[6px] pb-[13px] lg:w-[348px] lg:rounded-[13.22px] lg:p-[6.37px] lg:pb-[12.74px]">
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
          <div className="flex items-center gap-[16px] lg:gap-[28.66px]">
            <p className="font-parkinsans text-[19px] text-cocoa lg:w-[140.52px] lg:text-[22.29px] lg:leading-[31px]">
              {item.price}
            </p>
            {!item.inStock ? (
              <span className="font-parkinsans text-[13px] font-semibold text-taupe">
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

function LunchboxGroup({ step, title, options, selected, onSelect }) {
  return (
    <div className="box-border w-full rounded-[16px] border border-shell bg-cream p-[16px] lg:h-[344.88px] lg:w-[393.65px] lg:rounded-[15.87px] lg:border-[0.99px] lg:p-[15.87px]">
      <div className="flex flex-col items-center gap-[16px] lg:gap-[23.8px]">
        <div className="flex items-center justify-center gap-[12px] lg:h-[39px] lg:gap-[9.92px]">
          <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-cocoa font-parkinsans text-[13px] text-white lg:size-[29.75px] lg:text-[19.83px] lg:leading-[19.83px]">
            {step}
          </span>
          <p className="whitespace-nowrap font-display text-[8.5px] uppercase text-cocoa lg:text-[35.7px] lg:leading-[39px]">
            {title}
          </p>
        </div>
        <div className="flex w-full items-start justify-center gap-[12px] lg:gap-[23.8px]">
          {options.map((opt) => {
            const isSelected = selected === opt.name;
            return (
              <button
                key={opt.name}
                type="button"
                onClick={() => onSelect(opt.name)}
                className="flex flex-1 cursor-pointer flex-col items-center gap-[12px] lg:gap-[23.8px]"
              >
                <div className="flex w-full flex-col items-center gap-[8px] lg:gap-[14px]">
                  <img
                    src={opt.img}
                    alt={opt.name}
                    className="h-[100px] w-full rounded-[10px] object-cover lg:h-[134px] lg:rounded-[15.87px]"
                  />
                  <p
                    style={{ "--name-w": `${opt.nameW}px` }}
                    className="text-center font-parkinsans text-[13px] text-cocoa lg:w-[var(--name-w)] lg:text-[19.83px] lg:leading-[28px]"
                  >
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
    </div>
  );
}

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [selectedBread, setSelectedBread] = useState("Soudough");
  const [selectedCracker, setSelectedCracker] = useState(
    "Chief’s Crackers (5oz)",
  );
  const [selectedDessert, setSelectedDessert] = useState("Muffins (Pack of 4)");
  const [lunchboxQty, setLunchboxQty] = useState(1);

  const setQty = (name, next) =>
    setQuantities((prev) => ({ ...prev, [name]: Math.max(0, next) }));

  useEffect(() => {
    let active = true;
    Promise.all([fetchCategories(), fetchProducts(), fetchFeatured()]).then(
      ([cats, prods, feat]) => {
        if (!active) return;
        setCategories(cats);
        setProducts(prods);
        setActiveCategory((current) => current ?? cats[0]?.slug ?? null);
        setSpecials(
          feat.slice(0, 4).map((p) => ({
            name: p.name,
            price: p.priceFormatted,
            img: p.images[0]?.src ?? "",
          })),
        );
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const activeItems = products.filter((p) =>
    p.categories.some((c) => c.slug === activeCategory),
  );

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
      <SeasonalSpecials items={specials} className="lg:-mt-[7px]" />

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
            {activeItems.length === 0 ? (
              <p className="py-[40px] text-center font-parkinsans text-[16px] text-clay">
                More treats coming soon!
              </p>
            ) : (
              activeItems.map((p) => {
                const item = {
                  name: p.name,
                  desc: p.summary,
                  price: p.priceFormatted,
                  img: p.images[0]?.src,
                  inStock: p.inStock,
                };
                return (
                  <BreadCard
                    key={p.id}
                    item={item}
                    qty={quantities[item.name] ?? 0}
                    onAdd={() => setQty(item.name, 1)}
                    onInc={() => setQty(item.name, (quantities[item.name] ?? 0) + 1)}
                    onDec={() => setQty(item.name, (quantities[item.name] ?? 0) - 1)}
                  />
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* checkerboard band bridging Our Menu and the Lunch Box section */}
      <div
        className="h-[20px] w-full lg:-mt-[3px] lg:h-[60px]"
        style={CHECKERBOARD_BG}
      />

      {/* LUNCH BOX SPECIALS */}
      <section className="relative w-full bg-[#f4e7e3] px-[16px] py-[60px] lg:h-[1636.66px] lg:px-0 lg:py-0 lg:pt-[136px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[48px] lg:gap-[127px]">
          <div className="flex w-full items-center justify-center gap-[16px] lg:h-[157px] lg:gap-[64px]">
            <button type="button" aria-label="Previous lunch box" className="shrink-0 cursor-pointer">
              <img
                src={lunchboxArrowLeft}
                alt=""
                className="h-[14px] w-[12px] rotate-180 lg:h-[23.85px] lg:w-[20.36px] lg:rotate-0"
              />
            </button>
            <div className="flex flex-col items-center gap-[12px] lg:w-[890px] lg:gap-[19px]">
              <div className="relative inline-flex items-center justify-center">
                <img
                  src={blobSpecials}
                  alt=""
                  className="absolute right-[-6px] h-[61px] w-[91px] lg:right-[-10px] lg:h-[104px] lg:w-[165px]"
                />
                <p className="relative text-center font-display text-[15.2px] text-cocoa lg:text-[64px] lg:leading-[70px]">
                  LUNCH BOX Specials
                </p>
              </div>
              <p className="max-w-[828px] text-center font-parkinsans text-[15px] text-cocoa lg:w-[828px] lg:text-[20px] lg:leading-[34px]">
                A thoughtfully curated meal featuring fresh bread, handcrafted
                crackers, and a sweet treat; perfect for lunch, gifting, or
                sharing.
              </p>
            </div>
            <button type="button" aria-label="Next lunch box" className="shrink-0 cursor-pointer">
              <img
                src={lunchboxArrowRight}
                alt=""
                className="h-[14px] w-[12px] lg:h-[23.85px] lg:w-[20.36px]"
              />
            </button>
          </div>

          <div className="flex w-full flex-col items-center gap-[48px] lg:w-[1294px] lg:gap-[92.22px]">
            {/* What's inside */}
            <div className="flex w-full flex-col items-center gap-[16px] lg:gap-[15.87px]">
              <p className="font-display text-[11.4px] uppercase text-cocoa lg:text-[39.66px] lg:leading-[44px]">
                WHAT&rsquo;S INSIDE
              </p>
              <div className="flex w-full flex-col gap-[20px] rounded-[16px] bg-[rgba(251,251,248,0.57)] p-[16px] lg:flex-row lg:items-center lg:justify-center lg:gap-[20.82px] lg:rounded-[15.87px] lg:p-[15.87px]">
                {LUNCHBOX_INSIDE.map((item, i) => (
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
                        <p className="font-display text-[10.4px] uppercase lg:text-[39.66px] lg:leading-[38.67px]">
                          {item.label}
                        </p>
                        <p className="font-parkinsans text-[13px] lg:text-[19.83px] lg:leading-[28px]">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    {i < LUNCHBOX_INSIDE.length - 1 && (
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

            {/* Build your lunch box */}
            <div className="flex w-full flex-col items-center gap-[24px] lg:gap-[34.7px]">
              <div className="flex flex-col items-center text-center text-cocoa">
                <p className="font-display text-[10.4px] uppercase lg:text-[39.66px] lg:leading-[43.63px]">
                  BUILD YOUR LUNCH BOX
                </p>
                <p className="font-parkinsans text-[14px] lg:text-[20px] lg:leading-[28px]">
                  Select one option from each category
                </p>
              </div>
              <div className="flex w-full flex-col items-center gap-[24px] lg:flex-row lg:items-center lg:justify-center lg:gap-[47.6px]">
                <LunchboxGroup
                  step={1}
                  title="CHoose your Bread"
                  options={BREAD_OPTIONS}
                  selected={selectedBread}
                  onSelect={setSelectedBread}
                />
                <LunchboxGroup
                  step={2}
                  title="CHoose your Crackers"
                  options={CRACKER_OPTIONS}
                  selected={selectedCracker}
                  onSelect={setSelectedCracker}
                />
                <LunchboxGroup
                  step={3}
                  title="CHoose your Dessert"
                  options={DESSERT_OPTIONS}
                  selected={selectedDessert}
                  onSelect={setSelectedDessert}
                />
              </div>
            </div>
          </div>

          {/* Price / cart bar */}
          <div className="flex w-full flex-col items-start gap-[16px] lg:h-[56px] lg:w-[1286px] lg:flex-row lg:items-center lg:gap-[33px]">
            <div className="grid place-items-center rounded-[16px] bg-[#cc8a7a] px-[16px] py-[8px] lg:h-[55px] lg:w-[123px] lg:px-0 lg:py-0">
              <p className="font-parkinsans text-[22px] text-white lg:text-[28px] lg:leading-[39px]">
                $33.50
              </p>
            </div>
            <p className="font-parkinsans text-[16px] text-cocoa lg:w-[723.47px] lg:text-[20px] lg:leading-[28px]">
              One complete lunch box
              <br />
              with your selections
            </p>
            <div className="flex items-center gap-[16px] lg:gap-[33px]">
              <div className="flex items-center gap-[24px] rounded-full border-2 border-taupe px-[15px] py-[8px] font-parkinsans text-[16px] font-semibold text-taupe lg:h-[56px] lg:w-[170px] lg:justify-between lg:rounded-[96.34px] lg:px-[15.41px] lg:py-0">
                <button
                  type="button"
                  onClick={() => setLunchboxQty((q) => Math.max(1, q - 1))}
                  className="cursor-pointer"
                >
                  -
                </button>
                <span>{lunchboxQty}</span>
                <button
                  type="button"
                  onClick={() => setLunchboxQty((q) => q + 1)}
                  className="cursor-pointer"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[24px] py-[16px] font-parkinsans text-[16px] text-white lg:grid lg:h-[54px] lg:w-[170.53px] lg:place-items-center lg:rounded-[96.35px] lg:px-0 lg:py-0"
              >
                Add to Cart
              </button>
            </div>
          </div>
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
