const log = require('debug')('loopback:connector:elasticsearch');
const _ = require('lodash');

async function setupIndex(modelName) {
  if (!modelName) {
    return Promise.reject('missing modelName');
  }
  const self = this;
  const { db, version, indexSettings } = self;

  const defaults = self.addDefaults(modelName);
  const { index, type } = defaults;

  /**
  * fetch all es specific model properties
  **/
  const modelClass = self._models[modelName];
  if (!modelClass.settings.elasticsearch) {
    return Promise.reject('missing elasticsearch property on model !');
  }

  let properties = {}
  for (let property in modelClass.properties) {
    if (modelClass.properties[property]['es']) {
      properties[property] = modelClass.properties[property]['es'];
    }
  }

  const { staticSettings, dynamicSettings } = indexSettings;

  // Static settings are updated only when the index is setup
  const staticSettingsCopy = _.extend({}, staticSettings, (modelClass.settings.elasticsearch.settings && modelClass.settings.elasticsearch.settings.staticSettings) || {});

  // Dynamic settings are updated everytime a migration is run
  const dynamicSettingsCopy = _.extend({}, dynamicSettings, (modelClass.settings.elasticsearch.settings && modelClass.settings.elasticsearch.settings.dynamicSettings) || {});

  log('ESConnector.prototype.setupMapping', 'will setup mapping for modelName:', index);

  const { body: exists } = await db.indices.exists({
    index
  });

  const mapping = {
    properties: properties
  };

  if (!exists) {
    log('ESConnector.prototype.setupIndex', 'create index with mapping for', index);
    await db.indices.create({
      index,
      body: {
        settings: staticSettingsCopy,
        mappings: version < 7 ? {
          [type]: mapping
        } : mapping
      }
    });
    // return Promise.resolve();
  }

  log('ESConnector.prototype.setupIndex', 'update dynamic settings for index', index);
  // Update Dynamic Settings
  await db.indices.putSettings({
    index,
    body: dynamicSettingsCopy
  });

  const updateMapping = {
    index,
    body: mapping
  };

  log('ESConnector.prototype.setupIndex', 'update mapping for index', index);
  if (version < 7) {
    updateMapping.type = type;
  }

  await db.indices.putMapping(updateMapping);
  return Promise.resolve();
}

module.exports.setupIndex = setupIndex;
