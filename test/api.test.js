const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Task = require('../src/models/Task');

let token;
let taskId;

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/testdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create a test user and get token
  const user = new User({ email: 'test@example.com', password: 'password123' });
  await user.save();

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'password123' });

  token = res.body.token;
});

afterAll(async () => {
  // Clean up database
  await User.deleteMany({});
  await Task.deleteMany({});
  await mongoose.connection.close();
});

describe('Task API', () => {
  test('Create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', description: 'Test description' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Task');
    taskId = res.body._id;
  });

  test('Get all tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Get a task by ID', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(taskId);
  });

  test('Update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'concluída' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('concluída');
  });

  test('Delete a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Task deleted successfully');
  });
});
