import { Command } from "../domain/Command";
import { loadConfig } from "../utils/loadConfig";
import { createFetchWeibo } from "../utils/fetchWeibo";
import { getWeiboId } from "../utils/getWeiboId";
import { fetchWeiboUser } from "../utils/fetchWeiboUser";
import { writeConfig } from "../utils/writeConfig";

export const update: Command = async (options) => {
  const config = loadConfig(options.verbose);
  const fetchWeibo = await createFetchWeibo(config, options);

  const users = await Promise.all(
    config.blogs.map(async ({ url }) => {
      const id = getWeiboId(url);
      const json = await fetchWeiboUser(fetchWeibo, id);
      return json.data.user.screen_name;
    }),
  );

  for (let i = 0; i < users.length; i++) {
    config.blogs[i].name = users[i];
  }

  writeConfig(config);
};
