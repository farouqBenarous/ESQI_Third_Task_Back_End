const express = require('express');


const users = require('../routes/users');
const entreprise = require('../routes/entreprise');

const error = require('../middleware/error');

module.exports = function(app) {
  app.use(express.json());
  app.use('/api/users', users);
  app.use('/api/entreprises',entreprise)
  app.use(error);
}