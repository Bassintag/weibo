import { Command } from "../domain/Command";
import { loadConfig } from "../utils/loadConfig";
import { getWeiboId } from "../utils/getWeiboId";
import { fetchWeiboUser } from "../utils/fetchWeiboUser";
import { writeConfig } from "../utils/writeConfig";
import { table } from "table";
import { createFetchWeibo } from "../utils/fetchWeibo";

export const list: Command = async (options) => {
  const config = loadConfig(options.verbose);

  console.log(
    table([
      ["ID", "Name", "Alias", "URL"],
      ...config.blogs.map((blog, i) => [i, blog.name, blog.alias, blog.url]),
    ]),
  );
};
