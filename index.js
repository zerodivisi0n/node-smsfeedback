/**
 * SMSFeedback message sender
 * API doc: http://www.smsfeedback.ru/smsapi/
 */

var request = require('request');

var SERVER_URL = 'https://api.smsfeedback.ru/messages/v2';
var SEND_ENDPOINT = '/send';
var MESSAGE_STATUS_ENDPOINT = '/status';
var STATUS_QUEUE_ENDPOINT = '/statusQueue';
var BALANCE_ENDPOINT = '/balance';
var SENDERS_ENDPOINT = '/senders';

/**
 * SMS Sender
 *
 * @param {string} username
 * @param {string} password
 * @param {string} queueName message queue name
 */
function Sender (username, password, queueName) {
  this._username = username;
  this._password = password;
  this._queueName = queueName;
}

/**
 * Send sms message
 *
 * @param {string} from from phone number
 * @param {string} to to phone number
 * @param {string} text message text
 * @param {function} cb callback method
 */
Sender.prototype.send = function (from, to, text, cb) {
  this._request(SEND_ENDPOINT, {
    phone: to,
    text: text,
    sender: from,
    statusQueueName: this._queueName
  }, function (err, res, body) {
    if (err) return cb(err);
    var parts = body.split(';');
    if (parts[0] !== 'accepted') return cb(parts[0]);
    return cb(null, parts[1]);
  })
}

/**
 * Get message status
 *
 * @param {string} messageId message id
 * @param {function} cb callback method
 */
Sender.prototype.getMessageStatus = function (messageId, cb) {
  this._request(MESSAGE_STATUS_ENDPOINT, {id: messageId}, function (err, res, body) {
    if (err) return cb(err);
    var parts = body.split(';')
    cb(null, parts[1]);
  })
}

/**
 * List messages in queue
 *
 * @param {number} limit [optional] limit messages
 * @param {function} cb callback method
 */
Sender.prototype.listQueue = function (limit, cb) {
  if (typeof limit === 'function') {
    cb = limit;
    limit = 0;
  }
  limit = limit || 100;  // default limit
  this._request(STATUS_QUEUE_ENDPOINT, {
    statusQueueName: this._queueName,
    limit: limit
  }, function (err, res, body) {
    if (err) return cb(err);
    var results = [];
    body.split('\n').forEach(function (line) {
      var parts = line.split(';');
      results.push({id: parts[0], status: parts[1]});
    })
    cb(null, results);
  });
}

/**
 * Get account balance
 *
 * @param {function) cb callback method
 */
Sender.prototype.getBalance = function (cb) {
  this._request(BALANCE_ENDPOINT, {}, function (err, res, body) {
    if (err) return cb(err);
    var results = [];
    body.split('\n').forEach(function (line) {
      var parts = line.split(';');
      results.push({type: parts[0], balance: parts[1], credit: parts[2]});
    })
    cb(null, results);
  })
}

/**
 * List of available senders
 *
 * @param {function} cb callback method
 */
Sender.prototype.listSenders = function (cb) {
  this._request(SENDERS_ENDPOINT, {}, function (err, res, body) {
    if (err) return cb(err);
    var results = [];
    body.split('\n').forEach(function (line) {
      var parts = line.split(';');
      results.push({name: parts[0], status: parts[1], note: parts[2]});
    })
    cb(null, results);
  })
}

/**
 * Service request helper
 *
 * @param {string} endpoint
 */
Sender.prototype._request = function (endpoint, query, cb) {
  request.get({
    uri: SERVER_URL + endpoint,
    qs: query,
    auth: {
      username: this._username,
      password: this._password
    }
  }, cb);
}

exports = module.exports = Sender;
