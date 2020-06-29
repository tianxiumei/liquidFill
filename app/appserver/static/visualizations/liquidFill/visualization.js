define(['exports', 'react', 'react-dom', '@qn-pandora/visualization-sdk', 'echarts/lib/echarts', 'echarts/lib/data/helper/completeDimensions', 'echarts/lib/util/symbol', 'echarts/lib/visual/dataColor', 'echarts', 'lodash'], function (exports, React, ReactDom, visualizationSdk, echarts, completeDimensions, symbol, dataColor, echarts$1, lodash) { 'use strict';

    var React__default = 'default' in React ? React['default'] : React;
    echarts = echarts && Object.prototype.hasOwnProperty.call(echarts, 'default') ? echarts['default'] : echarts;
    completeDimensions = completeDimensions && Object.prototype.hasOwnProperty.call(completeDimensions, 'default') ? completeDimensions['default'] : completeDimensions;
    symbol = symbol && Object.prototype.hasOwnProperty.call(symbol, 'default') ? symbol['default'] : symbol;
    dataColor = dataColor && Object.prototype.hasOwnProperty.call(dataColor, 'default') ? dataColor['default'] : dataColor;
    echarts$1 = echarts$1 && Object.prototype.hasOwnProperty.call(echarts$1, 'default') ? echarts$1['default'] : echarts$1;

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    echarts.extendSeriesModel({

        type: 'series.liquidFill',

        visualColorAccessPath: 'textStyle.normal.color',

        optionUpdated: function () {
            var option = this.option;
            option.gridSize = Math.max(Math.floor(option.gridSize), 4);
        },

        getInitialData: function (option, ecModel) {
            var dimensions = completeDimensions(['value'], option.data);
            var list = new echarts.List(dimensions, this);
            list.initData(option.data);
            return list;
        },

        defaultOption: {
            color: ['#294D99', '#156ACF', '#1598ED', '#45BDFF'],
            center: ['50%', '50%'],
            radius: '50%',
            amplitude: '8%',
            waveLength: '80%',
            phase: 'auto',
            period: 'auto',
            direction: 'right',
            shape: 'circle',

            waveAnimation: true,
            animationEasing: 'linear',
            animationEasingUpdate: 'linear',
            animationDuration: 2000,
            animationDurationUpdate: 1000,

            outline: {
                show: true,
                borderDistance: 8,
                itemStyle: {
                    color: 'none',
                    borderColor: '#294D99',
                    borderWidth: 8,
                    shadowBlur: 20,
                    shadowColor: 'rgba(0, 0, 0, 0.25)'
                }
            },

            backgroundStyle: {
                color: '#E3F7FF'
            },

            itemStyle: {
                opacity: 0.95,
                shadowBlur: 50,
                shadowColor: 'rgba(0, 0, 0, 0.4)'
            },

            label: {
                show: true,
                color: '#294D99',
                insideColor: '#fff',
                fontSize: 50,
                fontWeight: 'bold',

                align: 'center',
                baseline: 'middle',
                position: 'inside'
            },

            emphasis: {
                itemStyle: {
                    opacity: 0.8
                }
            }
        }
    });

    var liquidFillLayout = echarts.graphic.extendShape({
        type: 'ec-liquid-fill',

        shape: {
            waveLength: 0,
            radius: 0,
            radiusY: 0,
            cx: 0,
            cy: 0,
            waterLevel: 0,
            amplitude: 0,
            phase: 0,
            inverse: false
        },

        buildPath: function (ctx, shape) {
            if (shape.radiusY == null) {
                shape.radiusY = shape.radius;
            }

            /**
             * We define a sine wave having 4 waves, and make sure at least 8 curves
             * is drawn. Otherwise, it may cause blank area for some waves when
             * wave length is large enough.
             */
            var curves = Math.max(
                Math.ceil(2 * shape.radius / shape.waveLength * 4) * 2,
                8
            );

            // map phase to [-Math.PI * 2, 0]
            while (shape.phase < -Math.PI * 2) {
                shape.phase += Math.PI * 2;
            }
            while (shape.phase > 0) {
                shape.phase -= Math.PI * 2;
            }
            var phase = shape.phase / Math.PI / 2 * shape.waveLength;

            var left = shape.cx - shape.radius + phase - shape.radius * 2;

            /**
             * top-left corner as start point
             *
             * draws this point
             *  |
             * \|/
             *  ~~~~~~~~
             *  |      |
             *  +------+
             */
            ctx.moveTo(left, shape.waterLevel);

            /**
             * top wave
             *
             * ~~~~~~~~ <- draws this sine wave
             * |      |
             * +------+
             */
            var waveRight = 0;
            for (var c = 0; c < curves; ++c) {
                var stage = c % 4;
                var pos = getWaterPositions(c * shape.waveLength / 4, stage,
                    shape.waveLength, shape.amplitude);
                ctx.bezierCurveTo(pos[0][0] + left, -pos[0][1] + shape.waterLevel,
                    pos[1][0] + left, -pos[1][1] + shape.waterLevel,
                    pos[2][0] + left, -pos[2][1] + shape.waterLevel);

                if (c === curves - 1) {
                    waveRight = pos[2][0];
                }
            }

            if (shape.inverse) {
                /**
                 * top-right corner
                 *                  2. draws this line
                 *                          |
                 *                       +------+
                 * 3. draws this line -> |      | <- 1. draws this line
                 *                       ~~~~~~~~
                 */
                ctx.lineTo(waveRight + left, shape.cy - shape.radiusY);
                ctx.lineTo(left, shape.cy - shape.radiusY);
                ctx.lineTo(left, shape.waterLevel);
            }
            else {
                /**
                 * top-right corner
                 *
                 *                       ~~~~~~~~
                 * 3. draws this line -> |      | <- 1. draws this line
                 *                       +------+
                 *                          ^
                 *                          |
                 *                  2. draws this line
                 */
                ctx.lineTo(waveRight + left, shape.cy + shape.radiusY);
                ctx.lineTo(left, shape.cy + shape.radiusY);
                ctx.lineTo(left, shape.waterLevel);
            }

            ctx.closePath();
        }
    });



    /**
     * Using Bezier curves to fit sine wave.
     * There is 4 control points for each curve of wave,
     * which is at 1/4 wave length of the sine wave.
     *
     * The control points for a wave from (a) to (d) are a-b-c-d:
     *          c *----* d
     *     b *
     *       |
     * ... a * ..................
     *
     * whose positions are a: (0, 0), b: (0.5, 0.5), c: (1, 1), d: (PI / 2, 1)
     *
     * @param {number} x          x position of the left-most point (a)
     * @param {number} stage      0-3, stating which part of the wave it is
     * @param {number} waveLength wave length of the sine wave
     * @param {number} amplitude  wave amplitude
     */
    function getWaterPositions(x, stage, waveLength, amplitude) {
        if (stage === 0) {
            return [
                [x + 1 / 2 * waveLength / Math.PI / 2, amplitude / 2],
                [x + 1 / 2 * waveLength / Math.PI,     amplitude],
                [x + waveLength / 4,                   amplitude]
            ];
        }
        else if (stage === 1) {
            return [
                [x + 1 / 2 * waveLength / Math.PI / 2 * (Math.PI - 2),
                amplitude],
                [x + 1 / 2 * waveLength / Math.PI / 2 * (Math.PI - 1),
                amplitude / 2],
                [x + waveLength / 4,                   0]
            ]
        }
        else if (stage === 2) {
            return [
                [x + 1 / 2 * waveLength / Math.PI / 2, -amplitude / 2],
                [x + 1 / 2 * waveLength / Math.PI,     -amplitude],
                [x + waveLength / 4,                   -amplitude]
            ]
        }
        else {
            return [
                [x + 1 / 2 * waveLength / Math.PI / 2 * (Math.PI - 2),
                -amplitude],
                [x + 1 / 2 * waveLength / Math.PI / 2 * (Math.PI - 1),
                -amplitude / 2],
                [x + waveLength / 4,                   0]
            ]
        }
    }

    var numberUtil = echarts.number;

    var parsePercent = numberUtil.parsePercent;

    echarts.extendChartView({

        type: 'liquidFill',

        render: function (seriesModel, ecModel, api) {
            var group = this.group;
            group.removeAll();

            var data = seriesModel.getData();

            var itemModel = data.getItemModel(0);

            var center = itemModel.get('center');
            var radius = itemModel.get('radius');

            var width = api.getWidth();
            var height = api.getHeight();
            var size = Math.min(width, height);
            // itemStyle
            var outlineDistance = 0;
            var outlineBorderWidth = 0;
            var showOutline = seriesModel.get('outline.show');

            if (showOutline) {
                outlineDistance = seriesModel.get('outline.borderDistance');
                outlineBorderWidth = parsePercent(
                    seriesModel.get('outline.itemStyle.borderWidth'), size
                );
            }

            var cx = parsePercent(center[0], width);
            var cy = parsePercent(center[1], height);

            var outterRadius;
            var innerRadius;
            var paddingRadius;

            var isFillContainer = false;

            var symbol$1 = seriesModel.get('shape');
            if (symbol$1 === 'container') {
                // a shape that fully fills the container
                isFillContainer = true;

                outterRadius = [
                    width / 2,
                    height / 2
                ];
                innerRadius = [
                    outterRadius[0] - outlineBorderWidth / 2,
                    outterRadius[1] - outlineBorderWidth / 2
                ];
                paddingRadius = [
                    parsePercent(outlineDistance, width),
                    parsePercent(outlineDistance, height)
                ];

                radius = [
                    Math.max(innerRadius[0] - paddingRadius[0], 0),
                    Math.max(innerRadius[1] - paddingRadius[1], 0)
                ];
            }
            else {
                outterRadius = parsePercent(radius, size) / 2;
                innerRadius = outterRadius - outlineBorderWidth / 2;
                paddingRadius = parsePercent(outlineDistance, size);

                radius = Math.max(innerRadius - paddingRadius, 0);
            }

            if (showOutline) {
                var outline = getOutline();
                outline.style.lineWidth = outlineBorderWidth;
                group.add(getOutline());
            }

            var left = isFillContainer ? 0 : cx - radius;
            var top = isFillContainer ? 0 : cy - radius;

            var wavePath = null;

            group.add(getBackground());

            // each data item for a wave
            var oldData = this._data;
            var waves = [];
            data.diff(oldData)
                .add(function (idx) {
                    var wave = getWave(idx, false);

                    var waterLevel = wave.shape.waterLevel;
                    wave.shape.waterLevel = isFillContainer ? height / 2 : radius;
                    echarts.graphic.initProps(wave, {
                        shape: {
                            waterLevel: waterLevel
                        }
                    }, seriesModel);

                    wave.z2 = 2;
                    setWaveAnimation(idx, wave, null);

                    group.add(wave);
                    data.setItemGraphicEl(idx, wave);
                    waves.push(wave);
                })
                .update(function (newIdx, oldIdx) {
                    var waveElement = oldData.getItemGraphicEl(oldIdx);

                    // new wave is used to calculate position, but not added
                    var newWave = getWave(newIdx, false, waveElement);

                    // changes with animation
                    var shape = {};
                    var shapeAttrs = ['amplitude', 'cx', 'cy', 'phase', 'radius', 'radiusY', 'waterLevel', 'waveLength'];
                    for (var i = 0; i < shapeAttrs.length; ++i) {
                        var attr = shapeAttrs[i];
                        if (newWave.shape.hasOwnProperty(attr)) {
                            shape[attr] = newWave.shape[attr];
                        }
                    }

                    var style = {};
                    var styleAttrs = ['fill', 'opacity', 'shadowBlur', 'shadowColor'];
                    for (var i = 0; i < styleAttrs.length; ++i) {
                        var attr = styleAttrs[i];
                        if (newWave.style.hasOwnProperty(attr)) {
                            style[attr] = newWave.style[attr];
                        }
                    }

                    if (isFillContainer) {
                        shape.radiusY = height / 2;
                    }

                    // changes with animation
                    echarts.graphic.updateProps(waveElement, {
                        shape: shape
                    }, seriesModel);

                    waveElement.useStyle(style);

                    // instant changes
                    waveElement.position = newWave.position;
                    waveElement.setClipPath(newWave.clipPath);
                    waveElement.shape.inverse = newWave.inverse;

                    setWaveAnimation(newIdx, waveElement, waveElement);
                    group.add(waveElement);
                    data.setItemGraphicEl(newIdx, waveElement);
                    waves.push(waveElement);
                })
                .remove(function (idx) {
                    var wave = oldData.getItemGraphicEl(idx);
                    group.remove(wave);
                })
                .execute();

            if (itemModel.get('label.show')) {
                group.add(getText(waves));
            }

            this._data = data;

            /**
             * Get path for outline, background and clipping
             *
             * @param {number} r outter radius of shape
             * @param {boolean|undefined} isForClipping if the shape is used
             *                                          for clipping
             */
            function getPath(r, isForClipping) {
                if (symbol$1) {
                    // customed symbol path
                    if (symbol$1.indexOf('path://') === 0) {
                        var path = echarts.graphic.makePath(symbol$1.slice(7), {});
                        var bouding = path.getBoundingRect();
                        var w = bouding.width;
                        var h = bouding.height;
                        if (w > h) {
                            h = r * 2 / w * h;
                            w = r * 2;
                        }
                        else {
                            w = r * 2 / h * w;
                            h = r * 2;
                        }

                        var left = isForClipping ? 0 : cx - w / 2;
                        var top = isForClipping ? 0 : cy - h / 2;
                        path = echarts.graphic.makePath(
                            symbol$1.slice(7),
                            {},
                            new echarts.graphic.BoundingRect(left, top, w, h)
                        );
                        if (isForClipping) {
                            path.position = [-w / 2, -h / 2];
                        }
                        return path;
                    }
                    else if (isFillContainer) {
                        // fully fill the container
                        var x = isForClipping ? -r[0] : cx - r[0];
                        var y = isForClipping ? -r[1] : cy - r[1];
                        return symbol.createSymbol(
                            'rect', x, y, r[0] * 2, r[1] * 2
                        );
                    }
                    else {
                        var x = isForClipping ? -r : cx - r;
                        var y = isForClipping ? -r : cy - r;
                        if (symbol$1 === 'pin') {
                            y += r;
                        }
                        else if (symbol$1 === 'arrow') {
                            y -= r;
                        }
                        return symbol.createSymbol(symbol$1, x, y, r * 2, r * 2);
                    }
                }

                return new echarts.graphic.Circle({
                    shape: {
                        cx: isForClipping ? 0 : cx,
                        cy: isForClipping ? 0 : cy,
                        r: r
                    }
                });
            }
            /**
             * Create outline
             */
            function getOutline() {
                var outlinePath = getPath(outterRadius);
                outlinePath.style.fill = null;

                outlinePath.setStyle(seriesModel.getModel('outline.itemStyle')
                    .getItemStyle());

                return outlinePath;
            }

            /**
             * Create background
             */
            function getBackground() {
                // Seperate stroke and fill, so we can use stroke to cover the alias of clipping.
                var strokePath = getPath(radius);
                strokePath.setStyle(seriesModel.getModel('backgroundStyle')
                    .getItemStyle());
                strokePath.style.fill = null;

                // Stroke is front of wave
                strokePath.z2 = 5;

                var fillPath = getPath(radius);
                fillPath.setStyle(seriesModel.getModel('backgroundStyle')
                    .getItemStyle());
                fillPath.style.stroke = null;

                var group = new echarts.graphic.Group();
                group.add(strokePath);
                group.add(fillPath);

                return group;
            }

            /**
             * wave shape
             */
            function getWave(idx, isInverse, oldWave) {
                var radiusX = isFillContainer ? radius[0] : radius;
                var radiusY = isFillContainer ? height / 2 : radius;

                var itemModel = data.getItemModel(idx);
                var itemStyleModel = itemModel.getModel('itemStyle');
                var phase = itemModel.get('phase');
                var amplitude = parsePercent(itemModel.get('amplitude'),
                    radiusY * 2);
                var waveLength = parsePercent(itemModel.get('waveLength'),
                    radiusX * 2);

                var value = data.get('value', idx);
                var waterLevel = radiusY - value * radiusY * 2;
                phase = oldWave ? oldWave.shape.phase
                    : (phase === 'auto' ? idx * Math.PI / 4 : phase);
                var normalStyle = itemStyleModel.getItemStyle();
                if (!normalStyle.fill) {
                    var seriesColor = seriesModel.get('color');
                    var id = idx % seriesColor.length;
                    normalStyle.fill = seriesColor[id];
                }

                var x = radiusX * 2;
                var wave = new liquidFillLayout({
                    shape: {
                        waveLength: waveLength,
                        radius: radiusX,
                        radiusY: radiusY,
                        cx: x,
                        cy: 0,
                        waterLevel: waterLevel,
                        amplitude: amplitude,
                        phase: phase,
                        inverse: isInverse
                    },
                    style: normalStyle,
                    position: [cx, cy]
                });
                wave.shape._waterLevel = waterLevel;

                var hoverStyle = itemModel.getModel('emphasis.itemStyle')
                    .getItemStyle();
                hoverStyle.lineWidth = 0;
                echarts.graphic.setHoverStyle(wave, hoverStyle);

                // clip out the part outside the circle
                var clip = getPath(radius, true);
                // set fill for clipPath, otherwise it will not trigger hover event
                clip.setStyle({
                    fill: 'white'
                });
                wave.setClipPath(clip);

                return wave;
            }

            function setWaveAnimation(idx, wave, oldWave) {
                var itemModel = data.getItemModel(idx);

                var maxSpeed = itemModel.get('period');
                var direction = itemModel.get('direction');

                var value = data.get('value', idx);

                var phase = itemModel.get('phase');
                phase = oldWave ? oldWave.shape.phase
                    : (phase === 'auto' ? idx * Math.PI / 4 : phase);

                var defaultSpeed = function (maxSpeed) {
                    var cnt = data.count();
                    return cnt === 0 ? maxSpeed : maxSpeed *
                        (0.2 + (cnt - idx) / cnt * 0.8);
                };
                var speed = 0;
                if (maxSpeed === 'auto') {
                    speed = defaultSpeed(5000);
                }
                else {
                    speed = typeof maxSpeed === 'function'
                        ? maxSpeed(value, idx) : maxSpeed;
                }

                // phase for moving left/right
                var phaseOffset = 0;
                if (direction === 'right' || direction == null) {
                    phaseOffset = Math.PI;
                }
                else if (direction === 'left') {
                    phaseOffset = -Math.PI;
                }
                else if (direction === 'none') {
                    phaseOffset = 0;
                }
                else {
                    console.error('Illegal direction value for liquid fill.');
                }

                // wave animation of moving left/right
                if (direction !== 'none' && itemModel.get('waveAnimation')) {
                    wave
                        .animate('shape', true)
                        .when(0, {
                            phase: phase
                        })
                        .when(speed / 2, {
                            phase: phaseOffset + phase
                        })
                        .when(speed, {
                            phase: phaseOffset * 2 + phase
                        })
                        .during(function () {
                            if (wavePath) {
                                wavePath.dirty(true);
                            }
                        })
                        .start();
                }
            }

            /**
             * text on wave
             */
            function getText(waves) {
                var labelModel = itemModel.getModel('label');

                function formatLabel() {
                    var formatted = seriesModel.getFormattedLabel(0, 'normal');
                    var defaultVal = (data.get('value', 0) * 100);
                    var defaultLabel = data.getName(0) || seriesModel.name;
                    if (!isNaN(defaultVal)) {
                        defaultLabel = defaultVal.toFixed(0) + '%';
                    }
                    return formatted == null ? defaultLabel : formatted;
                }

                var textOption = {
                    z2: 10,
                    shape: {
                        x: left,
                        y: top,
                        width: (isFillContainer ? radius[0] : radius) * 2,
                        height: (isFillContainer ? radius[1] : radius) * 2
                    },
                    style: {
                        fill: 'transparent',
                        text: formatLabel(),
                        textAlign: labelModel.get('align'),
                        textVerticalAlign: labelModel.get('baseline')
                    },
                    silent: true
                };

                var outsideTextRect = new echarts.graphic.Rect(textOption);
                var color = labelModel.get('color');
                echarts.graphic.setText(outsideTextRect.style, labelModel, color);

                var insideTextRect = new echarts.graphic.Rect(textOption);
                var insColor = labelModel.get('insideColor');
                echarts.graphic.setText(insideTextRect.style, labelModel, insColor);
                insideTextRect.style.textFill = insColor;

                var group = new echarts.graphic.Group();
                group.add(outsideTextRect);
                group.add(insideTextRect);

                // clip out waves for insideText
                var boundingCircle = getPath(radius, true);

                wavePath = new echarts.graphic.CompoundPath({
                    shape: {
                        paths: waves
                    },
                    position: [cx, cy]
                });

                wavePath.setClipPath(boundingCircle);
                insideTextRect.setClipPath(wavePath);

                return group;
            }
        },

        dispose: function () {
            // dispose nothing here
        }
    });

    echarts.registerVisual(
        echarts.util.curry(
            dataColor, 'liquidFill'
        )
    );

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    /** @license React v16.13.1
     * react-is.production.min.js
     *
     * Copyright (c) Facebook, Inc. and its affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */
    var b="function"===typeof Symbol&&Symbol.for,c=b?Symbol.for("react.element"):60103,d=b?Symbol.for("react.portal"):60106,e=b?Symbol.for("react.fragment"):60107,f=b?Symbol.for("react.strict_mode"):60108,g=b?Symbol.for("react.profiler"):60114,h=b?Symbol.for("react.provider"):60109,k=b?Symbol.for("react.context"):60110,l=b?Symbol.for("react.async_mode"):60111,m=b?Symbol.for("react.concurrent_mode"):60111,n=b?Symbol.for("react.forward_ref"):60112,p=b?Symbol.for("react.suspense"):60113,q=b?
    Symbol.for("react.suspense_list"):60120,r=b?Symbol.for("react.memo"):60115,t=b?Symbol.for("react.lazy"):60116,v=b?Symbol.for("react.block"):60121,w=b?Symbol.for("react.fundamental"):60117,x=b?Symbol.for("react.responder"):60118,y=b?Symbol.for("react.scope"):60119;
    function z(a){if("object"===typeof a&&null!==a){var u=a.$$typeof;switch(u){case c:switch(a=a.type,a){case l:case m:case e:case g:case f:case p:return a;default:switch(a=a&&a.$$typeof,a){case k:case n:case t:case r:case h:return a;default:return u}}case d:return u}}}function A(a){return z(a)===m}var AsyncMode=l;var ConcurrentMode=m;var ContextConsumer=k;var ContextProvider=h;var Element=c;var ForwardRef=n;var Fragment=e;var Lazy=t;var Memo=r;var Portal=d;
    var Profiler=g;var StrictMode=f;var Suspense=p;var isAsyncMode=function(a){return A(a)||z(a)===l};var isConcurrentMode=A;var isContextConsumer=function(a){return z(a)===k};var isContextProvider=function(a){return z(a)===h};var isElement=function(a){return "object"===typeof a&&null!==a&&a.$$typeof===c};var isForwardRef=function(a){return z(a)===n};var isFragment=function(a){return z(a)===e};var isLazy=function(a){return z(a)===t};
    var isMemo=function(a){return z(a)===r};var isPortal=function(a){return z(a)===d};var isProfiler=function(a){return z(a)===g};var isStrictMode=function(a){return z(a)===f};var isSuspense=function(a){return z(a)===p};
    var isValidElementType=function(a){return "string"===typeof a||"function"===typeof a||a===e||a===m||a===g||a===f||a===p||a===q||"object"===typeof a&&null!==a&&(a.$$typeof===t||a.$$typeof===r||a.$$typeof===h||a.$$typeof===k||a.$$typeof===n||a.$$typeof===w||a.$$typeof===x||a.$$typeof===y||a.$$typeof===v)};var typeOf=z;

    var reactIs_production_min = {
    	AsyncMode: AsyncMode,
    	ConcurrentMode: ConcurrentMode,
    	ContextConsumer: ContextConsumer,
    	ContextProvider: ContextProvider,
    	Element: Element,
    	ForwardRef: ForwardRef,
    	Fragment: Fragment,
    	Lazy: Lazy,
    	Memo: Memo,
    	Portal: Portal,
    	Profiler: Profiler,
    	StrictMode: StrictMode,
    	Suspense: Suspense,
    	isAsyncMode: isAsyncMode,
    	isConcurrentMode: isConcurrentMode,
    	isContextConsumer: isContextConsumer,
    	isContextProvider: isContextProvider,
    	isElement: isElement,
    	isForwardRef: isForwardRef,
    	isFragment: isFragment,
    	isLazy: isLazy,
    	isMemo: isMemo,
    	isPortal: isPortal,
    	isProfiler: isProfiler,
    	isStrictMode: isStrictMode,
    	isSuspense: isSuspense,
    	isValidElementType: isValidElementType,
    	typeOf: typeOf
    };

    var reactIs_development = createCommonjsModule(function (module, exports) {



    if (process.env.NODE_ENV !== "production") {
      (function() {

    // The Symbol used to tag the ReactElement-like types. If there is no native Symbol
    // nor polyfill, then a plain number is used for performance.
    var hasSymbol = typeof Symbol === 'function' && Symbol.for;
    var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
    var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
    var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
    var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
    var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
    var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
    var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
    // (unstable) APIs that have been removed. Can we remove the symbols?

    var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
    var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
    var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
    var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
    var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
    var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
    var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
    var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
    var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
    var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
    var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;

    function isValidElementType(type) {
      return typeof type === 'string' || typeof type === 'function' || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
    }

    function typeOf(object) {
      if (typeof object === 'object' && object !== null) {
        var $$typeof = object.$$typeof;

        switch ($$typeof) {
          case REACT_ELEMENT_TYPE:
            var type = object.type;

            switch (type) {
              case REACT_ASYNC_MODE_TYPE:
              case REACT_CONCURRENT_MODE_TYPE:
              case REACT_FRAGMENT_TYPE:
              case REACT_PROFILER_TYPE:
              case REACT_STRICT_MODE_TYPE:
              case REACT_SUSPENSE_TYPE:
                return type;

              default:
                var $$typeofType = type && type.$$typeof;

                switch ($$typeofType) {
                  case REACT_CONTEXT_TYPE:
                  case REACT_FORWARD_REF_TYPE:
                  case REACT_LAZY_TYPE:
                  case REACT_MEMO_TYPE:
                  case REACT_PROVIDER_TYPE:
                    return $$typeofType;

                  default:
                    return $$typeof;
                }

            }

          case REACT_PORTAL_TYPE:
            return $$typeof;
        }
      }

      return undefined;
    } // AsyncMode is deprecated along with isAsyncMode

    var AsyncMode = REACT_ASYNC_MODE_TYPE;
    var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
    var ContextConsumer = REACT_CONTEXT_TYPE;
    var ContextProvider = REACT_PROVIDER_TYPE;
    var Element = REACT_ELEMENT_TYPE;
    var ForwardRef = REACT_FORWARD_REF_TYPE;
    var Fragment = REACT_FRAGMENT_TYPE;
    var Lazy = REACT_LAZY_TYPE;
    var Memo = REACT_MEMO_TYPE;
    var Portal = REACT_PORTAL_TYPE;
    var Profiler = REACT_PROFILER_TYPE;
    var StrictMode = REACT_STRICT_MODE_TYPE;
    var Suspense = REACT_SUSPENSE_TYPE;
    var hasWarnedAboutDeprecatedIsAsyncMode = false; // AsyncMode should be deprecated

    function isAsyncMode(object) {
      {
        if (!hasWarnedAboutDeprecatedIsAsyncMode) {
          hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

          console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
        }
      }

      return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
    }
    function isConcurrentMode(object) {
      return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
    }
    function isContextConsumer(object) {
      return typeOf(object) === REACT_CONTEXT_TYPE;
    }
    function isContextProvider(object) {
      return typeOf(object) === REACT_PROVIDER_TYPE;
    }
    function isElement(object) {
      return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    function isForwardRef(object) {
      return typeOf(object) === REACT_FORWARD_REF_TYPE;
    }
    function isFragment(object) {
      return typeOf(object) === REACT_FRAGMENT_TYPE;
    }
    function isLazy(object) {
      return typeOf(object) === REACT_LAZY_TYPE;
    }
    function isMemo(object) {
      return typeOf(object) === REACT_MEMO_TYPE;
    }
    function isPortal(object) {
      return typeOf(object) === REACT_PORTAL_TYPE;
    }
    function isProfiler(object) {
      return typeOf(object) === REACT_PROFILER_TYPE;
    }
    function isStrictMode(object) {
      return typeOf(object) === REACT_STRICT_MODE_TYPE;
    }
    function isSuspense(object) {
      return typeOf(object) === REACT_SUSPENSE_TYPE;
    }

    exports.AsyncMode = AsyncMode;
    exports.ConcurrentMode = ConcurrentMode;
    exports.ContextConsumer = ContextConsumer;
    exports.ContextProvider = ContextProvider;
    exports.Element = Element;
    exports.ForwardRef = ForwardRef;
    exports.Fragment = Fragment;
    exports.Lazy = Lazy;
    exports.Memo = Memo;
    exports.Portal = Portal;
    exports.Profiler = Profiler;
    exports.StrictMode = StrictMode;
    exports.Suspense = Suspense;
    exports.isAsyncMode = isAsyncMode;
    exports.isConcurrentMode = isConcurrentMode;
    exports.isContextConsumer = isContextConsumer;
    exports.isContextProvider = isContextProvider;
    exports.isElement = isElement;
    exports.isForwardRef = isForwardRef;
    exports.isFragment = isFragment;
    exports.isLazy = isLazy;
    exports.isMemo = isMemo;
    exports.isPortal = isPortal;
    exports.isProfiler = isProfiler;
    exports.isStrictMode = isStrictMode;
    exports.isSuspense = isSuspense;
    exports.isValidElementType = isValidElementType;
    exports.typeOf = typeOf;
      })();
    }
    });
    var reactIs_development_1 = reactIs_development.AsyncMode;
    var reactIs_development_2 = reactIs_development.ConcurrentMode;
    var reactIs_development_3 = reactIs_development.ContextConsumer;
    var reactIs_development_4 = reactIs_development.ContextProvider;
    var reactIs_development_5 = reactIs_development.Element;
    var reactIs_development_6 = reactIs_development.ForwardRef;
    var reactIs_development_7 = reactIs_development.Fragment;
    var reactIs_development_8 = reactIs_development.Lazy;
    var reactIs_development_9 = reactIs_development.Memo;
    var reactIs_development_10 = reactIs_development.Portal;
    var reactIs_development_11 = reactIs_development.Profiler;
    var reactIs_development_12 = reactIs_development.StrictMode;
    var reactIs_development_13 = reactIs_development.Suspense;
    var reactIs_development_14 = reactIs_development.isAsyncMode;
    var reactIs_development_15 = reactIs_development.isConcurrentMode;
    var reactIs_development_16 = reactIs_development.isContextConsumer;
    var reactIs_development_17 = reactIs_development.isContextProvider;
    var reactIs_development_18 = reactIs_development.isElement;
    var reactIs_development_19 = reactIs_development.isForwardRef;
    var reactIs_development_20 = reactIs_development.isFragment;
    var reactIs_development_21 = reactIs_development.isLazy;
    var reactIs_development_22 = reactIs_development.isMemo;
    var reactIs_development_23 = reactIs_development.isPortal;
    var reactIs_development_24 = reactIs_development.isProfiler;
    var reactIs_development_25 = reactIs_development.isStrictMode;
    var reactIs_development_26 = reactIs_development.isSuspense;
    var reactIs_development_27 = reactIs_development.isValidElementType;
    var reactIs_development_28 = reactIs_development.typeOf;

    var reactIs = createCommonjsModule(function (module) {

    if (process.env.NODE_ENV === 'production') {
      module.exports = reactIs_production_min;
    } else {
      module.exports = reactIs_development;
    }
    });

    /*
    object-assign
    (c) Sindre Sorhus
    @license MIT
    */
    /* eslint-disable no-unused-vars */
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;

    function toObject(val) {
    	if (val === null || val === undefined) {
    		throw new TypeError('Object.assign cannot be called with null or undefined');
    	}

    	return Object(val);
    }

    function shouldUseNative() {
    	try {
    		if (!Object.assign) {
    			return false;
    		}

    		// Detect buggy property enumeration order in older V8 versions.

    		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
    		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
    		test1[5] = 'de';
    		if (Object.getOwnPropertyNames(test1)[0] === '5') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test2 = {};
    		for (var i = 0; i < 10; i++) {
    			test2['_' + String.fromCharCode(i)] = i;
    		}
    		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
    			return test2[n];
    		});
    		if (order2.join('') !== '0123456789') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test3 = {};
    		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
    			test3[letter] = letter;
    		});
    		if (Object.keys(Object.assign({}, test3)).join('') !==
    				'abcdefghijklmnopqrst') {
    			return false;
    		}

    		return true;
    	} catch (err) {
    		// We don't expect any of the above to throw, but better to be safe.
    		return false;
    	}
    }

    var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
    	var from;
    	var to = toObject(target);
    	var symbols;

    	for (var s = 1; s < arguments.length; s++) {
    		from = Object(arguments[s]);

    		for (var key in from) {
    			if (hasOwnProperty.call(from, key)) {
    				to[key] = from[key];
    			}
    		}

    		if (getOwnPropertySymbols) {
    			symbols = getOwnPropertySymbols(from);
    			for (var i = 0; i < symbols.length; i++) {
    				if (propIsEnumerable.call(from, symbols[i])) {
    					to[symbols[i]] = from[symbols[i]];
    				}
    			}
    		}
    	}

    	return to;
    };

    /**
     * Copyright (c) 2013-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */

    var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

    var ReactPropTypesSecret_1 = ReactPropTypesSecret;

    var printWarning = function() {};

    if (process.env.NODE_ENV !== 'production') {
      var ReactPropTypesSecret$1 = ReactPropTypesSecret_1;
      var loggedTypeFailures = {};
      var has = Function.call.bind(Object.prototype.hasOwnProperty);

      printWarning = function(text) {
        var message = 'Warning: ' + text;
        if (typeof console !== 'undefined') {
          console.error(message);
        }
        try {
          // --- Welcome to debugging React ---
          // This error was thrown as a convenience so that you can use this stack
          // to find the callsite that caused this warning to fire.
          throw new Error(message);
        } catch (x) {}
      };
    }

    /**
     * Assert that the values match with the type specs.
     * Error messages are memorized and will only be shown once.
     *
     * @param {object} typeSpecs Map of name to a ReactPropType
     * @param {object} values Runtime values that need to be type-checked
     * @param {string} location e.g. "prop", "context", "child context"
     * @param {string} componentName Name of the component for error messages.
     * @param {?Function} getStack Returns the component stack.
     * @private
     */
    function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
      if (process.env.NODE_ENV !== 'production') {
        for (var typeSpecName in typeSpecs) {
          if (has(typeSpecs, typeSpecName)) {
            var error;
            // Prop type validation may throw. In case they do, we don't want to
            // fail the render phase where it didn't fail before. So we log it.
            // After these have been cleaned up, we'll let them throw.
            try {
              // This is intentionally an invariant that gets caught. It's the same
              // behavior as without this statement except with a better message.
              if (typeof typeSpecs[typeSpecName] !== 'function') {
                var err = Error(
                  (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
                  'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.'
                );
                err.name = 'Invariant Violation';
                throw err;
              }
              error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret$1);
            } catch (ex) {
              error = ex;
            }
            if (error && !(error instanceof Error)) {
              printWarning(
                (componentName || 'React class') + ': type specification of ' +
                location + ' `' + typeSpecName + '` is invalid; the type checker ' +
                'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
                'You may have forgotten to pass an argument to the type checker ' +
                'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
                'shape all require an argument).'
              );
            }
            if (error instanceof Error && !(error.message in loggedTypeFailures)) {
              // Only monitor this failure once because there tends to be a lot of the
              // same error.
              loggedTypeFailures[error.message] = true;

              var stack = getStack ? getStack() : '';

              printWarning(
                'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
              );
            }
          }
        }
      }
    }

    /**
     * Resets warning cache when testing.
     *
     * @private
     */
    checkPropTypes.resetWarningCache = function() {
      if (process.env.NODE_ENV !== 'production') {
        loggedTypeFailures = {};
      }
    };

    var checkPropTypes_1 = checkPropTypes;

    var has$1 = Function.call.bind(Object.prototype.hasOwnProperty);
    var printWarning$1 = function() {};

    if (process.env.NODE_ENV !== 'production') {
      printWarning$1 = function(text) {
        var message = 'Warning: ' + text;
        if (typeof console !== 'undefined') {
          console.error(message);
        }
        try {
          // --- Welcome to debugging React ---
          // This error was thrown as a convenience so that you can use this stack
          // to find the callsite that caused this warning to fire.
          throw new Error(message);
        } catch (x) {}
      };
    }

    function emptyFunctionThatReturnsNull() {
      return null;
    }

    var factoryWithTypeCheckers = function(isValidElement, throwOnDirectAccess) {
      /* global Symbol */
      var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
      var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

      /**
       * Returns the iterator method function contained on the iterable object.
       *
       * Be sure to invoke the function with the iterable as context:
       *
       *     var iteratorFn = getIteratorFn(myIterable);
       *     if (iteratorFn) {
       *       var iterator = iteratorFn.call(myIterable);
       *       ...
       *     }
       *
       * @param {?object} maybeIterable
       * @return {?function}
       */
      function getIteratorFn(maybeIterable) {
        var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
        if (typeof iteratorFn === 'function') {
          return iteratorFn;
        }
      }

      /**
       * Collection of methods that allow declaration and validation of props that are
       * supplied to React components. Example usage:
       *
       *   var Props = require('ReactPropTypes');
       *   var MyArticle = React.createClass({
       *     propTypes: {
       *       // An optional string prop named "description".
       *       description: Props.string,
       *
       *       // A required enum prop named "category".
       *       category: Props.oneOf(['News','Photos']).isRequired,
       *
       *       // A prop named "dialog" that requires an instance of Dialog.
       *       dialog: Props.instanceOf(Dialog).isRequired
       *     },
       *     render: function() { ... }
       *   });
       *
       * A more formal specification of how these methods are used:
       *
       *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
       *   decl := ReactPropTypes.{type}(.isRequired)?
       *
       * Each and every declaration produces a function with the same signature. This
       * allows the creation of custom validation functions. For example:
       *
       *  var MyLink = React.createClass({
       *    propTypes: {
       *      // An optional string or URI prop named "href".
       *      href: function(props, propName, componentName) {
       *        var propValue = props[propName];
       *        if (propValue != null && typeof propValue !== 'string' &&
       *            !(propValue instanceof URI)) {
       *          return new Error(
       *            'Expected a string or an URI for ' + propName + ' in ' +
       *            componentName
       *          );
       *        }
       *      }
       *    },
       *    render: function() {...}
       *  });
       *
       * @internal
       */

      var ANONYMOUS = '<<anonymous>>';

      // Important!
      // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
      var ReactPropTypes = {
        array: createPrimitiveTypeChecker('array'),
        bool: createPrimitiveTypeChecker('boolean'),
        func: createPrimitiveTypeChecker('function'),
        number: createPrimitiveTypeChecker('number'),
        object: createPrimitiveTypeChecker('object'),
        string: createPrimitiveTypeChecker('string'),
        symbol: createPrimitiveTypeChecker('symbol'),

        any: createAnyTypeChecker(),
        arrayOf: createArrayOfTypeChecker,
        element: createElementTypeChecker(),
        elementType: createElementTypeTypeChecker(),
        instanceOf: createInstanceTypeChecker,
        node: createNodeChecker(),
        objectOf: createObjectOfTypeChecker,
        oneOf: createEnumTypeChecker,
        oneOfType: createUnionTypeChecker,
        shape: createShapeTypeChecker,
        exact: createStrictShapeTypeChecker,
      };

      /**
       * inlined Object.is polyfill to avoid requiring consumers ship their own
       * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
       */
      /*eslint-disable no-self-compare*/
      function is(x, y) {
        // SameValue algorithm
        if (x === y) {
          // Steps 1-5, 7-10
          // Steps 6.b-6.e: +0 != -0
          return x !== 0 || 1 / x === 1 / y;
        } else {
          // Step 6.a: NaN == NaN
          return x !== x && y !== y;
        }
      }
      /*eslint-enable no-self-compare*/

      /**
       * We use an Error-like object for backward compatibility as people may call
       * PropTypes directly and inspect their output. However, we don't use real
       * Errors anymore. We don't inspect their stack anyway, and creating them
       * is prohibitively expensive if they are created too often, such as what
       * happens in oneOfType() for any type before the one that matched.
       */
      function PropTypeError(message) {
        this.message = message;
        this.stack = '';
      }
      // Make `instanceof Error` still work for returned errors.
      PropTypeError.prototype = Error.prototype;

      function createChainableTypeChecker(validate) {
        if (process.env.NODE_ENV !== 'production') {
          var manualPropTypeCallCache = {};
          var manualPropTypeWarningCount = 0;
        }
        function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
          componentName = componentName || ANONYMOUS;
          propFullName = propFullName || propName;

          if (secret !== ReactPropTypesSecret_1) {
            if (throwOnDirectAccess) {
              // New behavior only for users of `prop-types` package
              var err = new Error(
                'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
                'Use `PropTypes.checkPropTypes()` to call them. ' +
                'Read more at http://fb.me/use-check-prop-types'
              );
              err.name = 'Invariant Violation';
              throw err;
            } else if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
              // Old behavior for people using React.PropTypes
              var cacheKey = componentName + ':' + propName;
              if (
                !manualPropTypeCallCache[cacheKey] &&
                // Avoid spamming the console because they are often not actionable except for lib authors
                manualPropTypeWarningCount < 3
              ) {
                printWarning$1(
                  'You are manually calling a React.PropTypes validation ' +
                  'function for the `' + propFullName + '` prop on `' + componentName  + '`. This is deprecated ' +
                  'and will throw in the standalone `prop-types` package. ' +
                  'You may be seeing this warning due to a third-party PropTypes ' +
                  'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.'
                );
                manualPropTypeCallCache[cacheKey] = true;
                manualPropTypeWarningCount++;
              }
            }
          }
          if (props[propName] == null) {
            if (isRequired) {
              if (props[propName] === null) {
                return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
              }
              return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
            }
            return null;
          } else {
            return validate(props, propName, componentName, location, propFullName);
          }
        }

        var chainedCheckType = checkType.bind(null, false);
        chainedCheckType.isRequired = checkType.bind(null, true);

        return chainedCheckType;
      }

      function createPrimitiveTypeChecker(expectedType) {
        function validate(props, propName, componentName, location, propFullName, secret) {
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== expectedType) {
            // `propValue` being instance of, say, date/regexp, pass the 'object'
            // check, but we can offer a more precise error message here rather than
            // 'of type `object`'.
            var preciseType = getPreciseType(propValue);

            return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }

      function createAnyTypeChecker() {
        return createChainableTypeChecker(emptyFunctionThatReturnsNull);
      }

      function createArrayOfTypeChecker(typeChecker) {
        function validate(props, propName, componentName, location, propFullName) {
          if (typeof typeChecker !== 'function') {
            return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
          }
          var propValue = props[propName];
          if (!Array.isArray(propValue)) {
            var propType = getPropType(propValue);
            return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
          }
          for (var i = 0; i < propValue.length; i++) {
            var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret_1);
            if (error instanceof Error) {
              return error;
            }
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }

      function createElementTypeChecker() {
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          if (!isValidElement(propValue)) {
            var propType = getPropType(propValue);
            return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }

      function createElementTypeTypeChecker() {
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          if (!reactIs.isValidElementType(propValue)) {
            var propType = getPropType(propValue);
            return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement type.'));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }

      function createInstanceTypeChecker(expectedClass) {
        function validate(props, propName, componentName, location, propFullName) {
          if (!(props[propName] instanceof expectedClass)) {
            var expectedClassName = expectedClass.name || ANONYMOUS;
            var actualClassName = getClassName(props[propName]);
            return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }

      function createEnumTypeChecker(expectedValues) {
        if (!Array.isArray(expectedValues)) {
          if (process.env.NODE_ENV !== 'production') {
            if (arguments.length > 1) {
              printWarning$1(
                'Invalid arguments supplied to oneOf, expected an array, got ' + arguments.length + ' arguments. ' +
                'A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z]).'
              );
            } else {
              printWarning$1('Invalid argument supplied to oneOf, expected an array.');
            }
          }
          return emptyFunctionThatReturnsNull;
        }

        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          for (var i = 0; i < expectedValues.length; i++) {
            if (is(propValue, expectedValues[i])) {
              return null;
            }
          }

          var valuesString = JSON.stringify(expectedValues, function replacer(key, value) {
            var type = getPreciseType(value);
            if (type === 'symbol') {
              return String(value);
            }
            return value;
          });
          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + String(propValue) + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
        }
        return createChainableTypeChecker(validate);
      }

      function createObjectOfTypeChecker(typeChecker) {
        function validate(props, propName, componentName, location, propFullName) {
          if (typeof typeChecker !== 'function') {
            return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
          }
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== 'object') {
            return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
          }
          for (var key in propValue) {
            if (has$1(propValue, key)) {
              var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret_1);
              if (error instanceof Error) {
                return error;
              }
            }
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }

      function createUnionTypeChecker(arrayOfTypeCheckers) {
        if (!Array.isArray(arrayOfTypeCheckers)) {
          process.env.NODE_ENV !== 'production' ? printWarning$1('Invalid argument supplied to oneOfType, expected an instance of array.') : void 0;
          return emptyFunctionThatReturnsNull;
        }

        for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
          var checker = arrayOfTypeCheckers[i];
          if (typeof checker !== 'function') {
            printWarning$1(
              'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
              'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.'
            );
            return emptyFunctionThatReturnsNull;
          }
        }

        function validate(props, propName, componentName, location, propFullName) {
          for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
            var checker = arrayOfTypeCheckers[i];
            if (checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret_1) == null) {
              return null;
            }
          }

          return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`.'));
        }
        return createChainableTypeChecker(validate);
      }

      function createNodeChecker() {
        function validate(props, propName, componentName, location, propFullName) {
          if (!isNode(props[propName])) {
            return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }

      function createShapeTypeChecker(shapeTypes) {
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== 'object') {
            return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
          }
          for (var key in shapeTypes) {
            var checker = shapeTypes[key];
            if (!checker) {
              continue;
            }
            var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret_1);
            if (error) {
              return error;
            }
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }

      function createStrictShapeTypeChecker(shapeTypes) {
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== 'object') {
            return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
          }
          // We need to check all keys in case some are required but missing from
          // props.
          var allKeys = objectAssign({}, props[propName], shapeTypes);
          for (var key in allKeys) {
            var checker = shapeTypes[key];
            if (!checker) {
              return new PropTypeError(
                'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
                '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
                '\nValid keys: ' +  JSON.stringify(Object.keys(shapeTypes), null, '  ')
              );
            }
            var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret_1);
            if (error) {
              return error;
            }
          }
          return null;
        }

        return createChainableTypeChecker(validate);
      }

      function isNode(propValue) {
        switch (typeof propValue) {
          case 'number':
          case 'string':
          case 'undefined':
            return true;
          case 'boolean':
            return !propValue;
          case 'object':
            if (Array.isArray(propValue)) {
              return propValue.every(isNode);
            }
            if (propValue === null || isValidElement(propValue)) {
              return true;
            }

            var iteratorFn = getIteratorFn(propValue);
            if (iteratorFn) {
              var iterator = iteratorFn.call(propValue);
              var step;
              if (iteratorFn !== propValue.entries) {
                while (!(step = iterator.next()).done) {
                  if (!isNode(step.value)) {
                    return false;
                  }
                }
              } else {
                // Iterator will provide entry [k,v] tuples rather than values.
                while (!(step = iterator.next()).done) {
                  var entry = step.value;
                  if (entry) {
                    if (!isNode(entry[1])) {
                      return false;
                    }
                  }
                }
              }
            } else {
              return false;
            }

            return true;
          default:
            return false;
        }
      }

      function isSymbol(propType, propValue) {
        // Native Symbol.
        if (propType === 'symbol') {
          return true;
        }

        // falsy value can't be a Symbol
        if (!propValue) {
          return false;
        }

        // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
        if (propValue['@@toStringTag'] === 'Symbol') {
          return true;
        }

        // Fallback for non-spec compliant Symbols which are polyfilled.
        if (typeof Symbol === 'function' && propValue instanceof Symbol) {
          return true;
        }

        return false;
      }

      // Equivalent of `typeof` but with special handling for array and regexp.
      function getPropType(propValue) {
        var propType = typeof propValue;
        if (Array.isArray(propValue)) {
          return 'array';
        }
        if (propValue instanceof RegExp) {
          // Old webkits (at least until Android 4.0) return 'function' rather than
          // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
          // passes PropTypes.object.
          return 'object';
        }
        if (isSymbol(propType, propValue)) {
          return 'symbol';
        }
        return propType;
      }

      // This handles more types than `getPropType`. Only used for error messages.
      // See `createPrimitiveTypeChecker`.
      function getPreciseType(propValue) {
        if (typeof propValue === 'undefined' || propValue === null) {
          return '' + propValue;
        }
        var propType = getPropType(propValue);
        if (propType === 'object') {
          if (propValue instanceof Date) {
            return 'date';
          } else if (propValue instanceof RegExp) {
            return 'regexp';
          }
        }
        return propType;
      }

      // Returns a string that is postfixed to a warning about an invalid type.
      // For example, "undefined" or "of type array"
      function getPostfixForTypeWarning(value) {
        var type = getPreciseType(value);
        switch (type) {
          case 'array':
          case 'object':
            return 'an ' + type;
          case 'boolean':
          case 'date':
          case 'regexp':
            return 'a ' + type;
          default:
            return type;
        }
      }

      // Returns class name of the object, if any.
      function getClassName(propValue) {
        if (!propValue.constructor || !propValue.constructor.name) {
          return ANONYMOUS;
        }
        return propValue.constructor.name;
      }

      ReactPropTypes.checkPropTypes = checkPropTypes_1;
      ReactPropTypes.resetWarningCache = checkPropTypes_1.resetWarningCache;
      ReactPropTypes.PropTypes = ReactPropTypes;

      return ReactPropTypes;
    };

    function emptyFunction() {}
    function emptyFunctionWithReset() {}
    emptyFunctionWithReset.resetWarningCache = emptyFunction;

    var factoryWithThrowingShims = function() {
      function shim(props, propName, componentName, location, propFullName, secret) {
        if (secret === ReactPropTypesSecret_1) {
          // It is still safe when called from React.
          return;
        }
        var err = new Error(
          'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
          'Use PropTypes.checkPropTypes() to call them. ' +
          'Read more at http://fb.me/use-check-prop-types'
        );
        err.name = 'Invariant Violation';
        throw err;
      }  shim.isRequired = shim;
      function getShim() {
        return shim;
      }  // Important!
      // Keep this list in sync with production version in `./factoryWithTypeCheckers.js`.
      var ReactPropTypes = {
        array: shim,
        bool: shim,
        func: shim,
        number: shim,
        object: shim,
        string: shim,
        symbol: shim,

        any: shim,
        arrayOf: getShim,
        element: shim,
        elementType: shim,
        instanceOf: getShim,
        node: shim,
        objectOf: getShim,
        oneOf: getShim,
        oneOfType: getShim,
        shape: getShim,
        exact: getShim,

        checkPropTypes: emptyFunctionWithReset,
        resetWarningCache: emptyFunction
      };

      ReactPropTypes.PropTypes = ReactPropTypes;

      return ReactPropTypes;
    };

    var propTypes = createCommonjsModule(function (module) {
    /**
     * Copyright (c) 2013-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */

    if (process.env.NODE_ENV !== 'production') {
      var ReactIs = reactIs;

      // By explicitly using `prop-types` you are opting into new development behavior.
      // http://fb.me/prop-types-in-prod
      var throwOnDirectAccess = true;
      module.exports = factoryWithTypeCheckers(ReactIs.isElement, throwOnDirectAccess);
    } else {
      // By explicitly using `prop-types` you are opting into new production behavior.
      // http://fb.me/prop-types-in-prod
      module.exports = factoryWithThrowingShims();
    }
    });

    var isArray = Array.isArray;
    var keyList = Object.keys;
    var hasProp = Object.prototype.hasOwnProperty;

    var fastDeepEqual = function equal(a, b) {
      if (a === b) return true;

      if (a && b && typeof a == 'object' && typeof b == 'object') {
        var arrA = isArray(a)
          , arrB = isArray(b)
          , i
          , length
          , key;

        if (arrA && arrB) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0;)
            if (!equal(a[i], b[i])) return false;
          return true;
        }

        if (arrA != arrB) return false;

        var dateA = a instanceof Date
          , dateB = b instanceof Date;
        if (dateA != dateB) return false;
        if (dateA && dateB) return a.getTime() == b.getTime();

        var regexpA = a instanceof RegExp
          , regexpB = b instanceof RegExp;
        if (regexpA != regexpB) return false;
        if (regexpA && regexpB) return a.toString() == b.toString();

        var keys = keyList(a);
        length = keys.length;

        if (length !== keyList(b).length)
          return false;

        for (i = length; i-- !== 0;)
          if (!hasProp.call(b, keys[i])) return false;

        for (i = length; i-- !== 0;) {
          key = keys[i];
          if (!equal(a[key], b[key])) return false;
        }

        return true;
      }

      return a!==a && b!==b;
    };

    var id_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;

    /**
     * Created by hustcc on 18/6/9.
     * Contract: i@hust.cc
     */
    var id = 1;
    /**
     * generate unique id in application
     * @return {string}
     */

    var _default = function _default() {
      return "".concat(id++);
    };

    exports["default"] = _default;
    });

    unwrapExports(id_1);

    var debounce = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = void 0;

    /**
     * Created by hustcc on 18/6/9.
     * Contract: i@hust.cc
     */
    var _default = function _default(fn) {
      var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 60;
      var timer = null;
      return function () {
        var _this = this;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(_this, args);
        }, delay);
      };
    };

    exports["default"] = _default;
    });

    unwrapExports(debounce);

    var constant = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SensorTabIndex = exports.SensorClassName = exports.SizeSensorId = void 0;

    /**
     * Created by hustcc on 18/6/9.
     * Contract: i@hust.cc
     */
    var SizeSensorId = 'size-sensor-id';
    exports.SizeSensorId = SizeSensorId;
    var SensorClassName = 'size-sensor-object';
    exports.SensorClassName = SensorClassName;
    var SensorTabIndex = '-1';
    exports.SensorTabIndex = SensorTabIndex;
    });

    unwrapExports(constant);
    var constant_1 = constant.SensorTabIndex;
    var constant_2 = constant.SensorClassName;
    var constant_3 = constant.SizeSensorId;

    var object = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.createSensor = void 0;

    var _debounce = _interopRequireDefault(debounce);



    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

    /**
     * Created by hustcc on 18/6/9.
     * Contract: i@hust.cc
     */
    var createSensor = function createSensor(element) {
      var sensor = undefined; // callback

      var listeners = [];
      /**
       * create object DOM of sensor
       * @returns {HTMLObjectElement}
       */

      var newSensor = function newSensor() {
        // adjust style
        if (getComputedStyle(element).position === 'static') {
          element.style.position = 'relative';
        }

        var obj = document.createElement('object');

        obj.onload = function () {
          obj.contentDocument.defaultView.addEventListener('resize', resizeListener); // 直接触发一次 resize

          resizeListener();
        };

        obj.style.display = 'block';
        obj.style.position = 'absolute';
        obj.style.top = '0';
        obj.style.left = '0';
        obj.style.height = '100%';
        obj.style.width = '100%';
        obj.style.overflow = 'hidden';
        obj.style.pointerEvents = 'none';
        obj.style.zIndex = '-1';
        obj.style.opacity = '0';
        obj.setAttribute('class', constant.SensorClassName);
        obj.setAttribute('tabindex', constant.SensorTabIndex);
        obj.type = 'text/html'; // append into dom

        element.appendChild(obj); // for ie, should set data attribute delay, or will be white screen

        obj.data = 'about:blank';
        return obj;
      };
      /**
       * trigger listeners
       */


      var resizeListener = (0, _debounce["default"])(function () {
        // trigger all listener
        listeners.forEach(function (listener) {
          listener(element);
        });
      });
      /**
       * listen with one callback function
       * @param cb
       */

      var bind = function bind(cb) {
        // if not exist sensor, then create one
        if (!sensor) {
          sensor = newSensor();
        }

        if (listeners.indexOf(cb) === -1) {
          listeners.push(cb);
        }
      };
      /**
       * destroy all
       */


      var destroy = function destroy() {
        if (sensor && sensor.parentNode) {
          if (sensor.contentDocument) {
            // remote event
            sensor.contentDocument.defaultView.removeEventListener('resize', resizeListener);
          } // remove dom


          sensor.parentNode.removeChild(sensor); // initial variable

          sensor = undefined;
          listeners = [];
        }
      };
      /**
       * cancel listener bind
       * @param cb
       */


      var unbind = function unbind(cb) {
        var idx = listeners.indexOf(cb);

        if (idx !== -1) {
          listeners.splice(idx, 1);
        } // no listener, and sensor is exist
        // then destroy the sensor


        if (listeners.length === 0 && sensor) {
          destroy();
        }
      };

      return {
        element: element,
        bind: bind,
        destroy: destroy,
        unbind: unbind
      };
    };

    exports.createSensor = createSensor;
    });

    unwrapExports(object);
    var object_1 = object.createSensor;

    var resizeObserver = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.createSensor = void 0;

    var _debounce = _interopRequireDefault(debounce);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

    /**
     * Created by hustcc on 18/7/5.
     * Contract: i@hust.cc
     */
    var createSensor = function createSensor(element) {
      var sensor = undefined; // callback

      var listeners = [];
      /**
       * trigger listeners
       */

      var resizeListener = (0, _debounce["default"])(function () {
        // trigger all
        listeners.forEach(function (listener) {
          listener(element);
        });
      });
      /**
       * create ResizeObserver sensor
       * @returns
       */

      var newSensor = function newSensor() {
        var s = new ResizeObserver(resizeListener); // listen element

        s.observe(element); // trigger once

        resizeListener();
        return s;
      };
      /**
       * listen with callback
       * @param cb
       */


      var bind = function bind(cb) {
        if (!sensor) {
          sensor = newSensor();
        }

        if (listeners.indexOf(cb) === -1) {
          listeners.push(cb);
        }
      };
      /**
       * destroy
       */


      var destroy = function destroy() {
        sensor.disconnect();
        listeners = [];
        sensor = undefined;
      };
      /**
       * cancel bind
       * @param cb
       */


      var unbind = function unbind(cb) {
        var idx = listeners.indexOf(cb);

        if (idx !== -1) {
          listeners.splice(idx, 1);
        } // no listener, and sensor is exist
        // then destroy the sensor


        if (listeners.length === 0 && sensor) {
          destroy();
        }
      };

      return {
        element: element,
        bind: bind,
        destroy: destroy,
        unbind: unbind
      };
    };

    exports.createSensor = createSensor;
    });

    unwrapExports(resizeObserver);
    var resizeObserver_1 = resizeObserver.createSensor;

    var sensors = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.createSensor = void 0;





    /**
     * Created by hustcc on 18/7/5.
     * Contract: i@hust.cc
     */

    /**
     * sensor strategies
     */
    // export const createSensor = createObjectSensor;
    var createSensor = typeof ResizeObserver !== 'undefined' ? resizeObserver.createSensor : object.createSensor;
    exports.createSensor = createSensor;
    });

    unwrapExports(sensors);
    var sensors_1 = sensors.createSensor;

    var sensorPool = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.removeSensor = exports.getSensor = void 0;

    var _id = _interopRequireDefault(id_1);





    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

    /**
     * Created by hustcc on 18/6/9.
     * Contract: i@hust.cc
     */

    /**
     * all the sensor objects.
     * sensor pool
     */
    var Sensors = {};
    /**
     * get one sensor
     * @param element
     * @returns {*}
     */

    var getSensor = function getSensor(element) {
      var sensorId = element.getAttribute(constant.SizeSensorId); // 1. if the sensor exists, then use it

      if (sensorId && Sensors[sensorId]) {
        return Sensors[sensorId];
      } // 2. not exist, then create one


      var newId = (0, _id["default"])();
      element.setAttribute(constant.SizeSensorId, newId);
      var sensor = (0, sensors.createSensor)(element); // add sensor into pool

      Sensors[newId] = sensor;
      return sensor;
    };
    /**
     * 移除 sensor
     * @param sensor
     */


    exports.getSensor = getSensor;

    var removeSensor = function removeSensor(sensor) {
      var sensorId = sensor.element.getAttribute(constant.SizeSensorId); // remove attribute

      sensor.element.removeAttribute(constant.SizeSensorId); // remove event, dom of the sensor used

      sensor.destroy(); // exist, then remove from pool

      if (sensorId && Sensors[sensorId]) {
        delete Sensors[sensorId];
      }
    };

    exports.removeSensor = removeSensor;
    });

    unwrapExports(sensorPool);
    var sensorPool_1 = sensorPool.removeSensor;
    var sensorPool_2 = sensorPool.getSensor;

    var lib = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ver = exports.clear = exports.bind = void 0;



    /**
     * Created by hustcc on 18/6/9.[高考时间]
     * Contract: i@hust.cc
     */

    /**
     * bind an element with resize callback function
     * @param {*} element
     * @param {*} cb
     */
    var bind = function bind(element, cb) {
      var sensor = (0, sensorPool.getSensor)(element); // listen with callback

      sensor.bind(cb); // return unbind function

      return function () {
        sensor.unbind(cb);
      };
    };
    /**
     * clear all the listener and sensor of an element
     * @param element
     */


    exports.bind = bind;

    var clear = function clear(element) {
      var sensor = (0, sensorPool.getSensor)(element);
      (0, sensorPool.removeSensor)(sensor);
    };

    exports.clear = clear;
    var ver = "1.0.1";
    exports.ver = ver;
    });

    unwrapExports(lib);
    var lib_1 = lib.ver;
    var lib_2 = lib.clear;
    var lib_3 = lib.bind;

    var utils = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    /* eslint-disable import/prefer-default-export */

    var pick = exports.pick = function pick(obj, keys) {
      var r = {};
      keys.forEach(function (key) {
        r[key] = obj[key];
      });
      return r;
    };
    });

    unwrapExports(utils);
    var utils_1 = utils.pick;

    var core = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports['default'] = undefined;

    var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



    var _react2 = _interopRequireDefault(React__default);



    var _propTypes2 = _interopRequireDefault(propTypes);



    var _fastDeepEqual2 = _interopRequireDefault(fastDeepEqual);





    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    var EchartsReactCore = function (_Component) {
      _inherits(EchartsReactCore, _Component);

      function EchartsReactCore(props) {
        _classCallCheck(this, EchartsReactCore);

        var _this = _possibleConstructorReturn(this, (EchartsReactCore.__proto__ || Object.getPrototypeOf(EchartsReactCore)).call(this, props));

        _this.getEchartsInstance = function () {
          return _this.echartsLib.getInstanceByDom(_this.echartsElement) || _this.echartsLib.init(_this.echartsElement, _this.props.theme, _this.props.opts);
        };

        _this.dispose = function () {
          if (_this.echartsElement) {
            try {
              (0, lib.clear)(_this.echartsElement);
            } catch (e) {
              console.warn(e);
            }
            // dispose echarts instance
            _this.echartsLib.dispose(_this.echartsElement);
          }
        };

        _this.rerender = function () {
          var _this$props = _this.props,
              onEvents = _this$props.onEvents,
              onChartReady = _this$props.onChartReady;


          var echartObj = _this.renderEchartDom();
          _this.bindEvents(echartObj, onEvents || {});

          // on chart ready
          if (typeof onChartReady === 'function') _this.props.onChartReady(echartObj);
          // on resize
          if (_this.echartsElement) {
            (0, lib.bind)(_this.echartsElement, function () {
              try {
                echartObj.resize();
              } catch (e) {
                console.warn(e);
              }
            });
          }
        };

        _this.bindEvents = function (instance, events) {
          var _bindEvent = function _bindEvent(eventName, func) {
            // ignore the event config which not satisfy
            if (typeof eventName === 'string' && typeof func === 'function') {
              // binding event
              // instance.off(eventName); // 已经 dispose 在重建，所以无需 off 操作
              instance.on(eventName, function (param) {
                func(param, instance);
              });
            }
          };

          // loop and bind
          for (var eventName in events) {
            if (Object.prototype.hasOwnProperty.call(events, eventName)) {
              _bindEvent(eventName, events[eventName]);
            }
          }
        };

        _this.renderEchartDom = function () {
          // init the echart object
          var echartObj = _this.getEchartsInstance();
          // set the echart option
          echartObj.setOption(_this.props.option, _this.props.notMerge || false, _this.props.lazyUpdate || false);
          // set loading mask
          if (_this.props.showLoading) echartObj.showLoading(_this.props.loadingOption || null);else echartObj.hideLoading();

          return echartObj;
        };

        _this.echartsLib = props.echarts; // the echarts object.
        _this.echartsElement = null; // echarts div element
        return _this;
      }

      // first add


      _createClass(EchartsReactCore, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
          this.rerender();
        }

        // update

      }, {
        key: 'componentDidUpdate',
        value: function componentDidUpdate(prevProps) {
          // 判断是否需要 setOption，由开发者自己来确定。默认为 true
          if (typeof this.props.shouldSetOption === 'function' && !this.props.shouldSetOption(prevProps, this.props)) {
            return;
          }

          // 以下属性修改的时候，需要 dispose 之后再新建
          // 1. 切换 theme 的时候
          // 2. 修改 opts 的时候
          // 3. 修改 onEvents 的时候，这样可以取消所有之前绑定的事件 issue #151
          if (!(0, _fastDeepEqual2['default'])(prevProps.theme, this.props.theme) || !(0, _fastDeepEqual2['default'])(prevProps.opts, this.props.opts) || !(0, _fastDeepEqual2['default'])(prevProps.onEvents, this.props.onEvents)) {
            this.dispose();

            this.rerender(); // 重建
            return;
          }

          // 当这些属性保持不变的时候，不 setOption
          var pickKeys = ['option', 'notMerge', 'lazyUpdate', 'showLoading', 'loadingOption'];
          if ((0, _fastDeepEqual2['default'])((0, utils.pick)(this.props, pickKeys), (0, utils.pick)(prevProps, pickKeys))) {
            return;
          }

          var echartObj = this.renderEchartDom();
          // 样式修改的时候，可能会导致大小变化，所以触发一下 resize
          if (!(0, _fastDeepEqual2['default'])(prevProps.style, this.props.style) || !(0, _fastDeepEqual2['default'])(prevProps.className, this.props.className)) {
            try {
              echartObj.resize();
            } catch (e) {
              console.warn(e);
            }
          }
        }

        // remove

      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          this.dispose();
        }

        // return the echart object


        // dispose echarts and clear size-sensor


        // bind the events


        // render the dom

      }, {
        key: 'render',
        value: function render() {
          var _this2 = this;

          var _props = this.props,
              style = _props.style,
              className = _props.className;

          var newStyle = _extends({
            height: 300
          }, style);
          // for render
          return _react2['default'].createElement('div', {
            ref: function ref(e) {
              _this2.echartsElement = e;
            },
            style: newStyle,
            className: 'echarts-for-react ' + className
          });
        }
      }]);

      return EchartsReactCore;
    }(React__default.Component);

    exports['default'] = EchartsReactCore;


    EchartsReactCore.propTypes = {
      option: _propTypes2['default'].object.isRequired, // eslint-disable-line react/forbid-prop-types
      echarts: _propTypes2['default'].object, // eslint-disable-line react/forbid-prop-types
      notMerge: _propTypes2['default'].bool,
      lazyUpdate: _propTypes2['default'].bool,
      style: _propTypes2['default'].object, // eslint-disable-line react/forbid-prop-types
      className: _propTypes2['default'].string,
      theme: _propTypes2['default'].oneOfType([_propTypes2['default'].string, _propTypes2['default'].object]),
      onChartReady: _propTypes2['default'].func,
      showLoading: _propTypes2['default'].bool,
      loadingOption: _propTypes2['default'].object, // eslint-disable-line react/forbid-prop-types
      onEvents: _propTypes2['default'].object, // eslint-disable-line react/forbid-prop-types
      opts: _propTypes2['default'].shape({
        devicePixelRatio: _propTypes2['default'].number,
        renderer: _propTypes2['default'].oneOf(['canvas', 'svg']),
        width: _propTypes2['default'].oneOfType([_propTypes2['default'].number, _propTypes2['default'].oneOf([null, undefined, 'auto'])]),
        height: _propTypes2['default'].oneOfType([_propTypes2['default'].number, _propTypes2['default'].oneOf([null, undefined, 'auto'])])
      }),
      shouldSetOption: _propTypes2['default'].func
    };

    EchartsReactCore.defaultProps = {
      echarts: {},
      notMerge: false,
      lazyUpdate: false,
      style: {},
      className: '',
      theme: null,
      onChartReady: function onChartReady() {},
      showLoading: false,
      loadingOption: null,
      onEvents: {},
      opts: {},
      shouldSetOption: function shouldSetOption() {
        return true;
      }
    };
    });

    unwrapExports(core);

    var lib$1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports['default'] = undefined;



    var _echarts2 = _interopRequireDefault(echarts$1);



    var _core2 = _interopRequireDefault(core);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    // export the Component the echarts Object.
    var EchartsReact = function (_EchartsReactCore) {
      _inherits(EchartsReact, _EchartsReactCore);

      function EchartsReact(props) {
        _classCallCheck(this, EchartsReact);

        var _this = _possibleConstructorReturn(this, (EchartsReact.__proto__ || Object.getPrototypeOf(EchartsReact)).call(this, props));

        _this.echartsLib = _echarts2['default'];
        return _this;
      }

      return EchartsReact;
    }(_core2['default']);

    exports['default'] = EchartsReact;
    });

    var ReactEcharts = unwrapExports(lib$1);

    var DataType;
    (function (DataType) {
        DataType["Current"] = "current";
        DataType["Secondary"] = "secondary";
        DataType["Total"] = "total";
        DataType["Max"] = "max";
        DataType["Min"] = "min";
        DataType["Average"] = "average";
    })(DataType || (DataType = {}));

    var LiquidFill = /** @class */ (function (_super) {
        __extends(LiquidFill, _super);
        function LiquidFill(props) {
            var _this = _super.call(this, props) || this;
            _this.getOption = function () {
                var config = _this.props.config;
                var amplitude = lodash.get(config, 'amplitude');
                var outlineShow = lodash.get(config, 'outlineShow');
                var option = {
                    series: [{
                            type: 'liquidFill',
                            radius: '90%',
                            shape: lodash.get(config, 'shape') || 'circle',
                            backgroundStyle: {
                                borderWidth: 1,
                                color: lodash.get(config, 'backgroundColor') || '#ffff'
                            },
                            label: {
                                normal: {
                                    formatter: function () { return _this.displayDataFormatter(); },
                                    textStyle: {
                                        fontSize: lodash.get(config, 'fontSize') || 50
                                    }
                                }
                            },
                            data: [{
                                    value: 0.6,
                                    direction: lodash.get(config, 'direction') || 'left',
                                    itemStyle: {
                                        color: lodash.get(config, 'waveColor') || '#2c6dd2'
                                    }
                                }, {
                                    value: 0.5,
                                    direction: lodash.get(config, 'direction') || 'left',
                                    itemStyle: {
                                        color: lodash.get(config, 'waveColor') || '#2c6dd2'
                                    }
                                }, {
                                    value: 0.4,
                                    direction: lodash.get(config, 'direction') || 'left',
                                    itemStyle: {
                                        color: lodash.get(config, 'waveColor') || '#2c6dd2'
                                    }
                                }, {
                                    value: 0.3,
                                    direction: lodash.get(config, 'direction') || 'left',
                                    itemStyle: {
                                        color: lodash.get(config, 'waveColor') || '#2c6dd2'
                                    }
                                }],
                            amplitude: amplitude || amplitude === 0 ? amplitude : 9,
                            tooltip: {
                                show: true
                            },
                            outline: {
                                show: outlineShow ? outlineShow === 'false' ? false : true : true,
                                itemStyle: {
                                    borderColor: lodash.get(config, 'outlineBorderColor') || '#156ACF',
                                }
                            }
                        }]
                };
                return option;
            };
            return _this;
        }
        LiquidFill.prototype.getMetrics = function (fields) {
            return fields.filter(function (field) { return field.flag === 'metric'; });
        };
        LiquidFill.prototype.getFieldIndex = function (field, fields) {
            return lodash.findIndex(fields, function (item) { return item && item.name === field; });
        };
        LiquidFill.prototype.getData = function () {
            var metric = this.props.config.metric;
            var rows = this.props.dataset.rows;
            var fields = this.props.dataset.fields;
            var metrics = this.getMetrics(fields);
            var realMetric = lodash.find(fields, function (field) { return field.name === metric; });
            var currentMetrics = realMetric ? [realMetric] : metrics.map(function (metric) { return lodash.find(fields, function (field) { return field.name === metric.name; }); })
                .filter(function (metric) { return !!metric; });
            var currentMetricKey = metric ? metric : lodash.get(currentMetrics, [0, 'name']);
            if (lodash.size(currentMetrics) > 0 && lodash.size(fields) > 0 && lodash.size(rows) > 0) {
                var metricIndex_1 = this.getFieldIndex(currentMetricKey, fields);
                return rows.map(function (row) { return lodash.get(row, metricIndex_1); });
            }
            return [];
        };
        LiquidFill.prototype.getcurrentData = function () {
            var data = this.getData();
            var dataType = this.props.config.dataType ? this.props.config.dataType : DataType.Current;
            switch (dataType) {
                case DataType.Current:
                    return data[0];
                case DataType.Secondary:
                    return data[1];
                case DataType.Min:
                    return lodash.min(data);
                case DataType.Max:
                    return lodash.max(data);
                case DataType.Average:
                    return lodash.floor(lodash.mean(data));
                case DataType.Total:
                    return lodash.sum(data);
            }
        };
        LiquidFill.prototype.displayDataFormatter = function () {
            var currentData = lodash.toNumber(this.getcurrentData());
            if (!isNaN(currentData)) {
                return currentData;
            }
            return '--';
        };
        LiquidFill.prototype.render = function () {
            return React.createElement(ReactEcharts, { className: "liquidFill", option: this.getOption(), theme: "pandora-light", notMerge: true });
        };
        return LiquidFill;
    }(React.Component));

    var VisualizationStore = /** @class */ (function (_super) {
        __extends(VisualizationStore, _super);
        function VisualizationStore() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VisualizationStore.prototype.getInitialDataParams = function () {
            return {
                outputMode: visualizationSdk.OutputMode.JsonRows,
                count: 10000
            };
        };
        VisualizationStore.prototype.updateView = function (dataset, config) {
            ReactDom.render(React.createElement(LiquidFill, { dataset: dataset, config: config }), this.element);
        };
        return VisualizationStore;
    }(visualizationSdk.VisualizationBase));

    exports.default = VisualizationStore;

    Object.defineProperty(exports, '__esModule', { value: true });

});
//# sourceMappingURL=index.es.js.map
