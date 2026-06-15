function e(e, d) {
  if (!e) return;
  const o = document.createElement("a");
  ((o.href = e),
    void 0 !== d && (o.download = d),
    document.body.appendChild(o),
    o.click(),
    document.body.removeChild(o));
}
export { e as d };
