function initialize(shared, themes){
   
   function doTabMode(){
      shared.all([
         themes.tabTheme.createUI(),
         shared.getAllTabs()
      ]).then(
   };
   
   function doOverlayMode(){
      //TODO: 
   };
   
   var dispatch = {
      'tab-mode': doTabMode,
      'overlay-mode': doOverlayMode
   };
   chrome.commands.onCommand.addListener(function(command) {
      if ( typeof dispatch[command] === 'function' ) dispatch[command]();
   });

}
document.addEventListener('DOMContentLoaded', function(e){
   initialize(shared, themes);
});
