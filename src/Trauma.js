class Trauma {
  static INITIATORS = {
    anchorClick: "anchorClick",
    popState: "popState"
  };

  static replaceElement = (DOMElement, newDOMElement) => {
    DOMElement.parentNode.replaceChild(newDOMElement, DOMElement);
  };

  static doesRouteMatch = (href, stringRegexOrFunction) => {
    if (typeof stringRegexOrFunction === "string") {
      return href.indexOf(stringRegexOrFunction) !== -1;
    } else if (typeof stringRegexOrFunction === "object" && stringRegexOrFunction.test === RegExp.prototype.test) {
      return stringRegexOrFunction.test(href);
    } else if (typeof stringRegexOrFunction === "function") {
      return stringRegexOrFunction(href);
    }
    return false;
  };

  /**
   * Replaces old head with new head, but doesn't replace the tags
   * that are in both heads. We do this to prevent possible CSS
   * re-evaluations.
   */
  static replaceHeadWithoutReplacingUnion = (oldHead, newHead) => {
    const isTagInCollection = (tag, collection) => {
      const tag1Id = tag.outerHTML;
      for (const otherTag of collection) {
        const tag2Id = otherTag.outerHTML;
        if (tag1Id === tag2Id) return otherTag;
      }
    };

    const oldTags = oldHead.children;
    const newTags = newHead.children;
    const tagsToRemoveFromOldHead = [];
    const tagsToRemoveFromNewHead = [];

    // newHead will be merged in oldHead.
    // To prepare newHead for merging: elements that are already in oldHead
    // are removed from newHead
    // To prepare oldHead for merging: elements from oldHead that are not
    // in newHead are removed from oldHead
    // Then we can merge the rest of the tags from newHead into oldHead
    for (const oldTag of oldTags) {
      const tagInNewHead = isTagInCollection(oldTag, newTags);
      if (tagInNewHead) tagsToRemoveFromNewHead.push(tagInNewHead);
      else tagsToRemoveFromOldHead.push(oldTag);
    }

    for (const tag of tagsToRemoveFromNewHead) {
      newHead.removeChild(tag);
    }

    for (const tag of tagsToRemoveFromOldHead) {
      oldHead.removeChild(tag);
    }

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < newHead.length; i++) fragment.appendChild(newHead[i]);
    oldHead.appendChild(fragment);
  };

  constructor(transitionConfigs, sceneSelector = "#scene") {
    this.startTransitionDone = false;
    this.requestDone = false;
    this.shouldReplaceScene = false;

    this.config = transitionConfigs;
    this.sceneSelector = sceneSelector;

    this.history = [window.location.href];

    this.listenForAnchorURLs();
    this.listenForPopStateURLs();
  }

  listenForAnchorURLs = () => {
    const anchorElements = document.querySelectorAll("a");
    for (const anchorElement of anchorElements) {
      anchorElement.addEventListener("click", this.handleAnchorClick.bind(null, anchorElement));
    }
  };

  handleAnchorClick = anchorElement => {
    const nextURL = anchorElement.getAttribute("href");
    if (nextURL == null) return;
    this.oldURL = window.location.pathname;
    event.preventDefault();
    this.transitionInitiator = Trauma.INITIATORS.anchorClick;
    this.getNewPage(nextURL);
  };

  listenForPopStateURLs = () => window.addEventListener("popstate", this.handlePopState);

  handlePopState = () => {
    if (this.history.length === 1) {
      console.log("history is empty");
      return false;
    }
    this.oldURL = this.history.pop();
    const nextURL = this.history[this.history.length - 1];

    event.preventDefault();
    this.transitionInitiator = Trauma.INITIATORS.popState;
    this.getNewPage(nextURL);
  };

  getNewPage = nextURL => {
    const request = new XMLHttpRequest();
    request.addEventListener("readystatechange", this.handleReadyStateChange.bind(null, request));
    request.open("GET", nextURL, true);
    request.send();

    for (const config of this.config) {
      if (Trauma.doesRouteMatch(this.oldURL, config.from) === false) continue;
      if (config.to != null && Trauma.doesRouteMatch(nextURL, config.to) === false) continue;

      console.log("FROM:", this.oldURL, "\nTO:", nextURL);

      this.finish = config.finish;
      this.start = config.start;

      this.start(this.replace, this.insertNext, document.querySelector(this.sceneSelector));
      break;
    }
  };

  replace = () => {
    this.startTransitionDone = true;
    this.shouldReplaceScene = true;
    this.tryRunEndTransition();
  };

  insertNext = () => {
    this.startTransitionDone = true;
    this.shouldReplaceScene = false;
    this.tryRunEndTransition();
  };

  tryRunEndTransition = () => {
    const canRunTransition = this.requestDone && this.startTransitionDone;
    if (!canRunTransition) return;

    if (this.transitionInitiator === Trauma.INITIATORS.anchorClick) {
      this.history.push(this.nextURL);
      window.history.pushState({}, null, this.nextURL);
    }

    const activeHead = document.head;
    const nextHead = this.nextDocument.head;
    Trauma.replaceHeadWithoutReplacingUnion(activeHead, nextHead);

    this.oldScene = document.querySelector(this.sceneSelector);
    this.newScene = this.nextDocument.querySelector(this.sceneSelector);

    if (this.shouldReplaceScene) {
      Trauma.replaceElement(this.oldScene, this.newScene);
    } else {
      this.oldScene.style.position = "absolute";
      this.oldScene.style.top = "0";
      this.oldScene.insertAdjacentElement("beforeBegin", this.newScene);
    }

    this.finish(this.finalize, this.newScene, this.oldScene);
  };

  finalize = () => {
    console.log("history...\n  ", this.history.slice(-3).join("\n  "));

    if (this.shouldReplaceScene === false) {
      this.oldScene.parentElement.removeChild(this.oldScene);
    }

    this.listenForAnchorURLs();

    // Reset everything
    this.requestDone = false;
    this.startTransitionDone = false;
    this.newScene = undefined;
    this.oldScene = undefined;
  };

  handleReadyStateChange = request => {
    if (request.readyState === XMLHttpRequest.DONE) {
      // TODO: Check if response is valid HTML
      const body = request.responseText;
      const parser = new DOMParser();

      this.nextDocument = parser.parseFromString(body, "text/html");
      this.nextURL = request.responseURL;

      this.requestDone = true;
      this.tryRunEndTransition();
    }
  };
}
