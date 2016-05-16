function(doc, req) {  
  var ddoc = this;
  var Mustache = require("lib/mustache");
  var data={
    "pageTitle":"Threshold Values",
    "ioss":[],
    "racks":[],
    "crates":[],
    "compcoils":[],
    "holdupropes":[],
    "holddownropes":[],
    "other":[],
    "equator":[],
    "AVtemp":[],
    "cavitywaterlevel":[],
    "conns":[]
  };
  
  var channels = {
    "racks":{
      "channels":[
        "24V",
        "-24V",
        "8V",
        "5V",
        "-5V"
      ],
      "ids":[1,2,3,4,5,6,7,8,9,10,11,"Timing"],
      "styles":[
        "three","three","three","three","three","three","three","three","three","three","three","three"
      ]
    },
    "crates":{
      "channels":[
        //"8V",
        //"5V",
        //"-5V",
        "XL3_V",
        "XL3_T"
      ],
      "ids":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],  
      "styles":[
        "one","one","one","one","one","one","one","one","one","one","one","one","one","one","one","one","one","one","one"
      ]
    },
    "compcoils":{
      "channels":[
        "current",
        "alarms"
      ],
      "ids":[
        "1A","1B",2,3,4,5,6,7,"8A","8B","9A","9B",10,11
      ],
      "styles":[
      "cc","cc","cc","cc","cc","cc","cc","cc","cc","cc","cc","cc","cc","cc","cc" 
      ]
    },
    "other":{
      "channels":[""],
      "ids":["E-Stop","Mine Power"], 
      "styles":["big","big"],
    },
    "holdupropes":{
      "channels":[""],
      "ids":[1,2,3,4,5,6,7,8,9,10],
      "styles":["one","one","one","one","one","one","one","one","one","one"]
    },
    "holddownropes":{
      "channels":[""],
      "ids":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
      "styles":["one","one","one","one","one","one","one","one","one","one","one","one","one","one","one","one","one","one","one","one"]
    },
    "AVtemp":{
      "channels":[""],
      "ids":[1],
      "styles":["one"]
    },
    "cavitywaterlevel":{
      "channels":[""],
      "ids":[1],
      "styles":["one"]
    },
    "equator":{
      "channels":[""],
      "ids":[1,2,3,4],
      "styles":["one","one","one","one"]
    },
    "conns":{
      "channels":[""],
      "ids":["DetectorServer"],
      "styles":["one"]
    }
  };

  for (var index=0; index<channels.racks.ids.length; index++){
    data.racks[index]={
      "id":channels.racks.ids[index],
      "style":channels.racks.styles[index],
      "channels":[]
    };
    for (var channelindex=0; channelindex<channels.racks.channels.length; channelindex++){
      data.racks[index].channels[channelindex]={"channel":channels.racks.channels[channelindex]};
    }
  }
  data.racks[11].channels[2].channel="6V";

  for (var index=0; index<channels.crates.ids.length; index++){
    data.crates[index]={
      "id":channels.crates.ids[index],
      "style":channels.crates.styles[index],
      "channels":[]
    };
    for (var channelindex=0; channelindex<channels.crates.channels.length; channelindex++){
      data.crates[index].channels[channelindex]={"channel":channels.crates.channels[channelindex]};
    }
  }

  for (var index=0; index<channels.compcoils.ids.length; index++){
    data.compcoils[index]={
      "id":channels.compcoils.ids[index],
      "style":channels.compcoils.styles[index],
      "channels":[]
    };
    for (var channelindex=0; channelindex<channels.compcoils.channels.length; channelindex++){
      data.compcoils[index].channels[channelindex]={
       "channel":channels.compcoils.channels[channelindex],
       "channelshort":channels.compcoils.channels[channelindex].charAt(0)
      };
    }
  }

  for (var index=0; index<channels.holdupropes.ids.length; index++){
    data.holdupropes[index]={
      "id":channels.holdupropes.ids[index],
      "style":channels.holdupropes.styles[index],
    };
  }

  for (var index=0; index<channels.holddownropes.ids.length; index++){
    data.holddownropes[index]={
      "id":channels.holddownropes.ids[index],
      "style":channels.holddownropes.styles[index],
    };
  }

  for (var index=0; index<channels.equator.ids.length; index++){
    data.equator[index]={
      "id":channels.equator.ids[index],
      "style":channels.equator.styles[index],
    };
  }

  for (var index=0; index<channels.AVtemp.ids.length; index++){
    data.AVtemp[index]={
      "id":channels.AVtemp.ids[index],
      "style":channels.AVtemp.styles[index],
    };
  }

  for (var index=0; index<channels.cavitywaterlevel.ids.length; index++){
    data.cavitywaterlevel[index]={
      "id":channels.cavitywaterlevel.ids[index],
      "style":channels.cavitywaterlevel.styles[index],
    };
  }

  for (var index=0; index<channels.conns.ids.length; index++){
    data.conns[index]={
      "id":channels.conns.ids[index],
      "style":channels.conns.styles[index],
    };
  }
  for (var index=0; index<channels.other.ids.length; index++){
    data.other[index]={
      "id":channels.other.ids[index],
      "style":channels.other.styles[index],
      "channels":[]
    };
    for (var channelindex=0; channelindex<channels.other.channels.length; channelindex++){
      data.other[index].channels[channelindex]={"channel":channels.other.channels[channelindex]};
    }
  }

  data.channels=JSON.stringify(channels);
  return Mustache.to_html(ddoc.templates.slowcontrol, data);
}
