/*global define, amplify */
define([
    'jquery',
    'loglevel',
    'underscore',
    'fx-c-c/start',
    // TODO: this is should be
    'fx-ds/config/events',
    'amplify'
], function ($,log,  _, ChartCreator, E) {

    'use strict';

    var defaultOptions = {

    };

    function ChartItem(options) {
        this.o = $.extend(true, {}, defaultOptions, options);

        this._bindEventListeners();

        this.chartCreator = new ChartCreator();

    }

    ChartItem.prototype._bindEventListeners = function () {

    };

    ChartItem.prototype._getProcess = function () {

        return this.o.filter || [];

    };

    ChartItem.prototype._getBridge = function () {

        return this.o.bridge || [];

    };

    ChartItem.prototype.render = function () {

        var process = this._getProcess();

        amplify.publish(E.LOADING_SHOW, {container: this.o.config.container});

        this.bridge.query(process)
            .then(_.bind(this._onQuerySuccess, this), _.bind(this._onQueryError, this));
    };

    ChartItem.prototype._onQuerySuccess = function (model) {

        //this.o.model = model;
        this.o.model = model;

        var chartConfig = $.extend(true, {}, this.o.config, {
            model : this.o.model,
            onReady: _.bind(this.renderCharts, this)
        });

        this.chartCreator.init(chartConfig);

    };

    ChartItem.prototype.renderCharts = function(creator) {

        creator.render(this.o.config);
    };

    ChartItem.prototype._onQueryError = function () {

        log.error("Query error", this);

        // throw error

    };

    ChartItem.prototype._unbindEventListeners = function () {

    };

    ChartItem.prototype.destroy = function () {

       this._unbindEventListeners();

       // TODO: call the chartCreator destroy
       this.$el.remove();
    };

    return ChartItem;
});