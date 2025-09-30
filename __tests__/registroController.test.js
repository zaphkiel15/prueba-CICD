const request = require('supertest');
const express = require('express');
const session = require('express-session');

// Mock dependencies
jest.mock('../config/dbsettings', () => ({
  query: jest.fn()
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn()
}));
jest.mock('date-fns', () => ({
  format: jest.fn(() => '2023-01-01 12:00:00')
}));

const db = require('../config/dbsettings');
const bcrypt = require('bcrypt');
const registroController = require('../core/controllers/registroController');

// Mock authentication and role middleware to always allow
jest.mock('../core/auth/authController', () => (req, res, next) => next());
jest.mock('../core/auth/roleController', () => () => (req, res, next) => next());

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use(registroController);

describe('Registro Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registrar nuevo usuario correctamente', async () => {
    db.query
      .mockResolvedValueOnce([[]]) // Email not found
      .mockResolvedValueOnce([{}]); // Insert user
    bcrypt.hash.mockResolvedValueOnce('hashedPassword');

    const res = await request(app)
      .post('/registrar')
      .send('nombre_usuario=Test&contraseña=123456&correo=test@example.com');

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(res.header['location']).toBe('/registro');
  });

  test('no debería registrar email si existe', async () => {
    db.query.mockResolvedValueOnce([[{ correo: 'test@example.com' }]]); // Email found

    const res = await request(app)
      .post('/registrar')
      .send('nombre_usuario=Test&contraseña=123456&correo=test@example.com');

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(res.header['location']).toBe('/registro');
  });

  test('debe poder manejar error sin detener la aplicación', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/registrar')
      .send('nombre_usuario=Test&contraseña=123456&correo=test@example.com');

    expect(res.header['location']).toBe('/registro');
  });
});