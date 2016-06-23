## Generated CouchApp

This is the current slow control monitoring software for the SNO+ experiment.  It includes an interface to change thresholds and one to monitor alarms. 

Dependencies:
CouchDB
Couchapp

To install, do:

    couchapp push . http://username:password@url:5984/slowcontrol-channeldb

Main HTML code for webpage located in: slowcontrol/templates/slowcontrol.html
css code where classes used in slowcontrol.html are defined: slowcontrol/_attachments/style/main.css
Main javascripts that run the webpage: slowcontrol/_attachments/script/*.js

