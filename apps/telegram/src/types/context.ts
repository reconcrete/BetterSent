import type { Context, SessionFlavor } from "grammy";
import type { ConversationFlavor } from "@grammyjs/conversations";
import type { SessionData } from "./session";

type BaseContext = Context & SessionFlavor<SessionData>;
export type BotContext = ConversationFlavor<BaseContext>;
