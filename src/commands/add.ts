import { loadConfig } from "../utils/loadConfig";
import { Options } from "../domain/Options";
import { fetchWeiboUser } from "../utils/fetchWeiboUser";
import { getWeiboId } from "../utils/getWeiboId";
import { writeConfig } from "../utils/writeConfig";
import { createFetchWeibo } from "../utils/fetchWeibo";

export const add = async (
  url: string,
  options: Options & { url: string; alias?: string },
) => {
  const config = loadConfig(options.verbose);
  const fetchWeibo = await createFetchWeibo(config);

  const id = getWeiboId(url);

  for (const blog of config.blogs) {
    const blogId = getWeiboId(blog.url);
    if (blogId === id) {
      console.error("Skipped adding this blog, urls is already in the config");
      return;
    }
  }

  const json = await fetchWeiboUser(fetchWeibo, id);

  config.blogs.push({
    name: json.data.user.screen_name,
    url,
    alias: options.alias,
  });

  writeConfig(config);
};
