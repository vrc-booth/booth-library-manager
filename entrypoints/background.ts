import { browser } from "wxt/browser";
import {
  fetchRemoteParserRulesText,
  isFetchParserRulesMessage,
  type ParserRulesResponse,
} from "../utils/remoteParserRules.ts";

// BOOTH 페이지의 CSP(connect-src)를 피하려고 원격 규칙은 백그라운드에서 받는다.
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isFetchParserRulesMessage(message)) {
      return false;
    }

    fetchRemoteParserRulesText()
      .then((body) => {
        const response: ParserRulesResponse = { ok: true, body };
        sendResponse(response);
      })
      .catch((error: unknown) => {
        const response: ParserRulesResponse = {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
        sendResponse(response);
      });

    return true;
  });
});
