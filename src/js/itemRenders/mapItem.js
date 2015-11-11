/*global define, amplify */
define([
    'jquery',
    'underscore',
    'fx-m-c/start',
    'fx-ds/config/events',
    'amplify'
], function ($, _, MapCreator) {

    'use strict';

    var defaultOptions = {

    };

    function MapItem(options) {

        this.o = $.extend(true, {}, defaultOptions, options);

        this._bindEventListeners();

        this.mapCreator = new MapCreator();

        this.mapCreator.render(this.o.config);

    }

    MapItem.prototype._bindEventListeners = function () {

    };

    MapItem.prototype._getProcess = function () {

        return this.o.filter || [];

    };

    MapItem.prototype.render = function () {

        var process = this._getProcess();

        //amplify.publish(E.LOADING_SHOW, {container: this.o.config.container});

        this.bridge.query(process)
            .then(_.bind(this._onQuerySuccess, this), _.bind(this._onQueryError, this));

    };

    MapItem.prototype._onQuerySuccess = function (model) {

        //amplify.publish(E.LOADING_HIDE, {container: this.o.config.container});

        this.mapCreator.addLayer(model);
        this.mapCreator.addCountryBoundaries();

    };

    MapItem.prototype._onQueryError = function () {

        alert("Query error")
    };

    MapItem.prototype._unbindEventListeners = function () {

    };

    MapItem.prototype.destroy = function () {

       this._unbindEventListeners();
    };

    return MapItem;
});