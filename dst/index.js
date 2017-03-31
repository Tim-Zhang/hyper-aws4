'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HeaderDate = 'X-Hyper-Date';
var HeaderContentHash = 'X-Hyper-Content-Sha256';
var Algorithm = 'HYPER-HMAC-SHA256';
var DefaultRegion = 'us-west-1';
var Service = 'hyper';
var KeyPartsRequest = 'hyper_request';
var KeyPartsPrefix = 'HYPER';

var Aws4 = function () {
  function Aws4(req, credential) {
    _classCallCheck(this, Aws4);

    var _req = this.req = req;

    var url = _req.url;
    var _req$method = _req.method;
    var method = _req$method === undefined ? 'GET' : _req$method;
    var _req$body = _req.body;
    var body = _req$body === undefined ? '' : _req$body;
    var date = _req.date;
    var _req$headers = _req.headers;
    var headers = _req$headers === undefined ? {} : _req$headers;

    if (!credential) credential = req.credential;

    _lodash2.default.extend(this, { url: url, body: body, method: method.toUpperCase(), credential: credential });

    var urlObj = _url2.default.parse(url);
    this.path = urlObj.pathname;
    this.host = urlObj.host;
    this.query = _querystring2.default.parse(urlObj.query) || {};
    this.date = date || this.amzDate;

    this.headers = this.prepareHeaders(headers);
  }

  _createClass(Aws4, [{
    key: 'prepareHeaders',
    value: function prepareHeaders(headers) {
      var _$extend;

      var date = this.date;
      var payloadHash = this.payloadHash;
      var host = this.host;

      return _lodash2.default.extend({}, headers, (_$extend = {
        'Content-Type': 'application/json'
      }, _defineProperty(_$extend, HeaderDate, date), _defineProperty(_$extend, HeaderContentHash, payloadHash), _defineProperty(_$extend, 'Host', host), _$extend));
    }
  }, {
    key: 'hmac',
    value: function hmac(key, string, encoding) {
      return _crypto2.default.createHmac('sha256', key).update(string, 'utf8').digest(encoding);
    }
  }, {
    key: 'hash',
    value: function hash(string) {
      var encoding = arguments.length <= 1 || arguments[1] === undefined ? 'hex' : arguments[1];

      return _crypto2.default.createHash('sha256').update(string, 'utf8').digest(encoding);
    }
  }, {
    key: 'encodeRfc3986',
    value: function encodeRfc3986(urlEncodedString) {
      return urlEncodedString.replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
      });
    }
  }, {
    key: 'sign',


    // Export
    // Return signed headers
    value: function sign() {
      var credential = this.credential.accessKey + '/' + this.credentialScope;
      var authorization = Algorithm + ' Credential=' + credential + ', SignedHeaders=' + this.signedHeaders + ', Signature=' + this.signature;

      return _lodash2.default.extend({ Authorization: authorization }, this.headers);
    }
  }, {
    key: 'region',
    get: function get() {
      if (this.req.region) return this.req.region;

      var index = this.host.indexOf('.hyper.sh');
      return index === -1 ? DefaultRegion : this.host.slice(0, index);
    }
  }, {
    key: 'amzDate',
    get: function get() {
      return new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    }
  }, {
    key: 'dateStamp',
    get: function get() {
      return this.date.slice(0, 8);
    }
  }, {
    key: 'payloadHash',
    get: function get() {
      var body = _lodash2.default.isString(this.body) ? this.body : JSON.stringify(this.body);
      return this.hash(body);
    }
  }, {
    key: 'canonicalPath',
    get: function get() {
      var _this = this;

      var pathStr = this.path;
      if (pathStr === '/') return pathStr;

      pathStr = pathStr.replace(/\/{2,}/g, '/');
      pathStr = pathStr.split('/').reduce(function (path, piece) {
        if (piece === '..') {
          path.pop();
        } else {
          path.push(_this.encodeRfc3986(_querystring2.default.escape(piece)));
        }
        return path;
      }, []).join('/');

      if (pathStr[0] === '/') pathStr = pathStr.slice(1);

      return pathStr;
    }
  }, {
    key: 'canonicalQuery',
    get: function get() {
      var query = this.query;
      if (_lodash2.default.isEmpty(query)) return '';

      return this.encodeRfc3986(_querystring2.default.stringify(_lodash2.default.keys(query).sort().reduce(function (obj, key) {
        if (!key) return obj;
        obj[key] = !Array.isArray(query[key]) ? query[key] : query[key].slice().sort();
        return obj;
      }, {})));
    }
  }, {
    key: 'canonicalHeaders',
    get: function get() {
      var _this2 = this;

      return _lodash2.default.keys(this.headers).sort(function (a, b) {
        return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
      }).map(function (key) {
        return key.toLowerCase() + ':' + _this2.headers[key];
      }).join('\n') + '\n';
    }
  }, {
    key: 'signedHeaders',
    get: function get() {
      return _lodash2.default.keys(this.headers).map(function (key) {
        return key.toLowerCase();
      }).sort().join(';');
    }
  }, {
    key: 'canonicalRequest',
    get: function get() {
      return [this.method, this.canonicalPath, this.canonicalQuery, this.canonicalHeaders, this.signedHeaders, this.payloadHash].join('\n');
    }
  }, {
    key: 'credentialScope',
    get: function get() {
      return [this.dateStamp, this.region, Service, KeyPartsRequest].join('/');
    }
  }, {
    key: 'stringToSign',
    get: function get() {
      return [Algorithm, this.date, this.credentialScope, this.hash(this.canonicalRequest)].join('\n');
    }
  }, {
    key: 'signingKey',
    get: function get() {
      var kDate = this.hmac(KeyPartsPrefix + this.credential.secretKey, this.dateStamp),
          kRegion = this.hmac(kDate, this.region),
          kService = this.hmac(kRegion, Service),
          kSigning = this.hmac(kService, KeyPartsRequest);

      return kSigning;
    }
  }, {
    key: 'signature',
    get: function get() {
      return this.hmac(this.signingKey, this.stringToSign, 'hex');
    }
  }]);

  return Aws4;
}();

exports.default = {
  sign: function sign(request, credential) {
    return new Aws4(request, credential).sign();
  }
};
module.exports = exports['default'];