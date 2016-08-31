import AccountManager from './account';
import Request from './request';
import sinon from 'sinon';
import EWT  from 'ethereum-web-token';

let retis = () => {
  return req;
};

let req = {
  get: retis,
  post: retis,
  set: retis,
  end: function(){}
};

const CR_ABI = [ { type: 'function', name: 'cr', inputs: [{type: 'uint256'}] } ];
const MNEMONIC = 'scale empower annual twelve rose need photo exhibit sea ignore response sniff';
const PRIV = '1e60b0e1ec15fc82fe70b43f90c7d4e6aa78f024975d55f6220ba119d6d58599';
const NONCE_1 = '163adca6-0317-4a31-9e5f-c542375cd4b0';
describe('Account', () => {

  afterEach(() => {
    if (req.get.restore) req.get.restore();
    if (req.set.restore) req.set.restore();
    if (req.end.restore) req.end.restore();
  });

  it('should return info for existing account', function(done) {
    sinon.stub(req, 'end').yields(null, {body: {
      accountId: '123'
    }});
    sinon.stub(req, 'set').returns(req);
    sinon.stub(req, 'get').returns(req);

    let account = new AccountManager(MNEMONIC, new Request(req));

    account.info(NONCE_1).then((rsp) => {
      var cr = new EWT(CR_ABI).cr(NONCE_1).sign(PRIV);
      expect(req.get).calledWith('https://account.cosign.io/v0/account/');
      expect(req.set).calledWith('Authorization', cr);
      expect(rsp).to.eql({accountId: '123'});
      done();
    }).catch(done);
  });

  it('should return 404 for missing account', function(done) {
    sinon.stub(req, 'end').yields({status: 404});

    let account = new AccountManager(MNEMONIC, new Request(req));

    account.info().catch((err) => {
      expect(err).to.contain('404');
      done();
    }).catch(done);
  });
});
