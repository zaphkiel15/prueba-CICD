const request = require('supertest');
const express = require('express');
const session = require('express-session');

// Mock db and bcrypt
jest.mock('../config/dbsettings', () => ({
  query: jest.fn()
}));
jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

const db = require('../config/dbsettings');
const bcrypt = require('bcrypt');
const loginController = require('../core/controllers/loginController');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use(loginController);
app.set("view engine", "ejs");

describe('Login Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('iniciar sesión correctamente con credenciales correctas', async () => {
    db.query.mockResolvedValueOnce([[{
      id_usuario: 1,
      nombre: 'Test User',
      correo: 'test@example.com',
      id_rol: 2,
      contraseña: 'hashed'
    }]]);
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/iniciosesion')
      .send('correo=test@example.com&contraseña=123456');

    expect(res.header['location']).toBe('/productos');
    expect(db.query).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
  });

  test('fallar login con credenciales incorrectas', async () => {
    db.query.mockResolvedValueOnce([[{
      id_usuario: 1,
      nombre: 'Test User',
      correo: 'test@example.com',
      id_rol: 2,
      contraseña: 'hashed'
    }]]);
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/iniciosesion')
      .send('correo=test@example.com&contraseña=wrongpass');

    expect(res.header['location']).toBe('/');
  });

  test('fallar login con email no existente', async () => {
    db.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post('/iniciosesion')
      .send('correo=notfound@example.com&contraseña=123456');

    expect(res.header['location']).toBe('/');
  });

  test('cerrar sesión correctamente', async () => {
    const res = await request(app)
      .get('/logout');

    expect(res.text).toContain('Sesión cerrada correctamente');
  });
});