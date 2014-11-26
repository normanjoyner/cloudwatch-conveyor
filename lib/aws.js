var _ = require("lodash");
var async = require("async");
var AWS_SDK = require("aws-sdk");

function AWS(config){
    AWS_SDK.config.update(config);
    this.cloudwatch = new AWS_SDK.CloudWatch();
    this.elb = new AWS_SDK.ELB();
}

AWS.prototype.get_loadbalancers = function(fn){
    this.elb.describeLoadBalancers(function(err, loadbalancers) {
        if(err)
            return fn(err);
        else if(!_.has(loadbalancers, "LoadBalancerDescriptions"))
            return fn(new Error("Error fetching list of loadbalancers!"));
        else
            return fn(null, _.pluck(loadbalancers.LoadBalancerDescriptions, "LoadBalancerName"));
    });
}

AWS.prototype.get_metrics = function(loadbalancer, fn){
    var self = this;
    var date = new Date();
    var end_time = new Date(date.valueOf() - (180 * 1000));
    var start_time = new Date(end_time.valueOf() - (120 * 1000));

    var metrics = {
        Latency: {
            statistics: ["Average", "Maximum"],
            unit: "Seconds"
        },

        RequestCount: {
            statistics: ["Sum"],
            unit: "Count"
        },

        HTTPCode_ELB_5XX: {
            statistics: ["Sum"],
            unit: "Count"
        }
    }

    var response = {};

    async.each(_.keys(metrics), function(metric, cb){
        var params = {
            EndTime: end_time.toISOString(),
            StartTime: start_time.toISOString(),
            Period: 60,
            Namespace: "AWS/ELB",
            MetricName: metric,
            Statistics: metrics[metric].statistics,
            Unit: metrics[metric].unit,
            Dimensions: [
                {
                    Name: "LoadBalancerName",
                    Value: loadbalancer
                }
            ]
        }

        self.cloudwatch.getMetricStatistics(params, function(err, data) {
            if(err)
                console.log(err.message)
            else if(!_.has(data, "Datapoints"))
                console.log("Invalid response");

            async.each(data.Datapoints, function(datapoint, datapoint_cb){
                var datapoint = _.omit(datapoint, ["Timestamp", "Unit"]);
                async.each(_.keys(datapoint), function(stat, stat_cb){
                    if(!_.has(response, metric))
                        response[metric] = {};

                    response[metric][stat] = datapoint[stat];
                    return stat_cb();
                }, function(){
                    return datapoint_cb();
                });
            }, function(){
                return cb();
            });
        });
    }, function(){
        return fn(response);
    });
}

module.exports = AWS;
