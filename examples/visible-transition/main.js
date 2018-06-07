document.addEventListener("DOMContentLoaded", function() {
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
});
