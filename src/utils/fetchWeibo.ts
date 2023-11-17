import { Cookie, CookieJar } from "tough-cookie";
import { Post } from "../domain/Post";
import sharp from "sharp";

const jar = new CookieJar();

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

let bypassPromise: Promise<boolean> | undefined;

const bypassWeiboPassport = async (response: Response): Promise<boolean> => {
  const locationHeader = response.headers.get("location");
  if (!locationHeader) return false;
  if (bypassPromise != null) {
    return bypassPromise;
  }
  try {
    await appFetch(locationHeader);
    // Call genvisitor
    const formData = new FormData();
    formData.set("cb", "gen_callback");
    formData.set("fp", defaultFp);
    const genVisitorResponse = await appFetch(
      "https://passport.weibo.com/visitor/genvisitor",
      {
        method: "POST",
        headers: { Referer: locationHeader },
        body: formData,
      },
    );
    const genVisitorParsed = await parsePassportResponse(genVisitorResponse);

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
    const incarnateResponse = await appFetch(url.toString());
    await parsePassportResponse(incarnateResponse);
    return true;
  } finally {
    bypassPromise = undefined;
  }
};

interface AppRequestInit extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

const appFetch = async (
  url: string,
  init: AppRequestInit = {},
): Promise<Response> => {
  const cookieString = await jar.getCookieString(url);

  console.log(">>", url);

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

  if (await bypassWeiboPassport(response)) {
    return appFetch(url, init);
  }

  return response;
};

const fetchWeiboImage = async (
  url: string,
  imageCache: Record<string, Promise<Buffer>>,
) => {
  if (!(url in imageCache)) {
    imageCache[url] = new Promise<Buffer>(async (r) => {
      const response = await appFetch(url, {
        headers: { Referer: "https://weibo.com" },
      });
      let image = sharp(await response.arrayBuffer());
      const buffer = await image.webp().toBuffer();
      r(buffer);
    });
  }
  return imageCache[url];
};

export const fetchWeibo = async (
  url: string,
  after: number,
): Promise<Post[]> => {
  const match = url.match(/\/u\/(\d+)/);
  if (match == null) throw new Error("Failed to parse blog id");
  const id = match[1];
  const blogResponse = await appFetch(
    `https://weibo.com/ajax/statuses/mymblog?uid=${id}&page=1&feature=0`,
  );
  const json = await blogResponse.json();
  const imageCache: Record<string, Promise<Buffer>> = {};

  const posts: Post[] = [];
  for (const entry of (json.data.list as any[]).filter((entry) => {
    const timestamp = new Date(entry.created_at).getTime();
    return timestamp > after;
  })) {
    const userImageBuffer = await fetchWeiboImage(
      entry.user.profile_image_url,
      imageCache,
    );
    const userImage = sharp(userImageBuffer);
    const { dominant: c } = await userImage.stats();
    const images: Buffer[] = [];
    if (entry.pic_infos) {
      for (const pic of Object.values(entry.pic_infos)) {
        images.push(await fetchWeiboImage((pic as any).large.url, imageCache));
      }
    }
    posts.push({
      id: entry.id,
      timestamp: new Date(entry.created_at).toISOString(),
      author: {
        id: entry.user.id,
        name: entry.user.screen_name,
        image: await userImage.resize(64, 64).toBuffer(),
        color: parseInt(
          `${c.r.toString(16)}${c.g.toString(16)}${c.b.toString(16)}`,
          16,
        ),
      },
      text: entry.text_raw,
      images,
    });
  }
  return posts;
};
