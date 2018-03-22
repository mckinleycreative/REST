SOA004Client.init();
SOA004Client.system = "MAXIMO";

function validUser() {
    if (sessionStorage.getItem("user") === null) {
        window.location.href = "login.html";
    }

}

function fillpersontable(numrows, tbl) {
    SOA004Client.dataobject = "MXPERSON";
    var filter = {
        maxrows: numrows,
        fields: [{
            LOCATIONSITE: 'GAR'
        }, {
            STATUS: '=ACTIVE'
        }]
    };
    var json = SOA004Client.get(filter);
    for (var i = 0; i < json.QueryMXPERSONResponse.MXPERSONSet.PERSON.length; i++) {
        var person = json.QueryMXPERSONResponse.MXPERSONSet.PERSON[i];
        var tr = tbl.insertRow(-1);
        var td = tr.insertCell(-1);
        td.innerHTML = person.DISPLAYNAME;
        td = tr.insertCell(-1);
        td.innerHTML = person.LOCATION;
    }

}

function fillCompanies() {
    SOA004Client.dataobject = "INTLABVEND";
    var filter = {
        fields: [{
            ORGID: '=SE01'
        }, {
            STATUS: '=APPR'
        }]
    };
    SOA004Client.getasync(filter, null, null, function(comp) {
        var cbox = document.getElementById('companies');
        cbox.options[0].text = "----Välj företag----";
        for (var i = 0; i < comp.QueryINTLABVENDResponse.INTLABVENDSet.LABORVIEW.length; i++) {
            var found = false;
            var cur = comp.QueryINTLABVENDResponse.INTLABVENDSet.LABORVIEW[i];
            for (var j = 0; j < cbox.options.length; j++) {
                if (cbox.options[j].value == cur.VENDOR) found = true;
            }
            if (found) continue;
            var opt = document.createElement('option');
            opt.value = cur.VENDOR;
            opt.text = cur.COMPANIES[0].NAME;
            cbox.add(opt);
        }
    });
}

function companyChanged(sel) {
    SOA004Client.dataobject = "INTLABOR";
    var filter = {
        fields: [{
            "LABORCRAFTRATE.VENDOR": sel.options[sel.selectedIndex].value
        }]
    };
    var labor = SOA004Client.get(filter);
    var tgt = document.getElementById('labortarget');
    tgt.innerHTML = "";
    for (var i = 0; i < labor.QueryINTLABORResponse.INTLABORSet.LABOR.length; i++) {
        var cur = labor.QueryINTLABORResponse.INTLABORSet.LABOR[i];
        var p = document.createElement('p');
        p.className = 'person';
        p.innerHTML = cur.LABORCODE + ': ' + cur.PERSON[0].DISPLAYNAME;
        p.data_labor = cur;

        p.onclick = function() {
            sessionStorage.clear();
            sessionStorage.user = JSON.stringify(this.data_labor);
            window.location.href = "index.html";
        };

        tgt.appendChild(p);
    }
}

function getLabor(rownum) {
    SOA004Client.dataobject = "INTLABOR";
    var filter = {
        maxrows: rownum,
        fields: [{
            LOCATIONSITE: '=GAR'
        }, {
            STATUS: '=ACTIVE'
        }]
    };
    var labor = SOA004Client.get(filter);

}

function removeRow(btn) {
  var row = btn.parentNode.parentNode;
  row.parentNode.removeChild(row);
}

function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}
