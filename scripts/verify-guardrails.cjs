const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const files = {
  main: "app-asar/dist-electron/main.js",
  message: "app-asar/dist/assets/index-Dk3-oFCm.js",
  messageCss: "app-asar/dist/assets/index-DhfomVSO.css",
  todo: "app-asar/dist/assets/index-CBgyFkVF.js",
  todoCss: "app-asar/dist/assets/index-CrXcuUdk.css",
  appMain: "app-asar/dist/assets/index-CGzMkKvq.js",
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
runNodeCheck(files.appMain);
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
ok("main animates todo collapse bounds", has(sources.main, "animateTodoListBounds") && has(sources.main, "todoListBoundsAnimationTimer"));
ok("main keeps todo floating move IPC", has(sources.main, '"move-todo-floating-window"'));
ok("main hides instead of closing prompt windows", has(sources.main, "setPromptWindowVisible"));
ok("main has popup listen-test logs", has(sources.main, "[listen-test][popup-toggle]"));
ok("main has todo listen-test logs", has(sources.main, "[listen-test][todo-collapse]"));
ok("main has message resize listen-test logs", has(sources.main, "[listen-test][message-resize]"));
ok("main has unified runtime log file", has(sources.main, "khai-runtime") && has(sources.main, "KHAI_RUNTIME_LOG_DATE"));
ok("main has runtime log IPC", has(sources.main, '"khai-runtime-log"') && has(sources.main, "khaiWriteRuntimeLog"));
ok("main masks sensitive runtime log fields", has(sources.main, "KHAI_RUNTIME_SECRET_RE") && has(sources.main, "[redacted]"));
ok("main forwards renderer listen-test logs", has(sources.main, "forwarded-log") && has(sources.main, "[listen-test]"));
ok("main logs account and shop persistence", has(sources.main, 'event: "save-login-data"') && has(sources.main, 'event: "save-shop-data"') && has(sources.main, "khaiRuntimeShopCount"));
ok("main logs popup and todo runtime actions", has(sources.main, 'event: "toggle-message-window"') && has(sources.main, 'event: "collapse"') && has(sources.main, 'event: "move-floating-window"'));
ok("main keeps todo window right-anchored", has(sources.main, "s.x + s.width") && has(sources.main, "d - r"));
ok("main creates todo floating ball near right edge", has(sources.main, "t.x + t.width - r - 24"));
ok("main registers popup debug shortcut", has(sources.main, "CommandOrControl+Shift+Home"));
ok("main can toggle popup debug mode", has(sources.main, "togglePopupDebugMode"));
ok("main keeps popup debug local samples", has(sources.main, "getPopupDebugSamples") && has(sources.main, "调试测试店铺"));
ok("main popup debug shows every popup", has(sources.main, "showPopupDebugMode") && has(sources.main, "add-ai-missed-message") && has(sources.main, "add-ai-error-message") && has(sources.main, "get-customer-message"));
ok("main popup debug hides prompt windows", has(sources.main, "hidePopupDebugMode") && has(sources.main, "[popup-debug] hide all prompt windows"));

ok("message popup registers itself", has(sources.message, 'D.send("register-message-window")'));
ok("message popup keeps auto show/hide IPC", has(sources.message, '"toggle-message-window"'));
ok("message popup has resize handle", has(sources.message, "khai-message-window-resize-handle"));
ok("message popup keeps resize command", has(sources.message, '"resize-message-window"'));
ok("message popup keeps clear/remove AI replied channels", has(sources.message, "clear-ai-replied-message"));
ok("message popup has right-click clear action", has(sources.message, "清理当前信息") && has(sources.message, "onContextmenu"));
ok("message popup has one-click clear action", has(sources.message, "一键清理全部") && has(sources.message, "clear-all"));
ok("message popup clear syncs AI replied messages", has(sources.message, "sync-ai-replied-message-clear"));

ok("todo popup registers itself", has(sources.todo, 'x.send("register-todo-list-window")'));
ok("todo popup receives todo list", has(sources.todo, '"get-todo-list"'));
ok("todo popup can open todo item", has(sources.todo, '"open-todo-list"'));
ok("todo popup toggles visibility", has(sources.todo, '"toggle-message-window"'));
ok("todo floating ball has mouse drag handler", has(sources.todo, "onMousedown: W"));
ok("todo floating ball has click expand handler", has(sources.todo, "onClick: se"));
ok("todo floating ball sends move IPC", has(sources.todo, '"move-todo-floating-window"'));
ok("todo floating drag batches moves with animation frame", has(sources.todo, "requestAnimationFrame(oe)"));
ok("todo floating drag has active drag class", has(sources.todo, "is-dragging") && has(sources.todoCss, ".container.is-dragging .todo-floating-ball"));
ok("todo collapse button exists", has(sources.todo, "todo-collapse-btn"));
ok("todo floating CSS exists", has(sources.todoCss, ".todo-floating-ball"));
ok("todo panel has expanded and collapsed states", has(sources.todo, "is-collapsed") && has(sources.todo, "is-expanded"));
ok("todo syncs expanded and collapsed classes", has(sources.todo, "classList.toggle(\"is-expanded\""));
ok("todo expanded panel is solid white", has(sources.todoCss, ".container.is-expanded") && has(sources.todoCss, "background: #ffffff"));
ok("todo panel has soft open animation", has(sources.todoCss, "todoPanelSoftIn") && has(sources.todoCss, "todoBallSoftIn"));
ok(
  "todo floating ball shadows are removed",
  hasRe(sources.todoCss, /\.container \.todo-floating-ball \{[\s\S]*?box-shadow: none;/) &&
    hasRe(sources.todoCss, /\.container\.is-dragging \.todo-floating-ball \{[\s\S]*?box-shadow: none;/) &&
    hasRe(sources.todoCss, /\.container \.todo-floating-ball:hover \{[\s\S]*?box-shadow: none;/),
);
ok("todo expanded panel hides floating ball", has(sources.todoCss, ".container.is-expanded .todo-floating-ball") && has(sources.todoCss, "display: none !important"));
ok("todo collapsed panel hides expanded content", has(sources.todoCss, ".container.is-collapsed .header") && has(sources.todoCss, ".container.is-collapsed .n-scrollbar"));
ok("todo floating ball uses work order icon", has(sources.todoCss, "todo-work-order-icon.png"));
ok("todo work order icon asset exists", fs.existsSync(path.join(root, "app-asar/dist/assets/todo-work-order-icon.png")));

ok("shop cards receive stable ids", has(sources.shop, "id: `shop-${e.id}`"));
ok("shop drag initializes on mount", has(sources.shop, "KhaiShopInitDragSort()"));
ok("shop drag cleans up on unmount", has(sources.shop, "KhaiShopDestroyDragSort()"));
ok("shop drag uses pointer down on cards", has(sources.shop, "onPointerdown: KhaiShopOnPointerDown"));
ok("shop drag uses document pointer move", has(sources.shop, 'document.addEventListener("pointermove", KhaiShopOnPointerMove'));
ok("shop drag uses document pointer up", has(sources.shop, 'document.addEventListener("pointerup", KhaiShopOnPointerUp'));
ok("shop drag handles pointer cancel", has(sources.shop, 'document.addEventListener("pointercancel", KhaiShopClearDragState'));
ok("shop drag computes insert index", has(sources.shop, "KhaiShopGetInsertIndex"));
ok("shop drag saves cache after reorder", has(sources.shop, "saveShopDataToCache"));
ok("shop drag has listen-test logs", has(sources.shop, "[listen-test][shop-drag-sort]"));
ok("shop drag batches pointer moves with animation frame", has(sources.shop, "requestAnimationFrame(KhaiShopRunDragFrame)"));
ok("shop drag uses GPU translate", has(sources.shop, "translate3d(0,"));
ok("shop drag disables transitions while active", has(sources.shop, "khai-shop-drag-active"));
ok("shop drag disables native draggable", has(sources.shop, "e.draggable = !1") && has(sources.shop, "img{-webkit-user-drag:none"));
ok("shop drag has no native drag/drop handlers", !has(sources.shop, "KhaiShopOnDragStart") && !has(sources.shop, "KhaiShopOnDragOver") && !has(sources.shop, "KhaiShopOnDrop"));
ok("shop drag has no document mouse/drag sorting listeners", !has(sources.shop, 'document.addEventListener("mousedown", KhaiShopOnMouseDown') && !has(sources.shop, 'document.addEventListener("dragstart", KhaiShop'));
ok("shop drag throttles mutation reapply", has(sources.shop, "KhaiShopScheduleApplyDragAttrs") && has(sources.shop, "MutationObserver(KhaiShopScheduleApplyDragAttrs)"));
ok("app main shop cards receive stable ids", has(sources.appMain, "id: `shop-${e.id}`"));
ok("app main shop drag initializes", has(sources.appMain, "KhaiMainShopInitDragSort()"));
ok("app main shop drag cleans up on unmount", has(sources.appMain, "KhaiMainShopDestroyDragSort()") && has(sources.appMain, "KhaiMainShopDestroyDragSort();"));
ok("app main shop drag uses pointer down on cards", has(sources.appMain, "onPointerdown:\n                                                                                KhaiMainShopOnPointerDown") || has(sources.appMain, "onPointerdown:\r\n                                                                                KhaiMainShopOnPointerDown"));
ok("app main shop drag uses document pointer move", has(sources.appMain, 'document.addEventListener("pointermove", KhaiMainShopOnPointerMove'));
ok("app main shop drag uses document pointer up", has(sources.appMain, 'document.addEventListener("pointerup", KhaiMainShopOnPointerUp'));
ok("app main shop drag handles pointer cancel", has(sources.appMain, 'document.addEventListener("pointercancel", KhaiMainShopClearDragState'));
ok("app main shop drag saves cache after reorder", has(sources.appMain, "saveShopDataToCache"));
ok("app main shop drag has listen-test logs", has(sources.appMain, "[listen-test][shop-drag-sort]"));
ok("app main shop drag batches pointer moves with animation frame", has(sources.appMain, "requestAnimationFrame(KhaiMainShopRunDragFrame)"));
ok("app main shop drag uses GPU translate", has(sources.appMain, "translate3d(0,"));
ok("app main shop drag disables transitions while active", has(sources.appMain, "khai-main-shop-drag-active"));
ok("app main shop drag disables native draggable", has(sources.appMain, "e.draggable = !1") && has(sources.appMain, "img{-webkit-user-drag:none"));
ok("app main shop drag has no native drag/drop handlers", !has(sources.appMain, "KhaiMainShopOnDragStart") && !has(sources.appMain, "KhaiMainShopOnDragOver") && !has(sources.appMain, "KhaiMainShopOnDrop"));
ok("app main shop drag has no document mouse/drag sorting listeners", !has(sources.appMain, 'document.addEventListener("mousedown", KhaiMainShopOnMouseDown') && !has(sources.appMain, 'document.addEventListener("dragstart", KhaiMainShop'));
ok("app main shop avatar can start drag", !has(sources.appMain, 'closest("button,input,textarea,select,a,.n-switch,.n-button,.n-dropdown,.shop-logo-clickable")'));

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
