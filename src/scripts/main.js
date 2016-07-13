(function ($) {
    "use strict";

    $('.selectize').selectize({
        sortField: 'text'
    });

    $('.selectize-tag').selectize({
        plugins: ['remove_button'],
        delimiter: ',',
        persist: false,
        create: function (input) {
            return {
                value: input,
                text: input
            };
        }
    });

    function() {
        var t = n(".shell-search");
        n(this).toggleClass("active");
        t.toggleClass("expanded");
        t.hasClass("expanded") ? (t.find('input[type="search"]').focus(), o.css("height", "auto")) : o.css("height", "")
    };

})(window.jQuery);