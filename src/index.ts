import { loadConfig } from "./utils/loadConfig";
import { fetchWeibo } from "./utils/fetchWeibo";
import { sendDiscordWebhooks } from "./utils/sendDiscordWebhooks";
import { Config } from "./domain/Config";
import { translatePosts } from "./utils/translatePost";

const latestRefresh: Record<string, number> = {};

const refresh = async (weiboUrl: string, config: Config) => {
  console.log("Refreshing", weiboUrl);

  const after = latestRefresh[weiboUrl];
  latestRefresh[weiboUrl] = new Date().getTime();
  const posts = await fetchWeibo(weiboUrl, after);
  if (posts.length === 0) return;
  await translatePosts(posts, config.deeplApiKey);
  for (const webhookUrl of config.webhookUrls) {
    await sendDiscordWebhooks(posts, webhookUrl);
  }
};

const main = async () => {
  const config = loadConfig();

  console.log(config);

  const now = new Date().getTime();
  for (let i = 0; i < config.weiboUrls.length; i++) {
    const url = config.weiboUrls[i];
    latestRefresh[url] = now;
    const delay = (config.refreshDelay / config.weiboUrls.length) * i;
    setTimeout(() => {
      refresh(url, config);
      setInterval(() => {
        refresh(url, config);
      }, config.refreshDelay);
    }, delay);
  }
};

void main();
