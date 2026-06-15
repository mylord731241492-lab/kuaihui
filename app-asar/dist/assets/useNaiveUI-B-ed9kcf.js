import { b1 as n, cH as t } from "./index-Ct5UuHQN.js";
function e() {
  const e = n(),
    o = t();
  return {
    showMessage: {
      info: (n) => e.info(n),
      success: (n) => e.success(n),
      warning: (n) => e.warning(n),
      error: (n) => e.error(n),
    },
    showNotification: {
      info: (n, t, e = 3e3) => o.info({ title: n, content: t, duration: e }),
      success: (n, t, e = 3e3) => o.success({ title: n, content: t, duration: e }),
      warning: (n, t, e = 3e3) => o.warning({ title: n, content: t, duration: e }),
      error: (n, t, e = 3e3) => o.error({ title: n, content: t, duration: e }),
    },
  };
}
export { e as u };
