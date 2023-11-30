import { monitor } from "./commands/monitor";
import { program } from "commander";
import { list } from "./commands/list";
import { add } from "./commands/add";
import { rm } from "./commands/rm";
import { update } from "./commands/update";

const prog = program.name("Node Weibo");

prog
  .command("monitor")
  .action(monitor)
  .option("-v, --verbose")
  .option(
    "-r, --refreshDelay <delay>",
    "Delay between each monitor update",
    "360000",
  );

prog.command("list").action(list).option("-v, --verbose");

prog.command("update").action(update).option("-v, --verbose");

prog
  .command("add")
  .action(add)
  .argument("<url>", "Url of the blog")
  .option("-v, --verbose")
  .option("-a, --alias <alias>", "Set the alias for this blog");

prog
  .command("rm")
  .action(rm)
  .argument("<id>", "ID of the blog to remove", parseInt)
  .option("-v, --verbose");

const main = async () => {
  prog.parse();
};

void main();
