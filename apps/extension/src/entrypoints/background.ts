import { browser, type Browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

import { SIGN_IN_URL } from "@/shared/lib/env";
import { sendText, sendUrl, type SendResult } from "@/shared/lib/send";
import { getUnsendableReason } from "@/shared/lib/urls";

const PAGE_MENU_ID = "bettersent-send-page";
const SELECTION_MENU_ID = "bettersent-send-selection";
const LINK_MENU_ID = "bettersent-send-link";
const SIGNED_OUT_NOTIFICATION = "bettersent-signed-out";

type SendFailure = Extract<SendResult, { ok: false }>;

// info.selectionText collapses newlines into spaces, so prefer reading the
// live selection from the page; the menu click grants activeTab access.
const readSelection = async (tab: Browser.tabs.Tab | undefined): Promise<string | null> => {
  if (tab?.id === undefined) return null;
  try {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() ?? "",
    });
    const text = injection?.result?.trim();
    return text || null;
  } catch {
    return null;
  }
};

const unsendable = (reason: string): SendFailure => ({ ok: false, status: null, message: reason });

const handleClick = async (
  info: Browser.contextMenus.OnClickData,
  tab: Browser.tabs.Tab | undefined,
): Promise<SendResult> => {
  if (info.menuItemId === SELECTION_MENU_ID) {
    const selection = (await readSelection(tab)) ?? info.selectionText?.trim();
    if (!selection) return unsendable("No text is selected.");
    return sendText(selection);
  }

  const url = info.menuItemId === LINK_MENU_ID ? info.linkUrl : (info.pageUrl ?? tab?.url);
  const reason = getUnsendableReason(url);
  if (reason || !url) return unsendable(reason ?? "This page can't be sent to your Kindle.");
  return sendUrl(url);
};

// Silent on success — the send just shows up in history. Notify only on failure.
const notifyFailure = (failure: SendFailure) => {
  const signedOut = failure.status === 401;
  browser.notifications.create(signedOut ? SIGNED_OUT_NOTIFICATION : `bettersent-error-${Date.now()}`, {
    type: "basic",
    iconUrl: browser.runtime.getURL("/icon/128.png"),
    title: "Bettersent",
    message: signedOut ? "You're signed out. Click here to sign in to Bettersent." : failure.message,
  });
};

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    await browser.contextMenus.removeAll();
    // One item per context — Chrome shows only the one matching the click target.
    const documentUrlPatterns = ["http://*/*", "https://*/*"];
    browser.contextMenus.create({
      id: PAGE_MENU_ID,
      title: "Send page to my default device",
      contexts: ["page"],
      documentUrlPatterns,
    });
    browser.contextMenus.create({
      id: SELECTION_MENU_ID,
      title: "Send this text to my default device",
      contexts: ["selection"],
      documentUrlPatterns,
    });
    browser.contextMenus.create({
      id: LINK_MENU_ID,
      title: "Send a link to my default device",
      contexts: ["link"],
      documentUrlPatterns,
      targetUrlPatterns: ["http://*/*", "https://*/*"],
    });
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (
      info.menuItemId !== PAGE_MENU_ID &&
      info.menuItemId !== SELECTION_MENU_ID &&
      info.menuItemId !== LINK_MENU_ID
    ) {
      return;
    }
    const result = await handleClick(info, tab);
    if (!result.ok) notifyFailure(result);
  });

  browser.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === SIGNED_OUT_NOTIFICATION) {
      browser.tabs.create({ url: SIGN_IN_URL });
    }
    browser.notifications.clear(notificationId);
  });
});
