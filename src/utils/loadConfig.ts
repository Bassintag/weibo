import { Config } from "../domain/Config";
import dotenv from "dotenv";

const parseStringArray = (key: string): string[] => {
  const value = process.env[key];
  if (value == null || value.length == 0) return [];
  return value.split(",");
};

export const loadConfig = (): Config => {
  dotenv.config();

  return {
    webhookUrls: parseStringArray("WEBHOOK_URLS"),
    weiboUrls: parseStringArray("WEIBO_URLS"),
    deeplApiKey: process.env.DEEPL_API_KEY as string,
    refreshDelay: parseInt(process.env.REFRESH_DELAY as string),
  };
};
