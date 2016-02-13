module.exports = {
    influxdb: require([__dirname, "influxdb"].join("/")),
    graphite: require([__dirname, "graphite"].join("/")),
    stdout: require([__dirname, "stdout"].join("/"))
}
