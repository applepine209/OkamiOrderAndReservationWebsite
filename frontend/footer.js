(async function () {
  const els = document.querySelectorAll('.instance-id-value');
  if (!els.length) return;
  try {
    const res = await fetch('/api/instance-id');
    const { instanceId } = await res.json();
    els.forEach((el) => { el.textContent = instanceId; });
  } catch (err) {
    els.forEach((el) => { el.textContent = 'unavailable'; });
  }
})();