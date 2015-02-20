$.couch.app(function(app) {
  var charts=[];
  var names=[];
  var hardToReadData=[];
  var easyToReadData=[];
  var detailVoltages = [];
  var channelparameter = [];

  var path="";
  var channeldb="/slowcontrol-channeldb/_design/slowcontrol/_view/recent";
  var datadb="/slowcontrol-data-5sec/_design/slowcontrol-data-5sec";
  var onemindb="/slowcontrol-data-1min/_design/slowcontrol-data-1min";
  var options="?descending=true&limit=1";
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
    var iosresults=[];
    var deltavresult;
    for (var i=0; i<recents.length; i++){
      views.push(
        $.getJSON(path+datadb+recents[i]+options+"000",function(result){
          //collects the results but in whatever order they arrive
          iosresults.push(result.rows);
        })
      );
    }
    views.push(
      $.getJSON(path+onemindb+"/_view/pi_db"+options+"000",function(result){
        deltavresult=result.rows;
      })
    );
    //pulls all views simultaneously
    hardToReadData={
      "ioss":[],
      "deltav":[]
    };
    $.when.apply($, views)
    .then(function(){
      for (var i=0; i<sizes.ioss.length-1; i++){
        //arranges the results
        resultpos=$.grep(iosresults, function(e,f){return e[0].value.ios == i+1;});
        hardToReadData.ioss[i]=resultpos[0];
      }
      hardToReadData.deltav=deltavresult;
      makeDataEasyToRead(hardToReadData);
      $("#graphstatus").text("Ready to make plots!");
//      $("#graphstatus").text(JSON.stringify(names));
      $("#addplot").removeAttr("disabled");
      return true;
    });
  };


  var makeDataEasyToRead = function(hardToReadData){
    var arrangedData={"ioss":[],"deltav":[]};
    var cardName="";
    for (var ios=0; ios<sizes.ioss.length-1; ios++){
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
    for (var channel=0; channel<sizes.deltav.length; channel++){
      arrangedData.deltav[channel]={"data":[]};
      cleanedtype=sizes.deltav[channel].type;
      deltavid=sizes.deltav[channel].id-1;
      if (hardToReadData.deltav[0].value[cleanedtype].values[deltavid]){
        for (var row=0; row<hardToReadData.deltav.length; row++){
          if (hardToReadData.deltav[row].value[cleanedtype].values[deltavid]!="N/A"){
            arrangedData.deltav[channel].data[row]=[hardToReadData.deltav[row].key*1000,hardToReadData.deltav[row].value[cleanedtype].values[deltavid]];
          }
        }
      }
    }
    easyToReadData=arrangedData;
  };

   // create the master chart
  function createMaster(chartindex) {
//    masterChart.ioss[ios].cards[card].channels[channel]= new Highcharts.Chart({})
    charts[chartindex].masterChart = new Highcharts.Chart({
      chart: {
        renderTo: "master-container"+chartindex,
        reflow: false,
        borderWidth: 0,
        backgroundColor: null,
        marginLeft: 50,
        marginRight: 20,
        animation: false,
        zoomType: 'x',
        events: {                                                  
          // listen to the selection event on the master chart to update the 
          // extremes of the detail chart
          selection: function(event) {
            var extremesObject = event.xAxis[0];
            min = extremesObject.min;
            max = extremesObject.max;
            xAxis = this.xAxis[0];
            var starttime=Math.floor(min/1000.);
            var endtime=Math.floor(max/1000.);
            charts[chartindex].detailChart.xAxis[0].setExtremes(min, max);
            xAxis.removePlotBand('mask-before');
            xAxis.addPlotBand({
              id: 'mask-before',
              from: Date.UTC(2006, 0, 1),
              //from: event.xAxis[0].min,
              to: min,
              color: 'rgba(0, 0, 0, 0.2)'
            }),
                                                                        
            xAxis.removePlotBand('mask-after');
            xAxis.addPlotBand({
              id: 'mask-after',
              from: max,
              to: event.xAxis[0].max,
              to: Date.UTC(2020, 11, 31),
              color: 'rgba(0, 0, 0, 0.2)'
            });
            return false;
          }
        }
      },
      title: {
        text: null
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          hour: '%e%b %H:%M'
        },
        showLastTickLabel: true,
        //maxZoom: 14 * 24 * 3600000, // fourteen days
        //plotBands: [{
        //        id: 'mask-before',
        //        from: Date.UTC(2006, 0, 1),
        //        to: Date.UTC(2008, 7, 1),
        //        color: 'rgba(0, 0, 0, 0.2)'
        //}],
        title: {
          text: null
        }
      },
      yAxis: {
        gridLineWidth: 0,
        labels: {
          enabled: true
        },
        title: {
          text: null
        },
        //max: 5
        //min: 0.6,
        //showFirstLabel: false
      },
      tooltip: {
        formatter: function() {
          return false;
        }
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          animation: false,
          fillColor: {
            linearGradient: [0, 0, 0, 70],
            stops: [
              [0, '#4572A7'],
              [1, 'rgba(0,0,0,0)']
            ]
          },
          lineWidth: 1,
          marker: {
            enabled: false
          },
          shadow: false,
          states: {
            hover: {
              lineWidth: 1                                            
            }
          },
          enableMouseTracking: false
        }
      },
                                         
      series: [{
        type: 'area',
        name: 'Voltage', 
        //pointInterval: 24 * 3600 * 1000,
        //pointStart: Date.UTC(2006, 0, 01),
        data: charts[chartindex].data
      }],
                                              
      exporting: {
        enabled: false
      }
    }, 
    function() {
      createDetail(chartindex);
//      $("#graphstatus").text(JSON.stringify(charts[chartindex].masterChart));
    });
  }
                                
  // create the detail chart
  function createDetail(chartindex) {
    //console.log(ichart);
    // prepare the detail chart

//    var detailData = [];
//    jQuery.each(masterChart.series[0].data, function(i, point) {
      //if (point.x >= detailStart) {
//      detailData.push([point.x,point.y]);
      //}
//    });

    // create a detail chart referenced by a global variable
//    detailChart.ioss[ios].cards[card].channels[channel]= new Highcharts.Chart({})
    charts[chartindex].detailChart = new Highcharts.Chart({
      chart: {
        renderTo: 'detail-container'+chartindex,
        marginBottom: 120,
        animation: false,
        reflow: false,
        marginLeft: 50,
        marginRight: 20,
        style: {
          position: 'absolute'
        },
        zoomType: 'x',
        events: {                                                  
          // listen to the selection event on the detail chart to update the 
          // extremes of the detail chart
          selection: function(event) {
            var extremesObject = event.xAxis[0];
            min = extremesObject.min;
            max = extremesObject.max;
            xAxis = charts[chartindex].masterChart.xAxis[0];
//            var starttime=Math.floor(min/1000.);
//            var endtime=Math.floor(max/1000.);
            this.xAxis[0].setExtremes(min, max);
/*            var selectedview = selectView(starttime,endtime);
            var str="";
            $.getJSON(path+datadb+"/_view/recent1?startkey="+starttime+"&endkey="+endtime,function(result1){
              str=result1;

              for (var irow=0;irow<str.rows.length;++irow){
// FIXME cardA
                if (str.rows[irow].value.cardA.voltages[channel]!="NA"){
                  detailVoltages[chartindex].push([str.rows[irow].key*1000,str.rows[irow].value.cardA.voltages[channel]]);
                }
              }
*/
              // move the plot bands to reflect the new detail span
              xAxis.removePlotBand('mask-before');
              xAxis.addPlotBand({
                id: 'mask-before',
                from: Date.UTC(2006, 0, 1),
	        //from: event.xAxis[0].min,
                to: min,
                color: 'rgba(0, 0, 0, 0.2)'
              });
                                                                        
              xAxis.removePlotBand('mask-after');
              xAxis.addPlotBand({
                id: 'mask-after',
                from: max,
                to: event.xAxis[0].max,
                to: Date.UTC(2020, 11, 31),
                color: 'rgba(0, 0, 0, 0.2)'
              });
//              charts[chartindex].detailChart.series[0].setData(chartinfo.data);
//              charts[chartindex].detailChart.series[0].setData(detailVoltages[chartindex]);
//            }); matches to getJSON
            return false;
          }
        }
      },

      title: {
        text: null
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          hour: '%e%b %H:%M'
        },
        showLastTickLabel: true,
        //maxZoom: 14 * 24 * 3600000, // fourteen days
      },
      credits: {
        enabled: false
      },
      title: {
        text: charts[chartindex].name 
      },
      subtitle: {
        text: 'Zoom by dragging across either chart. X-axis is UTC.'
      },
      xAxis: {
        type: 'datetime'
      },
      yAxis: {
        title: null,
        //maxZoom: 0.1
      },
      tooltip: {
        formatter: function() {
          var point = this.points[0];
          return '<b>'+ point.series.name +'</b><br/>'+Highcharts.dateFormat('%A %B %e %H:%M:%S', this.x) + ':<br/>'+Highcharts.numberFormat(point.y, 3) +' V';
        },
        shared: true
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        series: {
          animation: false,
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: true,
                radius: 3
              }
            }
          }
        }
      },
      series: [{
        name: 'Voltage',
        // pointStart: detailStart,
        // pointInterval: 15 * 1000,
        data: charts[chartindex].data
      }],
                                                
      exporting: {
        enabled: true
      }
    });
  }

/*  For now, let's just set the view to be data-5sec  

   function selectView(starttime,endtime){
      var interval=(endtime-starttime)/1000.; 
      var selectedview=";
   
//      if (interval<=1){

         selectedview="getDataIos"+GetParam("ios")+"Card"+GetParam("card");

      }else if (interval>1 && interval <= 15){
         selectedview="getDataIos"+GetParam("ios")+"Card"+GetParam("card")+"15sec";
      }else if (interval >15 && interval <=30){
         selectedview="getDataIos"+GetParam("ios")+"Card"+GetParam("card")+"30sec";
      }else if (interval >30 && interval <=60){
         selectedview="getDataIos"+GetParam("ios")+"Card"+GetParam("card")+"60sec";
      }else if (interval >60 && interval <=900){
         selectedview="getDataIos"+GetParam("ios")+"Card"+GetParam("card")+"900sec";
      }

         return selectedview;
 }
*/
/*  Here begins the stuff that runs when the page loads  */

  $("#deleteplot").click(function(){
    $("#graphstatus").text(JSON.stringify(easyToReadData.deltav));
//    detailChart.ioss[0].cards[0].channels.splice(0,1);
//    masterChart.ioss[0].cards[0].channels.splice(0,1);
//    $("#chart_ios0card0channel0").remove();
  });

  $("#addplot").click(function(){
    var chartindex=charts.length;
    var selected=$("#name_dropdown :selected").val();
//    $("#graphstatus").text(JSON.stringify(names[selected]));
    $("#plots").append(
        "<div class='chartcontainer' id='chart" + chartindex + "'>"
      +   "<div class='detailchart' id='detail-container" + chartindex 
      +     "'><\/div>"
      +   "<div class='masterchart' id='master-container" + chartindex
      +     "'><\/div>"
      + "<\/div>"
    );

    if (names[selected].ios!=null) {
      charts[chartindex]={
        "ios":names[selected].ios,
        "card":names[selected].card,
        "channel":names[selected].channel,
        "name":names[selected].name,
        "masterChart":{},
        "detailChart":{},
        "data":easyToReadData.ioss[names[selected].ios].cards[names[selected].card].channels[names[selected].channel].data.reverse()
      };
//      $("#graphstatus").text(JSON.stringify(selected));
      createMaster(chartindex);
//      $("#graphstatus").text(JSON.stringify(easyToReadData.ioss[names[selected].ios].cards[names[selected].card]));
    } else {
      charts[chartindex]={
        "name": names[selected].name,
        "type": names[selected].type,
        "id": names[selected].id,
        "signal": names[selected].signal,
        "channel": names[selected].channel,
        "masterChart":{},
        "detailChart":{},
        "data": easyToReadData.deltav[names[selected].channel].data.reverse()
      };
//      $("#graphstatus").text(JSON.stringify(selected));
      createMaster(chartindex);
//      $("#graphstatus").text(JSON.stringify(easyToReadData.ropes[names[selected].rope]));
    }
//    $("#graphstatus").text("\nTitle: "+names[selected].name + " displayed below.");
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

