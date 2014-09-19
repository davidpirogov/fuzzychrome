function initialize(shared, inputField, filterList){
   
   var K_ESCAPE = 27;
   var inputPollingRate = 1000/30;
   
   var tabSet = false;
   
   function populate(tabList){
      /*
       * TODO: Reuse might be faster than nuking the set entirely?
       */
      tabSet = FuzzySet([], true, 2, 3);
      $('div', filterList).remove();
      _.each(tabList, function(tab){
         var elem = $('<div class="item" id="'+tab.id+'"><span>'+tab.title+'</span></div>');
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
   
   function inputChanged(input){
      console.log(input);
      if ( input.length == 0 ) {
         return $('div', filterList).show();
      }
      var lut = {};
      redraw(lut, _.map(tabSet.get(input), function(pair){
         var tab = pair[1].metadata.tab;
         lut[tab.id] = tab;
         return {tab: tab, match: {score: pair[0], word: pair[1].toString(), bias: pair[1].metadata.bias}};
      }));
   }
   
   function closeFilter(){
      window.close();
   }
   
   // Fetch the list of tabs
   shared.getAllTabs().then(populate);
   
   // Input events
   var inputEvent = (function(){
      var inputValue = '';
      return function(e){
         if ( e && e.keyCode == K_ESCAPE ) closeFilter(); // EScape
         var input = inputField.val();
         if ( inputValue !==  input ) {
            inputValue = input;
            inputChanged(input);
         }
      };
   })();
   var intervalId = false;
   function stopPolling(){
      clearInterval(intervalId);
   }
   function startPolling(){
      clearInterval(intervalId);
      intervalId = setInterval(inputEvent, inputPollingRate);
   }
   inputField.on('focus', startPolling); 
   inputField.on('blur', stopPolling); 
   inputField.on('keydown', inputEvent);
   inputField.on('change', inputEvent);
}
document.addEventListener('DOMContentLoaded', function(e){
   initialize(shared, $("#inputField"), $('#filterList'))
});