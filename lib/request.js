const uuid = require('uuid');

const ACCOUNT_URL = 'https://account.cosign.io/v0';

function RequestManager(request, accountUrl) {
  this.request = request;
  this.accountUrl = (accountUrl) ? accountUrl : ACCOUNT_URL;
}

RequestManager.prototype.getAccountByKey = function(ewt) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.request
      .get(self.accountUrl + '/account/')
      .set('Authorization', ewt)
      .set('Accept', 'application/json')
      .end(function(err, rsp) {
        if (err && err.status && err.status == 404)
          reject('Not Found: account not found.\n\n' + JSON.stringify(err));
        else if (err)
          reject(JSON.stringify(err));
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
          fulfill(rsp.body);
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
          fulfill(rsp.body);
    });
  });
};

module.exports = RequestManager;