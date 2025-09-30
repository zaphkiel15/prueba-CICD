const request = require('supertest');
const express = require('express');
const session = require('express-session');

// Mock dependencies
jest.mock('../config/dbsettings', () => ({
  query: jest.fn()
}));

const db = require('../config/dbsettings');
const reservController = require('../core/controllers/reservController');

// Mock authentication and role middleware to always allow
jest.mock('../core/auth/authController', () => (req, res, next) => next());
jest.mock('../core/auth/roleController', () => () => (req, res, next) => next());

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.use((req, res, next) => {
  req.session.user = { id: 5, nombre: 'Recepcionista' };
  next();
});
app.use(reservController);

describe('reservController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe guardar reservación y actualizar estado de la órden', async () => {
    db.query
      .mockResolvedValueOnce([{}]) // Insert reservation
      .mockResolvedValueOnce([{}]); // Update order

    const res = await request(app)
      .post('/reservar')
      .send('id_orden=10&start=2023-10-01T10:00:00Z&email=test@example.com&end=2023-10-01T12:00:00Z&nombre=Juan&summary=Reserva&description=Test');

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(res.header['location']).toBe('/reservaciones');
  });

  test('debe fallar con campos faltantes', async () => {
    const res = await request(app)
      .post('/reservar')
      .send('id_orden=10&start=2023-10-01T10:00:00Z'); // Missing required fields

    expect(res.header['location']).toBe('/reservaciones');
  });

  test('manejo de erores en la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/reservar')
      .send('id_orden=10&start=2023-10-01T10:00:00Z&email=test@example.com&end=2023-10-01T12:00:00Z&nombre=Juan&summary=Reserva&description=Test');

    expect(res.header['location']).toBe('/reservaciones');
  });
});