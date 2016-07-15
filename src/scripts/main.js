(function($) {
  /**
   * @param {?} opts
   * @return {undefined}
   */
  function init(opts) {
    var $menu = $(this);
    /** @type {null} */
    var item = null;
    /** @type {Array} */
    var mouseLocs = [];
    /** @type {null} */
    var lastDelayLoc = null;
    /** @type {null} */
    var timer = null;
    var options = $.extend({
      rowSelector : "> li",
      submenuSelector : "*",
      submenuDirection : "right",
      toleranceUp : 75,
      toleranceDown : 75,
      enter : $.noop,
      exit : $.noop,
      activate : $.noop,
      deactivate : $.noop,
      exitMenu : $.noop
    }, opts);
    /** @type {number} */
    var MOUSE_LOCS_TRACKED = 3;
    /** @type {number} */
    var l = 300;
    /**
     * @param {Touch} e
     * @return {undefined}
     */
    var mousemoveDocument = function(e) {
      mouseLocs.push({
        x : e.pageX,
        y : e.pageY
      });
      if (mouseLocs.length > MOUSE_LOCS_TRACKED) {
        mouseLocs.shift();
      }
    };
    /**
     * @return {undefined}
     */
    var mouseleaveMenu = function() {
      if (timer) {
        clearTimeout(timer);
      }
      if (options.exitMenu(this)) {
        if (item) {
          options.deactivate(item);
        }
        /** @type {null} */
        item = null;
      }
    };
    /**
     * @return {undefined}
     */
    var mouseenterRow = function() {
      if (timer) {
        clearTimeout(timer);
      }
      options.enter(this);
      possiblyActivate(this);
    };
    /**
     * @return {undefined}
     */
    var mouseleaveRow = function() {
      options.exit(this);
    };
    /**
     * @return {undefined}
     */
    var clickRow = function() {
      activate(this);
    };
    /**
     * @param {?} name
     * @return {undefined}
     */
    var activate = function(name) {
      if (name != item) {
        if (item) {
          options.deactivate(item);
        }
        options.activate(name);
        item = name;
      }
    };
    /**
     * @param {(Error|string)} row
     * @return {undefined}
     */
    var possiblyActivate = function(row) {
      var delay = activationDelay();
      if (delay) {
        /** @type {number} */
        timer = setTimeout(function() {
          possiblyActivate(row);
        }, delay);
      } else {
        activate(row);
      }
    };
    /**
     * @return {?}
     */
    var activationDelay = function() {
      /**
       * @param {?} a
       * @param {Object} b
       * @return {?}
       */
      function slope(a, b) {
        return(b.y - a.y) / (b.x - a.x);
      }
      var decreasingCorner;
      var increasingCorner;
      if (!item || !$(item).is(options.submenuSelector)) {
        return 0;
      }
      var offset = $menu.offset();
      var lowerLeft = {
        x : offset.left,
        y : offset.top - options.toleranceUp
      };
      var upperLeft = {
        x : offset.left + $menu.outerWidth(),
        y : lowerLeft.y - options.toleranceUp
      };
      var local = {
        x : offset.left,
        y : offset.top + $menu.outerHeight() + options.toleranceDown
      };
      var lowerRight = {
        x : offset.left + $menu.outerWidth(),
        y : local.y + options.toleranceDown
      };
      var loc = mouseLocs[mouseLocs.length - 1];
      var prevLoc = mouseLocs[0];
      if (!loc || ((prevLoc || (prevLoc = loc), prevLoc.x < offset.left || (prevLoc.x > lowerRight.x || (prevLoc.y < offset.top || prevLoc.y > lowerRight.y))) || lastDelayLoc && (loc.x == lastDelayLoc.x && loc.y == lastDelayLoc.y))) {
        return 0;
      }
      decreasingCorner = upperLeft;
      increasingCorner = lowerRight;
      if (options.submenuDirection == "left") {
        decreasingCorner = local;
        increasingCorner = lowerLeft;
      } else {
        if (options.submenuDirection == "below") {
          decreasingCorner = lowerRight;
          increasingCorner = local;
        } else {
          if (options.submenuDirection == "above") {
            decreasingCorner = lowerLeft;
            increasingCorner = upperLeft;
          }
        }
      }
      var decreasingSlope = slope(loc, decreasingCorner);
      var increasingSlope = slope(loc, increasingCorner);
      var prevDecreasingSlope = slope(prevLoc, decreasingCorner);
      var prevIncreasingSlope = slope(prevLoc, increasingCorner);
      return decreasingSlope < prevDecreasingSlope && increasingSlope > prevIncreasingSlope ? (lastDelayLoc = loc, l) : (lastDelayLoc = null, 0);
    };
    $menu.mouseleave(mouseleaveMenu).find(options.rowSelector).mouseenter(mouseenterRow).mouseleave(mouseleaveRow).click(clickRow);
    $(document).mousemove(mousemoveDocument);
  }
  /**
   * @param {?} opts
   * @return {?}
   */
  $.fn.menuAim = function(opts) {
    return this.each(function() {
      init.call(this, opts);
    }), this;
  };
})(jQuery);
"use strict";
(function($) {
  /**
   * @return {undefined}
   */
  function Grid() {
    var game = this;
    var $related;
    var $col;
    /** @type {null} */
    game.shellUserDropdown = null;
    /** @type {null} */
    game.shellFooterDropdown = null;
    /** @type {null} */
    game.shellNavDropdown = null;
    /** @type {null} */
    game.shellNavTab = null;
    /** @type {null} */
    game.shellToggle = null;
    /** @type {(HTMLElement|null)} */
    game.shellHeader = document.getElementById("shell-header");
    game.responsiveEnabled = $(".shell-responsive").length;
    /** @type {number} */
    game.breakpoint = 899;
    /** @type {number} */
    game.meControlMobileBreakpoint = 540;
    /** @type {null} */
    game.resizeTimeout = null;
    $related = $(".shell-header-nav-toggle");
    $col = $(".fixed-global-nav-buffer");
    /**
     * @return {undefined}
     */
    game.resizeThrottler = function() {
      if (!game.resizeTimeout) {
        /** @type {number} */
        game.resizeTimeout = setTimeout(function() {
          /** @type {null} */
          game.resizeTimeout = null;
          game.resizeHandler();
        }, 250);
      }
    };
    /**
     * @return {undefined}
     */
    game.resizeHandler = function() {
      if (!window.msCommonShellIE8) {
        game.shellToggle.closeNav();
      }
      game.shellFooterDropdown.handleFooterResize();
      game.shellNavDropdown.handleMobileDesktopViewSwitch();
      $col.height(game.shellHeader.offsetHeight);
      game.shellToggle.handleSearchResize();
    };
    /**
     * @return {?}
     */
    game.matchesSmall = function() {
      return $related.is(":visible") ? true : game.responsiveEnabled ? !window.msCommonShellIE8 && window.matchMedia ? window.matchMedia("(max-width: " + game.breakpoint + "px)").matches : $(window).width() < game.breakpoint : false;
    };
    /**
     * @return {?}
     */
    game.matchesLarge = function() {
      return $related.is(":visible") ? false : game.responsiveEnabled ? !window.msCommonShellIE8 && window.matchMedia ? window.matchMedia("(min-width: " + game.breakpoint + "px)").matches : $(window).width() >= game.breakpoint : true;
    };
    /**
     * @return {?}
     */
    game.matchesOverMeControlMobile = function() {
      return game.responsiveEnabled ? !window.msCommonShellIE8 && window.matchMedia ? window.matchMedia("(min-width: " + game.meControlMobileBreakpoint + "px)").matches : $(window).width() >= game.meControlMobileBreakpoint : true;
    };
    /**
     * @return {undefined}
     */
    game.init = function() {
      if (!$(".shell-category-header").length) {
        $(game.shellHeader).addClass("global-sticky");
      }
      game.shellUserDropdown = new open(game);
      game.shellFooterDropdown = new Game(game);
      game.shellNavDropdown = new init(game);
      game.shellNavTab = new Map(game);
      game.shellToggle = new Player(game);
      $(".shell-header-dropdown-content").menuAim({
        rowSelector : "> dl",
        activate : game.shellNavTab.display,
        toleranceUp : 500,
        toleranceDown : 300,
        /**
         * @return {?}
         */
        exitMenu : function() {
          return true;
        }
      });
      $(window).resize(game.resizeThrottler);
      game.resizeHandler();
    };
    game.init();
  }
  /**
   * @param {?} socket
   * @return {undefined}
   */
  function Game(socket) {
    var game = this;
    var link = $(".grp-title");
    var r;
    game.shellUI = socket;
    /**
     * @return {?}
     */
    game.isMobileView = function() {
      return game.shellUI.matchesSmall() && !game.shellUI.matchesOverMeControlMobile();
    };
    /**
     * @param {Event} evt
     * @return {undefined}
     */
    game.toggleFooterDropDown = function(evt) {
      if (game.isMobileView()) {
        game.toggle(evt.target);
        /** @type {boolean} */
        var checked = $(evt.target).attr("aria-expanded") === "true";
        $(evt.target).attr("aria-expanded", !checked);
      }
    };
    /**
     * @return {undefined}
     */
    game.setAccessibleAttributes = function() {
      link.attr("aria-expanded", false).attr("role", "button").attr("tabindex", 0);
    };
    /**
     * @param {?} e
     * @return {undefined}
     */
    game.toggle = function(e) {
      $(e).siblings("ul").slideToggle(200);
    };
    /**
     * @return {undefined}
     */
    game.init = function() {
      if (game.isMobileView()) {
        game.setAccessibleAttributes();
        /** @type {boolean} */
        r = true;
      }
      link.on("click.shellFooterDropdown", game.toggleFooterDropDown).on("keydown", function(evt) {
        if (evt.which == 13) {
          game.toggleFooterDropDown(evt);
        }
      });
    };
    /**
     * @return {undefined}
     */
    game.handleFooterResize = function() {
      if (game.shellUI.matchesOverMeControlMobile()) {
        link.siblings("ul").css("display", "");
      }
      if (game.isMobileView() && !r) {
        game.setAccessibleAttributes();
        /** @type {boolean} */
        r = true;
      } else {
        if (!game.isMobileView()) {
          if (r) {
            link.removeAttr("aria-expanded role tabindex");
            /** @type {boolean} */
            r = false;
          }
        }
      }
    };
    game.init();
  }
  /**
   * @param {?} filename
   * @return {undefined}
   */
  function open(filename) {
    var proto = this;
    proto.shellUI = filename;
    /**
     * @return {undefined}
     */
    proto.open = function() {
      $(".shell-header-user").addClass("active");
    };
    /**
     * @return {undefined}
     */
    proto.close = function() {
      $(".shell-header-user").removeClass("active");
    };
    /**
     * @param {?} target
     * @return {undefined}
     */
    proto.toggle = function(target) {
      $(target).closest(".shell-header-user").toggleClass("active");
    };
    /**
     * @return {undefined}
     */
    proto.init = function() {
      $(".shell-header-user-label a").on("click.shellUserDropdown", function() {
        return proto.toggle(this), false;
      });
      $(document).on("click.shellUserDropdownOutside", function(ev) {
        if (!$(ev.target).closest(".shell-header-user").length) {
          proto.close();
        }
      });
      $(document).on("keyup.shellUserDropdownOutside", function(event) {
        if (event.keyCode == 27) {
          proto.close();
        }
      });
    };
    proto.init();
  }
  /**
   * @param {?} fn
   * @return {undefined}
   */
  function init(fn) {
    var options = this;
    var $field = $(".shell-header");
    var $slide = $(".shell-header-dropdown");
    var btnEl = $(".shell-header-dropdown-tab");
    var target = $(".shell-header-dropdown-content");
    var $element = $(".shell-header-dropdown-tab-content");
    var $el = $(".shell-header-nav-wrapper");
    var el = $(".shell-header-nav-toggle");
    var handle = $(document.getElementById("meControl"));
    var resizer = $(".shell-header-user dt");
    var _this = $(".shell-header-user-mobile-container");
    var $this = $(".c-nav-pagination");
    /** @type {number} */
    var iBoxHack = 40;
    /** @type {number} */
    var s = 200;
    options.shellUI = fn;
    /**
     * @param {Object} target
     * @return {undefined}
     */
    options.open = function(target) {
      var div;
      if (target.addClass("active"), div = target.find(".shell-header-dropdown-content"), options.shellUI.matchesLarge()) {
        if (target.hasClass("horizontalLayout")) {
          var idfirst = target.data("navcontainer");
          var $this = $("#" + idfirst);
          var $activeTab = $this.siblings(".shell-header-HL2");
          if (!$this.hasClass("active")) {
            $activeTab.removeClass("active");
            $this.addClass("active");
          }
        } else {
          if (!$field.hasClass("mobile-view")) {
            div.slideDown(s).promise().done(function() {
              options.offset(target);
              div.css("overflow", "");
            });
          }
        }
      } else {
        div.slideDown(s, function() {
          div.css("overflow", "");
        });
      }
    };
    /**
     * @param {Object} el
     * @return {undefined}
     */
    options.offset = function(el) {
      var $parent = el.closest(".shell-header-wrapper");
      var block = el.find(".shell-header-dropdown-content");
      /** @type {string} */
      var dir = "left";
      /** @type {number} */
      var m = 0;
      /** @type {number} */
      var diff = 0;
      var left;
      var max;
      if ($("body").css("direction") === "rtl") {
        /** @type {string} */
        dir = "right";
        /** @type {number} */
        m = el.offset().left + el.outerWidth() - ($parent.offset().left + block.outerWidth());
        /** @type {number} */
        left = el.offset().left + el.outerWidth() - m;
        /** @type {number} */
        diff = $("body").width() - left - (left - block.outerWidth());
      } else {
        /** @type {number} */
        m = $parent.offset().left + $parent.outerWidth() - (el.offset().left + block.outerWidth());
        max = el.offset().left + m;
        /** @type {number} */
        diff = max - ($("body").width() - max - block.outerWidth());
      }
      if (diff < 0) {
        m -= diff / 2;
      }
      block.css(dir, m < 0 ? m : "");
    };
    /**
     * @param {Object} element
     * @param {HTMLElement} el
     * @return {undefined}
     */
    options.adjustMenuPaneSize = function(element, el) {
      if (this.shellUI.matchesSmall()) {
        $(el[0]).attr("style", "");
      } else {
        el.height("auto");
        var testNode = element.children(".shell-header-dropdown-tab-content");
        if (testNode) {
          if (testNode.height() > el.height()) {
            el.height(testNode.height() - iBoxHack);
          } else {
            testNode.height(el.height() + 8);
          }
        }
      }
    };
    /**
     * @return {undefined}
     */
    options.handleMobileDesktopViewSwitch = function() {
      if (options.shellUI.matchesLarge()) {
        if ($field.hasClass("mobile-view")) {
          $field.removeClass("mobile-view");
          $slide.removeClass("active");
          btnEl.removeClass("active");
          target.removeAttr("style");
          $element.removeAttr("style");
          $el.removeClass("opened");
          $el.removeAttr("style");
          el.removeClass("opened");
          $("html").css("overflow", "auto");
        }
      } else {
        if (!$field.hasClass("mobile-view")) {
          $field.addClass("mobile-view");
          $slide.removeClass("active");
          btnEl.removeClass("active");
          target.removeAttr("style");
          $element.removeAttr("style");
        }
        $this.hide();
      }
      if (options.shellUI.matchesOverMeControlMobile()) {
        if (!resizer.find("#meControl").length) {
          handle.detach();
          resizer.append(handle);
          if (window.MSA) {
            if (window.MSA.MeControl) {
              if (options.shellUI.matchesLarge()) {
                window.MSA.MeControl.API.setMobileState(0);
              } else {
                window.MSA.MeControl.API.setMobileState(1);
              }
            }
          }
        }
      } else {
        if (!_this.find("#meControl").length) {
          handle.detach();
          _this.append(handle);
          if (window.MSA) {
            if (window.MSA.MeControl) {
              window.MSA.MeControl.API.setMobileState(2);
            }
          }
          if (!$slide.length) {
            if (!handle.length) {
              el.css("display", "none");
            }
          }
        }
      }
    };
    /**
     * @return {undefined}
     */
    options.closed = function() {
      if (options.shellUI.matchesLarge()) {
        $(".shell-header-dropdown-content").height("auto");
      }
    };
    /**
     * @param {Object} context
     * @return {undefined}
     */
    options.close = function(context) {
      context.removeClass("active");
      context.find(".shell-header-dropdown-content").slideUp(s, options.closed);
      context.find(".shell-header-dropdown-tab").removeClass("active");
    };
    /**
     * @return {undefined}
     */
    options.closeAll = function() {
      var $shcell = $(document.activeElement).closest(".shell-header-dropdown");
      var $document;
      $(".shell-header-dropdown").removeClass("active");
      target.slideUp(s, options.closed);
      btnEl.removeClass("active");
      if (options.shellUI.matchesSmall()) {
        $slide.removeClass("active");
        target.removeAttr("style");
        $element.removeAttr("style");
        $el.removeClass("opened");
        $el.hide();
        el.removeClass("opened");
        $("html").css("overflow", "auto");
      }
      $document = $(".shell-header-dropdown");
      options.CloseAriaAttributes($document.find(".shell-header-dropdown-label > a[aria-expanded]"), "aria-expanded");
      options.CloseAriaAttributes($document.find(".shell-header-dropdown-content"), "aria-hidden");
      if ($shcell.length) {
        $shcell.find(".shell-header-dropdown-label").find("a").first().focus();
      }
    };
    /**
     * @param {string} el
     * @param {string} pos
     * @return {undefined}
     */
    options.toggleAriaAttributes = function(el, pos) {
      if (el) {
        if (el.length) {
          if (el.attr(pos) === "false") {
            el.attr(pos, "true");
          } else {
            el.attr(pos, "false");
          }
        }
      }
    };
    /**
     * @param {string} api
     * @param {string} elem
     * @return {undefined}
     */
    options.CloseAriaAttributes = function(api, elem) {
      if (api) {
        if (api.length) {
          if (elem === "aria-expanded") {
            api.attr(elem, "false");
          } else {
            api.attr(elem, "true");
          }
        }
      }
    };
    /**
     * @param {?} target
     * @return {undefined}
     */
    options.toggle = function(target) {
      var self = $(target).closest(".shell-header-dropdown");
      var $next = self.siblings(".shell-header-dropdown");
      var passesLink;
      var failuresLink;
      if (self.length) {
        if (self.hasClass("active")) {
          options.close(self);
        } else {
          $next.removeClass("active");
          $next.find(".shell-header-dropdown-content").slideUp(s, options.closed);
          options.open(self);
        }
      }
      passesLink = self.find(".shell-header-dropdown-label > a[aria-expanded]");
      failuresLink = self.find(".shell-header-dropdown-content");
      options.toggleAriaAttributes(passesLink, "aria-expanded");
      options.toggleAriaAttributes(failuresLink, "aria-hidden");
    };
    /**
     * @return {?}
     */
    options.SelectUp = function() {
      var $btn = $(document.activeElement);
      /** @type {boolean} */
      var e = false;
      var current;
      var codeSegments;
      var ca;
      var submenu;
      var $activeTab;
      var next;
      var rule;
      var video;
      return $btn.hasClass("shell-l3-list-item") ? (current = $btn.parent(), codeSegments = current.prev(), codeSegments.length && (submenu = current.prev().find("a").first(), submenu.length ? (current.removeClass("shell-header-dropdown-tab-list-active"), submenu.focus(), current.prev().addClass("shell-header-dropdown-tab-list-active")) : (ca = current.closest(".shell-l3-group"), ca.length && (submenu = ca.prev().find("a").last(), submenu.length && (current.removeClass("shell-header-dropdown-tab-list-active"),
      submenu.focus(), submenu.parent().addClass("shell-header-dropdown-tab-list-active"))))), e = true) : $btn.closest(".shell-header-dropdown-tab").length && ($activeTab = $btn.parent().parent(), next = $activeTab.prev(), next.length == 0 && (options.close($btn.closest(".shell-header-dropdown")), rule = $btn.closest(".shell-header-dropdown"), options.CloseAriaAttributes(rule.find(".shell-header-dropdown-label > a[aria-expanded]"), "aria-expanded"), options.CloseAriaAttributes(rule.find(".shell-header-dropdown-content"),
      "aria-hidden")), $activeTab.removeClass("active"), next.length ? (next.addClass("active"), next.find("a").first().focus()) : (video = $btn.closest(".shell-header-dropdown"), video.find(".shell-header-dropdown-label").find("a").first().focus()), e = true), e;
    };
    /**
     * @return {?}
     */
    options.SelectUpMobile = function() {
      var $btn = $(document.activeElement);
      /** @type {boolean} */
      var u = false;
      var $next;
      var rule;
      var vis;
      return $btn.parent().hasClass("shell-header-dropdown-label") ? ($next = $btn.closest(".shell-header-dropdown").prev(), $next.length && !$next.hasClass("shell-header-user-mobile-container") ? $next.find("a").first().focus() : (options.shellUI.shellToggle.toggleHeaderNav(), $(".shell-header-toggle-menu").focus()), u = true) : $btn.parent().hasClass("shell-header-dropdown-tab-label") ? ($btn.closest(".shell-header-dropdown-tab-label").removeClass("shell-header-dropdown-tab-label-mobile-focus"),
      rule = $btn.closest(".shell-header-dropdown-tab").prev(), rule.length ? (rule.find("a").first().focus(), rule.find(".shell-header-dropdown-tab-label").addClass("shell-header-dropdown-tab-label-mobile-focus")) : (options.shellUI.shellNavDropdown.close($btn.closest(".shell-header-dropdown")), $btn.closest(".shell-header-dropdown").find("a").first().focus()), u = true) : $btn.hasClass("shell-l3-list-item") && (rule = $btn.parent().prev().find("a").first().focus(), rule.length == 0 && (vis = $btn.closest(".shell-header-dropdown-tab"),
      options.shellUI.shellNavTab.toggle(vis.find("a").first()), vis.find("a").first().focus()), u = true), u;
    };
    /**
     * @return {?}
     */
    options.SelectDown = function() {
      var target = $(document.activeElement);
      /** @type {boolean} */
      var e = false;
      var i;
      var o;
      var current;
      var next;
      var stream;
      var submenu;
      var $activeTab;
      var $next;
      return target.parent().hasClass("shell-header-dropdown-label") ? (i = target.closest(".shell-header-dropdown"), o = i.siblings(".shell-header-dropdown"), i.length && (o.removeClass("active"), o.find(".shell-header-dropdown-content").slideUp(s, options.closed), options.open(i), setTimeout(function() {
        target.parents("li").find(".shell-header-dropdown-tab").find("a").first().focus();
      }, 300), e = true, options.toggleAriaAttributes(i.find(".shell-header-dropdown-label > a[aria-expanded]"), "aria-expanded"), options.toggleAriaAttributes(i.find(".shell-header-dropdown-content"), "aria-hidden"))) : target.hasClass("shell-l3-list-item") ? (current = target.parent(), next = current.next(), next.length ? (current.removeClass("shell-header-dropdown-tab-list-active"), next.find("a").first().focus(), next.addClass("shell-header-dropdown-tab-list-active")) : (stream = current.closest(".shell-l3-group"),
      stream.length && (submenu = stream.next().find("a").first(), submenu.length && (current.removeClass("shell-header-dropdown-tab-list-active"), submenu.focus(), submenu.parent().addClass("shell-header-dropdown-tab-list-active")))), e = true) : target.closest(".shell-header-dropdown-tab").length && ($activeTab = target.parent().parent(), $next = $activeTab.next(), $next.length && ($activeTab.removeClass("active"), $next.addClass("active"), $next.find("a").first().focus()), e = true), e;
    };
    /**
     * @return {?}
     */
    options.SelectDownMobile = function() {
      var $btn = $(document.activeElement);
      /** @type {boolean} */
      var f = false;
      var rule;
      var li;
      var vis;
      var output;
      return $btn.hasClass("shell-header-toggle-menu") ? ($btn.parent().hasClass("opened") ? $btn.closest(".shell-header-top").find(".shell-header-dropdown-label").first().find("a").first().focus() : (options.shellUI.shellToggle.toggleHeaderNav(), $(".shell-header-nav-wrapper").hasClass("opened") && $("#srv_shellHeaderNav").find(".shell-header-dropdown").first().find("a").first().focus()), f = true) : $btn.parent().hasClass("shell-header-dropdown-label") ? (li = $btn.closest(".shell-header-dropdown"),
      li.hasClass("active") ? li.find(".shell-header-dropdown-tab-label").first().find("a").focus().addClass("shell-header-dropdown-tab-label-mobile-focus") : $btn.closest(".shell-header-dropdown").next().find("a").first().focus(), f = true) : $btn.parent().hasClass("shell-header-dropdown-tab-label") ? (li = $btn.closest(".shell-header-dropdown-tab"), li.hasClass("active") ? li.find(".shell-l3-list-item").first().focus() : ($(".shell-header-dropdown-tab-label-mobile-focus").removeClass("shell-header-dropdown-tab-label-mobile-focus"),
      rule = $btn.closest(".shell-header-dropdown-tab").next(), rule.length ? (rule.find("a").first().focus(), rule.find(".shell-header-dropdown-tab-label").addClass("shell-header-dropdown-tab-label-mobile-focus")) : (rule = $btn.closest(".shell-header-dropdown").next().find("a").first().focus(), rule.length && options.shellUI.shellNavDropdown.close($btn.closest(".shell-header-dropdown")))), f = true) : $btn.hasClass("shell-l3-list-item") && (rule = $btn.parent().next().find("a").first().focus(),
      rule.length == 0 && (li = $btn.closest(".shell-header-dropdown-tab"), vis = li.next(), vis.length && (options.shellUI.shellNavTab.toggle(li.find("a").first()), output = vis.find("a").first().focus(), $(".shell-header-dropdown-tab-label-mobile-focus").removeClass("shell-header-dropdown-tab-label-mobile-focus"), output.parent().addClass("shell-header-dropdown-tab-label-mobile-focus"))), f = true), f;
    };
    /**
     * @return {?}
     */
    options.SelectRight = function() {
      var current = $(document.activeElement);
      /** @type {boolean} */
      var u = false;
      var t;
      var n;
      var $next;
      return current.parent().hasClass("shell-header-dropdown-tab-label") ? (t = current.parent().parent(), n = t.find("li a").first(), n.focus(), t.find(".shell-l3-group").length == 0 ? t.find("li").first().addClass("shell-header-dropdown-tab-list-active") : n.parent().addClass("shell-header-dropdown-tab-list-active"), u = true) : current.parent().hasClass("shell-header-dropdown-label") && ($next = current.closest(".shell-header-dropdown").next(), $next.length ? $next.hasClass("shell-header-dropdown-label") ?
      $next.find("a").first().focus() : $next.find(".shell-header-dropdown-label").find("a").first().focus() : current.closest(".shell-header-dropdown-label").next().find("a").first().focus(), u = true), u;
    };
    /**
     * @return {?}
     */
    options.SelectLeft = function() {
      var current = $(document.activeElement);
      /** @type {boolean} */
      var r = false;
      var button;
      var next;
      var $next;
      return current.parent().hasClass("shell-header-dropdown-tab-list-active") ? (button = current.parent(), next = button.closest(".shell-header-dropdown-tab"), button.removeClass("shell-header-dropdown-tab-list-active"), next.addClass("active"), next.find("a").first().focus(), r = true) : current.parent().hasClass("shell-header-dropdown-label") && ($next = current.closest(".shell-header-dropdown").prev(), $next.length ? $next.hasClass("shell-header-dropdown-label") ? $next.find("a").first().focus() :
      $next.find(".shell-header-dropdown-label").find("a").first().focus() : current.closest(".shell-header-dropdown-label").prev().find("a").first().focus(), r = true), r;
    };
    /**
     * @return {undefined}
     */
    options.init = function() {
      $(".shell-header-dropdown-label a:not(.shell-header-direct-link)").click(function() {
        options.toggle(this);
      });
      $(document).on("click.shellNavDropdownOutside", function(ev) {
        if (!$(ev.target).closest(".shell-header-nav").length) {
          if (!$(ev.target).closest(".shell-header-nav-toggle").length) {
            options.closeAll();
          }
        }
      });
      $(document).on("keyup.shellNavDropdownOutside", function(event) {
        if (event.keyCode == 27) {
          options.closeAll();
        }
      });
      $(document).on("keydown.shellNavDropdownOutside", function(event) {
        var isFloat = $(".shell-header").hasClass("mobile-view");
        var from;
        return event.keyCode == 40 ? isFloat ? !options.SelectDownMobile() : !options.SelectDown() : event.keyCode == 38 ? isFloat ? !options.SelectUpMobile() : !options.SelectUp() : (from = $("body").css("direction") === "rtl", event.keyCode == 39) ? from ? isFloat ? true : !options.SelectLeft() : isFloat ? true : !options.SelectRight() : event.keyCode == 37 ? from ? isFloat ? true : !options.SelectRight() : isFloat ? true : !options.SelectLeft() : void 0;
      });
      var octalLiteral = $.fn.jquery.split(".");
      /** @type {number} */
      iBoxHack = parseInt(octalLiteral[0]) < 2 && parseInt(octalLiteral[1]) <= 7 ? 0 : 8;
    };
    options.init();
  }
  /**
   * @param {?} items
   * @return {undefined}
   */
  function Map(items) {
    var options = this;
    options.shellUI = items;
    /**
     * @param {?} item
     * @return {undefined}
     */
    options.display = function(item) {
      var li;
      var $activeTab;
      var $next;
      if (options.shellUI.matchesLarge()) {
        li = $(item).closest(".shell-header-dropdown-tab");
        $activeTab = li.siblings(".shell-header-dropdown-tab");
        if (!li.hasClass("active")) {
          $activeTab.removeClass("active");
          li.addClass("active");
        }
        $next = li.closest(".shell-header-dropdown-content");
        items.shellNavDropdown.adjustMenuPaneSize(li, $next);
        if (li.find(".shell-header-dropdown-tab-content").length) {
          $next.removeClass("shell-header-dropdown-content-notab");
          options.displayImg(li);
        } else {
          if (!$next.hasClass("shell-header-dropdown-content-notab")) {
            $next.addClass("shell-header-dropdown-content-notab");
          }
        }
      }
    };
    /**
     * @param {Object} li
     * @return {undefined}
     */
    options.displayImg = function(li) {
      li.find("img[data-src]").attr("src", function() {
        return $(this).attr("data-src");
      }).removeAttr("data-src");
    };
    /**
     * @param {?} target
     * @return {undefined}
     */
    options.toggle = function(target) {
      var $this = $(target).closest(".shell-header-dropdown-tab");
      var $next = $this.siblings(".shell-header-dropdown-tab");
      /** @type {number} */
      var speed = 200;
      var $menu = $this.find(".shell-header-dropdown-tab-content");
      var element = $next.find(".shell-header-dropdown-tab-content");
      element.slideUp(speed, options.closed);
      $menu.slideToggle(speed).promise().done(function() {
        if (this.is(":hidden")) {
          $this.removeClass("active");
        } else {
          $this.addClass("active");
          $next.removeClass("active");
        }
      });
    };
    /**
     * @param {Object} execResult
     * @return {undefined}
     */
    options.displayFirst = function(execResult) {
      options.display(execResult.find(".shell-header-dropdown-tab:first-child .shell-header-dropdown-tab-label a"));
    };
    /**
     * @return {undefined}
     */
    options.init = function() {
      $(".shell-header-dropdown-tab-label a").on("click.shellNavTab", function() {
        var divSpan = $(this).closest(".shell-header-dropdown-tab-label");
        return!divSpan.hasClass("shell-header-L2menu-direct-link") && !divSpan.hasClass("shell-header-L2menu-direct-link-withL3") ? (options.shellUI.matchesSmall() && options.toggle(this), false) : true;
      });
      $(".shell-header-dropdown-tab-label").on("click.shellNavTab", function() {
        return $(this).hasClass("shell-header-L2menu-direct-link-withL3") && (options.shellUI.matchesSmall() && options.toggle(this)), true;
      });
      $(".shell-header-dropdown-tab-label>a").on("focus", function() {
        return options.display(this), true;
      });
    };
    options.init();
  }
  /**
   * @param {?} d
   * @return {undefined}
   */
  function Player(d) {
    var $scope = this;
    var el = $(".shell-header-nav-wrapper");
    var $el = $(".shell-header-nav-toggle");
    var $child = $(".shell-header-wrapper");
    var curElem = $(".shell-header-actions");
    var clickedTrack = $(".shell-header-toggle");
    var j = $(".shell-header-top");
    var $parent = $(".shell-header-user-container");
    $scope.shellUI = d;
    /**
     * @return {undefined}
     */
    $scope.init = function() {
      $(".shell-header-toggle-search").on("click.shellToggle", function() {
        var topbar = $(".shell-search");
        $(this).toggleClass("active");
        topbar.toggleClass("expanded");
        if (topbar.hasClass("expanded")) {
          topbar.find('input[type="search"]').focus();
          $child.css("height", "auto");
        } else {
          $child.css("height", "");
        }
      });
      $(".shell-header-toggle-menu").on("click.shellToggle", function() {
        $scope.toggleHeaderNav();
      });
      $(document).on("keydown", function(ev) {
        var t = ev.keyCode || ev.width;
        if (t === 27) {
          $scope.closeNav();
        }
      });
    };
    /**
     * @return {undefined}
     */
    $scope.handleSearchResize = function() {
      if ($scope.shellUI.matchesLarge()) {
        var pageX = el.outerWidth(true) + el.offset().left + 40;
        var tx = el.offset().left;
        /** @type {boolean} */
        var isRTL = $("body").css("direction") === "rtl";
        if (!isRTL && (pageX > curElem.offset().left && clickedTrack.offset().left - pageX < 250) || (isRTL && ($parent.length && tx - $parent.offset().left - $parent.outerWidth() < 334) || isRTL && (!$parent.length && tx - j.offset().left < 334))) {
          if (!j.hasClass("collapse-search")) {
            j.addClass("collapse-search");
          }
        } else {
          if (j.hasClass("collapse-search")) {
            j.removeClass("collapse-search");
          }
        }
      }
    };
    /**
     * @return {undefined}
     */
    $scope.closeNav = function() {
      if (el.hasClass("opened")) {
        el.removeClass("opened");
        el.hide();
        $el.removeClass("opened");
        if ($("html").css("overflow") === "hidden") {
          $("html").css("overflow", "auto");
        }
      }
    };
    /**
     * @return {undefined}
     */
    $scope.toggleHeaderNav = function() {
      var actualHeight;
      if (!el.hasClass("opened")) {
        actualHeight = $scope.shellUI.shellHeader.offsetHeight;
        el.css("height", "calc(100% - " + actualHeight + "px)");
        el.show();
        $(".shell-header-dropdown-tab-label-mobile-focus").removeClass("shell-header-dropdown-tab-label-mobile-focus");
      }
      el.toggleClass("opened").promise().done(function() {
        if (!el.hasClass("opened")) {
          setTimeout(function() {
            el.hide();
          }, 300);
        }
      });
      $el.toggleClass("opened");
      /** @type {boolean} */
      var isMobile = window.pageXOffset !== undefined;
      /** @type {boolean} */
      var m = (document.compatMode || "") === "CSS1Compat";
      /** @type {number} */
      var response = isMobile ? window.pageYOffset : m ? document.documentElement.scrollTop : document.body.scrollTop;
      if (response > 0) {
        $("html,body").animate({
          scrollTop : 0
        }, 100);
      }
      if (el.hasClass("opened")) {
        $("html").css("overflow", "hidden");
      } else {
        $("html").css("overflow", "auto");
      }
    };
    $scope.init();
  }
  $(function() {
    window.shellUI = new Grid;
  });
})(jQuery);
Date.now || (Date.now = function() {
  return(new Date).getTime();
}), function() {
  /** @type {Array} */
  var vendors = ["webkit", "moz"];
  var vendor;
  var lastTime;
  /** @type {number} */
  var i = 0;
  for (;i < vendors.length && !window.requestAnimationFrame;++i) {
    vendor = vendors[i];
    window.requestAnimationFrame = window[vendor + "RequestAnimationFrame"];
    window.cancelAnimationFrame = window[vendor + "CancelAnimationFrame"] || window[vendor + "CancelRequestAnimationFrame"];
  }
  if (!(!/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) && (window.requestAnimationFrame && window.cancelAnimationFrame))) {
    /** @type {number} */
    lastTime = 0;
    /**
     * @param {function (number): ?} callback
     * @return {number}
     */
    window.requestAnimationFrame = function(callback) {
      /** @type {number} */
      var now = Date.now();
      /** @type {number} */
      var nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function() {
        callback(lastTime = nextTime);
      }, nextTime - now);
    };
    /** @type {function ((null|number|undefined)): ?} */
    window.cancelAnimationFrame = clearTimeout;
  }
}(), function(b, middle) {
  var $ = b.jQuery || (b.Cowboy || (b.Cowboy = {}));
  var jq_throttle;
  /** @type {function (number, Function, Function, Function): ?} */
  $.throttle = jq_throttle = function(delay, no_trailing, callback, debounce_mode) {
    /**
     * @return {undefined}
     */
    function wrapper() {
      /**
       * @return {undefined}
       */
      function exec() {
        /** @type {number} */
        last_exec = +new Date;
        callback.apply(that, args);
      }
      /**
       * @return {undefined}
       */
      function clear() {
        /** @type {Function} */
        to = middle;
      }
      var that = this;
      /** @type {number} */
      var elapsed = +new Date - last_exec;
      /** @type {Arguments} */
      var args = arguments;
      if (debounce_mode) {
        if (!to) {
          exec();
        }
      }
      if (to) {
        clearTimeout(to);
      }
      if (debounce_mode === middle && elapsed > delay) {
        exec();
      } else {
        if (no_trailing !== true) {
          /** @type {number} */
          to = setTimeout(debounce_mode ? clear : exec, debounce_mode === middle ? delay - elapsed : delay);
        }
      }
    }
    var to;
    /** @type {number} */
    var last_exec = 0;
    return typeof no_trailing != "boolean" && (debounce_mode = callback, callback = no_trailing, no_trailing = middle), $.guid && (wrapper.guid = callback.guid = callback.guid || $.guid++), wrapper;
  };
  /**
   * @param {number} delay
   * @param {?} at_begin
   * @param {Function} callback
   * @return {?}
   */
  $.debounce = function(delay, at_begin, callback) {
    return callback === middle ? jq_throttle(delay, at_begin, false) : jq_throttle(delay, callback, at_begin !== false);
  };
}(this);
var categoryHeader = function($) {
  /** @type {Array} */
  var eventPath = [];
  var $dropdown;
  var $next;
  var input;
  var tip;
  var $col;
  var child;
  var mediaElem;
  var et;
  var ot;
  var st;
  var ht;
  /** @type {number} */
  var speed = 200;
  var iBoxHack;
  /** @type {boolean} */
  var length = false;
  var active;
  /** @type {number} */
  var headerHeight = 41;
  var octalLiteral = $.fn.jquery.split(".");
  /** @type {number} */
  iBoxHack = parseInt(octalLiteral[0]) < 2 && parseInt(octalLiteral[1]) < 8 ? 0 : 8;
  /**
   * @return {?}
   */
  $.fn.setAllToMaxHeight = function() {
    return this.height(Math.max.apply(this, $.map(this, function(floor) {
      return $(floor).height();
    })));
  };
  /**
   * @param {Object} element
   * @param {?} params
   * @return {undefined}
   */
  var _init = function(element, params) {
    var el;
    var width;
    var loop;
    var _tryInitOnFocus;
    var _isFocused;
    var b;
    var a;
    if (params.height("auto"), el = element.children(".c-nav-dropdown-tab-content"), width = $(window).width(), length = false, el && el.length) {
      /**
       * @return {undefined}
       */
      loop = function() {
        el.css({
          width : "",
          left : "",
          right : "",
          height : ""
        });
      };
      loop();
      var tOuterWidth = el.width();
      /** @type {number} */
      var bOuterWidth = -(width - (el.offset().left + el.width()));
      /** @type {number} */
      var radius = 201;
      /**
       * @return {undefined}
       */
      var requestAnimationFrame = function() {
        if (el.height() > params.height()) {
          params.height(el.height() - iBoxHack);
        } else {
          el.height(params.height() + 8);
        }
      };
      /**
       * @return {undefined}
       */
      var _init = function() {
        var distSqr = el.width();
        if (distSqr > radius * 2) {
          el.find(".shell-c3-group").setAllToMaxHeight();
        } else {
          el.find(".shell-c3-group").css("height", "");
        }
        if (distSqr > radius * 3) {
          if (distSqr < radius * 4) {
            el.width(radius * 3);
          }
        }
        if (distSqr > radius * 2) {
          if (distSqr < radius * 3) {
            el.width(radius * 2);
          }
        }
      };
      /**
       * @param {boolean} dataAndEvents
       * @return {undefined}
       */
      var init = function(dataAndEvents) {
        var newLeft = element.outerWidth();
        var _init;
        var get;
        if (dataAndEvents === true) {
          /**
           * @return {undefined}
           */
          _init = function() {
            el.css({
              right : "auto",
              left : newLeft
            });
          };
          _init();
          /** @type {boolean} */
          length = true;
          /**
           * @return {undefined}
           */
          get = function() {
            /** @type {number} */
            var i = width - (el.offset().left + el.width());
            el.width(el.width() + i).promise().done(function() {
              _init();
            });
          };
          if (el.offset().left + el.width() > $(".shell-category-header").width()) {
            get();
            _init();
          }
        } else {
          var prefix = el.width() + (el.offset().left - el.width() - element.width());
          /**
           * @return {undefined}
           */
          _init = function() {
            el.css({
              left : "auto",
              right : newLeft
            });
          };
          /**
           * @return {undefined}
           */
          get = function() {
            el.width(prefix).promise().done(function() {
              _init();
            });
          };
          if (el.offset().left - el.width() - element.width() < 0) {
            $.when(get()).done(function() {
              _init();
            });
          } else {
            _init();
            /** @type {boolean} */
            length = true;
          }
        }
      };
      if ($("body").css("direction") === "rtl") {
        /** @type {boolean} */
        _tryInitOnFocus = el.offset().left < 0;
        /** @type {boolean} */
        _isFocused = el.offset().left + el.width() + element.width() > width - radius;
        if (_tryInitOnFocus && !_isFocused) {
          init(true);
        } else {
          if (_tryInitOnFocus) {
            el.width(el.width() + el.offset().left).promise().done(function() {
              _init();
            });
            requestAnimationFrame();
          }
        }
      } else {
        /** @type {boolean} */
        b = el.offset().left - el.width() - element.width() > -radius;
        /** @type {boolean} */
        a = el.offset().left + el.width() > width;
        if (a && b) {
          init();
        } else {
          if (a) {
            tOuterWidth = el.width();
            el.width(tOuterWidth - bOuterWidth).promise().done(function() {
              _init();
            });
            requestAnimationFrame();
          }
        }
      }
      requestAnimationFrame();
    }
  };
  /**
   * @param {Node} elm
   * @param {boolean} recurring
   * @return {undefined}
   */
  var addClass = function(elm, recurring) {
    if (elm.length) {
      if (elm.hasClass("c3-nav-dropdown-tab-content")) {
        if (recurring) {
          elm.addClass("active");
        } else {
          elm.removeClass("active");
        }
      }
    }
  };
  /**
   * @param {?} target
   * @return {undefined}
   */
  var activate = function(target) {
    var $target = $(target);
    var lis = $target.siblings("li");
    var tabs = $target.siblings().find("div");
    var c = $target.children("div");
    addClass(c, true);
    tabs.removeClass("active");
    lis.removeClass("active");
    $target.addClass("active");
    _init($target, $target.parent(".c-nav-dropdown-menu"));
  };
  /**
   * @param {string} input
   * @param {string} name
   * @return {undefined}
   */
  var fn = function(input, name) {
    if (input) {
      if (input.length) {
        if (input.attr(name) === "false") {
          input.attr(name, "true");
        } else {
          input.attr(name, "false");
        }
      }
    }
  };
  /**
   * @param {string} data
   * @param {string} name
   * @return {undefined}
   */
  var setup = function(data, name) {
    if (data) {
      if (data.length) {
        if (name === "aria-expanded") {
          data.attr(name, "false");
        } else {
          data.attr(name, "true");
        }
      }
    }
  };
  /**
   * @return {undefined}
   */
  var init = function() {
    $(".shell-category-nav-wrapper .c-nav-dropdown-menu").menuAim({
      rowSelector : "> li",
      /** @type {function (?): undefined} */
      activate : activate,
      toleranceUp : 500,
      toleranceDown : 300,
      /**
       * @return {?}
       */
      exitMenu : function() {
        return true;
      }
    });
    $next.on("click", function() {
      next($(this));
    });
    $(".c-logo-mobile.c-top-nav-link").on("click", function() {
      $dropdown.toggleClass("mobile-dropdown-active");
    });
    input.on("click", function() {
      initialize(this);
    });
    input.on("keypress", function() {
      if (event.keyCode === 32) {
        initialize(this);
        if ($(this).hasClass("active")) {
          $(this).removeClass("active");
        } else {
          $(this).addClass("active");
        }
        event.preventDefault();
      }
    });
    $(document).on("click", function(ev) {
      if (!$(ev.target).closest(".shell-category-top-level").length) {
        start();
      }
    });
    $(document).on("keyup", function(event) {
      if (event.keyCode == 27) {
        start();
      }
    });
    $(document).on("keydown", function(event) {
      if (active = $(".shell-header").hasClass("mobile-view"), event.keyCode == 40) {
        return active ? !handler() : !update();
      }
      if (event.keyCode == 38) {
        return active ? !handleKeyBoardNav() : !render();
      }
      if (!active) {
        /** @type {boolean} */
        var isRTL = $("body").css("direction") === "rtl";
        if (event.keyCode == 39) {
          return isRTL ? !show() : !parse();
        }
        if (event.keyCode == 37) {
          return isRTL ? !parse() : !show();
        }
      }
    });
    $(window).resize($.throttle(100, resize));
  };
  /**
   * @param {Object} elem
   * @return {undefined}
   */
  var next = function(elem) {
    var $target = elem.parent().siblings().children(".active");
    var closest;
    if (active = $(".shell-header").hasClass("mobile-view"), elem.hasClass("active")) {
      elem.removeClass("active");
    } else {
      if (elem.closest(".active").length > 0 || $target.length < 0) {
        elem.addClass("active");
      } else {
        if (closest = $(".c-logo-item").find(".menu-logo-top-level"), closest.length && !active) {
          var li = closest.children();
          var ul = li.children("ul");
          var btn = li.children("a");
          if (btn.hasClass("active")) {
            if (ul.length) {
              ul.slideUp(speed);
            }
            btn.removeClass("active");
          }
        }
        if (!active) {
          $target = $(".c-menu-container li > a[class*='active']");
        }
        if ($target.length) {
          if ($target.siblings(".c-nav-dropdown-menu").length) {
            $target.siblings(".c-nav-dropdown-menu").slideUp(speed, function() {
              elem.css("height", "");
            });
          }
          $target.removeClass("active");
        }
        elem.addClass("active");
      }
    }
    fn(elem, "aria-expanded");
    fn(elem.siblings(".c-nav-dropdown-menu"), "aria-hidden");
  };
  /**
   * @return {?}
   */
  var render = function() {
    var anchor = $(document.activeElement);
    /** @type {boolean} */
    var ee = false;
    var currentTestElm;
    var node;
    var editable;
    if (anchor.hasClass("c-nav-dropdown-item")) {
      var root = anchor.parent();
      var li = root.prev();
      var c = root.children("div");
      addClass(c, false);
      if (li.length) {
        li.find("a").first().focus();
        if (li.parent().find(".c-nav-dropdown-tab-content").length) {
          activate(li);
        } else {
          currentTestElm = li.find(".c3-nav-dropdown-tab-content");
          addClass(currentTestElm, true);
        }
      } else {
        node = anchor.closest(".c-top-nav-item").find(".c-nav-dropdown");
        node.removeClass("active");
        initialize(node);
        node.focus();
      }
      /** @type {boolean} */
      ee = true;
    } else {
      if (anchor.closest(".c-nav-dropdown-tab-content").length) {
        editable = anchor.closest("li").prev();
        if (editable.length && editable.find("a").length) {
          editable.find("a").first().focus();
        } else {
          if (length) {
            anchor.closest(".c-nav-dropdown-tab-list").next().find("a").last().focus();
          } else {
            anchor.closest(".c-nav-dropdown-tab-list").prev().find("a").last().focus();
          }
        }
        /** @type {boolean} */
        ee = true;
      }
    }
    return ee;
  };
  /**
   * @return {?}
   */
  var handleKeyBoardNav = function() {
    var $btn = $(document.activeElement);
    /** @type {boolean} */
    var o = false;
    var rule;
    var $link;
    var elem;
    var e;
    var submenu;
    return($btn.hasClass("c-top-nav-link") || $btn.hasClass("c-nav-link")) && (rule = $btn.closest(".c-top-nav-item, .c-nav-item").prev(), rule.length ? rule.find("a").first().focus() : $btn.hasClass("c-top-nav-link") ? ($link = $btn.parent().parent(), $link.length && $link.hasClass("c-nav-dropdown-menu") ? (elem = $link.siblings(".c-top-nav-link"), next(elem), initialize(elem), elem.focus()) : (e = $(".c-logo-mobile.c-top-nav-link.c-nav-dropdown"), next(e), initialize(e), e.focus())) : (submenu =
    $btn.closest(".c-nav-dropdown-menu").closest(".c-top-nav-item, .c-nav-item").find("a").first(), submenu.focus()), o = true), o;
  };
  /**
   * @return {?}
   */
  var update = function() {
    var elem = $(document.activeElement);
    /** @type {boolean} */
    var u = false;
    var ul;
    var selected;
    var newItem;
    var c;
    var currentTestElm;
    var rule;
    return elem.hasClass("c-nav-dropdown") ? (elem.hasClass("active") ? (ul = elem.closest(".c-top-nav-item"), ul.find("li").first().hasClass("c-nav-item") ? ul.find(".c-nav-dropdown-item").first().focus() : (selected = ul.find(".c-nav-item-with-dropdown").first().next().find(".c-nav-dropdown-item"), selected.length && (selected.first().focus(), activate(selected.parent())))) : (next(elem), initialize(elem), elem.closest(".c-top-nav-item").find(".c-nav-dropdown-item").first().focus()), u = true) :
    elem.hasClass("c-nav-dropdown-item") ? (newItem = elem.parent().next(), newItem.length && (newItem.find(".c-nav-dropdown-item").first().focus(), newItem.parent().find(".c-nav-dropdown-tab-content").length ? activate(newItem) : (c = elem.siblings(), addClass(c, false), currentTestElm = newItem.children(".c3-nav-dropdown-tab-content"), addClass(currentTestElm, true))), u = true) : elem.closest(".c-nav-dropdown-tab-content").length && (rule = elem.closest("li").next(), rule.length ? rule.find("a").first().focus() :
    length ? show() : parse(), u = true), u;
  };
  /**
   * @return {?}
   */
  var handler = function() {
    var elem = $(document.activeElement);
    /** @type {boolean} */
    var i = false;
    var $shcell;
    var rule;
    return elem.hasClass("c-logo-mobile") && (elem.hasClass("c-top-nav-link") && elem.hasClass("c-nav-dropdown")) ? (elem.hasClass("active") ? ($shcell = elem.siblings(".menu-logo-dropdown-mobile"), $shcell.length ? $shcell.find(".c-top-nav-link").first().focus() : elem.closest(".shell-category-top-level").find(".c-nav-dropdown-menu").find("a").first().focus()) : (next(elem), initialize(elem), $(".c-nav-dropdown-menu").find("a").first().focus()), i = true) : (elem.hasClass("c-top-nav-link") || elem.hasClass("c-nav-link")) &&
    (elem.hasClass("c-top-nav-link") && elem.hasClass("active") ? elem.hasClass("c-nav-dropdown-item") ? elem.parent().find(".c-nav-dropdown-menu").first().find(".c-nav-dropdown-item").first().focus() : elem.closest(".c-top-nav-item").find(".c-nav-dropdown-menu").first().find(".c-nav-link").first().focus() : (rule = elem.closest(".c-top-nav-item, .c-nav-item").next(), rule.length ? rule.find("a").first().focus() : (!elem.hasClass("c-top-nav-link") || elem.hasClass("c-nav-dropdown-item")) && elem.closest(".c-top-nav-item").next().find("a").first().focus()),
    i = true), i;
  };
  /**
   * @return {?}
   */
  var parse = function() {
    var $btn = $(document.activeElement);
    /** @type {boolean} */
    var resp = false;
    var closest;
    var cal;
    var rule;
    if ($btn.hasClass("menu-logo") && (closest = $(".shell-category-nav").find(".c-menu-container"), closest.length && closest.children().first().find("a[class*='c-top-nav-link']").focus()), $btn.hasClass("c-top-nav-link")) {
      cal = $btn.closest(".c-top-nav-item").next();
      cal.find(".c-top-nav-link").focus();
      if (cal.hasClass("c-top-nav-disabled")) {
        data.navSlide.navScrollNext();
        data.navSlide.state.navNext.hide();
      }
    } else {
      if ($btn.hasClass("c-nav-dropdown-item")) {
        if (length) {
          rule = $btn.closest(".c-nav-item-with-dropdown");
          if (rule.length) {
            rule.find("a").first().focus();
          }
        } else {
          var component = $btn.parent();
          var pair = component.find("li a");
          var c = component.children("div");
          addClass(c, true);
          pair.first().focus();
        }
        /** @type {boolean} */
        resp = true;
      } else {
        if ($btn.closest(".c-nav-dropdown-tab-content").length) {
          rule = $btn.closest(".c-nav-dropdown-tab-list").next();
          if (rule.length) {
            rule.find("a").first().focus();
          } else {
            if (length) {
              $btn.closest(".c-nav-item-with-dropdown").find("a").first().focus();
            }
          }
          /** @type {boolean} */
          resp = true;
        }
      }
    }
    return resp;
  };
  /**
   * @return {?}
   */
  var show = function() {
    var $btn = $(document.activeElement);
    /** @type {boolean} */
    var f = false;
    var $form;
    var submenu;
    var rule;
    var _ref;
    var button;
    var j;
    var t;
    return $btn.hasClass("c-top-nav-link") ? ($form = $btn.closest(".c-top-nav-item").prev(), $form.find(".c-top-nav-link").focus(), $form.hasClass("c-top-nav-disabled") && (data.navSlide.navScrollPrev(), data.navSlide.state.navNext.show()), $form.length || (submenu = $(".c-logo-item .menu-logo-top-level").find(".menu-logo"), submenu.length && submenu.focus())) : $btn.closest(".c-nav-dropdown-tab-content").length ? (rule = $btn.closest(".c-nav-dropdown-tab-list").prev(), rule.length ? rule.find("a").first().focus() :
    length || (_ref = $btn.parent().find("div"), _ref.length ? (button = $btn.closest(".c-nav-dropdown-tab-content"), button.closest(".c-nav-item-with-dropdown").find("a").first().focus()) : $btn.closest(".c-nav-item-with-dropdown").find("a").first().focus()), f = true) : $btn.hasClass("c-nav-dropdown-item") && (length && (j = $btn.parent(), t = j.find(".c-nav-dropdown-tab-list").last().find("li a"), t.length ? t.first().focus() : j.find(".c-nav-dropdown-tab-content").find(".c-nav-dropdown-item").first().focus()),
    f = true), f;
  };
  /**
   * @return {undefined}
   */
  var draw = function() {
    $dropdown = $(".shell-category-header");
    $next = $(".c-top-nav-link");
    input = $(".c-nav-dropdown");
    tip = $(".shell-category-nav");
    child = $(".shell-category-brand");
    $col = $(".shell-category-nav-wrapper");
    mediaElem = $(".shell-category-header-cta-wrapper");
    ot = tip.width();
    st = $col.outerWidth();
    et = child.innerWidth();
    /** @type {number} */
    ht = window.innerWidth || document.documentElement.clientWidth;
    position();
  };
  /**
   * @return {undefined}
   */
  var position = function() {
    $(".shell-category-nav-wrapper > .c-top-nav-item").each(function() {
      eventPath.push($(this).outerWidth());
    });
  };
  /**
   * @return {undefined}
   */
  var start = function() {
    var $target = $(".active");
    var $shcell = $(document.activeElement).closest(".c-top-nav-item");
    var rule;
    var $activeTab;
    setup($target.parent().siblings("a[aria-expanded]"), "aria-expanded");
    setup($target.parent("ul[aria-hidden]"), "aria-hidden");
    $target.siblings(".c-nav-dropdown-menu").slideUp(speed, function() {
      $(this).css("height", "");
    });
    $next.removeClass("active");
    $dropdown.removeClass("mobile-dropdown-active");
    $(".c-nav-dropdown-tab-content").css("left", "");
    $(".c-nav-dropdown-tab-content").css("right", "");
    if ($target.hasClass("menu-logo")) {
      rule = $target.siblings(".menu-logo-wrapper");
      $activeTab = rule.find(".active");
      $activeTab.removeClass("active");
    }
    if ($shcell.length) {
      $shcell.find(".c-top-nav-link").first().focus();
    }
  };
  /**
   * @param {?} selector
   * @return {undefined}
   */
  var initialize = function(selector) {
    if (!$(selector).parent().hasClass("c-top-nav-disabled")) {
      /** @type {number} */
      var b = window.innerWidth || document.documentElement.clientWidth;
      var element = $(selector).siblings(".c-nav-dropdown-menu");
      /** @type {number} */
      var pos = element.outerWidth() - $(selector).outerWidth();
      var a;
      var output = element.find(".c-nav-multicolumn");
      var errors = output.parent(".current");
      var newItem;
      newItem = errors.length ? errors : output.parent(".c-nav-item-with-dropdown").first();
      if ($(".c-logo-mobile").css("display") === "none") {
        if ($("body").css("direction") === "rtl") {
          /** @type {number} */
          a = $(selector).offset().left - element.outerWidth();
          if (a < 0) {
            element.css("margin-right", -pos);
          } else {
            element.css("margin-right", "");
          }
        } else {
          a = $(selector).offset().left + element.outerWidth();
          if (a > b) {
            element.css("margin-left", -pos);
          } else {
            element.css("margin-left", "");
          }
        }
      }
      if (newItem.length) {
        element.slideToggle(0).promise().done(function() {
          if ($(selector).hasClass("active")) {
            activate(newItem);
          }
        });
      } else {
        element.slideToggle(speed);
      }
    }
  };
  /**
   * @return {undefined}
   */
  var f = function() {
    if ($(".c-logo-mobile").css("display") === "none") {
      if ($dropdown.hasClass("mobile-view")) {
        $dropdown.removeClass("mobile-view");
        $(".c-logo-mobile").siblings(".c-nav-dropdown-menu").removeAttr("style");
        start();
      }
    } else {
      if (!$dropdown.hasClass("mobile-view")) {
        $dropdown.addClass("mobile-view");
        start();
      }
    }
  };
  /**
   * @param {Object} object
   * @return {?}
   */
  var getBounds = function(object) {
    return $(window).width() - (object.offset().left + object.outerWidth());
  };
  /**
   * @return {undefined}
   */
  var resize = function() {
    f();
  };
  var data = data || {};
  return data.state = data.state || {
    /**
     * @return {?}
     */
    mobile : function() {
      return $(".shell-category-header").hasClass("mobile-view");
    }
  }, data.navSlide = data.navSlide || {
    /**
     * @return {?}
     */
    getState : function() {
      var options = {};
      /** @type {number} */
      var path = 17;
      var padding;
      return options.nav = $(".shell-category-nav-wrapper"), options.navItems = $(".shell-category-nav-wrapper > li"), options.navContainer = $(".shell-category-nav"), options.navContainerOffset = options.navContainer.offset().left, options.cta = $(".shell-category-header-cta-wrapper"), options.firstNav = options.nav.children("li:first-child"), options.lastNav = options.nav.children("li:last-child"), options.lastNavPos = options.lastNav.find("span").first().innerWidth() + options.lastNav.find("span").first().offset().left,
      options.navNext = $(".c-nav-pagination-next"), options.navNextOffset = options.navNext.offset().left, options.navPrev = $(".c-nav-pagination-prev"), options.disabledMenu = $(".c-top-nav-disabled"), options.navWidth = options.nav.outerWidth(), options.navContainerWidth = parseFloat(options.navContainer.css("width")), options.navContainerOuterWidth = $(".shell-category-nav").outerWidth(), options.logoWidth = parseFloat($(".shell-category-brand").css("width")), options.wrapWidth = options.navContainerWidth -
      options.logoWidth, $("body").css("direction") === "rtl" ? (options.isRTL = true, options.scrollDirection = "right", options.scrollOppositeDirection = "left", options.endPoint = options.navNext.position().left + options.navNext.outerWidth() - options.lastNav.position().left + path, options.navPosPrevLeft = options.navPrev.offset().left, options.navPosLeft = options.navNext.offset().left + options.navNext.outerWidth()) : (options.isRTL = false, options.scrollDirection = "left", options.scrollOppositeDirection =
      "right", options.endPoint = options.lastNav.outerWidth() + options.lastNav.position().left + path, options.navPosLeft = options.navPrev.offset().left + options.navPrev.outerWidth()), options.navNext.css("display") == "block" ? options.navNextVisible = true : options.navPrev.css("display") == "block" ? options.navPrevVisible = true : (options.navNextVisible = false, options.navPrevVisible = false), $(".shell-category-nav-featured").length > 0 && (options.featuredMenu = $(".shell-category-nav-featured"),
      options.featuredMenuStart = options.featuredMenu.find(".c-nav-link"), options.navContainerWidth = options.navContainerWidth - options.featuredMenu.outerWidth(), padding = getBounds(options.featuredMenuStart) - getBounds(options.featuredMenuStart.parent()), options.navContainerOuterWidth = options.navContainerOuterWidth - options.featuredMenuStart.outerWidth() - padding, options.navNext.prependTo(options.featuredMenu), options.navNextVisible === true || options.navPrevVisible === true ? options.featuredMenu.addClass("force-" +
      options.scrollOppositeDirection) : options.featuredMenu.removeClass("force-" + options.scrollOppositeDirection), options.isRTL && (options.navContainerOffset = options.featuredMenuStart.outerWidth() + options.featuredMenuStart.offset().left)), options;
    },
    /**
     * @return {undefined}
     */
    saveState : function() {
      var res = data.navSlide;
      res.state = res.state || {};
      res.state = res.getState();
      res.disableLinks();
    },
    /**
     * @return {undefined}
     */
    navScrollReset : function() {
      var module = data.navSlide;
      module.state.navNext.hide();
      module.state.navPrev.hide();
      module.state.cta.show();
      module.state.firstNav.css("margin-" + module.state.scrollDirection, "-5px");
      module.scrollComplete();
    },
    /**
     * @return {undefined}
     */
    scrollComplete : function() {
      var config = data.navSlide;
      if (!config.state.navNextVisible) {
        if (!config.state.navPrevVisible) {
          config.state.nav.css({
            "max-width" : ""
          });
        }
      }
      if (config.state.firstNav.css("margin-" + config.state.scrollDirection) === "-5px") {
        config.state.navPrev.hide();
      }
      config.saveState();
    },
    /**
     * @return {undefined}
     */
    disableLinks : function() {
      var module = data.navSlide;
      module.state.navItems.each(function() {
        var offsetX = $(this).offset().left;
        var originalX = $(this).outerWidth() + offsetX;
        if (module.state.isRTL) {
          if (originalX > module.state.navPosPrevLeft && module.state.navPrevVisible || offsetX < module.state.navPosLeft && module.state.navNextVisible) {
            $(this).addClass("c-top-nav-disabled");
          } else {
            $(this).removeClass("c-top-nav-disabled");
          }
        } else {
          if (offsetX < module.state.navPosLeft && module.state.navPrevVisible || originalX > module.state.navNextOffset && module.state.navNextVisible) {
            $(this).addClass("c-top-nav-disabled");
          } else {
            $(this).removeClass("c-top-nav-disabled");
          }
        }
        $(this).on("click", function(event) {
          if (module.state.navNextVisible && $(this).hasClass("c-top-nav-disabled")) {
            event.stopImmediatePropagation();
            event.preventDefault();
            module.navScrollNext();
            module.state.navNext.hide();
          } else {
            if (module.state.navPrevVisible) {
              if ($(this).hasClass("c-top-nav-disabled")) {
                event.stopImmediatePropagation();
                event.preventDefault();
                module.navScrollPrev();
                module.state.navNext.show();
              }
            }
          }
        });
      });
    },
    /**
     * @return {undefined}
     */
    navScrollNext : function() {
      var config = data.navSlide;
      var animation2;
      start();
      /** @type {({margin-left: number}|{margin-right: number})} */
      animation2 = config.state.isRTL ? {
        "margin-right" : -config.state.endPoint
      } : {
        "margin-left" : -(config.state.endPoint - config.state.navContainerWidth)
      };
      config.state.firstNav.animate(animation2, config.scrollComplete);
      config.state.firstNav.addClass("scroll-next");
      config.state.navPrev.css(config.state.scrollDirection, config.state.logoWidth - headerHeight);
      if (config.state.firstNav.hasClass("scroll-next")) {
        config.state.navPrev.show();
      } else {
        config.state.navPrev.hide();
      }
    },
    /**
     * @return {undefined}
     */
    navScrollPrev : function() {
      var config = data.navSlide;
      var animation2;
      start();
      /** @type {({margin-left: number}|{margin-right: number})} */
      animation2 = config.state.isRTL ? {
        "margin-right" : -5
      } : {
        "margin-left" : -5
      };
      if (config.state.firstNav.hasClass("scroll-next")) {
        if (parseInt(config.state.firstNav.css("margin-" + config.state.scrollDirection)) < -5) {
          config.state.firstNav.animate(animation2, config.scrollComplete);
        }
      }
    },
    /**
     * @return {undefined}
     */
    widthCheck : function() {
      var config = data.navSlide;
      var initialize;
      config.navScrollReset();
      /**
       * @return {undefined}
       */
      initialize = function() {
        config.state.navNext.show();
        config.scrollComplete();
        config.state.cta.hide();
        start();
        var iMaxWidth = config.state.wrapWidth + headerHeight;
        config.state.nav.css({
          "max-width" : iMaxWidth + "px"
        });
      };
      if (config.state.isRTL) {
        if (config.state.lastNav.offset().left < config.state.navContainerOffset) {
          initialize();
        } else {
          config.navScrollReset();
        }
        if (config.state.cta.length) {
          if (config.state.lastNav.offset().left < config.state.cta.offset().left + config.state.cta.outerWidth()) {
            config.state.cta.hide();
          }
        }
      } else {
        if (config.state.lastNavPos > config.state.navContainerOuterWidth + config.state.navContainer.offset().left) {
          initialize();
        } else {
          config.navScrollReset();
        }
        if (config.state.cta.length) {
          if (config.state.endPoint > config.state.cta.offset().left) {
            config.state.cta.hide();
          }
        }
      }
      if (data.state.mobile()) {
        config.navScrollReset();
      }
    },
    /**
     * @param {Object} e
     * @return {undefined}
     */
    clickNext : function(e) {
      var module = data.navSlide;
      e.stopImmediatePropagation();
      module.navScrollNext();
      module.state.navNext.hide();
    },
    /**
     * @param {Object} e
     * @return {undefined}
     */
    clickPrev : function(e) {
      var module = data.navSlide;
      e.stopImmediatePropagation();
      module.navScrollPrev();
      module.state.navNext.show();
    },
    /**
     * @return {undefined}
     */
    initialize : function() {
      if ($(".shell-category-nav-wrapper").length > 0) {
        var options = data.navSlide;
        options.saveState();
        options.state.navNext.on("click", function(ele) {
          options.clickNext(ele);
        });
        options.state.navPrev.on("click", function(ele) {
          options.clickPrev(ele);
        });
        options.state.navNext.on("keypress", function(e) {
          if (e.keyCode === 32) {
            options.clickNext(e);
          }
        });
        options.state.navPrev.on("keypress", function(e) {
          if (e.keyCode === 32) {
            options.clickPrev(e);
          }
        });
        $(window).resize($.throttle(100, options.widthCheck));
        options.widthCheck();
      }
    }
  }, data.init = data.init || function() {
    data.navSlide.initialize();
  }, {
    /**
     * @return {undefined}
     */
    init : function() {
      draw();
      init();
      resize();
      $(window).resize();
      data.init();
    }
  };
}(jQuery);
(function($) {
  $(document).ready(function() {
    if ($(".shell-category-header").length) {
      categoryHeader.init();
    }
  });
})(jQuery), function($) {
  /**
   * @param {string} a
   * @return {?}
   */
  function read(a) {
    /** @type {Array.<string>} */
    var codeSegments = document.cookie.split("; ");
    var namespaces;
    var out;
    /** @type {number} */
    var i = 0;
    for (;i < codeSegments.length;i++) {
      if (namespaces = codeSegments[i].split("="), out = parseCookieValue(namespaces.shift()), out === a) {
        return parseCookieValue(namespaces.join("="));
      }
    }
    return null;
  }
  /**
   * @param {string} name
   * @param {string} value
   * @param {number} opt_attributes
   * @return {undefined}
   */
  function setCookie(name, value, opt_attributes) {
    var expires;
    var f;
    if (opt_attributes) {
      /** @type {Date} */
      f = new Date;
      f.setTime(f.getTime() + opt_attributes * 864E5);
      /** @type {string} */
      expires = "; expires=" + f.toUTCString();
    } else {
      /** @type {string} */
      expires = "";
    }
    /** @type {string} */
    window.document.cookie = name + "=" + value + expires + "; path=/;";
  }
  /**
   * @param {string} s
   * @return {?}
   */
  function parseCookieValue(s) {
    /** @type {string} */
    var querystring = decodeURIComponent(s.replace("/+/g", " "));
    return querystring.indexOf('"') === 0 && (querystring = querystring.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\")), querystring;
  }
  /**
   * @param {string} deepDataAndEvents
   * @param {Object} query
   * @return {undefined}
   */
  function q(deepDataAndEvents, query) {
    var fmt;
    var part;
    query = query || {};
    /** @type {string} */
    fmt = "MECONTROLLOG:" + deepDataAndEvents + ",";
    for (part in query) {
      fmt += part + "=" + query[part] + ",";
    }
    if (console) {
      console.log(fmt);
    }
  }
  /**
   * @param {?} deepDataAndEvents
   * @return {?}
   */
  function advance(deepDataAndEvents) {
    var element = deepDataAndEvents.elements[0];
    if (!$.trim(element.value).length) {
      return element.focus(), false;
    }
    if (e && e.onSearch) {
      e.onSearch(deepDataAndEvents);
    }
    return true;
  }
  /**
   * @param {string} id
   * @return {undefined}
   */
  function activate(id) {
    var $currentItem = $(".shell-category-header .current");
    var $slide = $(".shell-category-header .active");
    var $target;
    var next;
    var rule;
    if ($currentItem.length) {
      $currentItem.removeClass("current");
    }
    if ($slide.length) {
      $slide.removeClass("active");
    }
    $target = $(document.getElementById(id));
    next = $(document.getElementById(id + "-mobile"));
    if ($target.length) {
      $target.addClass("current");
      $target.parent().parent().siblings(".c-top-nav-link").addClass("current");
      if (next.length) {
        next.addClass("current");
        next.parent().parent().siblings(".c-top-nav-link.c-nav-dropdown").addClass("current");
      }
      $target.parents(".shell-header-dropdown-tab").find(".shell-header-dropdown-tab-label").addClass("current");
      rule = $target.parents(".shell-header-dropdown");
      rule.find(".shell-header-dropdown-label").addClass("current");
      if ($target.data("show-cta") === false) {
        $("#shell-category-header-cta").hide();
      } else {
        $("#shell-category-header-cta").show();
      }
    }
  }
  /**
   * @param {?} id
   * @return {undefined}
   */
  function next(id) {
    var $el = $("#shell-category-header-cta");
    var codeSegments = $el.data("cta-targets");
    /** @type {number} */
    var i = 0;
    for (;i < codeSegments.length;i++) {
      if (codeSegments[i].Id === id) {
        $el.text(codeSegments[i].Text);
        $el.removeClass($el.attr("class").split(" ").pop());
        $el.addClass(codeSegments[i].ClassName);
        $el.attr("href", codeSegments[i].Url);
        $el.attr("data-id", codeSegments[i].Id);
        $el.attr("data-bi-name", codeSegments[i].ElementName);
        $el.attr("ms.title", codeSegments[i].Text);
      }
    }
  }
  /**
   * @return {undefined}
   */
  function update() {
    var self = options;
    var data;
    var types;
    var pauseText;
    var t;
    var xml;
    if (self) {
      /** @type {string} */
      data = '<div><div class="msame_Header"><a style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden; max-width: 160px; display: inline-block; border: 1px solid transparent; border-bottom-style: none;line-height: 50px; font-family: \'Segoe UI\'; font-size: 12px; color: rgb(80,80,80); padding: 0 10px;"></a></div></div>';
      types = self.rpData.preferredIdp === "msa" ? self.rpData.msaInfo : self.rpData.aadInfo;
      if (self.userData.authenticatedState == 1) {
        pauseText = self.signOutStr || "Sign out";
        t = types.signOutUrl;
      } else {
        pauseText = self.signInStr || "Sign in";
        t = self.rpData.preferredIdp === "msa" ? types.signInUrl : types.signInUrlPlaceHolder;
      }
      xml = $(data);
      $(".msame_Header a", xml).attr("href", t).text(pauseText);
      $("#" + self.containerId).html(xml);
      self.events.onEventLog("loadMeControl", {
        type : "qos",
        success : "0",
        errorCode : "LoadFailed: Reverted to fallback",
        duration : dur
      });
    }
  }
  /**
   * @param {?} opts
   * @return {undefined}
   */
  function parse(opts) {
    if (opts && (opts.extensibleLinks && (options.extensibleLinks && (opts.extensibleLinks.push.apply(opts.extensibleLinks, options.extensibleLinks), options.extensibleLinks = null)), options = $.extend(true, {}, options, opts)), options.enabled) {
      if (window.MSA && window.MSA.MeControl) {
        window.MSA.MeControl.Loader.load(options);
      } else {
        /** @type {number} */
        var to = setTimeout(function() {
          update();
        }, dur);
        /**
         * @return {undefined}
         */
        window.onMeControlReadyToLoad = function() {
          options.events.onEventLog("loadMeControl", {
            type : "qos",
            success : "1"
          });
          clearTimeout(to);
          /** @type {null} */
          window.onMeControlReadyToLoad = null;
          window.MSA.MeControl.Loader.load(options);
        };
      }
    }
  }
  /**
   * @param {?} data
   * @return {?}
   */
  function done(data) {
    /** @type {Element} */
    var l = document.createElement("a");
    return l.href = data, l.href;
  }
  /**
   * @param {Object} self
   * @return {undefined}
   */
  function callback(self) {
    if (self) {
      if (self.rpData.aadInfo) {
        if (self.rpData.aadInfo.siteUrl) {
          self.rpData.aadInfo.siteUrl = done(self.rpData.aadInfo.siteUrl);
        }
      }
      if (self.rpData.msaInfo) {
        if (self.rpData.msaInfo.meUrl) {
          /** @type {string} */
          self.rpData.msaInfo.meUrl = self.rpData.msaInfo.meUrl + "&wreply=" + encodeURIComponent(window.location.protocol + "//" + window.location.host);
        }
      }
      self.userData = {
        idp : window.msCommonShell.SupportedAuthIdp.MSA,
        firstName : null,
        lastName : null,
        memberName : null,
        cid : null,
        authenticatedState : window.msCommonShell.NotSignedIn
      };
      self.events = {
        /**
         * @param {string} deepDataAndEvents
         * @param {Object} opt_attributes
         * @return {undefined}
         */
        onEventLog : function(deepDataAndEvents, opt_attributes) {
          if (self.debug && q(deepDataAndEvents, opt_attributes), deepDataAndEvents == "DropdownOpen" && $(".shell-header-dropdown:not(.horizontalLayout)").removeClass("active"), deepDataAndEvents === "HeaderReady" && $(".msame_Header").prop("tabIndex", "60"), e && e.onEventLog) {
            e.onEventLog("MeControl_" + deepDataAndEvents, opt_attributes);
          }
        }
      };
      /** @type {boolean} */
      elem = false;
      options = $.extend(true, {}, self, options || {});
    }
  }
  /**
   * @param {?} self
   * @return {undefined}
   */
  function init(self) {
    var svg;
    var obj;
    if (self != null) {
      if (self.events != null) {
        e = self.events;
      }
      if (self.currentGlobalItemId != null) {
        /** @type {(HTMLElement|null)} */
        svg = document.getElementById(self.currentGlobalItemId);
        if (svg) {
          if (svg.children.length) {
            /** @type {string} */
            svg.firstElementChild.style["font-weight"] = "bold";
          }
        }
      }
      if (self.searchKeywordPreset) {
        $("#cli_shellHeaderSearchInput").val(self.searchKeywordPreset);
      }
      if (self.currentMenuItemId != null) {
        activate(self.currentMenuItemId);
      }
      if (self.currentCtaId != null) {
        next(self.currentCtaId);
      }
      if (self.searchSuggestCallback != null) {
        obj = window.msCommonShellSuggestion;
        obj.initialize(self.searchSuggestCallback);
      }
    }
  }
  /**
   * @param {?} self
   * @return {undefined}
   */
  function process(self) {
    var name;
    var $slide;
    if (meControlInitOptions) {
      callback(meControlInitOptions);
    }
    if (shellInitOptions) {
      if (shellInitOptions.lcaDisclaimerEnabled) {
        name = $("#lca-cookie-notification");
        if (read("msstore_hide_cn") !== "true") {
          name.addClass("shell-notification-active");
        }
        $("#lca-disclaimer-close").click(function() {
          setCookie("msstore_hide_cn", "true", 365);
          name.removeClass("shell-notification-active");
          /** @type {(HTMLElement|null)} */
          var t = document.getElementById("shell-header");
          $(".fixed-global-nav-buffer").height(t.offsetHeight);
        });
      }
    }
    $slide = $("#shell-cart-count");
    if ($slide.length) {
      $slide.attr("src", function() {
        return $(this).attr("data-src");
      });
    }
    if (self != null) {
      init(self);
      parse(self.meControlOptions);
    } else {
      parse();
    }
  }
  /**
   * @return {?}
   */
  function restoreScript() {
    return elem;
  }
  /** @type {null} */
  var options = null;
  /** @type {boolean} */
  var elem = false;
  /** @type {number} */
  var dur = 5E3;
  /** @type {null} */
  var e = null;
  window.msCommonShell = {
    AuthState : {
      SignedIn : 1,
      SignedInIdp : 2,
      NotSignedIn : 3
    },
    SupportedAuthIdp : {
      MSA : "msa",
      AAD : "aad"
    },
    /**
     * @return {?}
     */
    meControlOptions : function() {
      return options;
    },
    /** @type {function (): ?} */
    isUserSignedIn : restoreScript,
    /** @type {function (string): ?} */
    getCookie : read,
    /** @type {function (string, string, number): undefined} */
    setCookie : setCookie,
    /**
     * @param {?} child
     * @return {undefined}
     */
    load : function(child) {
      process(child);
    },
    /**
     * @param {?} exports
     * @return {undefined}
     */
    update : function(exports) {
      init(exports);
    },
    /**
     * @param {?} deepDataAndEvents
     * @return {?}
     */
    onSearch : function(deepDataAndEvents) {
      return advance(deepDataAndEvents);
    }
  };
  $(window).on("message onmessage", function(e) {
    var text = e.originalEvent.data;
    var listenerArray = $("#shell-cart-count").prop("src");
    var opt_nodes;
    var node;
    if (listenerArray) {
      if (listenerArray.indexOf(e.originalEvent.origin) === 0) {
        if (text) {
          /** @type {String} */
          text = new String(text);
          /** @type {Array.<string>} */
          opt_nodes = text.split("=");
          if (opt_nodes[0] === "DR_Cart_Count") {
            /** @type {string} */
            node = opt_nodes[1];
            $(".shopping-cart-amount").text(node);
          }
        }
      }
    }
  });
  if (window.onShellReadyToLoad) {
    window.onShellReadyToLoad();
  }
}(jQuery), function($) {
  window.msCommonShellSuggestion = {
    /**
     * @param {?} callback
     * @return {undefined}
     */
    initialize : function(callback) {
      var field = $("#cli_shellHeaderSearchInput");
      var closest = $("#cli_searchSuggestionsResults");
      var $menu = $("#cli_searchSuggestionsContainer");
      /** @type {string} */
      var dest = "";
      field.bind("input", function() {
        var mat = field.val();
        if (mat != dest) {
          callback({
            text : mat,
            response : window.msCommonShellSuggestion.displayResults
          });
        }
        dest = mat;
      });
      field.keydown(function(event) {
        /**
         * @param {Node} component
         * @return {undefined}
         */
        function render(component) {
          link.removeClass("selected");
          component.addClass("selected");
        }
        var link = closest.find(".selected");
        /** @type {boolean} */
        var u = link.length > 0;
        switch(event.keyCode) {
          case 38:
            if (u) {
              render(link.prev());
            } else {
              render(closest.children().last());
            }
            event.preventDefault();
            break;
          case 40:
            if (u) {
              render(link.next());
            } else {
              render(closest.children().first());
            }
            event.preventDefault();
            break;
          case 13:
            if (u) {
              link.click();
              event.preventDefault();
            }
          ;
        }
      });
      field.focus(function() {
        if (closest.children().length > 0) {
          $menu.addClass("visible");
        }
      });
      field.blur(function() {
        setTimeout(function() {
          $menu.removeClass("visible");
        }, 200);
      });
    },
    /**
     * @param {?} response
     * @return {undefined}
     */
    displayResults : function(response) {
      var config = this;
      var test = $("#cli_shellHeaderSearchInput");
      var target = $("#cli_searchSuggestionsResults");
      var $items;
      var $pages;
      var tip;
      var $child;
      if (config.text == test.val()) {
        target.empty();
        $.each(response.suggestions, function(dataAndEvents, file) {
          var self = $("<li>");
          var $li = $("<a>");
          self.append($li);
          if (file.image) {
            $li.append($("<img>").attr("src", file.image));
            self.attr("class", "sg_prod");
          } else {
            self.attr("class", "sg_term");
          }
          $li.append(file.title.replace(new RegExp(config.text, "ig"), "<strong>$&</strong>"));
          $li.attr({
            "ms.title" : file.title,
            "ms.cmpnm" : "suggested item",
            "ms.cn" : file.title,
            href : file.target,
            "data-bi-name" : file.title,
            "data-bi-source" : "UnifiedSearch",
            "data-bi-slot" : dataAndEvents + 1
          });
          self.mouseover(function() {
            target.children().removeClass("selected");
            self.addClass("selected");
          });
          self.click(function() {
            test.val(file.title);
            if (file.target) {
              window.location.href = file.target;
            } else {
              $("#srv_shellHeaderSearchForm").submit();
            }
          });
          target.append(self);
        });
      }
      if (target.children().length > 0) {
        $("#cli_searchSuggestionsContainer").addClass("visible");
        $items = $(".sg_term");
        $pages = $(".sg_prod");
        if ($items.length > 0) {
          $items.last().addClass("last-sg-term");
        }
        if ($pages.length > 0) {
          tip = $(".cli_suggestedtitle");
          $child = $("<li class='cli_suggestedtitle'>" + shellInitOptions.suggestedProductTitle + "</li>");
          if (tip.length > 0) {
            tip.remove();
          }
          $child.addClass("sg-title");
          $pages.first().before($child);
        }
      } else {
        $("#cli_searchSuggestionsContainer").removeClass("visible");
      }
    }
  };
}(jQuery);
