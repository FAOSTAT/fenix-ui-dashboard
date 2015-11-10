/*global define, amplify */

define([
    "jquery",
    'fx-ds/config/config',
    'fx-ds/config/config-default',
    'fx-ds/config/events',
    'fx-ds/config/errors',
    //'fx-ds/config/d3p_filters',
    //'faostatclientAPI',
    'faostatapiclient',
    'q',
    "amplify"
], function ($, C, DC, E, Err, FAOSTATClientAPI, Q) {

    'use strict';

    var defaultOptions = { };

    function FAOSTAT_bridge(options) {

        this.faostatAPI = new FAOSTATClientAPI();

        this.o = $.extend(true, {}, defaultOptions, options);

        return this;
    }

    FAOSTAT_bridge.prototype.getFirstPage = function () {

        return this.getPage(1);
    };

    FAOSTAT_bridge.prototype.getPage = function (page) {

        return this.getPage(page);
    };

    FAOSTAT_bridge.prototype.query = function ( filter ) {

        console.log(this.faostatAPI);

        return this.faostatAPI.data(filter);
    };

    return FAOSTAT_bridge;

});