const uuid = require('node-uuid');

const ACCOUNT_URL = 'https://account.cosign.io/v0';
const TOKEN_URL = 'https://token.cosign.io/v0';

function RequestManager(request, accountUrl, tokenUrl) {
  this.request = request;
  this.accountUrl = (accountUrl) ? accountUrl : ACCOUNT_URL;
  this.tokenUrl = (tokenUrl) ? tokenUrl : TOKEN_URL;
}

RequestManager.prototype.getAccount = function(accountId, ewt) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.request
      .get(self.accountUrl + '/account/' + accountId)
      .set('Authorization', ewt)
      .set('Accept', 'application/json')
      .end(function(err, rsp) {
        if (err)
          reject('Error: ' + err);
        else
          fulfill(rsp.body);
    });
  });
};

RequestManager.prototype.createAccount = function() {
  var self = this;
  return new Promise(function (fulfill, reject) {
    var accountId = uuid.v4();
    self.request
      .post(self.accountUrl + '/account/' + accountId)
      .set('Accept', 'application/json')
      .end(function(err, rsp) {
        if (err)
          reject('Error: ' + err);
        else
          fulfill({
            accountId: accountId,
            rsp: rsp.body
          });
    });
  });
};

RequestManager.prototype.addEmail = function(accountId, email) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.request
      .post(self.accountUrl + '/account/' + accountId + '/addEmail')
      .send({ email: email })
      .set('Accept', 'application/json')
      .end(function(err, rsp) {
        if (err)
          reject('Error: ' + err);
        else
          fulfill(rsp.body);
    });
  });
};

RequestManager.prototype.confirmEmail = function(token) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.request
      .get(self.accountUrl + '/confirm/email/' + token)
      .set('Accept', 'application/json')
      .end(function(err, rsp) {
        if (err)
          reject('Error: ' + err);
        else
          fulfill(rsp.body);
    });
  });
};

RequestManager.prototype.addKey = function(accountId, key) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.request
      .post(self.accountUrl + '/account/' + accountId + '/addKey')
      .send({ key: key })
      .set('Accept', 'application/json')
      .end(function(err, rsp) {
        if (err)
          reject(err);
        else
          fulfill(rsp.body);
    });
  });
};

RequestManager.prototype.confirmKey = function(accountId, ewt) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.request
      .post(self.accountUrl + '/account/' + accountId + '/confirmKey')
      .set('Authorization', ewt)
      .set('Accept', 'application/json')
      .end(function(err, rsp) {
        if (err)
          reject('Error: ' + err);
        else
          fulfill(rsp);
    });
  });
};

RequestManager.prototype.claimVoucher = function(voucher, claim) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.request
      .post(self.accountUrl + '/claim')
      .send({ voucher: voucher, claim: claim })
      .set('Accept', 'application/json')
      .end(function(err, rsp) {
        if (err)
          reject('Error: ' + err);
        else
          fulfill(rsp);
    });
  });
};

module.exports = RequestManager;