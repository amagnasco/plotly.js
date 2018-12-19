/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorscaleCalc = require('../../components/colorscale/calc');

module.exports = function calc(gd, trace) {

    var imin = (trace.isovalue[0] !== null) ? trace.isovalue[0] : Math.min.apply(null, trace.volume);
    var imax = (trace.isovalue[1] !== null) ? trace.isovalue[1] : Math.max.apply(null, trace.volume);

    colorscaleCalc(gd, trace, {
        vals: [imin, imax],
        containerStr: '',
        cLetter: 'c'
    });
};
