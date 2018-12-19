/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createMesh = require('gl-mesh3d');

var parseColorScale = require('../../lib/gl_format_color').parseColorScale;
var str2RgbaArray = require('../../lib/str2rgbarray');
var zip3 = require('../../plots/gl3d/zip3');

function Volume3dTrace(scene, mesh, uid) {
    this.scene = scene;
    this.uid = uid;
    this.mesh = mesh;
    this.name = '';
    this.color = '#fff';
    this.data = null;
    this.showContour = false;
}

var proto = Volume3dTrace.prototype;

proto.handlePick = function(selection) {
    if(selection.object === this.mesh) {
        var selectIndex = selection.index = selection.data.index;

        selection.traceCoordinate = [
            this.data.x[selectIndex],
            this.data.y[selectIndex],
            this.data.z[selectIndex]
        ];

        var text = this.data.text;
        if(Array.isArray(text) && text[selectIndex] !== undefined) {
            selection.textLabel = text[selectIndex];
        } else if(text) {
            selection.textLabel = text;
        }

        return true;
    }
};

function parseColorArray(colors) {
    return colors.map(str2RgbaArray);
}

proto.update = function(data) {
    var scene = this.scene,
        layout = scene.fullSceneLayout;

    this.data = generateVolume3dMesh(data);

    // Unpack position data
    function toDataCoords(axis, coord, scale, calendar) {
        return coord.map(function(x) {
            return axis.d2l(x, 0, calendar) * scale;
        });
    }

    var positions = zip3(
        toDataCoords(layout.xaxis, data.x, scene.dataScale[0], data.xcalendar),
        toDataCoords(layout.yaxis, data.y, scene.dataScale[1], data.ycalendar),
        toDataCoords(layout.zaxis, data.z, scene.dataScale[2], data.zcalendar));

    var cells = zip3(data.i, data.j, data.k);

    var config = {
        positions: positions,
        cells: cells,
        lightPosition: [data.lightposition.x, data.lightposition.y, data.lightposition.z],
        ambient: data.lighting.ambient,
        diffuse: data.lighting.diffuse,
        specular: data.lighting.specular,
        roughness: data.lighting.roughness,
        fresnel: data.lighting.fresnel,
        vertexNormalsEpsilon: data.lighting.vertexnormalsepsilon,
        faceNormalsEpsilon: data.lighting.facenormalsepsilon,
        opacity: data.opacity,
        contourEnable: data.contour.show,
        contourColor: str2RgbaArray(data.contour.color).slice(0, 3),
        contourWidth: data.contour.width,
        useFacetNormals: data.flatshading
    };

    if(data.intensity) {
        this.color = '#fff';
        config.vertexIntensity = data.intensity;
        config.vertexIntensityBounds = [data.cmin, data.cmax];
        config.colormap = parseColorScale(data.colorscale);
    }
    else if(data.vertexcolor) {
        this.color = data.vertexcolor[0];
        config.vertexColors = parseColorArray(data.vertexcolor);
    }
    else if(data.facecolor) {
        this.color = data.facecolor[0];
        config.cellColors = parseColorArray(data.facecolor);
    }
    else {
        this.color = data.color;
        config.meshColor = str2RgbaArray(data.color);
    }

    // Update mesh
    this.mesh.update(config);
};

proto.dispose = function() {
    this.scene.glplot.remove(this.mesh);
    this.mesh.dispose();
};

function generateVolume3dMesh(data) {

    data.intensity = [];

    data.i = [];
    data.j = [];
    data.k = [];

    var allXs = [];
    var allYs = [];
    var allZs = [];

    var allCs = [];
    var allMs = [];

    var width = data.x.length;
    var height = data.y.length;
    var depth = data.z.length;

    var i, j, k;

    var Xs = []; for(i = 0; i < width; i++) { Xs[i] = data.x[i]; }
    var Ys = []; for(j = 0; j < height; j++) { Ys[j] = data.y[j]; }
    var Zs = []; for(k = 0; k < depth; k++) { Zs[k] = data.z[k]; }

    var imin = (data.isovalue[0] !== null) ? data.isovalue[0] : Math.min.apply(null, data.volume);
    var imax = (data.isovalue[1] !== null) ? data.isovalue[1] : Math.max.apply(null, data.volume);

    function getIndex(i, j, k) {
        return i + width * j + width * height * k;
    }

    // record positions and colors
    for(k = 0; k < depth; k++) {
        for(j = 0; j < height; j++) {
            for(i = 0; i < width; i++) {
                allXs.push(Xs[i]);
                allYs.push(Ys[j]);
                allZs.push(Zs[k]);

                var v = data.volume[getIndex(i, j, k)];
                allCs.push(v);
                allMs.push((v > imax || v < imin) ? false : true);
            }
        }
    }

    function addRect(a, b, c, d) {

        if(allMs[a] && allMs[b] && allMs[c] && allMs[d]) {
            data.i.push(a); data.j.push(b); data.k.push(c);
            data.i.push(c); data.j.push(d); data.k.push(a);
            return;
        }

        if(allMs[a] && allMs[b] && allMs[c]) {
            data.i.push(a); data.j.push(b); data.k.push(c);
            return;
        }

        if(allMs[a] && allMs[b] && allMs[d]) {
            data.i.push(a); data.j.push(b); data.k.push(d);
            return;
        }

        if(allMs[a] && allMs[c] && allMs[d]) {
            data.i.push(a); data.j.push(c); data.k.push(d);
            return;
        }

        if(allMs[b] && allMs[c] && allMs[d]) {
            data.i.push(b); data.j.push(c); data.k.push(d);
            return;
        }
    }

    // record positions and colors
    var p00, p01, p10, p11;
    for(j = 1; j < height; j++) {
        for(i = 1; i < width; i++) {

            for(k = 0; k < depth; k++) {
                p00 = getIndex(i - 1, j - 1, k);
                p01 = getIndex(i - 1, j, k);
                p10 = getIndex(i, j - 1, k);
                p11 = getIndex(i, j, k);

                addRect(p00, p01, p11, p10);
            }
        }
    }

    for(k = 1; k < depth; k++) {
        for(j = 1; j < height; j++) {

            for(i = 0; i < width; i++) {
                p00 = getIndex(i, j - 1, k - 1);
                p01 = getIndex(i, j - 1, k);
                p10 = getIndex(i, j, k - 1);
                p11 = getIndex(i, j, k);

                addRect(p00, p01, p11, p10);
            }
        }
    }

    for(i = 1; i < width; i++) {
        for(k = 1; k < depth; k++) {

            for(j = 0; j < height; j++) {
                p00 = getIndex(i - 1, j, k - 1);
                p01 = getIndex(i, j, k - 1);
                p10 = getIndex(i - 1, j, k);
                p11 = getIndex(i, j, k);

                addRect(p00, p01, p11, p10);
            }
        }
    }

    data.x = allXs;
    data.y = allYs;
    data.z = allZs;
    data.intensity = allCs;

    return data;
}

function createVolume3dTrace(scene, data) {

    var gl = scene.glplot.gl;

    var mesh = createMesh({gl: gl});

    var result = new Volume3dTrace(scene, mesh, data.uid);

    mesh._trace = result;
    result.update(data);
    scene.glplot.add(mesh);
    return result;
}

module.exports = createVolume3dTrace;
