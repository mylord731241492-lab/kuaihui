export const DEVICE_HEARTBEAT_MS = 90_000;

export function deviceLimitFor(user) {
  return Number.isInteger(user.device_limit) && user.device_limit >= 1 && user.device_limit <= 999 ? user.device_limit : 1;
}
