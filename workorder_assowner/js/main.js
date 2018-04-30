var interval = 60000;
var debug = false;
//		var searchfilter = {maxrows: 600,offset: 0,fields: [{SITEID:"TAR"},{ASSETTYPE:"FLEET"},{STATUS:"OPERATING"},{PRIORITY:1}]};
//    var searchfilter = {maxrows: 600,offset: 0,fields: [{SITEID:"=TAR"},{ASSETTYPE:"=FLEET"},{STATUS:"=OPERATING"},{LOCATION:"!~null~"},{FAILURECODE:"!~null~"},{PRIORITY:"!~null~"}]};
var searchfilter = {
  maxrows: 600,
  offset: 0,
  fields: [{
    SITEID:"=TAR"
  }, {
    HISTORYFLAG:"N"
  }, {
    ISTASK:"N"
  }, {
    STATUS:"=APPR,=INPRG"
  }, {
    AMCREW:"XXXXXX"
  }]
};
//		var searchfilter = {maxrows: 600,offset: 0,fields: [{SITEID:"=TAR"},{HISTORYFLAG:"N"},{ISTASK:"N"},{STATUS:"=APPR,=INPRG"}]};
var updatefilter = {
  maxrows: 10,
  offset: 2,
  fields: [{
    SITEID:"=TAR"
  }]
};
var filter = searchfilter;
//.fields[4].replace('XXXXXX','TMO750');
//('XXXXXX','TMO750');
var chosenpriority = 1;
var chosendept ="All";
var running ="All";
var json = null;
var HeaderCells;
var deptBox = document.getElementById('department');
var priBox = document.getElementById('priority');
var runningBox = document.getElementById('running');

function set(id, val) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = val;
}

runningBox.onchange = function() {
  running = runningBox.options[runningBox.selectedIndex].value;
  displaytable(json);
}

priBox.onchange = function() {
  chosenpriority = priBox.options[priBox.selectedIndex].value;
  displaytable(json);
}

deptBox.onchange = function() {
  //			chosendept = deptBox.options[deptBox.selectedIndex].value;
  //			displaytable( json );
  update();
}

function compile(curr, dept) {
  var d = new Date();
  var currdescription = curr.LOCATIONS[0].DESCRIPTION;
  currdescription += curr.FAILURECODE[0].DESCRIPTION;
  currdescription += curr.ASSET[0].ISRUNNING;
  //      locald =  curr.ASSETSTATUS ? new Date(curr.ASSETSTATUS[0].CHANGEDATE) : new Date(curr.CHANGEDATE);
  locald = curr.ASSETSTATUS ? new Date(curr.ASSETSTATUS[0].CHANGEDATE) : new Date(curr.CHANGEDATE);
  downtime = daysDiff(locald, d);
  currdescription += downtime;
  currdescription += curr.ASSETNUM;
  //					console.log('desc:'+currdescription);
  return currdescription;
}

function outputconsole(text, json) {
  var start = 0;
  var allrecords = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET.length;
  var i = 0;
  var records = allrecords - 1;
  if (debug) {
    for (i = start; i < allrecords; ++i) {
      curr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i];
      console.log(text +"::" + compile(curr));
    };
    console.log("===================");
  }
}

function buildcrewbox() {

  d = new Date();
  var filter = {
    maxrows: 600,
    offset: 0,
    fields: [{
      ORGID:"=IE01"
    }, {
      STATUS:"=ACTIVE"
    }]
  };

  SOA004Client.dataobject ="REST_CREW";
  json = SOA004Client.get(filter);

  if (!json) {
    set("lastupdated","Comms Error @" + d.toLocaleString());

    return;
  }
  for (var j = deptBox.options.length - 1; j >= 0; j--) {
    deptBox.remove(j); // Clears all old values
  }
  currdept ="All";
  //			var opt = document.createElement("OPTION");
  //			opt.value = currdept;
  //			opt.text = currdept;
  //			deptBox.add(opt);
  j = json.QueryREST_CREWResponse.rsCount;
  var swap = true;

  while (swap) {
    swap = false;
    for (i = 0; i < j - 1; ++i) {
      var curr = json.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i];
      var nextcurr = json.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i + 1];
      var currdescription = curr.DESCRIPTION;
      var nextdescription = nextcurr.DESCRIPTION;
      if (currdescription > nextdescription) {
        swap = true;
        endstop = i;
        json.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i + 1] = curr;
        json.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i] = nextcurr;
      }
    }
  }

  var opt = document.createElement("OPTION");
  opt.value = "";
  opt.text = "Select a crew from the dropdown list";
  deptBox.add(opt);

  for (i = 0; i < json.QueryREST_CREWResponse.rsCount; i++) {
    var curr = json.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i];
    department = curr.DESCRIPTION;
    if (currdept != department) {
      var opt = document.createElement("OPTION");
      opt.value = curr.AMCREW;
      opt.text = department;
      deptBox.add(opt);
    }
    currdept = department;
  }
  deptBox.value = chosendept;
}



function builddeptbox1(json) {
  for (var j = deptBox.options.length - 1; j >= 0; j--) {
    deptBox.remove(j); // Clears all old values
  }
  //			var opt = document.createElement("OPTION");
  //			opt.value = currdept;
  //			opt.text = currdept;
  //			deptBox.add(opt);
  for (i = 0; i < json.QueryREST_WOResponse.REST_WOSet.WORKORDER.length; i++) {
    var curr = json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i];
    department = curr.AMCREW[0].DESCRIPTION;
    if (currdept != department) {
      var opt = document.createElement("OPTION");
      opt.value = department;
      opt.text = department;
      deptBox.add(opt);
    }
    currdept = department;
  }
  deptBox.value = chosendept;
}

function sortbydept(json, dept) {
  var start = 0;
  var allrecords = json.QueryREST_WOResponse.REST_WOSet.WORKORDER.length;
  var swap = true;
  var endstop = 0;
  var endstart = 0;
  var i = 0;
  var records = allrecords - 1;

  outputconsole("dirty", json);

  // stript out repeated text from department names
  for (i = start; i < allrecords; ++i) {
    curr = json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i];
    curr.LOCATIONS[0].DESCRIPTION = curr.LOCATIONS === undefined ?"Unknown" : curr.LOCATIONS[0].DESCRIPTION.replace('Mine ', '').replace(' Fleet', '');
    //				curr.LOCATIONS[0].DESCRIPTION = curr.LOCATIONS === undefined ?"Unknown": curr.LOCATIONS[0].DESCRIPTION.replace('Mine ','').replace(' Fleet','').replace(' Light','').replace(' Vehicles','');
    //				.replace(' Equipment','').replace('Mobile ','').replace('Equipment ','');
    json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i] = curr;
  };

  outputconsole("clean", json);

  while (swap) {
    swap = false;
    for (i = start; i < records; ++i) {
      curr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i];
      nextcurr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i + 1];
      var currdescription = compile(curr, dept);
      var nextdescription = compile(nextcurr, dept);
      if (currdescription > nextdescription) {
        swap = true
        endstop = i;
        json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i + 1] = curr;
        json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i] = nextcurr;
        //						displaytable(json);
      }
    }

    outputconsole("mid:" + start +":" + endstop, json);
    records--;
    //                records--;
    endstart = endstop - 1;
    if (!swap) break;

    swap = false;
    for (i = records; i > start; --i) {
      curr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i];
      nextcurr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i - 1];
      var currdescription = compile(curr, dept);
      var nextdescription = compile(nextcurr, dept);
      if (currdescription < nextdescription) {
        swap = true
        endstop = i;
        json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i - 1] = curr;
        json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i] = nextcurr;
      }
    }
    //                start++;
    outputconsole("end:" + start +":" + endstop, json);
  }
  outputconsole("final", json);
}

function displaytable(json) {
  var tr = null;
  var assetupcount = 0;
  var assetdowncount = 0;
  var assetservice = 0;
  var assetbreakdowncount = 0;
  var assettotal = 0;
  var cellLength = 0;
  var d = new Date();
  var toptbl = null;
  var toptbl = document.getElementById("tgt");
  tblhead = toptbl.getElementsByTagName("thead")[0];
  tbl = toptbl.getElementsByTagName("tbody")[0];

  set("lastupdated", d.toLocaleString());

  var workcount = json.QueryREST_WOResponse.rsCount;
  var sectionname = null;
  var oldsectionname = null;
  var nocolumns = 0;
  var found = false;
  var asstitle;

  //			builddeptbox ( json );

  tablelength = toptbl.rows.length;
  for (var i = 0; i < tablelength; i++) {
    toptbl.deleteRow(0);
  }
  // start rebuild the header with the single version of the description
  tr = tblhead.insertRow(0);

  // add columns for the machine types currently using FAILURECODE
  td = tr.insertCell(-1);
  td.innerHTML ="Wo."
  td = tr.insertCell(-1);
  td.innerHTML ="Description"
  td = tr.insertCell(-1);
  td.innerHTML ="Asset"
  td = tr.insertCell(-1);
  td.innerHTML ="Status"
  td = tr.insertCell(-1);
  td.innerHTML ="Priority"
  td = tr.insertCell(-1);
  td.innerHTML ="Date"
  td = tr.insertCell(-1);
  td.innerHTML ="Type"
  td = tr.insertCell(-1);
  td.innerHTML ="Area"

  HeaderCells = toptbl.rows.item(0).cells;
  cellLength = HeaderCells === undefined ? 0 : HeaderCells.length;

  if (cellLength < 1) {
    toptbl.deleteRow(0);
    tr = toptbl.insertRow(0);
    td = tr.insertCell(-1);
    td.innerHTML = cellLength +" type(s) found but not with chosen options";
    return;
  }

  for (i = 0; i < workcount; i++) {
    var curr = json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i];
    curprior = curr.CALCPRIORITY;
    if (chosenpriority >= curprior) {
      tr = tbl.insertRow(-1);
      td = tr.insertCell(-1);
      td.innerHTML = curr.WONUM;
      td = tr.insertCell(-1);
      td.innerHTML = curr.DESCRIPTION;
      td = tr.insertCell(-1);
      td.innerHTML = curr.ASSETNUM === undefined ?"" : curr.ASSETNUM;
      td = tr.insertCell(-1);
      td.innerHTML = curr.STATUS;
      td = tr.insertCell(-1);
      td.innerHTML = curr.CALCPRIORITY;
      if (curr.STATUS =="INPRG") {
        td = tr.insertCell(-1);
        td.innerHTML = curr.CHANGEDATE;
      } else {
        td = tr.insertCell(-1);
        td.innerHTML = curr.SCHEDSTART === undefined ? curr.TARGSTARTDATE : curr.SCHEDSTART;
      }
      td = tr.insertCell(-1);
      td.innerHTML = curr.WORKTYPE;
      td = tr.insertCell(-1);
      td.innerHTML = curr.LOCATIONS === undefined ?"unknown" : curr.LOCATIONS[0].DESCRIPTION;
      assetupcount += 1;
      assettotal += 1;
      assetdowncount += curr.STATUS ==="APPR" ? 1 : 0;
      assetbreakdowncount += curr.STATUS ==="INPRG" ? 1 : 0;
    }
  }
  set("assetupcount", assetupcount);
  set("assetdowncount", assetdowncount);
  set("assetservice", assetservice);
  set("assetbreakdowncount", assetbreakdowncount);
  set("uppct", (Math.round(1000.0 * assetupcount / assettotal) / 10.0) +"%");
  set("downpct", (Math.round(1000.0 * assetdowncount / assettotal) / 10.0) +"%");
  set("servicepct", (Math.round(1000.0 * assetservice / assettotal) / 10.0) +"%");
  set("breakpct", (Math.round(1000.0 * assetbreakdowncount / assettotal) / 10.0) +"%");

}


function daysDiff(date1, date2) {
  // Get 1 day in milliseconds
  var one_day = 1000 * 60 * 60;
  var one_hour = 1000 * 60 * 60;
  var one_min = 1000 * 60;
  var mins;
  var hours;
  // Convert both dates to milliseconds
  // Calculate the difference in milliseconds
  // Convert back to days and return
  mins = (date2.getTime() - date1.getTime()) / one_min;
  mins ="0" + Math.round(mins);
  while (mins.length < 10) {
    mins ="0" + mins;
  }
  return mins;
}

function daysBetween(date1, date2) {
  // Get 1 day in milliseconds
  var one_day = 1000 * 60 * 60;
  var one_hour = 1000 * 60 * 60;
  var one_min = 1000 * 60;
  var mins;
  var hours;
  // Convert both dates to milliseconds
  // Calculate the difference in milliseconds
  // Convert back to days and return
  mins = (date2.getTime() - date1.getTime()) / one_min;
  mins = Math.round(mins);
  hours = (mins / 60.0);
  hours = Math.round(hours);
  mins = mins - hours * 60.0;
  if (hours == 0) {
    downtime = mins +" M";
  } else if (hours > 47) {
    downtime = Math.round(hours / 2.4) / 10.0 +" D";
  } else {
    downtime = hours +" H";
  }
  return downtime;
}


function update() {
  var d = new Date();
  chosenpriority = priBox.options[priBox.selectedIndex].value;
  var pickindex = deptBox.selectedIndex;
  if (pickindex > -1) {
    chosendept = deptBox.options[deptBox.selectedIndex].value;
    var filter = {
      maxrows: 600,
      offset: 0,
      fields: [{
        SITEID:"=TAR"
      }, {
        HISTORYFLAG:"N"
      }, {
        PARENT:"~null~"
      }, {
        ISTASK:"N"
      }, {
        STATUS:"=APPR,=INPRG"
      }, {
        AMCREW: chosendept
      }]
    };
    SOA004Client.dataobject ="REST_WO";
    json = SOA004Client.get(filter);
    //			sortbydept ( json, true );
    displaytable(json);
    set("lastupdated", d.toLocaleString());
  }
}

SOA004Client.init();
SOA004Client.system ="MAXIMO";
SOA004Client.dataobject ="REST_WO";
buildcrewbox();
deptBox.value ="";
priBox.value ="3";
runningBox.value ="All";
//		update();
setInterval(function() {
  update();
}, interval);
