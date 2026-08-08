import { Outlet, Route, Routes } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Menu from "./pages/Menu.jsx";
import Product from "./pages/Product.jsx";
import Cart from "./pages/Cart.jsx";
import Pickup from "./pages/Pickup.jsx";
import Gallery from "./pages/Gallery.jsx";
import Contact from "./pages/Contact.jsx";
import OrderConfirmed from "./pages/OrderConfirmed.jsx";
import EmailPickup from "./pages/EmailPickup.jsx";

function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/pickup" element={<Pickup />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/order-confirmed" element={<OrderConfirmed />} />
        </Route>
        <Route path="/email-pickup" element={<EmailPickup />} />
      </Routes>
    </CartProvider>
  );
}
