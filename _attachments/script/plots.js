$.couch.app(function(app) {
    var charts=[];
    var names=[];
    var hardToReadData=[];
    var easyToReadData=[];
    var detailVoltages = [];
    var channelparameter = [];

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
    

    var getData = function(){
	$("#graphstatus").text("Loading Data...Please wait.");
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
		makeDataEasyToRead(hardToReadData);
		$("#graphstatus").text("Ready to make plots!");
		$("#addplot").removeAttr("disabled");
		return true;
	    });
    };
    
    
    var makeDataEasyToRead = function(hardToReadData){
	var arrangedData={"ioss":[],"iosOnemin":[],"iosFifteenmin":[],"deltav":[]};
	var db_list=[{"name":"ioss","property":"voltages"},{"name":"iosOnemin","property":"average"},{"name":"iosFifteenmin","property":"average"}];
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
			    window.alert("WARNING: Bad data row reading from CouchDB.  IOS: " + ios + " card: " + cardName + " channel: " + channel + " Database: " + db_list[db]["name"] + " timestamp: " + hard[ios][row].key + "  Skipping row and continuing graphing, but check couchDB for data errors");
			    row++;
			}
		    }
		}
	    }
	}
	/*		for (var ios=0; ios<sizes.ioss.length-1; ios++){
	    arrangedData.ioss[ios]={"cards":[],"ios":sizes.ioss[ios].ios};
	    for (var card=0; card<sizes.ioss[ios].cards.length; card++){
		cardName=sizes.ioss[ios].cards[card].card
		arrangedData.ioss[ios].cards[card]={
		    "channels":[],
		    "card":cardName
		};
		for (channel=0; channel<hardToReadData.ioss[ios][0].value[cardName].voltages.length; channel++){
		    arrangedData.ioss[ios].cards[card].channels[channel]={
			"data":[]
		    };
		}
		for (var row=0; row<hardToReadData.ioss[ios].length; row++){
		    for (channel=0; channel<arrangedData.ioss[ios].cards[card].channels.length; channel++){
			arrangedData.ioss[ios].cards[card].channels[channel].data[row]=[hardToReadData.ioss[ios][row].key*1000,hardToReadData.ioss[ios][row].value[cardName].voltages[channel]];
		    }
		}
	    }
	}
	for (var ios=0; ios<sizes.ioss.length-1; ios++){
	    arrangedData.iosOnemin[ios]={"cards":[],"ios":sizes.ioss[ios].ios};
	    for (var card=0; card<sizes.ioss[ios].cards.length; card++){
		cardName=sizes.ioss[ios].cards[card].card
		arrangedData.iosOnemin[ios].cards[card]={
		    "channels":[],
		    "card":cardName
		};
		for (channel=0; channel<hardToReadData.iosOnemin[ios][0].value[cardName].average.length; channel++){
		    arrangedData.iosOnemin[ios].cards[card].channels[channel]={
			"data":[]
		    };
		}
		for (var row=0; row<hardToReadData.iosOnemin[ios].length; row++){
		    for (channel=0; channel<arrangedData.iosOnemin[ios].cards[card].channels.length; channel++){
			try {
			    arrangedData.iosOnemin[ios].cards[card].channels[channel].data[row]=[hardToReadData.iosOnemin[ios][row].key*1000,hardToReadData.iosOnemin[ios][row].value[cardName].average[channel]];
			} catch(err) {
			    //alert(JSON.stringify(hardToReadData.iosOnemin[ios][row]));
			    arrangedData.iosOnemin[ios].cards[card].channels[channel].data[row]=[hardToReadData.iosOnemin[ios][row].key*1000,0];
			}
		    }
		}
	    }
	}*/
	for (var channel=0; channel<sizes.deltav.length; channel++){
	    arrangedData.deltav[channel]={"data":[]};
	    cleanedtype=sizes.deltav[channel].type;
	    deltavid=sizes.deltav[channel].id-1;
	    if (hardToReadData.deltav[0].value[cleanedtype].values[deltavid]){
		for (var row=0; row<hardToReadData.deltav.length; row++){
		    if (hardToReadData.deltav[row].value[cleanedtype].values[deltavid]!="N/A"){
	      arrangedData.deltav[channel].data.push([hardToReadData.deltav[row].key*1000,hardToReadData.deltav[row].value[cleanedtype].values[deltavid]]);
		    }
		}
	    }
	}
	easyToReadData=arrangedData;
    };
    
    // create the master chart
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
							 

/*  Here begins the stuff that runs when the page loads  */

    $("#deleteplot").click(function(){
	var selected=$("#name_dropdown :selected").val();
	$("."+selected+"chart").css({"display":"none"});
//	$("#graphstatus").text(JSON.stringify(easyToReadData));
  });

  $("#addplot").click(function(){
      var chartindex=charts.length;
      var selected=$("#name_dropdown :selected").val();
      $("#plots").append(
	  "<div class='chartcontainer "+selected+"chart' id='chart" + chartindex + "'>"
              + "<div class='masterchart' id='master-container"+chartindex+"'></div>"
	      + "<\/div>"
      );
      if (names[selected].ios!=null) {
	  charts[chartindex]={
              "ios":names[selected].ios,
              "card":names[selected].card,
              "channel":names[selected].channel,
              "name":names[selected].name,
              "data":easyToReadData.ioss[names[selected].ios].cards[names[selected].card].channels[names[selected].channel].data.reverse(),
	      "dataOneMin":easyToReadData.iosOnemin[names[selected].ios].cards[names[selected].card].channels[names[selected].channel].data.reverse(),
	      "dataFifteenMin":easyToReadData.iosFifteenmin[names[selected].ios].cards[names[selected].card].channels[names[selected].channel].data.reverse()
	  };
	  createMaster(chartindex);
      } else {
	  charts[chartindex]={
              "name": names[selected].name,
              "type": names[selected].type,
              "id": names[selected].id,
              "signal": names[selected].signal,
              "channel": names[selected].channel,
              "data": easyToReadData.deltav[names[selected].channel].data.reverse()
	  };
	  createMaster(chartindex);
      }
  });

  retrieveSizes(function(){
    $("#addplot").attr("disabled","disabled");
//  Clear voltages and make names in the callback 
    var nameindex=0;
    for (var ios = 0; ios<sizes.ioss.length-1; ios++){
//      voltages.ioss.push({"cards":[]});
      for (var card = 0; card<sizes.ioss[ios].cards.length; card++){
//        voltages.ioss[ios].cards.push({"channels":[]});
        for (var channel = 0; channel<sizes.ioss[ios].cards[card].channels.length; channel++){
//          voltages.ioss[ios].cards[card].channels.push({});
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

    getData();
      
  });
});

