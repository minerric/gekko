const Bitfinex = require('stocks-exchange-client');
const moment = require('moment');
const util = require('../../core/util');
const log = require('../../core/log');
const _ = require('lodash');
const retry = require('../../exchange/exchangeUtils').retry;

const config = util.getConfig();
const dirs = util.dirs();
const Fetcher = require(dirs.exchanges + 'therocktrading');

