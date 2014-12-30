var fs = require('fs');

var sm = require('sphericalmercator'),
  merc = new sm({size:256});

// inherit from base controller
// params: 
//  - koop, an instance of koop for access to shared code
//  - Climate, the provider model that is passed in via the koop-server/index.js:register method
var Controller = function( Climate, BaseController ){

  var controller = {};
  controller.__proto__ = BaseController();

  controller.list = function(req, res){
    res.json( { types: ['temperature']} );
  };

  controller.find = function(req, res){
    Climate.find(req.params.type, req.query, function(err, data){
      if (err) {
        res.send( err, 404);
      } else {
        res.json( data );
      }
    });
  };

  controller.featureserver = function( req, res ){
    var callback = req.query.callback;
    delete req.query.callback;

    Climate.find(req.params.type, function(err, geojson){
      if (err) {
        res.send( err, 500);
      } else {
        // Get the item 
        // pass to the shared logic for FeatureService routing
        controller.processFeatureServer( req, res, err, geojson, callback);
      }
    });
  };

  controller.tiles = function( req, res ){
    var callback = req.query.callback;
    delete req.query.callback;
    
    var type = req.params.type;
    req.params.key = type;

    var _send = function( err, data ){
        if (req.query.style){
          req.params.style = req.query.style;
        }
        Climate.tileGet( req.params, data[0], function(err, tile){
          if ( req.params.format == 'png'){
            res.sendfile( tile );
          } else {
            if ( callback ){
              res.send( callback + '(' + JSON.stringify( tile ) + ')' );
            } else {
              if (typeof tile == 'string'){
                res.sendfile( tile );
              } else {
                res.json( tile );
              }
            }
          }
        });
    }

    // build the geometry from z,x,y
    var bounds = merc.bbox( req.params.x, req.params.y, req.params.z );
    req.query.geometry = {
        xmin: bounds[0],
        ymin: bounds[1],
        xmax: bounds[2],
        ymax: bounds[3],
        spatialReference: { wkid: 4326 }
    };

    var _sendImmediate = function( file ){
      if ( req.params.format == 'png'){
        res.sendfile( file );
      } else {
        fs.readFile(file, function(err, data){
          if ( callback ){
            res.send( callback + '(' + data + ')' );
          } else {
            res.json( JSON.parse( data ) );
          }
        })
      }
    };

      var file = Climate.cacheDir() + 'tiles/';
        file += type + '/' + req.params.format;
        file += '/' + req.params.z + '/' + req.params.x + '/' + req.params.y + '.' + req.params.format;
     
      if ( fs.existsSync( file ) ) {
        _sendImmediate( file );
      } else {
        Climate.find( type, req.query, _send );
      }
  };

  return controller;

};

module.exports = Controller;
