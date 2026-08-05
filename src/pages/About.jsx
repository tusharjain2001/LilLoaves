import CategoryStrip from "../components/CategoryStrip.jsx";
import flowerYellow from "../assets/shared/flower-yellow.svg";
import heroBlobText from "../assets/about/hero-blob-text.svg";
import heroPhoto from "../assets/about/hero-photo.png";
import meetCorgis from "../assets/about/meet-corgis.png";
import quoteMark from "../assets/about/quote-mark.svg";
import patternLoaf from "../assets/about/pattern-loaf.svg";
import patternCroissant from "../assets/about/pattern-croissant.svg";
import tributeCorgi from "../assets/about/tribute-corgi.jpg";
import tributeRibbon from "../assets/about/tribute-ribbon.svg";

/* Desktop tops are Figma's absolute values minus 120px: the shared Navbar
   renders as a normal-flow 120px-tall header (44px pt + 76px pill) above
   this page, while Figma's mockup shows the navbar overlapping the hero's
   own y=0. Shifting these (and the hero content's own pt below) up by 120px
   keeps every flower - and everything after it on the page - aligned to the
   Figma layout instead of drifting 120px too low. */
const HERO_FLOWERS_DESKTOP = [
  { left: 1358, top: -28 },
  { left: 628, top: 539 },
  { left: 649, top: 0 },
  { left: 134, top: 75 },
  { left: 42, top: 445 },
  { left: 1345, top: 503 },
  { left: 1005, top: 258 },
];

const HERO_FLOWERS_MOBILE = [
  { left: 0, top: 461 },
  { left: 82, top: 143 },
  { left: 307, top: 307 },
  { left: 211, top: 572 },
];

const TRIBUTE_PARAGRAPHS = [
  "Lil’ Loaves is inspired by our two corgis, Doc and Chief (the “loaves” behind the business)—a compliment that always came during those happy pauses on our walks, whenever people stopped to admire their unmistakable shape. Unfortunately, we lost Doc in early 2026, and soon after, we lost our Dad as well—the man who supported us in everything we did. Their passing is now our tribute—our efforts to build something meaningful from losing something meaningful.",
  "Through the moments of saying “goodbye”, we’ve learned a lot. We learned to slow down and find peace in the simple rhythms, like baking. We were reminded to embrace our family and to lean on each other more often. Most of all, we learned that real healing happens when you are supported by friends, family, and community. And for all of those lessons, that is why we’re here. Lil’ Loaves is our new narrative. It’s our way of designing a life of purpose, keeping family close, and turning our craft into a mission to feed others.",
  "While some of our founding members are no longer here with us to “see the rise”, their impact on our lives is the inspiration that drives us to build something enduring. From our table to yours, we hope to welcome you to the family we’re building, one hand-shaped loaf at a time. Pets are welcome, too!",
];

/* Vertical stripe wash behind the hero, same repeating-column technique used
   for the Navbar/PageHero/Home hero stripes, tuned to this page's measurements. */
const HERO_STRIPES =
  "bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_80.32px,rgba(239,216,149,0.12)_80.32px,rgba(239,216,149,0.12)_160.65px)] lg:bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_110.77px,rgba(239,216,149,0.12)_110.77px,rgba(239,216,149,0.12)_221.54px)]";

/* Crosshatch/plaid wash behind "Meet Our Doc & Chief" - same technique as the
   Home page's Seasonal Specials plaid, tuned to this section's stripe metrics. */
const MEET_PLAID_BG = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(229,197,188,0.07) 0px, rgba(229,197,188,0.07) 35px, transparent 35px, transparent 88px), repeating-linear-gradient(0deg, rgba(229,197,188,0.07) 0px, rgba(229,197,188,0.07) 35px, transparent 35px, transparent 88px)",
};

/* Checkerboard wash behind the pull-quote banner (repeating-conic-gradient
   technique, matching the Home page's Seasonal Specials checkerboard border),
   plus a tiled scatter of the loaf/croissant motifs used in the same Figma
   pattern - reproduced as tiled CSS backgrounds rather than the ~24 individually
   positioned duplicate vector layers Figma exports for that pattern. */
const QUOTE_CHECKER_BG = {
  backgroundImage: "repeating-conic-gradient(#999c89 0% 25%, transparent 0% 50%)",
  backgroundSize: "40px 40px",
};

const QUOTE_ICON_BG = {
  backgroundImage: `url(${patternCroissant}), url(${patternLoaf})`,
  backgroundRepeat: "repeat, repeat",
  backgroundSize: "220px 220px, 220px 220px",
  backgroundPosition: "0px 0px, 110px 110px",
  opacity: 0.55,
};

/* Small checkerboard transition band between the Tribute section and the
   (shared) Footer. */
const DIVIDER_BG = {
  backgroundImage: "repeating-conic-gradient(#e5c5bc 0% 25%, transparent 0% 50%)",
};

export default function About() {
  return (
    <main className="w-full overflow-x-hidden bg-cream">
      {/* HERO */}
      <section className={`relative w-full overflow-hidden bg-vanilla ${HERO_STRIPES}`}>
        <div className="relative mx-auto w-full max-w-[1440px]">
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

          <div className="relative flex flex-col items-center gap-[17px] px-[16px] pt-[124px] lg:flex-row lg:items-start lg:px-[72px] lg:pt-[87px]">
            {/* welcome card */}
            <div className="relative h-[244.69px] w-[370px] shrink-0 lg:h-[450px] lg:w-[681px]">
              <img
                src={heroBlobText}
                alt=""
                className="absolute left-1/2 top-1/2 h-[370px] w-[244.69px] -translate-x-1/2 -translate-y-1/2 rotate-90 lg:h-[681px] lg:w-[450px]"
              />
              <div className="absolute left-[34px] top-[57px] flex w-[313px] flex-col items-start gap-[10px] lg:left-[63px] lg:top-[104px] lg:w-[576px] lg:gap-[19px]">
                <h1 className="font-ligema text-[16.6px] uppercase leading-none text-white lg:text-[30.4px]">
                  welcome to Lil&rsquo; Loaves!
                </h1>
                <p className="font-dm text-[11px] text-white lg:text-[20px]">
                  We&rsquo;re a family-owned bakery with a simple mission: make
                  bread, do it right, keep family close, and our community
                  fed.
                </p>
                <button
                  type="button"
                  className="cursor-pointer whitespace-nowrap rounded-full bg-[#fdfcf8] px-[23px] py-[8px] font-parkinsans text-[11px] text-cocoa lg:px-[43px] lg:py-[14px] lg:text-[16px]"
                >
                  Explore Our Menu
                </button>
              </div>
            </div>

            {/* hero photo */}
            <div className="relative h-[299px] w-[318px] shrink-0 overflow-hidden lg:h-[562px] lg:w-[597px]">
              <img
                src={heroPhoto}
                alt="Hands presenting a freshly baked braided loaf"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY QUICK-NAV */}
      <CategoryStrip />

      {/* MEET OUR DOC & CHIEF */}
      <section className="relative w-full overflow-hidden bg-cream">
        <div className="pointer-events-none absolute inset-0" style={MEET_PLAID_BG} />
        <div className="relative mx-auto flex w-full max-w-[1079px] flex-col items-center gap-[24px] px-[16px] py-[86px] lg:py-[57px]">
          <div className="flex items-center justify-center gap-[8px] text-center font-ligema uppercase text-cocoa lg:gap-[5px]">
            <p className="text-[40px] leading-none lg:text-[30.4px]">Meet Our Doc</p>
            <span className="text-[40px] leading-none text-transparent [-webkit-text-fill-color:transparent] [-webkit-text-stroke:1px_#57423d] lg:text-[30.4px] lg:[-webkit-text-stroke:1.5px_#57423d]">
              &amp;
            </span>
            <p className="text-[40px] leading-none lg:text-[30.4px]">Chief</p>
          </div>

          <div className="relative h-[169px] w-full overflow-hidden rounded-[6px] lg:h-[494px] lg:rounded-[16px]">
            <img
              src={meetCorgis}
              alt="Illustration of Doc and Chief, the two corgis behind Lil' Loaves"
              className="absolute left-[26.78%] top-[4.68%] h-[90.58%] w-[46.43%] object-contain"
            />
          </div>

          <p className="text-center font-parkinsans text-[16px] text-cocoa lg:text-[20px]">
            We created Lil&rsquo; Loaves to build something meaningful from a
            season of loss and transition. Every loaf we shape is for that
            purpose. This isn&rsquo;t just a bakery; it&rsquo;s our
            narrative.
          </p>
        </div>
      </section>

      {/* PULL QUOTE */}
      <section className="relative w-full overflow-hidden bg-[#eee2df]">
        <div className="pointer-events-none absolute inset-0" style={QUOTE_CHECKER_BG} />
        <div className="pointer-events-none absolute inset-0" style={QUOTE_ICON_BG} />
        <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-center px-[16px] py-[63px] lg:py-[121px]">
          <div className="relative flex w-full max-w-[1199px] items-center justify-center rounded-[16px] bg-[#f7f5f1] px-[16px] py-[60px] lg:h-[242px] lg:px-[10px] lg:py-[10px]">
            <img
              src={quoteMark}
              alt=""
              className="absolute left-[-3px] top-[23px] size-[83px] lg:left-[29px] lg:top-[60px]"
            />
            <p className="relative max-w-[290px] text-center font-ligema text-[24.7px] uppercase leading-[19.9px] text-cocoa lg:max-w-none lg:leading-normal lg:tracking-[1.2px]">
              Every loaf tells a story of love, loss, and new beginnings.
            </p>
          </div>
        </div>
      </section>

      {/* TRIBUTE */}
      <section className="w-full bg-cream px-[16px] py-[60px]">
        <div className="mx-auto flex w-full max-w-[1299px] flex-col items-center gap-[52px] lg:flex-row lg:items-center lg:justify-center lg:gap-[18px]">
          <div className="flex w-full flex-col gap-[29px] text-cocoa lg:w-[745px] lg:gap-[25px]">
            <h2 className="font-ligema text-[19px] uppercase lg:text-[22.8px]">
              Tribute
            </h2>
            <div className="flex flex-col gap-[16px] text-justify font-parkinsans text-[16px]">
              {TRIBUTE_PARAGRAPHS.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="relative w-full max-w-[370px] shrink-0 lg:w-[415px] lg:max-w-none">
            <img
              src={tributeCorgi}
              alt="Doc, one of the corgis behind Lil' Loaves"
              className="aspect-[370/532] w-full object-cover lg:aspect-[415/597]"
            />
            <img
              src={tributeRibbon}
              alt=""
              className="absolute -right-[8px] -top-[20px] h-[68px] w-[66px] -scale-y-100 rotate-[36.5deg] skew-x-[-2.83deg] lg:-left-[42px] lg:right-auto lg:top-0 lg:h-[81px] lg:w-[83px] lg:rotate-[-53.5deg]"
            />
          </div>
        </div>
      </section>

      {/* checkerboard transition band above the (shared) Footer */}
      <div className="h-[40px] w-full lg:hidden" style={{ ...DIVIDER_BG, backgroundSize: "40px 40px" }} />
      <div className="hidden h-[60px] w-full lg:block" style={{ ...DIVIDER_BG, backgroundSize: "60px 60px" }} />
    </main>
  );
}
