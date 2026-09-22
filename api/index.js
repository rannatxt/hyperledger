'use strict';

process.env.VERCEL = 'true';

const app = require('../backend/server');

module.exports = app;
