import { Config } from "../domain/Config";
import * as fs from "fs";

export const loadConfig = (verbose: boolean = false): Config => {
  let configData: string;
  try {
    configData = fs.readFileSync("config.json", "utf-8");
  } catch (e) {
    console.error("Failed to open config file");
    throw e;
  }

  const config = JSON.parse(configData) as Config;

  if (verbose) {
    console.log(config);
  }

  return config;
};
