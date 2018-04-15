function displaynew() {
  if (!(newjson== null)) {
    if (!(newjson.QueryREST_ASSETWResponse.rsTotal === undefined)) {
      var newrecords = newjson.QueryREST_ASSETWResponse.rsTotal;
      if (newrecords > 0) {
        swapnew();
        var i = 0;
        var uexists = false;
        var dexists = false;
        var umessage = "";
        var dmessage = "";
        d = new Date();
        set("messup", null);
        set("messdown", null);
        document.getElementById("output").style.display = '';
        document.getElementById("messup").style.display = '';
        document.getElementById("messdown").style.display = '';
        for (i; i < newrecords; ++i) {
          newcurr = newjson.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
          department = newcurr.LOCATIONS[0].DESCRIPTION;
          if ((newcurr.PRIORITY <= chosenpriority) &&
            (chosendept == department || chosendept == "All") &&
            ((!newcurr.ISRUNNING && running == "Down") ||
              running == "All" ||
              (newcurr.ISRUNNING && running == "Available"))) {
            var locald = new Date(newcurr.CHANGEDATE);
            message = maximo.leftpad(daysBetween(locald, d), 5, " ") + " : " + newcurr.ASSETNUM + (chosenpriority > 1 ? " (" + newcurr.PRIORITY + ") " : " ") + newcurr.DESCRIPTION;
            if (newcurr.ISRUNNING == 0) {
              dmessage += dexists ? "<br/>" : "";
              dmessage += message
              dexists = true;
            } else {
              umessage += uexists ? "<br/>" : "";
              umessage += message
              uexists = true;
            }
          }
        };
        if (uexists) set("messup", umessage);
        if (dexists) set("messdown", dmessage);
        if (!uexists && !dexists) {
          document.getElementById("output").style.display = 'none';
        } else {
          document.getElementById("output").style.display = '';
        }
        if (!uexists) {
          document.getElementById("messup").style.display = 'none';
        }
        if (!dexists) {
          document.getElementById("messdown").style.display = 'none';
        }
      } else {
        document.getElementById("output").style.display = 'none';
      }
    } else {
      document.getElementById("output").style.display = 'none';
    }
  }
}

function displaytable(json) {
  var tr = null;
  var cellLength = 0;
  var toptbl = null;
  var toggle = false;
  var asstitle = "";
  var department = "";
  var toptbl = document.getElementById("tgt");
  tblhead = toptbl.getElementsByTagName("thead")[0];
  tbl = toptbl.getElementsByTagName("tbody")[0];

  if (json.QueryREST_ASSETWResponse.rsCount === undefined)
    return;

  var assetrecords = json.QueryREST_ASSETWResponse.rsCount;
  if (assetrecords == 0)
    return;

  var assetcolums = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET.length;
  var sectionname = null;
  var oldsectionname = null;
  var nocolumns = 0;
  var found = false;
  var days;
  var currdept = "xx";
  var pmploc = 0;

  assetupcount = 0;
  assetdowncount = 0;
  assetservice = 0;
  assetbreakdowncount = 0;
  assettotal = 0;

  builddeptbox(json);

  tablelength = toptbl.rows.length;
  for (var i = 0; i < tablelength; i++) {
    toptbl.deleteRow(0);
  }
  // start rebuild the header with the single version of the description
  tr = tblhead.insertRow(0);
  // add columns for the machine types currently using CLASSSTRUCTURE
  td = tr.insertCell(-1);
  tr.id = "depttitle";
  td.innerHTML = "Department";

  HeaderCells = toptbl.rows.item(0).cells;
  for (i = 0; i < assetcolums; i++) {
    var curr = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
    sectionname = curr.CLASSSTRUCTURE[0].DESCRIPTION;
    department = curr.LOCATIONS[0].DESCRIPTION;
    ass = curr.ASSETNUM;
    if ((curr.PRIORITY <= chosenpriority) &&
      (chosendept == department || chosendept == "All") &&
      ((!curr.ISRUNNING && running == "Down") ||
        running == "All" ||
        (curr.ISRUNNING && running == "Available")
      )
    ) {
      if (nocolumns > 0) {
        HeaderCells = toptbl.rows.item(0).cells;
        //gets cells of current row
        found = false;
        cellLength = HeaderCells.length;
        for (var j = 0; j < cellLength; j++) {
          var cellVal = HeaderCells.item(j).innerHTML;
          if (sectionname === cellVal) {
            found = true;
          }
        }
      }
      // add them to the column headers
      if (!found) {
        td = tr.insertCell(-1);
        td.innerHTML = sectionname;
        nocolumns += 1;
        oldsectionname = sectionname;
      }
      cellLength = HeaderCells.length;
    }
  }
  cellLength = HeaderCells === undefined ? 0 : HeaderCells.length;

  if (cellLength < 2) {
    toptbl.deleteRow(0);
    tr = toptbl.insertRow(0);
    td = tr.insertCell(-1);
    td.innerHTML = cellLength + " type(s) found but not with chosen options";
    return;
  }

  // run down through the cells with the logic of using the "machine classificaiton description as the sort field
  swap = true;
  while (swap) {
    swap = false;
    for (l = 1; l < HeaderCells.length - 1; l++) {
      currsection = HeaderCells.item(l).innerHTML;
      nextsection = HeaderCells.item(l + 1).innerHTML;
      if (currsection > nextsection) {
        HeaderCells.item(l).innerHTML = nextsection;
        HeaderCells.item(l + 1).innerHTML = currsection;
        swap = true;
      }
    }
  }

  tr = tblhead.insertRow(-1);
  if (displaylevel < 2 || running != "All") {
    tr.style.display = 'none';
  }
  tr.id = "pct";
  for (l = 1; l < HeaderCells.length + 1; l++) {
    // add columns for the machine types currently using CLASSSTRUCTURE
    td = tr.insertCell(-1);
    td.className = "assetup";
    if (l == 1) td.className = "productionh";
    td.innerHTML = 0;
  }

  tr = tblhead.insertRow(-1);
  if (displaylevel < 3 || running != "All") {
    tr.style.display = 'none';
  }
  tr.id = "pct1";
  for (l = 1; l < HeaderCells.length + 1; l++) {
    // add columns for the machine types currently using CLASSSTRUCTURE
    td = tr.insertCell(-1);
    td.className = "assetdown";
    if (l == 1) td.className = "productionh";
    td.innerHTML = 0;
  }

  tr = tblhead.insertRow(-1);
  tr.style.display = 'none';
  tr.id = "pctup";
  for (l = 1; l < HeaderCells.length + 1; l++) {
    // add columns for the machine types currently using CLASSSTRUCTURE
    td = tr.insertCell(-1);
    if (l == 1) td.className = "productionh";
    td.innerHTML = 0;
  }
  tr.style.display = 'none';

  tr = tblhead.insertRow(-1);
  tr.style.display = 'none';
  tr.id = "pctdown";
  for (l = 1; l < HeaderCells.length + 1; l++) {
    // add columns for the machine types currently using CLASSSTRUCTURE
    td = tr.insertCell(-1);
    td.innerHTML = 0;
    if (l == 1) td.className = "productionh";
  }
  tr = tblhead.insertRow(-1);
  tr.style.display = 'none';
  tr.id = "pcttotal";
  for (l = 1; l < HeaderCells.length + 1; l++) {
    // add columns for the machine types currently using CLASSSTRUCTURE
    td = tr.insertCell(-1);
    td.innerHTML = 0;
    if (l == 1) td.className = "productionh";
  }

  //        document.getElementById("pct").style.display = 'none';

  pcttotalobj = document.getElementById("pcttotal").cells;
  pctupobj = document.getElementById("pctup").cells;
  pctdownobj = document.getElementById("pctdown").cells;
  pct = document.getElementById("pct").cells;
  pct1 = document.getElementById("pct1").cells;

  for (i = 0; i < assetcolums; i++) {
    var curr = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
    department = curr.LOCATIONS[0].DESCRIPTION;
    if (
      (curr.PRIORITY <= chosenpriority) &&
      (chosendept == department || chosendept == "All") &&
      ((!curr.ISRUNNING && running == 'Down') ||
        running == "All" ||
        (curr.ISRUNNING && running == "Available")
      )
    ) {
      sectionname = curr.CLASSSTRUCTURE[0].DESCRIPTION;
      found = false;
      // find the next available slot
      var locald;
      assettotal++;
      for (k = 0; k < tbl.rows.length; ++k) {
        if (!found) {
          deptlabel = tbl.rows.item(k).cells;
          currdept = deptlabel.item(0).innerHTML;
          if (department == currdept) {
            position = findclasspos(HeaderCells, sectionname);
            objecttext = deptlabel.item(position);
            if (!objecttext.innerHTML) {
              found = true;
              setassetclass(objecttext, HeaderCells, curr);
            }
          }
        }
      }
      if (!found) {
        if (curr.ASSETNUM == "337") stop = 0;
        tr = tbl.insertRow(-1);
        td = tr.insertCell(-1);
        td.innerHTML = department;
        td.className = "production" + (currdept == department ? "h" : "");
        toggle = !toggle;
        currdept = department;
        for (var j = 1; j < cellLength; j++) {
          currsection = HeaderCells.item(j).innerHTML;
          td = tr.insertCell(-1);
          if (sectionname === currsection) {
            setassetclass(td, HeaderCells, curr)
          }
        }
      }
    }
  }

  for (var j = 1; j < pct.length; j++) {
    pct.item(j).innerHTML = Math.round(1000.0 * Number(pctupobj.item(j).innerHTML) / Number(pcttotalobj.item(j).innerHTML)) / 10 + "%";
    pct1.item(j).innerHTML = Math.round(1000.0 * Number(pctdownobj.item(j).innerHTML) / Number(pcttotalobj.item(j).innerHTML)) / 10 + "%";
  }

  set("assetupcount", assetupcount);
  set("assetdowncount", assetdowncount);
  set("assetservice", assetservice);
  set("assetbreakdowncount", assetbreakdowncount);
  set("uppct", (Math.round(1000.0 * assetupcount / assettotal) / 10.0) + "%");
  set("downpct", (Math.round(1000.0 * assetdowncount / assettotal) / 10.0) + "%");
  set("servicepct", (Math.round(1000.0 * assetservice / assettotal) / 10.0) + "%");
  set("breakpct", (Math.round(1000.0 * assetbreakdowncount / assettotal) / 10.0) + "%");
}
