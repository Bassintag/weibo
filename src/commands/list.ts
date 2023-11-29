import { Command } from "../domain/Command";
import { loadConfig } from "../utils/loadConfig";
import { getWeiboId } from "../utils/getWeiboId";
import { fetchWeiboUser } from "../utils/fetchWeiboUser";
import { writeConfig } from "../utils/writeConfig";
import { table } from "table";
import { createFetchWeibo } from "../utils/fetchWeibo";

export const list: Command<{ write: boolean; cache: boolean }> = async (
  options,
) => {
  const config = loadConfig(options.verbose);
  const fetchWeibo = await createFetchWeibo(config);

  const users = await Promise.all(
    config.blogs.map(async ({ url, name }) => {
      if (options.cache && name) return name;
      const id = getWeiboId(url);
      const json = await fetchWeiboUser(fetchWeibo, id);
      return json.data.user.screen_name;
    }),
  );

  console.log(
    table([
      ["ID", "Name", "Alias", "URL"],
      ...users.map((user, i) => {
        const blog = config.blogs[i];
        return [i.toFixed(0), user, blog.alias ?? "", blog.url];
      }),
    ]),
  );

  if (options.write) {
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (options.write) {
        config.blogs[i].name = user;
      }
    }
    writeConfig(config);
  }
};
