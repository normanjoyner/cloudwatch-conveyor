var _ = require("lodash");
var flat = require("flat");
var influx = require("influx");
var util = require("util");
var Backend = require([__dirname, "..", "lib", "backend"].join("/"));

function InfluxDB(options){
    this.initialize(options.name);
    this.client = influx(options);
}

util.inherits(InfluxDB, Backend);

InfluxDB.prototype.write = function(metric, fn){
    var metric = flat.flatten(metric);
    _.each(metric, function(val, key){
        if(!_.isObject(val))
            this.client.writePoint(key, { value: val, time: new Date() }, null, {}, function(err, response){});
    }, this);
}

InfluxDB.prototype.end = function(){}

module.exports = InfluxDB;
