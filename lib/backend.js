function Backend(){};

Backend.prototype.initialize = function(name){
    this.name = name;
}

Backend.prototype.write = function(fn){
    return fn();
}

Backend.prototype.end = function(fn){
    return fn();
}

module.exports = Backend;
