module.exports = {
  'get /climate': 'list',
  'get /climate/:type': 'find',
  'get /climate/:type/FeatureServer/:layer/:method': 'featureserver',
  'get /climate/:type/FeatureServer/:layer': 'featureserver',
  'get /climate/:type/FeatureServer': 'featureserver',
  'get /climate/:type/tiles/:z/:x/:y.:format': 'tiles'
}
