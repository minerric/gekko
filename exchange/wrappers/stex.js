const moment = require('moment');
const _ = require('lodash');

const Errors = require('../exchangeErrors');
const marketData = require('./stex-markets.json');
const exchangeUtils = require('../exchangeUtils');
const retry = exchangeUtils.retry;
const scientificToDecimal = exchangeUtils.scientificToDecimal;

const StocksExchange = require('stocks-exchange-client').client;

const Trader = function(config) {

  if(!config.id) {
    this.id = 'dummyApiKey';
    this.secret = 'dummyApiKey';
    this.access_token = '';
    this.refresh_token = '';
  } else {
    this.id = config.id;
    this.secret = config.secret;
    this.access_token = config.access_token;
    this.refresh_token = config.refresh_token;
  }

  if (_.isObject(config)) {
    this.currency = config.currency.toUpperCase();
    this.asset = config.asset.toUpperCase();
  }

  this.pair = this.asset + '_' + this.currency;
  this.name = 'stex';

  this.market = _.find(Trader.getCapabilities().markets, (market) => {
    return market.pair[0] === this.currency && market.pair[1] === this.asset
  });

  const option = {
    client: {
      id: this.id,
      secret: this.secret,
    },
    tokenObject: {
      access_token: this.access_token,
      refresh_token: this.refresh_token,
    },
    accessTokenUrl: 'https://api3.stex.com/oauth/token',
    scope: 'trade profile reports withdrawal',
  };
  this.client = new StocksExchange(option, null, 3);
};

Trader.prototype.getTrades = function(since, callback, descending) {
  console.log('GET TRADES');
  let from;
  if (since) {
    from = new Date(since).getTime() / 1000;
  }
  this.client.publicTrades(this.market.id, {
    sort: 'DESC',
    pair: this.pair,
    limit: 10000,
    from,
    // till: new Date().getTime() / 1000,
  }, function (res, d) {
    res = JSON.parse(res);
    if (!res.success) {
      console.error(res.error);
      return callback(res.error);
    }
    const data = res.data.map(function(trade) {
      return {
        tid: parseFloat(trade.id),
        amount: parseFloat(trade.amount),
        date: trade.timestamp,
        price: parseFloat(trade.price),
      };
    });
    callback(null, data.reverse());
  });
}

Trader.prototype.getTicker = function(callback) {
  console.log('GET TICKER');
  this.client.publicTicker(this.market.id, function (res) {
    res = JSON.parse(res);
    if (!res.success) {
      return callback(res.error);
    }
    callback(null, {
      ask: parseFloat(res.data.ask),
      bid: parseFloat(res.data.bid),
    });
  });
}

Trader.prototype.getPortfolio = function(callback) {
  console.log('GET PORTFOLIO');
  this.client.profileWallets({
    sort: 'DESC',
    sortBy: 'BALANCE'
  }, function (res) {
    res = JSON.parse(res);
    if (!res.success) {
      return callback(res.error);
    }
    callback(null, res.data.map(({ currency_code, balance }) => {
      return {name: currency_code, amount: Number(balance)};
    }));
  });
}

Trader.prototype.getFee = function(callback) {
  const makerFee = 0.1;
  // const takerFee = 0.2;
  console.log('GET FEE');
  callback(undefined, makerFee / 100);
}

Trader.prototype.roundAmount = function(amount) {
  console.log('ROUND AMOUNT');
  return Math.floor(amount * 100000000) / 100000000;
}

Trader.prototype.roundPrice = function(price) {
  // todo: calc significant digits
  console.log('ROUND PRICE');
  return price;
}

Trader.prototype.submitOrder = function(type, amount, price, callback) {
  console.log('SUBMIT ORDER');
  se.createTradingOrdersById(this.market.id, {
    type,
    amount,
    price,
  }, function (res) {
    if (!res.success) {
      return callback(res.error);
    }
    callback(undefined, res.data);
  });
}

Trader.prototype.buy = function(amount, price, callback) {
  return this.submitOrder('BUY', amount, price, callback);
}

Trader.prototype.sell = function(amount, price, callback) {
  return this.submitOrder('SELL', amount, price, callback);
}

Trader.prototype.checkOrder = function(order_id, callback) {
  this.tradingOrderByOrderId(order_id, function (res) {
    if (!res.success) {
      return callback(res.error);
    }
    callback(undefined, res.data);
  });
}


Trader.prototype.getOrder = function(order_id, callback) {
  console.log('GET ORDER');
  this.tradingOrderByOrderId(order_id, function (res) {
    if (!res.success) {
      return callback(res.error);
    }
    callback(undefined, res.data);
  });
}


Trader.prototype.cancelOrder = function(order_id, callback) {
  console.log('CANCEL ORDER');
  this.cancelTradingOrderByOrderId(order_id, function (res) {
    if (!res.success) {
      return callback(res.error);
    }
    callback(undefined, res.data);
  });
}

Trader.getCapabilities = function() {
  return {
    name: 'STEX',
    slug: 'stex',
    currencies: marketData.currencies,
    assets: marketData.assets,
    markets: marketData.markets,
    requires: [
      'id', 'secret', 'code',
    ],
    providesHistory: 'date',
    providesFullHistory: true,
    tid: 'tid',
    tradable: true,
    gekkoBroker: 0.6,
    limitedCancelConfirmation: true
  };
};

module.exports = Trader;
