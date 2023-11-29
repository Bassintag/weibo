import { FetchWeibo } from "./fetchWeibo";
import sharp from "sharp";

export const createFetchWeiboImage = (fetchWeibo: FetchWeibo) => {
  const imageCache: Record<string, Promise<Buffer>> = {};
  return async (url: string) => {
    if (!(url in imageCache)) {
      imageCache[url] = new Promise<Buffer>(async (r) => {
        const response = await fetchWeibo(url, {
          headers: { Referer: "https://weibo.com" },
        });
        let image = sharp(await response.arrayBuffer());
        const buffer = await image.webp().toBuffer();
        r(buffer);
      });
    }
    return imageCache[url];
  };
};
