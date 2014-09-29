function initialize(shared, inputField, filterList){
   
   var K_ESCAPE = 27;
   var inputPollingRate = 1000/30;
   
   var tabSet = false;
   
   function populate(tabList){
      /*
       * TODO: Reuse might be faster than nuking the set entirely?
       */
      console.log("Initialising the fuzzies...");
//      tabSet = FuzzySet([], true, 2, 5);    

      tabSet = AvroFuzz([], 2, 5);
      $('div', filterList).remove();
      
      //_.each(tabList.slice().splice(0,2), function(tab){
      _.each(tabList, function(tab){
      
         var elem = $('<div class="item" id="'+tab.id+'"><span>'+tab.title+'</span></div>');
         filterList.append(elem);
         
         var words = tab.title.split(/[\W_]+/).slice(0, 8);
         var len = words.length;
      
         // Minimum values that *must* be passed are:
         //   id    - The unique key for this tab
         //   value - The value by which we will search
         // Note that other parameters that are passed into this object
         // will be passed back in result
         var tabInfo = {
           id: tab.id,
           value: tab.title,
           element: elem,
           tab: tab
         };
         tabSet.add(tabInfo);
         
         
         /*
         _.each(words, function(word, offset){
            if ( word.length > 2 ) {
             
               var tabInfo = {
                 tab: tab,
                 value: word,
                 score: 0.0,
                 element: elem
               };
               
               tabSet.add(tabInfo);
            }
         });
         */
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
          
     // no point in looking for length less than two as our 
     // n-grams start at 2.
      if ( input.length < 2 ) {
         return $('div', filterList).show();
      }
      
      /*
      var iterations = 10000;
      var startTime = Date.now();
      for(var i = 0; i < iterations; ++i) {
        tabSet.get(input);
      }
      var stopTime = Date.now();
      var duration = stopTime - startTime;
      var lookupTimePerUnit = duration / iterations;
      console.log("Lookup Length: " + input.length + " Total Duration: " + duration + "ms  Lookup Time Per Unit: " + lookupTimePerUnit + "ms Iterations: " + iterations);
      */
      
      var matchedTabs = tabSet.get(input);
      var lut = {};
      redraw(lut, _.map(matchedTabs, function(pair){
      
        var score = pair[0];
        var tab = pair[1].tab;
        lut[tab.id] = tab;
         
         return {
           tab: tab, 
           match: {
             score: pair[0], 
             word: pair[1]['value'], 
             bias: pair[1]['bias']
           }
         };
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