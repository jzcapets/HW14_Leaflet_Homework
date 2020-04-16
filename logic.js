//allow the user to choose the earthquake magnitude to view
var dd = d3.select(".magnitude_selector")
var thismap = d3.select(".mapcontainer")

//function to run when dropddown is changed
function updatemap(){
	
	var ddval = dd.node().value
	
	//change the value for "time" passed into our plotting function
	if (ddval == "Past 30 Days") {
		time = "month";
	}else if (ddval == "Past 7 Days") {
		 time = "week";
	}else if (ddval = "Past Day") {
		time = "day";
	}else if (ddval = "Past Hour") {
		time = "hour"
	}else {
		time = "month"
	};
	
	console.log(`Redrawing map with data from: ${ddval}`)
	
	map.remove()
	d3.select("body").append("div").attr("id", "map")
	
	plotstuff();
};
//event handling for time period dropdown
dd.on("change",updatemap);


//this continuous color scale is my code adapted from a previous homework
//it maps earthquake magnitudes to continuous green-to-yellow-to-red color scale
//I've arbitrarily assigned earthquakes with a M < 1 to grey since there are so many of them
function continuousColorScale(magnitude) {
	
	M = parseFloat(magnitude)
	//rgb to hex conversion borrowed from https://campushippo.com/lessons/how-to-convert-rgb-colors-to-hexadecimal-with-javascript-78219fdb
	function rgbToHex(rgb){ 
		var hex = Number(rgb).toString(16);
		if (hex.length < 2) {
		   hex = "0" + hex;
		}
		return hex;
		};
	
	//set up the color scale 
	var midpoint = 4
	var min = 1
	var max = 8
	var	colorScale = d3.scaleLinear()
		.domain([min,max])
		.range([0,255]);
	
	// make minor earthquakes grey
	if(M < min) {
		return "grey"
	//make small earthquakes green to yellow
	} else if (M < midpoint) {
		var red = Math.round(2 * colorScale(M))
		var green = 255
		var blue = 0
		var hexcolor = "#"+rgbToHex(red)+rgbToHex(green)+rgbToHex(blue)
		return hexcolor
	//make major earthquakes yellow to red
	} else {
		red = 255 
		green = Math.round(255-colorScale(M))
		blue = 0
		var hexcolor = "#"+rgbToHex(red)+rgbToHex(green)+rgbToHex(blue)
		return hexcolor
	};
};


var attr = "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>"

var generateRandInt = function() {
    return Math.floor( Math.random() * 200000 ) + 1;
};

//configure maps
var light = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  randint: generateRandInt,
  attribution: attr,
  maxZoom: 18,
  id: "mapbox.light",
  accessToken: API_KEY
});

var dark = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  randint: generateRandInt,
  attribution: attr,
  maxZoom: 18,
  id: "mapbox.dark",
  accessToken: API_KEY
});

var sat = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  randint: generateRandInt,
  attribution: attr,
  maxZoom: 18,
  id: "mapbox.satellite",
  accessToken: API_KEY
});

function plotstuff(){
		
	//configure the urls based on selected time period
	var baseurl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/"
	var sigurl = baseurl + "significant_" + time + ".geojson"
	var url45 = baseurl + "4.5_" + time + ".geojson"
	var url25 = baseurl + "2.5_" + time + ".geojson"
	var url10 = baseurl + "1.0_" + time + ".geojson"
	var urlall = baseurl + "all_" + time + ".geojson"
	
	console.log("...Retrieving Data...")
	//chain of api calls using d3.json
	d3.json(sigurl, function(sigresponse) {
		console.log(`Retrieving data from: ${sigurl}`)
		console.log(`Found Significant Earthquakes: ${sigresponse.features.length}`)
				
		//Get markers for significant earthquakes
		var sigmarkers = [];
		for (var i = 0; i<sigresponse.features.length; i++) {
			// Check for location property
			var loc = sigresponse.features[i];
			if(loc) {
				var payload = ("<b>Magnitude:</b> " + loc.properties.mag + "<hr>"
				+ "<b>Location:</b> " + loc.properties.place + "<hr>"
				+ "<b>Duration:</b> " + Math.round(loc.properties.dmin * 60,1) +" seconds")
				
				// Add a new marker to the cluster group and bind a pop-up
				sigmarkers.push(L.circleMarker([loc.geometry.coordinates[1], 
						loc.geometry.coordinates[0]], 
						{title: `Magnitude: ${sigresponse.features[i].properties.title}`,
						stroke: true,
						color: continuousColorScale(loc.properties.mag),
						weight: 2,
						opacity: 1,
						fillOpacity: 0.4,
						radius: ((2.25**(loc.properties.mag)/10)+5),
						fillColor: continuousColorScale(loc.properties.mag)})
						.bindPopup(payload));
				
			};
		};
		//chain of api calls using d3.json
		d3.json(url45, function(m45response) {
			console.log(`Retrieving data from: ${url45}`)
			console.log(`Found M4.5+ Earthquakes: ${m45response.features.length}`)
			//Get markers for m4.5+ earthquakes
			var m45markers = [];
			for (var i = 0; i<m45response.features.length; i++) {
				// Check for location property
				var loc = m45response.features[i];
				if(loc) {
					
					var payload = ("<b>Magnitude:</b> " + loc.properties.mag + "<hr>"
					+ "<b>Location:</b> " + loc.properties.place + "<hr>"
					+ "<b>Duration:</b> " + Math.round(loc.properties.dmin * 60,1) +" seconds")
					
					// Add a new marker to the cluster group and bind a pop-up
					m45markers.push(L.circleMarker([loc.geometry.coordinates[1], 
							loc.geometry.coordinates[0]], 
							{title: `Magnitude: ${m45response.features[i].properties.title}`,
							stroke: true,
							color: continuousColorScale(loc.properties.mag),
							weight: 2,
							opacity: 1,
							fillOpacity: 0.4,
							//radius tuned to give approximately constant circle area regardless of map zoom
							radius: ((2.25**(loc.properties.mag)/10)+5),
							fillColor: continuousColorScale(loc.properties.mag)})
							.bindPopup(payload)
					);
				};
			};
			//chain of api calls using d3.json
			d3.json(url25, function(m25response) {
				console.log(`Retrieving data from: ${url25}`)
				console.log(`Found M2.5+ Earthquakes: ${m25response.features.length}`)
				//Get markers for m2.5+ earthquakes
				var m25markers = [];
				for (var i = 0; i<m25response.features.length; i++) {
					
					// Check for location property
					var loc = m25response.features[i];
					if(loc) {
						var payload = ("<b>Magnitude:</b> " + loc.properties.mag + "<hr>"
						+ "<b>Location:</b> " + loc.properties.place + "<hr>"
						+ "<b>Duration:</b> " + Math.round(loc.properties.dmin * 60,1) +" seconds")
						
						// Add a new marker to the cluster group and bind a pop-up
						m25markers.push(L.circleMarker([loc.geometry.coordinates[1], 
								loc.geometry.coordinates[0]], 
								{title: `Magnitude: ${m25response.features[i].properties.title}`,
								stroke: true,
								color: continuousColorScale(loc.properties.mag),
								weight: 2,
								opacity: 1,
								fillOpacity: 0.4,
								radius: ((2.25**(loc.properties.mag)/10)+5),
								fillColor: continuousColorScale(loc.properties.mag)})
								.bindPopup(payload)
						);
					};
				};
				//chain of api calls using d3.json
				d3.json(url10, function(m10response) {
					console.log(`Retrieving data from: ${url10}`)
					console.log(`Found M1.0+ Earthquakes: ${m10response.features.length}`)
					//Get markers for 1.0+ earthquakes
					var m10markers = [];
					for (var i = 0; i<m10response.features.length; i++) {
						// Check for location property
						var loc = m10response.features[i];
						if(loc) {
							var payload = ("<b>Magnitude:</b> " + loc.properties.mag + "<hr>"
							+ "<b>Location:</b> " + loc.properties.place + "<hr>"
							+ "<b>Duration:</b> " + Math.round(loc.properties.dmin * 60,1) +" seconds")
							
							// Add a new marker to the cluster group and bind a pop-up
							m10markers.push(L.circleMarker([loc.geometry.coordinates[1], 
									loc.geometry.coordinates[0]], 
									{title: `Magnitude: ${m10response.features[i].properties.title}`,
									stroke: true,
									color: continuousColorScale(loc.properties.mag),
									weight: 2,
									opacity: 1,
									fillOpacity: 0.4,
									radius: ((2.25**(loc.properties.mag)/10)+5),
									fillColor: continuousColorScale(loc.properties.mag)})
									.bindPopup(payload)
							);
						};
					};
					//chain of api calls using d3.json
					d3.json(urlall, function(allresponse) {
						console.log(`Retrieving data from: ${urlall}`)
						console.log(`Total Earthquakes Found: ${allresponse.features.length}`)
						console.log("...Data Retrieval Complete...")
						//Get markers for all earthquakes
						var allmarkers = [];
						for (var i = 0; i<allresponse.features.length; i++) {
							// Check for location property
							var loc = allresponse.features[i];
							if(loc) {
								var payload = ("<b>Magnitude:</b> " + loc.properties.mag + "<hr>"
								+ "<b>Location:</b> " + loc.properties.place + "<hr>"
								+ "<b>Duration:</b> " + Math.round(loc.properties.dmin * 60,1) +" seconds")
								
								// Add a new marker to the cluster group and bind a pop-up
								allmarkers.push(L.circleMarker([loc.geometry.coordinates[1], 
										loc.geometry.coordinates[0]], 
										{title: `Magnitude: ${allresponse.features[i].properties.title}`,
										stroke: true,
										color: continuousColorScale(loc.properties.mag),
										weight: 2,
										opacity: 1,
										fillOpacity: 0.4,
										radius: ((2.25**(loc.properties.mag)/10)+5),
										fillColor: continuousColorScale(loc.properties.mag)})
										.bindPopup(payload)
								);
							};
						};
						
						//assemble our options for map views
						var baseMaps = {
						  Light: light,
						  Dark: dark,
						  Satellite: sat
						};					
						
						//configure marker layers
						var earthquakes_sig = L.layerGroup(sigmarkers)
						var earthquakes_m45 = L.layerGroup(m45markers)
						var earthquakes_m25 = L.layerGroup(m25markers)
						var earthquakes_m10 = L.layerGroup(m10markers)
						var earthquakes_all = L.layerGroup(allmarkers)
						
						
						
						//assemble our options for markers to view
						var overlaygroup = {
						  "Significant": earthquakes_sig,
						  "m4.5+": earthquakes_m45,
						  "m2.5+": earthquakes_m25,
						  "m1+": earthquakes_m10,
						  every: earthquakes_all
						};
						
						//plot the map, set default layers
						var myMap = L.map("map", {
						center: [33, -95.95],
						zoom: 4,
						layers: [sat,earthquakes_m10]
						});
						
						
						// Pass our map layers and marker layers into our layer control, Add the layer control to the map
						L.control.layers(baseMaps, overlaygroup,{collapsed: false}).addTo(myMap);
						
						console.log("...Drawing Tectonic Plate Boundaries...")
						
						//add the tectonic plate boundaries
						d3.json("boundaries.json", function(data) {						
							// Creating a geoJSON layer with the retrieved data
							L.geoJson(data, {
							// Style each feature (boundary)
							style: {
								color: "blue",
								weight: 1.5
							  }
							}).addTo(myMap);
						});
						console.log(`Zoom level: ${myMap.getZoom()}`);
					});
				});
			});
		});	
	});
};

// provide an initial time period over which to retrieve data for display on pageload
//user can select different time period from dropdown later
var time = "month"
//run the plotting function for initial pageload with default values
plotstuff();
