// No product in the live store has an image yet, so this is the path that
// executes on every page today. One shared placeholder, reused everywhere a
// product image slot would otherwise render broken (`<img src="">`) or bare
// alt text in a fixed-size slot, rather than each call site picking its own.
import placeholder from '../assets/menu/special-danish.jpg'

export default placeholder
