document.addEventListener("DOMContentLoaded", function() {
  // Simple hidden transition
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
});
