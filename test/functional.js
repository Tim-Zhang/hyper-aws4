const fetch = require('node-fetch')
const aws4  = require('../dst')

// Replace this demo credential with yours before run the test
const credential = {
  accessKey: 'L8KYL2ZLVLZ8TOR8NPYA9RW5',
  secretKey: 'J7KGB9bn75di1yo6XmGzAiGodO8a8eDikgGBLgje'
}

const signOptionGet = {
  url: 'https://us-west-1.hyper.sh/version',
  credential: credential
}

const signOptionPost = {
  url: 'https://us-west-1.hyper.sh/images/load',
  method: 'POST',
  credential: credential,
  body: {"fromSrc":"http://image-tarball.s3.amazonaws.com/test/public/helloworld.tar.gz","quiet":false}
}

fetch.Promise = require('bluebird')

describe('lib/aws4', function() {
  describe('sign', function() {
    it('get version should return 200', function(done) {
      const headers = aws4.sign(signOptionGet)

      fetch(signOptionGet.url, {method: signOptionGet.method, headers: headers}).then(function(res) {
        if(res.status === 200) return done()
        done(new Error(res.status))
      })
    })

    it('load image should return 200', function(done) {
      const headers = aws4.sign(signOptionPost)
      const body = JSON.stringify(signOptionPost.body)

      fetch(signOptionPost.url, {method: signOptionPost.method, headers: headers, body: body}).then(function(res) {
        if(res.status === 200) return done()
        done(new Error(res.status))
      })
    })
  })
})