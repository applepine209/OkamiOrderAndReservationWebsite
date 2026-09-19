async function loadOrderForm() {
  const [items, locations] = await Promise.all([
    fetch('/api/menu').then((r) => r.json()),
    fetch('/api/locations').then((r) => r.json()),
  ]);

  document.getElementById('location').innerHTML = locations
    .map((l) => `<option value="${l.id}">${l.name}</option>`)
    .join('');

  document.getElementById('items').innerHTML = items
    .map((i) => `
      <label class="item-row">
        <span>${i.name} ($${Number(i.price).toFixed(0)})</span>
        <input type="number" min="0" value="0" data-item-id="${i.id}" class="qty">
      </label>`)
    .join('');
}

async function submitOrder(event) {
  event.preventDefault();

  const location_id = document.getElementById('location').value;
  const customer_name = document.getElementById('customer_name').value;
  const items = [...document.querySelectorAll('.qty')]
    .map((el) => ({ menu_item_id: Number(el.dataset.itemId), quantity: Number(el.value) }))
    .filter((i) => i.quantity > 0);

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location_id, customer_name, items }),
  });
  const order = await res.json();

  if (!res.ok) {
    document.getElementById('result').innerHTML = `<p class="note">${order.error}</p>`;
    return;
  }

  document.getElementById('order-form').style.display = 'none';
  document.getElementById('result').innerHTML = `
    <h2>Order #${order.id} placed</h2>
    <p class="lede">${order.customer_name} — ${order.location_name} — ${order.status} — ${order.created_at}</p>
    <ul>${order.items.map((l) => `<li>${l.quantity} × ${l.name}</li>`).join('')}</ul>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadOrderForm();
  document.getElementById('order-form').addEventListener('submit', submitOrder);
});