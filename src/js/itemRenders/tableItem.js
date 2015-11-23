/*global define, amplify */
define([
    'jquery',
    'loglevel',
    'underscore',
    'fs-t-c/table',
    'amplify'
], function ($, log, _, TableCreator) {

    'use strict';

    var defaultOptions = {

    };

    function TableItem(options) {

        this.o = $.extend(true, {}, defaultOptions, options);

        this._bindEventListeners();

        this.tableCreator = new TableCreator();

        log.info(this.tableCreator)

    }

    TableItem.prototype._bindEventListeners = function () {

    };

    TableItem.prototype._getProcess = function () {

        return this.o.filter || [];
    };

    TableItem.prototype.render = function () {

        var process = this._getProcess();

        amplify.publish(E.LOADING_SHOW, {container: this.o.config.container});

        this.bridge.query(process).then(
            _.bind(this._onQuerySuccess, this),
            _.bind(this._onQueryError, this)
        );

    };

    TableItem.prototype._onQuerySuccess = function (model) {

        amplify.publish(E.LOADING_HIDE, {container: this.o.config.container});

        this.o.model = model;

        this.tableCreator.render($.extend(true, {},
            this.o.config, {
            model: this.o.model
        }));

    };

    TableItem.prototype._onQueryError = function () {

        log.error("Query error");

    };

    TableItem.prototype._unbindEventListeners = function () {

    };

    TableItem.prototype.destroy = function () {

       this._unbindEventListeners();
    };

    return TableItem;
});