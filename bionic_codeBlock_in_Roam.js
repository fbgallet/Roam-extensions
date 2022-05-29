// code to copy as child of a {{[[roam/js]]}} block, in a JavaScript code block:
var existing = document.getElementById("roam-bionic-text");
if (!existing) {
  var bionic = document.createElement("script");
  bionic.src = "https://fbgallet.github.io/Roam-extensions/bionic_text.js";
  bionic.id = "roam-bionic-text";
  bionic.async = true;
  bionic.type = "text/javascript";
  document.getElementsByTagName("head")[0].appendChild(bionic);
