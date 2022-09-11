HTMLWidgets.widget({

  name: 'tippy',

  type: 'output',

  factory: function(el, width, height) {

    var id;

    return {

      renderValue: function(x) {
        
        id = el.id
        
        if(x.hasOwnProperty('element')){
          tippy('#' + x.element, x.opts);
        } else if(x.hasOwnProperty('class')){
          if(x.hasOwnProperty('opts')){
            tippy('.' + x.class, x.opts);
          } else {
            tippy('.' + x.class);
          }
        } else {
          el.innerHTML = x.text;
          el.setAttribute("data-tippy", x.tooltip);
          tippy('#' + id, x.opts);
        }

      },

      resize: function(width, height) {

      }

    };
  }
});
