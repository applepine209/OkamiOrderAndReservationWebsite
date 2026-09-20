const express = require('express');
const path = require('path');
const { initDb } = require('./db');
const { getInstanceId } = require('./instance-id');

async function main() {
  const db = await initDb();
  const instanceId = await getInstanceId();
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'frontend')));

  app.get('/api/instance-id', (req, res) => {
    res.json({ instanceId });
  });

  app.get('/api/menu', async (req, res) => {
    const items = await db('menu_items').select('*').orderBy(['category', 'id']);
    res.json(items);
  });

  app.get('/api/locations', async (req, res) => {
    const locations = await db('locations').select('*');
    res.json(locations);
  });

  app.post('/api/orders', async (req, res) => {
    const { location_id, customer_name, items } = req.body;
    if (!location_id || !customer_name || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'location_id, customer_name and at least one item are required' });
    }

    const [orderId] = await db('orders').insert({ location_id, customer_name });
    await db('order_items').insert(
      items
        .filter((i) => Number(i.quantity) > 0)
        .map((i) => ({ order_id: orderId, menu_item_id: i.menu_item_id, quantity: i.quantity }))
    );

    // Read the write back before responding
    const order = await db('orders')
      .join('locations', 'orders.location_id', 'locations.id')
      .select('orders.id', 'orders.customer_name', 'orders.status', 'orders.created_at', 'locations.name as location_name')
      .where('orders.id', orderId)
      .first();
    const lines = await db('order_items')
      .join('menu_items', 'order_items.menu_item_id', 'menu_items.id')
      .select('menu_items.name', 'order_items.quantity')
      .where('order_items.order_id', orderId);

    res.status(201).json({ ...order, items: lines });
  });

  app.post('/api/reservations', async (req, res) => {
    const { location_id, name, party_size, reservation_time } = req.body;
    if (!location_id || !name || !party_size || !reservation_time) {
      return res.status(400).json({ error: 'location_id, name, party_size and reservation_time are required' });
    }

    const [reservationId] = await db('reservations').insert({
      location_id,
      name,
      party_size,
      reservation_time: String(reservation_time).replace('T', ' '),
    });

    // Read the write back before responding
    const reservation = await db('reservations')
      .join('locations', 'reservations.location_id', 'locations.id')
      .select('reservations.id', 'reservations.name', 'reservations.party_size', 'reservations.reservation_time', 'locations.name as location_name')
      .where('reservations.id', reservationId)
      .first();

    res.status(201).json(reservation);
  });

  app.listen(3000, () => console.log('Listening on port 3000'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});