// ==============================================================================
// author          :Ghislain Vieilledent
// email           :ghislain.vieilledent@cirad.fr, ghislainv@gmail.com
// web             :https://ecology.ghislainv.fr
// license         :GPLv3
// ==============================================================================

// This code is accompanying the following scientific article:

// Vieilledent G., C. Vancutsem, and F. Achard. Forest refuge areas and carbon emissions
// from tropical deforestation in the 21st century.

// See also: https://forestatrisk.cirad.fr

// ===========================
// Importing forestatrisk maps
// ===========================

var fcc_123 = ee.ImageCollection("projects/forestatrisk/assets/v1_2020/fcc_123").mosaic();
var prob_2020 = ee.ImageCollection("projects/forestatrisk/assets/v1_2020/prob_2020").mosaic();
var fcc_2050 = ee.ImageCollection("projects/forestatrisk/assets/v1_2020/fcc_2050").mosaic();
var fcc_2100 = ee.ImageCollection("projects/forestatrisk/assets/v1_2020/fcc_2100").mosaic();

// ============================
// Importing boundaries features
// ============================

var bound = ee.FeatureCollection("users/pgeocaptain/pp-redd/extent_peru");

// ===========================
// Defining color palettes
// ===========================

// Function to transform RGB to hex colors
function rgb(r, g, b){
          var bin = r << 16 | g << 8 | b;
          return (function(h){
          return new Array(7-h.length).join("0")+h;
          })(bin.toString(16).toUpperCase());
}

// Palette for fcc_123
var pal_fcc_123 = [
rgb(255, 165, 0), // 1. Deforestation in 2000-2010, orange
rgb(227, 26, 28), // 2. Deforestation in 2010-2020, red
rgb(34, 139, 34), // 3. Remaining forest in 2020, green
];

// Palette for fcc_2050 and fcc_2100
var pal_fcc_proj = [
rgb(227, 26, 28), // 0. Deforestation, red
rgb(34, 139, 34), // 1. Remaining forest, green
];

// Palette for prob_2020:
// the spatial relative probability of deforestation (rescaled from 1 to 65535).
var pal_prob = ['#228B22FF', '#238B21FF', '#248B21FF', '#268B21FF', '#278B21FF', '#298B20FF', '#2A8C20FF', '#2C8C20FF', '#2D8C20FF', '#2F8C1FFF', '#308C1FFF', '#318C1FFF', '#338D1FFE', '#348D1FFF', '#368D1EFF', '#378D1EFF', '#398D1EFF', '#3A8D1EFF', '#3C8E1DFF', '#3D8E1DFF', '#3F8E1DFF', '#408E1DFF', '#418E1DFF', '#438E1CFF', '#448F1CFF', '#468F1CFF', '#478F1CFF', '#498F1BFF', '#4A8F1BFF', '#4C8F1BFF', '#4D901BFF', '#4F901BFE', '#50901AFF', '#51901AFF', '#53901AFF', '#54901AFF', '#569119FF', '#579119FF', '#599119FF', '#5A9119FF', '#5C9119FF', '#5D9218FF', '#5F9218FE', '#609218FF', '#619218FF', '#639217FF', '#649217FF', '#669317FF', '#679317FF', '#699317FF', '#6A9316FF', '#6C9316FF', '#6D9316FF', '#6F9416FF', '#709415FF', '#719415FE', '#739415FF', '#749415FF', '#769415FF', '#779514FF', '#799514FF', '#7A9514FE', '#7C9514FF', '#7D9513FF', '#7F9513FF', '#809613FF', '#819613FF', '#839613FF', '#849612FF', '#869612FF', '#879612FF', '#899712FF', '#8A9711FF', '#8C9711FF', '#8D9711FE', '#8F9711FF', '#909811FF', '#919810FF', '#939810FF', '#949810FF', '#969810FF', '#97980FFF', '#99990FFF', '#9A990FFF', '#9C990FFF', '#9D990EFF', '#9F990EFF', '#A0990EFF', '#A19A0EFF', '#A39A0EFF', '#A49A0DFF', '#A69A0DFF', '#A79A0DFF', '#A99A0DFF', '#AA9B0CFF', '#AC9B0CFF', '#AD9B0CFF', '#AF9B0CFF', '#B09B0CFF', '#B19B0BFF', '#B39C0BFF', '#B49C0BFF', '#B69C0BFF', '#B79C0AFF', '#B99C0AFF', '#BA9C0AFF', '#BC9D0AFF', '#BD9D0AFF', '#BF9D09FF', '#C09D09FF', '#C19D09FF', '#C39D09FF', '#C49E08FF', '#C69E08FF', '#C79E08FF', '#C99E08FF', '#CA9E08FF', '#CC9F07FF', '#CD9F07FF', '#CF9F07FF', '#D09F07FF', '#D19F06FF', '#D39F06FF', '#D4A006FF', '#D6A006FF', '#D7A006FF', '#D9A005FF', '#DAA005FF', '#DCA005FF', '#DDA105FF', '#DFA104FF', '#E0A104FF', '#E1A104FF', '#E3A104FF', '#E4A104FF', '#E6A203FF', '#E7A203FF', '#E9A203FF', '#EAA203FF', '#ECA202FF', '#EDA202FF', '#EFA302FF', '#F0A302FF', '#F1A302FF', '#F3A301FF', '#F4A301FF', '#F6A301FF', '#F7A401FF', '#F9A400FF', '#FAA400FF', '#FCA400FF', '#FDA400FF', '#FFA500FF', '#FEA200FF', '#FD9F01FF', '#FD9C01FF', '#FC9A02FF', '#FC9702FF', '#FB9403FF', '#FB9103FF', '#FA8F04FF', '#FA8C04FF', '#F98905FF', '#F88706FF', '#F88406FF', '#F78107FF', '#F77E07FF', '#F67C08FE', '#F67908FF', '#F57609FF', '#F57309FE', '#F4710AFF', '#F46E0AFF', '#F36B0BFF', '#F2690CFF', '#F2660CFF', '#F1630DFF', '#F1600DFF', '#F05E0EFF', '#F05B0EFF', '#EF580FFF', '#EF550FFF', '#EE5310FF', '#ED5011FF', '#ED4D11FF', '#EC4B12FF', '#EC4812FF', '#EB4513FF', '#EB4213FF', '#EA4014FF', '#EA3D14FF', '#E93A15FF', '#E93715FF', '#E83516FF', '#E73217FF', '#E72F17FF', '#E62D18FF', '#E62A18FF', '#E52719FF', '#E52419FF', '#E4221AFF', '#E41F1AFF', '#E31C1BFF', '#E31A1CFF', '#DE191BFF', '#DA181AFF', '#D5181AFF', '#D11719FF', '#CC1719FF', '#C81618FF', '#C31618FF', '#BF1517FF', '#BA1517FF', '#B61416FF', '#B21415FF', '#AD1315FF', '#A91314FF', '#A41214FF', '#A01213FE', '#9B1113FF', '#971112FF', '#921012FE', '#8E1011FF', '#890F11FF', '#850F10FF', '#810E0FFF', '#7C0E0FFF', '#780D0EFF', '#730D0EFF', '#6F0C0DFF', '#6A0C0DFF', '#660B0CFF', '#610B0CFF', '#5D0A0BFF', '#590A0AFF', '#54090AFF', '#500909FF', '#4B0809FF', '#470808FF', '#420708FF', '#3E0707FF', '#390607FF', '#350606FF', '#300506FF', '#2C0505FF', '#280404FF', '#230404FF', '#1F0303FF', '#1A0303FF', '#160202FF', '#110202FF', '#0D0101FF', '#080101FF', '#040000FF', '#000000FF'];

//Uncomment this part if you want to use Style Layer Descriptor for prob
https://developers.google.com/earth-engine/guides/image_visualization#styled-layer-descriptors
----
var sld_prob =
 '<RasterSymbolizer>' +
   '<ColorMap type="ramp" extended="true" >' +
     '<ColorMapEntry label="1" quantity="1" color="#228b22"/>' +
     '<ColorMapEntry label="39322" quantity="39322" color="#ffa500"/>' +
     '<ColorMapEntry label="52429" quantity="52429" color="#e31a1c"/>' +
     '<ColorMapEntry label="65535" quantity="65535" color="#000000"/>' +
   '</ColorMap>' +
 '</RasterSymbolizer>';
----

// ===========================
// Displaying maps
// ===========================

// Set center and zoom level
Map.centerObject(bound, 3);

// fcc_123
var param = {'min':1, 'max': 3, 'palette': pal_fcc_123};
var lname = "Past deforestation 2000-2010-2020";
Map.addLayer(fcc_123, param, lname, false);

// prob_2020
param = {'min':1, 'max': 65535, 'palette': pal_prob};
lname = "Deforestation probability 2020";
Map.addLayer(prob_2020, param, lname, true);
// Uncomment this part if you want to use Style Layer Descriptor for prob_2020
// ----
Map.addLayer(prob_2020.sldStyle(sld_prob), {}, lname, true);
// ----

// fcc_2050
param = {'min':0, 'max': 1, 'palette': pal_fcc_proj};
lname = "Projected deforestation 2020-2050";
Map.addLayer(fcc_2050, param, lname, false);

// fcc_2100
lname = "Projected deforestation 2020-2100";
Map.addLayer(fcc_2100, param, lname, false);

// Remap
var image = prob_2020.divide(32).ceil();
Map.addLayer(image, param, "Prob reclass", false);

// Clip 
Export.image.toDrive({
    image: image,
    description: 'Deforestation probability',
    folder: 'My JNR Testing',
    region: bound,
    scale: 30,
    crs: 'EPSG:4326',
    maxPixels: 1e13});

//
//******************************************************** */
var intervals =
  '<RasterSymbolizer>' +
    '<ColorMap type="intervals" extended="false" >' +
      '<ColorMapEntry color="#ffffff" quantity="252" label="252"/>' +
      '<ColorMapEntry color="#7a8737" quantity="504" label="504" />' +
      '<ColorMapEntry color="#acbe4d" quantity="756" label="756" />' +
      '<ColorMapEntry color="#0ae042" quantity="1000" label="1000" />' +
      '<ColorMapEntry color="#fff70b" quantity="1260" label="1260" />' +
      '<ColorMapEntry color="#ffaf38" quantity="1512" label="1512" />' +
      '<ColorMapEntry color="#ff641b" quantity="1764" label="1764" />' +
      '<ColorMapEntry color="#a41fd6" quantity="2016" label="2016" />' +
    '</ColorMap>' +
  '</RasterSymbolizer>';

// Add the image to the map using both the color ramp and interval schemes.
Map.addLayer(image.sldStyle(intervals), {}, 'Data');

// Seperate result into 8 burn severity classes
var thresholds = ee.Image([252, 504, 756, 1000, 1260, 1512, 1764, 2016]);
var classified = image.lt(thresholds).reduce('sum').toInt();
Map.addLayer(classified, {}, 'Risk Map classified');
//************************************************************************** 
// Function to Normalize Image
// Pixel Values should be between 0 and 1
// Formula is (x - xmin) / (xmax - xmin)
//************************************************************************** 
function normalize(image){
  var bandNames = image.bandNames();
  // Compute min and max of the image
  var minDict = image.reduceRegion({
    reducer: ee.Reducer.min(),
    geometry: geometry,
    scale: 10,
    maxPixels: 1e9,
    bestEffort: true,
    tileScale: 16
  });
  var maxDict = image.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: geometry,
    scale: 10,
    maxPixels: 1e9,
    bestEffort: true,
    tileScale: 16
  });
  var mins = ee.Image.constant(minDict.values(bandNames));
  var maxs = ee.Image.constant(maxDict.values(bandNames));

  var normalized = image.subtract(mins).divide(maxs.subtract(mins))
  return normalized
}


//************************************************************************** 
// Function to Standardize Image
// (Mean Centered Imagery with Unit Standard Deviation)
// https://365datascience.com/tutorials/statistics-tutorials/standardization/
//************************************************************************** 
function standardize(image){
  var bandNames = image.bandNames();
  // Mean center the data to enable a faster covariance reducer
  // and an SD stretch of the principal components.
  var meanDict = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 10,
    maxPixels: 1e9,
    bestEffort: true,
    tileScale: 16
  });
  var means = ee.Image.constant(meanDict.values(bandNames));
  var centered = image.subtract(means)
  
  var stdDevDict = image.reduceRegion({
    reducer: ee.Reducer.stdDev(),
    geometry: geometry,
    scale: 10,
    maxPixels: 1e9,
    bestEffort: true,
    tileScale: 16
  });
  var stddevs = ee.Image.constant(stdDevDict.values(bandNames));

  var standardized = centered.divide(stddevs);
   
  return standardized
}

var standardizedImage = standardize(image)
var normalizedImage = normalize(image)


Map.addLayer(image, 
  {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3, gamma: 1.2}, 'Original Image');
Map.addLayer(normalizedImage,
  {bands: ['B4', 'B3', 'B2'], min: 0, max: 1, gamma: 1.2}, 'Normalized Image');
Map.addLayer(standardizedImage,
  {bands: ['B4', 'B3', 'B2'], min: -1, max: 2, gamma: 1.2}, 'Standarized Image');
Map.centerObject(geometry)

// Verify Normalization

var beforeDict = image.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: geometry,
  scale: 10,
  maxPixels: 1e9,
  bestEffort: true,
  tileScale: 16
});

var afterDict = normalizedImage.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: geometry,
  scale: 10,
  maxPixels: 1e9,
  bestEffort: true,
  tileScale: 16
});

print('Original Image Min/Max', beforeDict)
print('Normalized Image Min/Max', afterDict)

// Verify Standadization
// Verify that the means are 0 and standard deviations are 1
var beforeDict = image.reduceRegion({
  reducer: ee.Reducer.mean().combine({
      reducer2: ee.Reducer.stdDev(), sharedInputs: true}),
  geometry: geometry,
  scale: 10,
  maxPixels: 1e9,
  bestEffort: true,
  tileScale: 16
});

var resultDict = standardizedImage.reduceRegion({
  reducer: ee.Reducer.mean().combine({
      reducer2: ee.Reducer.stdDev(), sharedInputs: true}),
  geometry: geometry,
  scale: 10,
  maxPixels: 1e9,
  bestEffort: true,
  tileScale: 16
});
// Means are very small franctions close to 0
// Round them off to 2 decimals
var afterDict = resultDict.map(function(key, value) {
  return ee.Number(value).format('%.2f')
})

print('Original Image Mean/StdDev', beforeDict)
print('Standadized Image Mean/StdDev', afterDict)
