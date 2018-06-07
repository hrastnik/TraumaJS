"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Trauma = function Trauma(transitionConfigs) {
  var _this = this;

  var sceneSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "#scene";

  _classCallCheck(this, Trauma);

  this.listenForAnchorURLs = function () {
    var anchorElements = document.querySelectorAll("a");
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = anchorElements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var anchorElement = _step.value;

        anchorElement.addEventListener("click", _this.handleAnchorClick.bind(null, anchorElement));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  };

  this.handleAnchorClick = function (anchorElement) {
    var nextURL = anchorElement.getAttribute("href");
    if (nextURL == null) return;
    event.preventDefault();
    _this.transitionInitiator = Trauma.INITIATORS.anchorClick;
    _this.getNewPage(nextURL);
  };

  this.listenForPopStateURLs = function () {
    return window.addEventListener("popstate", _this.handlePopState);
  };

  this.handlePopState = function () {
    if (history.length === 1) return;

    _this.history.pop();
    var nextURL = _this.history[_this.history.length - 1];
    if (nextURL == null) return;
    event.preventDefault();
    _this.transitionInitiator = Trauma.INITIATORS.popState;
    _this.getNewPage(nextURL);
  };

  this.getNewPage = function (nextURL) {
    var request = new XMLHttpRequest();
    request.addEventListener("readystatechange", _this.handleReadyStateChange.bind(null, request));
    request.open("GET", nextURL, true);
    request.send();

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = _this.config[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var config = _step2.value;

        if (Trauma.doesRouteMatch(window.location.pathname, config.from) === false) continue;
        if (config.to != null && Trauma.doesRouteMatch(nextURL, config.to) === false) continue;

        console.log(window.location.pathname, nextURL);

        _this.finish = config.finish;
        _this.start = config.start;

        _this.start(_this.replace, _this.insertNext, document.querySelector(_this.sceneSelector));
        break;
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  };

  this.replace = function () {
    _this.startTransitionDone = true;
    _this.shouldReplaceScene = true;
    _this.tryRunEndTransition();
  };

  this.insertNext = function () {
    _this.startTransitionDone = true;
    _this.shouldReplaceScene = false;
    _this.tryRunEndTransition();
  };

  this.tryRunEndTransition = function () {
    var canRunTransition = _this.requestDone && _this.startTransitionDone;
    if (!canRunTransition) return;

    if (_this.transitionInitiator === Trauma.INITIATORS.anchorClick) _this.history.push(_this.nextURL);
    window.history.pushState({}, null, _this.nextURL);

    var activeHead = document.head;
    var nextHead = _this.nextDocument.head;
    Trauma.replaceHeadWithoutReplacingUnion(activeHead, nextHead);

    _this.oldScene = document.querySelector(_this.sceneSelector);
    _this.newScene = _this.nextDocument.querySelector(_this.sceneSelector);

    if (_this.shouldReplaceScene) {
      Trauma.replaceElement(_this.oldScene, _this.newScene);
    } else {
      _this.oldScene.style.position = "absolute";
      _this.oldScene.style.top = "0";
      _this.oldScene.insertAdjacentElement("beforeBegin", _this.newScene);
    }

    _this.finish(_this.finalize, _this.newScene, _this.oldScene);
  };

  this.finalize = function () {
    console.log("history", _this.history);

    if (_this.shouldReplaceScene === false) {
      _this.oldScene.parentElement.removeChild(_this.oldScene);
    }

    _this.listenForAnchorURLs();

    // Reset everything
    _this.requestDone = false;
    _this.startTransitionDone = false;
    _this.newScene = undefined;
    _this.oldScene = undefined;
  };

  this.handleReadyStateChange = function (request) {
    if (request.readyState === XMLHttpRequest.DONE) {
      // TODO: Check if response is valid HTML
      var body = request.responseText;
      var parser = new DOMParser();

      _this.nextDocument = parser.parseFromString(body, "text/html");
      _this.nextURL = request.responseURL;

      _this.requestDone = true;
      _this.tryRunEndTransition();
    }
  };

  this.startTransitionDone = false;
  this.requestDone = false;
  this.shouldReplaceScene = false;

  this.config = transitionConfigs;
  this.sceneSelector = sceneSelector;

  this.history = [window.location.href];

  this.listenForAnchorURLs();
  this.listenForPopStateURLs();
}

/**
 * Replaces old head with new head, but doesn't replace the tags
 * that are in both heads. We do this to prevent possible CSS
 * re-evaluations.
 */
;

Trauma.INITIATORS = {
  anchorClick: "anchorClick",
  popState: "popState"
};

Trauma.replaceElement = function (DOMElement, newDOMElement) {
  DOMElement.parentNode.replaceChild(newDOMElement, DOMElement);
};

Trauma.doesRouteMatch = function (href, stringRegexOrFunction) {
  if (typeof stringRegexOrFunction === "string") {
    return href.indexOf(stringRegexOrFunction) !== -1;
  } else if ((typeof stringRegexOrFunction === "undefined" ? "undefined" : _typeof(stringRegexOrFunction)) === "object" && stringRegexOrFunction.test === RegExp.prototype.test) {
    return stringRegexOrFunction.test(href);
  } else if (typeof stringRegexOrFunction === "function") {
    return stringRegexOrFunction(href);
  }
  return false;
};

Trauma.replaceHeadWithoutReplacingUnion = function (oldHead, newHead) {
  var isTagInCollection = function isTagInCollection(tag, collection) {
    var tag1Id = tag.outerHTML;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = collection[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var otherTag = _step3.value;

        var tag2Id = otherTag.outerHTML;
        if (tag1Id === tag2Id) return otherTag;
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  };

  var oldTags = oldHead.children;
  var newTags = newHead.children;
  var tagsToRemoveFromOldHead = [];
  var tagsToRemoveFromNewHead = [];

  // newHead will be merged in oldHead.
  // To prepare newHead for merging: elements that are already in oldHead
  // are removed from newHead
  // To prepare oldHead for merging: elements from oldHead that are not
  // in newHead are removed from oldHead
  // Then we can merge the rest of the tags from newHead into oldHead
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = oldTags[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var oldTag = _step4.value;

      var tagInNewHead = isTagInCollection(oldTag, newTags);
      if (tagInNewHead) tagsToRemoveFromNewHead.push(tagInNewHead);else tagsToRemoveFromOldHead.push(oldTag);
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = tagsToRemoveFromNewHead[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var tag = _step5.value;

      newHead.removeChild(tag);
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  var _iteratorNormalCompletion6 = true;
  var _didIteratorError6 = false;
  var _iteratorError6 = undefined;

  try {
    for (var _iterator6 = tagsToRemoveFromOldHead[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
      var _tag = _step6.value;

      oldHead.removeChild(_tag);
    }
  } catch (err) {
    _didIteratorError6 = true;
    _iteratorError6 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion6 && _iterator6.return) {
        _iterator6.return();
      }
    } finally {
      if (_didIteratorError6) {
        throw _iteratorError6;
      }
    }
  }

  var fragment = document.createDocumentFragment();
  for (var i = 0; i < newHead.length; i++) {
    fragment.appendChild(newHead[i]);
  }oldHead.appendChild(fragment);
};