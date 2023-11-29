import { Post } from "../domain/Post";
import sharp from "sharp";
import { getWeiboId } from "./getWeiboId";
import { FetchWeibo } from "./fetchWeibo";
import { createFetchWeiboImage } from "./fetchWeiboImage";

export const fetchWeiboPosts = async (
  fetchWeibo: FetchWeibo,
  url: string,
  after: number,
): Promise<Post[]> => {
  const fetchWeiboImage = createFetchWeiboImage(fetchWeibo);
  const id = getWeiboId(url);
  const blogResponse = await fetchWeibo(
    `https://weibo.com/ajax/statuses/mymblog?uid=${id}&page=1&feature=0`,
  );
  const json = await blogResponse.json();
  const posts: Post[] = [];
  for (const entry of (json.data.list as any[]).filter((entry) => {
    const timestamp = new Date(entry.created_at).getTime();
    return timestamp > after;
  })) {
    const userImageBuffer = await fetchWeiboImage(entry.user.profile_image_url);
    const userImage = sharp(userImageBuffer);
    const { dominant: c } = await userImage.stats();
    const images: Buffer[] = [];
    if (entry.pic_infos) {
      for (const pic of Object.values(entry.pic_infos)) {
        try {
          const imageData = await fetchWeiboImage((pic as any).large.url);
          images.push(imageData);
        } catch (e) {
          console.error("Failed to retrieve image");
          console.error(e);
        }
      }
    }
    let text = entry.text_raw;
    if (entry.isLongText) {
      try {
        const longTextResponse = await fetchWeibo(
          `https://weibo.com/ajax/statuses/longtext?id=${entry.mblogid}`,
        );
        const longTextData = await longTextResponse.json();
        text = longTextData.data.longTextContent;
      } catch (e) {
        console.error("Failed to retrieve post longtext");
        console.error(e);
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
      text,
      images,
    });
  }
  return posts;
};
