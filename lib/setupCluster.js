const log = require('debug')('loopback:connector:elasticsearch');
const _ = require('lodash');

async function setupCluster() {
  const self = this;
  const { db, version, indexSettings, clusterSettings } = self;

  /**
  * fetch all es specific model properties
  **/
  log('ESConnector.prototype.setupCluster', 'will setup cluster', 'Updating');

  await db.cluster.putSettings({
    flat_settings: false,
    body: clusterSettings
  });

  log('ESConnector.prototype.setupCluster', 'update mapping for index', 'Updated');
  return Promise.resolve();
}

module.exports.setupCluster = setupCluster;
