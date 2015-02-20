function (newDoc, oldDoc, userCtx, secObj) {
  var v = require("lib/validate").init(newDoc, oldDoc, userCtx, secObj);
  var sofarsogood=true;
  var failtext="";
  var failedchannel={};

  for (var ios=0; ios<newDoc.ioss.length && sofarsogood; ios++) {
    for (var card=0; card<newDoc.ioss[ios].cards.length && sofarsogood; card++) {
      for (var channel=0; channel<newDoc.ioss[ios].cards[card].channels.length &&sofarsogood; channel++){
        if (newDoc.ioss[ios].cards[card].channels[channel].hi){
          if (newDoc.ioss[ios].cards[card].channels[channel].lo >= newDoc.ioss[ios].cards[card].channels[channel].hi){
            failedchannel=newDoc.ioss[ios].cards[card].channels[channel];
            failtext = "lo>hi";
            sofarsogood = false;
          }
          if (newDoc.ioss[ios].cards[card].channels[channel].lolo > newDoc.ioss[ios].cards[card].channels[channel].lo){
            failedchannel=newDoc.ioss[ios].cards[card].channels[channel];
            failtext = "lolo>lo";
            sofarsogood = false;
          }
          if (newDoc.ioss[ios].cards[card].channels[channel].hi > newDoc.ioss[ios].cards[card].channels[channel].hihi){
            failedchannel=newDoc.ioss[ios].cards[card].channels[channel];
            failtext = "hi>hihi";
            sofarsogood = false;
          }
        }
      }
    }
  }
  for (var channel=0; channel<newDoc.deltav.length && sofarsogood; channel++){
    if (newDoc.deltav[channel].hi){
      if (newDoc.deltav[channel].lo >= newDoc.deltav[channel].hi){
        failedchannel=newDoc.deltav[channel];
        failtext = "lo>hi";
        sofarsogood = false;
      }
      if (newDoc.deltav[channel].lolo > newDoc.deltav[channel].lo){
        failedchannel=newDoc.deltav[channel];
        failtext = "lolo>lo";
        sofarsogood = false;
      }
      if (newDoc.deltav[channel].hi > newDoc.deltav[channel].hihi){
        failedchannel=newDoc.deltav[channel];
        failtext = "hi>hihi";
        sofarsogood = false;
      }
    }
  }
  if (!sofarsogood){
    v.forbidden(""+failedchannel.type+" "+failedchannel.id+" "+failedchannel.signal+" "+failtext);
  }

  if (newDoc._deleted){
    v.forbidden("Don't delete data!!");
  }
//  if (!v.isAdmin() && false){
//    v.unauthorized("Log in as expert");
//  }
}
