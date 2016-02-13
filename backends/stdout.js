var _ = require("lodash");
var flat = require("flat");
var util = require("util");
var Backend = require([__dirname, "..", "lib", "backend"].join("/"));

function Stdout(options){
    this.initialize(options.name);
}

util.inherits(Stdout, Backend);

Stdout.prototype.write = function(metric, fn){
    var metric = flat.flatten(metric);
    _.each(metric, function(val, key){
        if(!_.isObject(val))
            console.log(key, val);
    });
}

Stdout.prototype.end = function(){}

module.exports = Stdout;
