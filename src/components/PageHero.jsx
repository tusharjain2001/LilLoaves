import flowerYellow from "../assets/shared/flower-yellow.svg";
import blobTitle from "../assets/shared/blob-title.svg";

/* Same seamless stripe pattern as Navbar - the two sections stack flush.
   #faf3e0 bands on a #fcf7ea field: 80.323px on a 160.646px pitch on the 402
   board (its 402 in fifths), 110.769px on a 221.538px pitch on the 1440 one
   (its 1440 in thirteenths). Both start a band at x=0. */
const STRIPES =
  "bg-[repeating-linear-gradient(90deg,#faf3e0_0px,#faf3e0_80.323px,#fcf7ea_80.323px,#fcf7ea_160.646px)] lg:bg-[repeating-linear-gradient(90deg,#faf3e0_0px,#faf3e0_110.769px,#fcf7ea_110.769px,#fcf7ea_221.538px)]";

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
        {/* Both boards park the blob a hair off centre - 1px left on the 402
            canvas (x=45, w=310), 6px right on the 1440 one (x=521, w=410). */}
        <div className="absolute left-[calc(50%-1px)] top-[79px] grid h-[86.09px] w-[310px] -translate-x-1/2 place-items-center lg:left-[calc(50%+6px)] lg:top-[88.21px] lg:h-[95.55px] lg:w-[410px]">
          {/* The blob is drawn upright - 95.55 x 409.87 - and turned on its side
              on both boards, so it is rotated here too. Stretching the portrait
              art into the landscape box instead flattens every wave. Mobile's
              slot is a slightly different proportion, hence its own size. */}
          <img
            src={blobTitle}
            alt=""
            className="absolute left-1/2 top-1/2 h-[310px] w-[86.09px] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 lg:hidden"
          />
          <img
            src={blobTitle}
            alt=""
            className="absolute left-1/2 top-1/2 hidden h-[409.87px] w-[95.55px] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 lg:block"
          />
          {/* Parkinsans Medium, tracked at -0.05em. 40px on the 1440 board
              (247:3657); mobile is the size that reproduces the 402 board's
              15px cap height, since that frame still sets the old display face
              here and its nominal size does not carry across. */}
          <h1 className="relative font-parkinsans text-[21.4px] font-medium uppercase tracking-[-0.05em] text-white lg:text-[40px]">
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}
