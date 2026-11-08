import { formatExternalRefs, isExternal } from "@/shared/addresses/external";
import { formatRefs } from "@/shared/addresses/refs";
// References of a parallel can point both into the library and into the texts of other religions.

export const isOutside = (address: string) => isExternal(address.split(".")[0]);

// Islamic references first, then the others, each in their usual form.
export function formatAnyRefs(addresses: string[]) {
  return [formatRefs(addresses.filter((a) => !isOutside(a))), formatExternalRefs(addresses.filter(isOutside))]
    .filter(Boolean)
    .join(", ");
}
