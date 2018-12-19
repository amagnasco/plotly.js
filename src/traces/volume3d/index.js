/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Volume3d = {};

Volume3d.attributes = require('./attributes');
Volume3d.supplyDefaults = require('./defaults');
Volume3d.calc = require('./calc');
Volume3d.colorbar = {
    min: 'cmin',
    max: 'cmax'
};
Volume3d.plot = require('./convert');

Volume3d.moduleType = 'trace';
Volume3d.name = 'volume3d',
Volume3d.basePlotModule = require('../../plots/gl3d');
Volume3d.categories = ['gl3d'];
Volume3d.meta = {
    description: [
        'Draws volume3d with coordinates given by',
        'three 1-dimensional arrays in `x`, `y`, `z`',
        'with `width`, `height` & `depth` lengths as well as',
        'another 1-dimensional array volume (data cube).',
    ].join(' ')
};

module.exports = Volume3d;
