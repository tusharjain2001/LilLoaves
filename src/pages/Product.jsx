import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductBySlug } from "../lib/woo.js";
import { useCart } from "../context/CartContext.jsx";
import iconBack from "../assets/shared/icon-back.svg";
import productMain from "../assets/product/product-main.png";
import productThumb1 from "../assets/product/product-thumb-1.jpg";
import productThumb2 from "../assets/product/product-thumb-2.jpg";
import iconChevronDown from "../assets/product/icon-chevron-down.svg";
import iconHotspring from "../assets/product/icon-hotspring.svg";
import iconChefhat from "../assets/product/icon-chefhat.svg";
import cardMilkBread from "../assets/product/card-milk-bread.jpg";
import cardDinnerRolls from "../assets/product/card-dinner-rolls.jpg";
import cardBlueberryMuffins from "../assets/product/card-blueberry-muffins.jpg";

// No product in the live store has an image yet, so this placeholder trio is
// the path that actually executes today. Keeps the gallery from collapsing.
const PLACEHOLDER_IMAGES = [productMain, productThumb1, productThumb2];

// Placeholder copy, the same for every product. The bakery has not supplied
// per-product ingredient or allergen text yet, and WooCommerce has no field
// holding it - swap these strings (or key them off product.slug) once it does.
const ACCORDION_ITEMS = [
  {
    key: "ingredients",
    label: "Ingredients",
    content:
      "Organic wheat flour, filtered water, live sourdough starter, sea salt. Naturally leavened over 24 hours and baked fresh every morning - no preservatives, no additives.",
  },
  {
    key: "allergens",
    label: "Allergens",
    content:
      "Contains wheat and gluten. Baked in a kitchen that also handles milk, eggs, soy, tree nuts and sesame, so traces may be present.",
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
  const { slug } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [product, setProduct] = useState(undefined);

  useEffect(() => {
    let active = true;
    fetchProductBySlug(slug).then((p) => {
      if (active) setProduct(p);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  // gallery[0] is the elevated hero slot, gallery[1]/[2] are the plain thumbnails
  const [galleryOrder, setGalleryOrder] = useState([0, 1, 2]);
  // Chosen pack-size variation id (Muffins/Cookies/Crackers only). null until
  // touched, same as Menu.jsx's selection state - the render below defaults
  // to the first (wp-admin-ordered) pack size rather than treating null as
  // "nothing selected".
  const [selectedVariationId, setSelectedVariationId] = useState(null);
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

  if (product === undefined) return null;
  if (product === null) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-[24px]">
        <p className="font-parkinsans text-[18px] text-cocoa">
          We couldn&rsquo;t find that bake. Try the menu.
        </p>
      </main>
    );
  }

  // 0, 1 or 2 uploaded photos are all real states (the owner's first upload
  // is the most likely next event on this site) - pad out with placeholders
  // rather than only handling the fully-empty case, so a lone photo doesn't
  // leave the other two gallery slots pointing at an undefined src.
  const GALLERY_IMAGES = [
    ...product.images.map((i) => i.src),
    ...PLACEHOLDER_IMAGES,
  ].slice(0, 3);

  // Muffins/Cookies/Crackers carry real pack sizes from woo.js's /variations
  // merge; breads and the Lunch Box have no `packSizes` at all, so every
  // branch below falls back to the product's own price/stock exactly as
  // before pack sizes existed - never a hardcoded pack list or count.
  const packSizes = product.packSizes ?? [];
  const hasPackSizes = packSizes.length > 0;
  const selectedPackSize = hasPackSizes
    ? packSizes.find((s) => s.id === selectedVariationId) ?? packSizes[0]
    : null;
  const displayPrice = selectedPackSize ? selectedPackSize.priceFormatted : product.priceFormatted;
  const purchasable = selectedPackSize ? selectedPackSize.inStock : product.inStock;
  const cartProduct = selectedPackSize ? { ...product, priceFormatted: selectedPackSize.priceFormatted } : product;
  const cartOptions = selectedPackSize ? { size: selectedPackSize.name } : undefined;
  const cartVariationId = selectedPackSize ? selectedPackSize.id : undefined;

  return (
    <main className="w-full bg-cream">
      {/* GALLERY + PRODUCT INFO */}
      <section className="w-full bg-cream px-[16px] py-[60px] lg:px-[72px] lg:pb-[68px] lg:pt-[88px]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-[16px] lg:gap-[26px]">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex cursor-pointer items-center gap-[9.422px] lg:gap-[15px]"
          >
            <img
              src={iconBack}
              alt=""
              className="h-[18.844px] w-[9.422px] lg:h-[30px] lg:w-[15px]"
            />
            <span className="font-parkinsans text-[12.563px] text-cocoa lg:text-[20px]">
              Go Back
            </span>
          </button>

          <div className="flex w-full flex-col items-center gap-[77.259px] lg:flex-row lg:items-center lg:gap-[123px]">
            {/* Gallery */}
            <div className="flex w-full flex-col items-start gap-[16.959px] lg:w-[532px] lg:shrink-0 lg:gap-[27px]">
              <div className="relative aspect-[370/233.902] w-full overflow-hidden rounded-[8.338px] bg-shell lg:aspect-[531/372] lg:rounded-[13px]">
                <img
                  src={GALLERY_IMAGES[galleryOrder[0]]}
                  alt={product.name}
                  className="absolute left-[20.53%] top-[5.639%] h-[88.788%] w-[53.56%] object-contain object-bottom shadow-[0_9.381px_14.227px_rgba(0,0,0,0.25)] lg:w-[59.13%] lg:shadow-[0_15px_23px_rgba(0,0,0,0.25)]"
                />
              </div>
              <div className="flex w-full gap-[15.075px] lg:gap-[24px]">
                <button type="button" onClick={() => swapToHero(1)} className="flex-1 cursor-pointer">
                  <img
                    src={GALLERY_IMAGES[galleryOrder[1]]}
                    alt=""
                    className="h-[140.7px] w-full rounded-[14.331px] object-cover lg:h-[224px] lg:rounded-[23px]"
                  />
                </button>
                <button type="button" onClick={() => swapToHero(2)} className="flex-1 cursor-pointer">
                  <img
                    src={GALLERY_IMAGES[galleryOrder[2]]}
                    alt=""
                    className="h-[140.7px] w-full rounded-[14.331px] object-cover lg:h-[224px] lg:rounded-[23px]"
                  />
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="flex w-full flex-col items-center gap-[32.034px] lg:w-[608px] lg:items-start lg:gap-[51px]">
              <div className="flex w-full flex-col items-center gap-[35.175px] lg:items-start lg:gap-[56px]">
                <div className="flex w-full flex-col items-center gap-[31.406px] lg:items-start lg:gap-[50px]">
                  <div className="flex w-full flex-col items-center gap-[10.678px] text-center lg:items-start lg:gap-[17px] lg:text-left">
                    {/* Figma sets this in Parkinsans Medium, not the display
                        face - 24px/-1.2px here, 40px/-2px on desktop. The
                        --font-ligema alias also resolves to Parkinsans, but it
                        carries the theme's 0.475x legacy downscale that only
                        exists to stand in for the missing Ligema DEMO file, so
                        it does not belong on a face we actually ship. The lg:
                        values below hold desktop at what it renders today. */}
                    <p className="font-parkinsans text-[24px] font-medium uppercase tracking-[-1.2px] text-cocoa lg:text-[26.6px] lg:font-normal lg:tracking-normal">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-[10.05px] whitespace-nowrap font-parkinsans lg:gap-[16px]">
                      <p className="text-[22.613px] text-cocoa lg:text-[36px]">{displayPrice}</p>
                      {/* No per-pack-size regular/sale price exists (the
                          /variations endpoint returns only a current active
                          price), so the struck-through "was" price stays
                          tied to the product overall, same as before pack
                          sizes existed. */}
                      {product.onSale && (
                        <p className="text-[20.1px] text-shell line-through decoration-solid lg:text-[32px]">
                          {product.regularPriceFormatted}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex w-full flex-col items-center justify-center gap-[12.563px] lg:w-auto lg:items-start lg:gap-[20px]">
                    <p
                      className="max-w-[370px] text-center font-parkinsans text-[12.563px] text-[#9e8e7f] lg:max-w-none lg:text-left lg:text-[20px]"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                    {hasPackSizes && (
                      <div className="flex items-center justify-center gap-[8.67px]">
                        {packSizes.map((size) => {
                          const isSelected = size.id === selectedPackSize.id;
                          return (
                            <button
                              key={size.id}
                              type="button"
                              aria-pressed={isSelected}
                              disabled={!size.purchasable}
                              onClick={() => setSelectedVariationId(size.id)}
                              className={`cursor-pointer whitespace-nowrap rounded-[15.414px] px-[7.707px] py-[3.854px] font-parkinsans text-[13.487px] text-[#57423d] disabled:cursor-not-allowed disabled:opacity-50 ${
                                isSelected ? "bg-[#fff3d4]" : "bg-[#f7f5f1]"
                              }`}
                            >
                              {size.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex w-full items-start gap-[10.05px] lg:gap-[16px]">
                  {purchasable ? (
                    <>
                      <button
                        type="button"
                        onClick={() => cart.add(cartProduct, 1, cartOptions, cartVariationId)}
                        className="flex-1 cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[30.15px] py-[6.281px] font-parkinsans text-[12.563px] text-white lg:flex-none lg:px-[48px] lg:py-[10px] lg:text-[16px]"
                      >
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          cart.add(cartProduct, 1, cartOptions, cartVariationId);
                          navigate("/cart");
                        }}
                        className="flex-1 cursor-pointer whitespace-nowrap rounded-full border-[1.256px] border-cocoa px-[30.15px] py-[6.281px] font-parkinsans text-[12.563px] text-cocoa lg:flex-none lg:border-2 lg:px-[48px] lg:py-[10px] lg:text-[16px]"
                      >
                        Buy Now
                      </button>
                    </>
                  ) : (
                    <span className="flex-1 cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[30.15px] py-[6.281px] font-parkinsans text-[12.563px] text-white lg:flex-none lg:px-[48px] lg:py-[10px] lg:text-[16px]">
                      Sold out
                    </span>
                  )}
                </div>
              </div>

              {/* Figma draws the rules as their own 1.256px (mobile) / 2px
                  (desktop) bars with a 7.538px / 12px gap either side, which is
                  the same box a border plus that much vertical padding gives -
                  and keeps each panel attached to the row that opened it. */}
              <div className="flex w-full flex-col items-start border-t-[1.256px] border-shell lg:border-t-2">
                {ACCORDION_ITEMS.map((item) => {
                  const isOpen = openAccordion === item.key;
                  return (
                    <div
                      key={item.key}
                      className="w-full border-b-[1.256px] border-shell lg:border-b-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggleAccordion(item.key)}
                        className="flex w-full cursor-pointer items-center justify-between py-[7.538px] lg:py-[12px]"
                      >
                        {/* Figma names Neulis Sans, which this project stands in
                            for with DM Sans - the same mapping the info bar
                            below already uses. */}
                        <span className="font-dm text-[12.563px] text-cocoa lg:text-[20px]">
                          {item.label}
                        </span>
                        <img
                          src={iconChevronDown}
                          alt=""
                          className={`h-[5.025px] w-[10.05px] transition-transform duration-200 lg:h-[8px] lg:w-[16px] ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="pb-[7.538px] font-parkinsans text-[12.563px] text-[#9e8e7f] lg:pb-[12px] lg:text-[16px]">
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
      {/* Figma gives this bar no side padding at either size - the pair is
          simply centred, and the 45.832px gap is what makes it span the 402px
          frame edge to edge. Padding here would push it into an overflow on a
          narrow phone instead. */}
      <section className="w-full bg-rose py-[17.67px] lg:py-[32px]">
        <div className="mx-auto flex w-full max-w-[1024px] items-center justify-center gap-[45.832px] lg:gap-[83px]">
          {INFO_BAR.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-[11.596px] lg:gap-[21px]">
              <img src={icon} alt="" className="size-[19.327px] lg:size-[35px]" />
              <p className="whitespace-nowrap font-dm text-[13.253px] text-cocoa lg:text-[20px]">
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
                className="w-full rounded-[14.028px] border-[0.845px] border-shell px-[6.758px] pb-[13.516px] pt-[6.758px] lg:w-[348px] lg:rounded-[13px] lg:border lg:px-[7px] lg:pb-[13px] lg:pt-[7px]"
              >
                <img
                  src={img}
                  alt={name}
                  className="aspect-[356.484/291.438] w-full rounded-[12.868px] object-cover lg:aspect-[6/5] lg:rounded-[12px]"
                />
                <div className="flex flex-col items-start gap-[30.411px] px-[13.516px] pt-[11.826px] lg:gap-[29px] lg:px-[13px] lg:pt-[13px]">
                  <div className="flex flex-col items-start gap-[3.379px] lg:gap-[3px]">
                    <p className="font-parkinsans text-[20.274px] font-semibold text-cocoa lg:text-[19px]">
                      {name}
                    </p>
                    <p className="font-parkinsans text-[13.516px] text-clay lg:text-[13px]">
                      {desc}
                    </p>
                  </div>
                  <div className="flex w-full items-center justify-center gap-[30.411px] lg:gap-[29px]">
                    <p className="flex-1 font-parkinsans text-[23.653px] text-cocoa lg:text-[22px]">
                      {price}
                    </p>
                    <button
                      type="button"
                      className="flex-1 cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[13.516px] py-[6.758px] font-parkinsans text-[13.516px] text-white lg:px-[13px] lg:py-[7px] lg:text-[13px]"
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
