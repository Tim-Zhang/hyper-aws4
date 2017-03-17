import _            from 'lodash'
import crypto       from 'crypto'
import urllib       from 'url'
import querystring  from 'querystring'

const HeaderDate        = 'X-Hyper-Date'
const HeaderContentHash = 'X-Hyper-Content-Sha256'
const Algorithm         = 'HYPER-HMAC-SHA256'
const DefaultRegion     = 'us-west-1'
const Service           = 'hyper'
const KeyPartsRequest   = 'hyper_request'
const KeyPartsPrefix    = 'HYPER'

class Aws4 {
  constructor(req, credential) {
    const {url, method = 'GET', body = '', date, headers = {}} = req
    if (!credential) credential = req.credential

    _.extend(this, {url, body, method: method.toUpperCase(), credential})

    const urlObj  = urllib.parse(url)
    this.path     = urlObj.pathname
    this.host     = urlObj.host
    this.query    = querystring.parse(urlObj.query) || {}
    this.date     = date || this.amzDate

    this.headers  = this.prepareHeaders(headers)
  }

  prepareHeaders(headers) {
    const date = this.date
    const payloadHash = this.payloadHash
    const host = this.host

    return _.extend({
      'Content-Type'      : 'application/json',
      [HeaderDate]        : date,
      [HeaderContentHash] : payloadHash,
      Host                : host,
    }, headers)
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

  get region() {
    const index = this.host.indexOf('.hyper.sh')
    return index === -1 ? DefaultRegion : this.host.slice(0, index)
  }

  get amzDate() {
    return (new Date()).toISOString().replace(/[:\-]|\.\d{3}/g, '')
  }

  get dateStamp() {
    return this.date.slice(0, 8)
  }

  get payloadHash() {
    const body = _.isString(this.body) ? this.body : JSON.stringify(this.body)
    return this.hash(body)
  }

  get canonicalPath() {
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

  get canonicalQuery() {
    const query = this.query
    if (_.isEmpty(query)) return ''

    return this.encodeRfc3986(querystring.stringify(_.keys(query).sort().reduce((obj, key) => {
      if (!key) return obj
      obj[key] = !Array.isArray(query[key]) ? query[key] : query[key].slice().sort()
      return obj
    }, {})))
  }

  get canonicalHeaders() {
    return _.keys(this.headers)
      .sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
      .map(key => `${key.toLowerCase()}:${this.headers[key]}`)
      .join('\n') + '\n'
  }

  get signedHeaders() {
    return _.keys(this.headers)
      .map(key => key.toLowerCase())
      .sort()
      .join(';')
  }

  get canonicalRequest() {
    return [
      this.method,
      this.canonicalPath,
      this.canonicalQuery,
      this.canonicalHeaders,
      this.signedHeaders,
      this.payloadHash,
    ].join('\n')
  }

  get credentialScope() {
    return [
      this.dateStamp,
      this.region,
      Service,
      KeyPartsRequest
    ].join('/')
  }

  get stringToSign() {
    return [
      Algorithm,
      this.date,
      this.credentialScope,
      this.hash(this.canonicalRequest)
    ].join('\n')
  }

  get signingKey() {
    const kDate     = this.hmac(KeyPartsPrefix + this.credential.secretKey, this.dateStamp),
          kRegion   = this.hmac(kDate, this.region),
          kService  = this.hmac(kRegion, Service),
          kSigning  = this.hmac(kService, KeyPartsRequest)

    return kSigning
  }

  get signature() {
    return this.hmac(this.signingKey, this.stringToSign, 'hex')
  }

  // Export
  // Return signed headers
  sign() {
    const credential = `${this.credential.accessKey}/${this.credentialScope}`
    const authorization = `${Algorithm} Credential=${credential}, SignedHeaders=${this.signedHeaders}, Signature=${this.signature}`

    return _.extend({Authorization: authorization}, this.headers)
  }
}


export default {
  sign(request, credential) {
    return (new Aws4(request, credential)).sign()
  }
}