TraumaJS is a lightweight library that enables you to easily create page transition using an intuitive and simple API.

\*gifs

# Features:

* Simple, intuitive API
* Covers most common cases
* Lightweight
* Supports all major browsers

# Usage

When creating page transitions there’s two common patterns you can use. The simpler one works like this. When the user clicks a link a transitioner element hides the old page, then the old page is replaced with the new one and finally the transitioner reveals the new page. This is called a _hidden_ transition.

The other pattern you might use is a bit more complicated and it works like this. The user clicks a link and the page shows some kind of feedback. For example blurs out it’s content. When the new page loads, it is inserted in the DOM behind the old page. Now you can reveal the new page by removing the old page however you like. This approach is more advanced, but it gives more flexibility to the user. It’s called a _visible_ transition.

## How Trauma works

When you click a link on your webpage, Trauma prevents the default browser action of reloading the whole page and instead just starts fetching the new page in the background. While the new page is being fetched you can show the user the starting animation. You can choose what happens once the page is loaded. Either replace the old page or insert the new page next to the old one. Then the finishing animation runs. This is where the smooth transition should be performed.

# Setup

## HTML

All your pages must contain an element with the id of `active-scene`. Trauma will search for this element in all the pages it loads and replace the element from the old page with the element it finds in the new page.

## Javascript

Include the Trauma.js script on all your pages.

Once the page is loaded initialize Trauma with an array of transition objects, each describing the transition and the pages it should be active on. Keep in mind the `DOMContentLoaded` event will fire only once, so it's recommended to run all your scripts from a centralized function after each transition.

# API

## constructor

The constructor accepts an array of TransitionConfig objects. Each TransitionConfig object must have the following properties.

* from: (regex | string | function) - Defines on which pages the transition should fire. If it's a regex, Trauma will check if the current page URL matches that regex. If it's a string Trauma will check if the current page URL contains that string. If it's a function it accepts the current URL and should return true if the transition should fire or false if it should not.
* to: (undefined | regex | string | function) - Optional argument. If it's left undefined then the `from` property alone decides if the transition should fire. If it's defined it works exactly like the `from` property, except it works with the next page URL which is read from the link href or internally from the instance if the back button is pressed.
* start: (function) - Runs when the transition starts. The function is passed three arguments

  * replace - Calling this function replaces the current scene with the new scene.
  * insert - Calling this function inserts the new scene in the page DOM just before the old scene.
  * oldScene - This is the scene element on the active page.

  You must call either `replace` or `insert` in order to advance the transition. Depending on what you call, the transition behaves differently. If you're creating a hidden transition you should hide the active page with your transitioner and then call replace. If you're creating a visible transition you should give the user some feedback, like fading the content or something similar.

* finish: (function) - Runs when the next page loads and the start function ends. It is passed three arguments.

  * done - Function that should be called when the transition is over. It destroys the old scene in the case when `insert` is called in the start function.
  * newScene - The new scene
  * oldScene - In the case when `insert` is called it holds a reference to the new scene, and in the case `replace` is called it is `null`

  The finish function should perform the finishing part of the transition.

# Examples

For your convenience here are some examples to get you up and running.

## Simple hidden transition

### [Demo]()

    new Trauma([
      {
        from: /.*/,
        start: function(replace) {
          TweenMax.fromTo("#transitioner", 0.5, { left: 0, right: "100%" }, { right: "0%", onComplete: replace });
        },
        finish: function(done) {
          TweenMax.to("#transitioner", 0.5, { left: "100%", onComplete: done });
        }
      }
    ]);

The `transitioner` element has the following style rule

    .transitioner {
      z-index: 100;
      position: absolute;
      top: 0;
      background-color: #fff786;
      height: 100vh;
    }  

## Simple visible transition

    new Trauma([
      {
        from: /.*/,
        start: function(replace, insert, oldScene) {
          var content = oldScene.children;
          TweenMax.to(content, 0.5, { opacity: 0, onComplete: insert });
        },
        finish: function(done, newScene, oldScene) {
          TweenMax.to(oldScene, 0.5, { opacity: 0, onComplete: done });
        }
      }
    ]);

## Shared element transition

    new Trauma([
      {
        from: /page/,
        to: /page/,
        start: function(replace, insert, oldScene) {
          var content = oldScene.querySelectorAll(":not(#shared-element)");
          TweenMax.to(content, 0.5, { opacity: 0, onComplete: insert });

          this.oldShared = oldScene.querySelector("#shared-element");
          this.oldBox = this.oldShared.getBoundingClientRect();
        },
        finish: function(done, newScene, oldScene) {
          var newShared = newScene.querySelector("#shared-element");
          var newBox = newShared.getBoundingClientRect();

          var dx = newBox.left - this.oldBox.left;
          var dy = newBox.top - this.oldBox.top;

          TweenMax.to(this.oldShared, 0.5, { x: dx, y: dy, onComplete: fadeOut });
          function fadeOut() {
            TweenMax.to(oldScene, 0.5, { opacity: 0, onComplete: done });
          }
        }
      },
      {
        from: /.*/,
        start: function(replace) {
          TweenMax.fromTo("#transitioner", 0.5, { left: 0, right: "100%" }, { right: "0%", onComplete: replace });
        },
        finish: function(done) {
          TweenMax.to("#transitioner", 0.5, { left: "100%", onComplete: done });
        }
      }
    ]);

## Multiple transitions:

    new Trauma([
      {
        from: /page/,
        to: /page/,
        start: function(replace, insert, oldScene) {
          var content = oldScene.querySelectorAll(":not(#shared-element)");
          TweenMax.to(content, 0.5, { opacity: 0, onComplete: insert });

          this.oldShared = oldScene.querySelector("#shared-element");
          this.oldBox = this.oldShared.getBoundingClientRect();
        },
        finish: function(done, newScene, oldScene) {
          var newShared = newScene.querySelector("#shared-element");
          var newBox = newShared.getBoundingClientRect();

          var dx = newBox.left - this.oldBox.left;
          var dy = newBox.top - this.oldBox.top;

          TweenMax.to(this.oldShared, 0.5, { x: dx, y: dy, onComplete: fadeOut });
          function fadeOut() {
            TweenMax.to(oldScene, 0.5, { opacity: 0, onComplete: done });
          }
        }
      },
      {
        from: /.*/,
        start: function(replace) {
          TweenMax.fromTo("#transitioner", 0.5, { left: 0, right: "100%" }, { right: "0%", onComplete: replace });
        },
        finish: function(done) {
          TweenMax.to("#transitioner", 0.5, { left: "100%", onComplete: done });
        }
      }
    ]);
