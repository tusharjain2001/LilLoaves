import { useCart } from "../context/CartContext.jsx";
import iconBin from "../assets/cart/icon-bin.svg";
import iconMinus from "../assets/cart/icon-minus.svg";

// Shown for a per-line total whose quote hasn't landed yet - same convention
// as Cart.jsx's own PENDING: never a fabricated $0.00, never blank beside a
// price.
const PENDING = "—";

/* A Lunch Box's chosen bread/cracker/dessert, as one line of text. Returns ""
   when nothing is chosen, so the caller can skip the row entirely rather than
   render an empty paragraph. */
function optionSummary(options) {
  if (!options) return "";
  return Object.values(options).filter(Boolean).join(" · ");
}

/**
 * The Cart Items panel (line items, quantity steppers, remove bin), shared
 * between Cart.jsx's delivery/pickup modes and Pickup.jsx - one definition so
 * all three call sites render identical JSX and cannot drift apart. Without
 * this, a collection customer on /pickup saw a total (once quoted) but never
 * what they were buying, and couldn't change a quantity or remove anything.
 *
 * `quoteLineTotals` is a Map of `${id}:${variationId ?? 0}` -> totalFormatted
 * from the caller's own /quote result - this component never prices
 * anything itself, per the money rule.
 */
export default function CartItemsPanel({ quoteLineTotals }) {
  const cart = useCart();

  // Must pass line.options through: a line with options is keyed by
  // (id, options) in CartContext, not bare id, so omitting it here would
  // target a key that matches no line for e.g. a Lunch Box.
  const increment = (line) => cart.setQty(line.id, line.qty + 1, line.options);
  // Pressing "-" at quantity 1 removes the line - CartContext's setQty
  // already drops a line at qty <= 0, so this is just no longer clamping
  // that away. The bin icon stays as an explicit one-click remove at any
  // quantity; this makes the stepper itself reach the same result at 1.
  const decrement = (line) => cart.setQty(line.id, line.qty - 1, line.options);

  return (
    <div className="flex w-full flex-col gap-[12px] rounded-[10px] border border-[#d8cbbe] bg-[#f7f5f1] p-[12px] lg:gap-[19px] lg:rounded-[16px] lg:p-[16px]">
      <div className="flex h-[38px] items-center justify-between rounded-[7px] bg-[#d8cbbe] px-[13px] font-parkinsans text-[16px] font-medium text-cocoa lg:h-[61px] lg:rounded-[16px] lg:px-[30px] lg:text-[20px]">
        <p>Cart Items ({cart.count})</p>
        <button
          type="button"
          onClick={() => cart.clear()}
          className="cursor-pointer font-parkinsans text-[14px] underline lg:text-[20px]"
        >
          Clear Cart
        </button>
      </div>

      {cart.isEmpty ? (
        <p className="py-[12px] text-center font-parkinsans text-[14px] text-cocoa lg:text-[18px]">
          Your cart is empty.
        </p>
      ) : (
        cart.lines.map((line) => (
          <div
            key={`${line.id}:${line.options ? Object.values(line.options).join('|') : ''}`}
            className="flex w-full items-center gap-[15px] lg:gap-[17px]"
          >
            <img
              src={line.image || undefined}
              alt={line.name}
              className="h-[147px] w-[177px] shrink-0 rounded-[3px] object-cover lg:h-[122px] lg:w-[148px] lg:rounded-[8px]"
            />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-[13px] lg:flex-row lg:items-center lg:justify-between lg:gap-[67px]">
              <div className="flex min-w-0 flex-col gap-[13px] lg:flex-row lg:items-center lg:gap-[84px]">
                <div className="flex min-w-0 flex-col gap-[2px] lg:gap-[3px]">
                  <p className="font-parkinsans text-[16px] text-cocoa lg:text-[24px]">
                    {line.name}
                  </p>
                  <p className="font-parkinsans text-[20px] text-cocoa">
                    {line.priceFormatted}
                  </p>
                  {optionSummary(line.options) && (
                    <p className="font-parkinsans text-[12px] text-[#949494]">
                      {optionSummary(line.options)}
                    </p>
                  )}
                </div>
                <div className="flex w-[80px] shrink-0 items-center justify-center gap-[17px] rounded-full border-[1.3px] border-taupe/30 px-[10px] py-[5px] font-parkinsans font-semibold text-taupe/80 lg:w-[124px] lg:gap-[27px] lg:border-2 lg:px-[15px] lg:py-[8px]">
                  <button
                    type="button"
                    aria-label={`Decrease ${line.name} quantity`}
                    onClick={() => decrement(line)}
                    className="flex cursor-pointer items-center justify-center"
                  >
                    <img
                      src={iconMinus}
                      alt=""
                      className="h-[10px] w-[8px] lg:hidden"
                    />
                    <span className="hidden text-[20px] lg:inline">
                      &minus;
                    </span>
                  </button>
                  <span className="text-[15px] lg:text-[20px]">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${line.name} quantity`}
                    onClick={() => increment(line)}
                    className="cursor-pointer text-[14px] lg:text-[20px]"
                  >
                    +
                  </button>
                </div>
              </div>
              {/* shrink-0 all the way down, and nowrap on the total: this
                  block is a flex sibling of the name column, so a long name
                  ("Doc's Cheddar Cheese Crackers", two lines plus a pack-size
                  row) squeezed it until the bin collapsed to a few pixels -
                  visible on one line of the cart and not the next. A fixed
                  size on the img alone doesn't save it; the button and this
                  wrapper are what the browser was shrinking. */}
              <div className="hidden shrink-0 items-center gap-[35px] lg:flex">
                <p className="whitespace-nowrap font-parkinsans text-[24px] text-cocoa">
                  {quoteLineTotals.get(`${line.id}:${line.variationId ?? 0}`) || PENDING}
                </p>
                <button
                  type="button"
                  aria-label={`Remove ${line.name} from cart`}
                  onClick={() => cart.remove(line.id, line.options)}
                  className="shrink-0 cursor-pointer"
                >
                  <img src={iconBin} alt="" className="size-[30px] shrink-0" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
