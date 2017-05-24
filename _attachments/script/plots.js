$.couch.app(function(app) {
    var charts=[];
    var names=[];
    var hTRDataDated=[];
    var eTRDataDated=[];
    var hardToReadData=[];
    var easyToReadData=[];
    var sizes={"ioss":[]};

    var graphdate = "Right Now";
    var graphdateold = "Right Now";
    var path="";
    var channeldb="/slowcontrol-channeldb/_design/slowcontrol/_view/recent";
    var fivesecdb="/slowcontrol-data-5sec/_design/slowcontrol-data-5sec";
    var onemindb="/slowcontrol-data-1min/_design/slowcontrol-data-1min";
    var ctempdb="/slowcontrol-data-cavitytemps/_design/slowcontrol-data-cavitytemps";
    var ctview="/_view/by_timestamp";
    var fifteenmindb="/slowcontrol-data-15min/_design/slowcontrol-data-15min";  
    var options="?descending=true&limit=1";
    var docNumber = "000"
    var key="?key=";
    var skey="?startkey=";
    var ekey="&endkey=";
    var opts="&descending=true&limit=1";
    var recents=["/_view/recent1","/_view/recent2","/_view/recent3","/_view/recent4"];


    var retrieveSizes = function(callback){
	$.getJSON(path+channeldb+options,function(result){
	    sizes=result.rows[0].value;
	    if(callback){
		callback();
	    }
	});
    };

    //Function: Grabs the 1000 most recent documents from the IOSes and
    //DeltaV and puts them in the easyToReadData object. 
    var getData = function(){
	$("#graphstatus").text("Loading data, please wait...");
	var views=[];
	var ios5secresults=[];
	var ios1minresults=[];
	var ios15minresults=[];
	var deltavresult;
    var ctempresult;
	for (var i=0; i<recents.length; i++){
	    views.push(
		$.getJSON(path+fivesecdb+recents[i]+options+docNumber,function(result){
		    //collects the results but in whatever order they arrive
		    ios5secresults.push(result.rows);
		})
	    );
	    views.push(
		$.getJSON(path+onemindb+recents[i]+options+docNumber,function(result){
		    //collects the results but in whatever order they arrive
		    ios1minresults.push(result.rows);
		})
	    );
	    views.push(
		$.getJSON(path+fifteenmindb+recents[i]+options+docNumber,function(result){
		    //collects the results but in whatever order they arrive
		    ios15minresults.push(result.rows);
		})
	    );
	}
	views.push(
	    $.getJSON(path+onemindb+"/_view/pi_db"+options+docNumber,function(result){
		deltavresult=result.rows;
	    })
	);
	views.push(
	    $.getJSON(path+ctempdb+ctview+options+docNumber,function(result){
		ctempresult=result.rows;
	    })
	);
	//pulls all views simultaneously
	hardToReadData={
	    "ioss":[],
	    "iosOnemin":[],
	    "iosFifteenmin":[],
	    "deltav":[],
        "temp_sensors":[]
	};
	$.when.apply($, views)
	    .then(function(){
		for (var i=0; i<sizes.ioss.length-1; i++){
		    //arranges the results
		    resultpos=$.grep(ios5secresults, function(e,f){return e[0].value.ios == i+1;});
		    hardToReadData.ioss[i]=resultpos[0];
		    resultpos=$.grep(ios1minresults, function(e,f){return e[0].value.ios == i+1;});
		    hardToReadData.iosOnemin[i]=resultpos[0];
		    resultpos=$.grep(ios15minresults, function(e,f){return e[0].value.ios == i+1;});
		    hardToReadData.iosFifteenmin[i]=resultpos[0];
		}
		hardToReadData.deltav=deltavresult;
		hardToReadData.temp_sensors=ctempresult;
    	makeDataEasyToRead(hardToReadData, false);
		$("#graphstatus").text("Ready to make live plots!");
		$("#addplot").removeAttr("disabled");
		return true;
	    });
    };

    //Function: Grabs 1000 documents from before the input
    //timestamp.  
    var getDataDated = function(){
	$("#graphstatus").text("Loading data from date given, please wait...");
        var graphtimestart = Number(Date.parse(graphdate))/1000;
        var views=[];
        var keys=[];
        var ios5seckey = [];
        var ios5seckeygrab = [];
        var deltavkey;
        var deltavkeygrab;
        var keygrabpos=[];
        var ios5secresults=[];
	    var deltavresult;

        //For each IOS, find a database entry near the proper timestamp
      	for (var i=0; i<recents.length; i++){
            keys.push(
                $.getJSON(path+fivesecdb+recents[i]+skey+graphtimestart+opts,function(result){
                    ios5seckeygrab.push(result.rows);
                })
            );
        }

        keys.push(
            $.getJSON(path+onemindb+"/_view/pi_db"+skey+graphtimestart+opts, function(result){
                deltavkeygrab = result.rows[0].key;
            })
       );

        keys.push(
            $.getJSON(path+ctempdb+ctview+skey+graphtimestart+opts, function(result){
                ctempkeygrab = result.rows[0].key;
            })
       );
        //Now, push all of the key grab results simultaneously.  Now that keys
        //Are grabbed, also pull the 1000 DB entries before that timestamp.
	$.when.apply($, keys)
	    .then(function(){
		for (var i=0; i<sizes.ioss.length-1; i++){
		    //arranges the results by IOS no.
		    keygrabpos=$.grep(ios5seckeygrab, function(e,f){return e[0].value.ios == i+1;});
                    ios5seckey[i]=keygrabpos[0][0].key;
                    if(Math.abs(ios5seckey[i] - graphtimestart) > 3600){
                        $("#graphnotice").text("WARNING: Data from IOS " + (i + 1) + " is further than an hour from your requested time.  Check database for missing data.");
                    } else {
                        $("#graphnotice").text("");
                    }
		}
		deltavkey=deltavkeygrab;
                if(Math.abs(deltavkey - graphtimestart) > 3600){
                    $("#graphnotice").text("WARNING: Data from PI Database is further than an hour from your requested time.  Check database for missing data.");
                } else {
                    $("#graphnotice").text("");
                }

        ctempkey=ctempkeygrab;
                if(Math.abs(ctempkey - graphtimestart) > 3600){
                    $("#graphnotice").text("WARNING: Data from PI Database is further than an hour from your requested time.  Check database for missing data.");
                } else {
                    $("#graphnotice").text("");
                }
 

            //Use the found timestamps to get DB entries
	    for (var i=0; i<recents.length; i++){
	        views.push(
	  	    $.getJSON(path+fivesecdb+recents[i]+skey+ios5seckey[i]+opts+docNumber,function(result){
		        //collects the results but in whatever order they arrive
		        ios5secresults.push(result.rows);
		    })
	        );
	    }
	    views.push(
	        $.getJSON(path+onemindb+"/_view/pi_db"+skey+deltavkey+opts+docNumber,function(result){
		    deltavresult=result.rows;
	        })
	    );

        views.push(
	        $.getJSON(path+ctempdb+ctview+skey+ctempkey+opts+docNumber,function(result){
		    ctempresult=result.rows;
	        })
	    );
	    //Once all queries are complete, arranges the views and then
            //Uses MakeDataEasytoRead to rearrange DB entries
	    hTRDataDated={
	        "ioss":[],
	        "deltav":[],
            "temp_sensors":[]
	    };
	    $.when.apply($, views)
	        .then(function(){
		    for (var i=0; i<sizes.ioss.length-1; i++){
		        //arranges the results
		        resultpos=$.grep(ios5secresults, function(e,f){return e[0].value.ios == i+1;});
		        hTRDataDated.ioss[i]=resultpos[0];
		    }
		    hTRDataDated.deltav=deltavresult;
            hTRDataDated.temp_sensors=ctempresult;
		    makeDataEasyToRead(hTRDataDated, true);
		    $("#graphstatus").text("Ready to make plots from date!");
		    $("#addplot").removeAttr("disabled");
                    graphdateold = graphdate;
		    return true;
	        });
        });
    };
 
    //Takes data in the CouchDB format and rearranges in a more
    //Usable format for the javascript code.
    var makeDataEasyToRead = function(hardToReadData, hasDate){
	var arrangedData={"ioss":[],"iosOnemin":[],"iosFifteenmin":[],"deltav":[],"temp_sensors":[]};
	if(hasDate == false) {
        var db_list=[{"name":"ioss","property":"voltages"},{"name":"iosOnemin","property":"average"},{"name":"iosFifteenmin","property":"average"}];
	} else {
        var db_list=[{"name":"ioss","property":"voltages"}];
    }
    var cardName="";
	for (var db=0; db<db_list.length; db++){
	    for (var ios=0; ios<sizes.ioss.length-1; ios++){
		var arranged = arrangedData[db_list[db]["name"]];
		var hard = hardToReadData[db_list[db]["name"]];
		var property = db_list[db]["property"];
		arranged[ios]={"cards":[],"ios":sizes.ioss[ios].ios};
		for (var card=0; card<sizes.ioss[ios].cards.length; card++){
		    cardName=sizes.ioss[ios].cards[card].card
		    arranged[ios].cards[card]={
			"channels":[],
			"card":cardName
		    };
                    try{
		        for (channel=0; channel<hard[ios][0].value[cardName][property].length; channel++){
			    arranged[ios].cards[card].channels[channel]={"data":[]};
		        }
		        for (var row=0; row<hard[ios].length; row++){
			    try{
			        for (channel=0; channel<arranged[ios].cards[card].channels.length; channel++){
			            arranged[ios].cards[card].channels[channel].data[row]=[hard[ios][row].key*1000,hard[ios][row].value[cardName][property][channel]];
			        }
			    }
			    catch(err){
			        // Bad row in your data, either from empty card names or bad channel entries.  Skip row and move on
		            row++;
			    }
		        }
		    }
                    catch(err){
                        channel++;
                        $("#graphstatus").text("Empty values in " + property + " data acquisition.  No data may be present for range graphed.  Check DB.");
                    }
                }
	    }
	}

	for (var channel=0; channel<sizes.temp_sensors.length; channel++){
	    arrangedData.temp_sensors[channel]={"data":[]};
	    temp_sensorsid=sizes.temp_sensors[channel].id;
            try{
 	            if (hardToReadData.temp_sensors[0]){
		            for (var row=0; row<hardToReadData.temp_sensors.length; row++){
                        var entry = "Sensor_"+String(temp_sensorsid);
		                if (hardToReadData.temp_sensors[0].entry!="N/A"){
	                        arrangedData.temp_sensors[channel].data.push([hardToReadData.temp_sensors[row].key*1000,hardToReadData.temp_sensors[row].value[entry]]);
		                }
		            } 
	            }
            }
            catch(err){
                $("#graphstatus").text("Error in pulling data for Cavity Temperature Data.  No data may be present for range.  Check database.");
            }
	}

	for (var channel=0; channel<sizes.deltav.length; channel++){
	    arrangedData.deltav[channel]={"data":[]};
	    cleanedtype=sizes.deltav[channel].type;
	    deltavid=sizes.deltav[channel].id-1;
            try{
 	        if (hardToReadData.deltav[0].value[cleanedtype].values[deltavid]){
		    for (var row=0; row<hardToReadData.deltav.length; row++){
		        if (hardToReadData.deltav[row].value[cleanedtype].values[deltavid]!="N/A"){
	                    arrangedData.deltav[channel].data.push([hardToReadData.deltav[row].key*1000,hardToReadData.deltav[row].value[cleanedtype].values[deltavid]]);
		        }
		    } 
	        }
            }
            catch(err){
                $("#graphstatus").text("Error in pulling data for " + cleanedtype + "Data.  No data may be present for range.  Check database.");
            }
	}
        if(hasDate == false) {
	    easyToReadData=arrangedData;
        } else {
            eTRDataDated = arrangedData;
        }
    };
    
  // create the master chart and add a chart associated with the index given.
  //This function will also continue to update the chart's series with the most
  //recent database inputs.
  function createMaster(chartindex) {
      Highcharts.setOptions({
          global: {
	      useUTC : false //puts timestamp axis in local time
          }
      });
      $('#master-container'+chartindex).highcharts('StockChart', {	
	  chart : {
              events : {
                  load : function () {
		      if (charts[chartindex].ios) {
			  var cardlist = ["cardA", "cardB","cardC", "cardD"];
			  var ios = charts[chartindex].ios;
			  var card = cardlist[charts[chartindex].card];
			  var channel = charts[chartindex].channel;
			  var series = this.series[0];
			  var iosresults=[];
			  setInterval(function() {
			      //alert(JSON.stringify(data[data.length-1][0]))
			      var getting = $.getJSON(path+fivesecdb+recents[charts[chartindex].ios]+options,function(result){
				  iosresults = result.rows[0].value;
			      });
			      getting.done(function() {
				  var timestamp = iosresults.timestamp;
				  var value = iosresults[card]["voltages"][channel];
				  series.addPoint([timestamp*1000, value], true, true);
			      });
			  }, 5000);
		      } else if (charts[chartindex].deltav) {
			  var type = charts[chartindex].type
			  var channel = charts[chartindex].channel;
			  var series = this.series[0];
			  var deltavresults=[];
			  setInterval(function() {
			      var getting = $.getJSON(path+onemindb+"/_view/pi_db"+options,function(result){
				  deltavresults = result.rows[0].value;
			      });
			      getting.done(function() {
				  var timestamp = deltavresults.timestamp;
				  var value = deltavresults[type]["values"][channel];
				  if (value!=null) {
				      series.addPoint([timestamp*1000, value], true, true);
				  };
			      });
			  }, 5000);
              } else if (charts[chartindex].temp_sensors) {
			  var type = charts[chartindex].type
			  var channel = charts[chartindex].channel;
			  var series = this.series[0];
			  var ctempresults=[];
			  setInterval(function() {
			      var getting = $.getJSON(path+ctempdb+ctview+options,function(result){
				  ctempresults = result.rows[0].value;
			      });
			      getting.done(function() {
				  var timestamp = ctempresults.timestamp;
                  var entry = "Sensor_"+String(channel);
				  var value = ctempresults[entry];
				  if (value!=null) {
				      series.addPoint([timestamp*1000, value], true, true);
				  };
			      });
			  }, 5000);
              }
		  }
              }
          },
	  rangeSelector: {
              buttons: [{
                  count: 5,
                  type: 'minute',
                  text: '5m'
              }, {
                  count: 1,
                  type: 'hour',
                  text: '1hr'
              }, {
		  count: 6,
                  type: 'hour',
                  text: '6hr'
              }, {
                  type: 'all',
                  text: 'All'
              }],
              inputEnabled: false, //prevents date range input 
              selected: 1 //selects which button should be automatically pressed when the chart loads
          },
	  
        title : {
            text : charts[chartindex].name 
        },

        exporting: {
            enabled: true
        },

        series : [{
            name : 'Voltage',
	    data : charts[chartindex].data
        }]
    });
  };

  //Create the master chart and add a graph associated with the given chart index.
  //This function does not produce charts that update; instead, it just graphs the
  //data associated with whatever date is chosen by the user (this data is stored in
  //the eTRDataDated variables).
  function createMasterD(chartindex) {
      Highcharts.setOptions({
          global: {
	      useUTC : true //puts timestamp axis in local time
          }
      });
      $('#master-container'+chartindex).highcharts('StockChart', {	
	  /*chart : {
              events : {
                  load : function () {
                    var label = this.renderer.label(charts[chartindex].date, 100,120).add();
                    setTimeout(function () {
                        label.fadeout();
                    }, 3000);
		  }
              }
          },*/
	  rangeSelector: {
              buttons: [{
                  count: 5,
                  type: 'minute',
                  text: '5m'
              }, {
                  count: 1,
                  type: 'hour',
                  text: '1hr'
              }, {
		  count: 6,
                  type: 'hour',
                  text: '6hr'
              }, {
                  type: 'all',
                  text: 'All'
              }],
              inputEnabled: false, //prevents date range input 
              selected: 1 //selects which button should be automatically pressed when the chart loads
          },
	  
        title : {
            text : charts[chartindex].name + " , " + charts[chartindex].date
        },

        exporting: {
            enabled: true
        },

        series : [{
            name : 'Voltage',
	    data : charts[chartindex].data
        }]
    });
  };
						 

/*  Here begins the stuff that runs when the page loads  */
  $("#graphingdate").text("Right Now");
  graphdate=$("#graphingdate").text();

  $("#deleteplot").click(function(){
	var selected=$("#name_dropdown :selected").val();
	$("."+selected+"chart").css({"display":"none"});
  });

  //When the Add Plot button is pushed, a graph is added to the charts section with the specifics given by the user.
  //If a date aside from Right Now is input, the DB entries closest to the input date are graphed.
  $("#addplot").click(function(){
      var chartindex=charts.length;
      var selected=$("#name_dropdown :selected").val();
      $("#plots").append(
	  "<div class='chartcontainer "+selected+"chart' id='chart" + chartindex + "'>"
              + "<div class='masterchart' id='master-container"+chartindex+"'></div>"
	      + "<\/div>"
      );
      if (names[selected].ios!=null) {
          if (graphdate == "Right Now") {
              charts[chartindex]={
                  "ios":names[selected].ios,
                  "card":names[selected].card,
                  "channel":names[selected].channel,
                  "name":names[selected].name,
                  "date":graphdate,
                  "data":easyToReadData.ioss[names[selected].ios].cards[names[selected].card].channels[names[selected].channel].data.reverse(),
	          "dataOneMin":easyToReadData.iosOnemin[names[selected].ios].cards[names[selected].card].channels[names[selected].channel].data.reverse(),
	          "dataFifteenMin":easyToReadData.iosFifteenmin[names[selected].ios].cards[names[selected].card].channels[names[selected].channel].data.reverse()
	      };
              createMaster(chartindex);
          } else {
              charts[chartindex]={
                  "ios":names[selected].ios,
                  "card":names[selected].card,
                  "channel":names[selected].channel,
                  "name":names[selected].name,
                  "date":graphdate,
                  "data":eTRDataDated.ioss[names[selected].ios].cards[names[selected].card].channels[names[selected].channel].data.reverse(),
              };
              createMasterD(chartindex);
         }
      //If the dropdown selected is Deltav, make a chart with DeltaV properties
      } else if (names[selected].deltav!=null) {
	      if (graphdate == "Right Now") {
              charts[chartindex]={
                  "name": names[selected].name,
                  "type": names[selected].type,
                  "deltav": true,
                  "id": names[selected].id,
                  "date": graphdate,
                  "signal": names[selected].signal,
                  "channel": names[selected].channel,
                  "data": easyToReadData.deltav[names[selected].channel].data.reverse()
	          }; 
	          createMaster(chartindex);
          } else {
              charts[chartindex]={
                  "name": names[selected].name,
                  "type": names[selected].type,
                  "deltav": true,
                  "id": names[selected].id,
                  "date": graphdate,
                  "signal": names[selected].signal,
                  "channel": names[selected].channel,
                  "data": eTRDataDated.deltav[names[selected].channel].data.reverse()
	          }; 
	          createMasterD(chartindex);
          }
      } else if (names[selected].temp_sensors!=null) {
	      if (graphdate == "Right Now") {
              charts[chartindex]={
                  "name": names[selected].name,
                  "type": names[selected].type,
                  "temp_sensors": true,
                  "id": names[selected].id,
                  "date": graphdate,
                  "signal": names[selected].signal,
                  "channel": names[selected].channel,
                  "data": easyToReadData.temp_sensors[names[selected].channel].data.reverse()
	          }; 
	          createMaster(chartindex);
          } else {
              charts[chartindex]={
                  "name": names[selected].name,
                  "type": names[selected].type,
                  "temp_sensors": true,
                  "id": names[selected].id,
                  "date": graphdate,
                  "signal": names[selected].signal,
                  "channel": names[selected].channel,
                  "data": eTRDataDated.temp_sensors[names[selected].channel].data.reverse()
	          }; 
	          createMasterD(chartindex);
          }
      }
  });

  $("#setPlotDate").click(function(){
    var dayVal = Number($("#plotDay").val());
    var hourVal = Number($("#plotHour").val());
    if(dayVal !== parseInt(dayVal,10) || hourVal !== parseInt(hourVal,10)){
      window.alert("Please use integers for the day and hour entry.  Try again.");
    }
    else if($("#plotYear").val() == "Year" || $("plotMonth").val() == "Month" || $("#plotDay").val() == "" || $("#plotHour").val() == "" || parseInt($("#plotHour").val()) < 1 || parseInt($("#plotHour").val()) > 24 || parseInt($("#plotDay").val()) < 1 || parseInt($("#plotDay").val()) > 31 ){
      window.alert("Input date invalid; please choose a valid time to plot from.");
    }
    else if( (($.inArray($("#plotMonth").val(), ["Sep","Apr","Jun","Nov"]) > 0) && parseInt($("#plotDay").val()) > 30) || ($("#plotMonth").val() == "Feb" && parseInt($("#plotDay").val()) > 29)){
      window.alert("Input day invalid; check date and try again");
    }
    else {
      //use integer forms of the day and hour input; date parser won't work otherwise
      $("#graphingdate").text(dayVal + " " + $("#plotMonth").val() + " " + $("#plotYear").val() + " " + hourVal + ":00:00 UTC");
      graphdate=$("#graphingdate").text();
      getDataDated();
    }
  });

  $("#setPlotNow").click(function(){
      $("#graphingdate").text("Right Now");
      graphdate=$("#graphingdate").text();
      $("#graphnotice").text("");
      $("#graphstatus").text("Ready to make live plots!");
  });

  retrieveSizes(function(){
    $("#addplot").attr("disabled","disabled");

    //  Clear voltages and make names in the callback
    //  The names dictionary is pivotal to making charts!
    var nameindex=0;
    for (var ios = 0; ios<sizes.ioss.length-1; ios++){
      for (var card = 0; card<sizes.ioss[ios].cards.length; card++){
        for (var channel = 0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
          nameText="";
          if(sizes.ioss[ios].cards[card].channels[channel].type){
            nameText += " "+sizes.ioss[ios].cards[card].channels[channel].type;
          }
          if(sizes.ioss[ios].cards[card].channels[channel].id){
            nameText += sizes.ioss[ios].cards[card].channels[channel].id;
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
          nameindex++;
        }
      }
    }

    for (var channel = 0; channel<sizes.deltav.length; channel++){
      names[nameindex] = {
        "name": ""+sizes.deltav[channel].type+" "+sizes.deltav[channel].id+" "+sizes.deltav[channel].signal+ " ("+sizes.deltav[channel].unit+")",
        "deltav": true,
        "type": sizes.deltav[channel].type,
        "id": sizes.deltav[channel].id,
        "signal": sizes.deltav[channel].signal, 
        "channel": channel
      };
      nameindex++;
    }

    for (var channel = 0; channel<sizes.temp_sensors.length; channel++){
      names[nameindex] = {
        "name": ""+sizes.temp_sensors[channel].type+" "+sizes.temp_sensors[channel].id+" "+sizes.temp_sensors[channel].signal+ " ("+sizes.temp_sensors[channel].unit+")",
        "temp_sensors": true,
        "type": sizes.temp_sensors[channel].type,
        "id": sizes.temp_sensors[channel].id,
        "signal": sizes.temp_sensors[channel].signal, 
        "channel": channel
      };
      nameindex++;
    }
    if(graphdate != "Right Now" && graphdate != graphdateold) {
        getDataDated();
    }
    if(graphdate == "Right Now") {
        getData();
    }
      
  });
});

