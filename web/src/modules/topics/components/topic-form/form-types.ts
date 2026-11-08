import type { Messages } from "@/shared/i18n";
import type { TopicInput } from "../../topic.validation";

// What every card of the topic form receives from the form itself.
export type AdminStrings = Messages["admin"];
export type FormStrings = AdminStrings["topicForm"];
export type Choice = { id: number; name: string };
export type Position = TopicInput["positions"][number] & { key: number };
// The error text of a field, if the last save found a problem there.
export type ErrorOf = (field: string) => string | undefined;
export type SetField = <K extends keyof TopicInput>(key: K, value: TopicInput[K]) => void;
