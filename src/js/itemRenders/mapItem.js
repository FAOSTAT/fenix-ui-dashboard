/*global define, amplify */
define([
    'jquery',
    'loglevel',
    'underscore',
    'fx-m-c/start',
    'fx-ds/config/events',
    'leaflet-image',
    'amplify'
], function ($, log, _, MapCreator, E, leafletImage) {

    'use strict';

    var defaultOptions = {

        output_type: "csv"

    },
        s = {

        EXPORT: '[data-role="export"]'

    };

    function MapItem(options) {

        this.o = $.extend(true, {}, defaultOptions, options);

        this._bindEventListeners();

/*        this.mapCreator = new MapCreator();
        this.mapCreator.render(this.o.config);*/

    }

    MapItem.prototype._bindEventListeners = function () {

    };

    MapItem.prototype._getProcess = function () {

        return this.o.filter || [];

    };

    MapItem.prototype._getOptions = function () {

        return this.o.bridge ||{};

    };

    MapItem.prototype.render = function () {

        var process = this._getProcess();

        amplify.publish(E.LOADING_SHOW, {container: this.$el});

        this.bridge.query(process).then(_.bind(this._onQuerySuccess, this), _.bind(this._onQueryError, this));

    };

    MapItem.prototype._onQuerySuccess = function (model) {

        amplify.publish(E.LOADING_HIDE, {container: this.$el});

        var self = this;

        this.mapCreator = new MapCreator();
        this.mapCreator.render(this.o.config).then(function () {

            //log.info("here")

            var CartoDB_Positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19,
                zIndex: 0
            });

            var CartoDB_PositronNoLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19,
                zIndex: 0
            });

            var Esri_WorldGrayCanvas = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
                maxZoom: 16,
                zIndex: 0
            });

            var Acetate_hillshading = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/hillshading/{z}/{x}/{y}.png', {
                attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
                subdomains: '0123',
                minZoom: 2,
                maxZoom: 18,
                zIndex: 100
            });

            var Esri_WorldPhysical = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',
                maxZoom: 8,
                zIndex: 0,
                opacity: 0.4
            });


            // added dirty baselyaer
            self.mapCreator.adapter.fenixMap.map.addLayer(Esri_WorldPhysical);

            self._createJoinLayer(model);
        });


    };

    MapItem.prototype._createJoinLayer = function (model) {

        var layerOptions = this.o.config.layer || {},
            modelOptions = this.o.config.adapter || {};

        this.mapCreator.addLayer(model, layerOptions, modelOptions);
        this.mapCreator.addCountryBoundaries();


        var CartoDB_PositronOnlyLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: 'abcd',
            maxZoom: 19,
            zIndex: 100000,
            opacity: 0.9
        });

        // added dirty labels
        this.mapCreator.adapter.fenixMap.map.addLayer(CartoDB_PositronOnlyLabels);

        this.enableExport();
    };


    MapItem.prototype._onQueryError = function () {

        amplify.publish(E.LOADING_HIDE, {container: this.$el});

        log.error("Query error");

    };

    MapItem.prototype.enableExport = function () {

        var self = this;

        $(this.mapCreator.getContainer()).find(s.EXPORT).on('click', function(e){
            self.export();
        });

    };

    MapItem.prototype.export = function () {

        var process = this._getProcess(),
            options = this._getOptions();

        amplify.publish(E.EXPORT_DATA, process, options);


/*        var map = this.mapCreator.adapter.fenixMap.map;
        leafletImage(map, function(err, canvas) {

            // now you have canvas
            // example thing to do with that canvas:
            var img = document.createElement('img');
            var dimensions = map.getSize();
            img.width = dimensions.x;
            img.height = dimensions.y;
            img.src = canvas.toDataURL();
            $('body').append(img);
            // document.getElementById('images').innerHTML = '';
            // document.getElementById('images').appendChild(img);
        });*/

    };


    MapItem.prototype._unbindEventListeners = function () {

    };

    MapItem.prototype.destroy = function () {

       this._unbindEventListeners();

        if ( this.mapCreator) {
            this.mapCreator.destroy();
        }

        if (this.$el) {
            this.$el.remove();
        }

    };

    return MapItem;
});