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

/* Same checkerboard at the 402 canvas's 20.1px cell, two rows tall. */
const CHECKERBOARD_BG_MOBILE = {
  backgroundImage: "repeating-conic-gradient(#e5c5bc 0 25%, transparent 0 50%)",
  backgroundSize: "40.2px 40.2px",
  backgroundPosition: "calc(50% - 180.9px) 0",
};

export default function SeasonalSpecials({
  specials,
  className = "",
  withPriceTab = true,
  ctaLabel = "View Specials",
}) {
  return (
    <section
      className={`relative w-full overflow-hidden bg-cream px-[16px] pb-[101.06px] pt-[80px] lg:h-[841px] lg:py-0 lg:pt-[75px] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0" style={GINGHAM_BG} />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40.2px] lg:hidden"
        style={CHECKERBOARD_BG_MOBILE}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[1px] hidden h-[60px] lg:block"
        style={CHECKERBOARD_BG}
      />

      <div className="relative mx-auto flex w-full max-w-[1082px] flex-col items-center gap-[47.01px] lg:gap-[80px]">
        <div className="flex flex-col items-center gap-[32.9px] lg:gap-[56px]">
          {/* Title lockup: Figma centres the text+blob pair, not the text.
              Blob is painted first so the wordmark sits on top of it. On desktop
              the two words are two faces - Parkinsans and Rochester - each
              placed absolutely inside the 299.77x94.8 group. */}
          <div className="relative h-[62.62px] w-[198px] lg:h-[94.8px] lg:w-[299.77px]">
            <img
              src={blobSpecials}
              alt=""
              className="absolute left-[98.93px] top-0 h-[62.62px] w-[99.08px] lg:left-[149.77px] lg:h-[94.8px] lg:w-[150px]"
            />
            <p className="absolute left-0 top-[19.02px] font-parkinsans text-[22.19px] uppercase leading-[31px] tracking-[-1.11px] text-cocoa lg:left-0 lg:top-[28.8px] lg:text-[33.6px] lg:leading-[47px] lg:tracking-[-1.68px]">
              Seasonal
            </p>
            <p className="absolute left-[109.53px] top-[12.68px] font-rochester text-[28.53px] leading-[37px] text-cocoa lg:left-[165.83px] lg:top-[19.2px] lg:text-[43.2px] lg:leading-[56px]">
              specials
            </p>
          </div>

          <div className="grid grid-cols-2 gap-[11.75px] lg:flex lg:gap-[16.92px]">
            {specials.map(({ name, price, img }) => (
              <div
                key={name}
                className={`relative w-[179.12px] lg:w-[257.81px] ${
                  withPriceTab
                    ? "h-[258px] lg:h-[371.95px]"
                    : "h-[229.56px] lg:h-[330.4px]"
                }`}
              >
                {withPriceTab ? (
                  <img
                    src={cardScallop}
                    alt=""
                    className="absolute inset-0 h-full w-full -scale-y-100"
                  />
                ) : (
                  <div className="absolute inset-0 rounded-[10.43px] bg-white lg:rounded-[15.02px]" />
                )}
                <img
                  src={img}
                  alt={name}
                  className="absolute left-[5.88px] top-[5.88px] h-[197.43px] w-[166.87px] rounded-[3.83px] object-cover lg:left-[8.46px] lg:top-[8.46px] lg:h-[284.15px] lg:w-[240.18px] lg:rounded-[5.5px]"
                />
                <p className="absolute left-1/2 top-[208px] -translate-x-1/2 whitespace-nowrap font-parkinsans text-[11.75px] leading-[16px] text-cocoa lg:top-[299.38px] lg:text-[16.91px] lg:leading-[24px]">
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
          className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[28.2px] py-[5.88px] font-parkinsans text-[11.75px] text-white lg:px-[48px] lg:py-[10px] lg:text-[16px] lg:leading-[22px]"
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
