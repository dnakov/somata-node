// Generated by CoffeeScript 1.7.1
(function() {
  var Binding, Registry, RegistryConnection, Service, VERBOSE, getHost, getHostname, log, os, randomPort, randomString, util, zmq, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  os = require('os');

  util = require('util');

  zmq = require('zmq');

  _ref = require('./helpers'), log = _ref.log, randomString = _ref.randomString;

  _ = require('underscore');

  Binding = require('./binding');

  Registry = require('./registry');

  RegistryConnection = require('./registry-connection');

  VERBOSE = false;

  getHostname = os.hostname;

  getHost = function() {
    return _.chain(os.networkInterfaces()).flatten().filter(function(i) {
      return i.family === 'IPv4' && !i.internal;
    }).pluck('address').first().value();
  };

  randomPort = function() {
    return 10000 + Math.floor(Math.random() * 50000);
  };

  Service = (function() {
    Service.prototype.methods = {};

    function Service(name, options) {
      var _base, _base1, _base2, _base3;
      this.name = name;
      this.options = options != null ? options : {};
      this.handleClientMessage = __bind(this.handleClientMessage, this);
      this.handleRegistryMessage = __bind(this.handleRegistryMessage, this);
      if (this.options.methods != null) {
        _.extend(this.methods, this.options.methods);
      }
      (_base = this.options).binding || (_base.binding = {});
      (_base1 = this.options.binding).host || (_base1.host = getHost());
      (_base2 = this.options.binding).port || (_base2.port = randomPort());
      (_base3 = this.options).registry || (_base3.registry = Registry.DEFAULTS);
      this.service_binding = new Binding(this.options.binding);
      this.bind();
      this.registry_connection = new RegistryConnection(this.options.registry);
      this.register();
    }

    Service.prototype.bind = function() {
      return this.service_binding.handleMessage = this.handleClientMessage.bind(this);
    };

    Service.prototype.register = function() {
      this.registry_connection.register({
        name: this.name,
        binding: this.options.binding
      });
      return this.registry_connection.handleMessage = this.handleRegistryMessage.bind(this);
    };

    Service.prototype.handleRegistryMessage = function(message) {
      if (VERBOSE) {
        log("<registry>: " + (util.inspect(message, {
          depth: null
        })));
      }
      if (message.command === 'register?') {
        return this.register();
      }
    };

    Service.prototype.handleClientMessage = function(client_id, message) {
      var _method;
      if (VERBOSE) {
        log("<" + client_id + ">: " + (util.inspect(message, {
          depth: null
        })));
      }
      if (_method = this.methods[message.method]) {
        if (VERBOSE) {
          log('Executing ' + message.method);
        }
        return _method.apply(null, __slice.call(message.args).concat([(function(_this) {
          return function(err, response) {
            return _this.service_binding.send(client_id, {
              id: message.id,
              type: 'response',
              response: response
            });
          };
        })(this)]));
      } else {
        return log.i('No method ' + message.method);
      }
    };

    return Service;

  })();

  module.exports = Service;

}).call(this);