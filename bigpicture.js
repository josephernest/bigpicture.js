/*
 *
 * bigpicture.js
 *
 * bigpicture.js is a library that allows infinite panning and infinite zooming in HTML pages.
 *               See it in action on http://www.bigpicture.bi/demo !
 *
 * author:  Joseph Ernest (twitter: @JosephErnest)
 * url:     http://github.com/josephernest/bigpicture.js
 *
 */

var bigpicture = (function() {
  "use strict";

  /*
   * INITIALIZATION
   */

  var bpContainer = document.getElementById('bigpicture-container'),
    bp = document.getElementById('bigpicture');

  if (!bp) { return; }

  bp.setAttribute('spellcheck', false);

  var params = { x: getQueryVariable('x'), y: getQueryVariable('y'), zoom: getQueryVariable('zoom') };

  var current = {};
  current.x = params.x ? parseFloat(params.x) : $(bp).data('x');
  current.y = params.y ? parseFloat(params.y) : $(bp).data('y');
  current.zoom = params.zoom ? parseFloat(params.zoom) : $(bp).data('zoom');

  bp.x = 0; bp.y = 0;
  bp.updateContainerPosition = function() { bp.style.left = bp.x + 'px'; bp.style.top = bp.y + 'px'; };

  /*
   * TEXT BOXES
   */

  $(".text").each(function() { updateTextPosition(this); });     // initialization

  $(bp).on('blur', '.text', function() { if ($(this).text().replace(/^\s+|\s+$/g, '') === '') { $(this).remove(); } });

  $(bp).on('input', '.text', function() { redoSearch = true; });

  function updateTextPosition(e) {
    e.style.fontSize = $(e).data("size") / current.zoom + 'px';
    e.style.left = ($(e).data("x") - current.x) / current.zoom - bp.x + 'px';
    e.style.top = ($(e).data("y") - current.y) / current.zoom - bp.y + 'px';
  }

  function newText(x, y, size, text) {
    var tb = document.createElement('div');
    tb.className = "text";
    tb.contentEditable = true;
    tb.innerHTML = text;
    $(tb).data("x", x).data("y", y).data("size", size);
    updateTextPosition(tb);
    bp.appendChild(tb);
    return tb;
  }

  bpContainer.onclick = function(e) {
    if (isContainedByClass(e.target, 'text')) { return; }
    newText(current.x + (e.clientX) * current.zoom, current.y + (e.clientY) * current.zoom, 20 * current.zoom, '').focus();
  };

  /*
   * PAN AND MOVE
   */

  var movingText = null,
    dragging = false,
    previousMousePosition;

  bpContainer.onmousedown = function(e) {
    if ($(e.target).hasClass('text') && (e.ctrlKey || e.metaKey)) {
      movingText = e.target;
      movingText.className = "text noselect notransition";
    }
    else {
      movingText = null;
      dragging = true;
    }
    biggestPictureSeen = false;
    previousMousePosition = { x: e.pageX, y: e.pageY };
  };

  window.onmouseup = function() {
    dragging = false;
    if (movingText) { movingText.className = "text"; }
    movingText = null;
  };

  bpContainer.ondragstart = function(e) {
    e.preventDefault();
  };

  bpContainer.onmousemove = function(e) {
    if (dragging && !e.shiftKey) {       // SHIFT prevents panning / allows selection
      bp.style.transitionDuration = "0s";
      bp.x += e.pageX - previousMousePosition.x;
      bp.y += e.pageY - previousMousePosition.y;
      bp.updateContainerPosition();
      current.x -= (e.pageX - previousMousePosition.x) * current.zoom;
      current.y -= (e.pageY - previousMousePosition.y) * current.zoom;
      previousMousePosition = { x: e.pageX, y: e.pageY };
    }
    if (movingText) {
      $(movingText).data("x", $(movingText).data("x") + (e.pageX - previousMousePosition.x) * current.zoom);
      $(movingText).data("y", $(movingText).data("y") + (e.pageY - previousMousePosition.y) * current.zoom);
      updateTextPosition(movingText);
      previousMousePosition = { x: e.pageX, y: e.pageY };
    }
  };

  /*
   * ZOOM
   */

  bpContainer.ondblclick = function(e) {
    e.preventDefault();
    onZoom((e.ctrlKey || e.metaKey) ? current.zoom * 1.7 * 1.7 : current.zoom / 1.7 / 1.7, current.x + e.clientX * current.zoom, current.y + e.clientY * current.zoom, e.clientX, e.clientY);
  };

  var biggestPictureSeen = false,
    previous;

  function onZoom(zoom, wx, wy, sx, sy) {  // zoom on (wx, wy) (world coordinates) which will be placed on (sx, sy) (screen coordinates)
    wx = (typeof wx === "undefined") ? current.x + window.innerWidth / 2 * current.zoom : wx;
    wy = (typeof wy === "undefined") ? current.y + window.innerHeight / 2 * current.zoom : wy;
    sx = (typeof sx === "undefined") ? window.innerWidth / 2  : sx;
    sy = (typeof sy === "undefined") ? window.innerHeight / 2 : sy;

    bp.style.transitionDuration = "0.2s";

    bp.x = 0; bp.y = 0;
    bp.updateContainerPosition();
    current.x = wx - sx * zoom; current.y = wy - sy * zoom; current.zoom = zoom;

    $(".text").each(function() { updateTextPosition(this); });

    biggestPictureSeen = false;
  }

  function zoomOnText(res) {
    onZoom($(res).data('size') / 20, $(res).data('x'), $(res).data('y'));
  }

  function seeBiggestPicture(e) {
    e.preventDefault();
    document.activeElement.blur();
    function universeboundingrect() {
      var minX = Infinity, maxX = - Infinity, minY = Infinity, maxY = - Infinity;
      var texteelements = document.getElementsByClassName('text');
      [].forEach.call(texteelements, function(elt) {
        var rect2 = elt.getBoundingClientRect();
        var rect = { left: $(elt).data("x"),
                     top: $(elt).data("y"),
                     right: (rect2.width > 2 && rect2.width < 10000) ? current.x + rect2.right * current.zoom : $(elt).data("x") + 300 * $(elt).data("size") / 20,
                     bottom: (rect2.height > 2 && rect2.height < 10000) ? current.y + rect2.bottom * current.zoom : $(elt).data("y") + 100 * $(elt).data("size") / 20 };
        if (rect.left < minX) { minX = rect.left; }
        if (rect.right > maxX) { maxX = rect.right; }
        if (rect.top < minY) { minY = rect.top; }
        if (rect.bottom > maxY) { maxY = rect.bottom; }
      });
      return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
    }

    var texts = document.getElementsByClassName('text');
    if (texts.length === 0) { return; } 
    if (texts.length === 1) { zoomOnText(texts[0]); return; }

    if (!biggestPictureSeen) {
      previous = { x: current.x, y: current.y, zoom: current.zoom };
      var rect = universeboundingrect();
      var zoom = Math.max((rect.maxX - rect.minX) / window.innerWidth, (rect.maxY - rect.minY) / window.innerHeight) * 1.1;
      onZoom(zoom, (rect.minX + rect.maxX) / 2, (rect.minY + rect.maxY) / 2);
      biggestPictureSeen = true;
    }
    else {
      onZoom(previous.zoom, previous.x, previous.y, 0, 0);
      biggestPictureSeen = false;
    }
  }

  /*
   * SEARCH
   */

  var results = { index: -1, elements: [], text: "" },
    redoSearch = true,
    query;

  function find(txt) {
    results = { index: -1, elements: [], text: txt };
    $(".text").each(function() {
      if ($(this).text().toLowerCase().indexOf(txt.toLowerCase()) != -1) { results.elements.push(this); }
    });
    if (results.elements.length > 0) { results.index = 0; }
  }

  function findNext(txt) {
    if (!txt || txt.replace(/^\s+|\s+$/g, '') === '') { return; }   // empty search
    if (results.index == -1 || results.text != txt || redoSearch) {
      find(txt);
      if (results.index == -1) { return; }       // still no results
      redoSearch = false;
    }
    var res = results.elements[results.index];
    zoomOnText(res);
    results.index += 1;
    if (results.index == results.elements.length) { results.index = 0; }  // loop
  }

  /*
   * MOUSEWHEEL
   */

  var mousewheeldelta = 0, 
    last_e, 
    mousewheeltimer = null, 
    mousewheel;

  if (navigator.appVersion.indexOf("Mac") != -1) {   // Mac OS X
    mousewheel = function(e) {
      e.preventDefault();
      mousewheeldelta += Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
      last_e = e;
      if (!mousewheeltimer) {
        mousewheeltimer = setTimeout(function() {
          onZoom((mousewheeldelta > 0) ? current.zoom / 1.7 : current.zoom * 1.7, current.x + last_e.clientX * current.zoom, current.y + last_e.clientY * current.zoom, last_e.clientX, last_e.clientY);
          mousewheeldelta = 0;
          mousewheeltimer = null; }, 70);
      }
    };
  }
  else {
    mousewheel = function(e) {
      e.preventDefault();
      var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
      onZoom((delta > 0) ? current.zoom / 1.7 : current.zoom * 1.7, current.x + e.clientX * current.zoom, current.y + e.clientY * current.zoom, e.clientX, e.clientY);
    };
  }

  if ("onmousewheel" in document) { bpContainer.onmousewheel = mousewheel; }
  else { bpContainer.addEventListener('DOMMouseScroll', mousewheel, false); }

  /*
   * KEYBOARD SHORTCUTS
   */

  window.onkeydown = function(e) {
    if (((e.ctrlKey && !e.altKey || e.metaKey) && (e.keyCode == 61 || e.keyCode == 187 || e.keyCode == 171 || e.keyCode == 107 || e.key == '+' || e.key == '=' ))   // CTRL+PLUS or COMMAND+PLUS 
    || e.keyCode == 34) {   // PAGE DOWN     // !e.altKey to prevent catching of ALT-GR 
      e.preventDefault();
      onZoom(current.zoom / 1.7);
      return;
    }
    if (((e.ctrlKey && !e.altKey || e.metaKey) && (e.keyCode == 54 || e.keyCode == 189 || e.keyCode == 173 || e.keyCode == 167 || e.keyCode == 109 || e.keyCode == 169 || e.keyCode == 219 || e.key == '-' ))   // CTRL+MINUS or COMMAND+MINUS
    || e.keyCode == 33) {   // PAGE UP
      e.preventDefault();
      onZoom(current.zoom * 1.7);
      return;
    }
    if ((e.ctrlKey && !e.altKey || e.metaKey) && e.keyCode == 70) {         // CTRL+F
      e.preventDefault();
      setTimeout(function() { query = window.prompt("What are you looking for?", ""); findNext(query); }, 10);
      return;
    }
    if (e.keyCode == 114) {                 // F3
      e.preventDefault();
      if (results.index == -1) { setTimeout(function() { query = window.prompt("What are you looking for?", ""); findNext(query); }, 10); }
      else { findNext(query); }
      return;
    }
    if (e.keyCode == 113) {                 // F2
      e.preventDefault();
      seeBiggestPicture(e);
      return;
    }
  };

  /*
   * USEFUL FUNCTIONS
   */

  function isContainedByClass(e, cls) { while (e && e.tagName) { if (e.classList.contains(cls)) { return true; } e = e.parentNode; } return false; }

  function getQueryVariable(id) { var params = window.location.search.substring(1).split("&");  for (var i = 0; i < params.length; i++) { var p = params[i].split("="); if (p[0] == id) { return p[1]; } } return(false); }

  /*
   * API
   */

  return { newText: newText, 
           current: current, 
           updateTextPosition: updateTextPosition };

})();