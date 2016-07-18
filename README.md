# hyper-aws4

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

AWS Signature Version 4 Signing Library for Hyper

## Installation
`$ npm install hyper-aws4`

## Example
```
var aws4 = require('hyper-aws4')
var fetch = require('node-fetch')

var signOption = {
  url: 'https://us-west-1.hyper.sh/version',
  method: 'GET',
  credential: {
    accessKey: '6DPLADBPWYXDUVXLX34EJXBL',
    secretKey: '2ldD1Yz0nzATl9vvagBwYTjglXBjVOWU8gV8aMm5'
  }
}

var headers = aws4.sign(signOption)

fetch(signOption.url, {method: signOption.method, headers: headers}).then(function(res) {
    return res.json();
}).then(function(json) {
    console.log(json);
});

```
## License

  MIT






[npm-image]: https://img.shields.io/npm/v/hyper-aws4.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/hyper-aws4
[travis-image]: https://img.shields.io/travis/Tim-Zhang/hyper-aws4.svg?style=flat-square
[travis-url]: https://travis-ci.org/Tim-Zhang/hyper-aws4
[coveralls-image]: https://img.shields.io/codecov/c/github/Tim-Zhang/hyper-aws4.svg?style=flat-square
[coveralls-url]: https://codecov.io/github/Tim-Zhang/hyper-aws4?branch=master
