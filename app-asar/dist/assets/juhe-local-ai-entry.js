import { j as defineComponent, k as h, r as ref, d as onMounted, b as onBeforeUnmount } from "./vendor-DHo7BzsC.js";
import { i as ipc } from "./index-Ct5UuHQN.js";

// Old server record IDs are intentionally excluded from local knowledge drafts.
export function localAiEntry(windowName, closeChannel) {
  return defineComponent({
    name: `LocalAiEntry${windowName}`,
    setup() {
      const ready = ref(false);
      const error = ref("");
      const hasDraft = ref(false);
      let payload = {};
      const receiveData = (raw) => {
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!data) return;
        const form = typeof data.form === "string" ? JSON.parse(data.form) : data.form;
        const shop = data.shop || form?.shop || form;
        if (shop?.id != null) payload.shopId = shop.id;
        if (data.editForm) {
          const record = data.editForm;
          payload.record = {
            title: record.title || "",
            content: record.content || "",
            scenarios: record.scenarios,
            sendType: record.sendType,
            titleType: record.titleType,
            imageurls: record.imageurls,
            goodId: record.goodId || record.productId,
          };
          hasDraft.value = true;
        }
      };
      const onAfterSales = (_event, data) => {
        try { receiveData(data); }
        catch (cause) { error.value = `读取店铺资料失败：${cause?.message || "请重试"}`; }
      };
      ipc.on("set-shop-after-sales-rules", onAfterSales);
      onBeforeUnmount(() => ipc.removeListener("set-shop-after-sales-rules", onAfterSales));
      onMounted(async () => {
        try {
          const result = await ipc.invoke("tool-window-ready", windowName);
          receiveData(result?.data);
        } catch (cause) {
          error.value = `读取旧窗口资料失败，请在本地AI设置中选择店铺：${cause?.message || "请重试"}`;
        } finally {
          ready.value = true;
        }
      });
      const open = () => {
        ipc.send("open-local-ai-settings", payload);
        ipc.postMessage(closeChannel, false);
      };
      return () => h("main", { style: "max-width:600px;margin:48px auto;padding:24px;color:#24314d;font:15px/1.8 sans-serif" }, [
        h("h2", "本地AI设置"),
        h("p", hasDraft.value
          ? "这条资料来自旧版知识列表。可以带入本地AI设置，检查后保存为新条目；旧版编号不会覆盖本地知识。"
          : "基础问答和知识管理已移至本地AI设置。可在其中选择店铺、编辑知识并保存回复规则。"),
        h("p", { style: "color:#64748b" }, "模型连接后自动回复才会生效。"),
        error.value ? h("p", { role: "alert", style: "color:#b42318" }, error.value) : null,
        h("button", { type: "button", disabled: !ready.value, onClick: open, style: "padding:10px 18px;border:0;border-radius:6px;background:#416ee0;color:white;cursor:pointer" }, "打开本地AI设置"),
        h("button", { type: "button", onClick: () => ipc.postMessage(closeChannel, false), style: "margin-left:12px;padding:10px 18px" }, "关闭"),
      ]);
    },
  });
}
