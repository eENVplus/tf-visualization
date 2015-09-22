(function() {
	var eENVplusCluster = {};

	var baseUrl;

	var activeLanguages = {

	}

	var filteredData;
	var nodes;

	var history = [];
	var currentIndexInHistory = 0;

	var lastZoomEvent;
	var resizeFontTimeout;

	var loadingIndicator;
	var searchBox;

	var currentRequest;
	var relationParametersUsed = false;


	var thesaurusColors = [
		{name: "Protect site", color: "#580000"},
		{name: "INSPIRE theme register", color: "#1f78b4"},
		{name: "ThIST", color: "#42C400"},
		{name: "INSPIRE Feature Concepts", color: "#33a02c"},
		{name: "Air Quality Directive eReporting", color: "#fb9a99"},
		{name: "GEMET", color: "#e31a1c"},
		{name: "EUROVOC", color: "#fdbf6f"},
		{name: "EUNIS - Habitats", color: "#ff7f00"},
		{name: "EUNIS - Species", color: "#cab2d6"},
		{name: "Biogeographic Region", color: "#6a3d9a"},
		{name: "AGROVOC", color: "#4609FF"},
		{name: "EARTh", color:  "#b15928"}
	];

	var relationColors = [
		{relation: "has related", color: "green"},
		{relation: "has narrower", color: "red"},
		{relation: "has broader", color: "blue"},
		{relation: "has close match", color: "purple"},
		{relation: "has exact match", color: "#F37700"}
	];

	var uriMappingRules = [
		{
			is: "http://www.eionet.europa.eu/",
			should: "http://linkeddata.ge.imati.cnr.it/resource/"
		}, {
			is: "http://aims.fao.org/aos/",
			should: "http://linkeddata.ge.imati.cnr.it/resource/"
		}, {

		}
	];

	var relations = {
		related: false,
		narrower: false,
		broader: false,
		closeMatch: false,
		exactMatch: false
	}

	function hasMapping(item) {
		var mappedString = "";
		for (var i = 0; i < uriMappingRules.length; i++) {
			if (item.element.conceptUri.indexOf(uriMappingRules[i].is) > -1) {
				mappedString = item.element.conceptUri.replace(uriMappingRules[i].is, uriMappingRules[i].should);
				break;
			}
		}
		return mappedString;
	}

	var zoomControlToCloseInfoWindows = true;

	var zoom = d3.behavior.zoom()
	    .scaleExtent([1, 10])
	    .on("zoom", zoomed)
	    .on("zoomend", function() {

	    	zoomControlToCloseInfoWindows = true;

	    	clearTimeout(resizeFontTimeout);

	    	resizeFontTimeout = setTimeout(function() {

	    		// console.log(getQueryVariable("type"));
	    		// console.log(getQueryVariable("focusConcept"));
	    		// console.log(getQueryVariable("k"));
	    		// console.log(getQueryVariable("languages"));

	    		var nodeText = d3.selectAll("text");
	    		var nodeCircle = d3.selectAll("circle");
	    		var links = d3.selectAll("path");
	    		if (lastZoomEvent !== undefined) {
		    		nodeText.attr("font-size", (20 / lastZoomEvent.scale) + "px").attr("dy", (20 / 3 / lastZoomEvent.scale) + "px").attr("dx", function(d) { return d.x < 180 ? (1 + 8 / lastZoomEvent.scale) : (-1 + -8 / lastZoomEvent.scale); });
		    		nodeCircle.attr("r", (3 / lastZoomEvent.scale) + 1 + "px").style("stroke-width", (3 / lastZoomEvent.scale) + "px");
		    		links.style("stroke-width", (6 / lastZoomEvent.scale) + "px");
	    		}
	    	}, 300);

	    });

	function zoomed() {

		if (zoomControlToCloseInfoWindows) {
			zoomControlToCloseInfoWindows = false;
			shareIsVisible = false;
			d3.select(".cluster-share-icon").classed("hide-share-icon", true);
			d3.select(".cluster-info-window").classed("hide-info", true);
		}

		lastZoomEvent = d3.event;
		// var nodeText = d3.selectAll("text");
		// var nodeCircle = d3.selectAll("circle");
		// nodeText.attr("font-size", (16 / d3.event.scale) + "px").attr("dy", (16 / 3 / d3.event.scale) + "px");
		// nodeCircle.attr("r", (2 / d3.event.scale) + 2 + "px").attr("stroke-width", (2 / d3.event.scale) + "px");
		zoomCont.attr("transform", "translate(" + (d3.event.translate[0] + margin.left) + "," + (d3.event.translate[1] + margin.top) + ")scale(" + d3.event.scale + ")");
	}

	function getQueryVariable(variable) {
	    var query = window.location.search.substring(1);
	    var vars = query.split('&');
	    for (var i = 0; i < vars.length; i++) {
	        var pair = vars[i].split('=');
	        if (decodeURIComponent(pair[0]) == variable) {
	            return decodeURIComponent(pair[1]);
	        }
	    }
	    // console.log('Query variable %s not found', variable);
	}



	var cluster = d3.layout.cluster()
	  .size([360, 120])
	  .sort(null);

	var diagonal = d3.svg.diagonal.radial()
	.projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

	var diagonalVanish = d3.svg.diagonal.radial()
	.projection(function(d) { return [0, 0]; });


	  var margin = {top: 0, right: 0, bottom: 0, left: 0},
	  	width, height;

  var zoomableSvg;

	    

	var zoomCont;

	var zoomableContainer;

	var clusterShareIconTarget = null;

	var helpOpen = false;


	eENVplusCluster.init = function(options) {
		baseUrl = options.baseUrl;
		width = options.width;
		height = options.height;

		loadingIndicator = d3.select("body").append("div").attr("class", "cluster-loading-indicator").classed("hide-indicator", true).classed("show-indicator", false).html("<span class='li-dots'></span><span class='li-dots'></span><span class='li-dots'></span><span class='li-dots'></span><span class='li-dots'></span><span class='li-dots'></span><span class='li-dots'></span><span class='li-dots'></span><span class='li-dots'></span><span class='li-dots'></span>");

		d3.select("body").on("click", function() {
			shareIsVisible = false;
			d3.select(".cluster-share-icon").classed("hide-share-icon", true);
		});
	
		
		d3.select("body").append("div").attr("class", "cluster-share-icon").classed("hide-share-icon", true).html('<svg viewBox="0 0 384 384" xmlns="http://www.w3.org/2000/svg"' +
    	'xmlns:xlink="http://www.w3.org/1999/xlink">' +
    	'<path d="M288 70v59l38 31v-109c0 -11 -8 -19 -19 -19h-288c-11 0 -19 9 -19 19v218c0 11 8 19 19 19h120c-29 -18 -43 -38 -43 -38h-58v-180h250zM256 224c-84 0 -116 -24 -160 -96c0 0 5 164 160 164v60l128 -96l-128 -96v64z"/>' +
		'</svg>')
		.on("click", function() {
			window.open(clusterShareIconTarget);
		})
		.on("mouseenter", clearShareTimeout)
		.on("mouseleave", hideShareIcon);
		

		d3.select("body").append("div").attr("class", "cluster-info-window").classed("hide-info", true).html(
			"<span id='cluster-label'></span>" + 
			"<span id='cluster-language'></span>" + 
			"<span id='cluster-sourceLabel'></span><br/>" + 
			"<span id='cluster-description'>conceptURI: </span><span id='cluster-conceptUri'></span> <a href='' target='_blank' id='open-in-lustre'>(open in LusTRE)</a><br/>" +
			"<span id='cluster-description'>reachable through: </span><span id='cluster-relation'></span>"
			// "<div id='cluster-more-languages'></div>"
		)
		.on("mouseenter", clearInfoTimeout)
		.on("mouseleave", closeInfoWindow);

		d3.select("body").append("div").attr("class", "cluster-activate-languages").classed("hide-activate-languages", true).html(
			"<span id='cluster-language-header'>there are children available in another language for the node </span>" + 
			"<span id='cluster-language-label'></span>" + 
			"<span id='cluster-language-language'></span><br/>" + 
			"<div id='cluster-more-languages'></div>" +
			"</br><button type='button' id='cluster-more-languages-cancel'>Cancel</button>" +
			"<button type='button' id='cluster-more-languages-continue'>Or open this concept</button>"
		);

		document.getElementById("cluster-more-languages-cancel").addEventListener('click', function(e){
			e.preventDefault();
			d3.select(".cluster-activate-languages").classed("hide-activate-languages", true);
		})

		document.getElementById("cluster-more-languages-continue").addEventListener('click', function(e){
			e.preventDefault();
			saveInHistory(nodes);
			eENVplusCluster.renderConcept(continueDataItem.element.conceptUri);
			d3.select(".cluster-activate-languages").classed("hide-activate-languages", true);
		})

		d3.select("body").append("div").attr("class", "cluster-history-bar").html("<div id='backwards'><</div><div id='forwards'>></div>");

		d3.select("body").append("div").attr("class", "cluster-legend-view").classed("clv-hidden", true).html(function() {
			var text = "<span id='clv-relations'>relations</span><br/><br/>";
			
			for (var i = 0; i < relationColors.length; i++) {
				text = text + "<span class='thesauri-label' id='thesauri-label-" + i + "' style='color: " + relationColors[i].color + "'>" + relationColors[i].relation + "</span><br/>";
			}

			text = text + "<br/><button id='thesauri-label-reload'>reload</button><br/>";

			text = text + "<br/><span id='clv-sources'>thesauri</span><br/><br/>";
			for (var i = 0; i < thesaurusColors.length; i++) {
				text = text + "<span style='color: " + thesaurusColors[i].color + "'>" + thesaurusColors[i].name + "</span><br/>";
			}

			return text;
		});


		d3.select("#thesauri-label-0").on("click", function() {
			relations.related = !relations.related;
			d3.select(this).classed("deactivated", !relations.related);
		})

		d3.select("#thesauri-label-1").on("click", function() {
			relations.narrower = !relations.narrower;
			d3.select(this).classed("deactivated", !relations.narrower);
		})
	
		d3.select("#thesauri-label-2").on("click", function() {
			relations.broader = !relations.broader;
			d3.select(this).classed("deactivated", !relations.broader);
		})
	
		d3.select("#thesauri-label-3").on("click", function() {
			relations.closeMatch = !relations.closeMatch;
			d3.select(this).classed("deactivated", !relations.closeMatch);
		})
	
		d3.select("#thesauri-label-4").on("click", function() {
			relations.exactMatch = !relations.exactMatch;
			d3.select(this).classed("deactivated", !relations.exactMatch);
		})

		d3.select("#thesauri-label-reload").on("click", function() {
			d3.select(".cluster-no-data-error").classed("hide-no-data-error", true);
			eENVplusCluster.renderConcept();
		})


		d3.select("body").append("div").attr("class", "cluster-legend-btn").html("?").on("click", function() {
			if (!helpOpen) {
				d3.select(".cluster-legend-view").classed("clv-hidden", false);
				d3.select(".cluster-legend-btn").classed("clv-btn-active", true);
				helpOpen = !helpOpen;
			} else {
				d3.select(".cluster-legend-view").classed("clv-hidden", true);
				d3.select(".cluster-legend-btn").classed("clv-btn-active", false);
				helpOpen = !helpOpen;
			}
		});

		d3.select("body").append("div").attr("class", "cluster-no-data-error").classed("hide-no-data-error", true).html(
			"<span>No Data found</span>"
		);


		document.getElementById("backwards").addEventListener('click', function(e) {
			historyBackwards();
		})


		// d3.select("#backwards").classed("deactivated", true);
		// d3.select("#forwards").classed("deactivated", true);


		document.getElementById("forwards").addEventListener('click', function(e) {
			historyForwards();
		})

		zoomableSvg = d3.select(options.element).append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .call(zoom)
	  	.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.right + ")");

	    zoomCont = zoomableSvg.append("g").attr("transform", "translate(" + margin.left + "," + margin.right + ")");


	    zoomableContainer = zoomCont.append("g")
			.attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

		zoomableContainer.append("g").attr("id", "links");
		zoomableContainer.append("g").attr("id", "nodes");


		this.renderConcept(getQueryVariable("focusConcept"));
		activeLanguages[getQueryVariable("languages")] = true;

	}


	var infoWindowIsShown = false;
	var infoWindowCloseTimeout;
	var mappedString;

	function updateInfoWindowWith(item) {
		clearTimeout(infoWindowCloseTimeout);
		var infoWindow = d3.select(".cluster-info-window");

		infoWindow.select("#cluster-label").html(item.element.label);
		infoWindow.select("#cluster-language").html(" (" + item.element.language + ") ");
		infoWindow.select("#cluster-sourceLabel").html("  –  " + item.element.sourceLabel).style("color", getSourceLabelColor(item));
		infoWindow.select("#cluster-relation").html(item.element.relationLabel).style("color", getRelationColor(item));
		infoWindow.select("#cluster-conceptUri").html(item.element.conceptUri);

		mappedString = hasMapping(item);
		if (mappedString.length > 0) {
			infoWindow.select("#open-in-lustre").classed("deactivated", false);
			infoWindow.select("#open-in-lustre").attr("href", mappedString);
			clusterShareIconTarget = mappedString;
		} else {
			infoWindow.select("#open-in-lustre").classed("deactivated", true);
		}


		if (!infoWindowIsShown) {
			d3.select(".cluster-info-window").classed("hide-info", false);
		}
	}

	function getSourceLabelColor(d) {
		for (var i = 0; i < thesaurusColors.length; i++) {
			if (d.element.sourceLabel.indexOf(thesaurusColors[i].name) > -1) {
				return thesaurusColors[i].color;
			}
		}
	}

	function getRelationColor(d) {
	   if (d.element.relationLabel !== undefined) {
	   		for (var i = 0; i < relationColors.length; i++) {
	   			if (d.element.relationLabel.indexOf(relationColors[i].relation) > -1) {
	   				return relationColors[i].color;
	   			}
	   		}
	   }
	}

	function clearInfoTimeout() {
		clearTimeout(infoWindowCloseTimeout);
	}

	function closeInfoWindow() {
		infoWindowCloseTimeout = setTimeout(function() {
			d3.select(".cluster-info-window").classed("hide-info", true);
		}, 1000)
	}

	var shareIsVisible = false;
	var lastItem = null;
	var shareTimeout = null;

	function updateShareIcon(item) {
		if (!shareIsVisible || item !== lastItem) {
			lastItem = item;
			clearTimeout(shareTimeout);
			shareIsVisible = true;
			d3.select(".cluster-share-icon").style("left", d3.event.pageX + 20 + "px").style("top", (d3.event.pageY - 20) + "px").classed("hide-share-icon", false);
			clusterShareIconTarget = item.element.conceptUri;
		}
	}

	function clearShareTimeout() {
		clearTimeout(shareTimeout);
	}

	function hideShareIcon() {
			clearTimeout(shareTimeout);
			shareTimeout = setTimeout(function() {
				shareIsVisible = false;
				d3.select(".cluster-share-icon").classed("hide-share-icon", true);
			}, 1000);
	}

	var continueDataItem;
	function showLanguageSwitchButton(item) {
		continueDataItem = item;
		var languageWindow = d3.select(".cluster-activate-languages");

		languageWindow.select("#cluster-language-label").html(item.element.label);
		languageWindow.select("#cluster-language-language").html(" (" + item.element.language + ") ");
		var moreLanguages = "";
		var langObj = {};
		// count languages
		for (var i = 0; i < item.otherLanguagesAvailable.childrenInOtherLanguages.length; i++) {
			if (langObj[item.otherLanguagesAvailable.childrenInOtherLanguages[i].element.language] !== undefined) {
				langObj[item.otherLanguagesAvailable.childrenInOtherLanguages[i].element.language]++;
			} else {
				langObj[item.otherLanguagesAvailable.childrenInOtherLanguages[i].element.language] = 1;
			}
		}

		var langArr = [];

		for (prop in langObj) {
			if (langObj.hasOwnProperty(prop)) {
				moreLanguages = moreLanguages + "<span class='cluster-more-languages-item'><a href='' class='language'>" + prop + "</a><span class='count'> (" + langObj[prop] + ") </span>" + "</span><br/>"	
				langArr.push({language: prop});
			}
		}
		languageWindow.select("#cluster-more-languages").html(moreLanguages);

		var g = document.getElementById('cluster-more-languages');

		for (var i = 0, len = g.children.length; i < len; i++) {
		    
		    (function(index){
		        g.children[i].addEventListener('click', function(e){
		        		e.preventDefault();

		              	addLanguageToNode(item, langArr[index].language);

		              	// for (var j = 0; j < item.otherLanguagesAvailable.childrenInOtherLanguages.length; j++) {
		              	// 	if (item.otherLanguagesAvailable.childrenInOtherLanguages[j].element.language === langArr[index].language) {
		              	// 		item.children.push(item.otherLanguagesAvailable.childrenInOtherLanguages[j]);
		              	// 	}
		              	// }

		              	languageWindow.classed("hide-activate-languages", true);
		              	shareIsVisible = false;
		              	d3.select(".cluster-share-icon").classed("hide-share-icon", true);

		        })  
		    })(i);
		    
		}


		languageWindow.classed("hide-activate-languages", false);

	}


	// we have the node item from d3 (the 'd')
	// here we find the root element and move through the original data down to the data that is equal to our node item and append the language children accordingly

	function addLanguageToNode(item, languageToAdd) {
		// find item
		var pathArr = [];
		var currentElement = item;
		while (currentElement.parent !== undefined) {

			pathArr.push(currentElement.element);
			currentElement = currentElement.parent;

		}
		// console.log(pathArr);

		var itemInOriginalData = filteredData;
		for (var i = pathArr.length-1; i >= 0; i--) {

			// console.log(pathArr[i]);
			for (var j = 0; j < itemInOriginalData.children.length; j++) {
				// console.log(itemInOriginalData.children[j]);
				if (compareTwoElements(itemInOriginalData.children[j].element, pathArr[i])) {
					itemInOriginalData = itemInOriginalData.children[j];
				}
			}
		}


		for(var i = 0; i < itemInOriginalData.otherLanguagesAvailable.childrenInOtherLanguages.length; i++) {
			if (itemInOriginalData.otherLanguagesAvailable.childrenInOtherLanguages[i].element.language === languageToAdd) {
				var tmpObj = itemInOriginalData.otherLanguagesAvailable.childrenInOtherLanguages[i];
				tmpObj.isFromOtherLanguage = true;
				itemInOriginalData.otherLanguagesAvailable.childrenInOtherLanguages.splice(i, 1);
				itemInOriginalData.children.push(tmpObj);
			}
		}

		// ugly without transition

		zoomableContainer.select("#links").selectAll("*").remove();
		zoomableContainer.select("#nodes").selectAll("*").remove();

		update(filteredData, false);

		function compareTwoElements(a, b) {
			return (a.conceptUri === b.conceptUri && a.label === b.label && a.language === b.language);
		}

	}


	function saveInHistory(nodes) {
		if (currentIndexInHistory < history.length) {
			history.splice(currentIndexInHistory + 1, Number.MAX_VALUE);
		}
		var relationItem = {};
		for (prop in relations) {
			if (relations.hasOwnProperty(prop)) {
				relationItem[prop] = relations[prop];
			}
		}
		history.push({nodes: nodes, relationItem: relationItem, lastConceptUri: lastConceptUri});
		currentIndexInHistory++;
	}


	function historyForwards() {

		if (currentIndexInHistory < history.length - 1) {
			if (currentRequest !== undefined) {
				currentRequest.abort();
				hideIndicator();
			}
			d3.select(".cluster-activate-languages").classed("hide-activate-languages", true);
			zoomableContainer.select("#links").selectAll("*").remove();
			zoomableContainer.select("#nodes").selectAll("*").remove();
			currentIndexInHistory++;
			update(history[currentIndexInHistory].nodes, true);
			updateRelationFilter(history[currentIndexInHistory].relationItem);
			lastConceptUri = history[currentIndexInHistory].lastConceptUri;
		}
	}

	// eENVplusCluster.showHistory = function() {
	// 	console.log("history: ", history);
	// 	console.log("currentIndexInHistory: " + currentIndexInHistory);
	// }

	function historyBackwards() {

		if (currentIndexInHistory > 0) {
			if (currentRequest !== undefined) {
				currentRequest.abort();
				hideIndicator();
			}
			d3.select(".cluster-activate-languages").classed("hide-activate-languages", true);
			zoomableContainer.select("#links").selectAll("*").remove();
			zoomableContainer.select("#nodes").selectAll("*").remove();
			if (history[currentIndexInHistory] === undefined) {
				var relationItem = {};
				for (prop in relations) {
					if (relations.hasOwnProperty(prop)) {
						relationItem[prop] = relations[prop];
					}
				}
				history.push({nodes: nodes, relationItem: relationItem, lastConceptUri: lastConceptUri});
			} else {
				history[currentIndexInHistory].nodes = nodes;
			}

			currentIndexInHistory--;
			update(history[currentIndexInHistory].nodes, true);
			updateRelationFilter(history[currentIndexInHistory].relationItem);
			lastConceptUri = history[currentIndexInHistory].lastConceptUri;
		}
	}

	function updateRelationFilter(relationItem) {
		var i = 0;
		for (prop in relationItem) {
			if (relationItem.hasOwnProperty(prop)) {
				relations[prop] = relationItem[prop];
				d3.select("#thesauri-label-" + i++).classed("deactivated", !relations[prop]);
			}
		}

	}

	function showIndicator() {
		loadingIndicator.classed("hide-indicator", false).classed("show-indicator", true);
	}

	function hideIndicator() {
		loadingIndicator.classed("hide-indicator", true).classed("show-indicator", false);
	}

	var node;
	var rawClusterData;
	var jsonResponse;

	var lastConceptUri;

	var highlightText;

	eENVplusCluster.renderConcept = function(conceptUri) {
		var conceptUri = conceptUri;

		if (conceptUri !== undefined) {
			lastConceptUri = conceptUri;
			
		} else {
			conceptUri = lastConceptUri;
		}

		
		if ((getQueryVariable("focusConcept") === undefined) ||
			(getQueryVariable("k") === undefined) ||
			(getQueryVariable("languages") === undefined) ||
			(getQueryVariable("relations") === undefined)) {
			console.error("parameter missing");
		}

		if (!relationParametersUsed) {
			relationParametersUsed = true;
			var parameters = getQueryVariable("relations").split(",");
			if (parameters[0].length === 0) {
				for (prop in relations) {
					if (relations.hasOwnProperty(prop)) {
						relations[prop] = true;
					}
				}
			} else {
				for (var i = 0; i < parameters.length; i++) {
					relations[parameters[i]] = true;
				}
			}

			i = 0;

			for (prop in relations) {
				if (relations.hasOwnProperty(prop)) {
					d3.select("#thesauri-label-" + i++).classed("deactivated", !relations[prop]);
				}
			}
		}

		showIndicator();
		// resetting zoom
		zoom.translate([0, 0]);
		zoom.scale(1);
		zoomCont.attr("transform", "translate(0,0)scale(1)");
		zoomableContainer.select("#links").selectAll("*").remove();
		zoomableContainer.select("#nodes").selectAll("*").remove();
		var relationString = "";

		for (prop in relations) {
			if (relations.hasOwnProperty(prop)) {
				if (relations[prop]) {
					relationString = relationString + prop + ",";
				}
			}
		}

		relationString = relationString.slice(0, -1);

		var url = baseUrl + "visualization?concept=" + conceptUri + "&depth=" + getQueryVariable("k") + "&languages=" + getQueryVariable("languages") + "&relations=" + relationString;
		// var url = "./response.json";
		currentRequest = d3.json(url, function(json) {
			if (!checkObjectEmpty(json)) {
				hideIndicator();
				jsonResponse = json;
				filterData(json, false);
			} else {
				d3.select(".cluster-no-data-error").classed("hide-no-data-error", false);
				hideIndicator();
			}

		
		});
	}

	function checkObjectEmpty(obj) {
	    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop))
	            return false;
	    }
	    return true;
	}


	function filterData(data) {


		// this was used to filter languages on the client side
		// filteredData = recChildren(data.root);
		// update(filteredData, false);

		update(data.root, false);

	}


	function update(thisData, noLayout) {

		if (noLayout) {
			nodes = thisData;
		} else {
			nodes = cluster.nodes(thisData);
		}
			
		    // var link = zoomableContainer.selectAll("path.link")
		    var link = zoomableContainer.select("#links").selectAll("path.link")
		        .data(cluster.links(nodes));

			var linkEnter = link.enter().append("svg:path")
		        .attr("class", "link")
		        .style("opacity", 0.4)
		        .style("stroke-width", 4)
		        .style("stroke", function(d) {
		        	return getRelationColor(d.target);
		        })
		        .attr("d", diagonalVanish)
		        .transition()
		        .duration(500)
		        .attr("d", diagonal);

	        link.transition().duration(500).attr("d", diagonal);



	        var linkExit = link.exit().transition().duration(500).style("opacity", 0).remove();

		    var node = zoomableContainer.select("#nodes").selectAll("g.node")
		        .data(nodes);

			var nodeEnter = node.enter().append("svg:g")
		        .attr("class", "node")
		        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + 0 + ")"; });

		    nodeEnter.append("svg:circle")
		        .attr("r", 4)
		        .style("fill", function(d) {
		        	if (d.depth === 0) {
		        		return "red"
		        	}
					// if (d.otherLanguagesAvailable !== undefined && d.otherLanguagesAvailable.childrenInOtherLanguages !== undefined && d.otherLanguagesAvailable.childrenInOtherLanguages.length > 0) {
					//   	return "yellow"
					// }
					return "#fff";
				})
				.style("stroke-width", 3)
				.style("stroke", function(d) {
		        	for (var i = 0; i < thesaurusColors.length; i++) {
	        			if (d.element.sourceLabel.indexOf(thesaurusColors[i].name) > -1) {
	        				return thesaurusColors[i].color;
	        			}
		        	}
				})
				.on('mouseenter', function(d) {
					// console.log(d);
		        	updateShareIcon(d);
		        	updateInfoWindowWith(d);
		        	d3.select(this).style("stroke", "#FF00CD");

		     	 })


				.on("mouseleave", function(d) {
					hideShareIcon();
					closeInfoWindow();
		        	d3.select(this).style("stroke", function(d) {
			        	for (var i = 0; i < thesaurusColors.length; i++) {
		        			if (d.element.sourceLabel.indexOf(thesaurusColors[i].name) > -1) {
		        				return thesaurusColors[i].color;
		        			}
			        	}
		        	});
				})
		        .on("click", function(d) {
		        	if (d.otherLanguagesAvailable !== undefined && d.otherLanguagesAvailable.childrenInOtherLanguages !== undefined
		        	 && d.otherLanguagesAvailable.childrenInOtherLanguages.length > 0) {
		        		showLanguageSwitchButton(d);
		        	} else {
		        		saveInHistory(nodes);
		        		d3.select(".cluster-info-window").classed("hide-info", true);
		        		eENVplusCluster.renderConcept(d.element.conceptUri);
		        	}
		        });

		    var nodeUpdate = node.transition().duration(500).attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

	    	nodeUpdate.select("text").attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
		        .attr("dy", ".31em")
		        .attr("font-size", "20px")
		        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
		        .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; });


		    nodeEnter.append("svg:text")
		        .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
		        .attr("dy", ".31em")
		        .attr("font-size", "20px")
		        .style("font-weight", "bold")
		        .style("fill", "#848484")
		        .on("mouseover", function(d) {
		        	d3.select(this).style("fill", "black");
		        	d3.selectAll("text").attr("opacity", 0.4);
		        	d3.select(this).attr("opacity", 1);
		        	updateInfoWindowWith(d);
		        })
		        .on("mouseleave", function(d) {
		        	closeInfoWindow();
		        	d3.selectAll("text").attr("opacity", 1);
		        	d3.select(this).style("fill", "#848484")
		        })
		        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
		        .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
		        .text(function(d) { return d.element.label; });

	        var nodeExit = node.exit().transition().duration(500).style("opacity", 0).remove();

	}



	function recChildren(node) {
	  var copiedNodeElement = {
	    element: node.element,
	    children: []
	  };

	  // we store our children in other languages, filtered by language, in this object
	  var otherLanguagesAvailable = {};
	  // using the conceptUri to filter out duplicates in other languages
	  var conceptUriHash =  {};
	  // 
	  // var uncheckedChildrenInOtherLanguages = [];
	  var hasOtherLanguages = false;


	  var tmpObj;
	  for (var i = 0; i < node.children.length; i++) {
	    tmpObj = recChildren(node.children[i]);
	    // node has children, 
	    // if(tmpObj.element.language === "en" || tmpObj.element.language === "it") {
	    if(activeLanguages[tmpObj.element.language]) {
	      // copiedNodeElement.children.push(recChildren(node.children[i]));
	      copiedNodeElement.children.push(tmpObj);
	      conceptUriHash[tmpObj.element.conceptUri] = true;
	    } else {
	      hasOtherLanguages = true;
	      if (otherLanguagesAvailable[tmpObj.element.language] !== undefined) {
	        otherLanguagesAvailable[tmpObj.element.language].counter = otherLanguagesAvailable[tmpObj.element.language].counter + 1;
	        otherLanguagesAvailable[tmpObj.element.language].childrenInOtherLanguages.push(tmpObj);
	        // uncheckedChildrenInOtherLanguages.push(tmpObj);
	      } else {
	        otherLanguagesAvailable[tmpObj.element.language] = {
	          counter: 1,
	          childrenInOtherLanguages: [tmpObj]
	        };
	        // otherLanguagesAvailable[tmpObj.element.language] = 1;
	      }
	    }
	  }


	  if (hasOtherLanguages) {
	    // for (var i = 0; i < uncheckedChildrenInOtherLanguages.length; i++) {
	    //   if (!conceptUriHash[uncheckedChildrenInOtherLanguages[i].element.conceptUri]) {
	    //     otherLanguagesAvailable.childrenInOtherLanguages.push(uncheckedChildrenInOtherLanguages[i]);
	    //   }
	    // }

	    for (var language in otherLanguagesAvailable) {
	      if (otherLanguagesAvailable.hasOwnProperty(language)) {

	        var tmpArr = [];

	        for(var i = 0; i < otherLanguagesAvailable[language].childrenInOtherLanguages.length; i++) {
	          if (!conceptUriHash[otherLanguagesAvailable[language].childrenInOtherLanguages[i].element.conceptUri]) {
	            tmpArr.push(otherLanguagesAvailable[language].childrenInOtherLanguages[i]);
	          }
	        }
	        // otherLanguagesAvailable[language];
	        if (tmpArr.length > 0) {
	        otherLanguagesAvailable.childrenInOtherLanguages = [];
	        for (var i = 0; i < tmpArr.length; i++) {
	          otherLanguagesAvailable.childrenInOtherLanguages.push(tmpArr[i]);
	        }
	          // console.log(tmpArr);
	          // console.log(otherLanguagesAvailable);
	          // if (otherLanguagesAvailable.length !== undefined) {
	          //   console.log(otherLanguagesAvailable.childrenInOtherLanguages.length);
	            
	          // }

	        }
	        // otherLanguagesAvailable.childrenInOtherLanguages = tmpArr;
	      }
	    }

	    copiedNodeElement.otherLanguagesAvailable = otherLanguagesAvailable;
	  }

	  return copiedNodeElement
	}


	this.eENVplusCluster = eENVplusCluster;
})()