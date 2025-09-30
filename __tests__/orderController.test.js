const request = require('supertest');
const express = require('express');
const session = require('express-session');

// Mock dependencies
jest.mock('../config/dbsettings', () => ({
  query: jest.fn()
}));
jest.mock('../config/mongoSchemas', () => ({
  Meseros: {
    findOneAndUpdate: jest.fn()
  }
}));

const db = require('../config/dbsettings');
const { Meseros } = require('../config/mongoSchemas');
const orderController = require('../core/controllers/orderController');

// Mock authentication and role middleware to always allow
jest.mock('../core/auth/authController', () => (req, res, next) => next());
jest.mock('../core/auth/roleController', () => () => (req, res, next) => next());

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
app.set('view engine', 'ejs');
app.use(orderController);

// Mock res.render for testing
app.response.render = function (view, options) {
  this.send({ view, ...options });
};

describe('Order Controller GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /ordenes-recepcionista debe renderizar ordenes', async () => {
    db.query.mockResolvedValueOnce([[{
      id_orden: 1,
      id_producto: 1,
      nombre_producto: 'Pizza',
      estado: 'Pendiente',
      fecha_orden: '2023-01-01',
      nombre_usuario: 'Juan',
      correo_usuario: 'juan@example.com'
    }]]);

    const agent = request.agent(app);
    // Simulate session user
    app.use((req, res, next) => {
      req.session = { user: { id: 1, nombre: 'Admin' } };
      next();
    });

    const res = await agent.get('/ordenes-recepcionista');
    expect(res.body.view).toBe('ordenesRecepcionista');
    expect(res.body.ordenes.length).toBe(1);
    expect(db.query).toHaveBeenCalled();
  });


describe('Order Controller POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  test('POST /ordenes-admin/completeOrder/:id_reservacion - completar orden corretamente', async () => {
    db.query
      .mockResolvedValueOnce([[{ mesero_nombre: 'Pedro' }]]) // getMeseroQuery
      .mockResolvedValueOnce([{}]); // updateOrderQuery
    Meseros.findOneAndUpdate.mockResolvedValueOnce({ nombre: 'Pedro', estado: 'Disponible' });

    const res = await request(app)
      .post('/ordenes-admin/completeOrder/1')
      .send();

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(Meseros.findOneAndUpdate).toHaveBeenCalledWith(
      { nombre: 'Pedro' },
      { estado: 'Disponible' },
      { new: true }
    );
    expect(res.header['location']).toBe('/ordenes-admin');
  });

  test('POST /ordenes-admin/completeOrder/:id_reservacion - debe rechazar ya que la reservación no existe', async () => {
    db.query.mockResolvedValueOnce([[]]); // No reservacion

    const res = await request(app)
      .post('/ordenes-admin/completeOrder/99')
      .send();

    expect(res.header['location']).toBe('/ordenes-admin');
  });

  test('POST /ordenes-admin/completeOrder/:id_reservacion - mesero no encontrado', async () => {
    db.query.mockResolvedValueOnce([[{ mesero_nombre: 'Pedro' }]]);
    Meseros.findOneAndUpdate.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/ordenes-admin/completeOrder/1')
      .send();

    expect(res.header['location']).toBe('/ordenes-admin');
  });

  test('POST /ordenes-admin/assignMesero/:id_reservacion - caso de exito (mesero encontrado)', async () => {
    Meseros.findOneAndUpdate.mockResolvedValueOnce({ nombre: 'Pedro', estado: 'No disponible' });
    db.query
      .mockResolvedValueOnce([{}]) // updateOrderQuery
      .mockResolvedValueOnce([{}]); // updateOrderQuery2

    const res = await request(app)
      .post('/ordenes-admin/assignMesero/1')
      .send('mesero_nombre=Pedro');

    expect(Meseros.findOneAndUpdate).toHaveBeenCalledWith(
      { nombre: 'Pedro' },
      { estado: 'No disponible' },
      { new: true }
    );
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(res.header['location']).toBe('/ordenes-admin');
  });

  test('POST /ordenes-admin/assignMesero/:id_reservacion - mesero no encontrado', async () => {
    Meseros.findOneAndUpdate.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/ordenes-admin/assignMesero/1')
      .send('mesero_nombre=Pedro');

    expect(res.header['location']).toBe('/ordenes-admin');
  });

  test('POST /ordenes-admin/assignMesero/:id_reservacion - forzar error de db para manejo de errores', async () => {
    Meseros.findOneAndUpdate.mockResolvedValueOnce({ nombre: 'Pedro', estado: 'No disponible' });
    db.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/ordenes-admin/assignMesero/1')
      .send('mesero_nombre=Pedro');

    expect(res.header['location']).toBe('/ordenes-admin');
  });
});
});