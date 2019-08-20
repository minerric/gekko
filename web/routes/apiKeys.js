const cache = require('../state/cache');
const manager = cache.get('apiKeyManager');
const axios = require('axios');

module.exports = {
  get: function *() {
    this.body = manager.get();
  },
  add: function *() {
    const content = this.request.body;
    console.log(content.exchange);
    console.log(content);

    if (content.exchange === 'stex') {
      console.log({
        grant_type:	'authorization_code',
        code: content.values.code,
        redirect_uri: 'http://localhost:3000/stex.html',
        client_id: content.values.id,
        client_secret: content.values.secret,
      });
      axios.post('https://api3.stex.com/oauth/token', {
        grant_type:	'authorization_code',
        code: content.values.code,
        redirect_uri: 'http://localhost:3000/stex.html',
        client_id: content.values.id,
        client_secret: content.values.secret,
      }).then((res) => {
        const data = res.data;
        manager.add(content.exchange, {
          id: content.values.id,
          secret: content.values.secret,
          access_token: res.data.access_token,
          refresh_token: res.data.refresh_token,
        });
      }).catch(console.error);
    } else {
      manager.add(content.exchange, content.values);
    }


    this.body = {
      status: 'ok'
    };
  },
  remove: function *() {
    const exchange = this.request.body.exchange;

    manager.remove(exchange);

    this.body = {
      status: 'ok'
    };
  }
}
