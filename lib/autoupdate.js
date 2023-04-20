/* eslint-disable indent */
let log = null;
let Promise = null;
const _ = require('lodash');

/**
 * `Connector._models` are all known at the time `autoupdate` is called
 *  so it should be possible to work on all elasticsearch indicies and mappings at one time
 *  unlike with `.connect()` when the models were still unknown so
 *  initializing ES indicies and mappings in one go wasn't possible.
 *
 * @param models
 * @param cb
 */
const autoupdate = function (models, cb) {
    log('ESConnector.prototype.autoupdate', 'models:', models);
    const self = this;
    if (self.db) {
        if (!cb && (typeof models === 'function')) {
            cb = models;
            models = undefined;
        }
        // First argument is a model name
        if (typeof models === 'string') {
            models = [models];
        }
        log('ESConnector.prototype.autoupdate', 'models', models);

        // eslint-disable-next-line no-underscore-dangle
        models = models || Object.keys(self._models);

        return Promise.map(
            models,
            function (modelName) {
                return self.setupIndex(modelName);
            },
            { concurrency: 1 }
        )
            .then(function () {
                log('ESConnector.prototype.autoupdate', 'finished all index creation');
                cb();
            })
            .catch(function (err) {
                log('ESConnector.prototype.autoupdate', 'failed', err);
                cb(err);
            });
    } else {
        log('ESConnector.prototype.autoupdate', 'ERROR', 'Elasticsearch connector has not been initialized');
        cb('Elasticsearch connector has not been initialized');
    }
};

module.exports = function (dependencies) {
    log = dependencies
        // eslint-disable-next-line no-console
        ? (dependencies.log || console.log)
        // eslint-disable-next-line no-console
        : console.log;
    Promise = (dependencies) ? (dependencies.bluebird || require('bluebird')) : require('bluebird');
    return autoupdate;
};
