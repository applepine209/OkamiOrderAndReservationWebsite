let menuItems = [];

function itemOptions() {
  return menuItems
    .map((i) => `<option value="${i.id}">${i.name} ($${Number(i.price).toFixed(0)})</option>`)
    .join('');
}

function addItemRow() {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <select class="item-select">${itemOptions()}</select>
    <input type="number" class="item-qty" min="1" value="1">
    <button type="button" class="remove-item" aria-label="Remove item">×</button>
  `;
  row.querySelector('.remove-item').addEventListener('click', () => row.remove());
  document.getElementById('item-rows').appendChild(row);
}

async function loadOrderForm() {
  const [items, locations] = await Promise.all([
    fetch('/api/menu').then((r) => r.json()),
    fetch('/api/locations').then((r) => r.json()),
  ]);

  menuItems = items;

  document.getElementById('location').innerHTML = locations
    .map((l) => `<option value="${l.id}">${l.name}</option>`)
    .join('');

  addItemRow(); // start with one line so the form isn't empty
}

async function submitOrder(event) {
  event.preventDefault();

  const location_id = document.getElementById('location').value;
  const customer_name = document.getElementById('customer_name').value;

  const items = [...document.querySelectorAll('#item-rows .item-row')]
    .map((row) => ({
      menu_item_id: Number(row.querySelector('.item-select').value),
      quantity: Number(row.querySelector('.item-qty').value),
    }))
    .filter((i) => i.menu_item_id && i.quantity > 0);

  if (!items.length) {
    document.getElementById('result').innerHTML = `<p class="note">Add at least one item.</p>`;
    return;
  }

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
  document.getElementById('add-item').addEventListener('click', addItemRow);
  document.getElementById('order-form').addEventListener('submit', submitOrder);
});