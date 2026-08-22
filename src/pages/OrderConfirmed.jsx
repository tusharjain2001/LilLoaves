import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

export default function OrderConfirmed() {
  const [params] = useSearchParams()
  const orderNumber = params.get('order')
  const cart = useCart()

  // The handoff already emptied WooCommerce's own session cart (see
  // ll_handoff() step 6) - but that's server-side state the customer never
  // sees again. The cart the customer *does* see is this React app's own
  // localStorage copy, and nothing ever told it the order went through.
  // Landing here only happens after a real paid order (WordPress redirects
  // here itself), so clearing unconditionally is safe - never on a stray
  // /order-confirmed visit with no ?order=, which never reaches WooCommerce.
  useEffect(() => {
    if (orderNumber) cart.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber])

  return (
    <main className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-[24px] bg-cream px-[24px] py-[80px]">
      <p className="font-ligema text-[24px] uppercase text-cocoa lg:text-[32px]">Thank you!</p>
      <p className="text-center font-parkinsans text-[16px] text-clay lg:text-[20px]">
        Your order is confirmed. We&rsquo;ve sent your confirmation by email.
      </p>
      {orderNumber && (
        <p className="font-parkinsans text-[17px] font-semibold text-cocoa">Order #: {orderNumber}</p>
      )}
      <Link
        to="/menu"
        className="cursor-pointer rounded-full bg-cocoa px-[32px] py-[10px] font-parkinsans text-[16px] text-white"
      >
        Back to the menu
      </Link>
    </main>
  )
}
