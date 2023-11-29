import { Options } from "../domain/Options";
import { loadConfig } from "../utils/loadConfig";
import { writeConfig } from "../utils/writeConfig";

export const rm = (id: number, options: Options) => {
  if (isNaN(id) || id < 0) throw new Error("Invalid id");
  const config = loadConfig(options.verbose);
  if (config.blogs[id] == null) throw new Error("Invalid id");
  config.blogs.splice(id, 1);
  writeConfig(config);
};
