const request = require('supertest');
const express = require('express');
const session = require('express-session');

// Mock dependencies
jest.mock('../config/dbsettings', () => ({
  query: jest.fn()
}));
jest.mock('date-fns', () => ({
  format: jest.fn(() => '2023-01-01 12:00:00')
}));

const db = require('../config/dbsettings');
const productController = require('../core/controllers/productController');

// Mock authentication and role middleware to always allow
jest.mock('../core/auth/authController', () => (req, res, next) => next());
jest.mock('../core/auth/roleController', () => () => (req, res, next) => next());

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use((req, res, next) => {
  // Simulate a logged-in user for ordering
  req.session.user = { id: 2, nombre: 'Test User', correo: 'test@example.com' };
  next();
});
app.use(productController);

describe('Product Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /productos/agregar debe agregar un producto y redireccionar', async () => {
    db.query.mockResolvedValueOnce([{}]);
    const res = await request(app)
      .post('/productos/agregar')
      .send('nombre=Pizza&descripcion=Deliciosa&precio=100&stock=10&imagen_producto=img.jpg');
    expect(db.query).toHaveBeenCalled();
    expect(res.header['location']).toBe('/productos');
  });

  test('GET /productos/eliminar/:id debe eliminar un producto y redireccionar', async () => {
    db.query.mockResolvedValueOnce([{}]);
    const res = await request(app)
      .get('/productos/eliminar/1');
    expect(db.query).toHaveBeenCalledWith('DELETE FROM productos WHERE id_producto = ?', ['1']);
    expect(res.header['location']).toBe('/productos');
  });

  test('GET /productos/ordenar/:id debe ordenar un producto y redireccionar', async () => {
    db.query
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // Stock updated
      .mockResolvedValueOnce([{}]); // Order inserted

    const res = await request(app)
      .get('/productos/ordenar/1');
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(res.header['location']).toBe('/productos');
  });

  test('GET /productos/ordenar/:id debe fallar debido a falta de stock', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]); // No stock

    const res = await request(app)
      .get('/productos/ordenar/1');
    expect(res.header['location']).toBe('/productos');
  });
});