const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const files = {
  main: "app-asar/dist-electron/main.js",
  message: "app-asar/dist/assets/index-Dk3-oFCm.js",
  todo: "app-asar/dist/assets/index-CBgyFkVF.js",
  todoCss: "app-asar/dist/assets/index-CrXcuUdk.css",
  shop: "app-asar/dist/assets/index-wFlC9aUK.js",
};

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const sources = Object.fromEntries(Object.entries(files).map(([key, rel]) => [key, read(rel)]));
const failures = [];

function ok(name, condition) {
  if (!condition) failures.push(name);
  console.log(`${condition ? "OK" : "FAIL"} ${name}`);
}

function has(source, text) {
  return source.includes(text);
}

function hasRe(source, pattern) {
  return pattern.test(source);
}

function runNodeCheck(rel) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, rel)], {
    encoding: "utf8",
  });
  ok(`node --check ${rel}`, result.status === 0);
  if (result.status !== 0) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
  }
}

runNodeCheck(files.main);
runNodeCheck(files.message);
runNodeCheck(files.todo);
runNodeCheck(files.shop);

ok("main creates message popup window", has(sources.main, "createMessageWindow("));
ok("main creates todo popup window", has(sources.main, "createTodoListWindow()"));
ok("main creates AI replied popup window", has(sources.main, "createAiRepliedMessageWindow()"));
ok("main creates AI missed popup window", has(sources.main, "createAiMissedMessageWindow()"));
ok("main creates AI error popup window", has(sources.main, "createAiErrorMessageWindow()"));
ok("main keeps popup visibility IPC", has(sources.main, '"toggle-message-window"'));
ok("main supports all-message popup", has(sources.main, 'case "all":'));
ok("main supports todo popup", has(sources.main, 'case "todo":'));
ok("main supports AI replied popup", has(sources.main, 'case "ai":'));
ok("main supports AI missed popup", has(sources.main, 'case "ai-missed":'));
ok("main supports AI error popup", has(sources.main, 'case "ai-error":'));
ok("main keeps message resize IPC", has(sources.main, '"resize-message-window"'));
ok("main keeps todo collapse IPC", has(sources.main, '"todoList-collapse"'));
ok("main keeps todo floating move IPC", has(sources.main, '"move-todo-floating-window"'));
ok("main hides instead of closing prompt windows", has(sources.main, "setPromptWindowVisible"));

ok("message popup registers itself", has(sources.message, 'D.send("register-message-window")'));
ok("message popup keeps auto show/hide IPC", has(sources.message, '"toggle-message-window"'));
ok("message popup has resize handle", has(sources.message, "khai-message-window-resize-handle"));
ok("message popup keeps resize command", has(sources.message, '"resize-message-window"'));
ok("message popup keeps clear/remove AI replied channels", has(sources.message, "clear-ai-replied-message"));

ok("todo popup registers itself", has(sources.todo, 'x.send("register-todo-list-window")'));
ok("todo popup receives todo list", has(sources.todo, '"get-todo-list"'));
ok("todo popup can open todo item", has(sources.todo, '"open-todo-list"'));
ok("todo popup toggles visibility", has(sources.todo, '"toggle-message-window"'));
ok("todo floating ball has mouse drag handler", has(sources.todo, "onMousedown: W"));
ok("todo floating ball has click expand handler", has(sources.todo, "onClick: se"));
ok("todo floating ball sends move IPC", has(sources.todo, '"move-todo-floating-window"'));
ok("todo collapse button exists", has(sources.todo, "todo-collapse-btn"));
ok("todo floating CSS exists", has(sources.todoCss, ".todo-floating-ball"));

ok("shop cards receive stable ids", has(sources.shop, "id: `shop-${e.id}`"));
ok("shop drag initializes on mount", has(sources.shop, "KhaiShopInitDragSort()"));
ok("shop drag cleans up on unmount", has(sources.shop, "KhaiShopDestroyDragSort()"));
ok("shop drag uses mouse down", has(sources.shop, "KhaiShopOnMouseDown"));
ok("shop drag uses mouse move", has(sources.shop, "KhaiShopOnMouseMove"));
ok("shop drag uses mouse up", has(sources.shop, "KhaiShopOnMouseUp"));
ok("shop drag computes insert index", has(sources.shop, "KhaiShopGetInsertIndex"));
ok("shop drag saves cache after reorder", has(sources.shop, "saveShopDataToCache"));

function moveToIndex(input, id, index) {
  const list = input.slice();
  const from = list.findIndex((item) => item === id);
  if (from < 0 || index == null) return list;
  let to = Math.max(0, Math.min(Number(index), list.length));
  if (from < to) to -= 1;
  if (from === to) return list;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  return list;
}

ok("drag sort moves first card below second", moveToIndex(["A", "B"], "A", 2).join(",") === "B,A");
ok("drag sort moves second card above first", moveToIndex(["A", "B"], "B", 0).join(",") === "B,A");
ok("drag sort moves first card to end", moveToIndex(["A", "B", "C"], "A", 3).join(",") === "B,C,A");
ok("drag sort moves last card to start", moveToIndex(["A", "B", "C"], "C", 0).join(",") === "C,A,B");

const secretPattern =
  /(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|ghp_[0-9A-Za-z_]{36}|github_pat_[0-9A-Za-z_]+|sk-[A-Za-z0-9]{20,}|xox[baprs]-[0-9A-Za-z-]+)/;
for (const [key, source] of Object.entries(sources)) {
  ok(`no obvious token pattern in ${key}`, !secretPattern.test(source));
}

if (failures.length) {
  console.error(`\nGuardrail verification failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("\nGuardrail verification passed.");
