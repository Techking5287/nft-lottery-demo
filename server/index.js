require('dotenv-flow').config();
require('express-async-errors');
const path = require('path');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const { name, version } = require('../package.json');
const logger = require('./libs/logger');

const app = express();
app.use(compression());

app.set('trust proxy', true);
app.use(cookieParser());
app.use(express.json({ limit: '1 mb' }));
app.use(express.urlencoded({ extended: true, limit: '1 mb' }));
app.use(cors());

const router = express.Router();
router.use('/api', require('./routes'));

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production' || process.env.ABT_NODE_SERVICE_ENV === 'production';
if (isDevelopment && process.env.ABT_NODE) {
  process.env.BLOCKLET_PORT = 3030;
}

if (isProduction) {
  app.use(router);
  if (process.env.BLOCKLET_DID) {
    app.use(`/${process.env.BLOCKLET_DID}`, router);
  }
  const staticDir = path.resolve(__dirname, '../', 'dist');
  app.use(express.static(staticDir, { index: 'index.html' }));
  if (process.env.BLOCKLET_DID) {
    app.use(`/${process.env.BLOCKLET_DID}`, express.static(staticDir, { index: 'index.html' }));
  }
  app.use((req, res) => {
    res.status(404).send('404 NOT FOUND');
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
  });
} else {
  app.use(router);
}

const port = parseInt(process.env.BLOCKLET_PORT || process.env.APP_PORT, 10) || 3030;
app.listen(port, err => {
  if (err) throw err;
  logger.info(`> ${name} v${version} ready on ${port}`);
});
