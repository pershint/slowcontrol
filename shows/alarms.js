function(doc, req) {  
  var ddoc = this;
  var Mustache = require("lib/mustache");
  var data={
    "pageTitle":"Threshold Values",
    "ioss":[]
  };
  var sizes={
    "ioss":[
      {
        "ios":1,
        "cards":[
          {"card":"cardA",
            "channels":20
          },
          {"card":"cardB",
            "channels":20
          },
          {"card":"cardD",
            "channels":32
          }
        ]
      },
      {
        "ios":2,
        "cards":[
          {"card":"cardA",
            "channels":20
          },
          {"card":"cardB",
            "channels":20
          },
          {"card":"cardC",
            "channels":20
          },
          {"card":"cardD",
            "channels":20
          }
        ]
      },
      {
        "ios":3,
        "cards":[
          {"card":"cardA",
            "channels":20
          },
          {"card":"cardB",
            "channels":20
          },
          {"card":"cardC",
            "channels":20
          }
        ]
      },
      {
        "ios":4,
        "cards":[
          {"card":"cardA",
            "channels":20
          },
          {"card":"cardB",
            "channels":20
          },
          {"card":"cardC",
            "channels":20
          },
          {"card":"cardD",
            "channels":20
          }
        ]
      }
    ]
  };

  var channels = {
    "racks":{
      "channels":[
        "+24V",
        "-24V",
        "+8V",
        "+5V",
        "-5V"
      ],
      "ids":[1,2,3,4,5,6,7,8,9,10,11],
      "styles":[
        "two","two","one","two","two","two","one","two","two","one","two"
      ]
    },
    "crates":{
      "channels":[
        "+24V",
        "-24V",
        "+8V",
        "+5V",
        "-5V",
        "XL3 V",
        "XL3 T"
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
      "one","one","one","one","one","one","one","one","one","one","one","one","one","one"
      ]
    },
    "other":{
      "channels":["Other"],
      "ids":["E-Stop","Mine Power"], 
      "styles":["big","big"],
    }
  };

  for (var ios=0; ios<sizes.ioss.length; ios++){
    data.ioss[ios]={
      "ios":ios,
      "cards":[]
    };
    for (var card=0; card<sizes.ioss[ios].cards.length; card++){
      data.ioss[ios].cards[card]={
        "card":card,
        "channels":[]
      };
      for (var channel=0; channel<sizes.ioss[ios].cards[card].channels; channel++){
        data.ioss[ios].cards[card].channels[channel]={"channel":channel};
      }
    }
  }  

  var racks=[];  
  var crates=[];
  var compcoils=[];
  var other=[];

  for (var index=0; index<channels.racks.ids.length; index++){
    racks[index]={};
    racks[index].id=channels.racks.ids[index];
    racks[index].style=channels.racks.styles[index];
    racks[index].channels=[];
    for (var channelindex=0; channelindex<channels.racks.channels.length; channelindex++){
      racks[index].channels[channelindex]={"channel":channels.racks.channels[channelindex]};
    }
  }

  for (var index=0; index<channels.crates.ids.length; index++){
    crates[index]={};
    crates[index].id=channels.crates.ids[index];
    crates[index].channels=channels.crates.channels;
    crates[index].style=channels.crates.styles[index];
  }
  
  for (var index=0; index<channels.compcoils.ids.length; index++){
    compcoils[index]={};
    compcoils[index].id=channels.compcoils.ids[index];
    compcoils[index].channels=channels.compcoils.channels;
    compcoils[index].style=channels.compcoils.styles[index];
  }
  
  for (var index=0; index<channels.other.ids.length; index++){
    other[index]={};
    other[index].id=channels.other.ids[index];
    other[index].channels=channels.other.channels;
    other[index].style=channels.other.styles[index];
  }

  
  data.sizes=JSON.stringify(sizes);
  data.channels=JSON.stringify(channels);
  data.racks=JSON.stringify(racks);
  data.crates=JSON.stringify(crates);
  data.compcoils=JSON.stringify(compcoils);
  data.other=JSON.stringify(other);
  return Mustache.to_html(ddoc.templates.alarms, data);
}
