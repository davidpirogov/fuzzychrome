var shared = (function(ayepromise){
   var module = {};

   module.getAllTabs = function(){
      var defer = ayepromise.defer();
      chrome.windows.getAll({populate: true}, function(windows){
         var tabList = _.flatten(_.map(windows, function(wh){ return wh.tabs; }));
         defer.resolve(tabList);
      });
      return defer.promise;
   };
   
   function all(promises){
      var defer = ayepromise.defer();
      var results = [];
      _.each(promises, function(promise){
         promise.then(
            function(result){
               results.push(result);
               if ( results.length == items.length ) defer.resolve.apply(null, results);
            },
            function(error){
               defer.reject(error);
            }
         );
      });
      return defer.promise;
   }

   return module;
})(ayepromise);

var themes = {};

themes.tabTheme = (function(ayepromise){
   var module = {};
      
   module.createUI = function(){
      var defer = ayepromise.defer();
      chrome.tabs.create({
         url: 'tab-filter.html'
      }, function(th){
         defer.resolve(th);
      });
      return defer.promise;
   };
   
   return module;
})(ayepromise);