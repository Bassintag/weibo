import { Options } from "./Options";

export interface Command<
  OptionT extends Record<string, string | boolean> = Record<never, never>,
> {
  (options: OptionT & Options): Promise<void> | void;
}
