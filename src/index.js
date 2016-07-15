import _            from 'lodash'
import crypto       from 'crypto'
import urllib       from 'url'
import querystring  from 'querystring'

const SignedHeaders     = 'content-type;host;x-hyper-content-sha256;x-hyper-date'
const HeaderContentHash = 'X-Hyper-Content-Sha256'
const Algorithm         = 'HYPER-HMAC-SHA256'
const Region            = 'us-west-1'
const Service           = 'hyper'
const KeyPartsRequest   = 'hyper_request'
const KeyPartsPrefix    = 'HYPER'

class Aws4 {
  constructor({url, method = 'GET', body = '', credential, date}) {
    _.extend(this, {url, body, method: method.toUpperCase(), credential})

    const urlObj  = urllib.parse(url)
    this.path     = urlObj.pathname
    this.host     = urlObj.host
    this.query    = querystring.parse(urlObj.query) || {}

    this.date = date || this.amzDate()
  }

  hmac(key, string, encoding) {
    return crypto.createHmac('sha256', key).update(string, 'utf8').digest(encoding)
  }

  hash(string, encoding = 'hex') {
    return crypto.createHash('sha256').update(string, 'utf8').digest(encoding)
  }

  encodeRfc3986(urlEncodedString) {
    return urlEncodedString.replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase()
    })
  }

  amzDate() {
    return (new Date()).toISOString().replace(/[:\-]|\.\d{3}/g, '')
  }

  dateStamp() {
    return this.date.slice(0, 8)
  }

  payloadHash() {
    const body = _.isString(this.body) ? this.body : JSON.stringify(this.body)
    return this.hash(body)
  }

  canonicalPath() {
    let pathStr = this.path
    if (pathStr === '/') return pathStr

    pathStr = pathStr.replace(/\/{2,}/g, '/')
    pathStr = pathStr.split('/').reduce((path, piece) => {
      if (piece === '..') {
        path.pop()
      } else {
        path.push(this.encodeRfc3986(querystring.escape(piece)))
      }
      return path
    }, []).join('/')

    if (pathStr[0] === '/') pathStr = pathStr.slice(1)

    return pathStr
  }

  canonicalQuery() {
    const query = this.query
    if (_.isEmpty(query)) return ''

    return this.encodeRfc3986(querystring.stringify(Object.keys(query).sort().reduce((obj, key) => {
      if (!key) return obj
      obj[key] = !Array.isArray(query[key]) ? query[key] : query[key].slice().sort()
      return obj
    }, {})))
  }

  canonicalHeaders() {
    return 'content-type:application/json'
      + '\nhost:' + this.host
      + '\nx-hyper-content-sha256:' +  this.payloadHash()
      + '\nx-hyper-date:' + this.date + '\n'
  }

  canonicalRequest() {
    return [
      this.method,
      this.canonicalPath(),
      this.canonicalQuery(),
      this.canonicalHeaders(),
      SignedHeaders,
      this.payloadHash(),
    ].join('\n')
  }

  credentialScope() {
    return [
      this.dateStamp(),
      Region,
      Service,
      KeyPartsRequest
    ].join('/')
  }

  stringToSign() {
    return [
      Algorithm,
      this.date,
      this.credentialScope(),
      this.hash(this.canonicalRequest())
    ].join('\n')
  }

  signingKey() {
    const kDate     = this.hmac(KeyPartsPrefix + this.credential.secretKey, this.dateStamp()),
          kRegion   = this.hmac(kDate, Region),
          kService  = this.hmac(kRegion, Service),
          kSigning  = this.hmac(kService, KeyPartsRequest)

    return kSigning
  }

  signature() {
    return this.hmac(this.signingKey(), this.stringToSign(), 'hex')
  }

  // Export
  // Return signed headers
  sign() {
    const date = this.date
    const payloadHash = this.payloadHash()
    const host = this.host
    const credential = `${this.credential.accessKey}/${this.credentialScope()}`
    const authorization = `${Algorithm} Credential=${credential}, SignedHeaders=${SignedHeaders}, Signature=${this.signature()}`

    return {
      'Content-Type'      : 'application/json',
      'X-Hyper-Date'      : date,
      [HeaderContentHash] : payloadHash,
      'Host'              : host,
      'Authorization'     : authorization,
    }
  }
}


export default {
  sign(options) {
    return (new Aws4(options)).sign()
  }
}