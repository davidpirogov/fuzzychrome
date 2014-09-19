function initialize(shared, inputField, filterList){
   
   var tabSet = false;
   
   function populate(tabList){
      /*
       * TODO: Reuse might be faster than nuking the set entirely?
       */
      tabSet = FuzzySet([], true, 2, 3);
      $('div', filterList).remove();
      _.each(tabList, function(tab){
         var elem = $('<div class="item" id="'+tab.wh_id+'_'+tab.th_id+'"><span>'+tab.title+'</span></div>');
         filterList.append(elem);
         var words = tab.title.split(/[\W_]+/).slice(0, 8);
         var len = words.length;
         _.each(words, function(word, offset){
            
            if ( word.length > 2 ) {
               var str = new String(word);
               str.metadata = {
                  bias: 1-offset/len,
                  tab: tab,
                  elem: elem
               };
               tabSet.add(str);
            }
         });
      });
   }
   
   function redraw(lut, tabList){
      $('div', filterList).each(function(){
         var elem = $(this);
         if ( lut[elem.attr('id')] ) {
            elem.attr('class', 'item active');
         } else {
            elem.attr('class', 'item disabled');
         }
      });
   }
   
   function close(){
      window.close();
   }
   
   var filter = (function(){
      var inputValue = '';
      return function(e){
         if ( e && e.keyCode == 27 ) close();
         var input = inputField.val();
         if ( inputValue !==  input ) {
            inputValue = input;
            if ( input.length == 0 ) {
               return $('div', filterList).show();
            }
            var selected = [];
            var lut = {};
            redraw(lut, _.map(tabSet.get(inputValue), function(pair){
               var tab = pair[1].metadata.tab;
               lut[tab.wh_id+'_'+tab.th_id] = tab;
               return {tab: tab, match: {score: pair[0], word: pair[1].toString(), bias: pair[1].metadata.bias}};
            }));
         }
      };
   })();

   var intervalId = false;
   inputField.on('focus', function(){ console.log('started'); clearInterval(intervalId); intervalId = setInterval(filter, 1000/30); });
   inputField.on('blur', function(){ console.log('stopped'); clearInterval(intervalId); });
   
   inputField.on('keydown', filter);
   inputField.on('change', filter);
   
   shared.getAllTabs().then(populate);

}
document.addEventListener('DOMContentLoaded', function(e){
   initialize(shared, $("#inputField"), $('#filterList'))
});