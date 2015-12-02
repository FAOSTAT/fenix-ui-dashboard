/*global define, amplify */
define([
    'jquery',
    'loglevel',
    'underscore',
    'fx-m-c/start',
    'fx-ds/config/events',
    'amplify'
], function ($, log, _, MapCreator, E) {

    'use strict';

    var defaultOptions = {

        output_type: "csv"
    };

    var s = {

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

        log.info(this.o.config.layer)

        return this.o.filter || [];

    };

    MapItem.prototype._getOptions = function () {

        return this.o.bridge ||{};

    };

    MapItem.prototype.render = function () {

        var process = this._getProcess();

        amplify.publish(E.LOADING_SHOW, {container: this.o.config.container});

        this.bridge.query(process).then(_.bind(this._onQuerySuccess, this), _.bind(this._onQueryError, this));

    };

    MapItem.prototype._onQuerySuccess = function (model) {

        amplify.publish(E.LOADING_HIDE, {container: this.o.config.container});

        var self = this;

        this.mapCreator = new MapCreator();
        this.mapCreator.render(this.o.config).then(function() {
            self._createJoinLayer(model);
        });


    };

    MapItem.prototype._createJoinLayer = function (model) {

        var layerOptions = this.o.config.layer || {};

        this.mapCreator.addLayer(model, layerOptions);
        this.mapCreator.addCountryBoundaries();

        this.enableExport();
    };


    MapItem.prototype._onQueryError = function () {

        amplify.publish(E.LOADING_HIDE, {container: this.o.config.container});

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

    };


    MapItem.prototype._unbindEventListeners = function () {

    };

    MapItem.prototype.destroy = function () {

       this._unbindEventListeners();

        this.$el.remove();

    };

    return MapItem;
});