import cardScallop from "../assets/home/card-scallop.svg";
import blobSpecials from "../assets/home/blob-specials.svg";
import priceTab from "../assets/home/price-tab.svg";

/* Shared by the Home and Menu pages - Figma draws the same 841px "Frame 2737"
   on both (Home 247:9626, Menu 279:16924), down to the gingham phase and the
   checkerboard on the bottom edge. The card differs: Menu keeps the scalloped
   card with the price tab (371.95px tall), while Home now uses a plain white
   rounded card with no price (330.4px) and closes with a CTA. Hence the
   `withPriceTab` / `ctaLabel` props.

   Full-bleed patterns are phase-locked to Figma's 1440 canvas so they line up at
   1440 and keep tiling seamlessly on wider screens. */
const CANVAS_ORIGIN = "calc(50% - 720px)";

/* 35px bands on an 88px pitch, horizontals from y=0 and verticals from x=42, in
   #e5c5bc at 0.07. Figma stacks two copies of the group, but the upper copy
   opens with its own opaque #fbfbf8 backing rectangle, which hides the lower
   copy entirely - so only one set of bands is ever visible. Two CSS layers at
   0.07 then give the same 0.135 at the crossings. */
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
  backgroundImage: "repeating-conic-gradient(#e5c5bc 0 25%, transparent 0 50%)",
  backgroundSize: "60px 60px",
  backgroundPosition: "calc(50% - 690px) 0",
};

export default function SeasonalSpecials({
  specials,
  className = "",
  withPriceTab = true,
  ctaLabel = "View Specials",
}) {
  return (
    <section
      className={`relative w-full overflow-hidden bg-cream px-[16px] py-[60px] lg:h-[841px] lg:py-0 lg:pt-[75px] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0" style={GINGHAM_BG} />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[30px] lg:bottom-[1px] lg:h-[60px]"
        style={CHECKERBOARD_BG}
      />

      <div className="relative mx-auto flex w-full max-w-[1082px] flex-col items-center gap-[47px] lg:gap-[80px]">
        <div className="flex flex-col items-center gap-[33px] lg:gap-[56px]">
          {/* Title lockup: Figma centres the text+blob pair, not the text.
              Blob is painted first so the wordmark sits on top of it. On desktop
              the two words are two faces - Parkinsans and Rochester - each
              placed absolutely inside the 299.77x94.8 group. */}
          <div className="relative lg:h-[94.8px] lg:w-[299.77px]">
            <img
              src={blobSpecials}
              alt=""
              className="absolute left-[100px] top-0 h-[97px] w-[61px] -rotate-90 lg:left-[149.77px] lg:h-[94.8px] lg:w-[150px] lg:rotate-0"
            />
            <p className="relative font-display text-[18.1px] text-cocoa lg:hidden">
              SEASONAL Specials
            </p>
            <p className="absolute left-0 top-[28.8px] hidden font-parkinsans text-[33.6px] uppercase leading-[47px] tracking-[-1.68px] text-cocoa lg:block">
              Seasonal
            </p>
            <p className="absolute left-[165.83px] top-[19.2px] hidden font-rochester text-[43.2px] leading-[56px] text-cocoa lg:block">
              specials
            </p>
          </div>

          <div className="grid grid-cols-2 gap-[12px] lg:flex lg:gap-[16.92px]">
            {specials.map(({ name, price, img }) => (
              <div
                key={name}
                className={`relative w-[179px] lg:w-[257.81px] ${
                  withPriceTab
                    ? "h-[258px] lg:h-[371.95px]"
                    : "h-[229px] lg:h-[330.4px]"
                }`}
              >
                {withPriceTab ? (
                  <img
                    src={cardScallop}
                    alt=""
                    className="absolute inset-0 h-full w-full -scale-y-100"
                  />
                ) : (
                  <div className="absolute inset-0 rounded-[10.4px] bg-white lg:rounded-[15.02px]" />
                )}
                <img
                  src={img}
                  alt={name}
                  className="absolute left-[6px] top-[6px] h-[197px] w-[167px] rounded-[4px] object-cover lg:left-[8.46px] lg:top-[8.46px] lg:h-[284.15px] lg:w-[240.18px] lg:rounded-[5.5px]"
                />
                <p className="absolute left-1/2 top-[208px] -translate-x-1/2 whitespace-nowrap font-parkinsans text-[12px] text-cocoa lg:top-[299.38px] lg:text-[16.91px] lg:leading-[24px]">
                  {name}
                </p>
                {withPriceTab && (
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
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[28px] py-[6px] font-parkinsans text-[12px] text-white lg:px-[48px] lg:py-[10px] lg:text-[16px] lg:leading-[22px]"
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
