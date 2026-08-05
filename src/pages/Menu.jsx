import { Fragment, useState } from "react";
import CategoryStrip from "../components/CategoryStrip.jsx";
import flowerYellow from "../assets/shared/flower-yellow.svg";
import blobButton from "../assets/menu/blob-button.svg";
import blobSpecials from "../assets/menu/blob-specials.svg";
import cardScallop from "../assets/menu/card-scallop.svg";
import priceTab from "../assets/menu/price-tab.svg";
import specialDanish from "../assets/menu/special-danish.png";
import specialCroissants from "../assets/menu/special-croissants.png";
import specialBagels from "../assets/menu/special-bagels.png";
import specialDonuts from "../assets/menu/special-donuts.png";
import breadSourdough from "../assets/menu/bread-sourdough.jpg";
import breadJapaneseMilk from "../assets/menu/bread-japanese-milk.jpg";
import breadDinnerRolls from "../assets/menu/bread-dinner-rolls.jpg";
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
import iconCross from "../assets/menu/icon-cross.svg";
import iconPlus from "../assets/menu/icon-plus.svg";

/* Same seamless stripe pattern as Navbar/PageHero - the hero stacks flush
   under the navbar. */
const HERO_STRIPES =
  "bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_80px,#faf3e0_80px,#faf3e0_160px)] lg:bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_111px,#faf3e0_111px,#faf3e0_222px)]";

const HERO_FLOWERS_MOBILE = [
  { left: -17, top: 82 },
  { left: 346, top: 271 },
];

const HERO_FLOWERS_DESKTOP = [
  { left: 110, top: 171 },
  { left: 1348.41, top: 171 },
  { left: 321, top: 275 },
  { left: 1119.41, top: 275 },
];

const SPECIALS = [
  { name: "Danish Pastries", price: "$23", img: specialDanish },
  { name: "Croissants", price: "$23", img: specialCroissants },
  { name: "Bagels", price: "$23", img: specialBagels },
  { name: "Donuts", price: "$23", img: specialDonuts },
];

const CATEGORIES = ["Breads", "Muffins", "Cookies", "Crackers"];

const BREADS_ITEMS = [
  {
    name: "Sour Dough",
    desc: "Slow-fermented and hand-shaped for a crisp crust, airy crumb, and rich, tangy flavor.",
    price: "$21.13",
    img: breadSourdough,
    initialQty: 1,
  },
  {
    name: "Japanese Milk Bread",
    desc: "Soft, fluffy, and delicately sweet—perfect for sandwiches, toast, or enjoying on its own.",
    price: "$21.13",
    img: breadJapaneseMilk,
    initialQty: 0,
  },
  {
    name: "Dinner Rolls",
    desc: "Pillowy, buttery rolls baked fresh to bring warmth to every meal and gathering.",
    price: "$21.13",
    img: breadDinnerRolls,
    initialQty: 0,
  },
];

/* Figma only mocks item art/copy for the "Breads" tab; the other 3 tabs are
   real, clickable filters but have no source content yet. */
const MENU_ITEMS = {
  Breads: BREADS_ITEMS,
  Muffins: [],
  Cookies: [],
  Crackers: [],
};

/* Crop windows into the shared lunchbox-icons-sprite.png - each "what's
   inside" icon zooms into a different region of one collage photo, exactly
   as exported from Figma. */
const LUNCHBOX_INSIDE = [
  {
    label: "Bread",
    desc: "Choice of Sourdough or Japanese Bread",
    crop: { height: "238.96%", width: "265.38%", left: "0%", top: "-61.04%" },
  },
  {
    label: "CRAckers",
    desc: "Choice of 5oz bag of Chief’s or Doc’s crackers",
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
    crop: {
      height: "238.96%",
      width: "324.71%",
      left: "-224.71%",
      top: "-66.23%",
    },
  },
];

const BREAD_OPTIONS = [
  { name: "Soudough", img: lunchboxSourdough },
  { name: "Japanese Milk Bread", img: lunchboxJapaneseMilk },
];

const CRACKER_OPTIONS = [
  { name: "Chief’s Crackers (5oz)", img: lunchboxChiefsCrackers },
  { name: "Doc’s Crackers (5oz)", img: lunchboxDocsCrackers },
];

const DESSERT_OPTIONS = [
  { name: "Cookies (Pack of 6)", img: lunchboxCookies },
  { name: "Muffins (Pack of 4)", img: lunchboxMuffins },
];

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

/* Bakery checkerboard divider strip, same CSS-pattern technique used on the
   Home page (Group105/Group164 in Figma - dozens of individual rectangles
   there, reproduced as one repeating background here). */
const CHECKERBOARD_BG = {
  backgroundImage:
    "repeating-conic-gradient(#f0dcd7 0% 25%, transparent 0% 50%)",
  backgroundSize: "20px 20px",
};

/* Scalloped seam between the Lunch Box (rose) section and the FAQ (cream)
   section - Figma draws this as ~17 overlapping circles (Group153); a
   repeating radial-gradient reproduces the same silhouette. */
const SCALLOP_MOBILE = {
  backgroundImage:
    "radial-gradient(circle at 50% 0%, #f4e7e3 37.6px, transparent 37.7px)",
  backgroundSize: "56.23px 38px",
  backgroundRepeat: "repeat-x",
};

const SCALLOP_DESKTOP = {
  backgroundImage:
    "radial-gradient(circle at 50% 0%, #f4e7e3 57.7px, transparent 57.8px)",
  backgroundSize: "86.6px 58px",
  backgroundRepeat: "repeat-x",
};

function CheckerDivider() {
  return <div className="h-[20px] w-full" style={CHECKERBOARD_BG} />;
}

function SpecialCard({ name, price, img }) {
  return (
    <div className="relative h-[258px] w-[179px] lg:h-[372px] lg:w-[259px]">
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
      <p className="absolute left-1/2 top-[208px] -translate-x-1/2 whitespace-nowrap font-parkinsans text-[12px] text-cocoa lg:top-[299px] lg:text-[17px]">
        {name}
      </p>
    </div>
  );
}

function BreadCard({ item, qty, onAdd, onInc, onDec }) {
  return (
    <div className="w-full max-w-[370px] rounded-[13px] border-[0.8px] border-[#d8cbbe] p-[6px] pb-[13px] lg:w-[348px]">
      <div className="relative h-[220px] w-full overflow-hidden rounded-[12px] lg:h-[274px]">
        <img
          src={item.img}
          alt={item.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-t from-[#57423d] to-transparent lg:h-[100px]" />
      </div>
      <div className="flex flex-col gap-[20px] px-[13px] pt-[13px] lg:gap-[29px]">
        <div className="flex flex-col gap-[3px]">
          <p className="font-parkinsans text-[18px] font-semibold text-cocoa lg:text-[20px]">
            {item.name}
          </p>
          <p className="font-parkinsans text-[14px] text-clay lg:text-[16px]">
            {item.desc}
          </p>
        </div>
        <div className="flex items-center justify-between gap-[16px]">
          <p className="font-parkinsans text-[19px] text-cocoa lg:text-[22px]">
            {item.price}
          </p>
          {qty > 0 ? (
            <div className="flex w-[141px] shrink-0 items-center justify-between rounded-full border-[1.65px] border-taupe px-[13px] py-[6px] font-parkinsans text-[13px] font-semibold text-taupe">
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
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[16px] py-[6px] font-parkinsans text-[15px] text-white lg:text-[16px]"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LunchboxGroup({ step, title, options, selected, onSelect }) {
  return (
    <div className="w-full rounded-[16px] border border-[#d8cbbe] bg-cream p-[16px] lg:w-[394px]">
      <div className="flex flex-col items-center gap-[16px] lg:gap-[24px]">
        <div className="flex items-center justify-center gap-[12px] lg:gap-[20px]">
          <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-cocoa font-parkinsans text-[13px] text-white lg:size-[30px] lg:text-[20px]">
            {step}
          </span>
          <p className="whitespace-nowrap font-ligema text-[8.5px] uppercase text-cocoa lg:text-[17.1px]">
            {title}
          </p>
        </div>
        <div className="flex w-full items-start justify-center gap-[12px] lg:gap-[23px]">
          {options.map((opt) => {
            const isSelected = selected === opt.name;
            return (
              <button
                key={opt.name}
                type="button"
                onClick={() => onSelect(opt.name)}
                className="flex flex-1 cursor-pointer flex-col items-center gap-[12px] lg:gap-[29px]"
              >
                <div className="flex w-full flex-col items-center gap-[8px] lg:gap-[14px]">
                  <img
                    src={opt.img}
                    alt={opt.name}
                    className="h-[100px] w-full rounded-[10px] object-cover lg:h-[134px] lg:rounded-[16px]"
                  />
                  <p className="text-center font-parkinsans text-[13px] text-cocoa lg:text-[20px]">
                    {opt.name}
                  </p>
                </div>
                <img
                  src={isSelected ? radioSelected : radioUnselected}
                  alt={isSelected ? "Selected" : "Not selected"}
                  className="size-[10px] lg:size-[18px]"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("Breads");
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(BREADS_ITEMS.map((i) => [i.name, i.initialQty])),
  );
  const [selectedBread, setSelectedBread] = useState("Soudough");
  const [selectedCracker, setSelectedCracker] = useState(
    "Chief’s Crackers (5oz)",
  );
  const [selectedDessert, setSelectedDessert] = useState(
    "Muffins (Pack of 4)",
  );
  const [lunchboxQty, setLunchboxQty] = useState(1);
  const [openFaq, setOpenFaq] = useState(0);

  const setQty = (name, next) =>
    setQuantities((prev) => ({ ...prev, [name]: Math.max(0, next) }));

  const activeItems = MENU_ITEMS[activeCategory];

  return (
    <main className="w-full overflow-x-hidden bg-cream">
      {/* HERO */}
      <section className={`relative w-full overflow-hidden ${HERO_STRIPES}`}>
        <div className="relative mx-auto h-[360px] w-full max-w-[1440px] lg:h-[405px]">
          <div className="lg:hidden">
            {HERO_FLOWERS_MOBILE.map((f, i) => (
              <img
                key={i}
                src={flowerYellow}
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
                src={flowerYellow}
                alt=""
                className="absolute h-[72px] w-[79px]"
                style={{ left: f.left, top: f.top }}
              />
            ))}
          </div>

          <div className="absolute left-1/2 top-[154px] h-[86px] w-[310px] -translate-x-1/2 lg:top-[211px] lg:h-[114px] lg:w-[410px]">
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-[310px] w-[86px] rotate-90 lg:h-[410px] lg:w-[114px]">
                <img src={blobButton} alt="" className="h-full w-full" />
              </div>
            </div>
            <p className="relative grid h-full place-items-center px-[16px] text-center font-ligema text-[15.2px] uppercase text-white lg:text-[22.8px]">
              VIEW OUR Products
            </p>
          </div>
        </div>
      </section>

      <CategoryStrip />

      {/* SEASONAL SPECIALS (identical to the Home-page section, own asset copies) */}
      <section className="relative w-full overflow-hidden bg-cream px-[16px] py-[60px] lg:py-[75px]">
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
              {SPECIALS.map((s) => (
                <SpecialCard key={s.name} {...s} />
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

      <CheckerDivider />

      {/* OUR MENU */}
      <section className="w-full bg-cream px-[16px] py-[60px] lg:py-[80px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[40px] lg:gap-[64px]">
          <div className="flex flex-col items-center gap-[12px] text-center text-cocoa lg:gap-[19px]">
            <p className="font-ligema text-[19px] lg:text-[22.8px]">
              <span className="font-script">Our</span> MENU
            </p>
            <p className="max-w-[758px] font-parkinsans text-[15px] lg:text-[20px]">
              We offer a variety of delicacies from 4 types of baked items,
              you can click on add to cart any time you desire to place an
              order offline or online.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-[500px] grid-cols-2 gap-x-[20px] gap-y-[16px] lg:flex lg:w-auto lg:max-w-none lg:gap-[38px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer whitespace-nowrap rounded-full bg-[#eaebe7] px-[20px] py-[8px] font-parkinsans text-[18px] text-cocoa lg:px-[32px] lg:text-[24px] ${
                  activeCategory === cat
                    ? "border-2 border-[#969985]"
                    : "border-2 border-transparent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col items-center gap-[20px] lg:flex-row lg:items-start lg:justify-center lg:gap-[16px]">
            {activeItems.length === 0 ? (
              <p className="py-[40px] text-center font-parkinsans text-[16px] text-clay">
                More treats coming soon!
              </p>
            ) : (
              activeItems.map((item) => (
                <BreadCard
                  key={item.name}
                  item={item}
                  qty={quantities[item.name] ?? 0}
                  onAdd={() => setQty(item.name, 1)}
                  onInc={() => setQty(item.name, (quantities[item.name] ?? 0) + 1)}
                  onDec={() => setQty(item.name, (quantities[item.name] ?? 0) - 1)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <CheckerDivider />

      {/* LUNCH BOX SPECIALS */}
      <section className="relative w-full bg-[#f4e7e3] px-[16px] py-[60px] lg:py-[136px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[48px] lg:gap-[127px]">
          <div className="flex w-full items-center justify-center gap-[16px] lg:gap-[64px]">
            <button type="button" aria-label="Previous lunch box" className="shrink-0 cursor-pointer">
              <img
                src={lunchboxArrowLeft}
                alt=""
                className="h-[14px] w-[12px] rotate-180 lg:h-[24px] lg:w-[20px]"
              />
            </button>
            <div className="flex flex-col items-center gap-[12px] lg:gap-[19px]">
              <div className="relative inline-flex items-center justify-center">
                <img
                  src={blobSpecials}
                  alt=""
                  className="absolute right-[-6px] h-[61px] w-[91px] lg:right-[-10px] lg:h-[104px] lg:w-[165px]"
                />
                <p className="relative text-center font-ligema text-[15.2px] text-cocoa lg:text-[30.4px]">
                  LUNCH BOX <span className="font-script">Specials</span>
                </p>
              </div>
              <p className="max-w-[828px] text-center font-parkinsans text-[15px] text-cocoa lg:text-[20px]">
                A thoughtfully curated meal featuring fresh bread,
                handcrafted crackers, and a sweet treat; perfect for lunch,
                gifting, or sharing.
              </p>
            </div>
            <button type="button" aria-label="Next lunch box" className="shrink-0 cursor-pointer">
              <img
                src={lunchboxArrowRight}
                alt=""
                className="h-[14px] w-[12px] lg:h-[24px] lg:w-[20px]"
              />
            </button>
          </div>

          {/* What's inside */}
          <div className="flex w-full max-w-[1294px] flex-col items-center gap-[16px] lg:gap-[24px]">
            <p className="font-ligema text-[11.4px] uppercase text-cocoa lg:text-[19px]">
              WHAT&rsquo;S INSIDE
            </p>
            <div className="flex w-full flex-col gap-[20px] rounded-[16px] bg-[rgba(251,251,248,0.57)] p-[16px] lg:flex-row lg:items-center lg:justify-center lg:gap-[21px]">
              {LUNCHBOX_INSIDE.map((item, i) => (
                <Fragment key={item.label}>
                  <div className="flex items-center gap-[16px] lg:gap-[28px]">
                    <div className="relative grid size-[54px] shrink-0 place-items-center overflow-hidden rounded-full bg-[#d8cbbe] lg:size-[96px]">
                      <img
                        src={lunchboxIconsSprite}
                        alt=""
                        className="absolute max-w-none"
                        style={item.crop}
                      />
                    </div>
                    <div className="flex flex-col gap-[4px] text-cocoa">
                      <p className="font-ligema text-[10.4px] uppercase lg:text-[19px]">
                        {item.label}
                      </p>
                      <p className="font-parkinsans text-[13px] lg:text-[20px]">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  {i < LUNCHBOX_INSIDE.length - 1 && (
                    <img
                      src={iconRoundPlus}
                      alt=""
                      className="size-[20px] shrink-0 self-center lg:size-[32px]"
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Build your lunch box */}
          <div className="flex w-full max-w-[1294px] flex-col items-center gap-[24px] lg:gap-[35px]">
            <div className="flex flex-col items-center gap-[4px] text-center text-cocoa">
              <p className="font-ligema text-[10.4px] uppercase lg:text-[19px]">
                BUILD YOUR LUNCH BOX
              </p>
              <p className="font-parkinsans text-[14px] lg:text-[20px]">
                Select one option from each category
              </p>
            </div>
            <div className="flex w-full flex-col items-center gap-[24px] lg:flex-row lg:justify-center lg:gap-[48px]">
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

          {/* Price / cart bar */}
          <div className="flex w-full max-w-[1286px] flex-col items-start gap-[16px] lg:flex-row lg:items-center lg:gap-[33px]">
            <div className="rounded-[16px] bg-[#cc8a7a] px-[16px] py-[8px]">
              <p className="font-parkinsans text-[22px] text-white lg:text-[28px]">
                $33.50
              </p>
            </div>
            <p className="font-parkinsans text-[16px] text-cocoa lg:flex-1 lg:text-[20px]">
              One complete lunch box
              <br />
              with your selections
            </p>
            <div className="flex items-center gap-[16px]">
              <div className="flex items-center gap-[24px] rounded-full border-2 border-taupe px-[15px] py-[8px] font-parkinsans text-[16px] font-semibold text-taupe lg:gap-[44px]">
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
                className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[24px] py-[16px] font-parkinsans text-[16px] text-white"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Scalloped seam between the pink Lunch Box section and the cream FAQ
          section below (Group153 in Figma - a row of overlapping circles). */}
      <div className="h-[38px] w-full lg:hidden" style={SCALLOP_MOBILE} />
      <div className="hidden h-[58px] w-full lg:block" style={SCALLOP_DESKTOP} />

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
