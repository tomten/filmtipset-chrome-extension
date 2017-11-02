// Show grade buttons for the selected tab.
chrome.tabs.getSelected(
    null, 
    function(selectedTab) { 
        var popup = new FilmtipsetExtension.Popup($);
        popup.showGradeButtons(selectedTab); 
        }
    );