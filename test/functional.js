const fetch = require('node-fetch')
const aws4  = require('../dst')

const credential = {
  accessKey: 'L8PKNB9XYYVO053LWL85JR6K',
  secretKey: '48KDk6y1bk1F7PgoRBWwzh0q7K85dyWt8e1KWZwk'
}

const signOptionGet = {
  url: 'https://us-west-1.hyper.sh/version',
  credential
}

const signOptionPost = {
  url: 'https://us-west-1.hyper.sh/images/load',
  method: 'POST',
  credential,
  body: {"fromSrc":"http://image-tarball.s3.amazonaws.com/test/public/helloworld.tar.gz","quiet":false}
}

describe('lib/aws4', () => {
  describe('sign', () => {
    it('get version should return 200', (done) => {
      const headers = aws4.sign(signOptionGet)
      fetch(signOptionGet.url, {method: signOptionGet.method, headers}).then(function(res) {
        if(res.status === 200) return done()
        done(new Error(res.status))
      })
    })

    it('load image should return 200', (done) => {
      const headers = aws4.sign(signOptionPost)
      fetch(signOptionPost.url, {method: signOptionPost.method, headers, body: JSON.stringify(signOptionPost.body)}).then(function(res) {
        if(res.status === 200) return done()
        done(new Error(res.status))
      })
    })
  })
})