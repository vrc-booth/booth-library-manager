import { browser } from "wxt/browser";
import { enqueueDownloads, getDownloadFilesUrls, type DownloadFilesResponse } from "../utils/downloads.ts";
import {
  fetchRemoteParserRulesText,
  isFetchParserRulesMessage,
  type ParserRulesResponse,
} from "../utils/remoteParserRules.ts";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // BOOTH 페이지의 CSP(connect-src)를 피하려고 원격 규칙은 백그라운드에서 받는다.
    if (isFetchParserRulesMessage(message)) {
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
    }

    const downloadUrls = getDownloadFilesUrls(message);
    if (downloadUrls) {
      const response: DownloadFilesResponse = { ok: true, queued: enqueueDownloads(downloadUrls) };
      sendResponse(response);
      // 응답을 보낸 메시지는 true를 돌려줘야 응답을 받는 브라우저 구현도 있어 맞춰 둔다.
      return true;
    }

    return false;
  });
});
