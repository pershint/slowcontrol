$.couch.app(function(app) {
  var thresholdData=[];
  var path="";
  var channeldb="/slowcontrol-channeldb/_design/slowcontrol/_view/recent";
  var options="?descending=true&limit=1";
  var recents=["/_view/recent1","/_view/recent2","/_view/recent3","/_view/recent4"];
  var channelNames;
  var sizes={};
  var names=[];
  var deltav="/_view/pi_db";

  var retrieveSizes = function(callback){
    $.getJSON(path+channeldb+options,function(result){
      sizes=result.rows[0].value;
      if(callback){
        callback();
      }
    });
  };

    var thresholdString=function(channelid, condensedType){
	var outputString = "<table>"
	    +"<tr>"
	    +"<td><div class='wide set' id='name"+ channelid +"'><\/div></td>"
	    +"<td><input type='text' class='narrow set' id='lolo"+ channelid +"' \/></td>"
	    +"<td><input type='text' class='narrow set' id='lo"+ channelid +"' \/></td>"
	    +"<td><div class='narrow set realvalue' id='present"+ channelid +"'><\/div></td>"
	    +"<td><input type='text' class='narrow set' id='hi"+ channelid +"' \/></td>"
	    +"<td><input type='text' class='narrow set' id='hihi"+ channelid +"' \/></td>"
	    +"<td><form><input type='checkbox' class='"+condensedType+"' id='isEnabled"+ channelid +"' \/></td>"
	    +"</tr>"
	    +"<tr>"
	    +"<td><div class='wide present'>Present Thresholds<\/div></td>"
	    +"<td><div class='narrow present' id='lolo_present"+ channelid +"'><\/div></td>"
	    +"<td><div class='narrow present' id='lo_present"+ channelid +"'><\/div></td>"
	    +"<td class='narrow'></td>"
	    +"<td><div class='narrow present' id='hi_present"+ channelid +"'><\/div></td>"
	    +"<td><div class='narrow present' id='hihi_present"+ channelid +"'><\/div></td>"
	    +"<td class='narrow'></td>"
	    +"</tr>"
	    +"<tr>"
	    +"<td><div class='wide approved'>Approved Thresholds<\/div></td>"
	    +"<td><div class='narrow approved' id='lolo_approved"+ channelid +"'><\/div></td>"
	    +"<td><div class='narrow approved' id='lo_approved"+ channelid +"'><\/div></td>"
	    +"<td class='narrow'></td>"
	    +"<td><div class='narrow approved' id='hi_approved"+ channelid +"'><\/div></td>"
	    +"<td><div class='narrow approved' id='hihi_approved"+ channelid +"'><\/div></td>"
	    +"<td class='narrow'></td>"
	    +"</tr>"
	    +"</table>"
	return outputString;
    };
    /*class='checkycheese"+ condensedType +"*/
  var makehtml = function(){
      var channelid="";
    for (var ios = 0; ios<sizes.ioss.length-1; ios++){
      for (var card = 0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel = 0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
            channelid = "_ios"+ios+"card"+card+"channel"+channel;
            type=sizes.ioss[ios].cards[card].channels[channel].type;
	    condensedType = type.replace(/\s+/g, '');
            $("#everything").append("<div class='channel notAlarmed notUnused type"+ condensedType +"' id='all"+ channelid + "'>");
            $("#all"+channelid).append(thresholdString(channelid, condensedType));
        }
      }
    }
    //Add deltav items in channeldb to your everything to be shown list
    for (var channel = 0; channel<sizes.deltav.length; channel++){
	channelid = "_deltav"+channel;
	type = sizes.deltav[channel].type;
	if (type.includes("UPS")){
      type = "UPS";
    }
    condensedType = type.replace(/\s+/g, '');
	$("#everything").append("<div class='channel notAlarmed notUnused type"+ type +"' id='all"+ channelid + "'>");
	$("#all"+channelid).append(thresholdString(channelid, condensedType));
    }

    //Add cavity temperatures to your everything list
    for (var channel = 0; channel<sizes.temp_sensors.length; channel++){
	channelid = "_temp_sensors"+channel;
	type = sizes.temp_sensors[channel].type;
	condensedType = type.replace(/\s+/g, '');
	$("#everything").append("<div class='channel notAlarmed notUnused type"+ type +"' id='all"+ channelid + "'>");
	$("#all"+channelid).append(thresholdString(channelid, condensedType));
    }
  };


  var unusedChannel = function(channelstuff){
    var unused = false;
      if (channelstuff.type=="spare"){
        unused = true;
      }
      if (channelstuff.type=="test"){
        unused = true;
      }
      if (channelstuff.signal=="reset"){
        unused = true;
      }
      if (channelstuff.signal=="disable"){
        unused = true;
      }
      if (channelstuff.signal=="enable"){
        unused = true;
      }
    return unused;
  };


  var fillLegend = function(){
    $("#OKSamp").css({"background-color":"green"});
    $("#AlarmSamp").css({"background-color":"red"});
    $("#OFFSamp").css({"background-color":"gray"});
    $("#DisableSamp").css({"background-color":"goldenrod"});
    $("#OLDSamp").css({"background-color":"cyan"});
  };

  //fills the drop down list used in the plots tab, then
  //fills in the names of objects in the thresholds tab page
  var fillNames = function(){
    var nameindex=0;
    for (var ios = 0; ios<sizes.ioss.length-1; ios++){
      for (var card = 0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel = 0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
          nameText="";
          if(sizes.ioss[ios].cards[card].channels[channel].type){
            nameText += sizes.ioss[ios].cards[card].channels[channel].type;
          }
          if(sizes.ioss[ios].cards[card].channels[channel].id){
            nameText += " "+ sizes.ioss[ios].cards[card].channels[channel].id;
          }
          if(sizes.ioss[ios].cards[card].channels[channel].signal){
            nameText += " "+sizes.ioss[ios].cards[card].channels[channel].signal;
          }
          if(sizes.ioss[ios].cards[card].channels[channel].unit){
            nameText += " ("+sizes.ioss[ios].cards[card].channels[channel].unit+")";
          }
          names[nameindex]={
            "name": nameText,
            "ios": ios,
            "card": card,
            "channel": channel
          };
          if (!unusedChannel(sizes.ioss[ios].cards[card].channels[channel])){
            $("#name_dropdown").append("<option data-role='none' value="+nameindex +">" + names[nameindex].name + "<\/option>");
            // because plots.js recreates the names information, it's easier to make names[] include unused channels but only display used ones in name_dropdown.  If I ever combine plots.js with slowloader and slowrunner, this can be improved.
          }
          nameindex++;
        }
      }
    }

    //Add deltav values to plots tab dropdown list
    for (var channel = 0; channel<sizes.deltav.length; channel++){
      names[nameindex] = {
        "name": ""+sizes.deltav[channel].type+" "+sizes.deltav[channel].id+" "+sizes.deltav[channel].signal+ " ("+sizes.deltav[channel].unit+")",
        "deltav": true,
        "type": sizes.deltav[channel].type,
        "id": sizes.deltav[channel].id
      };
      $("#name_dropdown").append("<option data-role='none' value="+nameindex +">" + names[nameindex].name + "<\/option>");
      nameindex++;
    }

    //Add cavity temperature sensors to plots.js dropdown list
    for (var channel = 0; channel<sizes.temp_sensors.length; channel++){
      names[nameindex] = {
        "name": ""+sizes.temp_sensors[channel].type+" "+sizes.temp_sensors[channel].id+" "+sizes.temp_sensors[channel].signal+ " ("+sizes.temp_sensors[channel].unit+")",
        "temp_sensors": true,
        "type": sizes.temp_sensors[channel].type,
        "id": sizes.temp_sensors[channel].id
      };
      $("#name_dropdown").append("<option data-role='none' value="+nameindex +">" + names[nameindex].name + "<\/option>");
      nameindex++;
    }

   //define ios object names used in thresholds tab page
   for (var ios=0; ios<sizes.ioss.length-1; ios++){
      for (var card=0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel=0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
          var nametext="";
          if (sizes.ioss[ios].cards[card].channels[channel].type){
            nametext = nametext + sizes.ioss[ios].cards[card].channels[channel].type + " ";
          }
          if (sizes.ioss[ios].cards[card].channels[channel].id!=null){
            nametext = nametext + sizes.ioss[ios].cards[card].channels[channel].id + " ";
          }
          if (sizes.ioss[ios].cards[card].channels[channel].signal){
            nametext = nametext + sizes.ioss[ios].cards[card].channels[channel].signal + " ";
          }
          if (sizes.ioss[ios].cards[card].channels[channel].unit){
            nametext = nametext + " ("+sizes.ioss[ios].cards[card].channels[channel].unit +")";
          }
          $("#name_ios"+ios+"card"+card+"channel"+channel).text(nametext);
          if (sizes.ioss[ios].cards[card].channels[channel].lolo!=null){
            $("#lolo_ios"+ios+"card"+card+"channel"+channel).val(
            sizes.ioss[ios].cards[card].channels[channel].lolo);
            $("#lo_ios"+ios+"card"+card+"channel"+channel).val(
            sizes.ioss[ios].cards[card].channels[channel].lo);
            $("#hi_ios"+ios+"card"+card+"channel"+channel).val(
            sizes.ioss[ios].cards[card].channels[channel].hi);
            $("#hihi_ios"+ios+"card"+card+"channel"+channel).val(
            sizes.ioss[ios].cards[card].channels[channel].hihi);
          }
          else {
            $("#lolo_ios"+ios+"card"+card+"channel"+channel).attr(
            "disabled",true);
            $("#lo_ios"+ios+"card"+card+"channel"+channel).attr(
            "disabled",true);
            $("#hi_ios"+ios+"card"+card+"channel"+channel).attr(
            "disabled",true);
            $("#hihi_ios"+ios+"card"+card+"channel"+channel).attr(
            "disabled",true);
          }
          if (sizes.ioss[ios].cards[card]
          .channels[channel].isEnabled!=null){ //if property exists
            $("#isEnabled_ios"+ios+"card"+card+"channel"+channel)
            .prop("checked", sizes.ioss[ios].cards[card].channels[channel].isEnabled);
          }
          else {
            $("#isEnabled_ios"+ios+"card"+card+"channel"+channel)
            .attr("disabled", true);
          }
          if (unusedChannel(sizes.ioss[ios].cards[card].channels[channel])){
            $("#all_ios"+ios+"card"+card+"channel"+channel).css({"display":"none"});
	    $("#all_ios"+ios+"card"+card+"channel"+channel).removeClass("notAlarmed");
	    $("#all_ios"+ios+"card"+card+"channel"+channel).removeClass("notUnused");
	    $("#all_ios"+ios+"card"+card+"channel"+channel).removeClass("type"+sizes.ioss[ios].cards[card].channels[channel].type); 
          }
        }
      }
    }
    for (var channel=0; channel<sizes.deltav.length; channel++){
      channelid = "_deltav"+channel;
      channelid = channelid.replace(/\s/g, "_");
      $("#name"+channelid).text("" +sizes.deltav[channel].type + " " + sizes.deltav[channel].id + " " + sizes.deltav[channel].signal + " (" +sizes.deltav[channel].unit+ ")");
      $("#lolo" + channelid).val(sizes.deltav[channel].lolo);
      $("#lo" + channelid).val(sizes.deltav[channel].lo);
      $("#hi" + channelid).val(sizes.deltav[channel].hi);
      $("#hihi" + channelid).val(sizes.deltav[channel].hihi);
      if (sizes.deltav[channel].isEnabled!=null){ //if property exists
        $("#isEnabled" + channelid).prop("checked", sizes.deltav[channel].isEnabled);
      }
      else {
        $("#isEnabled" + channelid).attr("disabled", true);
      }
    }
    //Add temperature sensors to our thresholds tab for filling with data
    for (var channel=0; channel<sizes.temp_sensors.length; channel++){
      channelid = "_temp_sensors"+channel;
      channelid = channelid.replace(/\s/g, "_");
      $("#name"+channelid).text("" +sizes.temp_sensors[channel].type + " " + sizes.temp_sensors[channel].id + " " + sizes.temp_sensors[channel].signal + " (" +sizes.temp_sensors[channel].unit+ ")");
      $("#lolo" + channelid).val(sizes.temp_sensors[channel].lolo);
      $("#lo" + channelid).val(sizes.temp_sensors[channel].lo);
      $("#hi" + channelid).val(sizes.temp_sensors[channel].hi);
      $("#hihi" + channelid).val(sizes.temp_sensors[channel].hihi);
      if (sizes.temp_sensors[channel].isEnabled!=null){ //if property exists
        $("#isEnabled" + channelid).prop("checked", sizes.temp_sensors[channel].isEnabled);
      }
      else {
        $("#isEnabled" + channelid).attr("disabled", true);
      }
    }
  };


  $("#testaudiobutton").click(function(){
    $("#testaudio").get(0).play();
  });

  $(".testaudiobutton").click(function(){
    $("#testaudio").get(0).play();
  });

  retrieveSizes(function(){
    makehtml();
    fillNames();
    fillLegend();
  });
});
