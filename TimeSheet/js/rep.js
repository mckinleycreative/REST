SOA004Client.init();
SOA004Client.system = "MAXIMO";

REP = {
    addRow: function() {
        this.setStdOpts();
        var tr = this.tbl.insertRow(this.tbl.rows.length - 1);
        var td = tr.insertCell(-1);
        td.innerHTML = "<INPUT name='REFWO' placeholder='AONumber' onChange='REP.verifyAONum( this );' maxlength='10'></INPUT>";
        td = tr.insertCell(-1);
        td.innerHTML = "<INPUT name='STARTDATE' type = 'date'/>";
        td = tr.insertCell(-1);
        td.innerHTML = "<SELECT name='type'>" + this.stdOpts + "</SELECT>";
        td = tr.insertCell(-1);
        td.innerHTML = "<INPUT name='REGULARHRS' placeholder='Timmar' type='number' min='0' max='20' ></INPUT>";
        td = tr.insertCell(-1);
        td.innerHTML = "<a id='removeRow' onClick='removeRow(this);'><i class='fa fa-minus-circle fa-3x' aria-hidden='true'></i></a>"
    },

    send: function() {
        var user = JSON.parse(sessionStorage.user);
        for (var i = 1; i < this.tbl.rows.length - 1; i++) {
            if (this.tbl.rows[i].className.indexOf("sent") > -1) continue;
            var rowData = {};
            var inps = this.tbl.rows[i].getElementsByTagName("INPUT");
            for (var j = 0; j < inps.length; j++) {
                var inp = inps[j];
                rowData[inp.name] = inp.value;
            }
            rowData.ENTERBY = user.PERSONID;
            rowData.LABORCODE = user.LABORCODE;
            rowData.SITEID = user.WORKSITE;
            var sel = this.tbl.rows[i].getElementsByTagName("SELECT")[0];
            if (sel.selectedIndex != 0) {
                rowData.PREMIUMPAYHOURS = rowData.REGULARHRS;
                rowData.REGULARHRS = '';
                rowData.PREMIUMPAYCODE = sel.options[sel.selectedIndex].text;
            }
            SOA004Client.dataobject = "INTLABTRANS";
            var ret = SOA004Client.postobj(false, rowData);
            if (ret.CreateINTLABTRANSResponse.rsCount > 0) {
                this.tbl.rows[i].className += "sent";
                var di = this.tbl.rows[i].getElementsByTagName("INPUT");
                for (var rr = 0; rr < di.length; rr++) {
                    di[rr].disabled = 'disabled';

                }
            }
        }
    },
    setStdOpts: function() {
        this.stdOpts = "<option>NORMAL</option>";
        var json = JSON.parse(sessionStorage.user);
        for (var i = 0; i < json.LABORCRAFTRATE[0].PPCRAFTRATE.length; i++) {
            var cur = json.LABORCRAFTRATE[0].PPCRAFTRATE[i];
            this.stdOpts += "<option value='" + cur.PPCRAFTRATEID + "'>" + cur.PREMIUMPAYCODE + "</option>";
        }
    },
    stdOpts: "",
    tbl: null,
    verifyAONum: function(inp) {
        if (inp.value.length < 4) return;

        SOA004Client.dataobject = "MXWO";
        var filter = {
            maxrows: 2,
            fields: [{
                WONUM: "=" + inp.value
            }]


        };
        SOA004Client.getasync(filter, null, null, function(json) {
            var found = false;
            console.log(json);
            for (var i = 0; i < json.QueryMXWOResponse.MXWOSet.WORKORDER.length; i++) {
                var valids = ['INPRG', 'COMP'];
                if (valids.indexOf(json.QueryMXWOResponse.MXWOSet.WORKORDER[i].STATUS) !== -1) found = true;


            }

            if (found == true) {
                inp.style.background = '#9ad09a';
            } else {
                inp.style.background = 'none';
                inp.value = "";
                window.alert("Inte en godkänd Arbetsorder");
            }
        });
    }
};
