document.addEventListener("DOMContentLoaded", function() {
  // Simple hidden transition
  new Trauma([
    {
      from: /page/,
      to: /page/,
      start: function(replace, insert, oldScene) {
        console.log("page to page");
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
});
