"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
(function (global, factory) {
  (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.noUiSlider = {}));
})(void 0, function (exports) {
  'use strict';

  exports.PipsMode = void 0;
  (function (PipsMode) {
    PipsMode["Range"] = "range";
    PipsMode["Steps"] = "steps";
    PipsMode["Positions"] = "positions";
    PipsMode["Count"] = "count";
    PipsMode["Values"] = "values";
  })(exports.PipsMode || (exports.PipsMode = {}));
  exports.PipsType = void 0;
  (function (PipsType) {
    PipsType[PipsType["None"] = -1] = "None";
    PipsType[PipsType["NoValue"] = 0] = "NoValue";
    PipsType[PipsType["LargeValue"] = 1] = "LargeValue";
    PipsType[PipsType["SmallValue"] = 2] = "SmallValue";
  })(exports.PipsType || (exports.PipsType = {}));
  //region Helper Methods
  function isValidFormatter(entry) {
    return isValidPartialFormatter(entry) && typeof entry.from === "function";
  }
  function isValidPartialFormatter(entry) {
    // partial formatters only need a to function and not a from function
    return _typeof(entry) === "object" && typeof entry.to === "function";
  }
  function removeElement(el) {
    el.parentElement.removeChild(el);
  }
  function isSet(value) {
    return value !== null && value !== undefined;
  }
  // Bindable version
  function preventDefault(e) {
    e.preventDefault();
  }
  // Removes duplicates from an array.
  function unique(array) {
    return array.filter(function (a) {
      return !this[a] ? this[a] = true : false;
    }, {});
  }
  // Round a value to the closest 'to'.
  function closest(value, to) {
    return Math.round(value / to) * to;
  }
  // Current position of an element relative to the document.
  function offset(elem, orientation) {
    var rect = elem.getBoundingClientRect();
    var doc = elem.ownerDocument;
    var docElem = doc.documentElement;
    var pageOffset = getPageOffset(doc);
    // getBoundingClientRect contains left scroll in Chrome on Android.
    // I haven't found a feature detection that proves this. Worst case
    // scenario on mis-match: the 'tap' feature on horizontal sliders breaks.
    if (/webkit.*Chrome.*Mobile/i.test(navigator.userAgent)) {
      pageOffset.x = 0;
    }
    return orientation ? rect.top + pageOffset.y - docElem.clientTop : rect.left + pageOffset.x - docElem.clientLeft;
  }
  // Checks whether a value is numerical.
  function isNumeric(a) {
    return typeof a === "number" && !isNaN(a) && isFinite(a);
  }
  // Sets a class and removes it after [duration] ms.
  function addClassFor(element, className, duration) {
    if (duration > 0) {
      addClass(element, className);
      setTimeout(function () {
        removeClass(element, className);
      }, duration);
    }
  }
  // Limits a value to 0 - 100
  function limit(a) {
    return Math.max(Math.min(a, 100), 0);
  }
  // Wraps a variable as an array, if it isn't one yet.
  // Note that an input array is returned by reference!
  function asArray(a) {
    return Array.isArray(a) ? a : [a];
  }
  // Counts decimals
  function countDecimals(numStr) {
    numStr = String(numStr);
    var pieces = numStr.split(".");
    return pieces.length > 1 ? pieces[1].length : 0;
  }
  // http://youmightnotneedjquery.com/#add_class
  function addClass(el, className) {
    if (el.classList && !/\s/.test(className)) {
      el.classList.add(className);
    } else {
      el.className += " " + className;
    }
  }
  // http://youmightnotneedjquery.com/#remove_class
  function removeClass(el, className) {
    if (el.classList && !/\s/.test(className)) {
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"), " ");
    }
  }
  // https://plainjs.com/javascript/attributes/adding-removing-and-testing-for-classes-9/
  function hasClass(el, className) {
    return el.classList ? el.classList.contains(className) : new RegExp("\\b" + className + "\\b").test(el.className);
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY#Notes
  function getPageOffset(doc) {
    var supportPageOffset = window.pageXOffset !== undefined;
    var isCSS1Compat = (doc.compatMode || "") === "CSS1Compat";
    var x = supportPageOffset ? window.pageXOffset : isCSS1Compat ? doc.documentElement.scrollLeft : doc.body.scrollLeft;
    var y = supportPageOffset ? window.pageYOffset : isCSS1Compat ? doc.documentElement.scrollTop : doc.body.scrollTop;
    return {
      x: x,
      y: y
    };
  }
  // we provide a function to compute constants instead
  // of accessing window.* as soon as the module needs it
  // so that we do not compute anything if not needed
  function getActions() {
    // Determine the events to bind. IE11 implements pointerEvents without
    // a prefix, which breaks compatibility with the IE10 implementation.
    return window.navigator.pointerEnabled ? {
      start: "pointerdown",
      move: "pointermove",
      end: "pointerup"
    } : window.navigator.msPointerEnabled ? {
      start: "MSPointerDown",
      move: "MSPointerMove",
      end: "MSPointerUp"
    } : {
      start: "mousedown touchstart",
      move: "mousemove touchmove",
      end: "mouseup touchend"
    };
  }
  // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
  // Issue #785
  function getSupportsPassive() {
    var supportsPassive = false;
    /* eslint-disable */
    try {
      var opts = Object.defineProperty({}, "passive", {
        get: function get() {
          supportsPassive = true;
        }
      });
      // @ts-ignore
      window.addEventListener("test", null, opts);
    } catch (e) {}
    /* eslint-enable */
    return supportsPassive;
  }
  function getSupportsTouchActionNone() {
    return window.CSS && CSS.supports && CSS.supports("touch-action", "none");
  }
  //endregion
  //region Range Calculation
  // Determine the size of a sub-range in relation to a full range.
  function subRangeRatio(pa, pb) {
    return 100 / (pb - pa);
  }
  // (percentage) How many percent is this value of this range?
  function fromPercentage(range, value, startRange) {
    return value * 100 / (range[startRange + 1] - range[startRange]);
  }
  // (percentage) Where is this value on this range?
  function toPercentage(range, value) {
    return fromPercentage(range, range[0] < 0 ? value + Math.abs(range[0]) : value - range[0], 0);
  }
  // (value) How much is this percentage on this range?
  function isPercentage(range, value) {
    return value * (range[1] - range[0]) / 100 + range[0];
  }
  function getJ(value, arr) {
    var j = 1;
    while (value >= arr[j]) {
      j += 1;
    }
    return j;
  }
  // (percentage) Input a value, find where, on a scale of 0-100, it applies.
  function toStepping(xVal, xPct, value) {
    if (value >= xVal.slice(-1)[0]) {
      return 100;
    }
    var j = getJ(value, xVal);
    var va = xVal[j - 1];
    var vb = xVal[j];
    var pa = xPct[j - 1];
    var pb = xPct[j];
    return pa + toPercentage([va, vb], value) / subRangeRatio(pa, pb);
  }
  // (value) Input a percentage, find where it is on the specified range.
  function fromStepping(xVal, xPct, value) {
    // There is no range group that fits 100
    if (value >= 100) {
      return xVal.slice(-1)[0];
    }
    var j = getJ(value, xPct);
    var va = xVal[j - 1];
    var vb = xVal[j];
    var pa = xPct[j - 1];
    var pb = xPct[j];
    return isPercentage([va, vb], (value - pa) * subRangeRatio(pa, pb));
  }
  // (percentage) Get the step that applies at a certain value.
  function getStep(xPct, xSteps, snap, value) {
    if (value === 100) {
      return value;
    }
    var j = getJ(value, xPct);
    var a = xPct[j - 1];
    var b = xPct[j];
    // If 'snap' is set, steps are used as fixed points on the slider.
    if (snap) {
      // Find the closest position, a or b.
      if (value - a > (b - a) / 2) {
        return b;
      }
      return a;
    }
    if (!xSteps[j - 1]) {
      return value;
    }
    return xPct[j - 1] + closest(value - xPct[j - 1], xSteps[j - 1]);
  }
  //endregion
  //region Spectrum
  var Spectrum = /** @class */function () {
    function Spectrum(entry, snap, singleStep) {
      this.xPct = [];
      this.xVal = [];
      this.xSteps = [];
      this.xNumSteps = [];
      this.xHighestCompleteStep = [];
      this.xSteps = [singleStep || false];
      this.xNumSteps = [false];
      this.snap = snap;
      var index;
      var ordered = [];
      // Map the object keys to an array.
      Object.keys(entry).forEach(function (index) {
        ordered.push([asArray(entry[index]), index]);
      });
      // Sort all entries by value (numeric sort).
      ordered.sort(function (a, b) {
        return a[0][0] - b[0][0];
      });
      // Convert all entries to subranges.
      for (index = 0; index < ordered.length; index++) {
        this.handleEntryPoint(ordered[index][1], ordered[index][0]);
      }
      // Store the actual step values.
      // xSteps is sorted in the same order as xPct and xVal.
      this.xNumSteps = this.xSteps.slice(0);
      // Convert all numeric steps to the percentage of the subrange they represent.
      for (index = 0; index < this.xNumSteps.length; index++) {
        this.handleStepPoint(index, this.xNumSteps[index]);
      }
    }
    Spectrum.prototype.getDistance = function (value) {
      var distances = [];
      for (var index = 0; index < this.xNumSteps.length - 1; index++) {
        distances[index] = fromPercentage(this.xVal, value, index);
      }
      return distances;
    };
    // Calculate the percentual distance over the whole scale of ranges.
    // direction: 0 = backwards / 1 = forwards
    Spectrum.prototype.getAbsoluteDistance = function (value, distances, direction) {
      var xPct_index = 0;
      // Calculate range where to start calculation
      if (value < this.xPct[this.xPct.length - 1]) {
        while (value > this.xPct[xPct_index + 1]) {
          xPct_index++;
        }
      } else if (value === this.xPct[this.xPct.length - 1]) {
        xPct_index = this.xPct.length - 2;
      }
      // If looking backwards and the value is exactly at a range separator then look one range further
      if (!direction && value === this.xPct[xPct_index + 1]) {
        xPct_index++;
      }
      if (distances === null) {
        distances = [];
      }
      var start_factor;
      var rest_factor = 1;
      var rest_rel_distance = distances[xPct_index];
      var range_pct = 0;
      var rel_range_distance = 0;
      var abs_distance_counter = 0;
      var range_counter = 0;
      // Calculate what part of the start range the value is
      if (direction) {
        start_factor = (value - this.xPct[xPct_index]) / (this.xPct[xPct_index + 1] - this.xPct[xPct_index]);
      } else {
        start_factor = (this.xPct[xPct_index + 1] - value) / (this.xPct[xPct_index + 1] - this.xPct[xPct_index]);
      }
      // Do until the complete distance across ranges is calculated
      while (rest_rel_distance > 0) {
        // Calculate the percentage of total range
        range_pct = this.xPct[xPct_index + 1 + range_counter] - this.xPct[xPct_index + range_counter];
        // Detect if the margin, padding or limit is larger then the current range and calculate
        if (distances[xPct_index + range_counter] * rest_factor + 100 - start_factor * 100 > 100) {
          // If larger then take the percentual distance of the whole range
          rel_range_distance = range_pct * start_factor;
          // Rest factor of relative percentual distance still to be calculated
          rest_factor = (rest_rel_distance - 100 * start_factor) / distances[xPct_index + range_counter];
          // Set start factor to 1 as for next range it does not apply.
          start_factor = 1;
        } else {
          // If smaller or equal then take the percentual distance of the calculate percentual part of that range
          rel_range_distance = distances[xPct_index + range_counter] * range_pct / 100 * rest_factor;
          // No rest left as the rest fits in current range
          rest_factor = 0;
        }
        if (direction) {
          abs_distance_counter = abs_distance_counter - rel_range_distance;
          // Limit range to first range when distance becomes outside of minimum range
          if (this.xPct.length + range_counter >= 1) {
            range_counter--;
          }
        } else {
          abs_distance_counter = abs_distance_counter + rel_range_distance;
          // Limit range to last range when distance becomes outside of maximum range
          if (this.xPct.length - range_counter >= 1) {
            range_counter++;
          }
        }
        // Rest of relative percentual distance still to be calculated
        rest_rel_distance = distances[xPct_index + range_counter] * rest_factor;
      }
      return value + abs_distance_counter;
    };
    Spectrum.prototype.toStepping = function (value) {
      value = toStepping(this.xVal, this.xPct, value);
      return value;
    };
    Spectrum.prototype.fromStepping = function (value) {
      return fromStepping(this.xVal, this.xPct, value);
    };
    Spectrum.prototype.getStep = function (value) {
      value = getStep(this.xPct, this.xSteps, this.snap, value);
      return value;
    };
    Spectrum.prototype.getDefaultStep = function (value, isDown, size) {
      var j = getJ(value, this.xPct);
      // When at the top or stepping down, look at the previous sub-range
      if (value === 100 || isDown && value === this.xPct[j - 1]) {
        j = Math.max(j - 1, 1);
      }
      return (this.xVal[j] - this.xVal[j - 1]) / size;
    };
    Spectrum.prototype.getNearbySteps = function (value) {
      var j = getJ(value, this.xPct);
      return {
        stepBefore: {
          startValue: this.xVal[j - 2],
          step: this.xNumSteps[j - 2],
          highestStep: this.xHighestCompleteStep[j - 2]
        },
        thisStep: {
          startValue: this.xVal[j - 1],
          step: this.xNumSteps[j - 1],
          highestStep: this.xHighestCompleteStep[j - 1]
        },
        stepAfter: {
          startValue: this.xVal[j],
          step: this.xNumSteps[j],
          highestStep: this.xHighestCompleteStep[j]
        }
      };
    };
    Spectrum.prototype.countStepDecimals = function () {
      var stepDecimals = this.xNumSteps.map(countDecimals);
      return Math.max.apply(null, stepDecimals);
    };
    Spectrum.prototype.hasNoSize = function () {
      return this.xVal[0] === this.xVal[this.xVal.length - 1];
    };
    // Outside testing
    Spectrum.prototype.convert = function (value) {
      return this.getStep(this.toStepping(value));
    };
    Spectrum.prototype.handleEntryPoint = function (index, value) {
      var percentage;
      // Covert min/max syntax to 0 and 100.
      if (index === "min") {
        percentage = 0;
      } else if (index === "max") {
        percentage = 100;
      } else {
        percentage = parseFloat(index);
      }
      // Check for correct input.
      if (!isNumeric(percentage) || !isNumeric(value[0])) {
        throw new Error("noUiSlider: 'range' value isn't numeric.");
      }
      // Store values.
      this.xPct.push(percentage);
      this.xVal.push(value[0]);
      var value1 = Number(value[1]);
      // NaN will evaluate to false too, but to keep
      // logging clear, set step explicitly. Make sure
      // not to override the 'step' setting with false.
      if (!percentage) {
        if (!isNaN(value1)) {
          this.xSteps[0] = value1;
        }
      } else {
        this.xSteps.push(isNaN(value1) ? false : value1);
      }
      this.xHighestCompleteStep.push(0);
    };
    Spectrum.prototype.handleStepPoint = function (i, n) {
      // Ignore 'false' stepping.
      if (!n) {
        return;
      }
      // Step over zero-length ranges (#948);
      if (this.xVal[i] === this.xVal[i + 1]) {
        this.xSteps[i] = this.xHighestCompleteStep[i] = this.xVal[i];
        return;
      }
      // Factor to range ratio
      this.xSteps[i] = fromPercentage([this.xVal[i], this.xVal[i + 1]], n, 0) / subRangeRatio(this.xPct[i], this.xPct[i + 1]);
      var totalSteps = (this.xVal[i + 1] - this.xVal[i]) / this.xNumSteps[i];
      var highestStep = Math.ceil(Number(totalSteps.toFixed(3)) - 1);
      var step = this.xVal[i] + this.xNumSteps[i] * highestStep;
      this.xHighestCompleteStep[i] = step;
    };
    return Spectrum;
  }();
  //endregion
  //region Options
  /*	Every input option is tested and parsed. This will prevent
      endless validation in internal methods. These tests are
      structured with an item for every option available. An
      option can be marked as required by setting the 'r' flag.
      The testing function is provided with three arguments:
          - The provided value for the option;
          - A reference to the options object;
          - The name for the option;
        The testing function returns false when an error is detected,
      or true when everything is OK. It can also modify the option
      object, to make sure all values can be correctly looped elsewhere. */
  //region Defaults
  var defaultFormatter = {
    to: function to(value) {
      return value === undefined ? "" : value.toFixed(2);
    },
    from: Number
  };
  var cssClasses = {
    target: "target",
    base: "base",
    origin: "origin",
    handle: "handle",
    handleLower: "handle-lower",
    handleUpper: "handle-upper",
    touchArea: "touch-area",
    horizontal: "horizontal",
    vertical: "vertical",
    background: "background",
    connect: "connect",
    connects: "connects",
    ltr: "ltr",
    rtl: "rtl",
    textDirectionLtr: "txt-dir-ltr",
    textDirectionRtl: "txt-dir-rtl",
    draggable: "draggable",
    drag: "state-drag",
    tap: "state-tap",
    active: "active",
    tooltip: "tooltip",
    pips: "pips",
    pipsHorizontal: "pips-horizontal",
    pipsVertical: "pips-vertical",
    marker: "marker",
    markerHorizontal: "marker-horizontal",
    markerVertical: "marker-vertical",
    markerNormal: "marker-normal",
    markerLarge: "marker-large",
    markerSub: "marker-sub",
    value: "value",
    valueHorizontal: "value-horizontal",
    valueVertical: "value-vertical",
    valueNormal: "value-normal",
    valueLarge: "value-large",
    valueSub: "value-sub"
  };
  // Namespaces of internal event listeners
  var INTERNAL_EVENT_NS = {
    tooltips: ".__tooltips",
    aria: ".__aria"
  };
  //endregion
  function testStep(parsed, entry) {
    if (!isNumeric(entry)) {
      throw new Error("noUiSlider: 'step' is not numeric.");
    }
    // The step option can still be used to set stepping
    // for linear sliders. Overwritten if set in 'range'.
    parsed.singleStep = entry;
  }
  function testKeyboardPageMultiplier(parsed, entry) {
    if (!isNumeric(entry)) {
      throw new Error("noUiSlider: 'keyboardPageMultiplier' is not numeric.");
    }
    parsed.keyboardPageMultiplier = entry;
  }
  function testKeyboardMultiplier(parsed, entry) {
    if (!isNumeric(entry)) {
      throw new Error("noUiSlider: 'keyboardMultiplier' is not numeric.");
    }
    parsed.keyboardMultiplier = entry;
  }
  function testKeyboardDefaultStep(parsed, entry) {
    if (!isNumeric(entry)) {
      throw new Error("noUiSlider: 'keyboardDefaultStep' is not numeric.");
    }
    parsed.keyboardDefaultStep = entry;
  }
  function testRange(parsed, entry) {
    // Filter incorrect input.
    if (_typeof(entry) !== "object" || Array.isArray(entry)) {
      throw new Error("noUiSlider: 'range' is not an object.");
    }
    // Catch missing start or end.
    if (entry.min === undefined || entry.max === undefined) {
      throw new Error("noUiSlider: Missing 'min' or 'max' in 'range'.");
    }
    parsed.spectrum = new Spectrum(entry, parsed.snap || false, parsed.singleStep);
  }
  function testStart(parsed, entry) {
    entry = asArray(entry);
    // Validate input. Values aren't tested, as the public .val method
    // will always provide a valid location.
    if (!Array.isArray(entry) || !entry.length) {
      throw new Error("noUiSlider: 'start' option is incorrect.");
    }
    // Store the number of handles.
    parsed.handles = entry.length;
    // When the slider is initialized, the .val method will
    // be called with the start options.
    parsed.start = entry;
  }
  function testSnap(parsed, entry) {
    if (typeof entry !== "boolean") {
      throw new Error("noUiSlider: 'snap' option must be a boolean.");
    }
    // Enforce 100% stepping within subranges.
    parsed.snap = entry;
  }
  function testAnimate(parsed, entry) {
    if (typeof entry !== "boolean") {
      throw new Error("noUiSlider: 'animate' option must be a boolean.");
    }
    // Enforce 100% stepping within subranges.
    parsed.animate = entry;
  }
  function testAnimationDuration(parsed, entry) {
    if (typeof entry !== "number") {
      throw new Error("noUiSlider: 'animationDuration' option must be a number.");
    }
    parsed.animationDuration = entry;
  }
  function testConnect(parsed, entry) {
    var connect = [false];
    var i;
    // Map legacy options
    if (entry === "lower") {
      entry = [true, false];
    } else if (entry === "upper") {
      entry = [false, true];
    }
    // Handle boolean options
    if (entry === true || entry === false) {
      for (i = 1; i < parsed.handles; i++) {
        connect.push(entry);
      }
      connect.push(false);
    }
    // Reject invalid input
    else if (!Array.isArray(entry) || !entry.length || entry.length !== parsed.handles + 1) {
      throw new Error("noUiSlider: 'connect' option doesn't match handle count.");
    } else {
      connect = entry;
    }
    parsed.connect = connect;
  }
  function testOrientation(parsed, entry) {
    // Set orientation to an a numerical value for easy
    // array selection.
    switch (entry) {
      case "horizontal":
        parsed.ort = 0;
        break;
      case "vertical":
        parsed.ort = 1;
        break;
      default:
        throw new Error("noUiSlider: 'orientation' option is invalid.");
    }
  }
  function testMargin(parsed, entry) {
    if (!isNumeric(entry)) {
      throw new Error("noUiSlider: 'margin' option must be numeric.");
    }
    // Issue #582
    if (entry === 0) {
      return;
    }
    parsed.margin = parsed.spectrum.getDistance(entry);
  }
  function testLimit(parsed, entry) {
    if (!isNumeric(entry)) {
      throw new Error("noUiSlider: 'limit' option must be numeric.");
    }
    parsed.limit = parsed.spectrum.getDistance(entry);
    if (!parsed.limit || parsed.handles < 2) {
      throw new Error("noUiSlider: 'limit' option is only supported on linear sliders with 2 or more handles.");
    }
  }
  function testPadding(parsed, entry) {
    var index;
    if (!isNumeric(entry) && !Array.isArray(entry)) {
      throw new Error("noUiSlider: 'padding' option must be numeric or array of exactly 2 numbers.");
    }
    if (Array.isArray(entry) && !(entry.length === 2 || isNumeric(entry[0]) || isNumeric(entry[1]))) {
      throw new Error("noUiSlider: 'padding' option must be numeric or array of exactly 2 numbers.");
    }
    if (entry === 0) {
      return;
    }
    if (!Array.isArray(entry)) {
      entry = [entry, entry];
    }
    // 'getDistance' returns false for invalid values.
    parsed.padding = [parsed.spectrum.getDistance(entry[0]), parsed.spectrum.getDistance(entry[1])];
    for (index = 0; index < parsed.spectrum.xNumSteps.length - 1; index++) {
      // last "range" can't contain step size as it is purely an endpoint.
      if (parsed.padding[0][index] < 0 || parsed.padding[1][index] < 0) {
        throw new Error("noUiSlider: 'padding' option must be a positive number(s).");
      }
    }
    var totalPadding = entry[0] + entry[1];
    var firstValue = parsed.spectrum.xVal[0];
    var lastValue = parsed.spectrum.xVal[parsed.spectrum.xVal.length - 1];
    if (totalPadding / (lastValue - firstValue) > 1) {
      throw new Error("noUiSlider: 'padding' option must not exceed 100% of the range.");
    }
  }
  function testDirection(parsed, entry) {
    // Set direction as a numerical value for easy parsing.
    // Invert connection for RTL sliders, so that the proper
    // handles get the connect/background classes.
    switch (entry) {
      case "ltr":
        parsed.dir = 0;
        break;
      case "rtl":
        parsed.dir = 1;
        break;
      default:
        throw new Error("noUiSlider: 'direction' option was not recognized.");
    }
  }
  function testBehaviour(parsed, entry) {
    // Make sure the input is a string.
    if (typeof entry !== "string") {
      throw new Error("noUiSlider: 'behaviour' must be a string containing options.");
    }
    // Check if the string contains any keywords.
    // None are required.
    var tap = entry.indexOf("tap") >= 0;
    var drag = entry.indexOf("drag") >= 0;
    var fixed = entry.indexOf("fixed") >= 0;
    var snap = entry.indexOf("snap") >= 0;
    var hover = entry.indexOf("hover") >= 0;
    var unconstrained = entry.indexOf("unconstrained") >= 0;
    var dragAll = entry.indexOf("drag-all") >= 0;
    var smoothSteps = entry.indexOf("smooth-steps") >= 0;
    if (fixed) {
      if (parsed.handles !== 2) {
        throw new Error("noUiSlider: 'fixed' behaviour must be used with 2 handles");
      }
      // Use margin to enforce fixed state
      testMargin(parsed, parsed.start[1] - parsed.start[0]);
    }
    if (unconstrained && (parsed.margin || parsed.limit)) {
      throw new Error("noUiSlider: 'unconstrained' behaviour cannot be used with margin or limit");
    }
    parsed.events = {
      tap: tap || snap,
      drag: drag,
      dragAll: dragAll,
      smoothSteps: smoothSteps,
      fixed: fixed,
      snap: snap,
      hover: hover,
      unconstrained: unconstrained
    };
  }
  function testTooltips(parsed, entry) {
    if (entry === false) {
      return;
    }
    if (entry === true || isValidPartialFormatter(entry)) {
      parsed.tooltips = [];
      for (var i = 0; i < parsed.handles; i++) {
        parsed.tooltips.push(entry);
      }
    } else {
      entry = asArray(entry);
      if (entry.length !== parsed.handles) {
        throw new Error("noUiSlider: must pass a formatter for all handles.");
      }
      entry.forEach(function (formatter) {
        if (typeof formatter !== "boolean" && !isValidPartialFormatter(formatter)) {
          throw new Error("noUiSlider: 'tooltips' must be passed a formatter or 'false'.");
        }
      });
      parsed.tooltips = entry;
    }
  }
  function testHandleAttributes(parsed, entry) {
    if (entry.length !== parsed.handles) {
      throw new Error("noUiSlider: must pass a attributes for all handles.");
    }
    parsed.handleAttributes = entry;
  }
  function testAriaFormat(parsed, entry) {
    if (!isValidPartialFormatter(entry)) {
      throw new Error("noUiSlider: 'ariaFormat' requires 'to' method.");
    }
    parsed.ariaFormat = entry;
  }
  function testFormat(parsed, entry) {
    if (!isValidFormatter(entry)) {
      throw new Error("noUiSlider: 'format' requires 'to' and 'from' methods.");
    }
    parsed.format = entry;
  }
  function testKeyboardSupport(parsed, entry) {
    if (typeof entry !== "boolean") {
      throw new Error("noUiSlider: 'keyboardSupport' option must be a boolean.");
    }
    parsed.keyboardSupport = entry;
  }
  function testDocumentElement(parsed, entry) {
    // This is an advanced option. Passed values are used without validation.
    parsed.documentElement = entry;
  }
  function testCssPrefix(parsed, entry) {
    if (typeof entry !== "string" && entry !== false) {
      throw new Error("noUiSlider: 'cssPrefix' must be a string or `false`.");
    }
    parsed.cssPrefix = entry;
  }
  function testCssClasses(parsed, entry) {
    if (_typeof(entry) !== "object") {
      throw new Error("noUiSlider: 'cssClasses' must be an object.");
    }
    if (typeof parsed.cssPrefix === "string") {
      parsed.cssClasses = {};
      Object.keys(entry).forEach(function (key) {
        parsed.cssClasses[key] = parsed.cssPrefix + entry[key];
      });
    } else {
      parsed.cssClasses = entry;
    }
  }
  // Test all developer settings and parse to assumption-safe values.
  function testOptions(options) {
    // To prove a fix for #537, freeze options here.
    // If the object is modified, an error will be thrown.
    // Object.freeze(options);
    var parsed = {
      margin: null,
      limit: null,
      padding: null,
      animate: true,
      animationDuration: 300,
      ariaFormat: defaultFormatter,
      format: defaultFormatter
    };
    // Tests are executed in the order they are presented here.
    var tests = {
      step: {
        r: false,
        t: testStep
      },
      keyboardPageMultiplier: {
        r: false,
        t: testKeyboardPageMultiplier
      },
      keyboardMultiplier: {
        r: false,
        t: testKeyboardMultiplier
      },
      keyboardDefaultStep: {
        r: false,
        t: testKeyboardDefaultStep
      },
      start: {
        r: true,
        t: testStart
      },
      connect: {
        r: true,
        t: testConnect
      },
      direction: {
        r: true,
        t: testDirection
      },
      snap: {
        r: false,
        t: testSnap
      },
      animate: {
        r: false,
        t: testAnimate
      },
      animationDuration: {
        r: false,
        t: testAnimationDuration
      },
      range: {
        r: true,
        t: testRange
      },
      orientation: {
        r: false,
        t: testOrientation
      },
      margin: {
        r: false,
        t: testMargin
      },
      limit: {
        r: false,
        t: testLimit
      },
      padding: {
        r: false,
        t: testPadding
      },
      behaviour: {
        r: true,
        t: testBehaviour
      },
      ariaFormat: {
        r: false,
        t: testAriaFormat
      },
      format: {
        r: false,
        t: testFormat
      },
      tooltips: {
        r: false,
        t: testTooltips
      },
      keyboardSupport: {
        r: true,
        t: testKeyboardSupport
      },
      documentElement: {
        r: false,
        t: testDocumentElement
      },
      cssPrefix: {
        r: true,
        t: testCssPrefix
      },
      cssClasses: {
        r: true,
        t: testCssClasses
      },
      handleAttributes: {
        r: false,
        t: testHandleAttributes
      }
    };
    var defaults = {
      connect: false,
      direction: "ltr",
      behaviour: "tap",
      orientation: "horizontal",
      keyboardSupport: true,
      cssPrefix: "noUi-",
      cssClasses: cssClasses,
      keyboardPageMultiplier: 5,
      keyboardMultiplier: 1,
      keyboardDefaultStep: 10
    };
    // AriaFormat defaults to regular format, if any.
    if (options.format && !options.ariaFormat) {
      options.ariaFormat = options.format;
    }
    // Run all options through a testing mechanism to ensure correct
    // input. It should be noted that options might get modified to
    // be handled properly. E.g. wrapping integers in arrays.
    Object.keys(tests).forEach(function (name) {
      // If the option isn't set, but it is required, throw an error.
      if (!isSet(options[name]) && defaults[name] === undefined) {
        if (tests[name].r) {
          throw new Error("noUiSlider: '" + name + "' is required.");
        }
        return;
      }
      tests[name].t(parsed, !isSet(options[name]) ? defaults[name] : options[name]);
    });
    // Forward pips options
    parsed.pips = options.pips;
    // All recent browsers accept unprefixed transform.
    // We need -ms- for IE9 and -webkit- for older Android;
    // Assume use of -webkit- if unprefixed and -ms- are not supported.
    // https://caniuse.com/#feat=transforms2d
    var d = document.createElement("div");
    var msPrefix = d.style.msTransform !== undefined;
    var noPrefix = d.style.transform !== undefined;
    parsed.transformRule = noPrefix ? "transform" : msPrefix ? "msTransform" : "webkitTransform";
    // Pips don't move, so we can place them using left/top.
    var styles = [["left", "top"], ["right", "bottom"]];
    parsed.style = styles[parsed.dir][parsed.ort];
    return parsed;
  }
  //endregion
  function scope(target, options, originalOptions) {
    var actions = getActions();
    var supportsTouchActionNone = getSupportsTouchActionNone();
    var supportsPassive = supportsTouchActionNone && getSupportsPassive();
    // All variables local to 'scope' are prefixed with 'scope_'
    // Slider DOM Nodes
    var scope_Target = target;
    var scope_Base;
    var scope_Handles;
    var scope_Connects;
    var scope_Pips;
    var scope_Tooltips;
    // Slider state values
    var scope_Spectrum = options.spectrum;
    var scope_Values = [];
    var scope_Locations = [];
    var scope_HandleNumbers = [];
    var scope_ActiveHandlesCount = 0;
    var scope_Events = {};
    // Document Nodes
    var scope_Document = target.ownerDocument;
    var scope_DocumentElement = options.documentElement || scope_Document.documentElement;
    var scope_Body = scope_Document.body;
    // For horizontal sliders in standard ltr documents,
    // make .noUi-origin overflow to the left so the document doesn't scroll.
    var scope_DirOffset = scope_Document.dir === "rtl" || options.ort === 1 ? 0 : 100;
    // Creates a node, adds it to target, returns the new node.
    function addNodeTo(addTarget, className) {
      var div = scope_Document.createElement("div");
      if (className) {
        addClass(div, className);
      }
      addTarget.appendChild(div);
      return div;
    }
    // Append a origin to the base
    function addOrigin(base, handleNumber) {
      var origin = addNodeTo(base, options.cssClasses.origin);
      var handle = addNodeTo(origin, options.cssClasses.handle);
      addNodeTo(handle, options.cssClasses.touchArea);
      handle.setAttribute("data-handle", String(handleNumber));
      if (options.keyboardSupport) {
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
        // 0 = focusable and reachable
        handle.setAttribute("tabindex", "0");
        handle.addEventListener("keydown", function (event) {
          return eventKeydown(event, handleNumber);
        });
      }
      if (options.handleAttributes !== undefined) {
        var attributes_1 = options.handleAttributes[handleNumber];
        Object.keys(attributes_1).forEach(function (attribute) {
          handle.setAttribute(attribute, attributes_1[attribute]);
        });
      }
      handle.setAttribute("role", "slider");
      handle.setAttribute("aria-orientation", options.ort ? "vertical" : "horizontal");
      if (handleNumber === 0) {
        addClass(handle, options.cssClasses.handleLower);
      } else if (handleNumber === options.handles - 1) {
        addClass(handle, options.cssClasses.handleUpper);
      }
      origin.handle = handle;
      return origin;
    }
    // Insert nodes for connect elements
    function addConnect(base, add) {
      if (!add) {
        return false;
      }
      return addNodeTo(base, options.cssClasses.connect);
    }
    // Add handles to the slider base.
    function addElements(connectOptions, base) {
      var connectBase = addNodeTo(base, options.cssClasses.connects);
      scope_Handles = [];
      scope_Connects = [];
      scope_Connects.push(addConnect(connectBase, connectOptions[0]));
      // [::::O====O====O====]
      // connectOptions = [0, 1, 1, 1]
      for (var i = 0; i < options.handles; i++) {
        // Keep a list of all added handles.
        scope_Handles.push(addOrigin(base, i));
        scope_HandleNumbers[i] = i;
        scope_Connects.push(addConnect(connectBase, connectOptions[i + 1]));
      }
    }
    // Initialize a single slider.
    function addSlider(addTarget) {
      // Apply classes and data to the target.
      addClass(addTarget, options.cssClasses.target);
      if (options.dir === 0) {
        addClass(addTarget, options.cssClasses.ltr);
      } else {
        addClass(addTarget, options.cssClasses.rtl);
      }
      if (options.ort === 0) {
        addClass(addTarget, options.cssClasses.horizontal);
      } else {
        addClass(addTarget, options.cssClasses.vertical);
      }
      var textDirection = getComputedStyle(addTarget).direction;
      if (textDirection === "rtl") {
        addClass(addTarget, options.cssClasses.textDirectionRtl);
      } else {
        addClass(addTarget, options.cssClasses.textDirectionLtr);
      }
      return addNodeTo(addTarget, options.cssClasses.base);
    }
    function addTooltip(handle, handleNumber) {
      if (!options.tooltips || !options.tooltips[handleNumber]) {
        return false;
      }
      return addNodeTo(handle.firstChild, options.cssClasses.tooltip);
    }
    function isSliderDisabled() {
      return scope_Target.hasAttribute("disabled");
    }
    // Disable the slider dragging if any handle is disabled
    function isHandleDisabled(handleNumber) {
      var handleOrigin = scope_Handles[handleNumber];
      return handleOrigin.hasAttribute("disabled");
    }
    function disable(handleNumber) {
      if (handleNumber !== null && handleNumber !== undefined) {
        scope_Handles[handleNumber].setAttribute("disabled", "");
        scope_Handles[handleNumber].handle.removeAttribute("tabindex");
      } else {
        scope_Target.setAttribute("disabled", "");
        scope_Handles.forEach(function (handle) {
          handle.handle.removeAttribute("tabindex");
        });
      }
    }
    function enable(handleNumber) {
      if (handleNumber !== null && handleNumber !== undefined) {
        scope_Handles[handleNumber].removeAttribute("disabled");
        scope_Handles[handleNumber].handle.setAttribute("tabindex", "0");
      } else {
        scope_Target.removeAttribute("disabled");
        scope_Handles.forEach(function (handle) {
          handle.removeAttribute("disabled");
          handle.handle.setAttribute("tabindex", "0");
        });
      }
    }
    function removeTooltips() {
      if (scope_Tooltips) {
        removeEvent("update" + INTERNAL_EVENT_NS.tooltips);
        scope_Tooltips.forEach(function (tooltip) {
          if (tooltip) {
            removeElement(tooltip);
          }
        });
        scope_Tooltips = null;
      }
    }
    // The tooltips option is a shorthand for using the 'update' event.
    function tooltips() {
      removeTooltips();
      // Tooltips are added with options.tooltips in original order.
      scope_Tooltips = scope_Handles.map(addTooltip);
      bindEvent("update" + INTERNAL_EVENT_NS.tooltips, function (values, handleNumber, unencoded) {
        if (!scope_Tooltips || !options.tooltips) {
          return;
        }
        if (scope_Tooltips[handleNumber] === false) {
          return;
        }
        var formattedValue = values[handleNumber];
        if (options.tooltips[handleNumber] !== true) {
          formattedValue = options.tooltips[handleNumber].to(unencoded[handleNumber]);
        }
        scope_Tooltips[handleNumber].innerHTML = formattedValue;
      });
    }
    function aria() {
      removeEvent("update" + INTERNAL_EVENT_NS.aria);
      bindEvent("update" + INTERNAL_EVENT_NS.aria, function (values, handleNumber, unencoded, tap, positions) {
        // Update Aria Values for all handles, as a change in one changes min and max values for the next.
        scope_HandleNumbers.forEach(function (index) {
          var handle = scope_Handles[index];
          var min = checkHandlePosition(scope_Locations, index, 0, true, true, true);
          var max = checkHandlePosition(scope_Locations, index, 100, true, true, true);
          var now = positions[index];
          // Formatted value for display
          var text = String(options.ariaFormat.to(unencoded[index]));
          // Map to slider range values
          min = scope_Spectrum.fromStepping(min).toFixed(1);
          max = scope_Spectrum.fromStepping(max).toFixed(1);
          now = scope_Spectrum.fromStepping(now).toFixed(1);
          handle.children[0].setAttribute("aria-valuemin", min);
          handle.children[0].setAttribute("aria-valuemax", max);
          handle.children[0].setAttribute("aria-valuenow", now);
          handle.children[0].setAttribute("aria-valuetext", text);
        });
      });
    }
    function getGroup(pips) {
      // Use the range.
      if (pips.mode === exports.PipsMode.Range || pips.mode === exports.PipsMode.Steps) {
        return scope_Spectrum.xVal;
      }
      if (pips.mode === exports.PipsMode.Count) {
        if (pips.values < 2) {
          throw new Error("noUiSlider: 'values' (>= 2) required for mode 'count'.");
        }
        // Divide 0 - 100 in 'count' parts.
        var interval = pips.values - 1;
        var spread = 100 / interval;
        var values = [];
        // List these parts and have them handled as 'positions'.
        while (interval--) {
          values[interval] = interval * spread;
        }
        values.push(100);
        return mapToRange(values, pips.stepped);
      }
      if (pips.mode === exports.PipsMode.Positions) {
        // Map all percentages to on-range values.
        return mapToRange(pips.values, pips.stepped);
      }
      if (pips.mode === exports.PipsMode.Values) {
        // If the value must be stepped, it needs to be converted to a percentage first.
        if (pips.stepped) {
          return pips.values.map(function (value) {
            // Convert to percentage, apply step, return to value.
            return scope_Spectrum.fromStepping(scope_Spectrum.getStep(scope_Spectrum.toStepping(value)));
          });
        }
        // Otherwise, we can simply use the values.
        return pips.values;
      }
      return []; // pips.mode = never
    }

    function mapToRange(values, stepped) {
      return values.map(function (value) {
        return scope_Spectrum.fromStepping(stepped ? scope_Spectrum.getStep(value) : value);
      });
    }
    function generateSpread(pips) {
      function safeIncrement(value, increment) {
        // Avoid floating point variance by dropping the smallest decimal places.
        return Number((value + increment).toFixed(7));
      }
      var group = getGroup(pips);
      var indexes = {};
      var firstInRange = scope_Spectrum.xVal[0];
      var lastInRange = scope_Spectrum.xVal[scope_Spectrum.xVal.length - 1];
      var ignoreFirst = false;
      var ignoreLast = false;
      var prevPct = 0;
      // Create a copy of the group, sort it and filter away all duplicates.
      group = unique(group.slice().sort(function (a, b) {
        return a - b;
      }));
      // Make sure the range starts with the first element.
      if (group[0] !== firstInRange) {
        group.unshift(firstInRange);
        ignoreFirst = true;
      }
      // Likewise for the last one.
      if (group[group.length - 1] !== lastInRange) {
        group.push(lastInRange);
        ignoreLast = true;
      }
      group.forEach(function (current, index) {
        // Get the current step and the lower + upper positions.
        var step;
        var i;
        var q;
        var low = current;
        var high = group[index + 1];
        var newPct;
        var pctDifference;
        var pctPos;
        var type;
        var steps;
        var realSteps;
        var stepSize;
        var isSteps = pips.mode === exports.PipsMode.Steps;
        // When using 'steps' mode, use the provided steps.
        // Otherwise, we'll step on to the next subrange.
        if (isSteps) {
          step = scope_Spectrum.xNumSteps[index];
        }
        // Default to a 'full' step.
        if (!step) {
          step = high - low;
        }
        // If high is undefined we are at the last subrange. Make sure it iterates once (#1088)
        if (high === undefined) {
          high = low;
        }
        // Make sure step isn't 0, which would cause an infinite loop (#654)
        step = Math.max(step, 0.0000001);
        // Find all steps in the subrange.
        for (i = low; i <= high; i = safeIncrement(i, step)) {
          // Get the percentage value for the current step,
          // calculate the size for the subrange.
          newPct = scope_Spectrum.toStepping(i);
          pctDifference = newPct - prevPct;
          steps = pctDifference / (pips.density || 1);
          realSteps = Math.round(steps);
          // This ratio represents the amount of percentage-space a point indicates.
          // For a density 1 the points/percentage = 1. For density 2, that percentage needs to be re-divided.
          // Round the percentage offset to an even number, then divide by two
          // to spread the offset on both sides of the range.
          stepSize = pctDifference / realSteps;
          // Divide all points evenly, adding the correct number to this subrange.
          // Run up to <= so that 100% gets a point, event if ignoreLast is set.
          for (q = 1; q <= realSteps; q += 1) {
            // The ratio between the rounded value and the actual size might be ~1% off.
            // Correct the percentage offset by the number of points
            // per subrange. density = 1 will result in 100 points on the
            // full range, 2 for 50, 4 for 25, etc.
            pctPos = prevPct + q * stepSize;
            indexes[pctPos.toFixed(5)] = [scope_Spectrum.fromStepping(pctPos), 0];
          }
          // Determine the point type.
          type = group.indexOf(i) > -1 ? exports.PipsType.LargeValue : isSteps ? exports.PipsType.SmallValue : exports.PipsType.NoValue;
          // Enforce the 'ignoreFirst' option by overwriting the type for 0.
          if (!index && ignoreFirst && i !== high) {
            type = 0;
          }
          if (!(i === high && ignoreLast)) {
            // Mark the 'type' of this point. 0 = plain, 1 = real value, 2 = step value.
            indexes[newPct.toFixed(5)] = [i, type];
          }
          // Update the percentage count.
          prevPct = newPct;
        }
      });
      return indexes;
    }
    function addMarking(spread, filterFunc, formatter) {
      var _a, _b;
      var element = scope_Document.createElement("div");
      var valueSizeClasses = (_a = {}, _a[exports.PipsType.None] = "", _a[exports.PipsType.NoValue] = options.cssClasses.valueNormal, _a[exports.PipsType.LargeValue] = options.cssClasses.valueLarge, _a[exports.PipsType.SmallValue] = options.cssClasses.valueSub, _a);
      var markerSizeClasses = (_b = {}, _b[exports.PipsType.None] = "", _b[exports.PipsType.NoValue] = options.cssClasses.markerNormal, _b[exports.PipsType.LargeValue] = options.cssClasses.markerLarge, _b[exports.PipsType.SmallValue] = options.cssClasses.markerSub, _b);
      var valueOrientationClasses = [options.cssClasses.valueHorizontal, options.cssClasses.valueVertical];
      var markerOrientationClasses = [options.cssClasses.markerHorizontal, options.cssClasses.markerVertical];
      addClass(element, options.cssClasses.pips);
      addClass(element, options.ort === 0 ? options.cssClasses.pipsHorizontal : options.cssClasses.pipsVertical);
      function getClasses(type, source) {
        var a = source === options.cssClasses.value;
        var orientationClasses = a ? valueOrientationClasses : markerOrientationClasses;
        var sizeClasses = a ? valueSizeClasses : markerSizeClasses;
        return source + " " + orientationClasses[options.ort] + " " + sizeClasses[type];
      }
      function addSpread(offset, value, type) {
        // Apply the filter function, if it is set.
        type = filterFunc ? filterFunc(value, type) : type;
        if (type === exports.PipsType.None) {
          return;
        }
        // Add a marker for every point
        var node = addNodeTo(element, false);
        node.className = getClasses(type, options.cssClasses.marker);
        node.style[options.style] = offset + "%";
        // Values are only appended for points marked '1' or '2'.
        if (type > exports.PipsType.NoValue) {
          node = addNodeTo(element, false);
          node.className = getClasses(type, options.cssClasses.value);
          node.setAttribute("data-value", String(value));
          node.style[options.style] = offset + "%";
          node.innerHTML = String(formatter.to(value));
        }
      }
      // Append all points.
      Object.keys(spread).forEach(function (offset) {
        addSpread(offset, spread[offset][0], spread[offset][1]);
      });
      return element;
    }
    function removePips() {
      if (scope_Pips) {
        removeElement(scope_Pips);
        scope_Pips = null;
      }
    }
    function pips(pips) {
      // Fix #669
      removePips();
      var spread = generateSpread(pips);
      var filter = pips.filter;
      var format = pips.format || {
        to: function to(value) {
          return String(Math.round(value));
        }
      };
      scope_Pips = scope_Target.appendChild(addMarking(spread, filter, format));
      return scope_Pips;
    }
    // Shorthand for base dimensions.
    function baseSize() {
      var rect = scope_Base.getBoundingClientRect();
      var alt = "offset" + ["Width", "Height"][options.ort];
      return options.ort === 0 ? rect.width || scope_Base[alt] : rect.height || scope_Base[alt];
    }
    // Handler for attaching events trough a proxy.
    function attachEvent(events, element, callback, data) {
      // This function can be used to 'filter' events to the slider.
      // element is a node, not a nodeList
      var method = function method(event) {
        var e = fixEvent(event, data.pageOffset, data.target || element);
        // fixEvent returns false if this event has a different target
        // when handling (multi-) touch events;
        if (!e) {
          return false;
        }
        // doNotReject is passed by all end events to make sure released touches
        // are not rejected, leaving the slider "stuck" to the cursor;
        if (isSliderDisabled() && !data.doNotReject) {
          return false;
        }
        // Stop if an active 'tap' transition is taking place.
        if (hasClass(scope_Target, options.cssClasses.tap) && !data.doNotReject) {
          return false;
        }
        // Ignore right or middle clicks on start #454
        if (events === actions.start && e.buttons !== undefined && e.buttons > 1) {
          return false;
        }
        // Ignore right or middle clicks on start #454
        if (data.hover && e.buttons) {
          return false;
        }
        // 'supportsPassive' is only true if a browser also supports touch-action: none in CSS.
        // iOS safari does not, so it doesn't get to benefit from passive scrolling. iOS does support
        // touch-action: manipulation, but that allows panning, which breaks
        // sliders after zooming/on non-responsive pages.
        // See: https://bugs.webkit.org/show_bug.cgi?id=133112
        if (!supportsPassive) {
          e.preventDefault();
        }
        e.calcPoint = e.points[options.ort];
        // Call the event handler with the event [ and additional data ].
        callback(e, data);
        return;
      };
      var methods = [];
      // Bind a closure on the target for every event type.
      events.split(" ").forEach(function (eventName) {
        element.addEventListener(eventName, method, supportsPassive ? {
          passive: true
        } : false);
        methods.push([eventName, method]);
      });
      return methods;
    }
    // Provide a clean event with standardized offset values.
    function fixEvent(e, pageOffset, eventTarget) {
      // Filter the event to register the type, which can be
      // touch, mouse or pointer. Offset changes need to be
      // made on an event specific basis.
      var touch = e.type.indexOf("touch") === 0;
      var mouse = e.type.indexOf("mouse") === 0;
      var pointer = e.type.indexOf("pointer") === 0;
      var x = 0;
      var y = 0;
      // IE10 implemented pointer events with a prefix;
      if (e.type.indexOf("MSPointer") === 0) {
        pointer = true;
      }
      // Erroneous events seem to be passed in occasionally on iOS/iPadOS after user finishes interacting with
      // the slider. They appear to be of type MouseEvent, yet they don't have usual properties set. Ignore
      // events that have no touches or buttons associated with them. (#1057, #1079, #1095)
      if (e.type === "mousedown" && !e.buttons && !e.touches) {
        return false;
      }
      // The only thing one handle should be concerned about is the touches that originated on top of it.
      if (touch) {
        // Returns true if a touch originated on the target.
        var isTouchOnTarget = function isTouchOnTarget(checkTouch) {
          var target = checkTouch.target;
          return target === eventTarget || eventTarget.contains(target) || e.composed && e.composedPath().shift() === eventTarget;
        };
        // In the case of touchstart events, we need to make sure there is still no more than one
        // touch on the target so we look amongst all touches.
        if (e.type === "touchstart") {
          var targetTouches = Array.prototype.filter.call(e.touches, isTouchOnTarget);
          // Do not support more than one touch per handle.
          if (targetTouches.length > 1) {
            return false;
          }
          x = targetTouches[0].pageX;
          y = targetTouches[0].pageY;
        } else {
          // In the other cases, find on changedTouches is enough.
          var targetTouch = Array.prototype.find.call(e.changedTouches, isTouchOnTarget);
          // Cancel if the target touch has not moved.
          if (!targetTouch) {
            return false;
          }
          x = targetTouch.pageX;
          y = targetTouch.pageY;
        }
      }
      pageOffset = pageOffset || getPageOffset(scope_Document);
      if (mouse || pointer) {
        x = e.clientX + pageOffset.x;
        y = e.clientY + pageOffset.y;
      }
      e.pageOffset = pageOffset;
      e.points = [x, y];
      e.cursor = mouse || pointer; // Fix #435
      return e;
    }
    // Translate a coordinate in the document to a percentage on the slider
    function calcPointToPercentage(calcPoint) {
      var location = calcPoint - offset(scope_Base, options.ort);
      var proposal = location * 100 / baseSize();
      // Clamp proposal between 0% and 100%
      // Out-of-bound coordinates may occur when .noUi-base pseudo-elements
      // are used (e.g. contained handles feature)
      proposal = limit(proposal);
      return options.dir ? 100 - proposal : proposal;
    }
    // Find handle closest to a certain percentage on the slider
    function getClosestHandle(clickedPosition) {
      var smallestDifference = 100;
      var handleNumber = false;
      scope_Handles.forEach(function (handle, index) {
        // Disabled handles are ignored
        if (isHandleDisabled(index)) {
          return;
        }
        var handlePosition = scope_Locations[index];
        var differenceWithThisHandle = Math.abs(handlePosition - clickedPosition);
        // Initial state
        var clickAtEdge = differenceWithThisHandle === 100 && smallestDifference === 100;
        // Difference with this handle is smaller than the previously checked handle
        var isCloser = differenceWithThisHandle < smallestDifference;
        var isCloserAfter = differenceWithThisHandle <= smallestDifference && clickedPosition > handlePosition;
        if (isCloser || isCloserAfter || clickAtEdge) {
          handleNumber = index;
          smallestDifference = differenceWithThisHandle;
        }
      });
      return handleNumber;
    }
    // Fire 'end' when a mouse or pen leaves the document.
    function documentLeave(event, data) {
      if (event.type === "mouseout" && event.target.nodeName === "HTML" && event.relatedTarget === null) {
        eventEnd(event, data);
      }
    }
    // Handle movement on document for handle and range drag.
    function eventMove(event, data) {
      // Fix #498
      // Check value of .buttons in 'start' to work around a bug in IE10 mobile (data.buttonsProperty).
      // https://connect.microsoft.com/IE/feedback/details/927005/mobile-ie10-windows-phone-buttons-property-of-pointermove-event-always-zero
      // IE9 has .buttons and .which zero on mousemove.
      // Firefox breaks the spec MDN defines.
      if (navigator.appVersion.indexOf("MSIE 9") === -1 && event.buttons === 0 && data.buttonsProperty !== 0) {
        return eventEnd(event, data);
      }
      // Check if we are moving up or down
      var movement = (options.dir ? -1 : 1) * (event.calcPoint - data.startCalcPoint);
      // Convert the movement into a percentage of the slider width/height
      var proposal = movement * 100 / data.baseSize;
      moveHandles(movement > 0, proposal, data.locations, data.handleNumbers, data.connect);
    }
    // Unbind move events on document, call callbacks.
    function eventEnd(event, data) {
      // The handle is no longer active, so remove the class.
      if (data.handle) {
        removeClass(data.handle, options.cssClasses.active);
        scope_ActiveHandlesCount -= 1;
      }
      // Unbind the move and end events, which are added on 'start'.
      data.listeners.forEach(function (c) {
        scope_DocumentElement.removeEventListener(c[0], c[1]);
      });
      if (scope_ActiveHandlesCount === 0) {
        // Remove dragging class.
        removeClass(scope_Target, options.cssClasses.drag);
        setZindex();
        // Remove cursor styles and text-selection events bound to the body.
        if (event.cursor) {
          scope_Body.style.cursor = "";
          scope_Body.removeEventListener("selectstart", preventDefault);
        }
      }
      if (options.events.smoothSteps) {
        data.handleNumbers.forEach(function (handleNumber) {
          setHandle(handleNumber, scope_Locations[handleNumber], true, true, false, false);
        });
        data.handleNumbers.forEach(function (handleNumber) {
          fireEvent("update", handleNumber);
        });
      }
      data.handleNumbers.forEach(function (handleNumber) {
        fireEvent("change", handleNumber);
        fireEvent("set", handleNumber);
        fireEvent("end", handleNumber);
      });
    }
    // Bind move events on document.
    function eventStart(event, data) {
      // Ignore event if any handle is disabled
      if (data.handleNumbers.some(isHandleDisabled)) {
        return;
      }
      var handle;
      if (data.handleNumbers.length === 1) {
        var handleOrigin = scope_Handles[data.handleNumbers[0]];
        handle = handleOrigin.children[0];
        scope_ActiveHandlesCount += 1;
        // Mark the handle as 'active' so it can be styled.
        addClass(handle, options.cssClasses.active);
      }
      // A drag should never propagate up to the 'tap' event.
      event.stopPropagation();
      // Record the event listeners.
      var listeners = [];
      // Attach the move and end events.
      var moveEvent = attachEvent(actions.move, scope_DocumentElement, eventMove, {
        // The event target has changed so we need to propagate the original one so that we keep
        // relying on it to extract target touches.
        target: event.target,
        handle: handle,
        connect: data.connect,
        listeners: listeners,
        startCalcPoint: event.calcPoint,
        baseSize: baseSize(),
        pageOffset: event.pageOffset,
        handleNumbers: data.handleNumbers,
        buttonsProperty: event.buttons,
        locations: scope_Locations.slice()
      });
      var endEvent = attachEvent(actions.end, scope_DocumentElement, eventEnd, {
        target: event.target,
        handle: handle,
        listeners: listeners,
        doNotReject: true,
        handleNumbers: data.handleNumbers
      });
      var outEvent = attachEvent("mouseout", scope_DocumentElement, documentLeave, {
        target: event.target,
        handle: handle,
        listeners: listeners,
        doNotReject: true,
        handleNumbers: data.handleNumbers
      });
      // We want to make sure we pushed the listeners in the listener list rather than creating
      // a new one as it has already been passed to the event handlers.
      listeners.push.apply(listeners, moveEvent.concat(endEvent, outEvent));
      // Text selection isn't an issue on touch devices,
      // so adding cursor styles can be skipped.
      if (event.cursor) {
        // Prevent the 'I' cursor and extend the range-drag cursor.
        scope_Body.style.cursor = getComputedStyle(event.target).cursor;
        // Mark the target with a dragging state.
        if (scope_Handles.length > 1) {
          addClass(scope_Target, options.cssClasses.drag);
        }
        // Prevent text selection when dragging the handles.
        // In noUiSlider <= 9.2.0, this was handled by calling preventDefault on mouse/touch start/move,
        // which is scroll blocking. The selectstart event is supported by FireFox starting from version 52,
        // meaning the only holdout is iOS Safari. This doesn't matter: text selection isn't triggered there.
        // The 'cursor' flag is false.
        // See: http://caniuse.com/#search=selectstart
        scope_Body.addEventListener("selectstart", preventDefault, false);
      }
      data.handleNumbers.forEach(function (handleNumber) {
        fireEvent("start", handleNumber);
      });
    }
    // Move closest handle to tapped location.
    function eventTap(event) {
      // The tap event shouldn't propagate up
      event.stopPropagation();
      var proposal = calcPointToPercentage(event.calcPoint);
      var handleNumber = getClosestHandle(proposal);
      // Tackle the case that all handles are 'disabled'.
      if (handleNumber === false) {
        return;
      }
      // Flag the slider as it is now in a transitional state.
      // Transition takes a configurable amount of ms (default 300). Re-enable the slider after that.
      if (!options.events.snap) {
        addClassFor(scope_Target, options.cssClasses.tap, options.animationDuration);
      }
      setHandle(handleNumber, proposal, true, true);
      setZindex();
      fireEvent("slide", handleNumber, true);
      fireEvent("update", handleNumber, true);
      if (!options.events.snap) {
        fireEvent("change", handleNumber, true);
        fireEvent("set", handleNumber, true);
      } else {
        eventStart(event, {
          handleNumbers: [handleNumber]
        });
      }
    }
    // Fires a 'hover' event for a hovered mouse/pen position.
    function eventHover(event) {
      var proposal = calcPointToPercentage(event.calcPoint);
      var to = scope_Spectrum.getStep(proposal);
      var value = scope_Spectrum.fromStepping(to);
      Object.keys(scope_Events).forEach(function (targetEvent) {
        if ("hover" === targetEvent.split(".")[0]) {
          scope_Events[targetEvent].forEach(function (callback) {
            callback.call(scope_Self, value);
          });
        }
      });
    }
    // Handles keydown on focused handles
    // Don't move the document when pressing arrow keys on focused handles
    function eventKeydown(event, handleNumber) {
      if (isSliderDisabled() || isHandleDisabled(handleNumber)) {
        return false;
      }
      var horizontalKeys = ["Left", "Right"];
      var verticalKeys = ["Down", "Up"];
      var largeStepKeys = ["PageDown", "PageUp"];
      var edgeKeys = ["Home", "End"];
      if (options.dir && !options.ort) {
        // On an right-to-left slider, the left and right keys act inverted
        horizontalKeys.reverse();
      } else if (options.ort && !options.dir) {
        // On a top-to-bottom slider, the up and down keys act inverted
        verticalKeys.reverse();
        largeStepKeys.reverse();
      }
      // Strip "Arrow" for IE compatibility. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
      var key = event.key.replace("Arrow", "");
      var isLargeDown = key === largeStepKeys[0];
      var isLargeUp = key === largeStepKeys[1];
      var isDown = key === verticalKeys[0] || key === horizontalKeys[0] || isLargeDown;
      var isUp = key === verticalKeys[1] || key === horizontalKeys[1] || isLargeUp;
      var isMin = key === edgeKeys[0];
      var isMax = key === edgeKeys[1];
      if (!isDown && !isUp && !isMin && !isMax) {
        return true;
      }
      event.preventDefault();
      var to;
      if (isUp || isDown) {
        var direction = isDown ? 0 : 1;
        var steps = getNextStepsForHandle(handleNumber);
        var step = steps[direction];
        // At the edge of a slider, do nothing
        if (step === null) {
          return false;
        }
        // No step set, use the default of 10% of the sub-range
        if (step === false) {
          step = scope_Spectrum.getDefaultStep(scope_Locations[handleNumber], isDown, options.keyboardDefaultStep);
        }
        if (isLargeUp || isLargeDown) {
          step *= options.keyboardPageMultiplier;
        } else {
          step *= options.keyboardMultiplier;
        }
        // Step over zero-length ranges (#948);
        step = Math.max(step, 0.0000001);
        // Decrement for down steps
        step = (isDown ? -1 : 1) * step;
        to = scope_Values[handleNumber] + step;
      } else if (isMax) {
        // End key
        to = options.spectrum.xVal[options.spectrum.xVal.length - 1];
      } else {
        // Home key
        to = options.spectrum.xVal[0];
      }
      setHandle(handleNumber, scope_Spectrum.toStepping(to), true, true);
      fireEvent("slide", handleNumber);
      fireEvent("update", handleNumber);
      fireEvent("change", handleNumber);
      fireEvent("set", handleNumber);
      return false;
    }
    // Attach events to several slider parts.
    function bindSliderEvents(behaviour) {
      // Attach the standard drag event to the handles.
      if (!behaviour.fixed) {
        scope_Handles.forEach(function (handle, index) {
          // These events are only bound to the visual handle
          // element, not the 'real' origin element.
          attachEvent(actions.start, handle.children[0], eventStart, {
            handleNumbers: [index]
          });
        });
      }
      // Attach the tap event to the slider base.
      if (behaviour.tap) {
        attachEvent(actions.start, scope_Base, eventTap, {});
      }
      // Fire hover events
      if (behaviour.hover) {
        attachEvent(actions.move, scope_Base, eventHover, {
          hover: true
        });
      }
      // Make the range draggable.
      if (behaviour.drag) {
        scope_Connects.forEach(function (connect, index) {
          if (connect === false || index === 0 || index === scope_Connects.length - 1) {
            return;
          }
          var handleBefore = scope_Handles[index - 1];
          var handleAfter = scope_Handles[index];
          var eventHolders = [connect];
          var handlesToDrag = [handleBefore, handleAfter];
          var handleNumbersToDrag = [index - 1, index];
          addClass(connect, options.cssClasses.draggable);
          // When the range is fixed, the entire range can
          // be dragged by the handles. The handle in the first
          // origin will propagate the start event upward,
          // but it needs to be bound manually on the other.
          if (behaviour.fixed) {
            eventHolders.push(handleBefore.children[0]);
            eventHolders.push(handleAfter.children[0]);
          }
          if (behaviour.dragAll) {
            handlesToDrag = scope_Handles;
            handleNumbersToDrag = scope_HandleNumbers;
          }
          eventHolders.forEach(function (eventHolder) {
            attachEvent(actions.start, eventHolder, eventStart, {
              handles: handlesToDrag,
              handleNumbers: handleNumbersToDrag,
              connect: connect
            });
          });
        });
      }
    }
    // Attach an event to this slider, possibly including a namespace
    function bindEvent(namespacedEvent, callback) {
      scope_Events[namespacedEvent] = scope_Events[namespacedEvent] || [];
      scope_Events[namespacedEvent].push(callback);
      // If the event bound is 'update,' fire it immediately for all handles.
      if (namespacedEvent.split(".")[0] === "update") {
        scope_Handles.forEach(function (a, index) {
          fireEvent("update", index);
        });
      }
    }
    function isInternalNamespace(namespace) {
      return namespace === INTERNAL_EVENT_NS.aria || namespace === INTERNAL_EVENT_NS.tooltips;
    }
    // Undo attachment of event
    function removeEvent(namespacedEvent) {
      var event = namespacedEvent && namespacedEvent.split(".")[0];
      var namespace = event ? namespacedEvent.substring(event.length) : namespacedEvent;
      Object.keys(scope_Events).forEach(function (bind) {
        var tEvent = bind.split(".")[0];
        var tNamespace = bind.substring(tEvent.length);
        if ((!event || event === tEvent) && (!namespace || namespace === tNamespace)) {
          // only delete protected internal event if intentional
          if (!isInternalNamespace(tNamespace) || namespace === tNamespace) {
            delete scope_Events[bind];
          }
        }
      });
    }
    // External event handling
    function fireEvent(eventName, handleNumber, tap) {
      Object.keys(scope_Events).forEach(function (targetEvent) {
        var eventType = targetEvent.split(".")[0];
        if (eventName === eventType) {
          scope_Events[targetEvent].forEach(function (callback) {
            callback.call(
            // Use the slider public API as the scope ('this')
            scope_Self,
            // Return values as array, so arg_1[arg_2] is always valid.
            scope_Values.map(options.format.to),
            // Handle index, 0 or 1
            handleNumber,
            // Un-formatted slider values
            scope_Values.slice(),
            // Event is fired by tap, true or false
            tap || false,
            // Left offset of the handle, in relation to the slider
            scope_Locations.slice(),
            // add the slider public API to an accessible parameter when this is unavailable
            scope_Self);
          });
        }
      });
    }
    // Split out the handle positioning logic so the Move event can use it, too
    function checkHandlePosition(reference, handleNumber, to, lookBackward, lookForward, getValue, smoothSteps) {
      var distance;
      // For sliders with multiple handles, limit movement to the other handle.
      // Apply the margin option by adding it to the handle positions.
      if (scope_Handles.length > 1 && !options.events.unconstrained) {
        if (lookBackward && handleNumber > 0) {
          distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber - 1], options.margin, false);
          to = Math.max(to, distance);
        }
        if (lookForward && handleNumber < scope_Handles.length - 1) {
          distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber + 1], options.margin, true);
          to = Math.min(to, distance);
        }
      }
      // The limit option has the opposite effect, limiting handles to a
      // maximum distance from another. Limit must be > 0, as otherwise
      // handles would be unmovable.
      if (scope_Handles.length > 1 && options.limit) {
        if (lookBackward && handleNumber > 0) {
          distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber - 1], options.limit, false);
          to = Math.min(to, distance);
        }
        if (lookForward && handleNumber < scope_Handles.length - 1) {
          distance = scope_Spectrum.getAbsoluteDistance(reference[handleNumber + 1], options.limit, true);
          to = Math.max(to, distance);
        }
      }
      // The padding option keeps the handles a certain distance from the
      // edges of the slider. Padding must be > 0.
      if (options.padding) {
        if (handleNumber === 0) {
          distance = scope_Spectrum.getAbsoluteDistance(0, options.padding[0], false);
          to = Math.max(to, distance);
        }
        if (handleNumber === scope_Handles.length - 1) {
          distance = scope_Spectrum.getAbsoluteDistance(100, options.padding[1], true);
          to = Math.min(to, distance);
        }
      }
      if (!smoothSteps) {
        to = scope_Spectrum.getStep(to);
      }
      // Limit percentage to the 0 - 100 range
      to = limit(to);
      // Return false if handle can't move
      if (to === reference[handleNumber] && !getValue) {
        return false;
      }
      return to;
    }
    // Uses slider orientation to create CSS rules. a = base value;
    function inRuleOrder(v, a) {
      var o = options.ort;
      return (o ? a : v) + ", " + (o ? v : a);
    }
    // Moves handle(s) by a percentage
    // (bool, % to move, [% where handle started, ...], [index in scope_Handles, ...])
    function moveHandles(upward, proposal, locations, handleNumbers, connect) {
      var proposals = locations.slice();
      // Store first handle now, so we still have it in case handleNumbers is reversed
      var firstHandle = handleNumbers[0];
      var smoothSteps = options.events.smoothSteps;
      var b = [!upward, upward];
      var f = [upward, !upward];
      // Copy handleNumbers so we don't change the dataset
      handleNumbers = handleNumbers.slice();
      // Check to see which handle is 'leading'.
      // If that one can't move the second can't either.
      if (upward) {
        handleNumbers.reverse();
      }
      // Step 1: get the maximum percentage that any of the handles can move
      if (handleNumbers.length > 1) {
        handleNumbers.forEach(function (handleNumber, o) {
          var to = checkHandlePosition(proposals, handleNumber, proposals[handleNumber] + proposal, b[o], f[o], false, smoothSteps);
          // Stop if one of the handles can't move.
          if (to === false) {
            proposal = 0;
          } else {
            proposal = to - proposals[handleNumber];
            proposals[handleNumber] = to;
          }
        });
      }
      // If using one handle, check backward AND forward
      else {
        b = f = [true];
      }
      var state = false;
      // Step 2: Try to set the handles with the found percentage
      handleNumbers.forEach(function (handleNumber, o) {
        state = setHandle(handleNumber, locations[handleNumber] + proposal, b[o], f[o], false, smoothSteps) || state;
      });
      // Step 3: If a handle moved, fire events
      if (state) {
        handleNumbers.forEach(function (handleNumber) {
          fireEvent("update", handleNumber);
          fireEvent("slide", handleNumber);
        });
        // If target is a connect, then fire drag event
        if (connect != undefined) {
          fireEvent("drag", firstHandle);
        }
      }
    }
    // Takes a base value and an offset. This offset is used for the connect bar size.
    // In the initial design for this feature, the origin element was 1% wide.
    // Unfortunately, a rounding bug in Chrome makes it impossible to implement this feature
    // in this manner: https://bugs.chromium.org/p/chromium/issues/detail?id=798223
    function transformDirection(a, b) {
      return options.dir ? 100 - a - b : a;
    }
    // Updates scope_Locations and scope_Values, updates visual state
    function updateHandlePosition(handleNumber, to) {
      // Update locations.
      scope_Locations[handleNumber] = to;
      // Convert the value to the slider stepping/range.
      scope_Values[handleNumber] = scope_Spectrum.fromStepping(to);
      var translation = transformDirection(to, 0) - scope_DirOffset;
      var translateRule = "translate(" + inRuleOrder(translation + "%", "0") + ")";
      scope_Handles[handleNumber].style[options.transformRule] = translateRule;
      updateConnect(handleNumber);
      updateConnect(handleNumber + 1);
    }
    // Handles before the slider middle are stacked later = higher,
    // Handles after the middle later is lower
    // [[7] [8] .......... | .......... [5] [4]
    function setZindex() {
      scope_HandleNumbers.forEach(function (handleNumber) {
        var dir = scope_Locations[handleNumber] > 50 ? -1 : 1;
        var zIndex = 3 + (scope_Handles.length + dir * handleNumber);
        scope_Handles[handleNumber].style.zIndex = String(zIndex);
      });
    }
    // Test suggested values and apply margin, step.
    // if exactInput is true, don't run checkHandlePosition, then the handle can be placed in between steps (#436)
    function setHandle(handleNumber, to, lookBackward, lookForward, exactInput, smoothSteps) {
      if (!exactInput) {
        to = checkHandlePosition(scope_Locations, handleNumber, to, lookBackward, lookForward, false, smoothSteps);
      }
      if (to === false) {
        return false;
      }
      updateHandlePosition(handleNumber, to);
      return true;
    }
    // Updates style attribute for connect nodes
    function updateConnect(index) {
      // Skip connects set to false
      if (!scope_Connects[index]) {
        return;
      }
      var l = 0;
      var h = 100;
      if (index !== 0) {
        l = scope_Locations[index - 1];
      }
      if (index !== scope_Connects.length - 1) {
        h = scope_Locations[index];
      }
      // We use two rules:
      // 'translate' to change the left/top offset;
      // 'scale' to change the width of the element;
      // As the element has a width of 100%, a translation of 100% is equal to 100% of the parent (.noUi-base)
      var connectWidth = h - l;
      var translateRule = "translate(" + inRuleOrder(transformDirection(l, connectWidth) + "%", "0") + ")";
      var scaleRule = "scale(" + inRuleOrder(connectWidth / 100, "1") + ")";
      scope_Connects[index].style[options.transformRule] = translateRule + " " + scaleRule;
    }
    // Parses value passed to .set method. Returns current value if not parse-able.
    function resolveToValue(to, handleNumber) {
      // Setting with null indicates an 'ignore'.
      // Inputting 'false' is invalid.
      if (to === null || to === false || to === undefined) {
        return scope_Locations[handleNumber];
      }
      // If a formatted number was passed, attempt to decode it.
      if (typeof to === "number") {
        to = String(to);
      }
      to = options.format.from(to);
      if (to !== false) {
        to = scope_Spectrum.toStepping(to);
      }
      // If parsing the number failed, use the current value.
      if (to === false || isNaN(to)) {
        return scope_Locations[handleNumber];
      }
      return to;
    }
    // Set the slider value.
    function valueSet(input, fireSetEvent, exactInput) {
      var values = asArray(input);
      var isInit = scope_Locations[0] === undefined;
      // Event fires by default
      fireSetEvent = fireSetEvent === undefined ? true : fireSetEvent;
      // Animation is optional.
      // Make sure the initial values were set before using animated placement.
      if (options.animate && !isInit) {
        addClassFor(scope_Target, options.cssClasses.tap, options.animationDuration);
      }
      // First pass, without lookAhead but with lookBackward. Values are set from left to right.
      scope_HandleNumbers.forEach(function (handleNumber) {
        setHandle(handleNumber, resolveToValue(values[handleNumber], handleNumber), true, false, exactInput);
      });
      var i = scope_HandleNumbers.length === 1 ? 0 : 1;
      // Spread handles evenly across the slider if the range has no size (min=max)
      if (isInit && scope_Spectrum.hasNoSize()) {
        exactInput = true;
        scope_Locations[0] = 0;
        if (scope_HandleNumbers.length > 1) {
          var space_1 = 100 / (scope_HandleNumbers.length - 1);
          scope_HandleNumbers.forEach(function (handleNumber) {
            scope_Locations[handleNumber] = handleNumber * space_1;
          });
        }
      }
      // Secondary passes. Now that all base values are set, apply constraints.
      // Iterate all handles to ensure constraints are applied for the entire slider (Issue #1009)
      for (; i < scope_HandleNumbers.length; ++i) {
        scope_HandleNumbers.forEach(function (handleNumber) {
          setHandle(handleNumber, scope_Locations[handleNumber], true, true, exactInput);
        });
      }
      setZindex();
      scope_HandleNumbers.forEach(function (handleNumber) {
        fireEvent("update", handleNumber);
        // Fire the event only for handles that received a new value, as per #579
        if (values[handleNumber] !== null && fireSetEvent) {
          fireEvent("set", handleNumber);
        }
      });
    }
    // Reset slider to initial values
    function valueReset(fireSetEvent) {
      valueSet(options.start, fireSetEvent);
    }
    // Set value for a single handle
    function valueSetHandle(handleNumber, value, fireSetEvent, exactInput) {
      // Ensure numeric input
      handleNumber = Number(handleNumber);
      if (!(handleNumber >= 0 && handleNumber < scope_HandleNumbers.length)) {
        throw new Error("noUiSlider: invalid handle number, got: " + handleNumber);
      }
      // Look both backward and forward, since we don't want this handle to "push" other handles (#960);
      // The exactInput argument can be used to ignore slider stepping (#436)
      setHandle(handleNumber, resolveToValue(value, handleNumber), true, true, exactInput);
      fireEvent("update", handleNumber);
      if (fireSetEvent) {
        fireEvent("set", handleNumber);
      }
    }
    // Get the slider value.
    function valueGet(unencoded) {
      if (unencoded === void 0) {
        unencoded = false;
      }
      if (unencoded) {
        // return a copy of the raw values
        return scope_Values.length === 1 ? scope_Values[0] : scope_Values.slice(0);
      }
      var values = scope_Values.map(options.format.to);
      // If only one handle is used, return a single value.
      if (values.length === 1) {
        return values[0];
      }
      return values;
    }
    // Removes classes from the root and empties it.
    function destroy() {
      // remove protected internal listeners
      removeEvent(INTERNAL_EVENT_NS.aria);
      removeEvent(INTERNAL_EVENT_NS.tooltips);
      Object.keys(options.cssClasses).forEach(function (key) {
        removeClass(scope_Target, options.cssClasses[key]);
      });
      while (scope_Target.firstChild) {
        scope_Target.removeChild(scope_Target.firstChild);
      }
      delete scope_Target.noUiSlider;
    }
    function getNextStepsForHandle(handleNumber) {
      var location = scope_Locations[handleNumber];
      var nearbySteps = scope_Spectrum.getNearbySteps(location);
      var value = scope_Values[handleNumber];
      var increment = nearbySteps.thisStep.step;
      var decrement = null;
      // If snapped, directly use defined step value
      if (options.snap) {
        return [value - nearbySteps.stepBefore.startValue || null, nearbySteps.stepAfter.startValue - value || null];
      }
      // If the next value in this step moves into the next step,
      // the increment is the start of the next step - the current value
      if (increment !== false) {
        if (value + increment > nearbySteps.stepAfter.startValue) {
          increment = nearbySteps.stepAfter.startValue - value;
        }
      }
      // If the value is beyond the starting point
      if (value > nearbySteps.thisStep.startValue) {
        decrement = nearbySteps.thisStep.step;
      } else if (nearbySteps.stepBefore.step === false) {
        decrement = false;
      }
      // If a handle is at the start of a step, it always steps back into the previous step first
      else {
        decrement = value - nearbySteps.stepBefore.highestStep;
      }
      // Now, if at the slider edges, there is no in/decrement
      if (location === 100) {
        increment = null;
      } else if (location === 0) {
        decrement = null;
      }
      // As per #391, the comparison for the decrement step can have some rounding issues.
      var stepDecimals = scope_Spectrum.countStepDecimals();
      // Round per #391
      if (increment !== null && increment !== false) {
        increment = Number(increment.toFixed(stepDecimals));
      }
      if (decrement !== null && decrement !== false) {
        decrement = Number(decrement.toFixed(stepDecimals));
      }
      return [decrement, increment];
    }
    // Get the current step size for the slider.
    function getNextSteps() {
      return scope_HandleNumbers.map(getNextStepsForHandle);
    }
    // Updatable: margin, limit, padding, step, range, animate, snap
    function updateOptions(optionsToUpdate, fireSetEvent) {
      // Spectrum is created using the range, snap, direction and step options.
      // 'snap' and 'step' can be updated.
      // If 'snap' and 'step' are not passed, they should remain unchanged.
      var v = valueGet();
      var updateAble = ["margin", "limit", "padding", "range", "animate", "snap", "step", "format", "pips", "tooltips"];
      // Only change options that we're actually passed to update.
      updateAble.forEach(function (name) {
        // Check for undefined. null removes the value.
        if (optionsToUpdate[name] !== undefined) {
          originalOptions[name] = optionsToUpdate[name];
        }
      });
      var newOptions = testOptions(originalOptions);
      // Load new options into the slider state
      updateAble.forEach(function (name) {
        if (optionsToUpdate[name] !== undefined) {
          options[name] = newOptions[name];
        }
      });
      scope_Spectrum = newOptions.spectrum;
      // Limit, margin and padding depend on the spectrum but are stored outside of it. (#677)
      options.margin = newOptions.margin;
      options.limit = newOptions.limit;
      options.padding = newOptions.padding;
      // Update pips, removes existing.
      if (options.pips) {
        pips(options.pips);
      } else {
        removePips();
      }
      // Update tooltips, removes existing.
      if (options.tooltips) {
        tooltips();
      } else {
        removeTooltips();
      }
      // Invalidate the current positioning so valueSet forces an update.
      scope_Locations = [];
      valueSet(isSet(optionsToUpdate.start) ? optionsToUpdate.start : v, fireSetEvent);
    }
    // Initialization steps
    function setupSlider() {
      // Create the base element, initialize HTML and set classes.
      // Add handles and connect elements.
      scope_Base = addSlider(scope_Target);
      addElements(options.connect, scope_Base);
      // Attach user events.
      bindSliderEvents(options.events);
      // Use the public value method to set the start values.
      valueSet(options.start);
      if (options.pips) {
        pips(options.pips);
      }
      if (options.tooltips) {
        tooltips();
      }
      aria();
    }
    setupSlider();
    var scope_Self = {
      destroy: destroy,
      steps: getNextSteps,
      on: bindEvent,
      off: removeEvent,
      get: valueGet,
      set: valueSet,
      setHandle: valueSetHandle,
      reset: valueReset,
      disable: disable,
      enable: enable,
      // Exposed for unit testing, don't use this in your application.
      __moveHandles: function __moveHandles(upward, proposal, handleNumbers) {
        moveHandles(upward, proposal, scope_Locations, handleNumbers);
      },
      options: originalOptions,
      updateOptions: updateOptions,
      target: scope_Target,
      removePips: removePips,
      removeTooltips: removeTooltips,
      getPositions: function getPositions() {
        return scope_Locations.slice();
      },
      getTooltips: function getTooltips() {
        return scope_Tooltips;
      },
      getOrigins: function getOrigins() {
        return scope_Handles;
      },
      pips: pips // Issue #594
    };

    return scope_Self;
  }
  // Run the standard initializer
  function initialize(target, originalOptions) {
    if (!target || !target.nodeName) {
      throw new Error("noUiSlider: create requires a single element, got: " + target);
    }
    // Throw an error if the slider was already initialized.
    if (target.noUiSlider) {
      throw new Error("noUiSlider: Slider was already initialized.");
    }
    // Test the options and create the slider environment;
    var options = testOptions(originalOptions);
    var api = scope(target, options, originalOptions);
    target.noUiSlider = api;
    return api;
  }
  var nouislider = {
    // Exposed for unit testing, don't use this in your application.
    __spectrum: Spectrum,
    // A reference to the default classes, allows global changes.
    // Use the cssClasses option for changes to one slider.
    cssClasses: cssClasses,
    create: initialize
  };
  exports.create = initialize;
  exports.cssClasses = cssClasses;
  exports["default"] = nouislider;
  Object.defineProperty(exports, '__esModule', {
    value: true
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm91aXNsaWRlci5qcyIsIm5hbWVzIjpbImdsb2JhbCIsImZhY3RvcnkiLCJleHBvcnRzIiwiX3R5cGVvZiIsIm1vZHVsZSIsImRlZmluZSIsImFtZCIsImdsb2JhbFRoaXMiLCJzZWxmIiwibm9VaVNsaWRlciIsIlBpcHNNb2RlIiwiUGlwc1R5cGUiLCJpc1ZhbGlkRm9ybWF0dGVyIiwiZW50cnkiLCJpc1ZhbGlkUGFydGlhbEZvcm1hdHRlciIsImZyb20iLCJ0byIsInJlbW92ZUVsZW1lbnQiLCJlbCIsInBhcmVudEVsZW1lbnQiLCJyZW1vdmVDaGlsZCIsImlzU2V0IiwidmFsdWUiLCJ1bmRlZmluZWQiLCJwcmV2ZW50RGVmYXVsdCIsImUiLCJ1bmlxdWUiLCJhcnJheSIsImZpbHRlciIsImEiLCJjbG9zZXN0IiwiTWF0aCIsInJvdW5kIiwib2Zmc2V0IiwiZWxlbSIsIm9yaWVudGF0aW9uIiwicmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsImRvYyIsIm93bmVyRG9jdW1lbnQiLCJkb2NFbGVtIiwiZG9jdW1lbnRFbGVtZW50IiwicGFnZU9mZnNldCIsImdldFBhZ2VPZmZzZXQiLCJ0ZXN0IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwieCIsInRvcCIsInkiLCJjbGllbnRUb3AiLCJsZWZ0IiwiY2xpZW50TGVmdCIsImlzTnVtZXJpYyIsImlzTmFOIiwiaXNGaW5pdGUiLCJhZGRDbGFzc0ZvciIsImVsZW1lbnQiLCJjbGFzc05hbWUiLCJkdXJhdGlvbiIsImFkZENsYXNzIiwic2V0VGltZW91dCIsInJlbW92ZUNsYXNzIiwibGltaXQiLCJtYXgiLCJtaW4iLCJhc0FycmF5IiwiQXJyYXkiLCJpc0FycmF5IiwiY291bnREZWNpbWFscyIsIm51bVN0ciIsIlN0cmluZyIsInBpZWNlcyIsInNwbGl0IiwibGVuZ3RoIiwiY2xhc3NMaXN0IiwiYWRkIiwicmVtb3ZlIiwicmVwbGFjZSIsIlJlZ0V4cCIsImpvaW4iLCJoYXNDbGFzcyIsImNvbnRhaW5zIiwic3VwcG9ydFBhZ2VPZmZzZXQiLCJ3aW5kb3ciLCJwYWdlWE9mZnNldCIsImlzQ1NTMUNvbXBhdCIsImNvbXBhdE1vZGUiLCJzY3JvbGxMZWZ0IiwiYm9keSIsInBhZ2VZT2Zmc2V0Iiwic2Nyb2xsVG9wIiwiZ2V0QWN0aW9ucyIsInBvaW50ZXJFbmFibGVkIiwic3RhcnQiLCJtb3ZlIiwiZW5kIiwibXNQb2ludGVyRW5hYmxlZCIsImdldFN1cHBvcnRzUGFzc2l2ZSIsInN1cHBvcnRzUGFzc2l2ZSIsIm9wdHMiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImFkZEV2ZW50TGlzdGVuZXIiLCJnZXRTdXBwb3J0c1RvdWNoQWN0aW9uTm9uZSIsIkNTUyIsInN1cHBvcnRzIiwic3ViUmFuZ2VSYXRpbyIsInBhIiwicGIiLCJmcm9tUGVyY2VudGFnZSIsInJhbmdlIiwic3RhcnRSYW5nZSIsInRvUGVyY2VudGFnZSIsImFicyIsImlzUGVyY2VudGFnZSIsImdldEoiLCJhcnIiLCJqIiwidG9TdGVwcGluZyIsInhWYWwiLCJ4UGN0Iiwic2xpY2UiLCJ2YSIsInZiIiwiZnJvbVN0ZXBwaW5nIiwiZ2V0U3RlcCIsInhTdGVwcyIsInNuYXAiLCJiIiwiU3BlY3RydW0iLCJzaW5nbGVTdGVwIiwieE51bVN0ZXBzIiwieEhpZ2hlc3RDb21wbGV0ZVN0ZXAiLCJpbmRleCIsIm9yZGVyZWQiLCJrZXlzIiwiZm9yRWFjaCIsInB1c2giLCJzb3J0IiwiaGFuZGxlRW50cnlQb2ludCIsImhhbmRsZVN0ZXBQb2ludCIsInByb3RvdHlwZSIsImdldERpc3RhbmNlIiwiZGlzdGFuY2VzIiwiZ2V0QWJzb2x1dGVEaXN0YW5jZSIsImRpcmVjdGlvbiIsInhQY3RfaW5kZXgiLCJzdGFydF9mYWN0b3IiLCJyZXN0X2ZhY3RvciIsInJlc3RfcmVsX2Rpc3RhbmNlIiwicmFuZ2VfcGN0IiwicmVsX3JhbmdlX2Rpc3RhbmNlIiwiYWJzX2Rpc3RhbmNlX2NvdW50ZXIiLCJyYW5nZV9jb3VudGVyIiwiZ2V0RGVmYXVsdFN0ZXAiLCJpc0Rvd24iLCJzaXplIiwiZ2V0TmVhcmJ5U3RlcHMiLCJzdGVwQmVmb3JlIiwic3RhcnRWYWx1ZSIsInN0ZXAiLCJoaWdoZXN0U3RlcCIsInRoaXNTdGVwIiwic3RlcEFmdGVyIiwiY291bnRTdGVwRGVjaW1hbHMiLCJzdGVwRGVjaW1hbHMiLCJtYXAiLCJhcHBseSIsImhhc05vU2l6ZSIsImNvbnZlcnQiLCJwZXJjZW50YWdlIiwicGFyc2VGbG9hdCIsIkVycm9yIiwidmFsdWUxIiwiTnVtYmVyIiwiaSIsIm4iLCJ0b3RhbFN0ZXBzIiwiY2VpbCIsInRvRml4ZWQiLCJkZWZhdWx0Rm9ybWF0dGVyIiwiY3NzQ2xhc3NlcyIsInRhcmdldCIsImJhc2UiLCJvcmlnaW4iLCJoYW5kbGUiLCJoYW5kbGVMb3dlciIsImhhbmRsZVVwcGVyIiwidG91Y2hBcmVhIiwiaG9yaXpvbnRhbCIsInZlcnRpY2FsIiwiYmFja2dyb3VuZCIsImNvbm5lY3QiLCJjb25uZWN0cyIsImx0ciIsInJ0bCIsInRleHREaXJlY3Rpb25MdHIiLCJ0ZXh0RGlyZWN0aW9uUnRsIiwiZHJhZ2dhYmxlIiwiZHJhZyIsInRhcCIsImFjdGl2ZSIsInRvb2x0aXAiLCJwaXBzIiwicGlwc0hvcml6b250YWwiLCJwaXBzVmVydGljYWwiLCJtYXJrZXIiLCJtYXJrZXJIb3Jpem9udGFsIiwibWFya2VyVmVydGljYWwiLCJtYXJrZXJOb3JtYWwiLCJtYXJrZXJMYXJnZSIsIm1hcmtlclN1YiIsInZhbHVlSG9yaXpvbnRhbCIsInZhbHVlVmVydGljYWwiLCJ2YWx1ZU5vcm1hbCIsInZhbHVlTGFyZ2UiLCJ2YWx1ZVN1YiIsIklOVEVSTkFMX0VWRU5UX05TIiwidG9vbHRpcHMiLCJhcmlhIiwidGVzdFN0ZXAiLCJwYXJzZWQiLCJ0ZXN0S2V5Ym9hcmRQYWdlTXVsdGlwbGllciIsImtleWJvYXJkUGFnZU11bHRpcGxpZXIiLCJ0ZXN0S2V5Ym9hcmRNdWx0aXBsaWVyIiwia2V5Ym9hcmRNdWx0aXBsaWVyIiwidGVzdEtleWJvYXJkRGVmYXVsdFN0ZXAiLCJrZXlib2FyZERlZmF1bHRTdGVwIiwidGVzdFJhbmdlIiwic3BlY3RydW0iLCJ0ZXN0U3RhcnQiLCJoYW5kbGVzIiwidGVzdFNuYXAiLCJ0ZXN0QW5pbWF0ZSIsImFuaW1hdGUiLCJ0ZXN0QW5pbWF0aW9uRHVyYXRpb24iLCJhbmltYXRpb25EdXJhdGlvbiIsInRlc3RDb25uZWN0IiwidGVzdE9yaWVudGF0aW9uIiwib3J0IiwidGVzdE1hcmdpbiIsIm1hcmdpbiIsInRlc3RMaW1pdCIsInRlc3RQYWRkaW5nIiwicGFkZGluZyIsInRvdGFsUGFkZGluZyIsImZpcnN0VmFsdWUiLCJsYXN0VmFsdWUiLCJ0ZXN0RGlyZWN0aW9uIiwiZGlyIiwidGVzdEJlaGF2aW91ciIsImluZGV4T2YiLCJmaXhlZCIsImhvdmVyIiwidW5jb25zdHJhaW5lZCIsImRyYWdBbGwiLCJzbW9vdGhTdGVwcyIsImV2ZW50cyIsInRlc3RUb29sdGlwcyIsImZvcm1hdHRlciIsInRlc3RIYW5kbGVBdHRyaWJ1dGVzIiwiaGFuZGxlQXR0cmlidXRlcyIsInRlc3RBcmlhRm9ybWF0IiwiYXJpYUZvcm1hdCIsInRlc3RGb3JtYXQiLCJmb3JtYXQiLCJ0ZXN0S2V5Ym9hcmRTdXBwb3J0Iiwia2V5Ym9hcmRTdXBwb3J0IiwidGVzdERvY3VtZW50RWxlbWVudCIsInRlc3RDc3NQcmVmaXgiLCJjc3NQcmVmaXgiLCJ0ZXN0Q3NzQ2xhc3NlcyIsImtleSIsInRlc3RPcHRpb25zIiwib3B0aW9ucyIsInRlc3RzIiwiciIsInQiLCJiZWhhdmlvdXIiLCJkZWZhdWx0cyIsIm5hbWUiLCJkIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwibXNQcmVmaXgiLCJzdHlsZSIsIm1zVHJhbnNmb3JtIiwibm9QcmVmaXgiLCJ0cmFuc2Zvcm0iLCJ0cmFuc2Zvcm1SdWxlIiwic3R5bGVzIiwic2NvcGUiLCJvcmlnaW5hbE9wdGlvbnMiLCJhY3Rpb25zIiwic3VwcG9ydHNUb3VjaEFjdGlvbk5vbmUiLCJzY29wZV9UYXJnZXQiLCJzY29wZV9CYXNlIiwic2NvcGVfSGFuZGxlcyIsInNjb3BlX0Nvbm5lY3RzIiwic2NvcGVfUGlwcyIsInNjb3BlX1Rvb2x0aXBzIiwic2NvcGVfU3BlY3RydW0iLCJzY29wZV9WYWx1ZXMiLCJzY29wZV9Mb2NhdGlvbnMiLCJzY29wZV9IYW5kbGVOdW1iZXJzIiwic2NvcGVfQWN0aXZlSGFuZGxlc0NvdW50Iiwic2NvcGVfRXZlbnRzIiwic2NvcGVfRG9jdW1lbnQiLCJzY29wZV9Eb2N1bWVudEVsZW1lbnQiLCJzY29wZV9Cb2R5Iiwic2NvcGVfRGlyT2Zmc2V0IiwiYWRkTm9kZVRvIiwiYWRkVGFyZ2V0IiwiZGl2IiwiYXBwZW5kQ2hpbGQiLCJhZGRPcmlnaW4iLCJoYW5kbGVOdW1iZXIiLCJzZXRBdHRyaWJ1dGUiLCJldmVudCIsImV2ZW50S2V5ZG93biIsImF0dHJpYnV0ZXNfMSIsImF0dHJpYnV0ZSIsImFkZENvbm5lY3QiLCJhZGRFbGVtZW50cyIsImNvbm5lY3RPcHRpb25zIiwiY29ubmVjdEJhc2UiLCJhZGRTbGlkZXIiLCJ0ZXh0RGlyZWN0aW9uIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImFkZFRvb2x0aXAiLCJmaXJzdENoaWxkIiwiaXNTbGlkZXJEaXNhYmxlZCIsImhhc0F0dHJpYnV0ZSIsImlzSGFuZGxlRGlzYWJsZWQiLCJoYW5kbGVPcmlnaW4iLCJkaXNhYmxlIiwicmVtb3ZlQXR0cmlidXRlIiwiZW5hYmxlIiwicmVtb3ZlVG9vbHRpcHMiLCJyZW1vdmVFdmVudCIsImJpbmRFdmVudCIsInZhbHVlcyIsInVuZW5jb2RlZCIsImZvcm1hdHRlZFZhbHVlIiwiaW5uZXJIVE1MIiwicG9zaXRpb25zIiwiY2hlY2tIYW5kbGVQb3NpdGlvbiIsIm5vdyIsInRleHQiLCJjaGlsZHJlbiIsImdldEdyb3VwIiwibW9kZSIsIlJhbmdlIiwiU3RlcHMiLCJDb3VudCIsImludGVydmFsIiwic3ByZWFkIiwibWFwVG9SYW5nZSIsInN0ZXBwZWQiLCJQb3NpdGlvbnMiLCJWYWx1ZXMiLCJnZW5lcmF0ZVNwcmVhZCIsInNhZmVJbmNyZW1lbnQiLCJpbmNyZW1lbnQiLCJncm91cCIsImluZGV4ZXMiLCJmaXJzdEluUmFuZ2UiLCJsYXN0SW5SYW5nZSIsImlnbm9yZUZpcnN0IiwiaWdub3JlTGFzdCIsInByZXZQY3QiLCJ1bnNoaWZ0IiwiY3VycmVudCIsInEiLCJsb3ciLCJoaWdoIiwibmV3UGN0IiwicGN0RGlmZmVyZW5jZSIsInBjdFBvcyIsInR5cGUiLCJzdGVwcyIsInJlYWxTdGVwcyIsInN0ZXBTaXplIiwiaXNTdGVwcyIsImRlbnNpdHkiLCJMYXJnZVZhbHVlIiwiU21hbGxWYWx1ZSIsIk5vVmFsdWUiLCJhZGRNYXJraW5nIiwiZmlsdGVyRnVuYyIsIl9hIiwiX2IiLCJ2YWx1ZVNpemVDbGFzc2VzIiwiTm9uZSIsIm1hcmtlclNpemVDbGFzc2VzIiwidmFsdWVPcmllbnRhdGlvbkNsYXNzZXMiLCJtYXJrZXJPcmllbnRhdGlvbkNsYXNzZXMiLCJnZXRDbGFzc2VzIiwic291cmNlIiwib3JpZW50YXRpb25DbGFzc2VzIiwic2l6ZUNsYXNzZXMiLCJhZGRTcHJlYWQiLCJub2RlIiwicmVtb3ZlUGlwcyIsImJhc2VTaXplIiwiYWx0Iiwid2lkdGgiLCJoZWlnaHQiLCJhdHRhY2hFdmVudCIsImNhbGxiYWNrIiwiZGF0YSIsIm1ldGhvZCIsImZpeEV2ZW50IiwiZG9Ob3RSZWplY3QiLCJidXR0b25zIiwiY2FsY1BvaW50IiwicG9pbnRzIiwibWV0aG9kcyIsImV2ZW50TmFtZSIsInBhc3NpdmUiLCJldmVudFRhcmdldCIsInRvdWNoIiwibW91c2UiLCJwb2ludGVyIiwidG91Y2hlcyIsImlzVG91Y2hPblRhcmdldCIsImNoZWNrVG91Y2giLCJjb21wb3NlZCIsImNvbXBvc2VkUGF0aCIsInNoaWZ0IiwidGFyZ2V0VG91Y2hlcyIsImNhbGwiLCJwYWdlWCIsInBhZ2VZIiwidGFyZ2V0VG91Y2giLCJmaW5kIiwiY2hhbmdlZFRvdWNoZXMiLCJjbGllbnRYIiwiY2xpZW50WSIsImN1cnNvciIsImNhbGNQb2ludFRvUGVyY2VudGFnZSIsImxvY2F0aW9uIiwicHJvcG9zYWwiLCJnZXRDbG9zZXN0SGFuZGxlIiwiY2xpY2tlZFBvc2l0aW9uIiwic21hbGxlc3REaWZmZXJlbmNlIiwiaGFuZGxlUG9zaXRpb24iLCJkaWZmZXJlbmNlV2l0aFRoaXNIYW5kbGUiLCJjbGlja0F0RWRnZSIsImlzQ2xvc2VyIiwiaXNDbG9zZXJBZnRlciIsImRvY3VtZW50TGVhdmUiLCJub2RlTmFtZSIsInJlbGF0ZWRUYXJnZXQiLCJldmVudEVuZCIsImV2ZW50TW92ZSIsImFwcFZlcnNpb24iLCJidXR0b25zUHJvcGVydHkiLCJtb3ZlbWVudCIsInN0YXJ0Q2FsY1BvaW50IiwibW92ZUhhbmRsZXMiLCJsb2NhdGlvbnMiLCJoYW5kbGVOdW1iZXJzIiwibGlzdGVuZXJzIiwiYyIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJzZXRaaW5kZXgiLCJzZXRIYW5kbGUiLCJmaXJlRXZlbnQiLCJldmVudFN0YXJ0Iiwic29tZSIsInN0b3BQcm9wYWdhdGlvbiIsIm1vdmVFdmVudCIsImVuZEV2ZW50Iiwib3V0RXZlbnQiLCJjb25jYXQiLCJldmVudFRhcCIsImV2ZW50SG92ZXIiLCJ0YXJnZXRFdmVudCIsInNjb3BlX1NlbGYiLCJob3Jpem9udGFsS2V5cyIsInZlcnRpY2FsS2V5cyIsImxhcmdlU3RlcEtleXMiLCJlZGdlS2V5cyIsInJldmVyc2UiLCJpc0xhcmdlRG93biIsImlzTGFyZ2VVcCIsImlzVXAiLCJpc01pbiIsImlzTWF4IiwiZ2V0TmV4dFN0ZXBzRm9ySGFuZGxlIiwiYmluZFNsaWRlckV2ZW50cyIsImhhbmRsZUJlZm9yZSIsImhhbmRsZUFmdGVyIiwiZXZlbnRIb2xkZXJzIiwiaGFuZGxlc1RvRHJhZyIsImhhbmRsZU51bWJlcnNUb0RyYWciLCJldmVudEhvbGRlciIsIm5hbWVzcGFjZWRFdmVudCIsImlzSW50ZXJuYWxOYW1lc3BhY2UiLCJuYW1lc3BhY2UiLCJzdWJzdHJpbmciLCJiaW5kIiwidEV2ZW50IiwidE5hbWVzcGFjZSIsImV2ZW50VHlwZSIsInJlZmVyZW5jZSIsImxvb2tCYWNrd2FyZCIsImxvb2tGb3J3YXJkIiwiZ2V0VmFsdWUiLCJkaXN0YW5jZSIsImluUnVsZU9yZGVyIiwidiIsIm8iLCJ1cHdhcmQiLCJwcm9wb3NhbHMiLCJmaXJzdEhhbmRsZSIsImYiLCJzdGF0ZSIsInRyYW5zZm9ybURpcmVjdGlvbiIsInVwZGF0ZUhhbmRsZVBvc2l0aW9uIiwidHJhbnNsYXRpb24iLCJ0cmFuc2xhdGVSdWxlIiwidXBkYXRlQ29ubmVjdCIsInpJbmRleCIsImV4YWN0SW5wdXQiLCJsIiwiaCIsImNvbm5lY3RXaWR0aCIsInNjYWxlUnVsZSIsInJlc29sdmVUb1ZhbHVlIiwidmFsdWVTZXQiLCJpbnB1dCIsImZpcmVTZXRFdmVudCIsImlzSW5pdCIsInNwYWNlXzEiLCJ2YWx1ZVJlc2V0IiwidmFsdWVTZXRIYW5kbGUiLCJ2YWx1ZUdldCIsImRlc3Ryb3kiLCJuZWFyYnlTdGVwcyIsImRlY3JlbWVudCIsImdldE5leHRTdGVwcyIsInVwZGF0ZU9wdGlvbnMiLCJvcHRpb25zVG9VcGRhdGUiLCJ1cGRhdGVBYmxlIiwibmV3T3B0aW9ucyIsInNldHVwU2xpZGVyIiwib24iLCJvZmYiLCJzZXQiLCJyZXNldCIsIl9fbW92ZUhhbmRsZXMiLCJnZXRQb3NpdGlvbnMiLCJnZXRUb29sdGlwcyIsImdldE9yaWdpbnMiLCJpbml0aWFsaXplIiwiYXBpIiwibm91aXNsaWRlciIsIl9fc3BlY3RydW0iLCJjcmVhdGUiXSwic291cmNlcyI6WyJub3Vpc2xpZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XHJcbiAgICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcclxuICAgIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxyXG4gICAgKGdsb2JhbCA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiBnbG9iYWwgfHwgc2VsZiwgZmFjdG9yeShnbG9iYWwubm9VaVNsaWRlciA9IHt9KSk7XHJcbn0pKHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgZXhwb3J0cy5QaXBzTW9kZSA9IHZvaWQgMDtcclxuICAgIChmdW5jdGlvbiAoUGlwc01vZGUpIHtcclxuICAgICAgICBQaXBzTW9kZVtcIlJhbmdlXCJdID0gXCJyYW5nZVwiO1xyXG4gICAgICAgIFBpcHNNb2RlW1wiU3RlcHNcIl0gPSBcInN0ZXBzXCI7XHJcbiAgICAgICAgUGlwc01vZGVbXCJQb3NpdGlvbnNcIl0gPSBcInBvc2l0aW9uc1wiO1xyXG4gICAgICAgIFBpcHNNb2RlW1wiQ291bnRcIl0gPSBcImNvdW50XCI7XHJcbiAgICAgICAgUGlwc01vZGVbXCJWYWx1ZXNcIl0gPSBcInZhbHVlc1wiO1xyXG4gICAgfSkoZXhwb3J0cy5QaXBzTW9kZSB8fCAoZXhwb3J0cy5QaXBzTW9kZSA9IHt9KSk7XHJcbiAgICBleHBvcnRzLlBpcHNUeXBlID0gdm9pZCAwO1xyXG4gICAgKGZ1bmN0aW9uIChQaXBzVHlwZSkge1xyXG4gICAgICAgIFBpcHNUeXBlW1BpcHNUeXBlW1wiTm9uZVwiXSA9IC0xXSA9IFwiTm9uZVwiO1xyXG4gICAgICAgIFBpcHNUeXBlW1BpcHNUeXBlW1wiTm9WYWx1ZVwiXSA9IDBdID0gXCJOb1ZhbHVlXCI7XHJcbiAgICAgICAgUGlwc1R5cGVbUGlwc1R5cGVbXCJMYXJnZVZhbHVlXCJdID0gMV0gPSBcIkxhcmdlVmFsdWVcIjtcclxuICAgICAgICBQaXBzVHlwZVtQaXBzVHlwZVtcIlNtYWxsVmFsdWVcIl0gPSAyXSA9IFwiU21hbGxWYWx1ZVwiO1xyXG4gICAgfSkoZXhwb3J0cy5QaXBzVHlwZSB8fCAoZXhwb3J0cy5QaXBzVHlwZSA9IHt9KSk7XHJcbiAgICAvL3JlZ2lvbiBIZWxwZXIgTWV0aG9kc1xyXG4gICAgZnVuY3Rpb24gaXNWYWxpZEZvcm1hdHRlcihlbnRyeSkge1xyXG4gICAgICAgIHJldHVybiBpc1ZhbGlkUGFydGlhbEZvcm1hdHRlcihlbnRyeSkgJiYgdHlwZW9mIGVudHJ5LmZyb20gPT09IFwiZnVuY3Rpb25cIjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGlzVmFsaWRQYXJ0aWFsRm9ybWF0dGVyKGVudHJ5KSB7XHJcbiAgICAgICAgLy8gcGFydGlhbCBmb3JtYXR0ZXJzIG9ubHkgbmVlZCBhIHRvIGZ1bmN0aW9uIGFuZCBub3QgYSBmcm9tIGZ1bmN0aW9uXHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBlbnRyeSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgZW50cnkudG8gPT09IFwiZnVuY3Rpb25cIjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHJlbW92ZUVsZW1lbnQoZWwpIHtcclxuICAgICAgICBlbC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGVsKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGlzU2V0KHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICAvLyBCaW5kYWJsZSB2ZXJzaW9uXHJcbiAgICBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfVxyXG4gICAgLy8gUmVtb3ZlcyBkdXBsaWNhdGVzIGZyb20gYW4gYXJyYXkuXHJcbiAgICBmdW5jdGlvbiB1bmlxdWUoYXJyYXkpIHtcclxuICAgICAgICByZXR1cm4gYXJyYXkuZmlsdGVyKGZ1bmN0aW9uIChhKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhdGhpc1thXSA/ICh0aGlzW2FdID0gdHJ1ZSkgOiBmYWxzZTtcclxuICAgICAgICB9LCB7fSk7XHJcbiAgICB9XHJcbiAgICAvLyBSb3VuZCBhIHZhbHVlIHRvIHRoZSBjbG9zZXN0ICd0bycuXHJcbiAgICBmdW5jdGlvbiBjbG9zZXN0KHZhbHVlLCB0bykge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlIC8gdG8pICogdG87XHJcbiAgICB9XHJcbiAgICAvLyBDdXJyZW50IHBvc2l0aW9uIG9mIGFuIGVsZW1lbnQgcmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50LlxyXG4gICAgZnVuY3Rpb24gb2Zmc2V0KGVsZW0sIG9yaWVudGF0aW9uKSB7XHJcbiAgICAgICAgdmFyIHJlY3QgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIHZhciBkb2MgPSBlbGVtLm93bmVyRG9jdW1lbnQ7XHJcbiAgICAgICAgdmFyIGRvY0VsZW0gPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgICAgIHZhciBwYWdlT2Zmc2V0ID0gZ2V0UGFnZU9mZnNldChkb2MpO1xyXG4gICAgICAgIC8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBjb250YWlucyBsZWZ0IHNjcm9sbCBpbiBDaHJvbWUgb24gQW5kcm9pZC5cclxuICAgICAgICAvLyBJIGhhdmVuJ3QgZm91bmQgYSBmZWF0dXJlIGRldGVjdGlvbiB0aGF0IHByb3ZlcyB0aGlzLiBXb3JzdCBjYXNlXHJcbiAgICAgICAgLy8gc2NlbmFyaW8gb24gbWlzLW1hdGNoOiB0aGUgJ3RhcCcgZmVhdHVyZSBvbiBob3Jpem9udGFsIHNsaWRlcnMgYnJlYWtzLlxyXG4gICAgICAgIGlmICgvd2Via2l0LipDaHJvbWUuKk1vYmlsZS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcclxuICAgICAgICAgICAgcGFnZU9mZnNldC54ID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9yaWVudGF0aW9uID8gcmVjdC50b3AgKyBwYWdlT2Zmc2V0LnkgLSBkb2NFbGVtLmNsaWVudFRvcCA6IHJlY3QubGVmdCArIHBhZ2VPZmZzZXQueCAtIGRvY0VsZW0uY2xpZW50TGVmdDtcclxuICAgIH1cclxuICAgIC8vIENoZWNrcyB3aGV0aGVyIGEgdmFsdWUgaXMgbnVtZXJpY2FsLlxyXG4gICAgZnVuY3Rpb24gaXNOdW1lcmljKGEpIHtcclxuICAgICAgICByZXR1cm4gdHlwZW9mIGEgPT09IFwibnVtYmVyXCIgJiYgIWlzTmFOKGEpICYmIGlzRmluaXRlKGEpO1xyXG4gICAgfVxyXG4gICAgLy8gU2V0cyBhIGNsYXNzIGFuZCByZW1vdmVzIGl0IGFmdGVyIFtkdXJhdGlvbl0gbXMuXHJcbiAgICBmdW5jdGlvbiBhZGRDbGFzc0ZvcihlbGVtZW50LCBjbGFzc05hbWUsIGR1cmF0aW9uKSB7XHJcbiAgICAgICAgaWYgKGR1cmF0aW9uID4gMCkge1xyXG4gICAgICAgICAgICBhZGRDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgIH0sIGR1cmF0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBMaW1pdHMgYSB2YWx1ZSB0byAwIC0gMTAwXHJcbiAgICBmdW5jdGlvbiBsaW1pdChhKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KE1hdGgubWluKGEsIDEwMCksIDApO1xyXG4gICAgfVxyXG4gICAgLy8gV3JhcHMgYSB2YXJpYWJsZSBhcyBhbiBhcnJheSwgaWYgaXQgaXNuJ3Qgb25lIHlldC5cclxuICAgIC8vIE5vdGUgdGhhdCBhbiBpbnB1dCBhcnJheSBpcyByZXR1cm5lZCBieSByZWZlcmVuY2UhXHJcbiAgICBmdW5jdGlvbiBhc0FycmF5KGEpIHtcclxuICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShhKSA/IGEgOiBbYV07XHJcbiAgICB9XHJcbiAgICAvLyBDb3VudHMgZGVjaW1hbHNcclxuICAgIGZ1bmN0aW9uIGNvdW50RGVjaW1hbHMobnVtU3RyKSB7XHJcbiAgICAgICAgbnVtU3RyID0gU3RyaW5nKG51bVN0cik7XHJcbiAgICAgICAgdmFyIHBpZWNlcyA9IG51bVN0ci5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgcmV0dXJuIHBpZWNlcy5sZW5ndGggPiAxID8gcGllY2VzWzFdLmxlbmd0aCA6IDA7XHJcbiAgICB9XHJcbiAgICAvLyBodHRwOi8veW91bWlnaHRub3RuZWVkanF1ZXJ5LmNvbS8jYWRkX2NsYXNzXHJcbiAgICBmdW5jdGlvbiBhZGRDbGFzcyhlbCwgY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgaWYgKGVsLmNsYXNzTGlzdCAmJiAhL1xccy8udGVzdChjbGFzc05hbWUpKSB7XHJcbiAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSArPSBcIiBcIiArIGNsYXNzTmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBodHRwOi8veW91bWlnaHRub3RuZWVkanF1ZXJ5LmNvbS8jcmVtb3ZlX2NsYXNzXHJcbiAgICBmdW5jdGlvbiByZW1vdmVDbGFzcyhlbCwgY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgaWYgKGVsLmNsYXNzTGlzdCAmJiAhL1xccy8udGVzdChjbGFzc05hbWUpKSB7XHJcbiAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoXCIoXnxcXFxcYilcIiArIGNsYXNzTmFtZS5zcGxpdChcIiBcIikuam9pbihcInxcIikgKyBcIihcXFxcYnwkKVwiLCBcImdpXCIpLCBcIiBcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gaHR0cHM6Ly9wbGFpbmpzLmNvbS9qYXZhc2NyaXB0L2F0dHJpYnV0ZXMvYWRkaW5nLXJlbW92aW5nLWFuZC10ZXN0aW5nLWZvci1jbGFzc2VzLTkvXHJcbiAgICBmdW5jdGlvbiBoYXNDbGFzcyhlbCwgY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsLmNsYXNzTGlzdCA/IGVsLmNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWUpIDogbmV3IFJlZ0V4cChcIlxcXFxiXCIgKyBjbGFzc05hbWUgKyBcIlxcXFxiXCIpLnRlc3QoZWwuY2xhc3NOYW1lKTtcclxuICAgIH1cclxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3cvc2Nyb2xsWSNOb3Rlc1xyXG4gICAgZnVuY3Rpb24gZ2V0UGFnZU9mZnNldChkb2MpIHtcclxuICAgICAgICB2YXIgc3VwcG9ydFBhZ2VPZmZzZXQgPSB3aW5kb3cucGFnZVhPZmZzZXQgIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB2YXIgaXNDU1MxQ29tcGF0ID0gKGRvYy5jb21wYXRNb2RlIHx8IFwiXCIpID09PSBcIkNTUzFDb21wYXRcIjtcclxuICAgICAgICB2YXIgeCA9IHN1cHBvcnRQYWdlT2Zmc2V0XHJcbiAgICAgICAgICAgID8gd2luZG93LnBhZ2VYT2Zmc2V0XHJcbiAgICAgICAgICAgIDogaXNDU1MxQ29tcGF0XHJcbiAgICAgICAgICAgICAgICA/IGRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdFxyXG4gICAgICAgICAgICAgICAgOiBkb2MuYm9keS5zY3JvbGxMZWZ0O1xyXG4gICAgICAgIHZhciB5ID0gc3VwcG9ydFBhZ2VPZmZzZXRcclxuICAgICAgICAgICAgPyB3aW5kb3cucGFnZVlPZmZzZXRcclxuICAgICAgICAgICAgOiBpc0NTUzFDb21wYXRcclxuICAgICAgICAgICAgICAgID8gZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcclxuICAgICAgICAgICAgICAgIDogZG9jLmJvZHkuc2Nyb2xsVG9wO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IHgsXHJcbiAgICAgICAgICAgIHk6IHksXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIC8vIHdlIHByb3ZpZGUgYSBmdW5jdGlvbiB0byBjb21wdXRlIGNvbnN0YW50cyBpbnN0ZWFkXHJcbiAgICAvLyBvZiBhY2Nlc3Npbmcgd2luZG93LiogYXMgc29vbiBhcyB0aGUgbW9kdWxlIG5lZWRzIGl0XHJcbiAgICAvLyBzbyB0aGF0IHdlIGRvIG5vdCBjb21wdXRlIGFueXRoaW5nIGlmIG5vdCBuZWVkZWRcclxuICAgIGZ1bmN0aW9uIGdldEFjdGlvbnMoKSB7XHJcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBldmVudHMgdG8gYmluZC4gSUUxMSBpbXBsZW1lbnRzIHBvaW50ZXJFdmVudHMgd2l0aG91dFxyXG4gICAgICAgIC8vIGEgcHJlZml4LCB3aGljaCBicmVha3MgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBJRTEwIGltcGxlbWVudGF0aW9uLlxyXG4gICAgICAgIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkXHJcbiAgICAgICAgICAgID8ge1xyXG4gICAgICAgICAgICAgICAgc3RhcnQ6IFwicG9pbnRlcmRvd25cIixcclxuICAgICAgICAgICAgICAgIG1vdmU6IFwicG9pbnRlcm1vdmVcIixcclxuICAgICAgICAgICAgICAgIGVuZDogXCJwb2ludGVydXBcIixcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICA6IHdpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZFxyXG4gICAgICAgICAgICAgICAgPyB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IFwiTVNQb2ludGVyRG93blwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vdmU6IFwiTVNQb2ludGVyTW92ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGVuZDogXCJNU1BvaW50ZXJVcFwiLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IFwibW91c2Vkb3duIHRvdWNoc3RhcnRcIixcclxuICAgICAgICAgICAgICAgICAgICBtb3ZlOiBcIm1vdXNlbW92ZSB0b3VjaG1vdmVcIixcclxuICAgICAgICAgICAgICAgICAgICBlbmQ6IFwibW91c2V1cCB0b3VjaGVuZFwiLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgIH1cclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9XSUNHL0V2ZW50TGlzdGVuZXJPcHRpb25zL2Jsb2IvZ2gtcGFnZXMvZXhwbGFpbmVyLm1kXHJcbiAgICAvLyBJc3N1ZSAjNzg1XHJcbiAgICBmdW5jdGlvbiBnZXRTdXBwb3J0c1Bhc3NpdmUoKSB7XHJcbiAgICAgICAgdmFyIHN1cHBvcnRzUGFzc2l2ZSA9IGZhbHNlO1xyXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlICovXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIG9wdHMgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sIFwicGFzc2l2ZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdXBwb3J0c1Bhc3NpdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ0ZXN0XCIsIG51bGwsIG9wdHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkgeyB9XHJcbiAgICAgICAgLyogZXNsaW50LWVuYWJsZSAqL1xyXG4gICAgICAgIHJldHVybiBzdXBwb3J0c1Bhc3NpdmU7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBnZXRTdXBwb3J0c1RvdWNoQWN0aW9uTm9uZSgpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93LkNTUyAmJiBDU1Muc3VwcG9ydHMgJiYgQ1NTLnN1cHBvcnRzKFwidG91Y2gtYWN0aW9uXCIsIFwibm9uZVwiKTtcclxuICAgIH1cclxuICAgIC8vZW5kcmVnaW9uXHJcbiAgICAvL3JlZ2lvbiBSYW5nZSBDYWxjdWxhdGlvblxyXG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBzaXplIG9mIGEgc3ViLXJhbmdlIGluIHJlbGF0aW9uIHRvIGEgZnVsbCByYW5nZS5cclxuICAgIGZ1bmN0aW9uIHN1YlJhbmdlUmF0aW8ocGEsIHBiKSB7XHJcbiAgICAgICAgcmV0dXJuIDEwMCAvIChwYiAtIHBhKTtcclxuICAgIH1cclxuICAgIC8vIChwZXJjZW50YWdlKSBIb3cgbWFueSBwZXJjZW50IGlzIHRoaXMgdmFsdWUgb2YgdGhpcyByYW5nZT9cclxuICAgIGZ1bmN0aW9uIGZyb21QZXJjZW50YWdlKHJhbmdlLCB2YWx1ZSwgc3RhcnRSYW5nZSkge1xyXG4gICAgICAgIHJldHVybiAodmFsdWUgKiAxMDApIC8gKHJhbmdlW3N0YXJ0UmFuZ2UgKyAxXSAtIHJhbmdlW3N0YXJ0UmFuZ2VdKTtcclxuICAgIH1cclxuICAgIC8vIChwZXJjZW50YWdlKSBXaGVyZSBpcyB0aGlzIHZhbHVlIG9uIHRoaXMgcmFuZ2U/XHJcbiAgICBmdW5jdGlvbiB0b1BlcmNlbnRhZ2UocmFuZ2UsIHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIGZyb21QZXJjZW50YWdlKHJhbmdlLCByYW5nZVswXSA8IDAgPyB2YWx1ZSArIE1hdGguYWJzKHJhbmdlWzBdKSA6IHZhbHVlIC0gcmFuZ2VbMF0sIDApO1xyXG4gICAgfVxyXG4gICAgLy8gKHZhbHVlKSBIb3cgbXVjaCBpcyB0aGlzIHBlcmNlbnRhZ2Ugb24gdGhpcyByYW5nZT9cclxuICAgIGZ1bmN0aW9uIGlzUGVyY2VudGFnZShyYW5nZSwgdmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gKHZhbHVlICogKHJhbmdlWzFdIC0gcmFuZ2VbMF0pKSAvIDEwMCArIHJhbmdlWzBdO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gZ2V0Sih2YWx1ZSwgYXJyKSB7XHJcbiAgICAgICAgdmFyIGogPSAxO1xyXG4gICAgICAgIHdoaWxlICh2YWx1ZSA+PSBhcnJbal0pIHtcclxuICAgICAgICAgICAgaiArPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gajtcclxuICAgIH1cclxuICAgIC8vIChwZXJjZW50YWdlKSBJbnB1dCBhIHZhbHVlLCBmaW5kIHdoZXJlLCBvbiBhIHNjYWxlIG9mIDAtMTAwLCBpdCBhcHBsaWVzLlxyXG4gICAgZnVuY3Rpb24gdG9TdGVwcGluZyh4VmFsLCB4UGN0LCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICh2YWx1ZSA+PSB4VmFsLnNsaWNlKC0xKVswXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gMTAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaiA9IGdldEoodmFsdWUsIHhWYWwpO1xyXG4gICAgICAgIHZhciB2YSA9IHhWYWxbaiAtIDFdO1xyXG4gICAgICAgIHZhciB2YiA9IHhWYWxbal07XHJcbiAgICAgICAgdmFyIHBhID0geFBjdFtqIC0gMV07XHJcbiAgICAgICAgdmFyIHBiID0geFBjdFtqXTtcclxuICAgICAgICByZXR1cm4gcGEgKyB0b1BlcmNlbnRhZ2UoW3ZhLCB2Yl0sIHZhbHVlKSAvIHN1YlJhbmdlUmF0aW8ocGEsIHBiKTtcclxuICAgIH1cclxuICAgIC8vICh2YWx1ZSkgSW5wdXQgYSBwZXJjZW50YWdlLCBmaW5kIHdoZXJlIGl0IGlzIG9uIHRoZSBzcGVjaWZpZWQgcmFuZ2UuXHJcbiAgICBmdW5jdGlvbiBmcm9tU3RlcHBpbmcoeFZhbCwgeFBjdCwgdmFsdWUpIHtcclxuICAgICAgICAvLyBUaGVyZSBpcyBubyByYW5nZSBncm91cCB0aGF0IGZpdHMgMTAwXHJcbiAgICAgICAgaWYgKHZhbHVlID49IDEwMCkge1xyXG4gICAgICAgICAgICByZXR1cm4geFZhbC5zbGljZSgtMSlbMF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBqID0gZ2V0Sih2YWx1ZSwgeFBjdCk7XHJcbiAgICAgICAgdmFyIHZhID0geFZhbFtqIC0gMV07XHJcbiAgICAgICAgdmFyIHZiID0geFZhbFtqXTtcclxuICAgICAgICB2YXIgcGEgPSB4UGN0W2ogLSAxXTtcclxuICAgICAgICB2YXIgcGIgPSB4UGN0W2pdO1xyXG4gICAgICAgIHJldHVybiBpc1BlcmNlbnRhZ2UoW3ZhLCB2Yl0sICh2YWx1ZSAtIHBhKSAqIHN1YlJhbmdlUmF0aW8ocGEsIHBiKSk7XHJcbiAgICB9XHJcbiAgICAvLyAocGVyY2VudGFnZSkgR2V0IHRoZSBzdGVwIHRoYXQgYXBwbGllcyBhdCBhIGNlcnRhaW4gdmFsdWUuXHJcbiAgICBmdW5jdGlvbiBnZXRTdGVwKHhQY3QsIHhTdGVwcywgc25hcCwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT09IDEwMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBqID0gZ2V0Sih2YWx1ZSwgeFBjdCk7XHJcbiAgICAgICAgdmFyIGEgPSB4UGN0W2ogLSAxXTtcclxuICAgICAgICB2YXIgYiA9IHhQY3Rbal07XHJcbiAgICAgICAgLy8gSWYgJ3NuYXAnIGlzIHNldCwgc3RlcHMgYXJlIHVzZWQgYXMgZml4ZWQgcG9pbnRzIG9uIHRoZSBzbGlkZXIuXHJcbiAgICAgICAgaWYgKHNuYXApIHtcclxuICAgICAgICAgICAgLy8gRmluZCB0aGUgY2xvc2VzdCBwb3NpdGlvbiwgYSBvciBiLlxyXG4gICAgICAgICAgICBpZiAodmFsdWUgLSBhID4gKGIgLSBhKSAvIDIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXhTdGVwc1tqIC0gMV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geFBjdFtqIC0gMV0gKyBjbG9zZXN0KHZhbHVlIC0geFBjdFtqIC0gMV0sIHhTdGVwc1tqIC0gMV0pO1xyXG4gICAgfVxyXG4gICAgLy9lbmRyZWdpb25cclxuICAgIC8vcmVnaW9uIFNwZWN0cnVtXHJcbiAgICB2YXIgU3BlY3RydW0gPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gU3BlY3RydW0oZW50cnksIHNuYXAsIHNpbmdsZVN0ZXApIHtcclxuICAgICAgICAgICAgdGhpcy54UGN0ID0gW107XHJcbiAgICAgICAgICAgIHRoaXMueFZhbCA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnhTdGVwcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnhOdW1TdGVwcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnhIaWdoZXN0Q29tcGxldGVTdGVwID0gW107XHJcbiAgICAgICAgICAgIHRoaXMueFN0ZXBzID0gW3NpbmdsZVN0ZXAgfHwgZmFsc2VdO1xyXG4gICAgICAgICAgICB0aGlzLnhOdW1TdGVwcyA9IFtmYWxzZV07XHJcbiAgICAgICAgICAgIHRoaXMuc25hcCA9IHNuYXA7XHJcbiAgICAgICAgICAgIHZhciBpbmRleDtcclxuICAgICAgICAgICAgdmFyIG9yZGVyZWQgPSBbXTtcclxuICAgICAgICAgICAgLy8gTWFwIHRoZSBvYmplY3Qga2V5cyB0byBhbiBhcnJheS5cclxuICAgICAgICAgICAgT2JqZWN0LmtleXMoZW50cnkpLmZvckVhY2goZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICBvcmRlcmVkLnB1c2goW2FzQXJyYXkoZW50cnlbaW5kZXhdKSwgaW5kZXhdKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIFNvcnQgYWxsIGVudHJpZXMgYnkgdmFsdWUgKG51bWVyaWMgc29ydCkuXHJcbiAgICAgICAgICAgIG9yZGVyZWQuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFbMF1bMF0gLSBiWzBdWzBdO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gQ29udmVydCBhbGwgZW50cmllcyB0byBzdWJyYW5nZXMuXHJcbiAgICAgICAgICAgIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IG9yZGVyZWQubGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUVudHJ5UG9pbnQob3JkZXJlZFtpbmRleF1bMV0sIG9yZGVyZWRbaW5kZXhdWzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTdG9yZSB0aGUgYWN0dWFsIHN0ZXAgdmFsdWVzLlxyXG4gICAgICAgICAgICAvLyB4U3RlcHMgaXMgc29ydGVkIGluIHRoZSBzYW1lIG9yZGVyIGFzIHhQY3QgYW5kIHhWYWwuXHJcbiAgICAgICAgICAgIHRoaXMueE51bVN0ZXBzID0gdGhpcy54U3RlcHMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIC8vIENvbnZlcnQgYWxsIG51bWVyaWMgc3RlcHMgdG8gdGhlIHBlcmNlbnRhZ2Ugb2YgdGhlIHN1YnJhbmdlIHRoZXkgcmVwcmVzZW50LlxyXG4gICAgICAgICAgICBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLnhOdW1TdGVwcy5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlU3RlcFBvaW50KGluZGV4LCB0aGlzLnhOdW1TdGVwc1tpbmRleF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFNwZWN0cnVtLnByb3RvdHlwZS5nZXREaXN0YW5jZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgZGlzdGFuY2VzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLnhOdW1TdGVwcy5sZW5ndGggLSAxOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICBkaXN0YW5jZXNbaW5kZXhdID0gZnJvbVBlcmNlbnRhZ2UodGhpcy54VmFsLCB2YWx1ZSwgaW5kZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkaXN0YW5jZXM7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIHBlcmNlbnR1YWwgZGlzdGFuY2Ugb3ZlciB0aGUgd2hvbGUgc2NhbGUgb2YgcmFuZ2VzLlxyXG4gICAgICAgIC8vIGRpcmVjdGlvbjogMCA9IGJhY2t3YXJkcyAvIDEgPSBmb3J3YXJkc1xyXG4gICAgICAgIFNwZWN0cnVtLnByb3RvdHlwZS5nZXRBYnNvbHV0ZURpc3RhbmNlID0gZnVuY3Rpb24gKHZhbHVlLCBkaXN0YW5jZXMsIGRpcmVjdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgeFBjdF9pbmRleCA9IDA7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSByYW5nZSB3aGVyZSB0byBzdGFydCBjYWxjdWxhdGlvblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPCB0aGlzLnhQY3RbdGhpcy54UGN0Lmxlbmd0aCAtIDFdKSB7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAodmFsdWUgPiB0aGlzLnhQY3RbeFBjdF9pbmRleCArIDFdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeFBjdF9pbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09PSB0aGlzLnhQY3RbdGhpcy54UGN0Lmxlbmd0aCAtIDFdKSB7XHJcbiAgICAgICAgICAgICAgICB4UGN0X2luZGV4ID0gdGhpcy54UGN0Lmxlbmd0aCAtIDI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSWYgbG9va2luZyBiYWNrd2FyZHMgYW5kIHRoZSB2YWx1ZSBpcyBleGFjdGx5IGF0IGEgcmFuZ2Ugc2VwYXJhdG9yIHRoZW4gbG9vayBvbmUgcmFuZ2UgZnVydGhlclxyXG4gICAgICAgICAgICBpZiAoIWRpcmVjdGlvbiAmJiB2YWx1ZSA9PT0gdGhpcy54UGN0W3hQY3RfaW5kZXggKyAxXSkge1xyXG4gICAgICAgICAgICAgICAgeFBjdF9pbmRleCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChkaXN0YW5jZXMgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGRpc3RhbmNlcyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBzdGFydF9mYWN0b3I7XHJcbiAgICAgICAgICAgIHZhciByZXN0X2ZhY3RvciA9IDE7XHJcbiAgICAgICAgICAgIHZhciByZXN0X3JlbF9kaXN0YW5jZSA9IGRpc3RhbmNlc1t4UGN0X2luZGV4XTtcclxuICAgICAgICAgICAgdmFyIHJhbmdlX3BjdCA9IDA7XHJcbiAgICAgICAgICAgIHZhciByZWxfcmFuZ2VfZGlzdGFuY2UgPSAwO1xyXG4gICAgICAgICAgICB2YXIgYWJzX2Rpc3RhbmNlX2NvdW50ZXIgPSAwO1xyXG4gICAgICAgICAgICB2YXIgcmFuZ2VfY291bnRlciA9IDA7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB3aGF0IHBhcnQgb2YgdGhlIHN0YXJ0IHJhbmdlIHRoZSB2YWx1ZSBpc1xyXG4gICAgICAgICAgICBpZiAoZGlyZWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBzdGFydF9mYWN0b3IgPSAodmFsdWUgLSB0aGlzLnhQY3RbeFBjdF9pbmRleF0pIC8gKHRoaXMueFBjdFt4UGN0X2luZGV4ICsgMV0gLSB0aGlzLnhQY3RbeFBjdF9pbmRleF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc3RhcnRfZmFjdG9yID0gKHRoaXMueFBjdFt4UGN0X2luZGV4ICsgMV0gLSB2YWx1ZSkgLyAodGhpcy54UGN0W3hQY3RfaW5kZXggKyAxXSAtIHRoaXMueFBjdFt4UGN0X2luZGV4XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRG8gdW50aWwgdGhlIGNvbXBsZXRlIGRpc3RhbmNlIGFjcm9zcyByYW5nZXMgaXMgY2FsY3VsYXRlZFxyXG4gICAgICAgICAgICB3aGlsZSAocmVzdF9yZWxfZGlzdGFuY2UgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIHBlcmNlbnRhZ2Ugb2YgdG90YWwgcmFuZ2VcclxuICAgICAgICAgICAgICAgIHJhbmdlX3BjdCA9IHRoaXMueFBjdFt4UGN0X2luZGV4ICsgMSArIHJhbmdlX2NvdW50ZXJdIC0gdGhpcy54UGN0W3hQY3RfaW5kZXggKyByYW5nZV9jb3VudGVyXTtcclxuICAgICAgICAgICAgICAgIC8vIERldGVjdCBpZiB0aGUgbWFyZ2luLCBwYWRkaW5nIG9yIGxpbWl0IGlzIGxhcmdlciB0aGVuIHRoZSBjdXJyZW50IHJhbmdlIGFuZCBjYWxjdWxhdGVcclxuICAgICAgICAgICAgICAgIGlmIChkaXN0YW5jZXNbeFBjdF9pbmRleCArIHJhbmdlX2NvdW50ZXJdICogcmVzdF9mYWN0b3IgKyAxMDAgLSBzdGFydF9mYWN0b3IgKiAxMDAgPiAxMDApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBsYXJnZXIgdGhlbiB0YWtlIHRoZSBwZXJjZW50dWFsIGRpc3RhbmNlIG9mIHRoZSB3aG9sZSByYW5nZVxyXG4gICAgICAgICAgICAgICAgICAgIHJlbF9yYW5nZV9kaXN0YW5jZSA9IHJhbmdlX3BjdCAqIHN0YXJ0X2ZhY3RvcjtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXN0IGZhY3RvciBvZiByZWxhdGl2ZSBwZXJjZW50dWFsIGRpc3RhbmNlIHN0aWxsIHRvIGJlIGNhbGN1bGF0ZWRcclxuICAgICAgICAgICAgICAgICAgICByZXN0X2ZhY3RvciA9IChyZXN0X3JlbF9kaXN0YW5jZSAtIDEwMCAqIHN0YXJ0X2ZhY3RvcikgLyBkaXN0YW5jZXNbeFBjdF9pbmRleCArIHJhbmdlX2NvdW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldCBzdGFydCBmYWN0b3IgdG8gMSBhcyBmb3IgbmV4dCByYW5nZSBpdCBkb2VzIG5vdCBhcHBseS5cclxuICAgICAgICAgICAgICAgICAgICBzdGFydF9mYWN0b3IgPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgc21hbGxlciBvciBlcXVhbCB0aGVuIHRha2UgdGhlIHBlcmNlbnR1YWwgZGlzdGFuY2Ugb2YgdGhlIGNhbGN1bGF0ZSBwZXJjZW50dWFsIHBhcnQgb2YgdGhhdCByYW5nZVxyXG4gICAgICAgICAgICAgICAgICAgIHJlbF9yYW5nZV9kaXN0YW5jZSA9ICgoZGlzdGFuY2VzW3hQY3RfaW5kZXggKyByYW5nZV9jb3VudGVyXSAqIHJhbmdlX3BjdCkgLyAxMDApICogcmVzdF9mYWN0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gcmVzdCBsZWZ0IGFzIHRoZSByZXN0IGZpdHMgaW4gY3VycmVudCByYW5nZVxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3RfZmFjdG9yID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChkaXJlY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBhYnNfZGlzdGFuY2VfY291bnRlciA9IGFic19kaXN0YW5jZV9jb3VudGVyIC0gcmVsX3JhbmdlX2Rpc3RhbmNlO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIExpbWl0IHJhbmdlIHRvIGZpcnN0IHJhbmdlIHdoZW4gZGlzdGFuY2UgYmVjb21lcyBvdXRzaWRlIG9mIG1pbmltdW0gcmFuZ2VcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy54UGN0Lmxlbmd0aCArIHJhbmdlX2NvdW50ZXIgPj0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZV9jb3VudGVyLS07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWJzX2Rpc3RhbmNlX2NvdW50ZXIgPSBhYnNfZGlzdGFuY2VfY291bnRlciArIHJlbF9yYW5nZV9kaXN0YW5jZTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBMaW1pdCByYW5nZSB0byBsYXN0IHJhbmdlIHdoZW4gZGlzdGFuY2UgYmVjb21lcyBvdXRzaWRlIG9mIG1heGltdW0gcmFuZ2VcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy54UGN0Lmxlbmd0aCAtIHJhbmdlX2NvdW50ZXIgPj0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZV9jb3VudGVyKys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUmVzdCBvZiByZWxhdGl2ZSBwZXJjZW50dWFsIGRpc3RhbmNlIHN0aWxsIHRvIGJlIGNhbGN1bGF0ZWRcclxuICAgICAgICAgICAgICAgIHJlc3RfcmVsX2Rpc3RhbmNlID0gZGlzdGFuY2VzW3hQY3RfaW5kZXggKyByYW5nZV9jb3VudGVyXSAqIHJlc3RfZmFjdG9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSArIGFic19kaXN0YW5jZV9jb3VudGVyO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgU3BlY3RydW0ucHJvdG90eXBlLnRvU3RlcHBpbmcgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSB0b1N0ZXBwaW5nKHRoaXMueFZhbCwgdGhpcy54UGN0LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFNwZWN0cnVtLnByb3RvdHlwZS5mcm9tU3RlcHBpbmcgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZyb21TdGVwcGluZyh0aGlzLnhWYWwsIHRoaXMueFBjdCwgdmFsdWUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgU3BlY3RydW0ucHJvdG90eXBlLmdldFN0ZXAgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdmFsdWUgPSBnZXRTdGVwKHRoaXMueFBjdCwgdGhpcy54U3RlcHMsIHRoaXMuc25hcCwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBTcGVjdHJ1bS5wcm90b3R5cGUuZ2V0RGVmYXVsdFN0ZXAgPSBmdW5jdGlvbiAodmFsdWUsIGlzRG93biwgc2l6ZSkge1xyXG4gICAgICAgICAgICB2YXIgaiA9IGdldEoodmFsdWUsIHRoaXMueFBjdCk7XHJcbiAgICAgICAgICAgIC8vIFdoZW4gYXQgdGhlIHRvcCBvciBzdGVwcGluZyBkb3duLCBsb29rIGF0IHRoZSBwcmV2aW91cyBzdWItcmFuZ2VcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAxMDAgfHwgKGlzRG93biAmJiB2YWx1ZSA9PT0gdGhpcy54UGN0W2ogLSAxXSkpIHtcclxuICAgICAgICAgICAgICAgIGogPSBNYXRoLm1heChqIC0gMSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnhWYWxbal0gLSB0aGlzLnhWYWxbaiAtIDFdKSAvIHNpemU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBTcGVjdHJ1bS5wcm90b3R5cGUuZ2V0TmVhcmJ5U3RlcHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIGogPSBnZXRKKHZhbHVlLCB0aGlzLnhQY3QpO1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RlcEJlZm9yZToge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWU6IHRoaXMueFZhbFtqIC0gMl0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcDogdGhpcy54TnVtU3RlcHNbaiAtIDJdLFxyXG4gICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RTdGVwOiB0aGlzLnhIaWdoZXN0Q29tcGxldGVTdGVwW2ogLSAyXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB0aGlzU3RlcDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWU6IHRoaXMueFZhbFtqIC0gMV0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcDogdGhpcy54TnVtU3RlcHNbaiAtIDFdLFxyXG4gICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RTdGVwOiB0aGlzLnhIaWdoZXN0Q29tcGxldGVTdGVwW2ogLSAxXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzdGVwQWZ0ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlOiB0aGlzLnhWYWxbal0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcDogdGhpcy54TnVtU3RlcHNbal0sXHJcbiAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFN0ZXA6IHRoaXMueEhpZ2hlc3RDb21wbGV0ZVN0ZXBbal0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgU3BlY3RydW0ucHJvdG90eXBlLmNvdW50U3RlcERlY2ltYWxzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgc3RlcERlY2ltYWxzID0gdGhpcy54TnVtU3RlcHMubWFwKGNvdW50RGVjaW1hbHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgc3RlcERlY2ltYWxzKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFNwZWN0cnVtLnByb3RvdHlwZS5oYXNOb1NpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnhWYWxbMF0gPT09IHRoaXMueFZhbFt0aGlzLnhWYWwubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBPdXRzaWRlIHRlc3RpbmdcclxuICAgICAgICBTcGVjdHJ1bS5wcm90b3R5cGUuY29udmVydCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRTdGVwKHRoaXMudG9TdGVwcGluZyh2YWx1ZSkpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgU3BlY3RydW0ucHJvdG90eXBlLmhhbmRsZUVudHJ5UG9pbnQgPSBmdW5jdGlvbiAoaW5kZXgsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBwZXJjZW50YWdlO1xyXG4gICAgICAgICAgICAvLyBDb3ZlcnQgbWluL21heCBzeW50YXggdG8gMCBhbmQgMTAwLlxyXG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IFwibWluXCIpIHtcclxuICAgICAgICAgICAgICAgIHBlcmNlbnRhZ2UgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4ID09PSBcIm1heFwiKSB7XHJcbiAgICAgICAgICAgICAgICBwZXJjZW50YWdlID0gMTAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZSA9IHBhcnNlRmxvYXQoaW5kZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBjb3JyZWN0IGlucHV0LlxyXG4gICAgICAgICAgICBpZiAoIWlzTnVtZXJpYyhwZXJjZW50YWdlKSB8fCAhaXNOdW1lcmljKHZhbHVlWzBdKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ3JhbmdlJyB2YWx1ZSBpc24ndCBudW1lcmljLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTdG9yZSB2YWx1ZXMuXHJcbiAgICAgICAgICAgIHRoaXMueFBjdC5wdXNoKHBlcmNlbnRhZ2UpO1xyXG4gICAgICAgICAgICB0aGlzLnhWYWwucHVzaCh2YWx1ZVswXSk7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZTEgPSBOdW1iZXIodmFsdWVbMV0pO1xyXG4gICAgICAgICAgICAvLyBOYU4gd2lsbCBldmFsdWF0ZSB0byBmYWxzZSB0b28sIGJ1dCB0byBrZWVwXHJcbiAgICAgICAgICAgIC8vIGxvZ2dpbmcgY2xlYXIsIHNldCBzdGVwIGV4cGxpY2l0bHkuIE1ha2Ugc3VyZVxyXG4gICAgICAgICAgICAvLyBub3QgdG8gb3ZlcnJpZGUgdGhlICdzdGVwJyBzZXR0aW5nIHdpdGggZmFsc2UuXHJcbiAgICAgICAgICAgIGlmICghcGVyY2VudGFnZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpc05hTih2YWx1ZTEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy54U3RlcHNbMF0gPSB2YWx1ZTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnhTdGVwcy5wdXNoKGlzTmFOKHZhbHVlMSkgPyBmYWxzZSA6IHZhbHVlMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy54SGlnaGVzdENvbXBsZXRlU3RlcC5wdXNoKDApO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgU3BlY3RydW0ucHJvdG90eXBlLmhhbmRsZVN0ZXBQb2ludCA9IGZ1bmN0aW9uIChpLCBuKSB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZSAnZmFsc2UnIHN0ZXBwaW5nLlxyXG4gICAgICAgICAgICBpZiAoIW4pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTdGVwIG92ZXIgemVyby1sZW5ndGggcmFuZ2VzICgjOTQ4KTtcclxuICAgICAgICAgICAgaWYgKHRoaXMueFZhbFtpXSA9PT0gdGhpcy54VmFsW2kgKyAxXSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy54U3RlcHNbaV0gPSB0aGlzLnhIaWdoZXN0Q29tcGxldGVTdGVwW2ldID0gdGhpcy54VmFsW2ldO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEZhY3RvciB0byByYW5nZSByYXRpb1xyXG4gICAgICAgICAgICB0aGlzLnhTdGVwc1tpXSA9XHJcbiAgICAgICAgICAgICAgICBmcm9tUGVyY2VudGFnZShbdGhpcy54VmFsW2ldLCB0aGlzLnhWYWxbaSArIDFdXSwgbiwgMCkgLyBzdWJSYW5nZVJhdGlvKHRoaXMueFBjdFtpXSwgdGhpcy54UGN0W2kgKyAxXSk7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbFN0ZXBzID0gKHRoaXMueFZhbFtpICsgMV0gLSB0aGlzLnhWYWxbaV0pIC8gdGhpcy54TnVtU3RlcHNbaV07XHJcbiAgICAgICAgICAgIHZhciBoaWdoZXN0U3RlcCA9IE1hdGguY2VpbChOdW1iZXIodG90YWxTdGVwcy50b0ZpeGVkKDMpKSAtIDEpO1xyXG4gICAgICAgICAgICB2YXIgc3RlcCA9IHRoaXMueFZhbFtpXSArIHRoaXMueE51bVN0ZXBzW2ldICogaGlnaGVzdFN0ZXA7XHJcbiAgICAgICAgICAgIHRoaXMueEhpZ2hlc3RDb21wbGV0ZVN0ZXBbaV0gPSBzdGVwO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIFNwZWN0cnVtO1xyXG4gICAgfSgpKTtcclxuICAgIC8vZW5kcmVnaW9uXHJcbiAgICAvL3JlZ2lvbiBPcHRpb25zXHJcbiAgICAvKlx0RXZlcnkgaW5wdXQgb3B0aW9uIGlzIHRlc3RlZCBhbmQgcGFyc2VkLiBUaGlzIHdpbGwgcHJldmVudFxyXG4gICAgICAgIGVuZGxlc3MgdmFsaWRhdGlvbiBpbiBpbnRlcm5hbCBtZXRob2RzLiBUaGVzZSB0ZXN0cyBhcmVcclxuICAgICAgICBzdHJ1Y3R1cmVkIHdpdGggYW4gaXRlbSBmb3IgZXZlcnkgb3B0aW9uIGF2YWlsYWJsZS4gQW5cclxuICAgICAgICBvcHRpb24gY2FuIGJlIG1hcmtlZCBhcyByZXF1aXJlZCBieSBzZXR0aW5nIHRoZSAncicgZmxhZy5cclxuICAgICAgICBUaGUgdGVzdGluZyBmdW5jdGlvbiBpcyBwcm92aWRlZCB3aXRoIHRocmVlIGFyZ3VtZW50czpcclxuICAgICAgICAgICAgLSBUaGUgcHJvdmlkZWQgdmFsdWUgZm9yIHRoZSBvcHRpb247XHJcbiAgICAgICAgICAgIC0gQSByZWZlcmVuY2UgdG8gdGhlIG9wdGlvbnMgb2JqZWN0O1xyXG4gICAgICAgICAgICAtIFRoZSBuYW1lIGZvciB0aGUgb3B0aW9uO1xyXG5cclxuICAgICAgICBUaGUgdGVzdGluZyBmdW5jdGlvbiByZXR1cm5zIGZhbHNlIHdoZW4gYW4gZXJyb3IgaXMgZGV0ZWN0ZWQsXHJcbiAgICAgICAgb3IgdHJ1ZSB3aGVuIGV2ZXJ5dGhpbmcgaXMgT0suIEl0IGNhbiBhbHNvIG1vZGlmeSB0aGUgb3B0aW9uXHJcbiAgICAgICAgb2JqZWN0LCB0byBtYWtlIHN1cmUgYWxsIHZhbHVlcyBjYW4gYmUgY29ycmVjdGx5IGxvb3BlZCBlbHNld2hlcmUuICovXHJcbiAgICAvL3JlZ2lvbiBEZWZhdWx0c1xyXG4gICAgdmFyIGRlZmF1bHRGb3JtYXR0ZXIgPSB7XHJcbiAgICAgICAgdG86IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCA/IFwiXCIgOiB2YWx1ZS50b0ZpeGVkKDIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZnJvbTogTnVtYmVyLFxyXG4gICAgfTtcclxuICAgIHZhciBjc3NDbGFzc2VzID0ge1xyXG4gICAgICAgIHRhcmdldDogXCJ0YXJnZXRcIixcclxuICAgICAgICBiYXNlOiBcImJhc2VcIixcclxuICAgICAgICBvcmlnaW46IFwib3JpZ2luXCIsXHJcbiAgICAgICAgaGFuZGxlOiBcImhhbmRsZVwiLFxyXG4gICAgICAgIGhhbmRsZUxvd2VyOiBcImhhbmRsZS1sb3dlclwiLFxyXG4gICAgICAgIGhhbmRsZVVwcGVyOiBcImhhbmRsZS11cHBlclwiLFxyXG4gICAgICAgIHRvdWNoQXJlYTogXCJ0b3VjaC1hcmVhXCIsXHJcbiAgICAgICAgaG9yaXpvbnRhbDogXCJob3Jpem9udGFsXCIsXHJcbiAgICAgICAgdmVydGljYWw6IFwidmVydGljYWxcIixcclxuICAgICAgICBiYWNrZ3JvdW5kOiBcImJhY2tncm91bmRcIixcclxuICAgICAgICBjb25uZWN0OiBcImNvbm5lY3RcIixcclxuICAgICAgICBjb25uZWN0czogXCJjb25uZWN0c1wiLFxyXG4gICAgICAgIGx0cjogXCJsdHJcIixcclxuICAgICAgICBydGw6IFwicnRsXCIsXHJcbiAgICAgICAgdGV4dERpcmVjdGlvbkx0cjogXCJ0eHQtZGlyLWx0clwiLFxyXG4gICAgICAgIHRleHREaXJlY3Rpb25SdGw6IFwidHh0LWRpci1ydGxcIixcclxuICAgICAgICBkcmFnZ2FibGU6IFwiZHJhZ2dhYmxlXCIsXHJcbiAgICAgICAgZHJhZzogXCJzdGF0ZS1kcmFnXCIsXHJcbiAgICAgICAgdGFwOiBcInN0YXRlLXRhcFwiLFxyXG4gICAgICAgIGFjdGl2ZTogXCJhY3RpdmVcIixcclxuICAgICAgICB0b29sdGlwOiBcInRvb2x0aXBcIixcclxuICAgICAgICBwaXBzOiBcInBpcHNcIixcclxuICAgICAgICBwaXBzSG9yaXpvbnRhbDogXCJwaXBzLWhvcml6b250YWxcIixcclxuICAgICAgICBwaXBzVmVydGljYWw6IFwicGlwcy12ZXJ0aWNhbFwiLFxyXG4gICAgICAgIG1hcmtlcjogXCJtYXJrZXJcIixcclxuICAgICAgICBtYXJrZXJIb3Jpem9udGFsOiBcIm1hcmtlci1ob3Jpem9udGFsXCIsXHJcbiAgICAgICAgbWFya2VyVmVydGljYWw6IFwibWFya2VyLXZlcnRpY2FsXCIsXHJcbiAgICAgICAgbWFya2VyTm9ybWFsOiBcIm1hcmtlci1ub3JtYWxcIixcclxuICAgICAgICBtYXJrZXJMYXJnZTogXCJtYXJrZXItbGFyZ2VcIixcclxuICAgICAgICBtYXJrZXJTdWI6IFwibWFya2VyLXN1YlwiLFxyXG4gICAgICAgIHZhbHVlOiBcInZhbHVlXCIsXHJcbiAgICAgICAgdmFsdWVIb3Jpem9udGFsOiBcInZhbHVlLWhvcml6b250YWxcIixcclxuICAgICAgICB2YWx1ZVZlcnRpY2FsOiBcInZhbHVlLXZlcnRpY2FsXCIsXHJcbiAgICAgICAgdmFsdWVOb3JtYWw6IFwidmFsdWUtbm9ybWFsXCIsXHJcbiAgICAgICAgdmFsdWVMYXJnZTogXCJ2YWx1ZS1sYXJnZVwiLFxyXG4gICAgICAgIHZhbHVlU3ViOiBcInZhbHVlLXN1YlwiLFxyXG4gICAgfTtcclxuICAgIC8vIE5hbWVzcGFjZXMgb2YgaW50ZXJuYWwgZXZlbnQgbGlzdGVuZXJzXHJcbiAgICB2YXIgSU5URVJOQUxfRVZFTlRfTlMgPSB7XHJcbiAgICAgICAgdG9vbHRpcHM6IFwiLl9fdG9vbHRpcHNcIixcclxuICAgICAgICBhcmlhOiBcIi5fX2FyaWFcIixcclxuICAgIH07XHJcbiAgICAvL2VuZHJlZ2lvblxyXG4gICAgZnVuY3Rpb24gdGVzdFN0ZXAocGFyc2VkLCBlbnRyeSkge1xyXG4gICAgICAgIGlmICghaXNOdW1lcmljKGVudHJ5KSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub1VpU2xpZGVyOiAnc3RlcCcgaXMgbm90IG51bWVyaWMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUaGUgc3RlcCBvcHRpb24gY2FuIHN0aWxsIGJlIHVzZWQgdG8gc2V0IHN0ZXBwaW5nXHJcbiAgICAgICAgLy8gZm9yIGxpbmVhciBzbGlkZXJzLiBPdmVyd3JpdHRlbiBpZiBzZXQgaW4gJ3JhbmdlJy5cclxuICAgICAgICBwYXJzZWQuc2luZ2xlU3RlcCA9IGVudHJ5O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdGVzdEtleWJvYXJkUGFnZU11bHRpcGxpZXIocGFyc2VkLCBlbnRyeSkge1xyXG4gICAgICAgIGlmICghaXNOdW1lcmljKGVudHJ5KSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub1VpU2xpZGVyOiAna2V5Ym9hcmRQYWdlTXVsdGlwbGllcicgaXMgbm90IG51bWVyaWMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwYXJzZWQua2V5Ym9hcmRQYWdlTXVsdGlwbGllciA9IGVudHJ5O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdGVzdEtleWJvYXJkTXVsdGlwbGllcihwYXJzZWQsIGVudHJ5KSB7XHJcbiAgICAgICAgaWYgKCFpc051bWVyaWMoZW50cnkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdrZXlib2FyZE11bHRpcGxpZXInIGlzIG5vdCBudW1lcmljLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcGFyc2VkLmtleWJvYXJkTXVsdGlwbGllciA9IGVudHJ5O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdGVzdEtleWJvYXJkRGVmYXVsdFN0ZXAocGFyc2VkLCBlbnRyeSkge1xyXG4gICAgICAgIGlmICghaXNOdW1lcmljKGVudHJ5KSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub1VpU2xpZGVyOiAna2V5Ym9hcmREZWZhdWx0U3RlcCcgaXMgbm90IG51bWVyaWMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwYXJzZWQua2V5Ym9hcmREZWZhdWx0U3RlcCA9IGVudHJ5O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdGVzdFJhbmdlKHBhcnNlZCwgZW50cnkpIHtcclxuICAgICAgICAvLyBGaWx0ZXIgaW5jb3JyZWN0IGlucHV0LlxyXG4gICAgICAgIGlmICh0eXBlb2YgZW50cnkgIT09IFwib2JqZWN0XCIgfHwgQXJyYXkuaXNBcnJheShlbnRyeSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ3JhbmdlJyBpcyBub3QgYW4gb2JqZWN0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQ2F0Y2ggbWlzc2luZyBzdGFydCBvciBlbmQuXHJcbiAgICAgICAgaWYgKGVudHJ5Lm1pbiA9PT0gdW5kZWZpbmVkIHx8IGVudHJ5Lm1heCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6IE1pc3NpbmcgJ21pbicgb3IgJ21heCcgaW4gJ3JhbmdlJy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBhcnNlZC5zcGVjdHJ1bSA9IG5ldyBTcGVjdHJ1bShlbnRyeSwgcGFyc2VkLnNuYXAgfHwgZmFsc2UsIHBhcnNlZC5zaW5nbGVTdGVwKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHRlc3RTdGFydChwYXJzZWQsIGVudHJ5KSB7XHJcbiAgICAgICAgZW50cnkgPSBhc0FycmF5KGVudHJ5KTtcclxuICAgICAgICAvLyBWYWxpZGF0ZSBpbnB1dC4gVmFsdWVzIGFyZW4ndCB0ZXN0ZWQsIGFzIHRoZSBwdWJsaWMgLnZhbCBtZXRob2RcclxuICAgICAgICAvLyB3aWxsIGFsd2F5cyBwcm92aWRlIGEgdmFsaWQgbG9jYXRpb24uXHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGVudHJ5KSB8fCAhZW50cnkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdzdGFydCcgb3B0aW9uIGlzIGluY29ycmVjdC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFN0b3JlIHRoZSBudW1iZXIgb2YgaGFuZGxlcy5cclxuICAgICAgICBwYXJzZWQuaGFuZGxlcyA9IGVudHJ5Lmxlbmd0aDtcclxuICAgICAgICAvLyBXaGVuIHRoZSBzbGlkZXIgaXMgaW5pdGlhbGl6ZWQsIHRoZSAudmFsIG1ldGhvZCB3aWxsXHJcbiAgICAgICAgLy8gYmUgY2FsbGVkIHdpdGggdGhlIHN0YXJ0IG9wdGlvbnMuXHJcbiAgICAgICAgcGFyc2VkLnN0YXJ0ID0gZW50cnk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB0ZXN0U25hcChwYXJzZWQsIGVudHJ5KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ3NuYXAnIG9wdGlvbiBtdXN0IGJlIGEgYm9vbGVhbi5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEVuZm9yY2UgMTAwJSBzdGVwcGluZyB3aXRoaW4gc3VicmFuZ2VzLlxyXG4gICAgICAgIHBhcnNlZC5zbmFwID0gZW50cnk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB0ZXN0QW5pbWF0ZShwYXJzZWQsIGVudHJ5KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ2FuaW1hdGUnIG9wdGlvbiBtdXN0IGJlIGEgYm9vbGVhbi5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEVuZm9yY2UgMTAwJSBzdGVwcGluZyB3aXRoaW4gc3VicmFuZ2VzLlxyXG4gICAgICAgIHBhcnNlZC5hbmltYXRlID0gZW50cnk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB0ZXN0QW5pbWF0aW9uRHVyYXRpb24ocGFyc2VkLCBlbnRyeSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZW50cnkgIT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ2FuaW1hdGlvbkR1cmF0aW9uJyBvcHRpb24gbXVzdCBiZSBhIG51bWJlci5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBhcnNlZC5hbmltYXRpb25EdXJhdGlvbiA9IGVudHJ5O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdGVzdENvbm5lY3QocGFyc2VkLCBlbnRyeSkge1xyXG4gICAgICAgIHZhciBjb25uZWN0ID0gW2ZhbHNlXTtcclxuICAgICAgICB2YXIgaTtcclxuICAgICAgICAvLyBNYXAgbGVnYWN5IG9wdGlvbnNcclxuICAgICAgICBpZiAoZW50cnkgPT09IFwibG93ZXJcIikge1xyXG4gICAgICAgICAgICBlbnRyeSA9IFt0cnVlLCBmYWxzZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGVudHJ5ID09PSBcInVwcGVyXCIpIHtcclxuICAgICAgICAgICAgZW50cnkgPSBbZmFsc2UsIHRydWVdO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBIYW5kbGUgYm9vbGVhbiBvcHRpb25zXHJcbiAgICAgICAgaWYgKGVudHJ5ID09PSB0cnVlIHx8IGVudHJ5ID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDwgcGFyc2VkLmhhbmRsZXM7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29ubmVjdC5wdXNoKGVudHJ5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25uZWN0LnB1c2goZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBSZWplY3QgaW52YWxpZCBpbnB1dFxyXG4gICAgICAgIGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KGVudHJ5KSB8fCAhZW50cnkubGVuZ3RoIHx8IGVudHJ5Lmxlbmd0aCAhPT0gcGFyc2VkLmhhbmRsZXMgKyAxKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdjb25uZWN0JyBvcHRpb24gZG9lc24ndCBtYXRjaCBoYW5kbGUgY291bnQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29ubmVjdCA9IGVudHJ5O1xyXG4gICAgICAgIH1cclxuICAgICAgICBwYXJzZWQuY29ubmVjdCA9IGNvbm5lY3Q7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB0ZXN0T3JpZW50YXRpb24ocGFyc2VkLCBlbnRyeSkge1xyXG4gICAgICAgIC8vIFNldCBvcmllbnRhdGlvbiB0byBhbiBhIG51bWVyaWNhbCB2YWx1ZSBmb3IgZWFzeVxyXG4gICAgICAgIC8vIGFycmF5IHNlbGVjdGlvbi5cclxuICAgICAgICBzd2l0Y2ggKGVudHJ5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJob3Jpem9udGFsXCI6XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQub3J0ID0gMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwidmVydGljYWxcIjpcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5vcnQgPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub1VpU2xpZGVyOiAnb3JpZW50YXRpb24nIG9wdGlvbiBpcyBpbnZhbGlkLlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB0ZXN0TWFyZ2luKHBhcnNlZCwgZW50cnkpIHtcclxuICAgICAgICBpZiAoIWlzTnVtZXJpYyhlbnRyeSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ21hcmdpbicgb3B0aW9uIG11c3QgYmUgbnVtZXJpYy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIElzc3VlICM1ODJcclxuICAgICAgICBpZiAoZW50cnkgPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwYXJzZWQubWFyZ2luID0gcGFyc2VkLnNwZWN0cnVtLmdldERpc3RhbmNlKGVudHJ5KTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHRlc3RMaW1pdChwYXJzZWQsIGVudHJ5KSB7XHJcbiAgICAgICAgaWYgKCFpc051bWVyaWMoZW50cnkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdsaW1pdCcgb3B0aW9uIG11c3QgYmUgbnVtZXJpYy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBhcnNlZC5saW1pdCA9IHBhcnNlZC5zcGVjdHJ1bS5nZXREaXN0YW5jZShlbnRyeSk7XHJcbiAgICAgICAgaWYgKCFwYXJzZWQubGltaXQgfHwgcGFyc2VkLmhhbmRsZXMgPCAyKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdsaW1pdCcgb3B0aW9uIGlzIG9ubHkgc3VwcG9ydGVkIG9uIGxpbmVhciBzbGlkZXJzIHdpdGggMiBvciBtb3JlIGhhbmRsZXMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHRlc3RQYWRkaW5nKHBhcnNlZCwgZW50cnkpIHtcclxuICAgICAgICB2YXIgaW5kZXg7XHJcbiAgICAgICAgaWYgKCFpc051bWVyaWMoZW50cnkpICYmICFBcnJheS5pc0FycmF5KGVudHJ5KSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub1VpU2xpZGVyOiAncGFkZGluZycgb3B0aW9uIG11c3QgYmUgbnVtZXJpYyBvciBhcnJheSBvZiBleGFjdGx5IDIgbnVtYmVycy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVudHJ5KSAmJiAhKGVudHJ5Lmxlbmd0aCA9PT0gMiB8fCBpc051bWVyaWMoZW50cnlbMF0pIHx8IGlzTnVtZXJpYyhlbnRyeVsxXSkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdwYWRkaW5nJyBvcHRpb24gbXVzdCBiZSBudW1lcmljIG9yIGFycmF5IG9mIGV4YWN0bHkgMiBudW1iZXJzLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGVudHJ5ID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGVudHJ5KSkge1xyXG4gICAgICAgICAgICBlbnRyeSA9IFtlbnRyeSwgZW50cnldO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyAnZ2V0RGlzdGFuY2UnIHJldHVybnMgZmFsc2UgZm9yIGludmFsaWQgdmFsdWVzLlxyXG4gICAgICAgIHBhcnNlZC5wYWRkaW5nID0gW3BhcnNlZC5zcGVjdHJ1bS5nZXREaXN0YW5jZShlbnRyeVswXSksIHBhcnNlZC5zcGVjdHJ1bS5nZXREaXN0YW5jZShlbnRyeVsxXSldO1xyXG4gICAgICAgIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IHBhcnNlZC5zcGVjdHJ1bS54TnVtU3RlcHMubGVuZ3RoIC0gMTsgaW5kZXgrKykge1xyXG4gICAgICAgICAgICAvLyBsYXN0IFwicmFuZ2VcIiBjYW4ndCBjb250YWluIHN0ZXAgc2l6ZSBhcyBpdCBpcyBwdXJlbHkgYW4gZW5kcG9pbnQuXHJcbiAgICAgICAgICAgIGlmIChwYXJzZWQucGFkZGluZ1swXVtpbmRleF0gPCAwIHx8IHBhcnNlZC5wYWRkaW5nWzFdW2luZGV4XSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdwYWRkaW5nJyBvcHRpb24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcihzKS5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRvdGFsUGFkZGluZyA9IGVudHJ5WzBdICsgZW50cnlbMV07XHJcbiAgICAgICAgdmFyIGZpcnN0VmFsdWUgPSBwYXJzZWQuc3BlY3RydW0ueFZhbFswXTtcclxuICAgICAgICB2YXIgbGFzdFZhbHVlID0gcGFyc2VkLnNwZWN0cnVtLnhWYWxbcGFyc2VkLnNwZWN0cnVtLnhWYWwubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgaWYgKHRvdGFsUGFkZGluZyAvIChsYXN0VmFsdWUgLSBmaXJzdFZhbHVlKSA+IDEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ3BhZGRpbmcnIG9wdGlvbiBtdXN0IG5vdCBleGNlZWQgMTAwJSBvZiB0aGUgcmFuZ2UuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHRlc3REaXJlY3Rpb24ocGFyc2VkLCBlbnRyeSkge1xyXG4gICAgICAgIC8vIFNldCBkaXJlY3Rpb24gYXMgYSBudW1lcmljYWwgdmFsdWUgZm9yIGVhc3kgcGFyc2luZy5cclxuICAgICAgICAvLyBJbnZlcnQgY29ubmVjdGlvbiBmb3IgUlRMIHNsaWRlcnMsIHNvIHRoYXQgdGhlIHByb3BlclxyXG4gICAgICAgIC8vIGhhbmRsZXMgZ2V0IHRoZSBjb25uZWN0L2JhY2tncm91bmQgY2xhc3Nlcy5cclxuICAgICAgICBzd2l0Y2ggKGVudHJ5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJsdHJcIjpcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5kaXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJydGxcIjpcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5kaXIgPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub1VpU2xpZGVyOiAnZGlyZWN0aW9uJyBvcHRpb24gd2FzIG5vdCByZWNvZ25pemVkLlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB0ZXN0QmVoYXZpb3VyKHBhcnNlZCwgZW50cnkpIHtcclxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGlucHV0IGlzIGEgc3RyaW5nLlxyXG4gICAgICAgIGlmICh0eXBlb2YgZW50cnkgIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ2JlaGF2aW91cicgbXVzdCBiZSBhIHN0cmluZyBjb250YWluaW5nIG9wdGlvbnMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgc3RyaW5nIGNvbnRhaW5zIGFueSBrZXl3b3Jkcy5cclxuICAgICAgICAvLyBOb25lIGFyZSByZXF1aXJlZC5cclxuICAgICAgICB2YXIgdGFwID0gZW50cnkuaW5kZXhPZihcInRhcFwiKSA+PSAwO1xyXG4gICAgICAgIHZhciBkcmFnID0gZW50cnkuaW5kZXhPZihcImRyYWdcIikgPj0gMDtcclxuICAgICAgICB2YXIgZml4ZWQgPSBlbnRyeS5pbmRleE9mKFwiZml4ZWRcIikgPj0gMDtcclxuICAgICAgICB2YXIgc25hcCA9IGVudHJ5LmluZGV4T2YoXCJzbmFwXCIpID49IDA7XHJcbiAgICAgICAgdmFyIGhvdmVyID0gZW50cnkuaW5kZXhPZihcImhvdmVyXCIpID49IDA7XHJcbiAgICAgICAgdmFyIHVuY29uc3RyYWluZWQgPSBlbnRyeS5pbmRleE9mKFwidW5jb25zdHJhaW5lZFwiKSA+PSAwO1xyXG4gICAgICAgIHZhciBkcmFnQWxsID0gZW50cnkuaW5kZXhPZihcImRyYWctYWxsXCIpID49IDA7XHJcbiAgICAgICAgdmFyIHNtb290aFN0ZXBzID0gZW50cnkuaW5kZXhPZihcInNtb290aC1zdGVwc1wiKSA+PSAwO1xyXG4gICAgICAgIGlmIChmaXhlZCkge1xyXG4gICAgICAgICAgICBpZiAocGFyc2VkLmhhbmRsZXMgIT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdmaXhlZCcgYmVoYXZpb3VyIG11c3QgYmUgdXNlZCB3aXRoIDIgaGFuZGxlc1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBVc2UgbWFyZ2luIHRvIGVuZm9yY2UgZml4ZWQgc3RhdGVcclxuICAgICAgICAgICAgdGVzdE1hcmdpbihwYXJzZWQsIHBhcnNlZC5zdGFydFsxXSAtIHBhcnNlZC5zdGFydFswXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh1bmNvbnN0cmFpbmVkICYmIChwYXJzZWQubWFyZ2luIHx8IHBhcnNlZC5saW1pdCkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ3VuY29uc3RyYWluZWQnIGJlaGF2aW91ciBjYW5ub3QgYmUgdXNlZCB3aXRoIG1hcmdpbiBvciBsaW1pdFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcGFyc2VkLmV2ZW50cyA9IHtcclxuICAgICAgICAgICAgdGFwOiB0YXAgfHwgc25hcCxcclxuICAgICAgICAgICAgZHJhZzogZHJhZyxcclxuICAgICAgICAgICAgZHJhZ0FsbDogZHJhZ0FsbCxcclxuICAgICAgICAgICAgc21vb3RoU3RlcHM6IHNtb290aFN0ZXBzLFxyXG4gICAgICAgICAgICBmaXhlZDogZml4ZWQsXHJcbiAgICAgICAgICAgIHNuYXA6IHNuYXAsXHJcbiAgICAgICAgICAgIGhvdmVyOiBob3ZlcixcclxuICAgICAgICAgICAgdW5jb25zdHJhaW5lZDogdW5jb25zdHJhaW5lZCxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdGVzdFRvb2x0aXBzKHBhcnNlZCwgZW50cnkpIHtcclxuICAgICAgICBpZiAoZW50cnkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGVudHJ5ID09PSB0cnVlIHx8IGlzVmFsaWRQYXJ0aWFsRm9ybWF0dGVyKGVudHJ5KSkge1xyXG4gICAgICAgICAgICBwYXJzZWQudG9vbHRpcHMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJzZWQuaGFuZGxlczsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQudG9vbHRpcHMucHVzaChlbnRyeSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGVudHJ5ID0gYXNBcnJheShlbnRyeSk7XHJcbiAgICAgICAgICAgIGlmIChlbnRyeS5sZW5ndGggIT09IHBhcnNlZC5oYW5kbGVzKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub1VpU2xpZGVyOiBtdXN0IHBhc3MgYSBmb3JtYXR0ZXIgZm9yIGFsbCBoYW5kbGVzLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbnRyeS5mb3JFYWNoKGZ1bmN0aW9uIChmb3JtYXR0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZm9ybWF0dGVyICE9PSBcImJvb2xlYW5cIiAmJiAhaXNWYWxpZFBhcnRpYWxGb3JtYXR0ZXIoZm9ybWF0dGVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICd0b29sdGlwcycgbXVzdCBiZSBwYXNzZWQgYSBmb3JtYXR0ZXIgb3IgJ2ZhbHNlJy5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBwYXJzZWQudG9vbHRpcHMgPSBlbnRyeTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB0ZXN0SGFuZGxlQXR0cmlidXRlcyhwYXJzZWQsIGVudHJ5KSB7XHJcbiAgICAgICAgaWYgKGVudHJ5Lmxlbmd0aCAhPT0gcGFyc2VkLmhhbmRsZXMpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogbXVzdCBwYXNzIGEgYXR0cmlidXRlcyBmb3IgYWxsIGhhbmRsZXMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwYXJzZWQuaGFuZGxlQXR0cmlidXRlcyA9IGVudHJ5O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdGVzdEFyaWFGb3JtYXQocGFyc2VkLCBlbnRyeSkge1xyXG4gICAgICAgIGlmICghaXNWYWxpZFBhcnRpYWxGb3JtYXR0ZXIoZW50cnkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdhcmlhRm9ybWF0JyByZXF1aXJlcyAndG8nIG1ldGhvZC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBhcnNlZC5hcmlhRm9ybWF0ID0gZW50cnk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB0ZXN0Rm9ybWF0KHBhcnNlZCwgZW50cnkpIHtcclxuICAgICAgICBpZiAoIWlzVmFsaWRGb3JtYXR0ZXIoZW50cnkpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdmb3JtYXQnIHJlcXVpcmVzICd0bycgYW5kICdmcm9tJyBtZXRob2RzLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcGFyc2VkLmZvcm1hdCA9IGVudHJ5O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdGVzdEtleWJvYXJkU3VwcG9ydChwYXJzZWQsIGVudHJ5KSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gXCJib29sZWFuXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogJ2tleWJvYXJkU3VwcG9ydCcgb3B0aW9uIG11c3QgYmUgYSBib29sZWFuLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcGFyc2VkLmtleWJvYXJkU3VwcG9ydCA9IGVudHJ5O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdGVzdERvY3VtZW50RWxlbWVudChwYXJzZWQsIGVudHJ5KSB7XHJcbiAgICAgICAgLy8gVGhpcyBpcyBhbiBhZHZhbmNlZCBvcHRpb24uIFBhc3NlZCB2YWx1ZXMgYXJlIHVzZWQgd2l0aG91dCB2YWxpZGF0aW9uLlxyXG4gICAgICAgIHBhcnNlZC5kb2N1bWVudEVsZW1lbnQgPSBlbnRyeTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHRlc3RDc3NQcmVmaXgocGFyc2VkLCBlbnRyeSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZW50cnkgIT09IFwic3RyaW5nXCIgJiYgZW50cnkgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdjc3NQcmVmaXgnIG11c3QgYmUgYSBzdHJpbmcgb3IgYGZhbHNlYC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBhcnNlZC5jc3NQcmVmaXggPSBlbnRyeTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHRlc3RDc3NDbGFzc2VzKHBhcnNlZCwgZW50cnkpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdjc3NDbGFzc2VzJyBtdXN0IGJlIGFuIG9iamVjdC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgcGFyc2VkLmNzc1ByZWZpeCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICBwYXJzZWQuY3NzQ2xhc3NlcyA9IHt9O1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhlbnRyeSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuY3NzQ2xhc3Nlc1trZXldID0gcGFyc2VkLmNzc1ByZWZpeCArIGVudHJ5W2tleV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcGFyc2VkLmNzc0NsYXNzZXMgPSBlbnRyeTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBUZXN0IGFsbCBkZXZlbG9wZXIgc2V0dGluZ3MgYW5kIHBhcnNlIHRvIGFzc3VtcHRpb24tc2FmZSB2YWx1ZXMuXHJcbiAgICBmdW5jdGlvbiB0ZXN0T3B0aW9ucyhvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gVG8gcHJvdmUgYSBmaXggZm9yICM1MzcsIGZyZWV6ZSBvcHRpb25zIGhlcmUuXHJcbiAgICAgICAgLy8gSWYgdGhlIG9iamVjdCBpcyBtb2RpZmllZCwgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXHJcbiAgICAgICAgLy8gT2JqZWN0LmZyZWV6ZShvcHRpb25zKTtcclxuICAgICAgICB2YXIgcGFyc2VkID0ge1xyXG4gICAgICAgICAgICBtYXJnaW46IG51bGwsXHJcbiAgICAgICAgICAgIGxpbWl0OiBudWxsLFxyXG4gICAgICAgICAgICBwYWRkaW5nOiBudWxsLFxyXG4gICAgICAgICAgICBhbmltYXRlOiB0cnVlLFxyXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogMzAwLFxyXG4gICAgICAgICAgICBhcmlhRm9ybWF0OiBkZWZhdWx0Rm9ybWF0dGVyLFxyXG4gICAgICAgICAgICBmb3JtYXQ6IGRlZmF1bHRGb3JtYXR0ZXIsXHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBUZXN0cyBhcmUgZXhlY3V0ZWQgaW4gdGhlIG9yZGVyIHRoZXkgYXJlIHByZXNlbnRlZCBoZXJlLlxyXG4gICAgICAgIHZhciB0ZXN0cyA9IHtcclxuICAgICAgICAgICAgc3RlcDogeyByOiBmYWxzZSwgdDogdGVzdFN0ZXAgfSxcclxuICAgICAgICAgICAga2V5Ym9hcmRQYWdlTXVsdGlwbGllcjogeyByOiBmYWxzZSwgdDogdGVzdEtleWJvYXJkUGFnZU11bHRpcGxpZXIgfSxcclxuICAgICAgICAgICAga2V5Ym9hcmRNdWx0aXBsaWVyOiB7IHI6IGZhbHNlLCB0OiB0ZXN0S2V5Ym9hcmRNdWx0aXBsaWVyIH0sXHJcbiAgICAgICAgICAgIGtleWJvYXJkRGVmYXVsdFN0ZXA6IHsgcjogZmFsc2UsIHQ6IHRlc3RLZXlib2FyZERlZmF1bHRTdGVwIH0sXHJcbiAgICAgICAgICAgIHN0YXJ0OiB7IHI6IHRydWUsIHQ6IHRlc3RTdGFydCB9LFxyXG4gICAgICAgICAgICBjb25uZWN0OiB7IHI6IHRydWUsIHQ6IHRlc3RDb25uZWN0IH0sXHJcbiAgICAgICAgICAgIGRpcmVjdGlvbjogeyByOiB0cnVlLCB0OiB0ZXN0RGlyZWN0aW9uIH0sXHJcbiAgICAgICAgICAgIHNuYXA6IHsgcjogZmFsc2UsIHQ6IHRlc3RTbmFwIH0sXHJcbiAgICAgICAgICAgIGFuaW1hdGU6IHsgcjogZmFsc2UsIHQ6IHRlc3RBbmltYXRlIH0sXHJcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiB7IHI6IGZhbHNlLCB0OiB0ZXN0QW5pbWF0aW9uRHVyYXRpb24gfSxcclxuICAgICAgICAgICAgcmFuZ2U6IHsgcjogdHJ1ZSwgdDogdGVzdFJhbmdlIH0sXHJcbiAgICAgICAgICAgIG9yaWVudGF0aW9uOiB7IHI6IGZhbHNlLCB0OiB0ZXN0T3JpZW50YXRpb24gfSxcclxuICAgICAgICAgICAgbWFyZ2luOiB7IHI6IGZhbHNlLCB0OiB0ZXN0TWFyZ2luIH0sXHJcbiAgICAgICAgICAgIGxpbWl0OiB7IHI6IGZhbHNlLCB0OiB0ZXN0TGltaXQgfSxcclxuICAgICAgICAgICAgcGFkZGluZzogeyByOiBmYWxzZSwgdDogdGVzdFBhZGRpbmcgfSxcclxuICAgICAgICAgICAgYmVoYXZpb3VyOiB7IHI6IHRydWUsIHQ6IHRlc3RCZWhhdmlvdXIgfSxcclxuICAgICAgICAgICAgYXJpYUZvcm1hdDogeyByOiBmYWxzZSwgdDogdGVzdEFyaWFGb3JtYXQgfSxcclxuICAgICAgICAgICAgZm9ybWF0OiB7IHI6IGZhbHNlLCB0OiB0ZXN0Rm9ybWF0IH0sXHJcbiAgICAgICAgICAgIHRvb2x0aXBzOiB7IHI6IGZhbHNlLCB0OiB0ZXN0VG9vbHRpcHMgfSxcclxuICAgICAgICAgICAga2V5Ym9hcmRTdXBwb3J0OiB7IHI6IHRydWUsIHQ6IHRlc3RLZXlib2FyZFN1cHBvcnQgfSxcclxuICAgICAgICAgICAgZG9jdW1lbnRFbGVtZW50OiB7IHI6IGZhbHNlLCB0OiB0ZXN0RG9jdW1lbnRFbGVtZW50IH0sXHJcbiAgICAgICAgICAgIGNzc1ByZWZpeDogeyByOiB0cnVlLCB0OiB0ZXN0Q3NzUHJlZml4IH0sXHJcbiAgICAgICAgICAgIGNzc0NsYXNzZXM6IHsgcjogdHJ1ZSwgdDogdGVzdENzc0NsYXNzZXMgfSxcclxuICAgICAgICAgICAgaGFuZGxlQXR0cmlidXRlczogeyByOiBmYWxzZSwgdDogdGVzdEhhbmRsZUF0dHJpYnV0ZXMgfSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBkZWZhdWx0cyA9IHtcclxuICAgICAgICAgICAgY29ubmVjdDogZmFsc2UsXHJcbiAgICAgICAgICAgIGRpcmVjdGlvbjogXCJsdHJcIixcclxuICAgICAgICAgICAgYmVoYXZpb3VyOiBcInRhcFwiLFxyXG4gICAgICAgICAgICBvcmllbnRhdGlvbjogXCJob3Jpem9udGFsXCIsXHJcbiAgICAgICAgICAgIGtleWJvYXJkU3VwcG9ydDogdHJ1ZSxcclxuICAgICAgICAgICAgY3NzUHJlZml4OiBcIm5vVWktXCIsXHJcbiAgICAgICAgICAgIGNzc0NsYXNzZXM6IGNzc0NsYXNzZXMsXHJcbiAgICAgICAgICAgIGtleWJvYXJkUGFnZU11bHRpcGxpZXI6IDUsXHJcbiAgICAgICAgICAgIGtleWJvYXJkTXVsdGlwbGllcjogMSxcclxuICAgICAgICAgICAga2V5Ym9hcmREZWZhdWx0U3RlcDogMTAsXHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBBcmlhRm9ybWF0IGRlZmF1bHRzIHRvIHJlZ3VsYXIgZm9ybWF0LCBpZiBhbnkuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZm9ybWF0ICYmICFvcHRpb25zLmFyaWFGb3JtYXQpIHtcclxuICAgICAgICAgICAgb3B0aW9ucy5hcmlhRm9ybWF0ID0gb3B0aW9ucy5mb3JtYXQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFJ1biBhbGwgb3B0aW9ucyB0aHJvdWdoIGEgdGVzdGluZyBtZWNoYW5pc20gdG8gZW5zdXJlIGNvcnJlY3RcclxuICAgICAgICAvLyBpbnB1dC4gSXQgc2hvdWxkIGJlIG5vdGVkIHRoYXQgb3B0aW9ucyBtaWdodCBnZXQgbW9kaWZpZWQgdG9cclxuICAgICAgICAvLyBiZSBoYW5kbGVkIHByb3Blcmx5LiBFLmcuIHdyYXBwaW5nIGludGVnZXJzIGluIGFycmF5cy5cclxuICAgICAgICBPYmplY3Qua2V5cyh0ZXN0cykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgICAgICAvLyBJZiB0aGUgb3B0aW9uIGlzbid0IHNldCwgYnV0IGl0IGlzIHJlcXVpcmVkLCB0aHJvdyBhbiBlcnJvci5cclxuICAgICAgICAgICAgaWYgKCFpc1NldChvcHRpb25zW25hbWVdKSAmJiBkZWZhdWx0c1tuYW1lXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGVzdHNbbmFtZV0ucikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICdcIiArIG5hbWUgKyBcIicgaXMgcmVxdWlyZWQuXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRlc3RzW25hbWVdLnQocGFyc2VkLCAhaXNTZXQob3B0aW9uc1tuYW1lXSkgPyBkZWZhdWx0c1tuYW1lXSA6IG9wdGlvbnNbbmFtZV0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIEZvcndhcmQgcGlwcyBvcHRpb25zXHJcbiAgICAgICAgcGFyc2VkLnBpcHMgPSBvcHRpb25zLnBpcHM7XHJcbiAgICAgICAgLy8gQWxsIHJlY2VudCBicm93c2VycyBhY2NlcHQgdW5wcmVmaXhlZCB0cmFuc2Zvcm0uXHJcbiAgICAgICAgLy8gV2UgbmVlZCAtbXMtIGZvciBJRTkgYW5kIC13ZWJraXQtIGZvciBvbGRlciBBbmRyb2lkO1xyXG4gICAgICAgIC8vIEFzc3VtZSB1c2Ugb2YgLXdlYmtpdC0gaWYgdW5wcmVmaXhlZCBhbmQgLW1zLSBhcmUgbm90IHN1cHBvcnRlZC5cclxuICAgICAgICAvLyBodHRwczovL2Nhbml1c2UuY29tLyNmZWF0PXRyYW5zZm9ybXMyZFxyXG4gICAgICAgIHZhciBkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuICAgICAgICB2YXIgbXNQcmVmaXggPSBkLnN0eWxlLm1zVHJhbnNmb3JtICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdmFyIG5vUHJlZml4ID0gZC5zdHlsZS50cmFuc2Zvcm0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICBwYXJzZWQudHJhbnNmb3JtUnVsZSA9IG5vUHJlZml4ID8gXCJ0cmFuc2Zvcm1cIiA6IG1zUHJlZml4ID8gXCJtc1RyYW5zZm9ybVwiIDogXCJ3ZWJraXRUcmFuc2Zvcm1cIjtcclxuICAgICAgICAvLyBQaXBzIGRvbid0IG1vdmUsIHNvIHdlIGNhbiBwbGFjZSB0aGVtIHVzaW5nIGxlZnQvdG9wLlxyXG4gICAgICAgIHZhciBzdHlsZXMgPSBbXHJcbiAgICAgICAgICAgIFtcImxlZnRcIiwgXCJ0b3BcIl0sXHJcbiAgICAgICAgICAgIFtcInJpZ2h0XCIsIFwiYm90dG9tXCJdLFxyXG4gICAgICAgIF07XHJcbiAgICAgICAgcGFyc2VkLnN0eWxlID0gc3R5bGVzW3BhcnNlZC5kaXJdW3BhcnNlZC5vcnRdO1xyXG4gICAgICAgIHJldHVybiBwYXJzZWQ7XHJcbiAgICB9XHJcbiAgICAvL2VuZHJlZ2lvblxyXG4gICAgZnVuY3Rpb24gc2NvcGUodGFyZ2V0LCBvcHRpb25zLCBvcmlnaW5hbE9wdGlvbnMpIHtcclxuICAgICAgICB2YXIgYWN0aW9ucyA9IGdldEFjdGlvbnMoKTtcclxuICAgICAgICB2YXIgc3VwcG9ydHNUb3VjaEFjdGlvbk5vbmUgPSBnZXRTdXBwb3J0c1RvdWNoQWN0aW9uTm9uZSgpO1xyXG4gICAgICAgIHZhciBzdXBwb3J0c1Bhc3NpdmUgPSBzdXBwb3J0c1RvdWNoQWN0aW9uTm9uZSAmJiBnZXRTdXBwb3J0c1Bhc3NpdmUoKTtcclxuICAgICAgICAvLyBBbGwgdmFyaWFibGVzIGxvY2FsIHRvICdzY29wZScgYXJlIHByZWZpeGVkIHdpdGggJ3Njb3BlXydcclxuICAgICAgICAvLyBTbGlkZXIgRE9NIE5vZGVzXHJcbiAgICAgICAgdmFyIHNjb3BlX1RhcmdldCA9IHRhcmdldDtcclxuICAgICAgICB2YXIgc2NvcGVfQmFzZTtcclxuICAgICAgICB2YXIgc2NvcGVfSGFuZGxlcztcclxuICAgICAgICB2YXIgc2NvcGVfQ29ubmVjdHM7XHJcbiAgICAgICAgdmFyIHNjb3BlX1BpcHM7XHJcbiAgICAgICAgdmFyIHNjb3BlX1Rvb2x0aXBzO1xyXG4gICAgICAgIC8vIFNsaWRlciBzdGF0ZSB2YWx1ZXNcclxuICAgICAgICB2YXIgc2NvcGVfU3BlY3RydW0gPSBvcHRpb25zLnNwZWN0cnVtO1xyXG4gICAgICAgIHZhciBzY29wZV9WYWx1ZXMgPSBbXTtcclxuICAgICAgICB2YXIgc2NvcGVfTG9jYXRpb25zID0gW107XHJcbiAgICAgICAgdmFyIHNjb3BlX0hhbmRsZU51bWJlcnMgPSBbXTtcclxuICAgICAgICB2YXIgc2NvcGVfQWN0aXZlSGFuZGxlc0NvdW50ID0gMDtcclxuICAgICAgICB2YXIgc2NvcGVfRXZlbnRzID0ge307XHJcbiAgICAgICAgLy8gRG9jdW1lbnQgTm9kZXNcclxuICAgICAgICB2YXIgc2NvcGVfRG9jdW1lbnQgPSB0YXJnZXQub3duZXJEb2N1bWVudDtcclxuICAgICAgICB2YXIgc2NvcGVfRG9jdW1lbnRFbGVtZW50ID0gb3B0aW9ucy5kb2N1bWVudEVsZW1lbnQgfHwgc2NvcGVfRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgICAgIHZhciBzY29wZV9Cb2R5ID0gc2NvcGVfRG9jdW1lbnQuYm9keTtcclxuICAgICAgICAvLyBGb3IgaG9yaXpvbnRhbCBzbGlkZXJzIGluIHN0YW5kYXJkIGx0ciBkb2N1bWVudHMsXHJcbiAgICAgICAgLy8gbWFrZSAubm9VaS1vcmlnaW4gb3ZlcmZsb3cgdG8gdGhlIGxlZnQgc28gdGhlIGRvY3VtZW50IGRvZXNuJ3Qgc2Nyb2xsLlxyXG4gICAgICAgIHZhciBzY29wZV9EaXJPZmZzZXQgPSBzY29wZV9Eb2N1bWVudC5kaXIgPT09IFwicnRsXCIgfHwgb3B0aW9ucy5vcnQgPT09IDEgPyAwIDogMTAwO1xyXG4gICAgICAgIC8vIENyZWF0ZXMgYSBub2RlLCBhZGRzIGl0IHRvIHRhcmdldCwgcmV0dXJucyB0aGUgbmV3IG5vZGUuXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkTm9kZVRvKGFkZFRhcmdldCwgY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBkaXYgPSBzY29wZV9Eb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRDbGFzcyhkaXYsIGNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYWRkVGFyZ2V0LmFwcGVuZENoaWxkKGRpdik7XHJcbiAgICAgICAgICAgIHJldHVybiBkaXY7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEFwcGVuZCBhIG9yaWdpbiB0byB0aGUgYmFzZVxyXG4gICAgICAgIGZ1bmN0aW9uIGFkZE9yaWdpbihiYXNlLCBoYW5kbGVOdW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIG9yaWdpbiA9IGFkZE5vZGVUbyhiYXNlLCBvcHRpb25zLmNzc0NsYXNzZXMub3JpZ2luKTtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZSA9IGFkZE5vZGVUbyhvcmlnaW4sIG9wdGlvbnMuY3NzQ2xhc3Nlcy5oYW5kbGUpO1xyXG4gICAgICAgICAgICBhZGROb2RlVG8oaGFuZGxlLCBvcHRpb25zLmNzc0NsYXNzZXMudG91Y2hBcmVhKTtcclxuICAgICAgICAgICAgaGFuZGxlLnNldEF0dHJpYnV0ZShcImRhdGEtaGFuZGxlXCIsIFN0cmluZyhoYW5kbGVOdW1iZXIpKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMua2V5Ym9hcmRTdXBwb3J0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0dsb2JhbF9hdHRyaWJ1dGVzL3RhYmluZGV4XHJcbiAgICAgICAgICAgICAgICAvLyAwID0gZm9jdXNhYmxlIGFuZCByZWFjaGFibGVcclxuICAgICAgICAgICAgICAgIGhhbmRsZS5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50S2V5ZG93bihldmVudCwgaGFuZGxlTnVtYmVyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhhbmRsZUF0dHJpYnV0ZXMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHJpYnV0ZXNfMSA9IG9wdGlvbnMuaGFuZGxlQXR0cmlidXRlc1toYW5kbGVOdW1iZXJdO1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoYXR0cmlidXRlc18xKS5mb3JFYWNoKGZ1bmN0aW9uIChhdHRyaWJ1dGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBoYW5kbGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgYXR0cmlidXRlc18xW2F0dHJpYnV0ZV0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaGFuZGxlLnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJzbGlkZXJcIik7XHJcbiAgICAgICAgICAgIGhhbmRsZS5zZXRBdHRyaWJ1dGUoXCJhcmlhLW9yaWVudGF0aW9uXCIsIG9wdGlvbnMub3J0ID8gXCJ2ZXJ0aWNhbFwiIDogXCJob3Jpem9udGFsXCIpO1xyXG4gICAgICAgICAgICBpZiAoaGFuZGxlTnVtYmVyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRDbGFzcyhoYW5kbGUsIG9wdGlvbnMuY3NzQ2xhc3Nlcy5oYW5kbGVMb3dlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoaGFuZGxlTnVtYmVyID09PSBvcHRpb25zLmhhbmRsZXMgLSAxKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRDbGFzcyhoYW5kbGUsIG9wdGlvbnMuY3NzQ2xhc3Nlcy5oYW5kbGVVcHBlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3JpZ2luLmhhbmRsZSA9IGhhbmRsZTtcclxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gSW5zZXJ0IG5vZGVzIGZvciBjb25uZWN0IGVsZW1lbnRzXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkQ29ubmVjdChiYXNlLCBhZGQpIHtcclxuICAgICAgICAgICAgaWYgKCFhZGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYWRkTm9kZVRvKGJhc2UsIG9wdGlvbnMuY3NzQ2xhc3Nlcy5jb25uZWN0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQWRkIGhhbmRsZXMgdG8gdGhlIHNsaWRlciBiYXNlLlxyXG4gICAgICAgIGZ1bmN0aW9uIGFkZEVsZW1lbnRzKGNvbm5lY3RPcHRpb25zLCBiYXNlKSB7XHJcbiAgICAgICAgICAgIHZhciBjb25uZWN0QmFzZSA9IGFkZE5vZGVUbyhiYXNlLCBvcHRpb25zLmNzc0NsYXNzZXMuY29ubmVjdHMpO1xyXG4gICAgICAgICAgICBzY29wZV9IYW5kbGVzID0gW107XHJcbiAgICAgICAgICAgIHNjb3BlX0Nvbm5lY3RzID0gW107XHJcbiAgICAgICAgICAgIHNjb3BlX0Nvbm5lY3RzLnB1c2goYWRkQ29ubmVjdChjb25uZWN0QmFzZSwgY29ubmVjdE9wdGlvbnNbMF0pKTtcclxuICAgICAgICAgICAgLy8gWzo6OjpPPT09PU89PT09Tz09PT1dXHJcbiAgICAgICAgICAgIC8vIGNvbm5lY3RPcHRpb25zID0gWzAsIDEsIDEsIDFdXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5oYW5kbGVzOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vIEtlZXAgYSBsaXN0IG9mIGFsbCBhZGRlZCBoYW5kbGVzLlxyXG4gICAgICAgICAgICAgICAgc2NvcGVfSGFuZGxlcy5wdXNoKGFkZE9yaWdpbihiYXNlLCBpKSk7XHJcbiAgICAgICAgICAgICAgICBzY29wZV9IYW5kbGVOdW1iZXJzW2ldID0gaTtcclxuICAgICAgICAgICAgICAgIHNjb3BlX0Nvbm5lY3RzLnB1c2goYWRkQ29ubmVjdChjb25uZWN0QmFzZSwgY29ubmVjdE9wdGlvbnNbaSArIDFdKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBhIHNpbmdsZSBzbGlkZXIuXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkU2xpZGVyKGFkZFRhcmdldCkge1xyXG4gICAgICAgICAgICAvLyBBcHBseSBjbGFzc2VzIGFuZCBkYXRhIHRvIHRoZSB0YXJnZXQuXHJcbiAgICAgICAgICAgIGFkZENsYXNzKGFkZFRhcmdldCwgb3B0aW9ucy5jc3NDbGFzc2VzLnRhcmdldCk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmRpciA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgYWRkQ2xhc3MoYWRkVGFyZ2V0LCBvcHRpb25zLmNzc0NsYXNzZXMubHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFkZENsYXNzKGFkZFRhcmdldCwgb3B0aW9ucy5jc3NDbGFzc2VzLnJ0bCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMub3J0ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRDbGFzcyhhZGRUYXJnZXQsIG9wdGlvbnMuY3NzQ2xhc3Nlcy5ob3Jpem9udGFsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFkZENsYXNzKGFkZFRhcmdldCwgb3B0aW9ucy5jc3NDbGFzc2VzLnZlcnRpY2FsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgdGV4dERpcmVjdGlvbiA9IGdldENvbXB1dGVkU3R5bGUoYWRkVGFyZ2V0KS5kaXJlY3Rpb247XHJcbiAgICAgICAgICAgIGlmICh0ZXh0RGlyZWN0aW9uID09PSBcInJ0bFwiKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRDbGFzcyhhZGRUYXJnZXQsIG9wdGlvbnMuY3NzQ2xhc3Nlcy50ZXh0RGlyZWN0aW9uUnRsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFkZENsYXNzKGFkZFRhcmdldCwgb3B0aW9ucy5jc3NDbGFzc2VzLnRleHREaXJlY3Rpb25MdHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhZGROb2RlVG8oYWRkVGFyZ2V0LCBvcHRpb25zLmNzc0NsYXNzZXMuYmFzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGFkZFRvb2x0aXAoaGFuZGxlLCBoYW5kbGVOdW1iZXIpIHtcclxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnRvb2x0aXBzIHx8ICFvcHRpb25zLnRvb2x0aXBzW2hhbmRsZU51bWJlcl0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYWRkTm9kZVRvKGhhbmRsZS5maXJzdENoaWxkLCBvcHRpb25zLmNzc0NsYXNzZXMudG9vbHRpcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGlzU2xpZGVyRGlzYWJsZWQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzY29wZV9UYXJnZXQuaGFzQXR0cmlidXRlKFwiZGlzYWJsZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIERpc2FibGUgdGhlIHNsaWRlciBkcmFnZ2luZyBpZiBhbnkgaGFuZGxlIGlzIGRpc2FibGVkXHJcbiAgICAgICAgZnVuY3Rpb24gaXNIYW5kbGVEaXNhYmxlZChoYW5kbGVOdW1iZXIpIHtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZU9yaWdpbiA9IHNjb3BlX0hhbmRsZXNbaGFuZGxlTnVtYmVyXTtcclxuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZU9yaWdpbi5oYXNBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZGlzYWJsZShoYW5kbGVOdW1iZXIpIHtcclxuICAgICAgICAgICAgaWYgKGhhbmRsZU51bWJlciAhPT0gbnVsbCAmJiBoYW5kbGVOdW1iZXIgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgc2NvcGVfSGFuZGxlc1toYW5kbGVOdW1iZXJdLnNldEF0dHJpYnV0ZShcImRpc2FibGVkXCIsIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgc2NvcGVfSGFuZGxlc1toYW5kbGVOdW1iZXJdLmhhbmRsZS5yZW1vdmVBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlX1RhcmdldC5zZXRBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiLCBcIlwiKTtcclxuICAgICAgICAgICAgICAgIHNjb3BlX0hhbmRsZXMuZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlLmhhbmRsZS5yZW1vdmVBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGVuYWJsZShoYW5kbGVOdW1iZXIpIHtcclxuICAgICAgICAgICAgaWYgKGhhbmRsZU51bWJlciAhPT0gbnVsbCAmJiBoYW5kbGVOdW1iZXIgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgc2NvcGVfSGFuZGxlc1toYW5kbGVOdW1iZXJdLnJlbW92ZUF0dHJpYnV0ZShcImRpc2FibGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgc2NvcGVfSGFuZGxlc1toYW5kbGVOdW1iZXJdLmhhbmRsZS5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZV9UYXJnZXQucmVtb3ZlQXR0cmlidXRlKFwiZGlzYWJsZWRcIik7XHJcbiAgICAgICAgICAgICAgICBzY29wZV9IYW5kbGVzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZS5yZW1vdmVBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBoYW5kbGUuaGFuZGxlLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlbW92ZVRvb2x0aXBzKCkge1xyXG4gICAgICAgICAgICBpZiAoc2NvcGVfVG9vbHRpcHMpIHtcclxuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50KFwidXBkYXRlXCIgKyBJTlRFUk5BTF9FVkVOVF9OUy50b29sdGlwcyk7XHJcbiAgICAgICAgICAgICAgICBzY29wZV9Ub29sdGlwcy5mb3JFYWNoKGZ1bmN0aW9uICh0b29sdGlwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvb2x0aXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlRWxlbWVudCh0b29sdGlwKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHNjb3BlX1Rvb2x0aXBzID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUaGUgdG9vbHRpcHMgb3B0aW9uIGlzIGEgc2hvcnRoYW5kIGZvciB1c2luZyB0aGUgJ3VwZGF0ZScgZXZlbnQuXHJcbiAgICAgICAgZnVuY3Rpb24gdG9vbHRpcHMoKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZVRvb2x0aXBzKCk7XHJcbiAgICAgICAgICAgIC8vIFRvb2x0aXBzIGFyZSBhZGRlZCB3aXRoIG9wdGlvbnMudG9vbHRpcHMgaW4gb3JpZ2luYWwgb3JkZXIuXHJcbiAgICAgICAgICAgIHNjb3BlX1Rvb2x0aXBzID0gc2NvcGVfSGFuZGxlcy5tYXAoYWRkVG9vbHRpcCk7XHJcbiAgICAgICAgICAgIGJpbmRFdmVudChcInVwZGF0ZVwiICsgSU5URVJOQUxfRVZFTlRfTlMudG9vbHRpcHMsIGZ1bmN0aW9uICh2YWx1ZXMsIGhhbmRsZU51bWJlciwgdW5lbmNvZGVkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNjb3BlX1Rvb2x0aXBzIHx8ICFvcHRpb25zLnRvb2x0aXBzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNjb3BlX1Rvb2x0aXBzW2hhbmRsZU51bWJlcl0gPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGZvcm1hdHRlZFZhbHVlID0gdmFsdWVzW2hhbmRsZU51bWJlcl07XHJcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy50b29sdGlwc1toYW5kbGVOdW1iZXJdICE9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0dGVkVmFsdWUgPSBvcHRpb25zLnRvb2x0aXBzW2hhbmRsZU51bWJlcl0udG8odW5lbmNvZGVkW2hhbmRsZU51bWJlcl0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2NvcGVfVG9vbHRpcHNbaGFuZGxlTnVtYmVyXS5pbm5lckhUTUwgPSBmb3JtYXR0ZWRWYWx1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGFyaWEoKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUV2ZW50KFwidXBkYXRlXCIgKyBJTlRFUk5BTF9FVkVOVF9OUy5hcmlhKTtcclxuICAgICAgICAgICAgYmluZEV2ZW50KFwidXBkYXRlXCIgKyBJTlRFUk5BTF9FVkVOVF9OUy5hcmlhLCBmdW5jdGlvbiAodmFsdWVzLCBoYW5kbGVOdW1iZXIsIHVuZW5jb2RlZCwgdGFwLCBwb3NpdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBBcmlhIFZhbHVlcyBmb3IgYWxsIGhhbmRsZXMsIGFzIGEgY2hhbmdlIGluIG9uZSBjaGFuZ2VzIG1pbiBhbmQgbWF4IHZhbHVlcyBmb3IgdGhlIG5leHQuXHJcbiAgICAgICAgICAgICAgICBzY29wZV9IYW5kbGVOdW1iZXJzLmZvckVhY2goZnVuY3Rpb24gKGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhbmRsZSA9IHNjb3BlX0hhbmRsZXNbaW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtaW4gPSBjaGVja0hhbmRsZVBvc2l0aW9uKHNjb3BlX0xvY2F0aW9ucywgaW5kZXgsIDAsIHRydWUsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXggPSBjaGVja0hhbmRsZVBvc2l0aW9uKHNjb3BlX0xvY2F0aW9ucywgaW5kZXgsIDEwMCwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IHBvc2l0aW9uc1tpbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9ybWF0dGVkIHZhbHVlIGZvciBkaXNwbGF5XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRleHQgPSBTdHJpbmcob3B0aW9ucy5hcmlhRm9ybWF0LnRvKHVuZW5jb2RlZFtpbmRleF0pKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBNYXAgdG8gc2xpZGVyIHJhbmdlIHZhbHVlc1xyXG4gICAgICAgICAgICAgICAgICAgIG1pbiA9IHNjb3BlX1NwZWN0cnVtLmZyb21TdGVwcGluZyhtaW4pLnRvRml4ZWQoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gc2NvcGVfU3BlY3RydW0uZnJvbVN0ZXBwaW5nKG1heCkudG9GaXhlZCgxKTtcclxuICAgICAgICAgICAgICAgICAgICBub3cgPSBzY29wZV9TcGVjdHJ1bS5mcm9tU3RlcHBpbmcobm93KS50b0ZpeGVkKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZS5jaGlsZHJlblswXS5zZXRBdHRyaWJ1dGUoXCJhcmlhLXZhbHVlbWluXCIsIG1pbik7XHJcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlLmNoaWxkcmVuWzBdLnNldEF0dHJpYnV0ZShcImFyaWEtdmFsdWVtYXhcIiwgbWF4KTtcclxuICAgICAgICAgICAgICAgICAgICBoYW5kbGUuY2hpbGRyZW5bMF0uc2V0QXR0cmlidXRlKFwiYXJpYS12YWx1ZW5vd1wiLCBub3cpO1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZS5jaGlsZHJlblswXS5zZXRBdHRyaWJ1dGUoXCJhcmlhLXZhbHVldGV4dFwiLCB0ZXh0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0R3JvdXAocGlwcykge1xyXG4gICAgICAgICAgICAvLyBVc2UgdGhlIHJhbmdlLlxyXG4gICAgICAgICAgICBpZiAocGlwcy5tb2RlID09PSBleHBvcnRzLlBpcHNNb2RlLlJhbmdlIHx8IHBpcHMubW9kZSA9PT0gZXhwb3J0cy5QaXBzTW9kZS5TdGVwcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlX1NwZWN0cnVtLnhWYWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHBpcHMubW9kZSA9PT0gZXhwb3J0cy5QaXBzTW9kZS5Db3VudCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBpcHMudmFsdWVzIDwgMikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vVWlTbGlkZXI6ICd2YWx1ZXMnICg+PSAyKSByZXF1aXJlZCBmb3IgbW9kZSAnY291bnQnLlwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIERpdmlkZSAwIC0gMTAwIGluICdjb3VudCcgcGFydHMuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJ2YWwgPSBwaXBzLnZhbHVlcyAtIDE7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3ByZWFkID0gMTAwIC8gaW50ZXJ2YWw7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVzID0gW107XHJcbiAgICAgICAgICAgICAgICAvLyBMaXN0IHRoZXNlIHBhcnRzIGFuZCBoYXZlIHRoZW0gaGFuZGxlZCBhcyAncG9zaXRpb25zJy5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChpbnRlcnZhbC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzW2ludGVydmFsXSA9IGludGVydmFsICogc3ByZWFkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFsdWVzLnB1c2goMTAwKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXBUb1JhbmdlKHZhbHVlcywgcGlwcy5zdGVwcGVkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocGlwcy5tb2RlID09PSBleHBvcnRzLlBpcHNNb2RlLlBvc2l0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgLy8gTWFwIGFsbCBwZXJjZW50YWdlcyB0byBvbi1yYW5nZSB2YWx1ZXMuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwVG9SYW5nZShwaXBzLnZhbHVlcywgcGlwcy5zdGVwcGVkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocGlwcy5tb2RlID09PSBleHBvcnRzLlBpcHNNb2RlLlZhbHVlcykge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIG11c3QgYmUgc3RlcHBlZCwgaXQgbmVlZHMgdG8gYmUgY29udmVydGVkIHRvIGEgcGVyY2VudGFnZSBmaXJzdC5cclxuICAgICAgICAgICAgICAgIGlmIChwaXBzLnN0ZXBwZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGlwcy52YWx1ZXMubWFwKGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRvIHBlcmNlbnRhZ2UsIGFwcGx5IHN0ZXAsIHJldHVybiB0byB2YWx1ZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlX1NwZWN0cnVtLmZyb21TdGVwcGluZyhzY29wZV9TcGVjdHJ1bS5nZXRTdGVwKHNjb3BlX1NwZWN0cnVtLnRvU3RlcHBpbmcodmFsdWUpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UsIHdlIGNhbiBzaW1wbHkgdXNlIHRoZSB2YWx1ZXMuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGlwcy52YWx1ZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFtdOyAvLyBwaXBzLm1vZGUgPSBuZXZlclxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXBUb1JhbmdlKHZhbHVlcywgc3RlcHBlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzLm1hcChmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZV9TcGVjdHJ1bS5mcm9tU3RlcHBpbmcoc3RlcHBlZCA/IHNjb3BlX1NwZWN0cnVtLmdldFN0ZXAodmFsdWUpIDogdmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVTcHJlYWQocGlwcykge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBzYWZlSW5jcmVtZW50KHZhbHVlLCBpbmNyZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIC8vIEF2b2lkIGZsb2F0aW5nIHBvaW50IHZhcmlhbmNlIGJ5IGRyb3BwaW5nIHRoZSBzbWFsbGVzdCBkZWNpbWFsIHBsYWNlcy5cclxuICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIoKHZhbHVlICsgaW5jcmVtZW50KS50b0ZpeGVkKDcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgZ3JvdXAgPSBnZXRHcm91cChwaXBzKTtcclxuICAgICAgICAgICAgdmFyIGluZGV4ZXMgPSB7fTtcclxuICAgICAgICAgICAgdmFyIGZpcnN0SW5SYW5nZSA9IHNjb3BlX1NwZWN0cnVtLnhWYWxbMF07XHJcbiAgICAgICAgICAgIHZhciBsYXN0SW5SYW5nZSA9IHNjb3BlX1NwZWN0cnVtLnhWYWxbc2NvcGVfU3BlY3RydW0ueFZhbC5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgdmFyIGlnbm9yZUZpcnN0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHZhciBpZ25vcmVMYXN0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHZhciBwcmV2UGN0ID0gMDtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgY29weSBvZiB0aGUgZ3JvdXAsIHNvcnQgaXQgYW5kIGZpbHRlciBhd2F5IGFsbCBkdXBsaWNhdGVzLlxyXG4gICAgICAgICAgICBncm91cCA9IHVuaXF1ZShncm91cC5zbGljZSgpLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhIC0gYjtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIHJhbmdlIHN0YXJ0cyB3aXRoIHRoZSBmaXJzdCBlbGVtZW50LlxyXG4gICAgICAgICAgICBpZiAoZ3JvdXBbMF0gIT09IGZpcnN0SW5SYW5nZSkge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXAudW5zaGlmdChmaXJzdEluUmFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgaWdub3JlRmlyc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIExpa2V3aXNlIGZvciB0aGUgbGFzdCBvbmUuXHJcbiAgICAgICAgICAgIGlmIChncm91cFtncm91cC5sZW5ndGggLSAxXSAhPT0gbGFzdEluUmFuZ2UpIHtcclxuICAgICAgICAgICAgICAgIGdyb3VwLnB1c2gobGFzdEluUmFuZ2UpO1xyXG4gICAgICAgICAgICAgICAgaWdub3JlTGFzdCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZ3JvdXAuZm9yRWFjaChmdW5jdGlvbiAoY3VycmVudCwgaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgY3VycmVudCBzdGVwIGFuZCB0aGUgbG93ZXIgKyB1cHBlciBwb3NpdGlvbnMuXHJcbiAgICAgICAgICAgICAgICB2YXIgc3RlcDtcclxuICAgICAgICAgICAgICAgIHZhciBpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHE7XHJcbiAgICAgICAgICAgICAgICB2YXIgbG93ID0gY3VycmVudDtcclxuICAgICAgICAgICAgICAgIHZhciBoaWdoID0gZ3JvdXBbaW5kZXggKyAxXTtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdQY3Q7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGN0RGlmZmVyZW5jZTtcclxuICAgICAgICAgICAgICAgIHZhciBwY3RQb3M7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHlwZTtcclxuICAgICAgICAgICAgICAgIHZhciBzdGVwcztcclxuICAgICAgICAgICAgICAgIHZhciByZWFsU3RlcHM7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RlcFNpemU7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNTdGVwcyA9IHBpcHMubW9kZSA9PT0gZXhwb3J0cy5QaXBzTW9kZS5TdGVwcztcclxuICAgICAgICAgICAgICAgIC8vIFdoZW4gdXNpbmcgJ3N0ZXBzJyBtb2RlLCB1c2UgdGhlIHByb3ZpZGVkIHN0ZXBzLlxyXG4gICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSdsbCBzdGVwIG9uIHRvIHRoZSBuZXh0IHN1YnJhbmdlLlxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RlcHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGVwID0gc2NvcGVfU3BlY3RydW0ueE51bVN0ZXBzW2luZGV4XTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgdG8gYSAnZnVsbCcgc3RlcC5cclxuICAgICAgICAgICAgICAgIGlmICghc3RlcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXAgPSBoaWdoIC0gbG93O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gSWYgaGlnaCBpcyB1bmRlZmluZWQgd2UgYXJlIGF0IHRoZSBsYXN0IHN1YnJhbmdlLiBNYWtlIHN1cmUgaXQgaXRlcmF0ZXMgb25jZSAoIzEwODgpXHJcbiAgICAgICAgICAgICAgICBpZiAoaGlnaCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGlnaCA9IGxvdztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSBzdGVwIGlzbid0IDAsIHdoaWNoIHdvdWxkIGNhdXNlIGFuIGluZmluaXRlIGxvb3AgKCM2NTQpXHJcbiAgICAgICAgICAgICAgICBzdGVwID0gTWF0aC5tYXgoc3RlcCwgMC4wMDAwMDAxKTtcclxuICAgICAgICAgICAgICAgIC8vIEZpbmQgYWxsIHN0ZXBzIGluIHRoZSBzdWJyYW5nZS5cclxuICAgICAgICAgICAgICAgIGZvciAoaSA9IGxvdzsgaSA8PSBoaWdoOyBpID0gc2FmZUluY3JlbWVudChpLCBzdGVwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgcGVyY2VudGFnZSB2YWx1ZSBmb3IgdGhlIGN1cnJlbnQgc3RlcCxcclxuICAgICAgICAgICAgICAgICAgICAvLyBjYWxjdWxhdGUgdGhlIHNpemUgZm9yIHRoZSBzdWJyYW5nZS5cclxuICAgICAgICAgICAgICAgICAgICBuZXdQY3QgPSBzY29wZV9TcGVjdHJ1bS50b1N0ZXBwaW5nKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBjdERpZmZlcmVuY2UgPSBuZXdQY3QgLSBwcmV2UGN0O1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBzID0gcGN0RGlmZmVyZW5jZSAvIChwaXBzLmRlbnNpdHkgfHwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVhbFN0ZXBzID0gTWF0aC5yb3VuZChzdGVwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyByYXRpbyByZXByZXNlbnRzIHRoZSBhbW91bnQgb2YgcGVyY2VudGFnZS1zcGFjZSBhIHBvaW50IGluZGljYXRlcy5cclxuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgYSBkZW5zaXR5IDEgdGhlIHBvaW50cy9wZXJjZW50YWdlID0gMS4gRm9yIGRlbnNpdHkgMiwgdGhhdCBwZXJjZW50YWdlIG5lZWRzIHRvIGJlIHJlLWRpdmlkZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUm91bmQgdGhlIHBlcmNlbnRhZ2Ugb2Zmc2V0IHRvIGFuIGV2ZW4gbnVtYmVyLCB0aGVuIGRpdmlkZSBieSB0d29cclxuICAgICAgICAgICAgICAgICAgICAvLyB0byBzcHJlYWQgdGhlIG9mZnNldCBvbiBib3RoIHNpZGVzIG9mIHRoZSByYW5nZS5cclxuICAgICAgICAgICAgICAgICAgICBzdGVwU2l6ZSA9IHBjdERpZmZlcmVuY2UgLyByZWFsU3RlcHM7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRGl2aWRlIGFsbCBwb2ludHMgZXZlbmx5LCBhZGRpbmcgdGhlIGNvcnJlY3QgbnVtYmVyIHRvIHRoaXMgc3VicmFuZ2UuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUnVuIHVwIHRvIDw9IHNvIHRoYXQgMTAwJSBnZXRzIGEgcG9pbnQsIGV2ZW50IGlmIGlnbm9yZUxhc3QgaXMgc2V0LlxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAocSA9IDE7IHEgPD0gcmVhbFN0ZXBzOyBxICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHJhdGlvIGJldHdlZW4gdGhlIHJvdW5kZWQgdmFsdWUgYW5kIHRoZSBhY3R1YWwgc2l6ZSBtaWdodCBiZSB+MSUgb2ZmLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb3JyZWN0IHRoZSBwZXJjZW50YWdlIG9mZnNldCBieSB0aGUgbnVtYmVyIG9mIHBvaW50c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwZXIgc3VicmFuZ2UuIGRlbnNpdHkgPSAxIHdpbGwgcmVzdWx0IGluIDEwMCBwb2ludHMgb24gdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZ1bGwgcmFuZ2UsIDIgZm9yIDUwLCA0IGZvciAyNSwgZXRjLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwY3RQb3MgPSBwcmV2UGN0ICsgcSAqIHN0ZXBTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleGVzW3BjdFBvcy50b0ZpeGVkKDUpXSA9IFtzY29wZV9TcGVjdHJ1bS5mcm9tU3RlcHBpbmcocGN0UG9zKSwgMF07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERldGVybWluZSB0aGUgcG9pbnQgdHlwZS5cclxuICAgICAgICAgICAgICAgICAgICB0eXBlID0gZ3JvdXAuaW5kZXhPZihpKSA+IC0xID8gZXhwb3J0cy5QaXBzVHlwZS5MYXJnZVZhbHVlIDogaXNTdGVwcyA/IGV4cG9ydHMuUGlwc1R5cGUuU21hbGxWYWx1ZSA6IGV4cG9ydHMuUGlwc1R5cGUuTm9WYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBFbmZvcmNlIHRoZSAnaWdub3JlRmlyc3QnIG9wdGlvbiBieSBvdmVyd3JpdGluZyB0aGUgdHlwZSBmb3IgMC5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWluZGV4ICYmIGlnbm9yZUZpcnN0ICYmIGkgIT09IGhpZ2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGkgPT09IGhpZ2ggJiYgaWdub3JlTGFzdCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFyayB0aGUgJ3R5cGUnIG9mIHRoaXMgcG9pbnQuIDAgPSBwbGFpbiwgMSA9IHJlYWwgdmFsdWUsIDIgPSBzdGVwIHZhbHVlLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleGVzW25ld1BjdC50b0ZpeGVkKDUpXSA9IFtpLCB0eXBlXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBwZXJjZW50YWdlIGNvdW50LlxyXG4gICAgICAgICAgICAgICAgICAgIHByZXZQY3QgPSBuZXdQY3Q7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5kZXhlcztcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gYWRkTWFya2luZyhzcHJlYWQsIGZpbHRlckZ1bmMsIGZvcm1hdHRlcikge1xyXG4gICAgICAgICAgICB2YXIgX2EsIF9iO1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IHNjb3BlX0RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZVNpemVDbGFzc2VzID0gKF9hID0ge30sXHJcbiAgICAgICAgICAgICAgICBfYVtleHBvcnRzLlBpcHNUeXBlLk5vbmVdID0gXCJcIixcclxuICAgICAgICAgICAgICAgIF9hW2V4cG9ydHMuUGlwc1R5cGUuTm9WYWx1ZV0gPSBvcHRpb25zLmNzc0NsYXNzZXMudmFsdWVOb3JtYWwsXHJcbiAgICAgICAgICAgICAgICBfYVtleHBvcnRzLlBpcHNUeXBlLkxhcmdlVmFsdWVdID0gb3B0aW9ucy5jc3NDbGFzc2VzLnZhbHVlTGFyZ2UsXHJcbiAgICAgICAgICAgICAgICBfYVtleHBvcnRzLlBpcHNUeXBlLlNtYWxsVmFsdWVdID0gb3B0aW9ucy5jc3NDbGFzc2VzLnZhbHVlU3ViLFxyXG4gICAgICAgICAgICAgICAgX2EpO1xyXG4gICAgICAgICAgICB2YXIgbWFya2VyU2l6ZUNsYXNzZXMgPSAoX2IgPSB7fSxcclxuICAgICAgICAgICAgICAgIF9iW2V4cG9ydHMuUGlwc1R5cGUuTm9uZV0gPSBcIlwiLFxyXG4gICAgICAgICAgICAgICAgX2JbZXhwb3J0cy5QaXBzVHlwZS5Ob1ZhbHVlXSA9IG9wdGlvbnMuY3NzQ2xhc3Nlcy5tYXJrZXJOb3JtYWwsXHJcbiAgICAgICAgICAgICAgICBfYltleHBvcnRzLlBpcHNUeXBlLkxhcmdlVmFsdWVdID0gb3B0aW9ucy5jc3NDbGFzc2VzLm1hcmtlckxhcmdlLFxyXG4gICAgICAgICAgICAgICAgX2JbZXhwb3J0cy5QaXBzVHlwZS5TbWFsbFZhbHVlXSA9IG9wdGlvbnMuY3NzQ2xhc3Nlcy5tYXJrZXJTdWIsXHJcbiAgICAgICAgICAgICAgICBfYik7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZU9yaWVudGF0aW9uQ2xhc3NlcyA9IFtvcHRpb25zLmNzc0NsYXNzZXMudmFsdWVIb3Jpem9udGFsLCBvcHRpb25zLmNzc0NsYXNzZXMudmFsdWVWZXJ0aWNhbF07XHJcbiAgICAgICAgICAgIHZhciBtYXJrZXJPcmllbnRhdGlvbkNsYXNzZXMgPSBbb3B0aW9ucy5jc3NDbGFzc2VzLm1hcmtlckhvcml6b250YWwsIG9wdGlvbnMuY3NzQ2xhc3Nlcy5tYXJrZXJWZXJ0aWNhbF07XHJcbiAgICAgICAgICAgIGFkZENsYXNzKGVsZW1lbnQsIG9wdGlvbnMuY3NzQ2xhc3Nlcy5waXBzKTtcclxuICAgICAgICAgICAgYWRkQ2xhc3MoZWxlbWVudCwgb3B0aW9ucy5vcnQgPT09IDAgPyBvcHRpb25zLmNzc0NsYXNzZXMucGlwc0hvcml6b250YWwgOiBvcHRpb25zLmNzc0NsYXNzZXMucGlwc1ZlcnRpY2FsKTtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0Q2xhc3Nlcyh0eXBlLCBzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhID0gc291cmNlID09PSBvcHRpb25zLmNzc0NsYXNzZXMudmFsdWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgb3JpZW50YXRpb25DbGFzc2VzID0gYSA/IHZhbHVlT3JpZW50YXRpb25DbGFzc2VzIDogbWFya2VyT3JpZW50YXRpb25DbGFzc2VzO1xyXG4gICAgICAgICAgICAgICAgdmFyIHNpemVDbGFzc2VzID0gYSA/IHZhbHVlU2l6ZUNsYXNzZXMgOiBtYXJrZXJTaXplQ2xhc3NlcztcclxuICAgICAgICAgICAgICAgIHJldHVybiBzb3VyY2UgKyBcIiBcIiArIG9yaWVudGF0aW9uQ2xhc3Nlc1tvcHRpb25zLm9ydF0gKyBcIiBcIiArIHNpemVDbGFzc2VzW3R5cGVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZFNwcmVhZChvZmZzZXQsIHZhbHVlLCB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBcHBseSB0aGUgZmlsdGVyIGZ1bmN0aW9uLCBpZiBpdCBpcyBzZXQuXHJcbiAgICAgICAgICAgICAgICB0eXBlID0gZmlsdGVyRnVuYyA/IGZpbHRlckZ1bmModmFsdWUsIHR5cGUpIDogdHlwZTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSBleHBvcnRzLlBpcHNUeXBlLk5vbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgYSBtYXJrZXIgZm9yIGV2ZXJ5IHBvaW50XHJcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IGFkZE5vZGVUbyhlbGVtZW50LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBub2RlLmNsYXNzTmFtZSA9IGdldENsYXNzZXModHlwZSwgb3B0aW9ucy5jc3NDbGFzc2VzLm1hcmtlcik7XHJcbiAgICAgICAgICAgICAgICBub2RlLnN0eWxlW29wdGlvbnMuc3R5bGVdID0gb2Zmc2V0ICsgXCIlXCI7XHJcbiAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgYXJlIG9ubHkgYXBwZW5kZWQgZm9yIHBvaW50cyBtYXJrZWQgJzEnIG9yICcyJy5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlID4gZXhwb3J0cy5QaXBzVHlwZS5Ob1ZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IGFkZE5vZGVUbyhlbGVtZW50LCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5jbGFzc05hbWUgPSBnZXRDbGFzc2VzKHR5cGUsIG9wdGlvbnMuY3NzQ2xhc3Nlcy52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIsIFN0cmluZyh2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc3R5bGVbb3B0aW9ucy5zdHlsZV0gPSBvZmZzZXQgKyBcIiVcIjtcclxuICAgICAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IFN0cmluZyhmb3JtYXR0ZXIudG8odmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBBcHBlbmQgYWxsIHBvaW50cy5cclxuICAgICAgICAgICAgT2JqZWN0LmtleXMoc3ByZWFkKS5mb3JFYWNoKGZ1bmN0aW9uIChvZmZzZXQpIHtcclxuICAgICAgICAgICAgICAgIGFkZFNwcmVhZChvZmZzZXQsIHNwcmVhZFtvZmZzZXRdWzBdLCBzcHJlYWRbb2Zmc2V0XVsxXSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlUGlwcygpIHtcclxuICAgICAgICAgICAgaWYgKHNjb3BlX1BpcHMpIHtcclxuICAgICAgICAgICAgICAgIHJlbW92ZUVsZW1lbnQoc2NvcGVfUGlwcyk7XHJcbiAgICAgICAgICAgICAgICBzY29wZV9QaXBzID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBwaXBzKHBpcHMpIHtcclxuICAgICAgICAgICAgLy8gRml4ICM2NjlcclxuICAgICAgICAgICAgcmVtb3ZlUGlwcygpO1xyXG4gICAgICAgICAgICB2YXIgc3ByZWFkID0gZ2VuZXJhdGVTcHJlYWQocGlwcyk7XHJcbiAgICAgICAgICAgIHZhciBmaWx0ZXIgPSBwaXBzLmZpbHRlcjtcclxuICAgICAgICAgICAgdmFyIGZvcm1hdCA9IHBpcHMuZm9ybWF0IHx8IHtcclxuICAgICAgICAgICAgICAgIHRvOiBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKE1hdGgucm91bmQodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHNjb3BlX1BpcHMgPSBzY29wZV9UYXJnZXQuYXBwZW5kQ2hpbGQoYWRkTWFya2luZyhzcHJlYWQsIGZpbHRlciwgZm9ybWF0KSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzY29wZV9QaXBzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBTaG9ydGhhbmQgZm9yIGJhc2UgZGltZW5zaW9ucy5cclxuICAgICAgICBmdW5jdGlvbiBiYXNlU2l6ZSgpIHtcclxuICAgICAgICAgICAgdmFyIHJlY3QgPSBzY29wZV9CYXNlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgICAgICB2YXIgYWx0ID0gKFwib2Zmc2V0XCIgKyBbXCJXaWR0aFwiLCBcIkhlaWdodFwiXVtvcHRpb25zLm9ydF0pO1xyXG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5vcnQgPT09IDAgPyByZWN0LndpZHRoIHx8IHNjb3BlX0Jhc2VbYWx0XSA6IHJlY3QuaGVpZ2h0IHx8IHNjb3BlX0Jhc2VbYWx0XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gSGFuZGxlciBmb3IgYXR0YWNoaW5nIGV2ZW50cyB0cm91Z2ggYSBwcm94eS5cclxuICAgICAgICBmdW5jdGlvbiBhdHRhY2hFdmVudChldmVudHMsIGVsZW1lbnQsIGNhbGxiYWNrLCBkYXRhKSB7XHJcbiAgICAgICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gY2FuIGJlIHVzZWQgdG8gJ2ZpbHRlcicgZXZlbnRzIHRvIHRoZSBzbGlkZXIuXHJcbiAgICAgICAgICAgIC8vIGVsZW1lbnQgaXMgYSBub2RlLCBub3QgYSBub2RlTGlzdFxyXG4gICAgICAgICAgICB2YXIgbWV0aG9kID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGZpeEV2ZW50KGV2ZW50LCBkYXRhLnBhZ2VPZmZzZXQsIGRhdGEudGFyZ2V0IHx8IGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgLy8gZml4RXZlbnQgcmV0dXJucyBmYWxzZSBpZiB0aGlzIGV2ZW50IGhhcyBhIGRpZmZlcmVudCB0YXJnZXRcclxuICAgICAgICAgICAgICAgIC8vIHdoZW4gaGFuZGxpbmcgKG11bHRpLSkgdG91Y2ggZXZlbnRzO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gZG9Ob3RSZWplY3QgaXMgcGFzc2VkIGJ5IGFsbCBlbmQgZXZlbnRzIHRvIG1ha2Ugc3VyZSByZWxlYXNlZCB0b3VjaGVzXHJcbiAgICAgICAgICAgICAgICAvLyBhcmUgbm90IHJlamVjdGVkLCBsZWF2aW5nIHRoZSBzbGlkZXIgXCJzdHVja1wiIHRvIHRoZSBjdXJzb3I7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTbGlkZXJEaXNhYmxlZCgpICYmICFkYXRhLmRvTm90UmVqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gU3RvcCBpZiBhbiBhY3RpdmUgJ3RhcCcgdHJhbnNpdGlvbiBpcyB0YWtpbmcgcGxhY2UuXHJcbiAgICAgICAgICAgICAgICBpZiAoaGFzQ2xhc3Moc2NvcGVfVGFyZ2V0LCBvcHRpb25zLmNzc0NsYXNzZXMudGFwKSAmJiAhZGF0YS5kb05vdFJlamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIElnbm9yZSByaWdodCBvciBtaWRkbGUgY2xpY2tzIG9uIHN0YXJ0ICM0NTRcclxuICAgICAgICAgICAgICAgIGlmIChldmVudHMgPT09IGFjdGlvbnMuc3RhcnQgJiYgZS5idXR0b25zICE9PSB1bmRlZmluZWQgJiYgZS5idXR0b25zID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIElnbm9yZSByaWdodCBvciBtaWRkbGUgY2xpY2tzIG9uIHN0YXJ0ICM0NTRcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLmhvdmVyICYmIGUuYnV0dG9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vICdzdXBwb3J0c1Bhc3NpdmUnIGlzIG9ubHkgdHJ1ZSBpZiBhIGJyb3dzZXIgYWxzbyBzdXBwb3J0cyB0b3VjaC1hY3Rpb246IG5vbmUgaW4gQ1NTLlxyXG4gICAgICAgICAgICAgICAgLy8gaU9TIHNhZmFyaSBkb2VzIG5vdCwgc28gaXQgZG9lc24ndCBnZXQgdG8gYmVuZWZpdCBmcm9tIHBhc3NpdmUgc2Nyb2xsaW5nLiBpT1MgZG9lcyBzdXBwb3J0XHJcbiAgICAgICAgICAgICAgICAvLyB0b3VjaC1hY3Rpb246IG1hbmlwdWxhdGlvbiwgYnV0IHRoYXQgYWxsb3dzIHBhbm5pbmcsIHdoaWNoIGJyZWFrc1xyXG4gICAgICAgICAgICAgICAgLy8gc2xpZGVycyBhZnRlciB6b29taW5nL29uIG5vbi1yZXNwb25zaXZlIHBhZ2VzLlxyXG4gICAgICAgICAgICAgICAgLy8gU2VlOiBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTMzMTEyXHJcbiAgICAgICAgICAgICAgICBpZiAoIXN1cHBvcnRzUGFzc2l2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGUuY2FsY1BvaW50ID0gZS5wb2ludHNbb3B0aW9ucy5vcnRdO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2FsbCB0aGUgZXZlbnQgaGFuZGxlciB3aXRoIHRoZSBldmVudCBbIGFuZCBhZGRpdGlvbmFsIGRhdGEgXS5cclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGUsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB2YXIgbWV0aG9kcyA9IFtdO1xyXG4gICAgICAgICAgICAvLyBCaW5kIGEgY2xvc3VyZSBvbiB0aGUgdGFyZ2V0IGZvciBldmVyeSBldmVudCB0eXBlLlxyXG4gICAgICAgICAgICBldmVudHMuc3BsaXQoXCIgXCIpLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbWV0aG9kLCBzdXBwb3J0c1Bhc3NpdmUgPyB7IHBhc3NpdmU6IHRydWUgfSA6IGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIG1ldGhvZHMucHVzaChbZXZlbnROYW1lLCBtZXRob2RdKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBtZXRob2RzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBQcm92aWRlIGEgY2xlYW4gZXZlbnQgd2l0aCBzdGFuZGFyZGl6ZWQgb2Zmc2V0IHZhbHVlcy5cclxuICAgICAgICBmdW5jdGlvbiBmaXhFdmVudChlLCBwYWdlT2Zmc2V0LCBldmVudFRhcmdldCkge1xyXG4gICAgICAgICAgICAvLyBGaWx0ZXIgdGhlIGV2ZW50IHRvIHJlZ2lzdGVyIHRoZSB0eXBlLCB3aGljaCBjYW4gYmVcclxuICAgICAgICAgICAgLy8gdG91Y2gsIG1vdXNlIG9yIHBvaW50ZXIuIE9mZnNldCBjaGFuZ2VzIG5lZWQgdG8gYmVcclxuICAgICAgICAgICAgLy8gbWFkZSBvbiBhbiBldmVudCBzcGVjaWZpYyBiYXNpcy5cclxuICAgICAgICAgICAgdmFyIHRvdWNoID0gZS50eXBlLmluZGV4T2YoXCJ0b3VjaFwiKSA9PT0gMDtcclxuICAgICAgICAgICAgdmFyIG1vdXNlID0gZS50eXBlLmluZGV4T2YoXCJtb3VzZVwiKSA9PT0gMDtcclxuICAgICAgICAgICAgdmFyIHBvaW50ZXIgPSBlLnR5cGUuaW5kZXhPZihcInBvaW50ZXJcIikgPT09IDA7XHJcbiAgICAgICAgICAgIHZhciB4ID0gMDtcclxuICAgICAgICAgICAgdmFyIHkgPSAwO1xyXG4gICAgICAgICAgICAvLyBJRTEwIGltcGxlbWVudGVkIHBvaW50ZXIgZXZlbnRzIHdpdGggYSBwcmVmaXg7XHJcbiAgICAgICAgICAgIGlmIChlLnR5cGUuaW5kZXhPZihcIk1TUG9pbnRlclwiKSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcG9pbnRlciA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRXJyb25lb3VzIGV2ZW50cyBzZWVtIHRvIGJlIHBhc3NlZCBpbiBvY2Nhc2lvbmFsbHkgb24gaU9TL2lQYWRPUyBhZnRlciB1c2VyIGZpbmlzaGVzIGludGVyYWN0aW5nIHdpdGhcclxuICAgICAgICAgICAgLy8gdGhlIHNsaWRlci4gVGhleSBhcHBlYXIgdG8gYmUgb2YgdHlwZSBNb3VzZUV2ZW50LCB5ZXQgdGhleSBkb24ndCBoYXZlIHVzdWFsIHByb3BlcnRpZXMgc2V0LiBJZ25vcmVcclxuICAgICAgICAgICAgLy8gZXZlbnRzIHRoYXQgaGF2ZSBubyB0b3VjaGVzIG9yIGJ1dHRvbnMgYXNzb2NpYXRlZCB3aXRoIHRoZW0uICgjMTA1NywgIzEwNzksICMxMDk1KVxyXG4gICAgICAgICAgICBpZiAoZS50eXBlID09PSBcIm1vdXNlZG93blwiICYmICFlLmJ1dHRvbnMgJiYgIWUudG91Y2hlcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFRoZSBvbmx5IHRoaW5nIG9uZSBoYW5kbGUgc2hvdWxkIGJlIGNvbmNlcm5lZCBhYm91dCBpcyB0aGUgdG91Y2hlcyB0aGF0IG9yaWdpbmF0ZWQgb24gdG9wIG9mIGl0LlxyXG4gICAgICAgICAgICBpZiAodG91Y2gpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJldHVybnMgdHJ1ZSBpZiBhIHRvdWNoIG9yaWdpbmF0ZWQgb24gdGhlIHRhcmdldC5cclxuICAgICAgICAgICAgICAgIHZhciBpc1RvdWNoT25UYXJnZXQgPSBmdW5jdGlvbiAoY2hlY2tUb3VjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSBjaGVja1RvdWNoLnRhcmdldDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHRhcmdldCA9PT0gZXZlbnRUYXJnZXQgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuY29udGFpbnModGFyZ2V0KSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoZS5jb21wb3NlZCAmJiBlLmNvbXBvc2VkUGF0aCgpLnNoaWZ0KCkgPT09IGV2ZW50VGFyZ2V0KSk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgdG91Y2hzdGFydCBldmVudHMsIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoZXJlIGlzIHN0aWxsIG5vIG1vcmUgdGhhbiBvbmVcclxuICAgICAgICAgICAgICAgIC8vIHRvdWNoIG9uIHRoZSB0YXJnZXQgc28gd2UgbG9vayBhbW9uZ3N0IGFsbCB0b3VjaGVzLlxyXG4gICAgICAgICAgICAgICAgaWYgKGUudHlwZSA9PT0gXCJ0b3VjaHN0YXJ0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0VG91Y2hlcyA9IEFycmF5LnByb3RvdHlwZS5maWx0ZXIuY2FsbChlLnRvdWNoZXMsIGlzVG91Y2hPblRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRG8gbm90IHN1cHBvcnQgbW9yZSB0aGFuIG9uZSB0b3VjaCBwZXIgaGFuZGxlLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXRUb3VjaGVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB4ID0gdGFyZ2V0VG91Y2hlc1swXS5wYWdlWDtcclxuICAgICAgICAgICAgICAgICAgICB5ID0gdGFyZ2V0VG91Y2hlc1swXS5wYWdlWTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEluIHRoZSBvdGhlciBjYXNlcywgZmluZCBvbiBjaGFuZ2VkVG91Y2hlcyBpcyBlbm91Z2guXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldFRvdWNoID0gQXJyYXkucHJvdG90eXBlLmZpbmQuY2FsbChlLmNoYW5nZWRUb3VjaGVzLCBpc1RvdWNoT25UYXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENhbmNlbCBpZiB0aGUgdGFyZ2V0IHRvdWNoIGhhcyBub3QgbW92ZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0YXJnZXRUb3VjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHggPSB0YXJnZXRUb3VjaC5wYWdlWDtcclxuICAgICAgICAgICAgICAgICAgICB5ID0gdGFyZ2V0VG91Y2gucGFnZVk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcGFnZU9mZnNldCA9IHBhZ2VPZmZzZXQgfHwgZ2V0UGFnZU9mZnNldChzY29wZV9Eb2N1bWVudCk7XHJcbiAgICAgICAgICAgIGlmIChtb3VzZSB8fCBwb2ludGVyKSB7XHJcbiAgICAgICAgICAgICAgICB4ID0gZS5jbGllbnRYICsgcGFnZU9mZnNldC54O1xyXG4gICAgICAgICAgICAgICAgeSA9IGUuY2xpZW50WSArIHBhZ2VPZmZzZXQueTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlLnBhZ2VPZmZzZXQgPSBwYWdlT2Zmc2V0O1xyXG4gICAgICAgICAgICBlLnBvaW50cyA9IFt4LCB5XTtcclxuICAgICAgICAgICAgZS5jdXJzb3IgPSBtb3VzZSB8fCBwb2ludGVyOyAvLyBGaXggIzQzNVxyXG4gICAgICAgICAgICByZXR1cm4gZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVHJhbnNsYXRlIGEgY29vcmRpbmF0ZSBpbiB0aGUgZG9jdW1lbnQgdG8gYSBwZXJjZW50YWdlIG9uIHRoZSBzbGlkZXJcclxuICAgICAgICBmdW5jdGlvbiBjYWxjUG9pbnRUb1BlcmNlbnRhZ2UoY2FsY1BvaW50KSB7XHJcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IGNhbGNQb2ludCAtIG9mZnNldChzY29wZV9CYXNlLCBvcHRpb25zLm9ydCk7XHJcbiAgICAgICAgICAgIHZhciBwcm9wb3NhbCA9IChsb2NhdGlvbiAqIDEwMCkgLyBiYXNlU2l6ZSgpO1xyXG4gICAgICAgICAgICAvLyBDbGFtcCBwcm9wb3NhbCBiZXR3ZWVuIDAlIGFuZCAxMDAlXHJcbiAgICAgICAgICAgIC8vIE91dC1vZi1ib3VuZCBjb29yZGluYXRlcyBtYXkgb2NjdXIgd2hlbiAubm9VaS1iYXNlIHBzZXVkby1lbGVtZW50c1xyXG4gICAgICAgICAgICAvLyBhcmUgdXNlZCAoZS5nLiBjb250YWluZWQgaGFuZGxlcyBmZWF0dXJlKVxyXG4gICAgICAgICAgICBwcm9wb3NhbCA9IGxpbWl0KHByb3Bvc2FsKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZGlyID8gMTAwIC0gcHJvcG9zYWwgOiBwcm9wb3NhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRmluZCBoYW5kbGUgY2xvc2VzdCB0byBhIGNlcnRhaW4gcGVyY2VudGFnZSBvbiB0aGUgc2xpZGVyXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0Q2xvc2VzdEhhbmRsZShjbGlja2VkUG9zaXRpb24pIHtcclxuICAgICAgICAgICAgdmFyIHNtYWxsZXN0RGlmZmVyZW5jZSA9IDEwMDtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZU51bWJlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzY29wZV9IYW5kbGVzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIC8vIERpc2FibGVkIGhhbmRsZXMgYXJlIGlnbm9yZWRcclxuICAgICAgICAgICAgICAgIGlmIChpc0hhbmRsZURpc2FibGVkKGluZGV4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVQb3NpdGlvbiA9IHNjb3BlX0xvY2F0aW9uc1tpbmRleF07XHJcbiAgICAgICAgICAgICAgICB2YXIgZGlmZmVyZW5jZVdpdGhUaGlzSGFuZGxlID0gTWF0aC5hYnMoaGFuZGxlUG9zaXRpb24gLSBjbGlja2VkUG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgLy8gSW5pdGlhbCBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgdmFyIGNsaWNrQXRFZGdlID0gZGlmZmVyZW5jZVdpdGhUaGlzSGFuZGxlID09PSAxMDAgJiYgc21hbGxlc3REaWZmZXJlbmNlID09PSAxMDA7XHJcbiAgICAgICAgICAgICAgICAvLyBEaWZmZXJlbmNlIHdpdGggdGhpcyBoYW5kbGUgaXMgc21hbGxlciB0aGFuIHRoZSBwcmV2aW91c2x5IGNoZWNrZWQgaGFuZGxlXHJcbiAgICAgICAgICAgICAgICB2YXIgaXNDbG9zZXIgPSBkaWZmZXJlbmNlV2l0aFRoaXNIYW5kbGUgPCBzbWFsbGVzdERpZmZlcmVuY2U7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNDbG9zZXJBZnRlciA9IGRpZmZlcmVuY2VXaXRoVGhpc0hhbmRsZSA8PSBzbWFsbGVzdERpZmZlcmVuY2UgJiYgY2xpY2tlZFBvc2l0aW9uID4gaGFuZGxlUG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNDbG9zZXIgfHwgaXNDbG9zZXJBZnRlciB8fCBjbGlja0F0RWRnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZU51bWJlciA9IGluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIHNtYWxsZXN0RGlmZmVyZW5jZSA9IGRpZmZlcmVuY2VXaXRoVGhpc0hhbmRsZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVOdW1iZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEZpcmUgJ2VuZCcgd2hlbiBhIG1vdXNlIG9yIHBlbiBsZWF2ZXMgdGhlIGRvY3VtZW50LlxyXG4gICAgICAgIGZ1bmN0aW9uIGRvY3VtZW50TGVhdmUoZXZlbnQsIGRhdGEpIHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IFwibW91c2VvdXRcIiAmJlxyXG4gICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0Lm5vZGVOYW1lID09PSBcIkhUTUxcIiAmJlxyXG4gICAgICAgICAgICAgICAgZXZlbnQucmVsYXRlZFRhcmdldCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnRFbmQoZXZlbnQsIGRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEhhbmRsZSBtb3ZlbWVudCBvbiBkb2N1bWVudCBmb3IgaGFuZGxlIGFuZCByYW5nZSBkcmFnLlxyXG4gICAgICAgIGZ1bmN0aW9uIGV2ZW50TW92ZShldmVudCwgZGF0YSkge1xyXG4gICAgICAgICAgICAvLyBGaXggIzQ5OFxyXG4gICAgICAgICAgICAvLyBDaGVjayB2YWx1ZSBvZiAuYnV0dG9ucyBpbiAnc3RhcnQnIHRvIHdvcmsgYXJvdW5kIGEgYnVnIGluIElFMTAgbW9iaWxlIChkYXRhLmJ1dHRvbnNQcm9wZXJ0eSkuXHJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vY29ubmVjdC5taWNyb3NvZnQuY29tL0lFL2ZlZWRiYWNrL2RldGFpbHMvOTI3MDA1L21vYmlsZS1pZTEwLXdpbmRvd3MtcGhvbmUtYnV0dG9ucy1wcm9wZXJ0eS1vZi1wb2ludGVybW92ZS1ldmVudC1hbHdheXMtemVyb1xyXG4gICAgICAgICAgICAvLyBJRTkgaGFzIC5idXR0b25zIGFuZCAud2hpY2ggemVybyBvbiBtb3VzZW1vdmUuXHJcbiAgICAgICAgICAgIC8vIEZpcmVmb3ggYnJlYWtzIHRoZSBzcGVjIE1ETiBkZWZpbmVzLlxyXG4gICAgICAgICAgICBpZiAobmF2aWdhdG9yLmFwcFZlcnNpb24uaW5kZXhPZihcIk1TSUUgOVwiKSA9PT0gLTEgJiYgZXZlbnQuYnV0dG9ucyA9PT0gMCAmJiBkYXRhLmJ1dHRvbnNQcm9wZXJ0eSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50RW5kKGV2ZW50LCBkYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB3ZSBhcmUgbW92aW5nIHVwIG9yIGRvd25cclxuICAgICAgICAgICAgdmFyIG1vdmVtZW50ID0gKG9wdGlvbnMuZGlyID8gLTEgOiAxKSAqIChldmVudC5jYWxjUG9pbnQgLSBkYXRhLnN0YXJ0Q2FsY1BvaW50KTtcclxuICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgbW92ZW1lbnQgaW50byBhIHBlcmNlbnRhZ2Ugb2YgdGhlIHNsaWRlciB3aWR0aC9oZWlnaHRcclxuICAgICAgICAgICAgdmFyIHByb3Bvc2FsID0gKG1vdmVtZW50ICogMTAwKSAvIGRhdGEuYmFzZVNpemU7XHJcbiAgICAgICAgICAgIG1vdmVIYW5kbGVzKG1vdmVtZW50ID4gMCwgcHJvcG9zYWwsIGRhdGEubG9jYXRpb25zLCBkYXRhLmhhbmRsZU51bWJlcnMsIGRhdGEuY29ubmVjdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFVuYmluZCBtb3ZlIGV2ZW50cyBvbiBkb2N1bWVudCwgY2FsbCBjYWxsYmFja3MuXHJcbiAgICAgICAgZnVuY3Rpb24gZXZlbnRFbmQoZXZlbnQsIGRhdGEpIHtcclxuICAgICAgICAgICAgLy8gVGhlIGhhbmRsZSBpcyBubyBsb25nZXIgYWN0aXZlLCBzbyByZW1vdmUgdGhlIGNsYXNzLlxyXG4gICAgICAgICAgICBpZiAoZGF0YS5oYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgIHJlbW92ZUNsYXNzKGRhdGEuaGFuZGxlLCBvcHRpb25zLmNzc0NsYXNzZXMuYWN0aXZlKTtcclxuICAgICAgICAgICAgICAgIHNjb3BlX0FjdGl2ZUhhbmRsZXNDb3VudCAtPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFVuYmluZCB0aGUgbW92ZSBhbmQgZW5kIGV2ZW50cywgd2hpY2ggYXJlIGFkZGVkIG9uICdzdGFydCcuXHJcbiAgICAgICAgICAgIGRhdGEubGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlX0RvY3VtZW50RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGNbMF0sIGNbMV0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKHNjb3BlX0FjdGl2ZUhhbmRsZXNDb3VudCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGRyYWdnaW5nIGNsYXNzLlxyXG4gICAgICAgICAgICAgICAgcmVtb3ZlQ2xhc3Moc2NvcGVfVGFyZ2V0LCBvcHRpb25zLmNzc0NsYXNzZXMuZHJhZyk7XHJcbiAgICAgICAgICAgICAgICBzZXRaaW5kZXgoKTtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBjdXJzb3Igc3R5bGVzIGFuZCB0ZXh0LXNlbGVjdGlvbiBldmVudHMgYm91bmQgdG8gdGhlIGJvZHkuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuY3Vyc29yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVfQm9keS5zdHlsZS5jdXJzb3IgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlX0JvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInNlbGVjdHN0YXJ0XCIsIHByZXZlbnREZWZhdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5ldmVudHMuc21vb3RoU3RlcHMpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEuaGFuZGxlTnVtYmVycy5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVOdW1iZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRIYW5kbGUoaGFuZGxlTnVtYmVyLCBzY29wZV9Mb2NhdGlvbnNbaGFuZGxlTnVtYmVyXSwgdHJ1ZSwgdHJ1ZSwgZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5oYW5kbGVOdW1iZXJzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZU51bWJlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpcmVFdmVudChcInVwZGF0ZVwiLCBoYW5kbGVOdW1iZXIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGF0YS5oYW5kbGVOdW1iZXJzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZU51bWJlcikge1xyXG4gICAgICAgICAgICAgICAgZmlyZUV2ZW50KFwiY2hhbmdlXCIsIGhhbmRsZU51bWJlcik7XHJcbiAgICAgICAgICAgICAgICBmaXJlRXZlbnQoXCJzZXRcIiwgaGFuZGxlTnVtYmVyKTtcclxuICAgICAgICAgICAgICAgIGZpcmVFdmVudChcImVuZFwiLCBoYW5kbGVOdW1iZXIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQmluZCBtb3ZlIGV2ZW50cyBvbiBkb2N1bWVudC5cclxuICAgICAgICBmdW5jdGlvbiBldmVudFN0YXJ0KGV2ZW50LCBkYXRhKSB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZSBldmVudCBpZiBhbnkgaGFuZGxlIGlzIGRpc2FibGVkXHJcbiAgICAgICAgICAgIGlmIChkYXRhLmhhbmRsZU51bWJlcnMuc29tZShpc0hhbmRsZURpc2FibGVkKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBoYW5kbGU7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLmhhbmRsZU51bWJlcnMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlT3JpZ2luID0gc2NvcGVfSGFuZGxlc1tkYXRhLmhhbmRsZU51bWJlcnNbMF1dO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlID0gaGFuZGxlT3JpZ2luLmNoaWxkcmVuWzBdO1xyXG4gICAgICAgICAgICAgICAgc2NvcGVfQWN0aXZlSGFuZGxlc0NvdW50ICs9IDE7XHJcbiAgICAgICAgICAgICAgICAvLyBNYXJrIHRoZSBoYW5kbGUgYXMgJ2FjdGl2ZScgc28gaXQgY2FuIGJlIHN0eWxlZC5cclxuICAgICAgICAgICAgICAgIGFkZENsYXNzKGhhbmRsZSwgb3B0aW9ucy5jc3NDbGFzc2VzLmFjdGl2ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQSBkcmFnIHNob3VsZCBuZXZlciBwcm9wYWdhdGUgdXAgdG8gdGhlICd0YXAnIGV2ZW50LlxyXG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBldmVudCBsaXN0ZW5lcnMuXHJcbiAgICAgICAgICAgIHZhciBsaXN0ZW5lcnMgPSBbXTtcclxuICAgICAgICAgICAgLy8gQXR0YWNoIHRoZSBtb3ZlIGFuZCBlbmQgZXZlbnRzLlxyXG4gICAgICAgICAgICB2YXIgbW92ZUV2ZW50ID0gYXR0YWNoRXZlbnQoYWN0aW9ucy5tb3ZlLCBzY29wZV9Eb2N1bWVudEVsZW1lbnQsIGV2ZW50TW92ZSwge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlIGV2ZW50IHRhcmdldCBoYXMgY2hhbmdlZCBzbyB3ZSBuZWVkIHRvIHByb3BhZ2F0ZSB0aGUgb3JpZ2luYWwgb25lIHNvIHRoYXQgd2Uga2VlcFxyXG4gICAgICAgICAgICAgICAgLy8gcmVseWluZyBvbiBpdCB0byBleHRyYWN0IHRhcmdldCB0b3VjaGVzLlxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBldmVudC50YXJnZXQsXHJcbiAgICAgICAgICAgICAgICBoYW5kbGU6IGhhbmRsZSxcclxuICAgICAgICAgICAgICAgIGNvbm5lY3Q6IGRhdGEuY29ubmVjdCxcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyczogbGlzdGVuZXJzLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRDYWxjUG9pbnQ6IGV2ZW50LmNhbGNQb2ludCxcclxuICAgICAgICAgICAgICAgIGJhc2VTaXplOiBiYXNlU2l6ZSgpLFxyXG4gICAgICAgICAgICAgICAgcGFnZU9mZnNldDogZXZlbnQucGFnZU9mZnNldCxcclxuICAgICAgICAgICAgICAgIGhhbmRsZU51bWJlcnM6IGRhdGEuaGFuZGxlTnVtYmVycyxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbnNQcm9wZXJ0eTogZXZlbnQuYnV0dG9ucyxcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uczogc2NvcGVfTG9jYXRpb25zLnNsaWNlKCksXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB2YXIgZW5kRXZlbnQgPSBhdHRhY2hFdmVudChhY3Rpb25zLmVuZCwgc2NvcGVfRG9jdW1lbnRFbGVtZW50LCBldmVudEVuZCwge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBldmVudC50YXJnZXQsXHJcbiAgICAgICAgICAgICAgICBoYW5kbGU6IGhhbmRsZSxcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyczogbGlzdGVuZXJzLFxyXG4gICAgICAgICAgICAgICAgZG9Ob3RSZWplY3Q6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBoYW5kbGVOdW1iZXJzOiBkYXRhLmhhbmRsZU51bWJlcnMsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB2YXIgb3V0RXZlbnQgPSBhdHRhY2hFdmVudChcIm1vdXNlb3V0XCIsIHNjb3BlX0RvY3VtZW50RWxlbWVudCwgZG9jdW1lbnRMZWF2ZSwge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBldmVudC50YXJnZXQsXHJcbiAgICAgICAgICAgICAgICBoYW5kbGU6IGhhbmRsZSxcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyczogbGlzdGVuZXJzLFxyXG4gICAgICAgICAgICAgICAgZG9Ob3RSZWplY3Q6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBoYW5kbGVOdW1iZXJzOiBkYXRhLmhhbmRsZU51bWJlcnMsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHRvIG1ha2Ugc3VyZSB3ZSBwdXNoZWQgdGhlIGxpc3RlbmVycyBpbiB0aGUgbGlzdGVuZXIgbGlzdCByYXRoZXIgdGhhbiBjcmVhdGluZ1xyXG4gICAgICAgICAgICAvLyBhIG5ldyBvbmUgYXMgaXQgaGFzIGFscmVhZHkgYmVlbiBwYXNzZWQgdG8gdGhlIGV2ZW50IGhhbmRsZXJzLlxyXG4gICAgICAgICAgICBsaXN0ZW5lcnMucHVzaC5hcHBseShsaXN0ZW5lcnMsIG1vdmVFdmVudC5jb25jYXQoZW5kRXZlbnQsIG91dEV2ZW50KSk7XHJcbiAgICAgICAgICAgIC8vIFRleHQgc2VsZWN0aW9uIGlzbid0IGFuIGlzc3VlIG9uIHRvdWNoIGRldmljZXMsXHJcbiAgICAgICAgICAgIC8vIHNvIGFkZGluZyBjdXJzb3Igc3R5bGVzIGNhbiBiZSBza2lwcGVkLlxyXG4gICAgICAgICAgICBpZiAoZXZlbnQuY3Vyc29yKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IHRoZSAnSScgY3Vyc29yIGFuZCBleHRlbmQgdGhlIHJhbmdlLWRyYWcgY3Vyc29yLlxyXG4gICAgICAgICAgICAgICAgc2NvcGVfQm9keS5zdHlsZS5jdXJzb3IgPSBnZXRDb21wdXRlZFN0eWxlKGV2ZW50LnRhcmdldCkuY3Vyc29yO1xyXG4gICAgICAgICAgICAgICAgLy8gTWFyayB0aGUgdGFyZ2V0IHdpdGggYSBkcmFnZ2luZyBzdGF0ZS5cclxuICAgICAgICAgICAgICAgIGlmIChzY29wZV9IYW5kbGVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBhZGRDbGFzcyhzY29wZV9UYXJnZXQsIG9wdGlvbnMuY3NzQ2xhc3Nlcy5kcmFnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgdGV4dCBzZWxlY3Rpb24gd2hlbiBkcmFnZ2luZyB0aGUgaGFuZGxlcy5cclxuICAgICAgICAgICAgICAgIC8vIEluIG5vVWlTbGlkZXIgPD0gOS4yLjAsIHRoaXMgd2FzIGhhbmRsZWQgYnkgY2FsbGluZyBwcmV2ZW50RGVmYXVsdCBvbiBtb3VzZS90b3VjaCBzdGFydC9tb3ZlLFxyXG4gICAgICAgICAgICAgICAgLy8gd2hpY2ggaXMgc2Nyb2xsIGJsb2NraW5nLiBUaGUgc2VsZWN0c3RhcnQgZXZlbnQgaXMgc3VwcG9ydGVkIGJ5IEZpcmVGb3ggc3RhcnRpbmcgZnJvbSB2ZXJzaW9uIDUyLFxyXG4gICAgICAgICAgICAgICAgLy8gbWVhbmluZyB0aGUgb25seSBob2xkb3V0IGlzIGlPUyBTYWZhcmkuIFRoaXMgZG9lc24ndCBtYXR0ZXI6IHRleHQgc2VsZWN0aW9uIGlzbid0IHRyaWdnZXJlZCB0aGVyZS5cclxuICAgICAgICAgICAgICAgIC8vIFRoZSAnY3Vyc29yJyBmbGFnIGlzIGZhbHNlLlxyXG4gICAgICAgICAgICAgICAgLy8gU2VlOiBodHRwOi8vY2FuaXVzZS5jb20vI3NlYXJjaD1zZWxlY3RzdGFydFxyXG4gICAgICAgICAgICAgICAgc2NvcGVfQm9keS5hZGRFdmVudExpc3RlbmVyKFwic2VsZWN0c3RhcnRcIiwgcHJldmVudERlZmF1bHQsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkYXRhLmhhbmRsZU51bWJlcnMuZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlTnVtYmVyKSB7XHJcbiAgICAgICAgICAgICAgICBmaXJlRXZlbnQoXCJzdGFydFwiLCBoYW5kbGVOdW1iZXIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTW92ZSBjbG9zZXN0IGhhbmRsZSB0byB0YXBwZWQgbG9jYXRpb24uXHJcbiAgICAgICAgZnVuY3Rpb24gZXZlbnRUYXAoZXZlbnQpIHtcclxuICAgICAgICAgICAgLy8gVGhlIHRhcCBldmVudCBzaG91bGRuJ3QgcHJvcGFnYXRlIHVwXHJcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICB2YXIgcHJvcG9zYWwgPSBjYWxjUG9pbnRUb1BlcmNlbnRhZ2UoZXZlbnQuY2FsY1BvaW50KTtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZU51bWJlciA9IGdldENsb3Nlc3RIYW5kbGUocHJvcG9zYWwpO1xyXG4gICAgICAgICAgICAvLyBUYWNrbGUgdGhlIGNhc2UgdGhhdCBhbGwgaGFuZGxlcyBhcmUgJ2Rpc2FibGVkJy5cclxuICAgICAgICAgICAgaWYgKGhhbmRsZU51bWJlciA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGbGFnIHRoZSBzbGlkZXIgYXMgaXQgaXMgbm93IGluIGEgdHJhbnNpdGlvbmFsIHN0YXRlLlxyXG4gICAgICAgICAgICAvLyBUcmFuc2l0aW9uIHRha2VzIGEgY29uZmlndXJhYmxlIGFtb3VudCBvZiBtcyAoZGVmYXVsdCAzMDApLiBSZS1lbmFibGUgdGhlIHNsaWRlciBhZnRlciB0aGF0LlxyXG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuZXZlbnRzLnNuYXApIHtcclxuICAgICAgICAgICAgICAgIGFkZENsYXNzRm9yKHNjb3BlX1RhcmdldCwgb3B0aW9ucy5jc3NDbGFzc2VzLnRhcCwgb3B0aW9ucy5hbmltYXRpb25EdXJhdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2V0SGFuZGxlKGhhbmRsZU51bWJlciwgcHJvcG9zYWwsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICBzZXRaaW5kZXgoKTtcclxuICAgICAgICAgICAgZmlyZUV2ZW50KFwic2xpZGVcIiwgaGFuZGxlTnVtYmVyLCB0cnVlKTtcclxuICAgICAgICAgICAgZmlyZUV2ZW50KFwidXBkYXRlXCIsIGhhbmRsZU51bWJlciwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5ldmVudHMuc25hcCkge1xyXG4gICAgICAgICAgICAgICAgZmlyZUV2ZW50KFwiY2hhbmdlXCIsIGhhbmRsZU51bWJlciwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBmaXJlRXZlbnQoXCJzZXRcIiwgaGFuZGxlTnVtYmVyLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50U3RhcnQoZXZlbnQsIHsgaGFuZGxlTnVtYmVyczogW2hhbmRsZU51bWJlcl0gfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRmlyZXMgYSAnaG92ZXInIGV2ZW50IGZvciBhIGhvdmVyZWQgbW91c2UvcGVuIHBvc2l0aW9uLlxyXG4gICAgICAgIGZ1bmN0aW9uIGV2ZW50SG92ZXIoZXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIHByb3Bvc2FsID0gY2FsY1BvaW50VG9QZXJjZW50YWdlKGV2ZW50LmNhbGNQb2ludCk7XHJcbiAgICAgICAgICAgIHZhciB0byA9IHNjb3BlX1NwZWN0cnVtLmdldFN0ZXAocHJvcG9zYWwpO1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBzY29wZV9TcGVjdHJ1bS5mcm9tU3RlcHBpbmcodG8pO1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzY29wZV9FdmVudHMpLmZvckVhY2goZnVuY3Rpb24gKHRhcmdldEV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoXCJob3ZlclwiID09PSB0YXJnZXRFdmVudC5zcGxpdChcIi5cIilbMF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzY29wZV9FdmVudHNbdGFyZ2V0RXZlbnRdLmZvckVhY2goZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoc2NvcGVfU2VsZiwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gSGFuZGxlcyBrZXlkb3duIG9uIGZvY3VzZWQgaGFuZGxlc1xyXG4gICAgICAgIC8vIERvbid0IG1vdmUgdGhlIGRvY3VtZW50IHdoZW4gcHJlc3NpbmcgYXJyb3cga2V5cyBvbiBmb2N1c2VkIGhhbmRsZXNcclxuICAgICAgICBmdW5jdGlvbiBldmVudEtleWRvd24oZXZlbnQsIGhhbmRsZU51bWJlcikge1xyXG4gICAgICAgICAgICBpZiAoaXNTbGlkZXJEaXNhYmxlZCgpIHx8IGlzSGFuZGxlRGlzYWJsZWQoaGFuZGxlTnVtYmVyKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBob3Jpem9udGFsS2V5cyA9IFtcIkxlZnRcIiwgXCJSaWdodFwiXTtcclxuICAgICAgICAgICAgdmFyIHZlcnRpY2FsS2V5cyA9IFtcIkRvd25cIiwgXCJVcFwiXTtcclxuICAgICAgICAgICAgdmFyIGxhcmdlU3RlcEtleXMgPSBbXCJQYWdlRG93blwiLCBcIlBhZ2VVcFwiXTtcclxuICAgICAgICAgICAgdmFyIGVkZ2VLZXlzID0gW1wiSG9tZVwiLCBcIkVuZFwiXTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZGlyICYmICFvcHRpb25zLm9ydCkge1xyXG4gICAgICAgICAgICAgICAgLy8gT24gYW4gcmlnaHQtdG8tbGVmdCBzbGlkZXIsIHRoZSBsZWZ0IGFuZCByaWdodCBrZXlzIGFjdCBpbnZlcnRlZFxyXG4gICAgICAgICAgICAgICAgaG9yaXpvbnRhbEtleXMucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnMub3J0ICYmICFvcHRpb25zLmRpcikge1xyXG4gICAgICAgICAgICAgICAgLy8gT24gYSB0b3AtdG8tYm90dG9tIHNsaWRlciwgdGhlIHVwIGFuZCBkb3duIGtleXMgYWN0IGludmVydGVkXHJcbiAgICAgICAgICAgICAgICB2ZXJ0aWNhbEtleXMucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICAgICAgbGFyZ2VTdGVwS2V5cy5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gU3RyaXAgXCJBcnJvd1wiIGZvciBJRSBjb21wYXRpYmlsaXR5LiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvS2V5Ym9hcmRFdmVudC9rZXlcclxuICAgICAgICAgICAgdmFyIGtleSA9IGV2ZW50LmtleS5yZXBsYWNlKFwiQXJyb3dcIiwgXCJcIik7XHJcbiAgICAgICAgICAgIHZhciBpc0xhcmdlRG93biA9IGtleSA9PT0gbGFyZ2VTdGVwS2V5c1swXTtcclxuICAgICAgICAgICAgdmFyIGlzTGFyZ2VVcCA9IGtleSA9PT0gbGFyZ2VTdGVwS2V5c1sxXTtcclxuICAgICAgICAgICAgdmFyIGlzRG93biA9IGtleSA9PT0gdmVydGljYWxLZXlzWzBdIHx8IGtleSA9PT0gaG9yaXpvbnRhbEtleXNbMF0gfHwgaXNMYXJnZURvd247XHJcbiAgICAgICAgICAgIHZhciBpc1VwID0ga2V5ID09PSB2ZXJ0aWNhbEtleXNbMV0gfHwga2V5ID09PSBob3Jpem9udGFsS2V5c1sxXSB8fCBpc0xhcmdlVXA7XHJcbiAgICAgICAgICAgIHZhciBpc01pbiA9IGtleSA9PT0gZWRnZUtleXNbMF07XHJcbiAgICAgICAgICAgIHZhciBpc01heCA9IGtleSA9PT0gZWRnZUtleXNbMV07XHJcbiAgICAgICAgICAgIGlmICghaXNEb3duICYmICFpc1VwICYmICFpc01pbiAmJiAhaXNNYXgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHZhciB0bztcclxuICAgICAgICAgICAgaWYgKGlzVXAgfHwgaXNEb3duKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGlyZWN0aW9uID0gaXNEb3duID8gMCA6IDE7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RlcHMgPSBnZXROZXh0U3RlcHNGb3JIYW5kbGUoaGFuZGxlTnVtYmVyKTtcclxuICAgICAgICAgICAgICAgIHZhciBzdGVwID0gc3RlcHNbZGlyZWN0aW9uXTtcclxuICAgICAgICAgICAgICAgIC8vIEF0IHRoZSBlZGdlIG9mIGEgc2xpZGVyLCBkbyBub3RoaW5nXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RlcCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIE5vIHN0ZXAgc2V0LCB1c2UgdGhlIGRlZmF1bHQgb2YgMTAlIG9mIHRoZSBzdWItcmFuZ2VcclxuICAgICAgICAgICAgICAgIGlmIChzdGVwID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXAgPSBzY29wZV9TcGVjdHJ1bS5nZXREZWZhdWx0U3RlcChzY29wZV9Mb2NhdGlvbnNbaGFuZGxlTnVtYmVyXSwgaXNEb3duLCBvcHRpb25zLmtleWJvYXJkRGVmYXVsdFN0ZXApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzTGFyZ2VVcCB8fCBpc0xhcmdlRG93bikge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXAgKj0gb3B0aW9ucy5rZXlib2FyZFBhZ2VNdWx0aXBsaWVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcCAqPSBvcHRpb25zLmtleWJvYXJkTXVsdGlwbGllcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFN0ZXAgb3ZlciB6ZXJvLWxlbmd0aCByYW5nZXMgKCM5NDgpO1xyXG4gICAgICAgICAgICAgICAgc3RlcCA9IE1hdGgubWF4KHN0ZXAsIDAuMDAwMDAwMSk7XHJcbiAgICAgICAgICAgICAgICAvLyBEZWNyZW1lbnQgZm9yIGRvd24gc3RlcHNcclxuICAgICAgICAgICAgICAgIHN0ZXAgPSAoaXNEb3duID8gLTEgOiAxKSAqIHN0ZXA7XHJcbiAgICAgICAgICAgICAgICB0byA9IHNjb3BlX1ZhbHVlc1toYW5kbGVOdW1iZXJdICsgc3RlcDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChpc01heCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRW5kIGtleVxyXG4gICAgICAgICAgICAgICAgdG8gPSBvcHRpb25zLnNwZWN0cnVtLnhWYWxbb3B0aW9ucy5zcGVjdHJ1bS54VmFsLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gSG9tZSBrZXlcclxuICAgICAgICAgICAgICAgIHRvID0gb3B0aW9ucy5zcGVjdHJ1bS54VmFsWzBdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNldEhhbmRsZShoYW5kbGVOdW1iZXIsIHNjb3BlX1NwZWN0cnVtLnRvU3RlcHBpbmcodG8pLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgZmlyZUV2ZW50KFwic2xpZGVcIiwgaGFuZGxlTnVtYmVyKTtcclxuICAgICAgICAgICAgZmlyZUV2ZW50KFwidXBkYXRlXCIsIGhhbmRsZU51bWJlcik7XHJcbiAgICAgICAgICAgIGZpcmVFdmVudChcImNoYW5nZVwiLCBoYW5kbGVOdW1iZXIpO1xyXG4gICAgICAgICAgICBmaXJlRXZlbnQoXCJzZXRcIiwgaGFuZGxlTnVtYmVyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBBdHRhY2ggZXZlbnRzIHRvIHNldmVyYWwgc2xpZGVyIHBhcnRzLlxyXG4gICAgICAgIGZ1bmN0aW9uIGJpbmRTbGlkZXJFdmVudHMoYmVoYXZpb3VyKSB7XHJcbiAgICAgICAgICAgIC8vIEF0dGFjaCB0aGUgc3RhbmRhcmQgZHJhZyBldmVudCB0byB0aGUgaGFuZGxlcy5cclxuICAgICAgICAgICAgaWYgKCFiZWhhdmlvdXIuZml4ZWQpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlX0hhbmRsZXMuZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZXNlIGV2ZW50cyBhcmUgb25seSBib3VuZCB0byB0aGUgdmlzdWFsIGhhbmRsZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVsZW1lbnQsIG5vdCB0aGUgJ3JlYWwnIG9yaWdpbiBlbGVtZW50LlxyXG4gICAgICAgICAgICAgICAgICAgIGF0dGFjaEV2ZW50KGFjdGlvbnMuc3RhcnQsIGhhbmRsZS5jaGlsZHJlblswXSwgZXZlbnRTdGFydCwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVOdW1iZXJzOiBbaW5kZXhdLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQXR0YWNoIHRoZSB0YXAgZXZlbnQgdG8gdGhlIHNsaWRlciBiYXNlLlxyXG4gICAgICAgICAgICBpZiAoYmVoYXZpb3VyLnRhcCkge1xyXG4gICAgICAgICAgICAgICAgYXR0YWNoRXZlbnQoYWN0aW9ucy5zdGFydCwgc2NvcGVfQmFzZSwgZXZlbnRUYXAsIHt9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGaXJlIGhvdmVyIGV2ZW50c1xyXG4gICAgICAgICAgICBpZiAoYmVoYXZpb3VyLmhvdmVyKSB7XHJcbiAgICAgICAgICAgICAgICBhdHRhY2hFdmVudChhY3Rpb25zLm1vdmUsIHNjb3BlX0Jhc2UsIGV2ZW50SG92ZXIsIHtcclxuICAgICAgICAgICAgICAgICAgICBob3ZlcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE1ha2UgdGhlIHJhbmdlIGRyYWdnYWJsZS5cclxuICAgICAgICAgICAgaWYgKGJlaGF2aW91ci5kcmFnKSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZV9Db25uZWN0cy5mb3JFYWNoKGZ1bmN0aW9uIChjb25uZWN0LCBpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25uZWN0ID09PSBmYWxzZSB8fCBpbmRleCA9PT0gMCB8fCBpbmRleCA9PT0gc2NvcGVfQ29ubmVjdHMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoYW5kbGVCZWZvcmUgPSBzY29wZV9IYW5kbGVzW2luZGV4IC0gMV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhbmRsZUFmdGVyID0gc2NvcGVfSGFuZGxlc1tpbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV2ZW50SG9sZGVycyA9IFtjb25uZWN0XTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFuZGxlc1RvRHJhZyA9IFtoYW5kbGVCZWZvcmUsIGhhbmRsZUFmdGVyXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFuZGxlTnVtYmVyc1RvRHJhZyA9IFtpbmRleCAtIDEsIGluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICBhZGRDbGFzcyhjb25uZWN0LCBvcHRpb25zLmNzc0NsYXNzZXMuZHJhZ2dhYmxlKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIHRoZSByYW5nZSBpcyBmaXhlZCwgdGhlIGVudGlyZSByYW5nZSBjYW5cclxuICAgICAgICAgICAgICAgICAgICAvLyBiZSBkcmFnZ2VkIGJ5IHRoZSBoYW5kbGVzLiBUaGUgaGFuZGxlIGluIHRoZSBmaXJzdFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIG9yaWdpbiB3aWxsIHByb3BhZ2F0ZSB0aGUgc3RhcnQgZXZlbnQgdXB3YXJkLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJ1dCBpdCBuZWVkcyB0byBiZSBib3VuZCBtYW51YWxseSBvbiB0aGUgb3RoZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJlaGF2aW91ci5maXhlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudEhvbGRlcnMucHVzaChoYW5kbGVCZWZvcmUuY2hpbGRyZW5bMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudEhvbGRlcnMucHVzaChoYW5kbGVBZnRlci5jaGlsZHJlblswXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiZWhhdmlvdXIuZHJhZ0FsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVzVG9EcmFnID0gc2NvcGVfSGFuZGxlcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlTnVtYmVyc1RvRHJhZyA9IHNjb3BlX0hhbmRsZU51bWJlcnM7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SG9sZGVycy5mb3JFYWNoKGZ1bmN0aW9uIChldmVudEhvbGRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRhY2hFdmVudChhY3Rpb25zLnN0YXJ0LCBldmVudEhvbGRlciwgZXZlbnRTdGFydCwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlczogaGFuZGxlc1RvRHJhZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZU51bWJlcnM6IGhhbmRsZU51bWJlcnNUb0RyYWcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0OiBjb25uZWN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEF0dGFjaCBhbiBldmVudCB0byB0aGlzIHNsaWRlciwgcG9zc2libHkgaW5jbHVkaW5nIGEgbmFtZXNwYWNlXHJcbiAgICAgICAgZnVuY3Rpb24gYmluZEV2ZW50KG5hbWVzcGFjZWRFdmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgc2NvcGVfRXZlbnRzW25hbWVzcGFjZWRFdmVudF0gPSBzY29wZV9FdmVudHNbbmFtZXNwYWNlZEV2ZW50XSB8fCBbXTtcclxuICAgICAgICAgICAgc2NvcGVfRXZlbnRzW25hbWVzcGFjZWRFdmVudF0ucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIC8vIElmIHRoZSBldmVudCBib3VuZCBpcyAndXBkYXRlLCcgZmlyZSBpdCBpbW1lZGlhdGVseSBmb3IgYWxsIGhhbmRsZXMuXHJcbiAgICAgICAgICAgIGlmIChuYW1lc3BhY2VkRXZlbnQuc3BsaXQoXCIuXCIpWzBdID09PSBcInVwZGF0ZVwiKSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZV9IYW5kbGVzLmZvckVhY2goZnVuY3Rpb24gKGEsIGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlyZUV2ZW50KFwidXBkYXRlXCIsIGluZGV4KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGlzSW50ZXJuYWxOYW1lc3BhY2UobmFtZXNwYWNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuYW1lc3BhY2UgPT09IElOVEVSTkFMX0VWRU5UX05TLmFyaWEgfHwgbmFtZXNwYWNlID09PSBJTlRFUk5BTF9FVkVOVF9OUy50b29sdGlwcztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVW5kbyBhdHRhY2htZW50IG9mIGV2ZW50XHJcbiAgICAgICAgZnVuY3Rpb24gcmVtb3ZlRXZlbnQobmFtZXNwYWNlZEV2ZW50KSB7XHJcbiAgICAgICAgICAgIHZhciBldmVudCA9IG5hbWVzcGFjZWRFdmVudCAmJiBuYW1lc3BhY2VkRXZlbnQuc3BsaXQoXCIuXCIpWzBdO1xyXG4gICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gZXZlbnQgPyBuYW1lc3BhY2VkRXZlbnQuc3Vic3RyaW5nKGV2ZW50Lmxlbmd0aCkgOiBuYW1lc3BhY2VkRXZlbnQ7XHJcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNjb3BlX0V2ZW50cykuZm9yRWFjaChmdW5jdGlvbiAoYmluZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRFdmVudCA9IGJpbmQuc3BsaXQoXCIuXCIpWzBdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHROYW1lc3BhY2UgPSBiaW5kLnN1YnN0cmluZyh0RXZlbnQubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGlmICgoIWV2ZW50IHx8IGV2ZW50ID09PSB0RXZlbnQpICYmICghbmFtZXNwYWNlIHx8IG5hbWVzcGFjZSA9PT0gdE5hbWVzcGFjZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IGRlbGV0ZSBwcm90ZWN0ZWQgaW50ZXJuYWwgZXZlbnQgaWYgaW50ZW50aW9uYWxcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzSW50ZXJuYWxOYW1lc3BhY2UodE5hbWVzcGFjZSkgfHwgbmFtZXNwYWNlID09PSB0TmFtZXNwYWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzY29wZV9FdmVudHNbYmluZF07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRXh0ZXJuYWwgZXZlbnQgaGFuZGxpbmdcclxuICAgICAgICBmdW5jdGlvbiBmaXJlRXZlbnQoZXZlbnROYW1lLCBoYW5kbGVOdW1iZXIsIHRhcCkge1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzY29wZV9FdmVudHMpLmZvckVhY2goZnVuY3Rpb24gKHRhcmdldEV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRUeXBlID0gdGFyZ2V0RXZlbnQuc3BsaXQoXCIuXCIpWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50TmFtZSA9PT0gZXZlbnRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVfRXZlbnRzW3RhcmdldEV2ZW50XS5mb3JFYWNoKGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIHNsaWRlciBwdWJsaWMgQVBJIGFzIHRoZSBzY29wZSAoJ3RoaXMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZV9TZWxmLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHZhbHVlcyBhcyBhcnJheSwgc28gYXJnXzFbYXJnXzJdIGlzIGFsd2F5cyB2YWxpZC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVfVmFsdWVzLm1hcChvcHRpb25zLmZvcm1hdC50byksIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIYW5kbGUgaW5kZXgsIDAgb3IgMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVOdW1iZXIsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVbi1mb3JtYXR0ZWQgc2xpZGVyIHZhbHVlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZV9WYWx1ZXMuc2xpY2UoKSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV2ZW50IGlzIGZpcmVkIGJ5IHRhcCwgdHJ1ZSBvciBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXAgfHwgZmFsc2UsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBMZWZ0IG9mZnNldCBvZiB0aGUgaGFuZGxlLCBpbiByZWxhdGlvbiB0byB0aGUgc2xpZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlX0xvY2F0aW9ucy5zbGljZSgpLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWRkIHRoZSBzbGlkZXIgcHVibGljIEFQSSB0byBhbiBhY2Nlc3NpYmxlIHBhcmFtZXRlciB3aGVuIHRoaXMgaXMgdW5hdmFpbGFibGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVfU2VsZik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBTcGxpdCBvdXQgdGhlIGhhbmRsZSBwb3NpdGlvbmluZyBsb2dpYyBzbyB0aGUgTW92ZSBldmVudCBjYW4gdXNlIGl0LCB0b29cclxuICAgICAgICBmdW5jdGlvbiBjaGVja0hhbmRsZVBvc2l0aW9uKHJlZmVyZW5jZSwgaGFuZGxlTnVtYmVyLCB0bywgbG9va0JhY2t3YXJkLCBsb29rRm9yd2FyZCwgZ2V0VmFsdWUsIHNtb290aFN0ZXBzKSB7XHJcbiAgICAgICAgICAgIHZhciBkaXN0YW5jZTtcclxuICAgICAgICAgICAgLy8gRm9yIHNsaWRlcnMgd2l0aCBtdWx0aXBsZSBoYW5kbGVzLCBsaW1pdCBtb3ZlbWVudCB0byB0aGUgb3RoZXIgaGFuZGxlLlxyXG4gICAgICAgICAgICAvLyBBcHBseSB0aGUgbWFyZ2luIG9wdGlvbiBieSBhZGRpbmcgaXQgdG8gdGhlIGhhbmRsZSBwb3NpdGlvbnMuXHJcbiAgICAgICAgICAgIGlmIChzY29wZV9IYW5kbGVzLmxlbmd0aCA+IDEgJiYgIW9wdGlvbnMuZXZlbnRzLnVuY29uc3RyYWluZWQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChsb29rQmFja3dhcmQgJiYgaGFuZGxlTnVtYmVyID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gc2NvcGVfU3BlY3RydW0uZ2V0QWJzb2x1dGVEaXN0YW5jZShyZWZlcmVuY2VbaGFuZGxlTnVtYmVyIC0gMV0sIG9wdGlvbnMubWFyZ2luLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBNYXRoLm1heCh0bywgZGlzdGFuY2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGxvb2tGb3J3YXJkICYmIGhhbmRsZU51bWJlciA8IHNjb3BlX0hhbmRsZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gc2NvcGVfU3BlY3RydW0uZ2V0QWJzb2x1dGVEaXN0YW5jZShyZWZlcmVuY2VbaGFuZGxlTnVtYmVyICsgMV0sIG9wdGlvbnMubWFyZ2luLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB0byA9IE1hdGgubWluKHRvLCBkaXN0YW5jZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gVGhlIGxpbWl0IG9wdGlvbiBoYXMgdGhlIG9wcG9zaXRlIGVmZmVjdCwgbGltaXRpbmcgaGFuZGxlcyB0byBhXHJcbiAgICAgICAgICAgIC8vIG1heGltdW0gZGlzdGFuY2UgZnJvbSBhbm90aGVyLiBMaW1pdCBtdXN0IGJlID4gMCwgYXMgb3RoZXJ3aXNlXHJcbiAgICAgICAgICAgIC8vIGhhbmRsZXMgd291bGQgYmUgdW5tb3ZhYmxlLlxyXG4gICAgICAgICAgICBpZiAoc2NvcGVfSGFuZGxlcy5sZW5ndGggPiAxICYmIG9wdGlvbnMubGltaXQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChsb29rQmFja3dhcmQgJiYgaGFuZGxlTnVtYmVyID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gc2NvcGVfU3BlY3RydW0uZ2V0QWJzb2x1dGVEaXN0YW5jZShyZWZlcmVuY2VbaGFuZGxlTnVtYmVyIC0gMV0sIG9wdGlvbnMubGltaXQsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICB0byA9IE1hdGgubWluKHRvLCBkaXN0YW5jZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobG9va0ZvcndhcmQgJiYgaGFuZGxlTnVtYmVyIDwgc2NvcGVfSGFuZGxlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlzdGFuY2UgPSBzY29wZV9TcGVjdHJ1bS5nZXRBYnNvbHV0ZURpc3RhbmNlKHJlZmVyZW5jZVtoYW5kbGVOdW1iZXIgKyAxXSwgb3B0aW9ucy5saW1pdCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdG8gPSBNYXRoLm1heCh0bywgZGlzdGFuY2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFRoZSBwYWRkaW5nIG9wdGlvbiBrZWVwcyB0aGUgaGFuZGxlcyBhIGNlcnRhaW4gZGlzdGFuY2UgZnJvbSB0aGVcclxuICAgICAgICAgICAgLy8gZWRnZXMgb2YgdGhlIHNsaWRlci4gUGFkZGluZyBtdXN0IGJlID4gMC5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGFkZGluZykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZU51bWJlciA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gc2NvcGVfU3BlY3RydW0uZ2V0QWJzb2x1dGVEaXN0YW5jZSgwLCBvcHRpb25zLnBhZGRpbmdbMF0sIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICB0byA9IE1hdGgubWF4KHRvLCBkaXN0YW5jZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlTnVtYmVyID09PSBzY29wZV9IYW5kbGVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBkaXN0YW5jZSA9IHNjb3BlX1NwZWN0cnVtLmdldEFic29sdXRlRGlzdGFuY2UoMTAwLCBvcHRpb25zLnBhZGRpbmdbMV0sIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvID0gTWF0aC5taW4odG8sIGRpc3RhbmNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXNtb290aFN0ZXBzKSB7XHJcbiAgICAgICAgICAgICAgICB0byA9IHNjb3BlX1NwZWN0cnVtLmdldFN0ZXAodG8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIExpbWl0IHBlcmNlbnRhZ2UgdG8gdGhlIDAgLSAxMDAgcmFuZ2VcclxuICAgICAgICAgICAgdG8gPSBsaW1pdCh0byk7XHJcbiAgICAgICAgICAgIC8vIFJldHVybiBmYWxzZSBpZiBoYW5kbGUgY2FuJ3QgbW92ZVxyXG4gICAgICAgICAgICBpZiAodG8gPT09IHJlZmVyZW5jZVtoYW5kbGVOdW1iZXJdICYmICFnZXRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0bztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVXNlcyBzbGlkZXIgb3JpZW50YXRpb24gdG8gY3JlYXRlIENTUyBydWxlcy4gYSA9IGJhc2UgdmFsdWU7XHJcbiAgICAgICAgZnVuY3Rpb24gaW5SdWxlT3JkZXIodiwgYSkge1xyXG4gICAgICAgICAgICB2YXIgbyA9IG9wdGlvbnMub3J0O1xyXG4gICAgICAgICAgICByZXR1cm4gKG8gPyBhIDogdikgKyBcIiwgXCIgKyAobyA/IHYgOiBhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTW92ZXMgaGFuZGxlKHMpIGJ5IGEgcGVyY2VudGFnZVxyXG4gICAgICAgIC8vIChib29sLCAlIHRvIG1vdmUsIFslIHdoZXJlIGhhbmRsZSBzdGFydGVkLCAuLi5dLCBbaW5kZXggaW4gc2NvcGVfSGFuZGxlcywgLi4uXSlcclxuICAgICAgICBmdW5jdGlvbiBtb3ZlSGFuZGxlcyh1cHdhcmQsIHByb3Bvc2FsLCBsb2NhdGlvbnMsIGhhbmRsZU51bWJlcnMsIGNvbm5lY3QpIHtcclxuICAgICAgICAgICAgdmFyIHByb3Bvc2FscyA9IGxvY2F0aW9ucy5zbGljZSgpO1xyXG4gICAgICAgICAgICAvLyBTdG9yZSBmaXJzdCBoYW5kbGUgbm93LCBzbyB3ZSBzdGlsbCBoYXZlIGl0IGluIGNhc2UgaGFuZGxlTnVtYmVycyBpcyByZXZlcnNlZFxyXG4gICAgICAgICAgICB2YXIgZmlyc3RIYW5kbGUgPSBoYW5kbGVOdW1iZXJzWzBdO1xyXG4gICAgICAgICAgICB2YXIgc21vb3RoU3RlcHMgPSBvcHRpb25zLmV2ZW50cy5zbW9vdGhTdGVwcztcclxuICAgICAgICAgICAgdmFyIGIgPSBbIXVwd2FyZCwgdXB3YXJkXTtcclxuICAgICAgICAgICAgdmFyIGYgPSBbdXB3YXJkLCAhdXB3YXJkXTtcclxuICAgICAgICAgICAgLy8gQ29weSBoYW5kbGVOdW1iZXJzIHNvIHdlIGRvbid0IGNoYW5nZSB0aGUgZGF0YXNldFxyXG4gICAgICAgICAgICBoYW5kbGVOdW1iZXJzID0gaGFuZGxlTnVtYmVycy5zbGljZSgpO1xyXG4gICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgd2hpY2ggaGFuZGxlIGlzICdsZWFkaW5nJy5cclxuICAgICAgICAgICAgLy8gSWYgdGhhdCBvbmUgY2FuJ3QgbW92ZSB0aGUgc2Vjb25kIGNhbid0IGVpdGhlci5cclxuICAgICAgICAgICAgaWYgKHVwd2FyZCkge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlTnVtYmVycy5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gU3RlcCAxOiBnZXQgdGhlIG1heGltdW0gcGVyY2VudGFnZSB0aGF0IGFueSBvZiB0aGUgaGFuZGxlcyBjYW4gbW92ZVxyXG4gICAgICAgICAgICBpZiAoaGFuZGxlTnVtYmVycy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVOdW1iZXJzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZU51bWJlciwgbykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0byA9IGNoZWNrSGFuZGxlUG9zaXRpb24ocHJvcG9zYWxzLCBoYW5kbGVOdW1iZXIsIHByb3Bvc2Fsc1toYW5kbGVOdW1iZXJdICsgcHJvcG9zYWwsIGJbb10sIGZbb10sIGZhbHNlLCBzbW9vdGhTdGVwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU3RvcCBpZiBvbmUgb2YgdGhlIGhhbmRsZXMgY2FuJ3QgbW92ZS5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodG8gPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2FsID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2FsID0gdG8gLSBwcm9wb3NhbHNbaGFuZGxlTnVtYmVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcG9zYWxzW2hhbmRsZU51bWJlcl0gPSB0bztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBJZiB1c2luZyBvbmUgaGFuZGxlLCBjaGVjayBiYWNrd2FyZCBBTkQgZm9yd2FyZFxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGIgPSBmID0gW3RydWVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvLyBTdGVwIDI6IFRyeSB0byBzZXQgdGhlIGhhbmRsZXMgd2l0aCB0aGUgZm91bmQgcGVyY2VudGFnZVxyXG4gICAgICAgICAgICBoYW5kbGVOdW1iZXJzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZU51bWJlciwgbykge1xyXG4gICAgICAgICAgICAgICAgc3RhdGUgPVxyXG4gICAgICAgICAgICAgICAgICAgIHNldEhhbmRsZShoYW5kbGVOdW1iZXIsIGxvY2F0aW9uc1toYW5kbGVOdW1iZXJdICsgcHJvcG9zYWwsIGJbb10sIGZbb10sIGZhbHNlLCBzbW9vdGhTdGVwcykgfHwgc3RhdGU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBTdGVwIDM6IElmIGEgaGFuZGxlIG1vdmVkLCBmaXJlIGV2ZW50c1xyXG4gICAgICAgICAgICBpZiAoc3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZU51bWJlcnMuZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlTnVtYmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlyZUV2ZW50KFwidXBkYXRlXCIsIGhhbmRsZU51bWJlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlyZUV2ZW50KFwic2xpZGVcIiwgaGFuZGxlTnVtYmVyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGFyZ2V0IGlzIGEgY29ubmVjdCwgdGhlbiBmaXJlIGRyYWcgZXZlbnRcclxuICAgICAgICAgICAgICAgIGlmIChjb25uZWN0ICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpcmVFdmVudChcImRyYWdcIiwgZmlyc3RIYW5kbGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFRha2VzIGEgYmFzZSB2YWx1ZSBhbmQgYW4gb2Zmc2V0LiBUaGlzIG9mZnNldCBpcyB1c2VkIGZvciB0aGUgY29ubmVjdCBiYXIgc2l6ZS5cclxuICAgICAgICAvLyBJbiB0aGUgaW5pdGlhbCBkZXNpZ24gZm9yIHRoaXMgZmVhdHVyZSwgdGhlIG9yaWdpbiBlbGVtZW50IHdhcyAxJSB3aWRlLlxyXG4gICAgICAgIC8vIFVuZm9ydHVuYXRlbHksIGEgcm91bmRpbmcgYnVnIGluIENocm9tZSBtYWtlcyBpdCBpbXBvc3NpYmxlIHRvIGltcGxlbWVudCB0aGlzIGZlYXR1cmVcclxuICAgICAgICAvLyBpbiB0aGlzIG1hbm5lcjogaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9Nzk4MjIzXHJcbiAgICAgICAgZnVuY3Rpb24gdHJhbnNmb3JtRGlyZWN0aW9uKGEsIGIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZGlyID8gMTAwIC0gYSAtIGIgOiBhO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBVcGRhdGVzIHNjb3BlX0xvY2F0aW9ucyBhbmQgc2NvcGVfVmFsdWVzLCB1cGRhdGVzIHZpc3VhbCBzdGF0ZVxyXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZUhhbmRsZVBvc2l0aW9uKGhhbmRsZU51bWJlciwgdG8pIHtcclxuICAgICAgICAgICAgLy8gVXBkYXRlIGxvY2F0aW9ucy5cclxuICAgICAgICAgICAgc2NvcGVfTG9jYXRpb25zW2hhbmRsZU51bWJlcl0gPSB0bztcclxuICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgdmFsdWUgdG8gdGhlIHNsaWRlciBzdGVwcGluZy9yYW5nZS5cclxuICAgICAgICAgICAgc2NvcGVfVmFsdWVzW2hhbmRsZU51bWJlcl0gPSBzY29wZV9TcGVjdHJ1bS5mcm9tU3RlcHBpbmcodG8pO1xyXG4gICAgICAgICAgICB2YXIgdHJhbnNsYXRpb24gPSB0cmFuc2Zvcm1EaXJlY3Rpb24odG8sIDApIC0gc2NvcGVfRGlyT2Zmc2V0O1xyXG4gICAgICAgICAgICB2YXIgdHJhbnNsYXRlUnVsZSA9IFwidHJhbnNsYXRlKFwiICsgaW5SdWxlT3JkZXIodHJhbnNsYXRpb24gKyBcIiVcIiwgXCIwXCIpICsgXCIpXCI7XHJcbiAgICAgICAgICAgIHNjb3BlX0hhbmRsZXNbaGFuZGxlTnVtYmVyXS5zdHlsZVtvcHRpb25zLnRyYW5zZm9ybVJ1bGVdID0gdHJhbnNsYXRlUnVsZTtcclxuICAgICAgICAgICAgdXBkYXRlQ29ubmVjdChoYW5kbGVOdW1iZXIpO1xyXG4gICAgICAgICAgICB1cGRhdGVDb25uZWN0KGhhbmRsZU51bWJlciArIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBIYW5kbGVzIGJlZm9yZSB0aGUgc2xpZGVyIG1pZGRsZSBhcmUgc3RhY2tlZCBsYXRlciA9IGhpZ2hlcixcclxuICAgICAgICAvLyBIYW5kbGVzIGFmdGVyIHRoZSBtaWRkbGUgbGF0ZXIgaXMgbG93ZXJcclxuICAgICAgICAvLyBbWzddIFs4XSAuLi4uLi4uLi4uIHwgLi4uLi4uLi4uLiBbNV0gWzRdXHJcbiAgICAgICAgZnVuY3Rpb24gc2V0WmluZGV4KCkge1xyXG4gICAgICAgICAgICBzY29wZV9IYW5kbGVOdW1iZXJzLmZvckVhY2goZnVuY3Rpb24gKGhhbmRsZU51bWJlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpciA9IHNjb3BlX0xvY2F0aW9uc1toYW5kbGVOdW1iZXJdID4gNTAgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgICAgICB2YXIgekluZGV4ID0gMyArIChzY29wZV9IYW5kbGVzLmxlbmd0aCArIGRpciAqIGhhbmRsZU51bWJlcik7XHJcbiAgICAgICAgICAgICAgICBzY29wZV9IYW5kbGVzW2hhbmRsZU51bWJlcl0uc3R5bGUuekluZGV4ID0gU3RyaW5nKHpJbmRleCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUZXN0IHN1Z2dlc3RlZCB2YWx1ZXMgYW5kIGFwcGx5IG1hcmdpbiwgc3RlcC5cclxuICAgICAgICAvLyBpZiBleGFjdElucHV0IGlzIHRydWUsIGRvbid0IHJ1biBjaGVja0hhbmRsZVBvc2l0aW9uLCB0aGVuIHRoZSBoYW5kbGUgY2FuIGJlIHBsYWNlZCBpbiBiZXR3ZWVuIHN0ZXBzICgjNDM2KVxyXG4gICAgICAgIGZ1bmN0aW9uIHNldEhhbmRsZShoYW5kbGVOdW1iZXIsIHRvLCBsb29rQmFja3dhcmQsIGxvb2tGb3J3YXJkLCBleGFjdElucHV0LCBzbW9vdGhTdGVwcykge1xyXG4gICAgICAgICAgICBpZiAoIWV4YWN0SW5wdXQpIHtcclxuICAgICAgICAgICAgICAgIHRvID0gY2hlY2tIYW5kbGVQb3NpdGlvbihzY29wZV9Mb2NhdGlvbnMsIGhhbmRsZU51bWJlciwgdG8sIGxvb2tCYWNrd2FyZCwgbG9va0ZvcndhcmQsIGZhbHNlLCBzbW9vdGhTdGVwcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHVwZGF0ZUhhbmRsZVBvc2l0aW9uKGhhbmRsZU51bWJlciwgdG8pO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVXBkYXRlcyBzdHlsZSBhdHRyaWJ1dGUgZm9yIGNvbm5lY3Qgbm9kZXNcclxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVDb25uZWN0KGluZGV4KSB7XHJcbiAgICAgICAgICAgIC8vIFNraXAgY29ubmVjdHMgc2V0IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIGlmICghc2NvcGVfQ29ubmVjdHNbaW5kZXhdKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGwgPSAwO1xyXG4gICAgICAgICAgICB2YXIgaCA9IDEwMDtcclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBsID0gc2NvcGVfTG9jYXRpb25zW2luZGV4IC0gMV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBzY29wZV9Db25uZWN0cy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICBoID0gc2NvcGVfTG9jYXRpb25zW2luZGV4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBXZSB1c2UgdHdvIHJ1bGVzOlxyXG4gICAgICAgICAgICAvLyAndHJhbnNsYXRlJyB0byBjaGFuZ2UgdGhlIGxlZnQvdG9wIG9mZnNldDtcclxuICAgICAgICAgICAgLy8gJ3NjYWxlJyB0byBjaGFuZ2UgdGhlIHdpZHRoIG9mIHRoZSBlbGVtZW50O1xyXG4gICAgICAgICAgICAvLyBBcyB0aGUgZWxlbWVudCBoYXMgYSB3aWR0aCBvZiAxMDAlLCBhIHRyYW5zbGF0aW9uIG9mIDEwMCUgaXMgZXF1YWwgdG8gMTAwJSBvZiB0aGUgcGFyZW50ICgubm9VaS1iYXNlKVxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdFdpZHRoID0gaCAtIGw7XHJcbiAgICAgICAgICAgIHZhciB0cmFuc2xhdGVSdWxlID0gXCJ0cmFuc2xhdGUoXCIgKyBpblJ1bGVPcmRlcih0cmFuc2Zvcm1EaXJlY3Rpb24obCwgY29ubmVjdFdpZHRoKSArIFwiJVwiLCBcIjBcIikgKyBcIilcIjtcclxuICAgICAgICAgICAgdmFyIHNjYWxlUnVsZSA9IFwic2NhbGUoXCIgKyBpblJ1bGVPcmRlcihjb25uZWN0V2lkdGggLyAxMDAsIFwiMVwiKSArIFwiKVwiO1xyXG4gICAgICAgICAgICBzY29wZV9Db25uZWN0c1tpbmRleF0uc3R5bGVbb3B0aW9ucy50cmFuc2Zvcm1SdWxlXSA9XHJcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGVSdWxlICsgXCIgXCIgKyBzY2FsZVJ1bGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFBhcnNlcyB2YWx1ZSBwYXNzZWQgdG8gLnNldCBtZXRob2QuIFJldHVybnMgY3VycmVudCB2YWx1ZSBpZiBub3QgcGFyc2UtYWJsZS5cclxuICAgICAgICBmdW5jdGlvbiByZXNvbHZlVG9WYWx1ZSh0bywgaGFuZGxlTnVtYmVyKSB7XHJcbiAgICAgICAgICAgIC8vIFNldHRpbmcgd2l0aCBudWxsIGluZGljYXRlcyBhbiAnaWdub3JlJy5cclxuICAgICAgICAgICAgLy8gSW5wdXR0aW5nICdmYWxzZScgaXMgaW52YWxpZC5cclxuICAgICAgICAgICAgaWYgKHRvID09PSBudWxsIHx8IHRvID09PSBmYWxzZSB8fCB0byA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGVfTG9jYXRpb25zW2hhbmRsZU51bWJlcl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSWYgYSBmb3JtYXR0ZWQgbnVtYmVyIHdhcyBwYXNzZWQsIGF0dGVtcHQgdG8gZGVjb2RlIGl0LlxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRvID09PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgICAgICB0byA9IFN0cmluZyh0byk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdG8gPSBvcHRpb25zLmZvcm1hdC5mcm9tKHRvKTtcclxuICAgICAgICAgICAgaWYgKHRvICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdG8gPSBzY29wZV9TcGVjdHJ1bS50b1N0ZXBwaW5nKHRvKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBJZiBwYXJzaW5nIHRoZSBudW1iZXIgZmFpbGVkLCB1c2UgdGhlIGN1cnJlbnQgdmFsdWUuXHJcbiAgICAgICAgICAgIGlmICh0byA9PT0gZmFsc2UgfHwgaXNOYU4odG8pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGVfTG9jYXRpb25zW2hhbmRsZU51bWJlcl07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRvO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBTZXQgdGhlIHNsaWRlciB2YWx1ZS5cclxuICAgICAgICBmdW5jdGlvbiB2YWx1ZVNldChpbnB1dCwgZmlyZVNldEV2ZW50LCBleGFjdElucHV0KSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBhc0FycmF5KGlucHV0KTtcclxuICAgICAgICAgICAgdmFyIGlzSW5pdCA9IHNjb3BlX0xvY2F0aW9uc1swXSA9PT0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAvLyBFdmVudCBmaXJlcyBieSBkZWZhdWx0XHJcbiAgICAgICAgICAgIGZpcmVTZXRFdmVudCA9IGZpcmVTZXRFdmVudCA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGZpcmVTZXRFdmVudDtcclxuICAgICAgICAgICAgLy8gQW5pbWF0aW9uIGlzIG9wdGlvbmFsLlxyXG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGluaXRpYWwgdmFsdWVzIHdlcmUgc2V0IGJlZm9yZSB1c2luZyBhbmltYXRlZCBwbGFjZW1lbnQuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFuaW1hdGUgJiYgIWlzSW5pdCkge1xyXG4gICAgICAgICAgICAgICAgYWRkQ2xhc3NGb3Ioc2NvcGVfVGFyZ2V0LCBvcHRpb25zLmNzc0NsYXNzZXMudGFwLCBvcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBGaXJzdCBwYXNzLCB3aXRob3V0IGxvb2tBaGVhZCBidXQgd2l0aCBsb29rQmFja3dhcmQuIFZhbHVlcyBhcmUgc2V0IGZyb20gbGVmdCB0byByaWdodC5cclxuICAgICAgICAgICAgc2NvcGVfSGFuZGxlTnVtYmVycy5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVOdW1iZXIpIHtcclxuICAgICAgICAgICAgICAgIHNldEhhbmRsZShoYW5kbGVOdW1iZXIsIHJlc29sdmVUb1ZhbHVlKHZhbHVlc1toYW5kbGVOdW1iZXJdLCBoYW5kbGVOdW1iZXIpLCB0cnVlLCBmYWxzZSwgZXhhY3RJbnB1dCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB2YXIgaSA9IHNjb3BlX0hhbmRsZU51bWJlcnMubGVuZ3RoID09PSAxID8gMCA6IDE7XHJcbiAgICAgICAgICAgIC8vIFNwcmVhZCBoYW5kbGVzIGV2ZW5seSBhY3Jvc3MgdGhlIHNsaWRlciBpZiB0aGUgcmFuZ2UgaGFzIG5vIHNpemUgKG1pbj1tYXgpXHJcbiAgICAgICAgICAgIGlmIChpc0luaXQgJiYgc2NvcGVfU3BlY3RydW0uaGFzTm9TaXplKCkpIHtcclxuICAgICAgICAgICAgICAgIGV4YWN0SW5wdXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgc2NvcGVfTG9jYXRpb25zWzBdID0gMDtcclxuICAgICAgICAgICAgICAgIGlmIChzY29wZV9IYW5kbGVOdW1iZXJzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3BhY2VfMSA9IDEwMCAvIChzY29wZV9IYW5kbGVOdW1iZXJzLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlX0hhbmRsZU51bWJlcnMuZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlTnVtYmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlX0xvY2F0aW9uc1toYW5kbGVOdW1iZXJdID0gaGFuZGxlTnVtYmVyICogc3BhY2VfMTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTZWNvbmRhcnkgcGFzc2VzLiBOb3cgdGhhdCBhbGwgYmFzZSB2YWx1ZXMgYXJlIHNldCwgYXBwbHkgY29uc3RyYWludHMuXHJcbiAgICAgICAgICAgIC8vIEl0ZXJhdGUgYWxsIGhhbmRsZXMgdG8gZW5zdXJlIGNvbnN0cmFpbnRzIGFyZSBhcHBsaWVkIGZvciB0aGUgZW50aXJlIHNsaWRlciAoSXNzdWUgIzEwMDkpXHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgc2NvcGVfSGFuZGxlTnVtYmVycy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgc2NvcGVfSGFuZGxlTnVtYmVycy5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVOdW1iZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRIYW5kbGUoaGFuZGxlTnVtYmVyLCBzY29wZV9Mb2NhdGlvbnNbaGFuZGxlTnVtYmVyXSwgdHJ1ZSwgdHJ1ZSwgZXhhY3RJbnB1dCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZXRaaW5kZXgoKTtcclxuICAgICAgICAgICAgc2NvcGVfSGFuZGxlTnVtYmVycy5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVOdW1iZXIpIHtcclxuICAgICAgICAgICAgICAgIGZpcmVFdmVudChcInVwZGF0ZVwiLCBoYW5kbGVOdW1iZXIpO1xyXG4gICAgICAgICAgICAgICAgLy8gRmlyZSB0aGUgZXZlbnQgb25seSBmb3IgaGFuZGxlcyB0aGF0IHJlY2VpdmVkIGEgbmV3IHZhbHVlLCBhcyBwZXIgIzU3OVxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlc1toYW5kbGVOdW1iZXJdICE9PSBudWxsICYmIGZpcmVTZXRFdmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpcmVFdmVudChcInNldFwiLCBoYW5kbGVOdW1iZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gUmVzZXQgc2xpZGVyIHRvIGluaXRpYWwgdmFsdWVzXHJcbiAgICAgICAgZnVuY3Rpb24gdmFsdWVSZXNldChmaXJlU2V0RXZlbnQpIHtcclxuICAgICAgICAgICAgdmFsdWVTZXQob3B0aW9ucy5zdGFydCwgZmlyZVNldEV2ZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gU2V0IHZhbHVlIGZvciBhIHNpbmdsZSBoYW5kbGVcclxuICAgICAgICBmdW5jdGlvbiB2YWx1ZVNldEhhbmRsZShoYW5kbGVOdW1iZXIsIHZhbHVlLCBmaXJlU2V0RXZlbnQsIGV4YWN0SW5wdXQpIHtcclxuICAgICAgICAgICAgLy8gRW5zdXJlIG51bWVyaWMgaW5wdXRcclxuICAgICAgICAgICAgaGFuZGxlTnVtYmVyID0gTnVtYmVyKGhhbmRsZU51bWJlcik7XHJcbiAgICAgICAgICAgIGlmICghKGhhbmRsZU51bWJlciA+PSAwICYmIGhhbmRsZU51bWJlciA8IHNjb3BlX0hhbmRsZU51bWJlcnMubGVuZ3RoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogaW52YWxpZCBoYW5kbGUgbnVtYmVyLCBnb3Q6IFwiICsgaGFuZGxlTnVtYmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBMb29rIGJvdGggYmFja3dhcmQgYW5kIGZvcndhcmQsIHNpbmNlIHdlIGRvbid0IHdhbnQgdGhpcyBoYW5kbGUgdG8gXCJwdXNoXCIgb3RoZXIgaGFuZGxlcyAoIzk2MCk7XHJcbiAgICAgICAgICAgIC8vIFRoZSBleGFjdElucHV0IGFyZ3VtZW50IGNhbiBiZSB1c2VkIHRvIGlnbm9yZSBzbGlkZXIgc3RlcHBpbmcgKCM0MzYpXHJcbiAgICAgICAgICAgIHNldEhhbmRsZShoYW5kbGVOdW1iZXIsIHJlc29sdmVUb1ZhbHVlKHZhbHVlLCBoYW5kbGVOdW1iZXIpLCB0cnVlLCB0cnVlLCBleGFjdElucHV0KTtcclxuICAgICAgICAgICAgZmlyZUV2ZW50KFwidXBkYXRlXCIsIGhhbmRsZU51bWJlcik7XHJcbiAgICAgICAgICAgIGlmIChmaXJlU2V0RXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGZpcmVFdmVudChcInNldFwiLCBoYW5kbGVOdW1iZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEdldCB0aGUgc2xpZGVyIHZhbHVlLlxyXG4gICAgICAgIGZ1bmN0aW9uIHZhbHVlR2V0KHVuZW5jb2RlZCkge1xyXG4gICAgICAgICAgICBpZiAodW5lbmNvZGVkID09PSB2b2lkIDApIHsgdW5lbmNvZGVkID0gZmFsc2U7IH1cclxuICAgICAgICAgICAgaWYgKHVuZW5jb2RlZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIGEgY29weSBvZiB0aGUgcmF3IHZhbHVlc1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlX1ZhbHVlcy5sZW5ndGggPT09IDEgPyBzY29wZV9WYWx1ZXNbMF0gOiBzY29wZV9WYWx1ZXMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IHNjb3BlX1ZhbHVlcy5tYXAob3B0aW9ucy5mb3JtYXQudG8pO1xyXG4gICAgICAgICAgICAvLyBJZiBvbmx5IG9uZSBoYW5kbGUgaXMgdXNlZCwgcmV0dXJuIGEgc2luZ2xlIHZhbHVlLlxyXG4gICAgICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlc1swXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBSZW1vdmVzIGNsYXNzZXMgZnJvbSB0aGUgcm9vdCBhbmQgZW1wdGllcyBpdC5cclxuICAgICAgICBmdW5jdGlvbiBkZXN0cm95KCkge1xyXG4gICAgICAgICAgICAvLyByZW1vdmUgcHJvdGVjdGVkIGludGVybmFsIGxpc3RlbmVyc1xyXG4gICAgICAgICAgICByZW1vdmVFdmVudChJTlRFUk5BTF9FVkVOVF9OUy5hcmlhKTtcclxuICAgICAgICAgICAgcmVtb3ZlRXZlbnQoSU5URVJOQUxfRVZFTlRfTlMudG9vbHRpcHMpO1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zLmNzc0NsYXNzZXMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlQ2xhc3Moc2NvcGVfVGFyZ2V0LCBvcHRpb25zLmNzc0NsYXNzZXNba2V5XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB3aGlsZSAoc2NvcGVfVGFyZ2V0LmZpcnN0Q2hpbGQpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlX1RhcmdldC5yZW1vdmVDaGlsZChzY29wZV9UYXJnZXQuZmlyc3RDaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZGVsZXRlIHNjb3BlX1RhcmdldC5ub1VpU2xpZGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBnZXROZXh0U3RlcHNGb3JIYW5kbGUoaGFuZGxlTnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHNjb3BlX0xvY2F0aW9uc1toYW5kbGVOdW1iZXJdO1xyXG4gICAgICAgICAgICB2YXIgbmVhcmJ5U3RlcHMgPSBzY29wZV9TcGVjdHJ1bS5nZXROZWFyYnlTdGVwcyhsb2NhdGlvbik7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHNjb3BlX1ZhbHVlc1toYW5kbGVOdW1iZXJdO1xyXG4gICAgICAgICAgICB2YXIgaW5jcmVtZW50ID0gbmVhcmJ5U3RlcHMudGhpc1N0ZXAuc3RlcDtcclxuICAgICAgICAgICAgdmFyIGRlY3JlbWVudCA9IG51bGw7XHJcbiAgICAgICAgICAgIC8vIElmIHNuYXBwZWQsIGRpcmVjdGx5IHVzZSBkZWZpbmVkIHN0ZXAgdmFsdWVcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc25hcCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSAtIG5lYXJieVN0ZXBzLnN0ZXBCZWZvcmUuc3RhcnRWYWx1ZSB8fCBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIG5lYXJieVN0ZXBzLnN0ZXBBZnRlci5zdGFydFZhbHVlIC0gdmFsdWUgfHwgbnVsbCxcclxuICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSWYgdGhlIG5leHQgdmFsdWUgaW4gdGhpcyBzdGVwIG1vdmVzIGludG8gdGhlIG5leHQgc3RlcCxcclxuICAgICAgICAgICAgLy8gdGhlIGluY3JlbWVudCBpcyB0aGUgc3RhcnQgb2YgdGhlIG5leHQgc3RlcCAtIHRoZSBjdXJyZW50IHZhbHVlXHJcbiAgICAgICAgICAgIGlmIChpbmNyZW1lbnQgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgKyBpbmNyZW1lbnQgPiBuZWFyYnlTdGVwcy5zdGVwQWZ0ZXIuc3RhcnRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGluY3JlbWVudCA9IG5lYXJieVN0ZXBzLnN0ZXBBZnRlci5zdGFydFZhbHVlIC0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIGJleW9uZCB0aGUgc3RhcnRpbmcgcG9pbnRcclxuICAgICAgICAgICAgaWYgKHZhbHVlID4gbmVhcmJ5U3RlcHMudGhpc1N0ZXAuc3RhcnRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZGVjcmVtZW50ID0gbmVhcmJ5U3RlcHMudGhpc1N0ZXAuc3RlcDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChuZWFyYnlTdGVwcy5zdGVwQmVmb3JlLnN0ZXAgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICBkZWNyZW1lbnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBJZiBhIGhhbmRsZSBpcyBhdCB0aGUgc3RhcnQgb2YgYSBzdGVwLCBpdCBhbHdheXMgc3RlcHMgYmFjayBpbnRvIHRoZSBwcmV2aW91cyBzdGVwIGZpcnN0XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGVjcmVtZW50ID0gdmFsdWUgLSBuZWFyYnlTdGVwcy5zdGVwQmVmb3JlLmhpZ2hlc3RTdGVwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE5vdywgaWYgYXQgdGhlIHNsaWRlciBlZGdlcywgdGhlcmUgaXMgbm8gaW4vZGVjcmVtZW50XHJcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbiA9PT0gMTAwKSB7XHJcbiAgICAgICAgICAgICAgICBpbmNyZW1lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGxvY2F0aW9uID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBkZWNyZW1lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEFzIHBlciAjMzkxLCB0aGUgY29tcGFyaXNvbiBmb3IgdGhlIGRlY3JlbWVudCBzdGVwIGNhbiBoYXZlIHNvbWUgcm91bmRpbmcgaXNzdWVzLlxyXG4gICAgICAgICAgICB2YXIgc3RlcERlY2ltYWxzID0gc2NvcGVfU3BlY3RydW0uY291bnRTdGVwRGVjaW1hbHMoKTtcclxuICAgICAgICAgICAgLy8gUm91bmQgcGVyICMzOTFcclxuICAgICAgICAgICAgaWYgKGluY3JlbWVudCAhPT0gbnVsbCAmJiBpbmNyZW1lbnQgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICBpbmNyZW1lbnQgPSBOdW1iZXIoaW5jcmVtZW50LnRvRml4ZWQoc3RlcERlY2ltYWxzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGRlY3JlbWVudCAhPT0gbnVsbCAmJiBkZWNyZW1lbnQgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICBkZWNyZW1lbnQgPSBOdW1iZXIoZGVjcmVtZW50LnRvRml4ZWQoc3RlcERlY2ltYWxzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFtkZWNyZW1lbnQsIGluY3JlbWVudF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEdldCB0aGUgY3VycmVudCBzdGVwIHNpemUgZm9yIHRoZSBzbGlkZXIuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0TmV4dFN0ZXBzKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2NvcGVfSGFuZGxlTnVtYmVycy5tYXAoZ2V0TmV4dFN0ZXBzRm9ySGFuZGxlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gVXBkYXRhYmxlOiBtYXJnaW4sIGxpbWl0LCBwYWRkaW5nLCBzdGVwLCByYW5nZSwgYW5pbWF0ZSwgc25hcFxyXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZU9wdGlvbnMob3B0aW9uc1RvVXBkYXRlLCBmaXJlU2V0RXZlbnQpIHtcclxuICAgICAgICAgICAgLy8gU3BlY3RydW0gaXMgY3JlYXRlZCB1c2luZyB0aGUgcmFuZ2UsIHNuYXAsIGRpcmVjdGlvbiBhbmQgc3RlcCBvcHRpb25zLlxyXG4gICAgICAgICAgICAvLyAnc25hcCcgYW5kICdzdGVwJyBjYW4gYmUgdXBkYXRlZC5cclxuICAgICAgICAgICAgLy8gSWYgJ3NuYXAnIGFuZCAnc3RlcCcgYXJlIG5vdCBwYXNzZWQsIHRoZXkgc2hvdWxkIHJlbWFpbiB1bmNoYW5nZWQuXHJcbiAgICAgICAgICAgIHZhciB2ID0gdmFsdWVHZXQoKTtcclxuICAgICAgICAgICAgdmFyIHVwZGF0ZUFibGUgPSBbXHJcbiAgICAgICAgICAgICAgICBcIm1hcmdpblwiLFxyXG4gICAgICAgICAgICAgICAgXCJsaW1pdFwiLFxyXG4gICAgICAgICAgICAgICAgXCJwYWRkaW5nXCIsXHJcbiAgICAgICAgICAgICAgICBcInJhbmdlXCIsXHJcbiAgICAgICAgICAgICAgICBcImFuaW1hdGVcIixcclxuICAgICAgICAgICAgICAgIFwic25hcFwiLFxyXG4gICAgICAgICAgICAgICAgXCJzdGVwXCIsXHJcbiAgICAgICAgICAgICAgICBcImZvcm1hdFwiLFxyXG4gICAgICAgICAgICAgICAgXCJwaXBzXCIsXHJcbiAgICAgICAgICAgICAgICBcInRvb2x0aXBzXCIsXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIC8vIE9ubHkgY2hhbmdlIG9wdGlvbnMgdGhhdCB3ZSdyZSBhY3R1YWxseSBwYXNzZWQgdG8gdXBkYXRlLlxyXG4gICAgICAgICAgICB1cGRhdGVBYmxlLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciB1bmRlZmluZWQuIG51bGwgcmVtb3ZlcyB0aGUgdmFsdWUuXHJcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9uc1RvVXBkYXRlW25hbWVdICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbE9wdGlvbnNbbmFtZV0gPSBvcHRpb25zVG9VcGRhdGVbbmFtZV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB2YXIgbmV3T3B0aW9ucyA9IHRlc3RPcHRpb25zKG9yaWdpbmFsT3B0aW9ucyk7XHJcbiAgICAgICAgICAgIC8vIExvYWQgbmV3IG9wdGlvbnMgaW50byB0aGUgc2xpZGVyIHN0YXRlXHJcbiAgICAgICAgICAgIHVwZGF0ZUFibGUuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnNUb1VwZGF0ZVtuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uc1tuYW1lXSA9IG5ld09wdGlvbnNbbmFtZV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzY29wZV9TcGVjdHJ1bSA9IG5ld09wdGlvbnMuc3BlY3RydW07XHJcbiAgICAgICAgICAgIC8vIExpbWl0LCBtYXJnaW4gYW5kIHBhZGRpbmcgZGVwZW5kIG9uIHRoZSBzcGVjdHJ1bSBidXQgYXJlIHN0b3JlZCBvdXRzaWRlIG9mIGl0LiAoIzY3NylcclxuICAgICAgICAgICAgb3B0aW9ucy5tYXJnaW4gPSBuZXdPcHRpb25zLm1hcmdpbjtcclxuICAgICAgICAgICAgb3B0aW9ucy5saW1pdCA9IG5ld09wdGlvbnMubGltaXQ7XHJcbiAgICAgICAgICAgIG9wdGlvbnMucGFkZGluZyA9IG5ld09wdGlvbnMucGFkZGluZztcclxuICAgICAgICAgICAgLy8gVXBkYXRlIHBpcHMsIHJlbW92ZXMgZXhpc3RpbmcuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBpcHMpIHtcclxuICAgICAgICAgICAgICAgIHBpcHMob3B0aW9ucy5waXBzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlbW92ZVBpcHMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdG9vbHRpcHMsIHJlbW92ZXMgZXhpc3RpbmcuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnRvb2x0aXBzKSB7XHJcbiAgICAgICAgICAgICAgICB0b29sdGlwcygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlVG9vbHRpcHMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBJbnZhbGlkYXRlIHRoZSBjdXJyZW50IHBvc2l0aW9uaW5nIHNvIHZhbHVlU2V0IGZvcmNlcyBhbiB1cGRhdGUuXHJcbiAgICAgICAgICAgIHNjb3BlX0xvY2F0aW9ucyA9IFtdO1xyXG4gICAgICAgICAgICB2YWx1ZVNldChpc1NldChvcHRpb25zVG9VcGRhdGUuc3RhcnQpID8gb3B0aW9uc1RvVXBkYXRlLnN0YXJ0IDogdiwgZmlyZVNldEV2ZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gSW5pdGlhbGl6YXRpb24gc3RlcHNcclxuICAgICAgICBmdW5jdGlvbiBzZXR1cFNsaWRlcigpIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBiYXNlIGVsZW1lbnQsIGluaXRpYWxpemUgSFRNTCBhbmQgc2V0IGNsYXNzZXMuXHJcbiAgICAgICAgICAgIC8vIEFkZCBoYW5kbGVzIGFuZCBjb25uZWN0IGVsZW1lbnRzLlxyXG4gICAgICAgICAgICBzY29wZV9CYXNlID0gYWRkU2xpZGVyKHNjb3BlX1RhcmdldCk7XHJcbiAgICAgICAgICAgIGFkZEVsZW1lbnRzKG9wdGlvbnMuY29ubmVjdCwgc2NvcGVfQmFzZSk7XHJcbiAgICAgICAgICAgIC8vIEF0dGFjaCB1c2VyIGV2ZW50cy5cclxuICAgICAgICAgICAgYmluZFNsaWRlckV2ZW50cyhvcHRpb25zLmV2ZW50cyk7XHJcbiAgICAgICAgICAgIC8vIFVzZSB0aGUgcHVibGljIHZhbHVlIG1ldGhvZCB0byBzZXQgdGhlIHN0YXJ0IHZhbHVlcy5cclxuICAgICAgICAgICAgdmFsdWVTZXQob3B0aW9ucy5zdGFydCk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBpcHMpIHtcclxuICAgICAgICAgICAgICAgIHBpcHMob3B0aW9ucy5waXBzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy50b29sdGlwcykge1xyXG4gICAgICAgICAgICAgICAgdG9vbHRpcHMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhcmlhKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldHVwU2xpZGVyKCk7XHJcbiAgICAgICAgdmFyIHNjb3BlX1NlbGYgPSB7XHJcbiAgICAgICAgICAgIGRlc3Ryb3k6IGRlc3Ryb3ksXHJcbiAgICAgICAgICAgIHN0ZXBzOiBnZXROZXh0U3RlcHMsXHJcbiAgICAgICAgICAgIG9uOiBiaW5kRXZlbnQsXHJcbiAgICAgICAgICAgIG9mZjogcmVtb3ZlRXZlbnQsXHJcbiAgICAgICAgICAgIGdldDogdmFsdWVHZXQsXHJcbiAgICAgICAgICAgIHNldDogdmFsdWVTZXQsXHJcbiAgICAgICAgICAgIHNldEhhbmRsZTogdmFsdWVTZXRIYW5kbGUsXHJcbiAgICAgICAgICAgIHJlc2V0OiB2YWx1ZVJlc2V0LFxyXG4gICAgICAgICAgICBkaXNhYmxlOiBkaXNhYmxlLFxyXG4gICAgICAgICAgICBlbmFibGU6IGVuYWJsZSxcclxuICAgICAgICAgICAgLy8gRXhwb3NlZCBmb3IgdW5pdCB0ZXN0aW5nLCBkb24ndCB1c2UgdGhpcyBpbiB5b3VyIGFwcGxpY2F0aW9uLlxyXG4gICAgICAgICAgICBfX21vdmVIYW5kbGVzOiBmdW5jdGlvbiAodXB3YXJkLCBwcm9wb3NhbCwgaGFuZGxlTnVtYmVycykge1xyXG4gICAgICAgICAgICAgICAgbW92ZUhhbmRsZXModXB3YXJkLCBwcm9wb3NhbCwgc2NvcGVfTG9jYXRpb25zLCBoYW5kbGVOdW1iZXJzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb3B0aW9uczogb3JpZ2luYWxPcHRpb25zLFxyXG4gICAgICAgICAgICB1cGRhdGVPcHRpb25zOiB1cGRhdGVPcHRpb25zLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHNjb3BlX1RhcmdldCxcclxuICAgICAgICAgICAgcmVtb3ZlUGlwczogcmVtb3ZlUGlwcyxcclxuICAgICAgICAgICAgcmVtb3ZlVG9vbHRpcHM6IHJlbW92ZVRvb2x0aXBzLFxyXG4gICAgICAgICAgICBnZXRQb3NpdGlvbnM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZV9Mb2NhdGlvbnMuc2xpY2UoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ2V0VG9vbHRpcHM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzY29wZV9Ub29sdGlwcztcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ2V0T3JpZ2luczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlX0hhbmRsZXM7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBpcHM6IHBpcHMsIC8vIElzc3VlICM1OTRcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBzY29wZV9TZWxmO1xyXG4gICAgfVxyXG4gICAgLy8gUnVuIHRoZSBzdGFuZGFyZCBpbml0aWFsaXplclxyXG4gICAgZnVuY3Rpb24gaW5pdGlhbGl6ZSh0YXJnZXQsIG9yaWdpbmFsT3B0aW9ucykge1xyXG4gICAgICAgIGlmICghdGFyZ2V0IHx8ICF0YXJnZXQubm9kZU5hbWUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9VaVNsaWRlcjogY3JlYXRlIHJlcXVpcmVzIGEgc2luZ2xlIGVsZW1lbnQsIGdvdDogXCIgKyB0YXJnZXQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUaHJvdyBhbiBlcnJvciBpZiB0aGUgc2xpZGVyIHdhcyBhbHJlYWR5IGluaXRpYWxpemVkLlxyXG4gICAgICAgIGlmICh0YXJnZXQubm9VaVNsaWRlcikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub1VpU2xpZGVyOiBTbGlkZXIgd2FzIGFscmVhZHkgaW5pdGlhbGl6ZWQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUZXN0IHRoZSBvcHRpb25zIGFuZCBjcmVhdGUgdGhlIHNsaWRlciBlbnZpcm9ubWVudDtcclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHRlc3RPcHRpb25zKG9yaWdpbmFsT3B0aW9ucyk7XHJcbiAgICAgICAgdmFyIGFwaSA9IHNjb3BlKHRhcmdldCwgb3B0aW9ucywgb3JpZ2luYWxPcHRpb25zKTtcclxuICAgICAgICB0YXJnZXQubm9VaVNsaWRlciA9IGFwaTtcclxuICAgICAgICByZXR1cm4gYXBpO1xyXG4gICAgfVxyXG4gICAgdmFyIG5vdWlzbGlkZXIgPSB7XHJcbiAgICAgICAgLy8gRXhwb3NlZCBmb3IgdW5pdCB0ZXN0aW5nLCBkb24ndCB1c2UgdGhpcyBpbiB5b3VyIGFwcGxpY2F0aW9uLlxyXG4gICAgICAgIF9fc3BlY3RydW06IFNwZWN0cnVtLFxyXG4gICAgICAgIC8vIEEgcmVmZXJlbmNlIHRvIHRoZSBkZWZhdWx0IGNsYXNzZXMsIGFsbG93cyBnbG9iYWwgY2hhbmdlcy5cclxuICAgICAgICAvLyBVc2UgdGhlIGNzc0NsYXNzZXMgb3B0aW9uIGZvciBjaGFuZ2VzIHRvIG9uZSBzbGlkZXIuXHJcbiAgICAgICAgY3NzQ2xhc3NlczogY3NzQ2xhc3NlcyxcclxuICAgICAgICBjcmVhdGU6IGluaXRpYWxpemUsXHJcbiAgICB9O1xyXG5cclxuICAgIGV4cG9ydHMuY3JlYXRlID0gaW5pdGlhbGl6ZTtcclxuICAgIGV4cG9ydHMuY3NzQ2xhc3NlcyA9IGNzc0NsYXNzZXM7XHJcbiAgICBleHBvcnRzW1wiZGVmYXVsdFwiXSA9IG5vdWlzbGlkZXI7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuXHJcbn0pKTtcclxuIl0sIm1hcHBpbmdzIjoiOzs7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
