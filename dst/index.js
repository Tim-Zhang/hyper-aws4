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

var SignedHeaders = 'content-type;host;x-hyper-content-sha256;x-hyper-date';
var HeaderContentHash = 'X-Hyper-Content-Sha256';
var Algorithm = 'HYPER-HMAC-SHA256';
var Region = 'us-west-1';
var Service = 'hyper';
var KeyPartsRequest = 'hyper_request';
var KeyPartsPrefix = 'HYPER';

var Aws4 = function () {
  function Aws4(_ref) {
    var url = _ref.url;
    var _ref$method = _ref.method;
    var method = _ref$method === undefined ? 'GET' : _ref$method;
    var _ref$body = _ref.body;
    var body = _ref$body === undefined ? '' : _ref$body;
    var credential = _ref.credential;
    var date = _ref.date;

    _classCallCheck(this, Aws4);

    _lodash2.default.extend(this, { url: url, body: body, method: method.toUpperCase(), credential: credential });

    var urlObj = _url2.default.parse(url);
    this.path = urlObj.pathname;
    this.host = urlObj.host;
    this.query = _querystring2.default.parse(urlObj.query) || {};

    this.date = date || this.amzDate();
  }

  _createClass(Aws4, [{
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
    key: 'amzDate',
    value: function amzDate() {
      return new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    }
  }, {
    key: 'dateStamp',
    value: function dateStamp() {
      return this.date.slice(0, 8);
    }
  }, {
    key: 'payloadHash',
    value: function payloadHash() {
      var body = _lodash2.default.isString(this.body) ? this.body : JSON.stringify(this.body);
      return this.hash(body);
    }
  }, {
    key: 'canonicalPath',
    value: function canonicalPath() {
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
    value: function canonicalQuery() {
      var query = this.query;
      if (_lodash2.default.isEmpty(query)) return '';

      return this.encodeRfc3986(_querystring2.default.stringify(Object.keys(query).sort().reduce(function (obj, key) {
        if (!key) return obj;
        obj[key] = !Array.isArray(query[key]) ? query[key] : query[key].slice().sort();
        return obj;
      }, {})));
    }
  }, {
    key: 'canonicalHeaders',
    value: function canonicalHeaders() {
      return 'content-type:application/json' + '\nhost:' + this.host + '\nx-hyper-content-sha256:' + this.payloadHash() + '\nx-hyper-date:' + this.date + '\n';
    }
  }, {
    key: 'canonicalRequest',
    value: function canonicalRequest() {
      return [this.method, this.canonicalPath(), this.canonicalQuery(), this.canonicalHeaders(), SignedHeaders, this.payloadHash()].join('\n');
    }
  }, {
    key: 'credentialScope',
    value: function credentialScope() {
      return [this.dateStamp(), Region, Service, KeyPartsRequest].join('/');
    }
  }, {
    key: 'stringToSign',
    value: function stringToSign() {
      return [Algorithm, this.date, this.credentialScope(), this.hash(this.canonicalRequest())].join('\n');
    }
  }, {
    key: 'signingKey',
    value: function signingKey() {
      var kDate = this.hmac(KeyPartsPrefix + this.credential.secretKey, this.dateStamp()),
          kRegion = this.hmac(kDate, Region),
          kService = this.hmac(kRegion, Service),
          kSigning = this.hmac(kService, KeyPartsRequest);

      return kSigning;
    }
  }, {
    key: 'signature',
    value: function signature() {
      return this.hmac(this.signingKey(), this.stringToSign(), 'hex');
    }

    // Export
    // Return signed headers

  }, {
    key: 'sign',
    value: function sign() {
      var _ref2;

      var date = this.date;
      var payloadHash = this.payloadHash();
      var host = this.host;
      var credential = this.credential.accessKey + '/' + this.credentialScope();
      var authorization = Algorithm + ' Credential=' + credential + ', SignedHeaders=' + SignedHeaders + ', Signature=' + this.signature();

      return _ref2 = {
        'Content-Type': 'application/json',
        'X-Hyper-Date': date
      }, _defineProperty(_ref2, HeaderContentHash, payloadHash), _defineProperty(_ref2, 'Host', host), _defineProperty(_ref2, 'Authorization', authorization), _ref2;
    }
  }]);

  return Aws4;
}();

exports.default = {
  sign: function sign(options) {
    return new Aws4(options).sign();
  }
};
module.exports = exports['default'];