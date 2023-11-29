import { Config } from "../domain/Config";
import * as fs from "fs";

export const writeConfig = (config: Config) => {
  fs.writeFileSync("config.json", JSON.stringify(config, undefined, 2));
};
