import { useState } from "react";
import iconBack from "../assets/shared/icon-back.svg";
import productMain from "../assets/product/product-main.png";
import productThumb1 from "../assets/product/product-thumb-1.png";
import productThumb2 from "../assets/product/product-thumb-2.png";
import iconChevronDown from "../assets/product/icon-chevron-down.svg";
import iconHotspring from "../assets/product/icon-hotspring.svg";
import iconChefhat from "../assets/product/icon-chefhat.svg";
import cardMilkBread from "../assets/product/card-milk-bread.png";
import cardDinnerRolls from "../assets/product/card-dinner-rolls.png";
import cardBlueberryMuffins from "../assets/product/card-blueberry-muffins.png";

const GALLERY_IMAGES = [productMain, productThumb1, productThumb2];

const PACK_OPTIONS = ["Pack of 2", "Pack of 4"];

const ACCORDION_ITEMS = [
  {
    key: "ingredients",
    label: "Ingredients",
    content: "Organic wheat flour, water, sourdough starter, sea salt.",
  },
  {
    key: "allergens",
    label: "Allergens",
    content:
      "Contains wheat and gluten. May contain traces of nuts and dairy.",
  },
];

const INFO_BAR = [
  { icon: iconHotspring, label: "100% Freshly Baked" },
  { icon: iconChefhat, label: "Homegrown Brand" },
];

const RELATED_ITEMS = [
  {
    name: "Japanese Milk Bread",
    desc: "Soft, fluffy, and delicately sweet—perfect for sandwiches, toast, or enjoying on its own.",
    price: "$21.13",
    img: cardMilkBread,
  },
  {
    name: "Dinner Rolls",
    desc: "Pillowy, buttery rolls baked fresh to bring warmth to every meal and gathering.",
    price: "$21.13",
    img: cardDinnerRolls,
  },
  {
    name: "Blueberry Muffins",
    desc: "Moist, fluffy muffins bursting with juicy blueberries in every bite.",
    price: "$21.13",
    img: cardBlueberryMuffins,
  },
];

export default function Product() {
  // gallery[0] is the elevated hero slot, gallery[1]/[2] are the plain thumbnails
  const [galleryOrder, setGalleryOrder] = useState([0, 1, 2]);
  const [selectedPack, setSelectedPack] = useState(0);
  const [openAccordion, setOpenAccordion] = useState(null);

  const swapToHero = (position) => {
    setGalleryOrder((prev) => {
      const next = [...prev];
      [next[0], next[position]] = [next[position], next[0]];
      return next;
    });
  };

  const toggleAccordion = (key) =>
    setOpenAccordion((cur) => (cur === key ? null : key));

  return (
    <main className="w-full bg-cream">
      {/* GALLERY + PRODUCT INFO */}
      <section className="w-full bg-cream px-[16px] py-[60px] lg:px-[72px] lg:pb-[24px] lg:pt-[44px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-[16px] lg:gap-[26px]">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex cursor-pointer items-center gap-[9px] lg:gap-[15px]"
          >
            <img
              src={iconBack}
              alt=""
              className="h-[19px] w-[9px] lg:h-[30px] lg:w-[15px]"
            />
            <span className="font-parkinsans text-[13px] text-cocoa lg:text-[20px]">
              Go Back
            </span>
          </button>

          <div className="flex w-full flex-col items-center gap-[77px] lg:flex-row lg:items-center lg:justify-center lg:gap-[123px]">
            {/* Gallery */}
            <div className="flex w-full flex-col items-start gap-[17px] lg:w-[532px] lg:shrink-0 lg:gap-[27px]">
              <div className="relative aspect-[370/234] w-full overflow-hidden rounded-[8px] bg-[#d8cbbe] lg:aspect-[531/372] lg:rounded-[13px]">
                <img
                  src={GALLERY_IMAGES[galleryOrder[0]]}
                  alt="Sourdough Bread"
                  className="absolute left-[20.53%] top-[5.64%] h-[88.79%] w-[53.56%] object-contain object-bottom shadow-[0_9px_14px_rgba(0,0,0,0.25)] lg:w-[59.13%] lg:shadow-[0_15px_23px_rgba(0,0,0,0.25)]"
                />
              </div>
              <div className="flex w-full gap-[15px] lg:gap-[24px]">
                <button type="button" onClick={() => swapToHero(1)} className="flex-1 cursor-pointer">
                  <img
                    src={GALLERY_IMAGES[galleryOrder[1]]}
                    alt=""
                    className="h-[141px] w-full rounded-[14px] object-cover lg:h-[224px] lg:rounded-[23px]"
                  />
                </button>
                <button type="button" onClick={() => swapToHero(2)} className="flex-1 cursor-pointer">
                  <img
                    src={GALLERY_IMAGES[galleryOrder[2]]}
                    alt=""
                    className="h-[141px] w-full rounded-[14px] object-cover lg:h-[224px] lg:rounded-[23px]"
                  />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="flex w-full flex-col items-center gap-[32px] lg:w-[608px] lg:items-start lg:gap-[51px]">
              <div className="flex w-full flex-col items-center gap-[31px] lg:items-start lg:gap-[50px]">
                <div className="flex flex-col items-center gap-[11px] text-center lg:items-start lg:gap-[17px] lg:text-left">
                  <p className="font-ligema text-[16.6px] uppercase text-cocoa lg:text-[26.6px]">
                    Sourdough Bread
                  </p>
                  <div className="flex items-center gap-[10px] whitespace-nowrap font-parkinsans lg:gap-[16px]">
                    <p className="text-[23px] text-cocoa lg:text-[36px]">$21.13</p>
                    <p className="text-[20px] text-[#d8cbbe] line-through decoration-solid lg:text-[32px]">
                      $21.13
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-[13px] lg:items-start lg:gap-[20px]">
                  <p className="max-w-[370px] text-center font-parkinsans text-[13px] text-[#9e8e7f] lg:max-w-none lg:text-left lg:text-[20px]">
                    Slow-fermented and hand-shaped for a crisp crust, airy
                    crumb, and rich, tangy flavor.
                  </p>
                  <div className="flex items-center gap-[10px] lg:gap-[16px]">
                    {PACK_OPTIONS.map((label, i) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setSelectedPack(i)}
                        className={`cursor-pointer whitespace-nowrap rounded-[10px] border px-[10px] py-[5px] font-parkinsans text-[13px] lg:rounded-[15px] lg:border-2 lg:px-[16px] lg:py-[8px] lg:text-[16px] ${
                          selectedPack === i
                            ? "border-taupe bg-taupe text-white"
                            : "border-latte bg-transparent text-latte"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex w-full items-start gap-[10px] lg:gap-[16px]">
                <button
                  type="button"
                  className="flex-1 cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[30px] py-[6px] font-parkinsans text-[13px] text-white lg:flex-none lg:px-[48px] lg:py-[10px] lg:text-[16px]"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  className="flex-1 cursor-pointer whitespace-nowrap rounded-full border border-cocoa px-[30px] py-[6px] font-parkinsans text-[13px] text-cocoa lg:flex-none lg:border-2 lg:px-[48px] lg:py-[10px] lg:text-[16px]"
                >
                  Buy Now
                </button>
              </div>

              <div className="flex w-full flex-col items-start border-t border-[#d8cbbe]">
                {ACCORDION_ITEMS.map((item) => {
                  const isOpen = openAccordion === item.key;
                  return (
                    <div
                      key={item.key}
                      className="w-full border-b border-[#d8cbbe]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleAccordion(item.key)}
                        className="flex w-full cursor-pointer items-center justify-between py-[12px] lg:py-[19px]"
                      >
                        <span className="font-parkinsans text-[13px] text-cocoa lg:text-[20px]">
                          {item.label}
                        </span>
                        <img
                          src={iconChevronDown}
                          alt=""
                          className={`h-[5px] w-[10px] transition-transform duration-200 lg:h-[8px] lg:w-[16px] ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="pb-[12px] font-parkinsans text-[13px] text-[#9e8e7f] lg:pb-[19px] lg:text-[16px]">
                          {item.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INFO BAR */}
      <section className="w-full bg-rose px-[16px] py-[18px] lg:py-[32px]">
        <div className="mx-auto flex w-full max-w-[1024px] items-center justify-center gap-[24px] lg:gap-[83px]">
          {INFO_BAR.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-[6px] lg:gap-[21px]">
              <img src={icon} alt="" className="size-[19px] lg:size-[35px]" />
              <p className="whitespace-nowrap font-dm text-[13px] text-cocoa lg:text-[20px]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* RELATED ITEMS */}
      <section className="w-full bg-cream px-[16px] py-[60px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[24px] lg:gap-[29px]">
          <p className="text-center font-ligema text-[19px] text-cocoa lg:text-[22.8px]">
            YOU MAY ALSO <span className="font-script">Like</span>
          </p>
          <div className="flex w-full max-w-[370px] flex-col items-center gap-[14px] lg:max-w-none lg:w-auto lg:flex-row lg:justify-center lg:gap-[16px]">
            {RELATED_ITEMS.map(({ name, desc, price, img }) => (
              <div
                key={name}
                className="w-full rounded-[14px] border border-[#d8cbbe] p-[7px] pb-[13px] lg:w-[348px] lg:rounded-[13px]"
              >
                <img
                  src={img}
                  alt={name}
                  className="aspect-[6/5] w-full rounded-[13px] object-cover lg:rounded-[12px]"
                />
                <div className="flex flex-col items-start gap-[30px] px-[13px] pt-[13px] lg:gap-[29px]">
                  <div className="flex flex-col items-start gap-[3px]">
                    <p className="font-parkinsans text-[20px] font-semibold text-cocoa lg:text-[19px]">
                      {name}
                    </p>
                    <p className="font-parkinsans text-[13px] text-clay">
                      {desc}
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-center gap-[30px] lg:gap-[29px]">
                    <p className="flex-1 font-parkinsans text-[24px] text-cocoa lg:text-[22px]">
                      {price}
                    </p>
                    <button
                      type="button"
                      className="flex-1 cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[13px] py-[7px] font-parkinsans text-[13px] text-white"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
