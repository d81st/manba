// Server side of the Quran module. Import from "@/modules/quran/server".
import "server-only";

export { getMapData } from "./map.queries";
export { getAyahs, searchAddresses, searchText, searchTranslation } from "./search.queries";
export { storyThread } from "./story-thread.queries";
export { getSura, listSuras } from "./sura.queries";
