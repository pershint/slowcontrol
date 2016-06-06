$.couch.app(function(app) {
  var approvedThresholdData=[];
  var filledThresholdData=[];
  var presentData=[];
  var alarms=[];
  var path="";
  var channeldb="/slowcontrol-channeldb/_design/slowcontrol/_view/recent";
  var datadb="/slowcontrol-data-5sec/_design/slowcontrol-data-5sec";
  var onemindb="/slowcontrol-data-1min/_design/slowcontrol-data-1min";
  var alarmdb="/slowcontrol-alarms/_design/slowcontrol-alarms";
  var options="?descending=true&limit=1";
  var recents=["/_view/recent1","/_view/recent2","/_view/recent3","/_view/recent4"];
  var deltav="/_view/pi_db"
  var checking = true;
  var approval=false;
  var alarmIndex=0;
  var polling=true;
  var sequence;
  var rackAudioOn=true;
  var colorblindModeOn=false;
  var sizes={};
  var counter1=true;
  var counter2=true;

  var retrieveSizes = function(callback){
    $.getJSON(path+channeldb+options,function(result){
      sizes=result.rows[0].value;
      if(callback){
        callback();
      }
    });
  };

  var fillThresholds = function(thresholdData){
    filledThresholdData=thresholdData;
    var approved=true;
    for (var ios=0; ios<sizes.ioss.length-1; ios++){
      for (var card=0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel=0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
          var channelid = "_ios"+ios+"card"+card+"channel"+channel;
          if (thresholdData.ioss[ios].cards[card].channels[channel].lolo!=null){
            $("#lolo"+channelid).val(thresholdData.ioss[ios].cards[card].channels[channel].lolo);
            $("#lo"+channelid).val(thresholdData.ioss[ios].cards[card].channels[channel].lo);
            $("#hi"+channelid).val(thresholdData.ioss[ios].cards[card].channels[channel].hi);
            $("#hihi"+channelid).val(thresholdData.ioss[ios].cards[card].channels[channel].hihi);
          }
          if (thresholdData.ioss[ios].cards[card].channels[channel].isEnabled!=null){ //if property exists
            $("#isEnabled"+channelid)
            .prop("checked", thresholdData.ioss[ios].cards[card].channels[channel].isEnabled);
          }
        }
      }
      approved = approved && thresholdData.ioss[ios].approved;
    }
    for (var channel=0; channel<sizes.deltav.length; channel++){
      var channelid = "_deltav"+channel;
      //channelid = channelid.replace("_", "");

      if (thresholdData.deltav[channel].lolo!=null){
        $("#lolo"+channelid).val(thresholdData.deltav[channel].lolo);
        $("#lo".channelid).val(thresholdData.deltav[channel].lo);
        $("#hi"+channelid).val(thresholdData.deltav[channel].hi);
        $("#hihi"+channelid).val(thresholdData.deltav[channel].hihi);
      }
      if (thresholdData.deltav[channel].isEnabled!=null){ //if property exists
          $("#isEnabled"+channelid).prop("checked", thresholdData.deltav[channel].isEnabled);
      }
    }
    if (approved){
      $("#approved").prop("checked",true);
    }
    else {
      $("#approved").prop("checked",false);
    }
  }

  var showThresholds = function(thresholdData, present){
    var type;
    if (present){
      type="present";
    }else{
      type="approved";
    }
    for (var ios=0; ios<sizes.ioss.length-1; ios++){
      for (var card=0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel=0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
          var channelid = "_ios"+ios+"card"+card+"channel"+channel;
          if (thresholdData.ioss[ios].cards[card].channels[channel].lolo!=null){
            $("#lolo_"+type+channelid).text(
            thresholdData.ioss[ios].cards[card].channels[channel].lolo);
            $("#lo_"+type+channelid).text(
            thresholdData.ioss[ios].cards[card].channels[channel].lo);
            $("#hi_"+type+channelid).text(
            thresholdData.ioss[ios].cards[card].channels[channel].hi);
            $("#hihi_"+type+channelid).text(
            thresholdData.ioss[ios].cards[card].channels[channel].hihi);
          }
        }
      }
    }
    for (var channel=0; channel<sizes.deltav.length; channel++){
      var channelid = "_deltav"+channel;
      //channelid = channelid.replace("_", "");
      if (thresholdData.deltav){
        $("#lolo_" + type + channelid).text(thresholdData.deltav[channel].lolo);
        $("#lo_" + type + channelid).text(thresholdData.deltav[channel].lo);
        $("#hi_" + type + channelid).text(thresholdData.deltav[channel].hi);
        $("#hihi_" + type + channelid).text(thresholdData.deltav[channel].hihi);
      }
    }
  };
 
  var fillValues = function(presentValues){
    var deltavChannel=0;
    var oldChannelType="";
    var newChannelType="";
    $("#time_data_deltav").text(Date.parse(presentValues.couchDBtime)/1000 - presentValues.deltav.timestamp);
    for (var channel=0; channel<sizes.deltav.length; channel++){
      newChannelType = sizes.deltav[channel].type;
      if (newChannelType != oldChannelType){
        deltavChannel=0;
      }
      $("#present_deltav"+channel).text(presentValues.deltav[newChannelType]["values"][sizes.deltav[channel].id-1]);
      if (newChannelType == "cavity_water_temp"){
        $("#cavity_water_temp1val").text(presentValues.deltav[newChannelType]["values"][sizes.deltav[channel].id-1]);
      }
      deltavChannel++;
    }

    var cardCount;
    for (var ios=0; ios<sizes.ioss.length-1; ios++){
      $("#time_data_ios"+(ios+1)).text(Date.parse(presentValues.couchDBtime)/1000 - presentValues.ioss[ios].timestamp);
      for (var card=0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel=0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
          $("#present_ios"+ios+"card"+card+"channel"+channel).text(
          Math.round(parseFloat(presentValues.ioss[ios][sizes.ioss[ios].cards[card].card]["voltages"][channel])*10000)/10000);
          //Write rack voltages into overview page
          //The Idea: look at the information for this channel from the channeldb.  If it's a rack, fill it's
          //Voltage information into the correct box on the webpage.
          channelType=sizes.ioss[ios].cards[card].channels[channel].type;
          channelSignal=sizes.ioss[ios].cards[card].channels[channel].signal;
          channelid=sizes.ioss[ios].cards[card].channels[channel].id;
          if (channelType == "rack"){
            $("#rack"+channelid+"channel"+channelSignal+"val").text(Math.round(parseFloat(presentValues.ioss[ios][sizes.ioss[ios].cards[card].card]["voltages"][channel])*100)/100);
          }
          if (channelType =="timing rack"){
            $("#rackTimingchannel"+channelSignal+"val").text(Math.round(parseFloat(presentValues.ioss[ios][sizes.ioss[ios].cards[card].card]["voltages"][channel])*100)/100);
          }
          if (channelType == "MTCD"){
            $("#"+channelType+"val").text(Math.round(parseFloat(presentValues.ioss[ios][sizes.ioss[ios].cards[card].card]["voltages"][channel])*1000)/1000);
          }
        }
        cardCount++;
      }
    }
  };
 
  var retrievePresentThresholds = function(fill){
    $("#statustext").text("Getting Thresholds...");
    retrieveSizes(function(){
      $("#statustext").text("Done loading thresholds. These thesholds were set by "+sizes.submitter+" in "+sizes.ip_address.city+" from computer "+sizes.ip_address.ip+" on "+sizes.sudbury_time+". Reason for last change: "+sizes.reason);
      if (fill==null){
        fillThresholds(sizes);
      }
      else if (fill){
        fillThresholds(sizes);
      }
      else{
        showThresholds(sizes, true);
      }
    });
  };

  var retrieveApprovedThresholds = function(fill){
    $.getJSON(path+channeldb+"_approved"+options,function(result){
      approvedThresholdData=result.rows[0].value;
      if (fill){
        fillThresholds(approvedThresholdData);
      }
      else{
        showThresholds(approvedThresholdData, false);
      }
    });
  };

  var retrievePresentValues = function(){
    var views=[];
    var iosresults=[];
    var deltavresult=[];
    var responsetime="";
    for (var i=0; i<recents.length; i++){
      views.push(
        $.getJSON(path+datadb+recents[i]+options,function(result){
          //collects the results but in whatever order they arrive
          iosresults.push(result.rows[0].value);
//          respheader.push(result.getAllResponseHeaders());
        })
      ); 
    }
    //Grab the data as well as the response header date from CouchDB
    views.push(
      $.getJSON(path+onemindb+deltav+options,function(result, txtstatus, jqobj){
        deltavresult=result.rows[0].value;
        responsetime = jqobj.getResponseHeader("Date");
      })
    );

    //pulls all views simultaneously
    $.when.apply($, views)
    .then(function(){
      //arrange the results
      presentData={
        "ioss":[],
        "deltav":deltavresult,
        "couchDBtime":responsetime
      };
      for (var i=0; i<iosresults.length; i++){
        resultpos=$.grep(iosresults, function(e,f){return e.ios == i+1;});
        presentData.ioss.push(resultpos[0]);
      }
      fillValues(presentData);
      formatAll();
    });
  };


  var formatAll = function(){
//    $("#statustext").text("Formatting...");

// Reset everything to okay
    if (colorblindModeOn==false){
      $(".racks").css({"background-color":"forestgreen"});
      $(".crates").css({"background-color":"forestgreen"});
      $(".box").css({"background-color":"forestgreen"});
    }
    else {
      $(".racks").css({"background-color":"blue"});
      $(".crates").css({"background-color":"blue"});
      $(".box").css({"background-color":"blue"});
    }
    $(".realvalue").css({"color":"black"});
    $(".notUnused").addClass("notAlarmed");

// Set anything disabled to yellow
    for (var ios=0; ios<sizes.ioss.length-1; ios++){
      for (var card=0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel=0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
          if (sizes.ioss[ios].cards[card].channels[channel].isEnabled==0){
            $("#present_ios"+ios+"card"+card+"channel"+channel).css({"color":"goldenrod"});
            if (sizes.ioss[ios].cards[card].channels[channel].type=="xl3"){
              $("#xl3s").css({"background-color":"goldenrod"});
              $("#crate"+sizes.ioss[ios].cards[card].channels[channel].id+"channelXL3_"+sizes.ioss[ios].cards[card].channels[channel].signal.charAt(0)).css({"background-color":"goldenrod"});
            }
           if (sizes.ioss[ios].cards[card].channels[channel].type=="rack"){
              $("#rack"+sizes.ioss[ios].cards[card].channels[channel].id)
              .css({"background-color":"goldenrod"});
              $("#rack"+sizes.ioss[ios].cards[card].channels[channel].id+"channel"+sizes.ioss[ios].cards[card].channels[channel].signal).css({"background-color":"goldenrod"});
            }
            if (sizes.ioss[ios].cards[card].channels[channel].type=="timing rack"){
              $("#timing").css({"background-color":"goldenrod"});
              $("#rackTimingchannel"+sizes.ioss[ios].cards[card].channels[channel].signal).css({"background-color":"goldenrod"});
            }
            if (sizes.ioss[ios].cards[card].channels[channel].type=="crate"){
              $("#crate"+sizes.ioss[ios].cards[card].channels[channel].id)
              .css({"background-color":"goldenrod"});
              $("#crate"+sizes.ioss[ios].cards[card].channels[channel].id+"channel"+sizes.ioss[ios].cards[card].channels[channel].signal).css({"background-color":"goldenrod"});
            }
           if (sizes.ioss[ios].cards[card].channels[channel].type=="Comp Coil"){
              $("#coils").css({"background-color":"goldenrod"});
              $("#coil"+sizes.ioss[ios].cards[card].channels[channel].id+"channel"+sizes.ioss[ios].cards[card].channels[channel].signal.charAt(0)).css({"background-color":"goldenrod"});
            }
            if (sizes.ioss[ios].cards[card].channels[channel].type=="HV Panic" || sizes.ioss[ios].cards[card].channels[channel].type=="UPS"){
              $("#EStopUPS").css({"background-color":"golenrod"});
            }
          }
        }
      }
    }
    for (var channel=0; channel<sizes.deltav.length; channel++){
      if (sizes.deltav[channel].isEnabled==0){
        $("#present_deltav"+channel).css({"color":"goldenrod"});
        $("#"+sizes.deltav[channel].type+sizes.deltav[channel].id).css({"background-color":"goldenrod"});
//          $("#holdups").css({"background-color":""goldenrod"});
      }
    }

// Set anything with an alarm to red
    for (var ios=0; ios<sizes.ioss.length-1; ios++){
      for (var card=0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel=0; channel<alarms.ioss[ios].cards[card].channels.length; channel++){
	  channelInfo=alarms.ioss[ios].cards[card].channels[channel];
          $("#present_ios"+ios+"card"+card+"channel"+alarms.ioss[ios].cards[card].channels[channel].channel).css({"color":"red"});
          // If any racks are off, set their channel reading color to gray
          if (channelInfo.type=="rack" || channelInfo.type=="rack voltage"){
            if (channelInfo.reason=="off"){
              $("#present_ios"+ios+"card"+card+"channel"+alarms.ioss[ios].cards[card].channels[channel].channel).css({"color":"gray"});
            }
          }
          if (channelInfo.type=="timing rack" || channelInfo.type=="MTCD"){
            if (channelInfo.reason=="off"){
              $("#present_ios"+ios+"card"+card+"channel"+alarms.ioss[ios].cards[card].channels[channel].channel).css({"color":"gray"});
            }
          }
	  $("#all_ios"+ios+"card"+card+"channel"+alarms.ioss[ios].cards[card].channels[channel].channel).removeClass("notAlarmed");
        }
      }
    }

    var numDeltavChannels = sizes.deltav.length;
    var channelid="";
    for (var field in alarms.deltav){
      for (var i=0; i<alarms.deltav[field].length; i++){
        for (var channel=0; channel<numDeltavChannels; channel++){
          if (sizes.deltav[channel].type==alarms.deltav[field][i].type && sizes.deltav[channel].id==alarms.deltav[field][i].id){
            $("#present_deltav"+channel).css({"color":"red"});
	    $("#all_deltav"+channel).removeClass("notAlarmed");
          }
          // .replace(/\s/g,"") removes underscores.  So, "AV_temp" -> "AVtemp" etc.
          channelid=field+alarms.deltav[field][i].id;
          $("#"+channelid).css({"background-color":"red"});
        }
      }
    }
    $("#alarmlist").empty();
      //First, check the detector server connection
      if (alarms.detserver[0].connStatus == "NONE") {
        $("#DetectorServer").css({"background-color":"red"});
      }
      if (alarms.iboot3[0].iboot3pwr == "OFF") {
        $("#IBoot3").css({"background-color":"gray"});
      }
      for (var ios=0; ios<sizes.ioss.length-1; ios++){
	for (var card=0; card<sizes.ioss[ios].cards.length; card++){
          for (var channel=0; channel<alarms.ioss[ios].cards[card].channels.length; channel++){
	      channelInfo=alarms.ioss[ios].cards[card].channels[channel];
	  //FIXME Let's do the same thing with the xl3s eventually also as the racks regarding disabled/enabled!
          if (channelInfo.type=="xl3"){
            $("#xl3s").css({"background-color":"red"});
            $("#crate"+channelInfo.id+"channelXL3_"+channelInfo.signal.charAt(0)).css({"background-color":"red"});
          }
          if (channelInfo.type=="rack" || channelInfo.type=="rack voltage"){
	    //Start by assuming the rack is off
            $("#rack"+channelInfo.id).css({"background-color":"gray"});
            $("#rack"+channelInfo.id+"channel"+channelInfo.signal).css({"background-color":"gray"});
	    //If the reason for being in the alarm list is not "off", set the boxes red and activate audio
            if (channelInfo.reason!="off"){
		$("#rack"+channelInfo.id).css({"background-color":"red"});
		$("#rack"+channelInfo.id+"channel"+channelInfo.signal).css({"background-color":"red"});
		$("#rackaudio").get(0).play();
		$("#rackaudiobutton").css({"color":"red"});
		$(".rackaudiobutton").css({"color":"red"});
            }

          }
          if (channelInfo.type=="timing rack"){
            //Same as racks; start by assuming the rack is just off
	    $("#timing").css({"background-color":"gray"});
            $("#rackTimingchannel"+channelInfo.signal).css({"background-color":"gray"});
            //Now, if the rack is in this list and not off, really throw the alarm
	    if (channelInfo.reason!="off"){
                $("#timing").css({"background-color":"red"});
		$("#rackTimingchannel"+channelInfo.signal).css({"background-color":"red"});
		$("#rackaudio").get(0).play();
		$("#rackaudiobutton").css({"color":"red"});
		$(".rackaudiobutton").css({"color":"red"});
	    }
          }

          if (channelInfo.type=="crate"){
            $("#crate"+channelInfo.id)
            .css({"background-color":"red"});
            $("#crate"+channelInfo.id+"channel"+channelInfo.signal).css({"background-color":"red"});
          }
          if (channelInfo.type=="Comp Coil"){
            $("#coils").css({"background-color":"red"});
            $("#coil"+channelInfo.id+"channel"+channelInfo.signal.charAt(0)).css({"background-color":"red"});
          }
          if (channelInfo.type=="HV Panic" || channelInfo.type=="UPS"){
            $("#EStopUPS").css({"background-color":"red"});
          }
          if (channelInfo.type=="UPS"){
            $("#otherMine").css({"background-color":"red"});
          }
	  if (channelInfo.type=="MTCD"){
            $("#otherMTCD").css({"background-color":"gray"});
            if (channelInfo.reason!="off"){
              $("#otherMTCD").css({"background-color":"red"});
              $("#rackaudio").get(0).play();
              $("#rackaudiobutton").css({"color":"red"});
	      $(".rackaudiobutton").css({"color":"red"});
           }
          }
          if (channelInfo.reason!="off"){
	      $("#alarmlist").append('<div>'+
		channelInfo.type + ' ' +
		channelInfo.id + ' ' +
		channelInfo.signal + ' ' +
		channelInfo.voltage + '</div>');
	  }
        }
      }
    }
    var numDeltavChannels = sizes.deltav.length;
    for (var field in alarms.deltav){
      for (var i=0; i<alarms.deltav[field].length; i++){
        for (var channel=0; channel<numDeltavChannels; channel++){
          if (sizes.deltav[channel].type==alarms.deltav[field][i].type && sizes.deltav[channel].id==alarms.deltav[field][i].id){
          $("#alarmlist").append('<div>'+
          alarms.deltav[field][i].type + ' ' +
          alarms.deltav[field][i].id + ' ' +
          alarms.deltav[field][i].signal + ' ' +
          alarms.deltav[field][i].value + '</div>');
          }
        }
      }
    }

    //Finally, if any timestamps on ioses or deltaV are too old, turn enabled boxes cyan
    if (Number($("#time_data_ios2").text()) > 35){
        $("#DetectorServer").css({"background-color":"cyan"});
        $("#IBoot3").css({"background-color":"cyan"});
    }

    for (var ios=0; ios<sizes.ioss.length-1; ios++){
      if (Number($("#time_data_ios"+(ios+1)).text()) > 35){
        for (var card=0; card<sizes.ioss[ios].cards.length; card++){
          for (var channel=0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
            $("#present_ios"+ios+"card"+card+"channel"+channel).css({"color":"cyan"});
            if (sizes.ioss[ios].cards[card].channels[channel].type=="xl3"){
              $("#xl3s").css({"background-color":"cyan"});
              $("#crate"+sizes.ioss[ios].cards[card].channels[channel].id+"channelXL3_"+sizes.ioss[ios].cards[card].channels[channel].signal.charAt(0)).css({"background-color":"cyan"});
            }
            if (sizes.ioss[ios].cards[card].channels[channel].type=="rack"){
              $("#rack"+sizes.ioss[ios].cards[card].channels[channel].id)
              .css({"background-color":"cyan"});
              $("#rack"+sizes.ioss[ios].cards[card].channels[channel].id+"channel"+sizes.ioss[ios].cards[card].channels[channel].signal).css({"background-color":"cyan"});
           }
            if (sizes.ioss[ios].cards[card].channels[channel].type=="timing rack"){
              $("#timing").css({"background-color":"cyan"});
              $("#rackTimingchannel"+sizes.ioss[ios].cards[card].channels[channel].signal).css({"background-color":"cyan"});
            }
            if (sizes.ioss[ios].cards[card].channels[channel].type=="crate"){
              $("#crate"+sizes.ioss[ios].cards[card].channels[channel].id)
              .css({"background-color":"cyan"});
              $("#crate"+sizes.ioss[ios].cards[card].channels[channel].id+"channel"+sizes.ioss[ios].cards[card].channels[channel].signal).css({"background-color":"cyan"});
            }
            if (sizes.ioss[ios].cards[card].channels[channel].type=="Comp Coil"){
              $("#coils").css({"background-color":"cyan"});
              $("#coil"+sizes.ioss[ios].cards[card].channels[channel].id+"channel"+sizes.ioss[ios].cards[card].channels[channel].signal.charAt(0)).css({"background-color":"cyan"});
            }
            if (sizes.ioss[ios].cards[card].channels[channel].type=="HV Panic" || sizes.ioss[ios].cards[card].channels[channel].type=="UPS"){
              $("#EStopUPS").css({"background-color":"cyan"});
            }
          }
        }
      }
    }

    for (var channel=0; channel<sizes.deltav.length; channel++){
      if(Number($("#time_data_deltav").text()) > 450){
        $("#present_deltav"+channel).css({"color":"cyan"});
        $("#"+sizes.deltav[channel].type+sizes.deltav[channel].id).css({"background-color":"cyan"});
      }
    }

  }

  var EmergencyRackShutdownCheck=function(){
    for (var ios=0; ios<sizes.ioss.length-1; ios++){
      for (var card=0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel=0; channel<alarms.ioss[ios].cards[card].channels.length; channel++){
	      channelInfo=alarms.ioss[ios].cards[card].channels[channel];
	      if (channelInfo.type=="rack" || channelInfo.type=="rack voltage"){
                  if (channelInfo.reason=="action"){
	              window.alert("Testing... no actual shutdown now.  WARNING:  Rack" + channelInfo.id + " voltage " + channelInfo.signal + " Has gone beyond it's hihi or lolo limits.  A 5 minute timer has begun as of (have webpage insert time).  Either correct the rack voltage or disable the alarm in the threhsolds page to prevent automatic rack shutdown.");
	          }   
              }
              if (channelInfo.type=="timing rack"){
	          if (channelInfo.reason=="action"){
	              window.alert("Testing...no actual shutdown now.  WARNING:  The Timing Rack voltage " + channelInfo.signal + " Has gone beyond it's hihi or lolo limits.  A 5 minute timer has begun as of (have webpage insert time).  Either correct the rack voltage or disable the alarm in the threhsolds page to prevent automatic rack shutdown.");
	          }
              } 
        }
      }
    }
  }

  var poll=function(polling, seq){
    if (polling){
      if (seq){
        $.getJSON(path+"/slowcontrol-alarms/_changes?feed=longpoll&since="+seq,function(result){
          if (JSON.stringify(result.last_seq)==JSON.stringify(seq)){ //last_seq[0] on couch >1.0
            poll(polling,seq);
          } else {
            sequence=JSON.stringify(result.last_seq);
            setAlarms();
            poll(polling,sequence);
          }
        });
      } else {
        $.getJSON(path+"/slowcontrol-alarms/_changes?descending=true&limit=1",function(result){
          sequence=JSON.stringify(result.results[0].seq);
          setAlarms();
          poll(polling,sequence);
        });
      }
    }
  }

  var setAlarms=function(){
    var views=[];
    var results=[];
    for (var i=0; i<recents.length; i++){
      views.push(
        $.getJSON(path+alarmdb+recents[i]+options,function(result){
          //collects the results but in whatever order they arrive
          results.push(result.rows[0].value); 
        })
      )
    }
    views.push(
      $.getJSON(path+alarmdb+"/_view/pi_db"+options,function(result){
        deltavresult=result.rows[0].value;
      })
    );
    //pulls all views simultaneously
    var hardToReadAlarms=[];
    $.when.apply($, views)
    .then(function(){
      for (var i=0; i<sizes.ioss.length-1; i++){
        //arranges the results
        resultpos=$.grep(results, function(e,f){return e.ios == i+1;});
        hardToReadAlarms.push(resultpos[0]);
      }
      hardToReadAlarms.deltav=deltavresult;
      alarms=arrangeAlarmsLikeChanneldb(hardToReadAlarms);
      formatAll();
      $("#rackaudio").get(0).pause();
      //EmergencyRackShutdownCheck();
      $("#time_alarm_deltav").text(Math.round(Date.now()/1000)-alarms.deltav.timestamp);
      for (var ios=0; ios<sizes.ioss.length-1; ios++){
        $("#time_alarm_ios"+(ios+1)).text(Math.round(Date.now()/1000)-hardToReadAlarms[ios].timestamp);
      }
    });
  };
 

  var arrangeAlarmsLikeChanneldb = function(hardToReadAlarms){
    var arrangedAlarms={
      "ioss":[],
      "deltav":[],
      "detserver":[],
      "iboot3":[]
    };
    for (var ios=0; ios<sizes.ioss.length-1; ios++){
      arrangedAlarms.ioss.push({"cards":[],"ios":sizes.ioss[ios].ios});
      if (hardToReadAlarms[ios].DetectorServer_Conn !== undefined ) {
        arrangedAlarms.detserver.push({"connStatus":hardToReadAlarms[ios].DetectorServer_Conn});
      }
      if (hardToReadAlarms[ios].IBoot3Power !== undefined ) {
        arrangedAlarms.iboot3.push({"iboot3pwr":hardToReadAlarms[ios].IBoot3Power});
      }
      for (var card=0; card<sizes.ioss[ios].cards.length; card++){
        arrangedAlarms.ioss[ios].cards[card]={
          "channels":hardToReadAlarms[ios][sizes.ioss[ios].cards[card].card],
          "card":sizes.ioss[ios].cards[card].card
        }
      }
    }
    arrangedAlarms.deltav=hardToReadAlarms.deltav;
    return arrangedAlarms
  }

    
 
  $("#fillPresentThresholds").click(function(){
    retrievePresentThresholds(true);
  });
  $("#fillApprovedThresholds").click(function(){
    retrieveApprovedThresholds(true);
  });

    $("#showPresentThresholds").change(function(){
        if($(this).is(":checked")){
	    retrievePresentThresholds(false);
	    $(".present").css({"display":"block"});
        }else{
            $(".present").css({"display":"none"});  
        };
    });

    $("#showApprovedThresholds").change(function(){
        if($(this).is(":checked")){
	    retrieveApprovedThresholds(false);
	    $(".approved").css({"display":"block"});
        }else{
            $(".approved").css({"display":"none"});  
        };
    });
/*    
  $("#showApprovedThresholds").click(function(){
      if (counter2) {
	  retrieveApprovedThresholds(false);
	  $(".approved").css({"display":"block"});
	  $("#showApprovedThresholds").css({'color':'forestgreen'});
	  counter2=false;
      } else {
	  $(".approved").css({"display":"none"});
	  $("#showApprovedThresholds").css({'color':''});
	  counter2=true;
      };
  });*/

    
    $("#selectChannels").click(function(){
	$(".notUnused").css({"display":"none"});
	var selected=$("#chooseChannels").val();
	$("#enableChannels").prop("disabled", false);
	$("#disableChannels").prop("disabled", false);
	if (selected=='alarms'){
	    $(".notUnused").css({"display":"block"});
	    $(".notAlarmed").css({"display":"none"});
	    $("#enableChannels").prop("disabled", true);
	    $("#disableChannels").prop("disabled", true);
	} else if (selected=='allChannels') {
	    $(".notUnused").css({"display":"block"});
	    $("#enableChannels").prop("disabled", true);
	    $("#disableChannels").prop("disabled", true);
	} else if (selected=='timingrack') {
	    $(".type"+selected).css({"display":"block"});
	    $(".typeMTCD").css({"display":"block"});
	} else {
	    $(".type"+selected).css({"display":"block"});
	}
    });

    $("#enableChannels").click(function(){
	var selected=$("#chooseChannels").val();
	$("."+selected).prop("checked", true);
    });

    $("#disableChannels").click(function(){
	var selected=$("#chooseChannels").val();
	$("."+selected).prop("checked", false);
    });

//  $("#refreshPresent").click(function(){
//    retrievePresentValues();
//  });

  $("#saveThresholds").click(function(){
    $("#statustext").text("Saving.");
    $(".present").css({"display":"none"});
    $(".approved").css({"display":"none"});
    filledThresholdData=sizes;
    for (var ios=0; ios<sizes.ioss.length; ios++){
      for (var card=0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel=0; channel<sizes.ioss[ios].cards[card].channels.length; 
        channel++){
          var channelid = "_ios"+ios+"card"+card+"channel"+channel;
          if (sizes.ioss[ios].cards[card].channels[channel].lolo!=null){
            filledThresholdData.ioss[ios].cards[card].channels[channel].lolo=
            parseFloat($("#lolo"+channelid).val());
            filledThresholdData.ioss[ios].cards[card].channels[channel].lo=
            parseFloat($("#lo"+channelid).val());
            filledThresholdData.ioss[ios].cards[card].channels[channel].hi=
            parseFloat($("#hi"+channelid).val());
            filledThresholdData.ioss[ios].cards[card].channels[channel].hihi=
            parseFloat($("#hihi"+channelid).val());
          }
          if (sizes.ioss[ios].cards[card].channels[channel].isEnabled!=null){
            if ($("#isEnabled"+channelid).prop("checked")){
              filledThresholdData.ioss[ios].cards[card].channels[channel].isEnabled=1;
            } else {
              filledThresholdData.ioss[ios].cards[card].channels[channel].isEnabled=0;
            }
          }
        }
      }
    }
    for (var channel=0; channel<sizes.deltav.length; channel++){
//      var channelid = "_deltav"+sizes.deltav[channel].type+sizes.deltav[channel].id;
//      channelid = channelid.replace(/\s/g, "_");
      var channelid = "_deltav"+channel;
      if (sizes.deltav[channel].multiplier!=null){
        filledThresholdData.deltav[channel].lolo=parseFloat($("#lolo"+channelid).val());
        filledThresholdData.deltav[channel].lo=parseFloat($("#lo"+channelid).val());
        filledThresholdData.deltav[channel].hi=parseFloat($("#hi"+channelid).val());
        filledThresholdData.deltav[channel].hihi=parseFloat($("#hihi"+channelid).val());
      }
      if (sizes.deltav[channel].isEnabled!=null){
        if ($("#isEnabled"+channelid).prop("checked")){
          filledThresholdData.deltav[channel].isEnabled=1;
        } else {
          filledThresholdData.deltav[channel].isEnabled=0;
        }
      }
    }
      $.get("http://ipinfo.io", function(response) {
	  filledThresholdData.ip_address = response;
      }, "jsonp");
    //filledThresholdData.ip_address = ip_address
    filledThresholdData.timestamp = presentData.ioss[0].timestamp
    filledThresholdData.sudbury_time = presentData.ioss[0].sudbury_time
    filledThresholdData.submitter = $("#name-text").val()
    filledThresholdData.reason = $("#reason-text").val()
    filledThresholdData.approved = $("#approved").prop("checked");    
    $("#statustext").text("Saving..");
    $.getJSON(path+"/_uuids?count=1", function(result){
      $("#statustext").text("Saving...");
      filledThresholdData._id=result.uuids[0]; 
      delete filledThresholdData._rev;
      app.db.saveDoc(filledThresholdData, {
        success : function(resp) {
          $("#statustext").text("Saved as "+result.uuids[0]+" by "+$("#name-text").val()+" for reason: "+$("#reason-text").val());
          //formatAll(alarms);    //originally like this; but formatAll
                                  //doesn't take an argument...
          formatAll();
          alert("Save successful");
	  $("#popupSave").popup("close");  
        },
        error : function(resp, textstatus, message) {
          $("#statustext").text("Save failed: "+message);
          alert("Save failed: "+message);
        }
      });
    });
  });

  $("#everything").keydown(function(){
    approval=false;
    $("#approved").prop("checked",false);
  });
  $("#everything").click(function(){
    approval=false;
    $("#approved").prop("checked",false);
  });
  
  $("#rackaudiobutton").click(function(){
    if (rackAudioOn==true){
      rackAudioOn=false;
      $("#rackaudiobutton").css('color', '');
      $(".rackaudiobutton").css('color', '');
      $("#rackaudiobutton").text("Rack Audio Alarm Off");
      $(".rackaudiobutton").text("Rack Audio Alarm Off");
      $("#rackaudio").get(0).muted=true;
    }
    else{
      rackAudioOn=true;
      $("#rackaudiobutton").text("Rack Audio Alarm On");
      $(".rackaudiobutton").text("Rack Audio Alarm On");
      $("#rackaudio").get(0).muted=false;
    }
  });

  $(".rackaudiobutton").click(function(){
    if (rackAudioOn==true){
      rackAudioOn=false;
      $("#rackaudiobutton").css('color', '');
      $(".rackaudiobutton").css('color', '');
      $("#rackaudiobutton").text("Rack Audio Alarm Off");
      $(".rackaudiobutton").text("Rack Audio Alarm Off");
      $("#rackaudio").get(0).muted=true;
    }
    else{
      rackAudioOn=true;
      $("#rackaudiobutton").text("Rack Audio Alarm On");
      $(".rackaudiobutton").text("Rack Audio Alarm On");
      $("#rackaudio").get(0).muted=false;
    }
  });

    
  $("#colorblindbutton").click(function(){
    if (colorblindModeOn==true){
      colorblindModeOn=false;
      $("#colorblindbutton").text("Color Blind Mode Off");
      setAlarms();
    }
    else {
      colorblindModeOn=true;
      $("#colorblindbutton").text("Color Blind Mode On");
      setAlarms();
    }
  });

  var waitCheck = function(amChecking){
    retrievePresentValues();
    if (amChecking){
      setTimeout(function(){
        retrievePresentValues();
        waitCheck(amChecking);
      },5000);
    }
  } 
  
/*  $.when(retrieveSizes())
  .then(function(){
    retrievePresentValues();
    poll(polling);
    retrievePresentThresholds(true);
    waitCheck(checking);
  });
*/
  retrieveSizes(function(){
    retrievePresentValues();
    poll(polling);
    retrievePresentThresholds(true);
    waitCheck(checking);
  });
//while(true){
//  setTimeout(function(){},5000);
//};
//alert("Hello")
});
