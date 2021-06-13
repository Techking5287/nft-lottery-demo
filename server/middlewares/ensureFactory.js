/* eslint-disable consistent-return */
// const SDK = require('@ocap/sdk');
const Client = require('@ocap/client');
const { isValid } = require('@arcblock/did');

const env = require('../libs/env');
const { getAccountStateOptions } = require('../libs/utils');

module.exports = async (req, res, next) => {
  if (req.query.factory) {
    req.factory = req.query.factory;
    next();
    return;
  }
  if (!req.query.assetId) {
    // if have factory address, go to next step
    return res.status(404).send('Invalid request: missing nft asset id');
  }

  const { assetId } = req.query;
  if (isValid(assetId) === false) {
    return res.status(404).send('Invalid request: invalid nft asset id');
  }

  const client = new Client(env.chainHost);
  const { state: asset } = await client.getAssetState({ address: assetId }, { ...getAccountStateOptions });
  if (!asset) {
    return res.status(404).send('Invalid request: nft asset not found');
  }

  const { data } = asset;
  if (data.typeUrl !== 'vc') {
    return res.status(404).send('Invalid request: nft asset is not a vc');
  }

  req.factory = asset.parent;

  next();
};
