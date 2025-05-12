const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Adjust to import the express app without starting the server

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect('mongodb://localhost:27017/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // Clean up database and close connection
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('Task API Endpoints', () => {
  let token;
  let taskId;

  test('Register and login user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'testuser@example.com', password: 'password123' })
      .expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com', password: 'password123' })
      .expect(201);

    token = res.body.token;
    expect(token).toBeDefined();
  });

  test('Create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', description: 'Test description' })
      .expect(201);

    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Test Task');
    taskId = res.body._id;
  });

  test('Get all tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Get a task by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(res.body).toHaveProperty('_id', taskId);
  });

  test('Update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'concluída' })
      .expect(201);

    expect(res.body.status).toBe('concluída');
  });

  test('Delete a task', async () => {
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
  });
});
