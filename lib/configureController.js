var BaseController = require('./baseController').BaseController;
var ConfigureController = function(helpers, arguments, environment, mainController) {
    BaseController.call(this, helpers, arguments, environment);
    this.route = "configure";
    this.mainController = mainController;
};

ConfigureController.prototype = Object.create(BaseController.prototype);
ConfigureController.prototype.constructor = ConfigureController;

ConfigureController.prototype.elasticsearch = function(callback) {
    console.log("Configuring elasticsearch...");
    var post_options = {
        host: this.environment.elasticsearch_host===undefined?'127.0.0.1':this.environment.elasticsearch_host,
        port: this.environment.elasticsearch_port===undefined?'9200':this.environment.elasticsearch_port,
        path: '/default',
        method: 'POST'
    };
    var post_data = JSON.stringify({
        "mappings": {
            "_default_": {
                "dynamic_templates": [
                    {
                    geolocation_template: {
                        mapping: {
                        type: "geo_point"
                        },
                        match: "*_geolocation",
                        match_mappping_type: "geo_point"
                        }
                    },
                    {
                        "string_template": {
                            "mapping": {
                                "index": "not_analyzed",
                                "type": "string"
                            },
                            "match_mapping_type": "string",
                            "match": "*"
                        }
                    },
                    {
                    object_template: {
                        mapping: {
                        index: "not_analyzed",
                        type: "object"
                        },
                        match: "*",
                        match_mapping_type: "object"
                        }
                    }                
                ]
            }
        },
        "settings": {
            "index": {
                "number_of_replicas": "1",
                "number_of_shards": "1"
            }
        }
    });
    this.helpers.doRequest(post_options,post_data, function(chunk) {
        console.log('Response: ' + JSON.stringify(chunk));
        if(callback!==undefined) callback();
    });
};

exports.ConfigureController = ConfigureController;