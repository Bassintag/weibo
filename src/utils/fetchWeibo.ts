import { Cookie, CookieJar } from "tough-cookie";
import { Config } from "../domain/Config";
import { writeConfig } from "./writeConfig";
import { Options } from "../domain/Options";

const defaultFp =
  '{"os":"3","browser":"Gecko109,0,0,0","fonts":"undefined","screenInfo":"1920*1080*24","plugins":"Portable Document Format::internal-pdf-viewer::PDF Viewer|Portable Document Format::internal-pdf-viewer::Chrome PDF Viewer|Portable Document Format::internal-pdf-viewer::Chromium PDF Viewer|Portable Document Format::internal-pdf-viewer::Microsoft Edge PDF Viewer|Portable Document Format::internal-pdf-viewer::WebKit built-in PDF"}';

const parsePassportResponse = async (response: Response) => {
  const match = /\((.*)\);$/.exec(await response.text());
  if (!match) {
    throw new Error("Failed to parse genvisitor response");
  }
  const parsed = JSON.parse(match[1]);
  if (parsed.msg !== "succ") {
    throw new Error("genvisitor call failed");
  }
  return parsed;
};

interface AppRequestInit extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

export interface FetchWeibo {
  (url: string, init?: AppRequestInit): Promise<Response>;
}

export const createFetchWeibo = async (
  config: Config,
  { verbose }: Options,
): Promise<FetchWeibo> => {
  const jar = new CookieJar();

  if (config.cookies) {
    for (const setCookie of config.cookies) {
      const parsed = Cookie.parse(setCookie);
      if (parsed == null) continue;
      await jar.setCookie(parsed, "https://weibo.com/");
    }
  }

  const fetchWeibo = async (
    url: string,
    init: AppRequestInit = {},
  ): Promise<Response> => {
    const cookieString = await jar.getCookieString(url);

    if (verbose) {
      console.log(">>", url);
    }

    init.keepalive = true;

    if (init.headers == null) {
      init.headers = { Cookie: cookieString };
    } else {
      init.headers["Cookie"] = cookieString;
    }

    const response = await fetch(url, { ...init, redirect: "manual" });

    const setCookies = response.headers.getSetCookie();
    for (const setCookie of setCookies) {
      const parsed = Cookie.parse(setCookie);
      if (parsed == null) continue;
      await jar.setCookie(parsed, url);
    }
    if (setCookies.length > 0 && url.startsWith("https://weibo.com/")) {
      config.cookies = await jar.getSetCookieStrings("https://weibo.com/");
      writeConfig(config);
    }

    if (await bypassWeiboPassport(response)) {
      return fetchWeibo(url, init);
    }

    return response;
  };

  let bypassPromise: Promise<boolean> | undefined;

  const bypassWeiboPassport = async (response: Response): Promise<boolean> => {
    const locationHeader = response.headers.get("location");
    if (!locationHeader) return false;
    if (bypassPromise != null) {
      return bypassPromise;
    }
    try {
      bypassPromise = new Promise(async (resolve) => {
        await fetchWeibo(locationHeader);
        // Call genvisitor
        const formData = new FormData();
        formData.set("cb", "gen_callback");
        formData.set("fp", defaultFp);
        const genVisitorResponse = await fetchWeibo(
          "https://passport.weibo.com/visitor/genvisitor",
          {
            method: "POST",
            headers: { Referer: locationHeader },
            body: formData,
          },
        );
        const genVisitorParsed =
          await parsePassportResponse(genVisitorResponse);

        // incarnate visitor
        const url = new URL("https://passport.weibo.com/visitor/visitor");
        url.searchParams.set("a", "incarnate");
        url.searchParams.set("t", genVisitorParsed.data.tid);
        url.searchParams.set("w", "2");
        url.searchParams.set("c", "090");
        url.searchParams.set("gc", "");
        url.searchParams.set("cb", "cross_domain");
        url.searchParams.set("from", "weibo");
        url.searchParams.set("_rand", Math.random().toString());
        const incarnateResponse = await fetchWeibo(url.toString());
        await parsePassportResponse(incarnateResponse);
        resolve(true);
      });
      return await bypassPromise;
    } finally {
      bypassPromise = undefined;
    }
  };

  return fetchWeibo;
};
