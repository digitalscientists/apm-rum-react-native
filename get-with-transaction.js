function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}

function _extends() {
  _extends =
    Object.assign ||
    function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
  return _extends.apply(this, arguments);
}

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) ||
    _iterableToArrayLimit(arr, i) ||
    _unsupportedIterableToArray(arr, i) ||
    _nonIterableRest()
  );
}

function _nonIterableRest() {
  throw new TypeError(
    "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
  );
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

function _iterableToArrayLimit(arr, i) {
  var _i =
    arr == null
      ? null
      : (typeof Symbol !== "undefined" && arr[Symbol.iterator]) ||
        arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function afterFrame(callback) {
  const handler = () => {
    clearTimeout(timeout);
    setTimeout(callback);
  };
  const timeout = setTimeout(handler, 100);
}

import React from "react";
import hoistStatics from "hoist-non-react-statics";
import { LOGGING_SERVICE } from "@elastic/apm-rum-core";

function isReactClassComponent(Component) {
  var prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

function getWithTransaction(apm) {
  return function withTransaction(name, type, callback) {
    if (callback === void 0) {
      callback = function callback() {};
    }

    return function (Component) {
      if (!apm.isActive()) {
        return Component;
      }

      if (!Component) {
        var loggingService = apm.serviceFactory.getService(LOGGING_SERVICE);
        loggingService.warn(
          name + " is not instrumented since component property is not provided"
        );
        return Component;
      }

      var ApmComponent = null;

      if (
        !isReactClassComponent(Component) &&
        typeof React.useEffect === "function" &&
        typeof React.useState === "function"
      ) {
        ApmComponent = function ApmComponent(props) {
          var _React$useState = React.useState(function () {
              var tr = apm.startTransaction(name, type, {
                managed: true,
                canReuse: true,
              });
              callback(tr, props);
              return tr;
            }),
            _React$useState2 = _slicedToArray(_React$useState, 1),
            transaction = _React$useState2[0];

          React.useEffect(function () {
            afterFrame(function () {
              return transaction && transaction.detectFinish();
            });
            return function () {
              transaction && transaction.detectFinish();
            };
          }, []);
          return React.createElement(
            Component,
            _extends(
              {
                transaction: transaction,
              },
              props
            )
          );
        };
      } else {
        ApmComponent = (function (_React$Component) {
          _inheritsLoose(ApmComponent, _React$Component);

          function ApmComponent(props) {
            var _this;

            _this = _React$Component.call(this, props) || this;
            _this.transaction = apm.startTransaction(name, type, {
              managed: true,
              canReuse: true,
            });
            callback(_this.transaction, props);
            return _this;
          }

          var _proto = ApmComponent.prototype;

          _proto.componentDidMount = function componentDidMount() {
            var _this2 = this;

            afterFrame(function () {
              return _this2.transaction && _this2.transaction.detectFinish();
            });
          };

          _proto.componentWillUnmount = function componentWillUnmount() {
            if (this.transaction) {
              this.transaction.detectFinish();
            }
          };

          _proto.render = function render() {
            return React.createElement(
              Component,
              _extends(
                {
                  transaction: this.transaction,
                },
                this.props
              )
            );
          };

          return ApmComponent;
        })(React.Component);
      }

      ApmComponent.displayName =
        "withTransaction(" + (Component.displayName || Component.name) + ")";
      ApmComponent.WrappedComponent = Component;
      return hoistStatics(ApmComponent, Component);
    };
  };
}

export { getWithTransaction };
