1.Creare vid in  remote-html:
                            
                        <div id = "arduino-light-switch" class ="button hidden arduino-menu  module-line toggled-off">
                                <span class="stack fa-fw"><span class="fa fa-fw fa-toggle-on outer-label fa-stack-1x"></span>
                                <span class="fa fa-fw fa-toggle-off outer-label fa-stack-1x"></span>
                                <span class="fa fa-fw fa-lock inner-small-label fa-stack-1x"></span></span>
                                <span class="text">Light Switch</span>
                        </div>   

2.se adauga location hash in remote.js (var buttons):
                            "arduino-control-button": function() {
                            window.location.hash = "arduino-menu";
                                                                     },
                                                                     
3.se adauga conditie in butonul de back pt a ascunde butonul cand se intoarce la meniu principal:
                            "back-button": function() {
        if (window.location.hash === "#add-module-menu") {
            window.location.hash = "settings-menu";
            return;
        }
  -->>>      else if (window.location.hash === "#arduino-menu"){  //////////////////hide arduino switches
            document.getElementById("arduino-light-switch").classList.add("hidden");
        }

4.se adauga aciunea butonului in remote.js (var buttons) cu id-ul butonului:
                "arduino-light-switch": function () {
        if (this.classList.contains("toggled-off")){
            this.classList.add("toggled-on");
            // Remote.getWithStatus("action=TURNONLIGHT");
        }else if(this.classList.contains("toggled-on")){
            console.log('nu merge');
            console.log(this.className);
            this.classList.add("toggled-on");
            // Remote.getWithStatus("action=TURNOFFLIGHT");
        }
        
    },
5.se adauga request-ul in node_helper.js 
        		if (query.action === "TURNONLIGHT") {
			if (res) { res.send({"status": "success"}); }
			self.sendSocketNotification(query.action);
			return true;
		}

6.se adauga actiunea butonului in MMM-Remote-Control 
            		if (notification === "TURNONLIGHT"){
			alert('aaaa');
		}