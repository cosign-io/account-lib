const wallet = require('eth-lightwallet');
var superAgent = require('superagent');
var RequestManager = require('./lib/request');
const EWT = require('ethereum-web-token');

const pwDerivedKey = new Uint8Array([215,152,86,175,5,168,43,177,135,97,218,89,136,5,110,93,193,114,94,197,247,212,127,83,200,150,255,124,17,245,91,10]);
const CHALL_RSP_ABI = [{name: 'cr', type: 'function', inputs: [{type: 'uint256'}]}];
const CLAIM_ABI = [{ type: 'function', name: 'claim', inputs: [{type: 'uint128'}]}];

function AccountManager(secret, requestManager) {
  if (secret)
    this.loadKey(secret);
  this.request = (requestManager) ? requestManager : new RequestManager(superAgent);
}

AccountManager.prototype.loadKey = function(secret) {
  if (this.ks)
    return 'Error: Key 0x' + this.ks.getAddresses()[0] + ' already loaded.';
  if (secret && secret.length > 70) {
    this.ks = new wallet.keystore(secret, pwDerivedKey);
    this.ks.generateNewAddress(pwDerivedKey, 1);
  } else if (secret) {
    this.ks = new wallet.keystore();
    this.ks.addPriv = function(privkeyHex) {
      var privKey = new Buffer(privkeyHex.replace('0x',''), 'hex');
      var encPrivKey = wallet.keystore._encryptKey(privKey, pwDerivedKey);
      var address = wallet.keystore._computeAddressFromPrivKey(privKey);
      this.ksData["m/0'/0'/0'"].encPrivKeys[address] = encPrivKey;
      this.ksData["m/0'/0'/0'"].addresses.push(address);
    };
    this.ks.isDerivedKeyCorrect = function(pwDerivedKey) {
      if (!this.encSeed)
        return true;
      var paddedSeed = KeyStore._decryptString(this.encSeed, pwDerivedKey);
      if (paddedSeed.length > 0) {
        return true;
      }
      return false;
    };
    this.ks.addPriv(secret);
  }
}

AccountManager.prototype.createKey = function() {
  if (this.ks)
    return 'Error: Key 0x' + this.ks.getAddresses()[0] + ' already loaded.';
  var secretSeed = wallet.keystore.generateRandomSeed();
  this.ks = new wallet.keystore(secretSeed, pwDerivedKey);
  this.ks.generateNewAddress(pwDerivedKey, 1);
  return {
    secretSeed: secretSeed,
    address: '0x'+this.ks.getAddresses()[0]
  }
}

AccountManager.prototype.showKey = function() {
  var address = this.ks.getAddresses()[0];
  var rv = {
    address: '0x' + address,
    priv: '0x' + this.ks.exportPrivateKey(address, pwDerivedKey)
  };
  if (this.ks.encSeed) {
    rv.secretSeed = this.ks.getSeed(pwDerivedKey);
  }
  return rv;
}

AccountManager.prototype.registerKey = function(email, accountId) {
  if (!this.ks)
    return 'Error: no Key loaded.';
  var self = this, handler;
  if (!accountId) {
    handler = this.request.createAccount().then(function(rsp) {
      accountId = rsp.accountId;
      return self.wait(); //otherwise we get a 404
    });
  } else {
    handler = Promise.resolve();
  }
  return handler.then(function() {
    return self.request.addEmail(accountId, email);
  })
}

AccountManager.prototype.wait = function() {
  return new Promise(function (fulfill, reject) {
    setTimeout(fulfill, 2000);
  });
}

AccountManager.prototype.confirmEmail = function(token, accountId) {
  if (!this.ks)
    return 'Error: no Key loaded.';
  var address = '0x' + this.ks.getAddresses()[0],
    accountId, ewt, self = this;
  return this.request.confirmEmail(token).then(function(rsp) {
    console.log(rsp);
    accountId = rsp.accountId;
    return self.request.addKey(accountId, address);
  }).then(function(rsp) {
    console.log(rsp);
    var key = self.ks.exportPrivateKey(self.ks.getAddresses()[0], pwDerivedKey);
    ewt = new EWT(CHALL_RSP_ABI).cr(rsp.challenge).sign(key);
    return self.request.confirmKey(accountId, ewt);
  }).then(function() {
    return self.request.getAccount(accountId, ewt);
  });
}

AccountManager.prototype.accountInfo = function() {
  if (!this.ks)
    return 'Error: no Key loaded.';
}

AccountManager.prototype.claim = function(voucherTok) {
  if (!this.ks)
    return 'Error: no Key loaded.';
  if (voucherTok.indexOf('cf:37:') != 0 || voucherTok.split(':').length < 3)
    return 'Error: voucher format wrong';
  voucherTok = 'eyJ0eXBlIjoiRVdUIiwiYWxnIjoiRVMyNTZrIn0.' + voucherTok.split(':')[2];
  var voucher = EWT.parse(voucherTok);
  var key = this.ks.exportPrivateKey(this.ks.getAddresses()[0], pwDerivedKey);
  var self = this,
    claimTok = new EWT(CLAIM_ABI).claim(voucher.values[0]).sign(key);
  return this.request.claimVoucher(voucherTok, claimTok).then(function(rsp) {
    console.log(rsp);
  });
}

module.exports = AccountManager;