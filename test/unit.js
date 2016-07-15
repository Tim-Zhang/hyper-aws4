const _     = require('lodash')
const aws4  = require('../dst')

const credential = { // Fake
  accessKey: '5O4KAD63BNZBF9KON6BVP655',
  secretKey: '4XrYLX30vmVsWz3w3orGrtymaXYaQ93SBPOmKowM'
}

const signOptionGet = {
  url: 'https://us-west-1.hyper.sh/version',
  date: '20160614T100221Z',
  credential
}

const signResultGet = {
  'Content-Type': 'application/json',
  'X-Hyper-Date': '20160614T100221Z',
  'X-Hyper-Content-Sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  Host: 'us-west-1.hyper.sh',
  Authorization: 'HYPER-HMAC-SHA256 Credential=5O4KAD63BNZBF9KON6BVP655/20160614/us-west-1/hyper/hyper_request, SignedHeaders=content-type;host;x-hyper-content-sha256;x-hyper-date, Signature=54a3cce3b25f6efc6a0da17ac0bf3039d5281684a8a8ee082d180819ac02fb6a'
}

const signOptionPost = {
  url: 'https://us-west-1.hyper.sh/images/load',
  method: 'POST',
  date: '20160709T034006Z',
  body: {"fromSrc":"http://image-tarball.s3.amazonaws.com/test/public/helloworld.tar.gz","quiet":false},
  credential
}

const signResultPost = {
  'Content-Type': 'application/json',
  'X-Hyper-Date': '20160709T034006Z',
  'X-Hyper-Content-Sha256': '9bdf7beca75cb687af34a54dc83e694532ebf739d65861205a29057676739f7e',
  Host: 'us-west-1.hyper.sh',
  Authorization: 'HYPER-HMAC-SHA256 Credential=5O4KAD63BNZBF9KON6BVP655/20160709/us-west-1/hyper/hyper_request, SignedHeaders=content-type;host;x-hyper-content-sha256;x-hyper-date, Signature=2e90b01cd531a2189f3253d2312f4fc94bc9612fcc039c36513352261ca997f6'
}

describe('lib/aws4', () => {
  describe('sign', () => {
    it('header with GET method should sign correct', () => {
      aws4.sign(signOptionGet).should.match(result => _.isEqual(result, signResultGet))
      // console.log(aws4.sign(signOptionGet))
    })

    it('header with POST method should sign correct', () => {
      aws4.sign(signOptionPost).should.match(result => _.isEqual(result, signResultPost))
      // console.log(aws4.sign(signOptionPost))
    })
  })
})