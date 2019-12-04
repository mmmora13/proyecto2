//funciones
function updateOpacity() {
	document.getElementById("span-opacity").innerHTML = document.getElementById("sld-opacity").value;
	DEMLayer.setOpacity(document.getElementById("sld-opacity").value);
}

// Creación de un mapa de Leaflet
var map = L.map("mapid");

// Centro del mapa y nivel de acercamiento
var zoomInicio = L.latLng([9.9326673, -84.0787633]);
var zoomLevel = 7; //llega hasta el 20

// Definición de la vista del mapa
map.setView(zoomInicio, zoomLevel);


// Adición de capa
//L.tileLayer.provider("OpenStreetMap.Mapnik").addTo(map);
esriLayer = L.tileLayer.provider("Esri.WorldImagery").addTo(map);
osmLayer = L.tileLayer.provider("OpenStreetMap.Mapnik").addTo(map);
//openRailwayLayer = L.tileLayer.provider("OpenRailwayMap").addTo(map);

//Cargar capas consumiendo servicios WMS
var cantonesWMSLayer = L.tileLayer.wms('http://geos.snitcr.go.cr/be/IGN_5/wms?', {
	layers: 'limitecantonal_5k',
	format: 'image/png',
	transparent: true
}).addTo(map);

var baseMaps = {
	"ESRI World Imagery": esriLayer,
	"OpenStreetMap": osmLayer
};

var DEMLayer = L.imageOverlay("oripng.png", 
	[[11.992, -85.993], 
	[8.007, -82.003]], 
	{opacity:0.5}
).addTo(map);


var overlayMaps = {
	"Cantón": cantonesWMSLayer,
	"DEM": DEMLayer
};

//controles
control_layers = L.control.layers(baseMaps, overlayMaps,{position: 'topleft'}).addTo(map);	

//Escala del mapa
L.control.scale({imperial:false}).addTo(map);

//capa de provincias en GeoJSON
$.getJSON("provincias.geojson", function(geodata) {
	var layer_geojson_provincias = L.geoJson(geodata, {
		style: function(feature) {
			return {'color': "#007ca7", 'weight': 1, 'fillOpacity': 0.0}
		},
		onEachFeature: function(feature, layer) {
			var popupText = "Provincia: " + feature.properties.provincia;
			layer.bindPopup(popupText);
		}			
	}).addTo(map);
	control_layers.addOverlay(layer_geojson_provincias,'Provincia');
});	

//capa de redpasiva en GeoJSON

	var Monumento = L.layerGroup().addTo(map);
	
				function colorPuntos(d) { 
					return d == "PLACA" ? '#FF0000' :
					d == "PIN" ? '#00FF00' :					
								'#000000'; 
				};
				
				function estilo_monumentos (feature) {
					return{
						radius: 5,
						fillColor: colorPuntos(feature.properties.TIPO), 
			    		color: colorPuntos(feature.properties.TIPO), 
						weight: 1,
						opacity : 1,
						fillOpacity : 0.8
					};
				};
				function popup_monumentos (feature, layer) {
					layer.bindPopup("<div style=text-align:center><h3>"+feature.properties.NOMBRE+
			        "<h3></div><hr><table><tr><td>Lat: "+feature.properties.LATITUTD+
			        "</td></tr><tr><td>Long: "+feature.properties.LONGITUD+
			        "</td></tr></table>",
			        {minWidth: 150, maxWidth: 200});				
					};
				
				var MarkerOptions = {
				    radius: 5,
				    fillColor: "#ff7800",
				    color: "#000",
				    weight: 1,
				    opacity: 1,
				    fillOpacity: 0.8
					};
				
				//capa de redpasiva en GeoJSON
				$.getJSON("redpasiva2.geojson", function(geodata) {
					var layer_geojson_redpasiva = L.geoJson(geodata, {
						pointToLayer: function (feature, latlng) {
								return L.circleMarker(latlng, MarkerOptions);
							},
						style:estilo_monumentos,
						onEachFeature: popup_monumentos			
					}).addTo(map);
					control_layers.addOverlay(layer_geojson_redpasiva,'Red_pasiva');
				});


			function estiloSelect() {
				var miSelect = document.getElementById("tipo").value;

				$.getJSON("redpasiva2.geojson", function(geodata) {		
						//var monu1 = L.geoJSON(geodata, {
						var layer_geojson_redpasiva = L.geoJson(geodata, {
											pointToLayer: function (feature, latlng) {
													return L.circleMarker(latlng, MarkerOptions);
												}, 

											filter: function(feature, layer) {		
												 if (miSelect != "TODOS") {
													return (feature.properties.TIPO == miSelect);
												 } 
												 else {
													return true;
												 }
											},
											style:estilo_monumentos,
											onEachFeature: popup_monumentos	
									});		
						Monumento.clearLayers();
						Monumento.addLayer(layer_geojson_redpasiva);
				}); 
					}

//Estaciones GNSS
$.getJSON('estaciones_GNSS.geojson', function (geojson) {
	var layer_geojson_provincias = L.choropleth(geojson, {
		valueProperty: 'GNSS',
		scale: ['white', '#f47e1b'],
		steps: 5,
		mode: 'q',
		style: {
			color: '#fff',
			weight: 2,
			fillOpacity: 0.8
		},
		onEachFeature: function (feature, layer) {
			layer.bindPopup('Provincia ' + feature.properties.provincia + '<br>' + feature.properties.GNSS.toLocaleString() + ' GNSS red activa')
}
	}).addTo(map);
	control_layers.addOverlay(layer_geojson_provincias, 'Provincias (GNSS)');

// Add legend (don't forget to add the CSS from index.html)
	var legend = L.control({ position: 'bottomright' })
    legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend')
    var limits = layer_geojson_provincias.options.limits
    var colors = layer_geojson_provincias.options.colors
    var labels = []

    // Add min & max
    div.innerHTML = '<div class="labels"><div class="min">' + limits[0] + '</div> \
			<div class="max">' + limits[limits.length - 1] + '</div></div>'

    limits.forEach(function (limit, index) {
      labels.push('<li style="background-color: ' + colors[index] + '"></li>')
    })

    div.innerHTML += '<ul>' + labels.join('') + '</ul>'
    return div
  }
  legend.addTo(map)
});


//Marcadores personalizados
var LeafIcon = L.Icon.extend({
    options: {
        iconSize:     [25, 30],
        popupAnchor:  [-3, -40]
    }
});

var Green_EstacionesIcon = new LeafIcon({iconUrl: 'GNSS_GREEN.png'}),
	Red_EstacionesIcon = new LeafIcon({iconUrl: 'GNSS_RED.png'});
L.icon = function (options) {
    return new L.Icon(options);
};


L.marker([10.63061, -85.43788], {icon: Green_EstacionesIcon}).addTo(map).bindPopup("Estación Liberia: LIBE");
L.marker([10.32259, -84.43089], {icon: Red_EstacionesIcon}).addTo(map).bindPopup("Estación Ciudad Quesada: CIQE");
L.marker([9.99309, -83.02637], {icon: Green_EstacionesIcon}).addTo(map).bindPopup("Estación Limón: LIMN");
L.marker([8.64435, -82.94439], {icon: Green_EstacionesIcon}).addTo(map).bindPopup("Estación Ciudad Neily: NEIL");
L.marker([10.14401, -85.45501], {icon: Red_EstacionesIcon}).addTo(map).bindPopup("Estación Nicoya: NYCO");
L.marker([9.97988, -84.83214], {icon: Green_EstacionesIcon}).addTo(map).bindPopup("Estación Puntarenas: PUNT");	
L.marker([9.91968, -84.04907], {icon: Green_EstacionesIcon}).addTo(map).bindPopup("Estación Curridabat: RIDC");
L.marker([9.37314, -83.70425], {icon: Green_EstacionesIcon}).addTo(map).bindPopup("Estación San Isidro del General: SAGE");





