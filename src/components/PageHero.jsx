import flowerYellow from "../assets/shared/flower-yellow.svg";
import blobTitle from "../assets/shared/blob-title.svg";

/* Same seamless stripe pattern as Navbar - the two sections stack flush. */
const STRIPES =
  "bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_80px,#faf3e0_80px,#faf3e0_160px)] lg:bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_111px,#faf3e0_111px,#faf3e0_222px)]";

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
        {/* desktop flowers */}
        <div className="hidden lg:block">
          <img
            src={flowerYellow}
            alt=""
            className="absolute left-[110px] top-[51px] h-[72px] w-[79px]"
          />
          <img
            src={flowerYellow}
            alt=""
            className="absolute right-[13px] top-[51px] h-[72px] w-[79px]"
          />
          <img
            src={flowerYellow}
            alt=""
            className="absolute left-[321px] top-[155px] h-[72px] w-[79px]"
          />
          <img
            src={flowerYellow}
            alt=""
            className="absolute right-[242px] top-[155px] h-[72px] w-[79px]"
          />
        </div>

        <div className="absolute left-1/2 top-[79px] grid h-[86px] w-[310px] -translate-x-1/2 place-items-center lg:top-[88px] lg:h-[95px] lg:w-[410px]">
          <img
            src={blobTitle}
            alt=""
            className="absolute inset-0 h-full w-full"
          />
          <h1 className="relative font-ligema text-[40px] uppercase text-white lg:text-[48px]">
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}
