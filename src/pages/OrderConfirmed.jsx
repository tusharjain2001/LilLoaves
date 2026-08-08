import { Link, useSearchParams } from 'react-router-dom'

export default function OrderConfirmed() {
  const [params] = useSearchParams()
  const orderNumber = params.get('order')

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
