// ==UserScript==
// @id             iitc-plugin-l8-res-stat@zsf222
// @name           IITC plugin: show the statistics that who has deployed L8 resonators
// @category       Info
// @version        0.0.1
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @description    [iitc-2017-01-08-021732] Display a list of all localized portals by level and faction.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

// *****@updateURL      https://static.iitc.me/build/release/plugins/portal-counts.meta.js
// *****@downloadURL    https://static.iitc.me/build/release/plugins/portal-counts.user.js


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'iitc';
plugin_info.dateTimeVersion = '20170702.21732';
plugin_info.pluginId = 'l8-res-stat';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

/* whatsnew
* 0.0.1  : initial release, show the stat
*/

// use own namespace for plugin
window.plugin.l8resstat = {
  BAR_TOP: 20,
  BAR_HEIGHT: 180,
  BAR_WIDTH: 25,
  BAR_PADDING: 5,
  RADIUS_INNER: 70,
  RADIUS_OUTER: 100,
  CENTER_X: 200,
  CENTER_Y: 100,
};

window.plugin.l8resstat.onFinishLoadingPortalDetails = function(){
  var self = window.plugin.l8resstat;
  console.log(self.agents);
  var counts = "<table><tbody><tr><td></td><td>"+self.agents.join("</td><td>")+"</td></tr>";
  for(var x in self.portal2resname)
  {
    console.log(x + ': ' + self.portal2resname[x].length);
    var list = self.portal2resname[x];
    counts += "<tr><td>" + x+"</td>";
    for(var i in self.agents)
    {
      if(self.portal2resname[x].includes(self.agents[i]))
        counts += "<td></td>";
      else
        counts += "<td>X</td>";
    }
    counts += "</tr>";
  }
  counts += "</tbody></table>";
  var title = '' + Object.keys(self.portal2resname).length + ' Portals';
  if(window.useAndroidPanes()) {
    $('<div id="l8resstat" class="mobile">'
    + '<div class="ui-dialog-titlebar"><span class="ui-dialog-title ui-dialog-title-active">' + title + '</span></div>'
    + counts
    + '</div>').appendTo(document.body);
  } else {
    dialog({
      html: '<div id="l8resstat">' + counts + '</div>',
      title: 'L8 Resonators: ' + title,
      width: 'auto'
    });
  }
};

//count portals for each level available on the map
window.plugin.l8resstat.getPortals = function (){
  if(map.getZoom()<17)
  {
    if(window.useAndroidPanes()) {
      $('<div id="l8resstat" class="mobile">'
      + '<div class="ui-dialog-titlebar"><span class="ui-dialog-title ui-dialog-title-active">' + "" + '</span></div>'
      + "Please zoom in for less portals."
      + '</div>').appendTo(document.body);
    } else {
      dialog({
        html: '<div id="l8resstat">' + "Please zoom in for less portals." + '</div>',
        title: 'L8 Resonators: ' ,
        width: 'auto'
      });
    }
    return false;
  }
  //console.log('** getPortals');
  var self = window.plugin.l8resstat;
  var displayBounds = map.getBounds();
  self.agents = [];
  var PortalsInRangeCount = 0;
  var cnt = 0;
  var cnt_failed = 0;
  self.portal2resname = {};
  $.each(window.portals, function(i, portal){
    if(displayBounds.contains(portal.getLatLng())) PortalsInRangeCount++;
  });

  console.log('cnt = ' + PortalsInRangeCount);

  $.each(window.portals, function(i, portal) {
    if(!displayBounds.contains(portal.getLatLng())) return true;
	  window.postAjax('getPortalDetails', {guid:i},
      function(data,textStatus,jqXHR) {
        var portal = decodeArray.portalDetail(data.result);
        try
        {
          var name = portal.title;
        }catch(err)
        {
          console.log(portal);
        }
        self.portal2resname[name] = [];
        //console.log(portal);
        if(portal.level != 8)
          for(var j in portal.resonators)
          {
            var res = portal.resonators[j];
            //console.log(res.level);
            if(res.level == 8)
            {
              //console.log(res.owner);
              if(!self.agents.includes(res.owner))
                self.agents.push(res.owner);
              self.portal2resname[name].push(res.owner);
            }
          }
        cnt++;
        if(cnt == PortalsInRangeCount)
          self.onFinishLoadingPortalDetails();
      },
      function() {
        cnt_failed++;
        cnt++;
        if(cnt == PortalsInRangeCount)
          self.onFinishLoadingPortalDetails();
      }
    );
  });
};

window.plugin.l8resstat.onPaneChanged = function(pane) {
  if(pane == 'plugin-l8resstat')
    window.plugin.l8resstat.getPortals();
  else
    $('#l8resstat').remove();
};

var setup =  function() {
  if(window.useAndroidPanes()) {
    android.addPane('plugin-l8resstat', 'L8 Resonators', 'ic_action_data_usage');
    addHook('paneChanged', window.plugin.l8resstat.onPaneChanged);
  } else {
    $('#toolbox').append(' <a onclick="window.plugin.l8resstat.getPortals()" title="Display a summary of L8 resonators on each portal">L8 Resonators</a>');
  }

  $('head').append('<style>' +
    '#l8resstat.mobile {background: transparent; border: 0 none !important; height: 100% !important; width: 100% !important; left: 0 !important; top: 0 !important; position: absolute; overflow: auto; z-index: 9000 !important; }' +
    '#l8resstat table {margin-top:5px; border-collapse: collapse; empty-cells: show; width:100%; clear: both;}' +
    '#l8resstat table td, #l8resstat table th {border-bottom: 1px solid #0b314e; padding:3px; color:white; background-color:#1b415e}' +
    '#l8resstat table tr.res th {  background-color: #005684; }' +
    '#l8resstat table tr.enl th {  background-color: #017f01; }' +
    '#l8resstat table th { text-align: center;}' +
    '#l8resstat table td { text-align: center;}' +
    '#l8resstat table td.L0 { background-color: #000000 !important;}' +
    '#l8resstat table td.L1 { background-color: #FECE5A !important;}' +
    '#l8resstat table td.L2 { background-color: #FFA630 !important;}' +
    '#l8resstat table td.L3 { background-color: #FF7315 !important;}' +
    '#l8resstat table td.L4 { background-color: #E40000 !important;}' +
    '#l8resstat table td.L5 { background-color: #FD2992 !important;}' +
    '#l8resstat table td.L6 { background-color: #EB26CD !important;}' +
    '#l8resstat table td.L7 { background-color: #C124E0 !important;}' +
    '#l8resstat table td.L8 { background-color: #9627F4 !important;}' +
    '#l8resstat table td:nth-child(1) { text-align: left;}' +
    '#l8resstat table th:nth-child(1) { text-align: left;}' +
    '</style>');
};

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


