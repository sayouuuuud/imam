import { permanentRedirect } from "next/navigation"

// `/sermons` was an older English alias that returned the same data as
// `/khutba` — Google was indexing both, which split link equity and
// triggered duplicate-content penalties. 308 forwards everything to the
// canonical Arabic URL so the SEO value consolidates.
export default function SermonsRedirect() {
  permanentRedirect("/khutba")
}
