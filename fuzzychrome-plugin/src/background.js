function initialize(shared, themes){
   
   function doTabMode(){
      themes.tabTheme.createUI();
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
