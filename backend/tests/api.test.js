const request = require('supertest');
const { createApp } = require('../src/app');
const { pool } = require('../src/db/pool');
const { migrate } = require('../src/db/migrate');

const app = createApp();

beforeAll(async () => {
  await migrate();
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await pool.query('TRUNCATE users RESTART IDENTITY CASCADE');
});

async function register(overrides = {}) {
  return request(app)
    .post('/auth/register')
    .send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'secret123',
      ...overrides,
    });
}

async function createUser(agent, username) {
  await agent.post('/auth/register').send({
    username,
    email: `${username}@example.com`,
    password: 'secret123',
  });
}

function sampleExpense(overrides = {}) {
  return {
    title: 'Lunch',
    amount: 120,
    category: 'Food',
    date: '2026-09-01',
    type: 'expense',
    ...overrides,
  };
}

describe('authentication', () => {
  test('registers a user and sets an httpOnly cookie', async () => {
    const res = await register();
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('alice');
    expect(res.body.token).toBeUndefined();
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/ft_token=/);
    expect(cookie.toLowerCase()).toMatch(/httponly/);
  });

  test('rejects duplicate username', async () => {
    await register();
    const res = await register({ email: 'other@example.com' });
    expect(res.status).toBe(400);
  });

  test('rejects short passwords', async () => {
    const res = await register({ password: '123' });
    expect(res.status).toBe(400);
  });

  test('logs in with valid credentials', async () => {
    await register();
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'alice', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@example.com');
  });

  test('rejects invalid credentials', async () => {
    await register();
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'alice', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('me requires authentication', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  test('me returns the cookie session user', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/register').send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'secret123',
    });
    const res = await agent.get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('alice');
  });

  test('logout clears the session', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/register').send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'secret123',
    });
    await agent.post('/auth/logout');
    const res = await agent.get('/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('user data isolation', () => {
  test('users only see their own entries', async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await createUser(alice, 'alice');
    await createUser(bob, 'bob');

    const a = await alice.post('/entries').send(sampleExpense({ title: 'Alice rent', category: 'Rent', amount: 15000 }));
    const b = await bob.post('/entries').send(sampleExpense({ title: 'Bob snacks' }));
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    const aliceList = await alice.get('/entries');
    const bobList = await bob.get('/entries');
    expect(aliceList.body.items).toHaveLength(1);
    expect(aliceList.body.items[0].title).toBe('Alice rent');
    expect(bobList.body.items).toHaveLength(1);
    expect(bobList.body.items[0].title).toBe('Bob snacks');
  });

  test('cannot update another user entry', async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await createUser(alice, 'alice');
    await createUser(bob, 'bob');
    const created = await alice.post('/entries').send(sampleExpense());
    expect(created.status).toBe(201);
    const res = await bob.put(`/entries/${created.body.id}`).send(sampleExpense({ title: 'Hacked' }));
    expect(res.status).toBe(404);
    const check = await alice.get('/entries');
    expect(check.body.items[0].title).toBe('Lunch');
  });

  test('cannot delete another user entry', async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await createUser(alice, 'alice');
    await createUser(bob, 'bob');
    const created = await alice.post('/entries').send(sampleExpense());
    const res = await bob.delete(`/entries/${created.body.id}`);
    expect(res.status).toBe(404);
    const check = await alice.get('/entries');
    expect(check.body.total).toBe(1);
  });

  test('unauthenticated requests are rejected', async () => {
    const res = await request(app).get('/entries');
    expect(res.status).toBe(401);
  });

  test('analytics and budgets are scoped to the current user', async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await createUser(alice, 'alice');
    await createUser(bob, 'bob');
    await alice.post('/entries').send(sampleExpense({ amount: 500 }));
    await bob.post('/entries').send(sampleExpense({ amount: 9000, category: 'Rent' }));
    await alice.put('/budgets').send({ month: '2026-09', amount: 1000 });

    const aliceSummary = await alice.get('/analytics/summary');
    const bobSummary = await bob.get('/analytics/summary');
    expect(aliceSummary.body.totalExpense).toBe(500);
    expect(bobSummary.body.totalExpense).toBe(9000);

    const bobBudget = await bob.get('/budgets?month=2026-09');
    expect(bobBudget.body.amount).toBeNull();
    const aliceBudget = await alice.get('/budgets?month=2026-09');
    expect(aliceBudget.body.amount).toBe(1000);
    expect(aliceBudget.body.spent).toBe(500);
  });

  test('cannot read another user goal or recurring rule by id', async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await createUser(alice, 'alice');
    await createUser(bob, 'bob');
    const goal = await alice.post('/goals').send({
      name: 'Emergency fund',
      target_amount: 50000,
      current_amount: 1000,
    });
    const rec = await alice.post('/recurring').send({
      title: 'Rent',
      amount: 15000,
      category: 'Rent',
      type: 'expense',
      frequency: 'monthly',
      start_date: '2099-01-01',
    });
    expect(goal.status).toBe(201);
    expect(rec.status).toBe(201);
    const stealGoal = await bob.put(`/goals/${goal.body.id}`).send({
      name: 'Stolen',
      target_amount: 1,
      current_amount: 1,
    });
    const stealRec = await bob.delete(`/recurring/${rec.body.id}`);
    expect(stealGoal.status).toBe(404);
    expect(stealRec.status).toBe(404);
  });

  test('CSV report only includes the current user entries', async () => {
    const alice = request.agent(app);
    const bob = request.agent(app);
    await createUser(alice, 'alice');
    await createUser(bob, 'bob');
    await alice.post('/entries').send(sampleExpense({ title: 'Alice coffee' }));
    await bob.post('/entries').send(sampleExpense({ title: 'Bob secret' }));
    const csv = await alice.get('/reports/csv');
    expect(csv.status).toBe(200);
    expect(csv.text).toContain('Alice coffee');
    expect(csv.text).not.toContain('Bob secret');
  });
});

describe('entries query API', () => {
  test('supports search, type filter, sort, and pagination', async () => {
    const alice = request.agent(app);
    await createUser(alice, 'alice');
    await alice.post('/entries').send(sampleExpense({ title: 'Coffee', amount: 80, date: '2026-09-01' }));
    await alice.post('/entries').send(sampleExpense({ title: 'Groceries', amount: 400, date: '2026-09-02' }));
    await alice.post('/entries').send({
      title: 'Salary',
      amount: 50000,
      category: 'Salary',
      date: '2026-09-03',
      type: 'income',
    });

    const search = await alice.get('/entries?search=groc');
    expect(search.body.items).toHaveLength(1);
    expect(search.body.items[0].title).toBe('Groceries');

    const expenses = await alice.get('/entries?type=expense&sort=amount&order=desc');
    expect(expenses.body.items.map((e) => e.title)).toEqual(['Groceries', 'Coffee']);

    const page1 = await alice.get('/entries?limit=2&page=1&sort=date&order=desc');
    expect(page1.body.items).toHaveLength(2);
    expect(page1.body.total).toBe(3);
    const page2 = await alice.get('/entries?limit=2&page=2&sort=date&order=desc');
    expect(page2.body.items).toHaveLength(1);
  });
});
