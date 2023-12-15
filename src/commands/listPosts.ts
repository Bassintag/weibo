import { Options } from "../domain/Options";
import { loadConfig } from "../utils/loadConfig";
import { fetchWeiboPosts } from "../utils/fetchWeiboPosts";
import { translatePosts } from "../utils/translatePost";
import { createFetchWeibo } from "../utils/fetchWeibo";
import chalk from "chalk";
import { sendDiscordWebhooks } from "../utils/sendDiscordWebhooks";

export const listPosts = async (
  id: number,
  options: Options & { webhook: boolean; after?: number },
) => {
  if (isNaN(id) || id < 0) throw new Error("Invalid id");
  const config = loadConfig(options.verbose);
  const blog = config.blogs[id];
  if (blog == null) throw new Error("Invalid id");
  const fetchWeibo = await createFetchWeibo(config, options);
  const posts = await fetchWeiboPosts(fetchWeibo, blog.url, options.after ?? 0);
  if (posts.length === 0) return;
  await translatePosts(posts, config.deeplApiKey);

  for (const post of posts) {
    console.log("Post:", chalk.bold(`#${post.id}`));
    console.log(chalk.yellow(post.text));
    console.log(chalk.dim(`(Images: ${post.images.length})`, "\n"));
  }

  if (options.webhook) {
    for (const webhookUrl of config.webhooks) {
      await sendDiscordWebhooks(posts, webhookUrl);
    }
  }
};
