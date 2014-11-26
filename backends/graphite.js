var graphite = require("graphite");
var util = require("util");
var Backend = require([__dirname, "..", "lib", "backend"].join("/"));

function Graphite(host, port){
    this.initialize("graphite");
    this.client = graphite.createClient(["plaintext://", host, ":", port, "/"].join(""));
}

util.inherits(Graphite, Backend);

Graphite.prototype.write = function(metric, fn){
    this.client.write(metric, fn);
}

Graphite.prototype.end = function(){
    this.client.end();
}

module.exports = Graphite;
