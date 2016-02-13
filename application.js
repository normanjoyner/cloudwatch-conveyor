#!/usr/bin/env node
var fs = require("fs");
var _ = require("lodash");
var async = require("async");
var pkg = require([__dirname, "package"].join("/"));
var AWS = require([__dirname, "lib", "aws"].join("/"));
var backends = require([__dirname, "backends"].join("/"));
var schedule = require("node-schedule");

var config = {
    aws: {
        region: process.env.AWS_REGION || "us-east-1",
        access_key_id: process.env.AWS_ACCESS_KEY_ID,
        secret_access_key: process.env.AWS_SECRET_ACCESS_KEY
    },
    backend: {
        name: process.env.BACKEND_NAME || "stdout"
    }
}

if(config.backend.name == "graphite"){
    config.backend.host = process.env.GRAPHITE_HOST || "localhost";
    config.backend.port = process.env.GRAPHITE_PORT || 2003;
}

if(config.backend.name == "influxdb"){
    config.backend.host = process.env.INFLUXDB_HOST || "localhost";
    config.backend.port = process.env.INFLUXDB_PORT || 8086;
    config.backend.username = process.env.INFLUXDB_USERNAME;
    config.backend.password = process.env.INFLUXDB_PASSWORD;
    config.backend.database = process.env.INFLUXDB_DATABASE || "elb-metrics";
}

var backend = new backends[config.backend.name](config.backend);

var aws = new AWS({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.access_key_id,
        secretAccessKey: config.aws.secret_access_key
    }
});

schedule.scheduleJob("0 * * * * *", function(){
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

                    var backend_metrics = {};

                    _.each(metrics, function(stats, metric){
                        backend_metrics[metric] = {};
                        _.each(stats, function(value, stat){
                            backend_metrics[metric][stat] = value;
                        });
                    });

                    prefix.aws.elb[loadbalancer] = backend_metrics;
                    backend.write(prefix, function(err){
                        if(err)
                            console.log(["Could not write metrics for", loadbalancer, "to", config.backend.name].join(" "));

                        return fn();
                    });
                });
            }, function(){});
        }
    });
});

