const knex = require('knex');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const MENU_SEED = [
  { category: 'Starters', name: 'Edamame', description: 'Sea salt, togarashi', price: 7 },
  { category: 'Starters', name: 'Agedashi tofu', description: 'Silken tofu, dashi broth, bonito', price: 9 },
  { category: 'Starters', name: 'Hamachi crudo', description: 'Yuzu, jalapeño, shiso', price: 16 },
  { category: 'Robata', name: 'Chicken thigh skewer', description: 'Tare glaze, scallion', price: 6 },
  { category: 'Robata', name: 'Pork belly skewer', description: 'Miso marinade, mustard', price: 7 },
  { category: 'Robata', name: 'Shishito peppers', description: 'Charred, lime, flake salt', price: 8 },
  { category: 'Robata', name: 'Whole grilled mackerel', description: 'Sudachi, daikon', price: 22 },
  { category: 'Sushi & Sashimi', name: 'Nigiri selection', description: "Chef's choice, six pieces", price: 24 },
  { category: 'Sushi & Sashimi', name: 'Salmon roll', description: 'Avocado, cucumber, sesame', price: 12 },
  { category: 'Sushi & Sashimi', name: 'Spicy tuna roll', description: 'Scallion, chili oil', price: 13 },
  { category: 'Ramen', name: 'Shoyu ramen', description: 'Chicken broth, chashu, soft egg', price: 17 },
  { category: 'Ramen', name: 'Miso ramen', description: 'Pork broth, corn, butter', price: 18 },
  { category: 'Ramen', name: 'Vegetable ramen', description: 'Kombu dashi, seasonal greens', price: 16 },
  { category: 'Dessert', name: 'Black sesame ice cream', description: '', price: 6 },
  { category: 'Dessert', name: 'Matcha cheesecake', description: '', price: 8 },
];

const LOCATION_SEED = [
  { name: 'Okami Downtown', address: '123 Alder Street, Suite 2, Springfield', notes: 'Reservations recommended for dinner; walk-ins welcome at the bar.' },
  { name: 'Okami Riverside', address: '48 Riverside Lane, Springfield', notes: 'Larger dining room, with a private tatami room available for groups of six or more.' },
];

async function getDbCreds() {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const res = await client.send(new GetSecretValueCommand({ SecretId: 'OrderAndReservationDBCredentials' }));
  return JSON.parse(res.SecretString);
}

async function ensureSchema(db) {
  if (!(await db.schema.hasTable('menu_items'))) {
    await db.schema.createTable('menu_items', (t) => {
      t.increments('id');
      t.string('category', 50).notNullable();
      t.string('name', 100).notNullable();
      t.string('description', 255);
      t.decimal('price', 6, 2).notNullable();
    });
    await db('menu_items').insert(MENU_SEED);
    console.log('menu_items: created + seeded');
  }

  if (!(await db.schema.hasTable('locations'))) {
    await db.schema.createTable('locations', (t) => {
      t.increments('id');
      t.string('name', 100).notNullable();
      t.string('address', 255).notNullable();
      t.string('notes', 255);
    });
    await db('locations').insert(LOCATION_SEED);
    console.log('locations: created + seeded');
  }

  if (!(await db.schema.hasTable('reservations'))) {
    await db.schema.createTable('reservations', (t) => {
      t.increments('id');
      t.integer('location_id').unsigned().references('id').inTable('locations');
      t.string('name', 100).notNullable();
      t.integer('party_size').notNullable();
      t.dateTime('reservation_time').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('reservations: created');
  }

  if (!(await db.schema.hasTable('orders'))) {
    await db.schema.createTable('orders', (t) => {
      t.increments('id');
      t.integer('location_id').unsigned().references('id').inTable('locations');
      t.string('customer_name', 100).notNullable();
      t.string('status', 30).notNullable().defaultTo('received');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('orders: created');
  }

  if (!(await db.schema.hasTable('order_items'))) {
    await db.schema.createTable('order_items', (t) => {
      t.increments('id');
      t.integer('order_id').unsigned().references('id').inTable('orders');
      t.integer('menu_item_id').unsigned().references('id').inTable('menu_items');
      t.integer('quantity').notNullable();
    });
    console.log('order_items: created');
  }
}

async function initDb() {
  const creds = await getDbCreds();
  const db = knex({
    client: 'mysql2',
    connection: {
      host: creds.endpoint,
      user: creds.username,
      password: creds.password,
      database: 'OrderAndReservation',
    },
  });
  await ensureSchema(db);
  return db;
}

module.exports = { initDb };