import { fetchWeiboPosts } from "../utils/fetchWeiboPosts";
import { sendDiscordWebhooks } from "../utils/sendDiscordWebhooks";
import { Config } from "../domain/Config";
import { translatePosts } from "../utils/translatePost";
import { loadConfig } from "../utils/loadConfig";
import { Command } from "../domain/Command";
import { createFetchWeibo, FetchWeibo } from "../utils/fetchWeibo";

const latestRefresh: Record<string, number> = {};

const refresh = async (
  fetchWeibo: FetchWeibo,
  weiboUrl: string,
  config: Config,
) => {
  console.log("Refreshing", weiboUrl);

  const after = latestRefresh[weiboUrl];
  latestRefresh[weiboUrl] = new Date().getTime();
  try {
    const posts = await fetchWeiboPosts(fetchWeibo, weiboUrl, after);
    if (posts.length === 0) return;
    await translatePosts(posts, config.deeplApiKey);
    for (const webhookUrl of config.webhooks) {
      await sendDiscordWebhooks(posts, webhookUrl);
    }
  } catch (e) {
    console.error("Refresh failed");
    console.error(e);
  }
};

export const monitor: Command<{ refreshDelay: string }> = async (options) => {
  console.log(
    "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣤⣤⣤⣄⡀⠀⠀⠀\n" +
      "⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⠀⠀⠀⠀⠀⠉⠉⠉⠛⠿⣿⣦⡀⠀\n" +
      "⠀⠀⠀⠀⠀⠀⣠⣴⣾⣿⣿⣿⣷⠀⠀⠀⠀⠰⣿⣷⣶⡄⠈⢿⣿⠀\n" +
      "⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣿⣏⣠⣤⣴⣶⣶⣤⠀⢹⣿⠀⢸⣿⡇\n" +
      "⠀⠀⣠⣾⣿⣿⣿⣿⣿⡿⠿⠿⠿⣿⣿⣿⣿⣿⣿⠁⠘⠋⠀⢸⣿⠃\n" +
      "⠀⣰⣿⣿⡿⠟⠉⠁⠀⠀⠀⠀⠀⠀⠈⠉⠻⣿⣿⣶⣤⡀⠀⠀⠀⠀\n" +
      "⢠⣿⣿⠟⠁⠀⢠⣴⣶⣶⣶⣦⡄⠀⠀⠀⠀⠘⣿⣿⣿⣷⡀⠀⠀⠀\n" +
      "⠸⣿⣿⠀⠀⢰⣿⠛⠛⢿⣿⣿⣿⠀⠀⠀⠀⢀⣿⣿⣿⡿⠁⠀⠀⠀\n" +
      "⠀⠻⣿⣦⡀⠘⢷⣤⣤⣿⣿⡿⠃⠀⠀⠀⣠⣾⣿⣿⡿⠁⠀⠀⠀⠀\n" +
      "⠀⠀⠈⠛⠿⣶⣤⣈⣉⣉⣁⣀⣠⣤⣶⣿⣿⠿⠛⠁⠀⠀⠀⠀⠀⠀\n" +
      "⠀⠀⠀⠀⠀⠀⠉⠉⠛⠛⠛⠛⠛⠛⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀",
  );

  const config = loadConfig(options.verbose);
  const now = new Date().getTime();
  const refreshDelay = parseInt(options.refreshDelay);
  const fetchWeibo = await createFetchWeibo(config);
  for (let i = 0; i < config.blogs.length; i++) {
    const { url } = config.blogs[i];
    latestRefresh[url] = now;
    const delay = (refreshDelay / config.blogs.length) * i;
    setTimeout(() => {
      refresh(fetchWeibo, url, config);
      setInterval(() => {
        refresh(fetchWeibo, url, config);
      }, refreshDelay);
    }, delay);
  }
};
