import flowerYellow from "../assets/shared/flower-yellow.svg";
import blobTitle from "../assets/shared/blob-title.svg";

/* Same seamless stripe pattern as Navbar - the two sections stack flush.
   Desktop is #faf3e0 bands on a #fcf7ea field, 110.769px each on a 221.538px
   pitch, which is the board's 1440 divided into thirteenths. Mobile keeps its
   own 80px pitch until that frame is checked. */
const STRIPES =
  "bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_80px,#faf3e0_80px,#faf3e0_160px)] lg:bg-[repeating-linear-gradient(90deg,#faf3e0_0px,#faf3e0_110.769px,#fcf7ea_110.769px,#fcf7ea_221.538px)]";

export default function PageHero({ title }) {
  return (
    <section className={`w-full overflow-hidden ${STRIPES}`}>
      <div className="relative mx-auto h-[285px] w-full max-w-[1440px]">
        {/* mobile flowers */}
        <div className="lg:hidden">
          <img
            src={flowerYellow}
            alt=""
            className="absolute left-[-17px] top-[7px] h-[72px] w-[79px]"
          />
          <img
            src={flowerYellow}
            alt=""
            className="absolute right-[-23px] top-[196px] h-[72px] w-[79px]"
          />
        </div>
        {/* Desktop flowers. The two on the right are the same asset mirrored -
            Figma reports their x already shifted by one width, which is how it
            records a horizontally flipped node, so their true left edges are
            1269 and 1040 on the 1440 board. */}
        <div className="hidden lg:block">
          <img
            src={flowerYellow}
            alt=""
            className="absolute left-[110px] top-[51px] h-[71.88px] w-[79.41px]"
          />
          <img
            src={flowerYellow}
            alt=""
            className="absolute right-[91.59px] top-[51px] h-[71.88px] w-[79.41px] -scale-x-100"
          />
          <img
            src={flowerYellow}
            alt=""
            className="absolute left-[321px] top-[155px] h-[71.88px] w-[79.41px]"
          />
          <img
            src={flowerYellow}
            alt=""
            className="absolute right-[320.59px] top-[155px] h-[71.88px] w-[79.41px] -scale-x-100"
          />
        </div>

        {/* Figma parks the blob 6px right of centre on the 1440 board (x=521,
            w=410 -> centre 726), not dead centre. */}
        <div className="absolute left-1/2 top-[79px] grid h-[86px] w-[310px] -translate-x-1/2 place-items-center lg:left-[calc(50%+6px)] lg:top-[88.21px] lg:h-[95.55px] lg:w-[410px]">
          {/* The blob is drawn upright - 95.55 x 409.87 - and turned on its side
              on the board, so it is rotated here too. Stretching the portrait
              art into the landscape box instead flattens every wave. */}
          <img
            src={blobTitle}
            alt=""
            className="absolute inset-0 h-full w-full lg:hidden"
          />
          <img
            src={blobTitle}
            alt=""
            className="absolute left-1/2 top-1/2 hidden h-[409.87px] w-[95.55px] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 lg:block"
          />
          {/* Figma sets the page title in Parkinsans Medium, not the display
              face - 40px/-2px tracking on the 1440 board (Gallery 247:3657).
              Mobile keeps the legacy stand-in size until its frame is checked. */}
          <h1 className="relative font-ligema text-[19px] uppercase text-white lg:font-parkinsans lg:text-[40px] lg:font-medium lg:tracking-[-2px]">
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}
