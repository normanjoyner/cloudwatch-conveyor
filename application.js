#!/usr/bin/env node
var fs = require("fs");
var _ = require("lodash");
var async = require("async");
var nomnom = require("nomnom");
var pkg = require([__dirname, "package"].join("/"));
var AWS = require([__dirname, "lib", "aws"].join("/"));

nomnom.script(pkg.name);
nomnom.option("version", {
    flag: true,
    abbr: "v",
    help: "print version and exit",
    callback: function(){
        return pkg.version;
    }
});

nomnom.option("backend", {
    abbr: "b",
    help: "Backend to ship metrics to",
    choices: ["graphite"],
    required: true
});

nomnom.option("graphite-host", {
    help: "Address of the graphite server",
    default: "localhost",
    required: false
});

nomnom.option("graphite-port", {
    help: "Address of the graphite server",
    default: "2003",
    required: false
});

nomnom.option("region", {
    help: "AWS Region",
    default: "us-east-1",
    required: false
});

nomnom.option("access-key-id", {
    abbr: "a",
    help: "AWS access key id",
    required: true
});

nomnom.option("secret-access-key", {
    abbr: "s",
    help: "AWS secret access key",
    required: true
});

var opts = nomnom.parse();

var backends = {};
var available_backends = fs.readdirSync([__dirname, "backends"].join("/"));
_.each(available_backends, function(backend){
    var backend_name = backend.split(".")[0];
    backends[backend_name] = require([__dirname, "backends", backend].join("/"));
});

if(opts.backend == "graphite")
    var backend = new backends[opts.backend](opts["graphite-host"], opts["graphite-port"]);

var aws = new AWS({
    region: opts.region,
    credentials: {
        accessKeyId: opts["access-key-id"],
        secretAccessKey: opts["secret-access-key"]
    }
});

aws.get_loadbalancers(function(err, loadbalancers){
    if(err){
        console.log(err.message);
        process.exit(1);
    }
    else{
        async.each(loadbalancers, function(loadbalancer, fn){
            aws.get_metrics(loadbalancer, function(metrics){
                var prefix = {
                    aws: {
                        elb: {}
                    }
                }

                var graphite_metrics = {};

                _.each(metrics, function(stats, metric){
                    graphite_metrics[metric] = {};
                    _.each(stats, function(value, stat){
                        graphite_metrics[metric][stat] = value;
                    });
                });

                prefix.aws.elb[loadbalancer] = graphite_metrics;
                backend.write(prefix, function(err){
                    if(err)
                        console.log(["Could not write metrics for", loadbalancer, "to graphite!"].join(" "));

                    return fn();
                });
            });
        }, function(){
            backend.end();
        });
    }
});
