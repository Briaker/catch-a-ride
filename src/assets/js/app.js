const app = {};

//  [API Data Flow]
//      Google Map Api -> Get nearby staions -> User Chooses Station
//      GTFS API -> Use Station Coords to find stop_code
//      NextBus -> Using ttc and stop_code get stop times

// Google API Key
app.apiKey = 'AIzaSyAntW9odX77bszvDfWhINFxPlr7DEol0_c';

// Google Maps Directions Service
app.directionsService;

app.userLocation = {
    location: {},
    marker: {},
    infoWindow: {},
    setMap: function(map) {
        app.userLocation.marker.setMap(map);
    }
};

app.currentRoute = {
    route: {},
    infoWindow: {},
    setMap: function(map) {
        app.currentRoute.route.setMap(map)
    }
};

app.nearbyMapMarkers = {
    markers: [],
    infoWindow: {},
    setMap: function(map) {
        app.nearbyMapMarkers.markers.forEach(function(marker){
            marker.setMap(map);
        });
    }
};

// HackerYou's Location
app.biasLocation = { lat: 43.6482644, lng: -79.3978587 };

app.nearbyStations = [];

app.transitPickupLocation;

// app.depatureTimes = app.transitPickupLocation.departTable;

app.estimatedTravelTime;

app.estimatedTimeOfArrival;

app.confrimedDepatureTimes = [];

app.map;

app.defualtMapZoom = 15;

app.userMapZoom = 15;

app.infoWindow;

app.userSearchInputResult;

app.el = {
    $map: $('#map'),
    $results: $('#results'),
    $resultTimes: $('#resultTimes'),
    $searchField: $('#searchField'),
    $autocompleteWrapper: $('#autocompleteWrapper'),
    $autocompleteList: $('#autocompleteList'),
    $modalWrapper: $('#modalWrapper'),
    $modalContent: $('.modalContent'),
    $routeDetails: $('#routeDetails'),
    $modalDetectLocation: $('#detectingLocation'),
    $modalSearchForLocation: $('#searchForLocation'),
    $modalViewRouteDetails: $('#viewRouteDetails')
};

app.modals = {
    nextModal: null,
    currentModal: null,

    display: function(modal) {
        app.modals.nextModal = modal;
        app.modals.currentModal.display(false);
    },

    modalFadeOutCallback: function() {
        if(app.modals.currentModal !== null && app.modals.nextModal !== null) {
            app.modals.currentModal = app.modals.nextModal;
            app.modals.currentModal.display(true);
        }
    },

    detectLocation: {
        el: app.el.$modalDetectLocation,
        display: function(visible) {
            if(visible) {
                app.displayModalWrapper(true);
                app.modals.detectLocation.el.addClass('fadeIn');
                app.modals.detectLocation.el.removeClass('disabled');
            }
            else {
                app.modals.detectLocation.el.addClass('fadeOut');
            }
        }
    },

    searchForLocation: {
        el: app.el.$modalSearchForLocation,
        display: function(visible) {
            if(visible) {
                app.displayModalWrapper(true);
                app.modals.searchForLocation.el.addClass('fadeIn');
                app.modals.searchForLocation.el.removeClass('disabled');
            }
            else {
                app.modals.searchForLocation.el.addClass('fadeOut');
            }
        }
    },

    viewRouteDetails: {
        el: app.el.$modalViewRouteDetails,
        display: function(visible) {
            if(visible) {
                app.displayModalWrapper(true);
                app.modals.viewRouteDetails.el.addClass('fadeIn');
                app.modals.viewRouteDetails.el.removeClass('disabled');
            }
            else {
                app.modals.viewRouteDetails.el.addClass('fadeOut');
            }
        }
    },

    init: function() {
        app.modals.currentModal = app.modals.detectLocation;
    }

}


//===================================
//         DISPLAY METHODS
//===================================

app.displayModalWrapper = function(visible) {
    if(visible) {
        app.el.$modalWrapper.addClass('fadeIn');
        app.el.$modalWrapper.removeClass('disabled');
    }
    else {
        app.el.$modalWrapper.addClass('fadeOut');
        app.modals.currentModal.display(false);
    }
}

app.displayDetectLocation = function(visible) {
    app.currentModal = app.el.$modalDetectLocation;
    if(visible) {
        app.el.$modalDetectLocation.addClass('fadeIn');
    }
    else {
        app.el.$modalDetectLocation.addClass('fadeOut');
    }
}

app.displaySearchForLocation = function(visible) {
    app.currentModal = app.el.$modalDetectLocation;
    if(visible) {
        app.el.$modalSearchForLocation.removeClass('disabled');
        app.el.$modalSearchForLocation.addClass('fadeIn');
    }
    else {
        app.el.$modalSearchForLocation.addClass('fadeOut');
    }
}

app.displayUserLocation = function(visible) {
    if(visible) {
        app.userLocation.setMap(app.map);
    }
    else {
        app.userLocation.setMap(null);
    }
};

app.displayCurrentRoute = function(visible) {
    if(visible) {
        app.currentRoute.setMap(app.map);
    }
    else {
        app.currentRoute.setMap(null);
        app.currentRoute.infoWindow.close();
    }
};

app.displayNearbyMapMarkers = function(visible) {
    if(visible) {
        app.nearbyMapMarkers.setMap(app.map);
    }
    else {
        app.nearbyMapMarkers.setMap(null);
    }
};

app.displayAutoCompleteResults = function(results) {
    const autocompleteItemClass = 'autocompleteItem';
    const autocompleteList = [];
    app.el.$autocompleteList.empty();
    
    if(results.length > 0) {
        results.forEach(function(result) {
            autocompleteList.push({ label: result.description, value: result.place_id });
        });

        $(app.el.$searchField).autocomplete({
            minLength:3,
            source: autocompleteList,
            autoFocus:true,
            select: function(event, ui) {
                event.preventDefault();
                $(this).val(ui.item.label);
                app.userSearchInputResult = ui.item.value;
            },
            messages: {
                noResults: '',
                results: function() {}
            }
        });
    }
};

app.displayRouteDetails = function(coords) {
    // Wait for Basic Transit Stop Info request to come back
    $.when(app.getTransitStopInfo(coords))
    .done(function(stopInfo) {
        console.log('[Stop ID]', stopInfo, '[Position]', coords);
        
        if($.isNumeric(stopInfo.stop_code)) {
            
            // Wait for Transit Stop Stop Times request to come back
            $.when(app.getTransitStopTimes(stopInfo.stop_code))
            .done(function(timeInfo) {
                // console.log('Stop TIMES: ', timeInfo);
                //[0].direction.prediction[0].epochTime
                const predictions = timeInfo.body.predictions;
                
                const validatedPredictions = [];

                // console.log('[PREDICTIONS]',predictions)

                predictions.forEach(function(prediction){
                    if(prediction.direction !== undefined) {
                        validatedPredictions.push(prediction);
                    }
                });

                if(validatedPredictions.length > 1) {
                    let earliestTime = validatedPredictions[0];
                    validatedPredictions.forEach(function(prediction){
                        if(prediction.direction.prediction !== undefined) {
                            validatedPredictions.push(prediction);
                        }
                    });
                }
                // console.log(validatedPredictions);
                validatedPredictions
                app.el.$routeDetails.text('Details here!');
                app.modals.viewRouteDetails.display(true);
            })
            .fail(function(error) {
                console.error('ERROR: ', error);
            });
        }
        else {
            // The stop id provided was not a valid number
            // (No stop info availible)
            console.log('Invalid stop_code, NaN!');
        }
    })
    .fail(function(error) {
        console.log('ERROR: ', error);
        return ('ERROR: ', error);
    });
};
//===================================
//         PROCESSING METHODS
//===================================

app.generateMapMarker = function(place, type = 'transit') {
    const marker = new google.maps.Marker({
        map: null,
        position: place.geometry.location
        // icon: "assets/images/mapIcon.png"
    });

    google.maps.event.addListener(marker, 'click', function() {
        let content = '';
        // app.infoWindow.setContent(content);
        //         // app.infoWindow.open(app.map, markerThis); 
        if(type === 'user') {
            console.log(place);

            content = `
                ${place.name} <br>
                <button id="userDetectLocation">Detect New Location</button><span class="loadingIndicator small"></span><br>
                <button id="userChangeLocation">Choose New Location</button>
            `
            app.userLocation.infoWindow.setContent(content);
            app.userLocation.infoWindow.open(app.map, this);

            $('#userChangeLocation').on('click', function() {
                console.log('CHANGE (modal)');
            });

            $('#userDetectLocation').on('click', function() {
                console.log('DETECT');
            });
        }
        else if(type === 'transit') {
            // const viewDetailsButton = ;
            content = `
                ${place.name} <br>
                <button class="viewDetails">View Details</button>
            `
            app.nearbyMapMarkers.infoWindow.setContent(content);
            app.nearbyMapMarkers.infoWindow.open(app.map, this);

            $('.viewDetails').on('click', function() {
                console.log('VIEW DTAAILS (modal)');
                app.displayRouteDetails(place.geometry.location);
            });

            // app.nearbyMapMarkers.infoWindow
            // // const markerThis = this;
            // const coords = place.geometry.location;
            // let stopTimesResponse;
            // app.userMapZoom = app.map.getZoom();
            // app.setRouteTo(coords);
            // app.displayNearbyMapMarkers(false);
            // app.displayCurrentRoute(true);
        }
        
        
    });

    return marker;
};

app.generateNearbyLocationMarkers = function(locations) {
    const reusltItemClass = 'resultItem'
    app.nearbyMapMarkers.setMap(null);
    app.nearbyMapMarkers.markers = [];

    for (let i = 0; i < locations.length; i++) {
        app.nearbyMapMarkers.markers.push(app.generateMapMarker(locations[i], 'transit'));
    }
};

app.setUserLocation = function(pos) {
    app.userLocation.location = pos;

    app.userLocation.marker = app.generateMapMarker({
        name: 'My Location',
        geometry: {
            location: app.userLocation.location
        }
    }, 'user');
    app.userLocation.marker.setIcon("assets/images/marker.png");
    app.map.setCenter(app.userLocation.location);

    console.log('[success] map location set');
    app.displayUserLocation(true);
};

app.getUserLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // const pos = {
            //     lat: position.coords.latitude,
            //     lng: position.coords.longitude
            // };
            const pos = app.biasLocation;
            console.log('[success] location found');
            
            app.setUserLocation(pos)

            app.displayModalWrapper(false);

        }, function(error) {
            if (error.code == error.PERMISSION_DENIED) {
                  app.modals.display(app.modals.searchForLocation);
            }
            else {
                console.log(error);
                app.handleLocationError(true, app.infoWindow, app.map.getCenter());
            }
        });
    } else {
      // Browser doesn't support Geolocation or user has denied access
      app.handleLocationError(false, app.infoWindow, app.map.getCenter());
    }
};


//===================================
//         API QUERY METHODS
//===================================

app.getNearbyLocations = function(userLocation) {
    if(userLocation !== undefined) {
        const locationsResponse = $.ajax({
            url: 'https://proxy.hackeryou.com',
            dataType: 'json',
            method:'GET',
            data: {
                reqUrl: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
                params: {
                    key: app.apiKey,
                    location: `${userLocation.lat},${userLocation.lng}`,
                    rankby: 'distance',
                    type: 'light_rail_station'
                },
                xmlToJSON: false
            }
        });

        $.when(locationsResponse).done(function(locations) {
            if(locations.status === 'OK') {
                app.generateNearbyLocationMarkers(locations.results);
                app.displayNearbyMapMarkers(true);
            }
        });
    }
};

app.setRouteTo = function(destination, mode = 'walking') {
    // console.log(app.userLocation);
    if(app.userLocation.location !== undefined) {
        const directionsRequest = {
            origin: app.userLocation.location,
            destination: destination,
            travelMode: google.maps.DirectionsTravelMode.WALKING,
            unitSystem: google.maps.UnitSystem.METRIC
        };

        app.directionsService.route( directionsRequest, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                app.currentRoute.route.setDirections(response);

                // console.log(response);
                var step = 0;
                // app.currentRoute.infoWindow = new google.maps.InfoWindow();
                app.currentRoute.infoWindow.setContent(
                    response.routes[0].legs[0].steps[step].distance.text + 
                    "<br>" + response.routes[0].legs[0].steps[step].duration.text + " "
                );
                app.currentRoute.infoWindow.setPosition(response.routes[0].legs[0].steps[step].end_location);
                app.currentRoute.infoWindow.open(app.map);

            } else {
                console.log("Unable to retrieve your route");
            }
        });
    }
    else {
        console.warn(`[app.getRoute] app.userLocation is undefined`);
    }
};

// Gets Stop Times from NextBus webservice using a stop_code
app.getTransitStopTimes = function(stopID) {
    return $.ajax({
        url: 'https://proxy.hackeryou.com',
        dataType: 'json',
        method:'GET',
        data: {
            reqUrl: 'http://webservices.nextbus.com/service/publicXMLFeed',
            params: {
                command: 'predictions',
                a: 'ttc',
                stopId: stopID
            },
            xmlToJSON: true
        }
    });
};

app.getTransitStopInfo = function(stopCoords) {
    return $.ajax({
        url: 'https://proxy.hackeryou.com',
        dataType: 'json',
        method:'GET',
        data: {
            reqUrl: 'http://api.brianbaker.ca/stops/',
            params: {
                lat: stopCoords.lat,
                lon: stopCoords.lng
            },
            xmlToJSON: false
        }
    });
};

app.getPlaceDetails = function(placeId) {
    console.log('Gettings dtails');
    const response = $.ajax({
        url: 'https://proxy.hackeryou.com',
        dataType: 'json',
        method:'GET',
        data: {
            reqUrl: 'https://maps.googleapis.com/maps/api/place/details/json',
            params: {
                key: app.apiKey,
                placeid: placeId,
            },
            xmlToJSON: false
        }
    });

    $.when(response).done(function(placeDetails) {
        if(placeDetails.status === 'OK') {
            app.setUserLocation(placeDetails.result.geometry.location);
            app.displayModalWrapper(false);
        }
    });
};

app.searchFor = function(searchString) {
    const response = $.ajax({
        url: 'https://proxy.hackeryou.com',
        dataType: 'json',
        method:'GET',
        data: {
            reqUrl: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
            params: {
                key: app.apiKey,
                input: searchString,
                types: 'geocode',
                language: 'en',
                location: app.biasLocation,
                radius: 50000
            },
            xmlToJSON: false
        }
    });

    $.when(response)
    .done(function(responseInfo) {
        app.displayAutoCompleteResults(responseInfo.predictions);
    })
    .fail(function(error) {
        console.error('ERROR: ', error);
    });
};


//===================================
//        GOOGLE MAPS METHODS
//===================================

app.initMap = function() {
    app.map = new google.maps.Map(app.el.$map.get(0), {
        // HackerYou's coords
        center: app.biasLocation,
        zoom: app.defualtMapZoom,
        mapTypeControl: false,
        streetViewControl: false
    });

    app.directionsService = new google.maps.DirectionsService();
    app.currentRoute.route = new google.maps.DirectionsRenderer();

    app.currentRoute.infoWindow = new google.maps.InfoWindow({map: null});
    app.userLocation.infoWindow = new google.maps.InfoWindow({map: null});
    app.nearbyMapMarkers.infoWindow = new google.maps.InfoWindow({map: null});
    app.infoWindow = new google.maps.InfoWindow({map: null});

    app.getUserLocation();
};

app.handleLocationError = function(browserHasGeolocation, infoWindow, pos) {
    app.infoWindow.setPosition(pos);
    app.infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
    app.infoWindow.open(app.map);
};


//===================================
//     EVENT ATTACHMENT METHODS
//===================================

app.events = function() {
    $('button').on('click', function(event) {
        const buttonClicked = $(this);

        if(buttonClicked.val() === 'getUserLocation') {
            console.log('Get User Location!');
            app.getUserLocation();
        }
        else if(buttonClicked.val() === 'findNearBy'){
            console.log('Get Nearby Locations');
            app.getNearbyLocations(app.userLocation.location);
        }
        else if(buttonClicked.val() === 'closeModal') {
            app.displayModalWrapper(false);
        }
        else if(buttonClicked.val() === 'exitRouteView') {
            app.displayCurrentRoute(false);
            app.displayNearbyMapMarkers(true);
            app.map.setCenter(app.userLocation.location);
            app.map.setZoom(app.userMapZoom);
        }
    });

    $('#searchForm').on('submit', function(event) {
        event.preventDefault();
        if(app.userSearchInputResult !== undefined) {
            app.getPlaceDetails(app.userSearchInputResult);
        }
    })

    app.el.$searchField.on('input', function(event) {
        if($(this).val().length > 2) {
            app.searchFor($(this).val());
        }
        else {
            app.el.$autocompleteWrapper.addClass('hidden');
        }
    });

    // app.el.$searchField.on('blur', function(event) {
    //     // app.el.$autocompleteWrapper.addClass('hidden');
    // });

    // app.el.$searchField.on('focus', function(event) {
    //     if(app.el.$autocompleteWrapper.html().length === 0) {
    //         app.el.$autocompleteWrapper.removeClass('hidden');
    //     }
    // });

    $('.container').on("webkitAnimationEnd oAnimationEnd msAnimationEnd animationend", function(event) {
        if(event.originalEvent.animationName === 'fadeOut') {
            $(event.target).addClass('disabled');
            $(event.target).removeClass('fadeOut');
            app.modals.modalFadeOutCallback();
        }

        if(event.originalEvent.animationName === 'fadeIn') {
            $(event.target).removeClass('fadeIn');
        }

    });
};


//===================================
//       APP INITIALIZATION
//===================================

app.init = function() {
    app.events();
    app.initMap();
    app.modals.init();
};


//===================================
//          DOCUMENT READY
//===================================

$(document).ready(function() {
    app.init();
});