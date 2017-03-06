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

app.departTimers = {
    timers: [],
    clearAll: function() {
        app.departTimers.timers.forEach(function(timer) {
            window.clearInterval(timer);
            timer = null;
        });
        app.departTimers.timers = [];
    }
};

app.el = {
    $map: $('#map'),
    $results: $('#results'),
    $resultTimes: $('#resultTimes'),
    $searchField: $('#searchField'),
    $autocompleteWrapper: $('#autocompleteWrapper'),
    $autocompleteList: $('#autocompleteList'),
    $modalWrapper: $('#modalWrapper'),
    $modalContent: $('.modalContent'),
    $departureTimes: $('#departureTimes'),
    $modalDetectLocation: $('#detectingLocation'),
    $modalSearchForLocation: $('#searchForLocation'),
    $modalViewRouteDetails: $('#viewRouteDetails')
};

app.modals = {
    nextModal: null,
    currentModal: null,

    display: function(modal) {
        console.log('modals display', modal);
        app.modals.nextModal = modal;
        app.modals.currentModal.display(false);
    },

    modalFadeOutCallback: function(fadeInNext = true) {
        console.log('modalFadeOutCallback', fadeInNext);
        if(app.modals.currentModal !== null && app.modals.nextModal !== null) {
            app.modals.currentModal = app.modals.nextModal;
            app.modals.currentModal.display(fadeInNext);
        }
    },

    detectLocation: {
        el: app.el.$modalDetectLocation,
        enabled: true,
        display: function(visible) {
            console.log('detectLocation?', visible);
            if(visible) {
                app.displayModalWrapper(true);
                app.modals.detectLocation.el.addClass('fadeIn');
                app.modals.detectLocation.el.removeClass('disabled');
                app.modals.detectLocation.enabled = true;
            }
            else {
                app.modals.detectLocation.el.addClass('fadeOut');
                if(!app.modals.detectLocation.enabled) {
                    app.modals.modalFadeOutCallback(true);
                }
                app.modals.detectLocation.enabled = false;
            }
        }
    },

    searchForLocation: {
        el: app.el.$modalSearchForLocation,
        enabled: false,
        display: function(visible) {
            console.log('searchForLocation?', visible);
            if(visible) {
                app.displayModalWrapper(true);
                app.modals.searchForLocation.el.addClass('fadeIn');
                app.modals.searchForLocation.el.removeClass('disabled');
                app.modals.searchForLocation.enabled = true;
            }
            else {
                app.modals.searchForLocation.el.addClass('fadeOut');
                if(!app.modals.searchForLocation.enabled) {
                    app.modals.modalFadeOutCallback(true);
                }
                app.modals.searchForLocation.enabled = false;
            }
        }
    },

    viewRouteDetails: {
        el: app.el.$modalViewRouteDetails,
        enabled: false,
        display: function(visible) {
            console.log('viewRouteDetails?', visible);
            if(visible) {
                app.displayModalWrapper(true);
                app.modals.viewRouteDetails.el.addClass('fadeIn');
                app.modals.viewRouteDetails.el.removeClass('disabled');
                app.modals.viewRouteDetails.enabled = true;
            }
            else {
                app.modals.viewRouteDetails.el.addClass('fadeOut');
                if(!app.modals.viewRouteDetails.enabled) {
                    app.modals.modalFadeOutCallback(true);
                }
                app.modals.viewRouteDetails.enabled = false;
            }
        }
    },

    emptyModal: {
        enabled: false,
        display: function(visible) {
            if(visible) {
                app.modals.viewRouteDetails.enabled = true;
            }
            else {
                app.modals.viewRouteDetails.enabled = false;
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
        app.departTimers.clearAll();
        app.el.$modalWrapper.removeClass('fadeIn');
        app.el.$modalWrapper.addClass('fadeOut');
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
        if($.isNumeric(stopInfo.stop_code)) {
            
            // Wait for Transit Stop Stop Times request to come back
            $.when(app.getTransitStopTimes(stopInfo.stop_code))
            .done(function(timeInfo) {
                let earliestTime;
                const predictions = timeInfo.body.predictions;
                const validatedPredictions = [];

                // console.log('[PREDICTIONS]',predictions)

                predictions.forEach(function(prediction) {
                    if(prediction.direction !== undefined) {
                        if(prediction.direction.prediction[0] !== undefined) {
                            validatedPredictions.push(prediction);
                        }
                    }
                });

                // console.log(validatedPredictions);

                earliestTime = validatedPredictions[0];

                if(validatedPredictions.length > 1) {
                    validatedPredictions.forEach(function(prediction) {
                        if(prediction.direction.prediction[0].epochTime < earliestTime.direction.prediction[0].epochTime) {
                            earliestTime = prediction;
                        }
                    });
                } 

                app.el.$departureTimes.empty();
                app.departTimers.clearAll();
                earliestTime.direction.prediction.forEach(function(prediction) {
                    const formattedTravelTime = app.formatTime(app.currentRoute.route.directions.routes[0].legs[0].duration.value * 1000);
                    $('#routeTitle').html(earliestTime.stopTitle)
                    $('#travelTime').html(`Travel Time: ${formattedTravelTime}`);
                    
                    const departTimer = $('<li>')
                        .addClass('departureTime')
                        .html(`--:-- <i class="fa fa-question" aria-hidden="true"></i>`)
                        .appendTo(app.el.$departureTimes
                    );

                    const timer = window.setInterval(function() {
                        console.log('tick');
                        let timeUntilDeparture = prediction.epochTime - Date.now();
                        if(timeUntilDeparture <= 0) {
                            console.log('Stoping Timer! Zeroed out!');
                            clearInterval(timer);
                        }
                        else {
                            const formattedTime = app.formatTime(timeUntilDeparture);
                            const travelTime = app.currentRoute.route.directions.routes[0].legs[0].duration.value * 1000;
                            let icon = '<i class="fa fa-check" aria-hidden="true"></i>'
                            // routeTitle
                            if((timeUntilDeparture - travelTime) <= 0) {
                                icon = '<i class="fa fa-times" aria-hidden="true"></i>'
                                departTimer.addClass('cantMakeIt');
                            }
                            departTimer.html(`${formattedTime} ${icon}`);
                        }
                    },1000);

                    app.departTimers.timers.push(timer)

                });
                // app.el.$departureTimes.text('Details here!');
                console.log('Calling viewRouteDetails display');
                app.modals.display(app.modals.viewRouteDetails);
                // app.modals.viewRouteDetails.display(true);
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


app.formatTime = function(milliseconds) {
    let minutes = Math.floor((milliseconds / 1000 / 60));
    let seconds = Math.floor(milliseconds / 1000 % 60);
    let minutesLeadingZero = '';
    let secondsLeadingZero = '';

    if(String(minutes).length === 1) {
        minutesLeadingZero = '0';
    }

    if(String(seconds).length === 1) {
        secondsLeadingZero = '0';
    }

    return `${minutesLeadingZero}${minutes}:${secondsLeadingZero}${seconds}`;
}

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
                app.setRouteTo(place.geometry.location);
                app.displayRouteDetails(place.geometry.location);
            });

            // app.nearbyMapMarkers.infoWindow
            // // const markerThis = this;
            // const coords = place.geometry.location;
            // let stopTimesResponse;
            // app.userMapZoom = app.map.getZoom();
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

                app.currentRoute.infoWindow.setContent(
                    response.routes[0].legs[0].steps[0].distance.text + 
                    "<br>" + response.routes[0].legs[0].steps[0].duration.text + " "
                );
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
            app.getUserLocation();
        }
        else if(buttonClicked.val() === 'findNearBy'){
            app.getNearbyLocations(app.userLocation.location);
        }
        else if(buttonClicked.val() === 'closeModal') {
            console.log('Close Modal');
            app.displayModalWrapper(false);
            app.modals.display(app.modals.emptyModal);
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

    $(app.el.$modalWrapper).on("webkitAnimationEnd oAnimationEnd msAnimationEnd animationend", function(event) {
        if(event.originalEvent.animationName === 'fadeOut') {
            $(event.target).addClass('disabled');
            $(event.target).removeClass('fadeOut');
            const fadeInNext = !($(event.target).is(app.el.$modalWrapper));
            app.modals.modalFadeOutCallback(fadeInNext);
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