$.couch.app(function(app) {
    var charts=[];
    var names=[];
    var hTRDataDated=[];
    var eTRDataDated=[];
    var hardToReadData=[];
    var easyToReadData=[];
    var detailVoltages = [];
    var channelparameter = [];

    var graphdate = "Right Now";
    var graphdateold = "Right Now";
    var path="";
    var channeldb="/slowcontrol-channeldb/_design/slowcontrol/_view/recent";
    var fivesecdb="/slowcontrol-data-5sec/_design/slowcontrol-data-5sec";
    var onemindb="/slowcontrol-data-1min/_design/slowcontrol-data-1min";
    var fifteenmindb="/slowcontrol-data-15min/_design/slowcontrol-data-15min";  
    var options="?descending=true&limit=1";
    var docNumber = "000"
    var recents=["/_view/recent1","/_view/recent2","/_view/recent3","/_view/recent4"];
    var sizes={"ioss":[]};

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
	//pulls all views simultaneously
	hardToReadData={
	    "ioss":[],
	    "iosOnemin":[],
	    "iosFifteenmin":[],
	    "deltav":[]
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
		makeDataEasyToRead(hardToReadData, false);
		$("#graphstatus").text("Ready to make live plots!");
		$("#addplot").removeAttr("disabled");
		return true;
	    });
    };

    //FIXME: Here's where the current bug is.  Doesn't seem to like the startkey, endkey, etc.
    //but using starttimestamp and endtimestamp gets data, just the wrong thing.  Not sure what
    //the issue is yet.
    //Function: Grabs 1000 documents from before the input
    //timestamp.  
    var getDataDated = function(){
	$("#graphstatus").text("Loading data from date given, please wait...");
        var graphtimestart = Number(Date.parse(graphdate))/1000;
        var graphtimeend = graphtimestart + 3600; 
        var views=[];
        var keys=[];
        var ios5seckey = [];
        var deltavkey;
	var ios5secresults=[];
	var deltavresult;
        var gotdeltavkey;
        var knownstart = 1466441709;
        var knownend = 1466441697;
        var key="?key=";
        var skey="?startkey=";
        var ekey="&endkey=";
        var opts="&descending=true&limit=1";
        var got5seckey = [];

//So, I do in fact need to use the $.when(apply... stuff for the first call in the function as well.  Doing so makes the interpreter wait to run whatever's in the when section until it's given the variables it's promised.  

        //First, find the proper timestamps; this is demo code to make sure the query syntax is right
      	for (var i=0; i<recents.length; i++){
            got5seckey[i] = false;
            keys.push(
                $.getJSON(path+fivesecdb+recents[i]+skey+graphtimeend+ekey+graphtimestart+opts)).then(function(result){ios5seckey[i]=result.rows[0].key;});
/*	    }).error(function(error){
                console.log(error);
                $("#graphstatus").text("Error trying to pull data from CouchDB.  Check replication status.");
            });
*/
            if(ios5seckey[i] !== undefined){
                got5seckey[i] = true;
            } else {
                $("#graphstatus").text("No fivesecondDB data present on one of the IOSes for this hour.");
                ios5seckey[i] = 0;
                got5seckey[i] = false;                        
            }
        }

        gotdeltavkey = false;
        $.getJSON(path+onemindb+"/_view/pi_db"+skey+graphtimeend+ekey+graphtimestart+opts).success(function(result, txtstatus,jqxobj){
            if(result.rows[0] !== undefined){
                deltavkey = result.rows[0].key;
                gotdeltavkey = true;
            } else {
                $("#graphstatus").text("No PI_DB data during the hour specified.");
            }
	}).error(function(error){
            console.log(error);
            $("#graphstatus").text("Error trying to pull data from CouchDB.  Check replication status.");
        });
    
        //Now, use the found timestamps and push the data to views
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
	//pulls all views simultaneously
	hTRDataDated={
	    "ioss":[],
	    "deltav":[]
	};
	$.when.apply($, views)
	    .then(function(){
		for (var i=0; i<sizes.ioss.length-1; i++){
		    //arranges the results
		    resultpos=$.grep(ios5secresults, function(e,f){return e[0].value.ios == i+1;});
		    hTRDataDated.ioss[i]=resultpos[0];
		}
		hTRDataDated.deltav=deltavresult;
		makeDataEasyToRead(hTRDataDated, true);
		$("#graphstatus").text("Ready to make plots from date!");
		$("#addplot").removeAttr("disabled");
                graphdateold = graphdate;
		return true;
	    });
    };
 
    //Takes data in the CouchDB format and rearranges in a more
    //Usable format for the javascript code.
    var makeDataEasyToRead = function(hardToReadData, hasDate){
	var arrangedData={"ioss":[],"iosOnemin":[],"iosFifteenmin":[],"deltav":[]};
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
		var property = db_list[db]["property"]
		arranged[ios]={"cards":[],"ios":sizes.ioss[ios].ios};
		for (var card=0; card<sizes.ioss[ios].cards.length; card++){
		    cardName=sizes.ioss[ios].cards[card].card
		    arranged[ios].cards[card]={
			"channels":[],
			"card":cardName
		    };
                    try{
		        for (channel=0; channel<hard[ios][0].value[cardName][property].length; channel++){
			    arranged[ios].cards[card].channels[channel]={
			        "data":[]
		 	    };
		        }
		        for (var row=0; row<hard[ios].length; row++){
			    try{
			        for (channel=0; channel<arranged[ios].cards[card].channels.length; channel++){
			            arranged[ios].cards[card].channels[channel].data[row]=[hard[ios][row].key*1000,hard[ios][row].value[cardName][property][channel]];
			        }
			    }
			    catch(err){
			        // Bad row in your data, either from empty card names or bad channel entries.  Skip row and move on
			        //FIXME Make a better pop-up window here; the window alert freezes everything up.
                                //window.alert("WARNING: Bad data row reading from CouchDB.  IOS: " + ios + " card: " + cardName + " channel: " + channel + " Database: " + db_list[db]["name"] + " timestamp: " + hard[ios][row].key + "  Skipping row and continuing graphing, but check couchDB for data errors");
			        row++;
			    }
		        }
		    }
                    catch(err){
                        channel++;
                        $("#graphstatus").text("Empty values in " + property + " data acquisition.  Probably will not plot correctly.");
                    }
                }
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
		      } else {
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
	      useUTC : false //puts timestamp axis in local time
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
      } else {
	  if (graphdate == "Right Now") {
              charts[chartindex]={
                  "name": names[selected].name,
                  "type": names[selected].type,
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
                  "id": names[selected].id,
                  "date": graphdate,
                  "signal": names[selected].signal,
                  "channel": names[selected].channel,
                  "data": eTRDataDated.deltav[names[selected].channel].data.reverse()
	      }; 
	      createMasterD(chartindex);
          }
      }
  });

  $("#setPlotDate").click(function(){
    if($("#plotYear").val() == "Year" || $("plotMonth").val() == "Month" || $("#plotDay").val() == "" || $("#plotHour").val() == "" || parseInt($("#plotHour").val()) < 1 || parseInt($("#plotHour").val()) > 24 || parseInt($("#plotDay").val()) < 1 || parseInt($("#plotDay").val()) > 31 ){
      window.alert("Input date invalid; please choose a valid time to plot from.");
    }
    else if( (($.inArray($("#plotMonth").val(), ["Sep","Apr","Jun","Nov"]) > 0) && parseInt($("#plotDay").val()) > 30) || ($("#plotMonth").val() == "Feb" && parseInt($("#plotDay").val()) > 29)){
      window.alert("Input day invalid; check date and try again");
    }
    else {
      $("#graphingdate").text($("#plotDay").val() + " " + $("#plotMonth").val() + " " + $("#plotYear").val() + " " + $("#plotHour").val() + ":00:00 GMT");
      graphdate=$("#graphingdate").text();
      getDataDated();
    }
  });

  $("#setPlotNow").click(function(){
      $("#graphingdate").text("Right Now");
      graphdate=$("#graphingdate").text();
      $("#graphstatus").text("Ready to make live plots!");
  });

  retrieveSizes(function(){
    $("#addplot").attr("disabled","disabled");
//  Clear voltages and make names in the callback 
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
        "type": sizes.deltav[channel].type,
        "id": sizes.deltav[channel].id,
        "signal": sizes.deltav[channel].signal, 
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

