/* global Module, Log, MM, config */

/* Magic Mirror
 * Module: Remote Control
 *
 * By Joseph Bethge
 * MIT Licensed.
 */

Module.register("MMM-Remote-Control", {

	requiresVersion: "2.1.0",

	// Default module config.
	defaults: {
		// no config options at the moment
	},

	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);

		this.settingsVersion = 2;

		this.addresses = [];

		this.brightness = 100;
	},

	getStyles: function () {
		return ["remote-control.css"];
	},
/// comanda vocala ////
	notificationReceived: function (notification, payload, sender) {
		
		if (sender) {
			Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
			if (notification === "REMOTE_ACTION") {
				this.sendSocketNotification(notification, payload);
			}
			else if (notification === "FURNITURELEDON")  /// comanda vocala aici
			{	
				var self = this;
				fetch('http://192.168.1.200/?furnitureLedOn')
				.then((dataOn) => {
					self.sendNotification("FURNITURELEDON", { bedlight: true });
					fetch('http://192.168.1.104:8080/syslog?type=INFO&message=Living LED ON&silent=true');
				})
				this.sendSocketNotification(notification, payload);
			}
			else if (notification === "FURNITURELEDOFF")  /// comanda vocala aici
			{
				var self = this;
				fetch('http://192.168.1.200/?furnitureLedOff')
				.then((dataOff) => {
					self.sendNotification("FURNITURELEDON", { bedlight: false });
					fetch('http://192.168.1.104:8080/syslog?type=INFO&message=Living LED OFF&silent=true');
				})
				this.sendSocketNotification(notification, payload);
			}
		} else {
			if (notification === "DOM_OBJECTS_CREATED") {
				this.sendSocketNotification("REQUEST_DEFAULT_SETTINGS");
			}
		}
		
	},

	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		var modules = MM.getModules();
		if (notification === "FURNITURELEDON") {
			var self = this;	
			fetch('http://192.168.1.200/?furnitureLedOn')
				.then((dataOn) => {
					self.sendNotification("FURNITURELEDON", { bedlight: true });
					fetch('http://192.168.1.104:8080/syslog?type=INFO&message=Living LED ON&silent=true');
				})

		}
		if (notification === "FURNITURELEDOFF") {
			var self = this;
			fetch('http://192.168.1.200/?furnitureLedOff')
			.then((dataOff) => {
				self.sendNotification("FURNITURELEDON", { bedlight: false });
				fetch('http://192.168.1.104:8080/syslog?type=INFO&message=Living LED OFF&silent=true');
			})
		}
		if (notification === "UPDATE") {
			this.sendCurrentData();
		}
		if (notification === "IP_ADDRESSES") {
			this.addresses = payload;
			if (this.data.position) {
				this.updateDom();
			}
		}
		if (notification === "DEFAULT_SETTINGS") {
			var settingsVersion = payload.settingsVersion;

			if (settingsVersion === undefined) {
				settingsVersion = 0;
			}
			if (settingsVersion < this.settingsVersion) {
				if (settingsVersion === 0) {
					// move old data into moduleData
					payload = { moduleData: payload, brightness: 100 };
				}
			}

			var moduleData = payload.moduleData;
			var hideModules = {};
			for (var i = 0; i < moduleData.length; i++) {
				for (var k = 0; k < moduleData[i].lockStrings.length; k++) {
					if (moduleData[i].lockStrings[k].indexOf("MMM-Remote-Control") >= 0) {
						hideModules[moduleData[i].identifier] = true;
						break;
					}
				}
			}

			var modules = MM.getModules();

			var options = { lockString: this.identifier };

			modules.enumerate(function (module) {
				if (hideModules.hasOwnProperty(module.identifier)) {
					module.hide(0, options);
				}
			});

			this.setBrightness(payload.brightness);
		}
		if (notification === "BRIGHTNESS") {
			this.setBrightness(parseInt(payload));
		}
		if (notification === "REFRESH") {
			document.location.reload();
		}	
		
		if (notification === "RESTART") {
			setTimeout(function () {
				document.location.reload(); console.log('Delayed REFRESH');
			},  60000);
		}
		if (notification === "SHOW_ALERT") {
			this.sendNotification(notification, payload);
		}
		if (notification === "HIDE_ALERT") {
			this.sendNotification(notification);
		}
		if (notification === "HIDE" || notification === "SHOW") {
			var options = { lockString: this.identifier };
			var modules = MM.getModules();
			modules.enumerate(function (module) {
				if (module.identifier === payload.module) {
					if (notification === "HIDE") {
						module.hide(1000, options);
					} else {
						if (payload.force) {
							options.force = true;
						}
						module.show(1000, options);
					}
				}
			});
		}
		if (notification === "NOTIFICATION") {
			this.sendNotification(payload.notification, payload.payload);
		}
	},

	buildCssContent: function (brightness) {
		var css = "";

		var defaults = {
			"body": parseInt("aa", 16),
			"header": parseInt("99", 16),
			".dimmed": parseInt("66", 16),
			".normal": parseInt("99", 16),
			".bright": parseInt("ff", 16)
		};

		for (var key in defaults) {
			var value = defaults[key] / 100 * brightness;
			value = Math.round(value);
			value = Math.min(value, 255);
			if (value < 16) {
				value = "0" + value.toString(16);
			} else {
				value = value.toString(16);
			}
			var extra = "";
			if (key === "header") {
				extra = "border-bottom: 1px solid #" + value + value + value + ";"
			}
			css += key + " { color: #" + value + value + value + "; " + extra + "} ";
		}
		return css;
	},

	setBrightness: function (newBrightnessValue) {
		if (newBrightnessValue < 10) {
			newBrightnessValue = 10;
		}
		if (newBrightnessValue > 200) {
			newBrightnessValue = 200;
		}

		this.brightness = newBrightnessValue;

		var style = document.getElementById('remote-control-styles');
		if (!style) {
			// create custom css if not existing
			style = document.createElement('style');
			style.type = 'text/css';
			style.id = 'remote-control-styles';
			var parent = document.getElementsByTagName('head')[0];
			parent.appendChild(style);
		}

		if (newBrightnessValue < 100) {
			style.innerHTML = "";
			this.createOverlay(newBrightnessValue);
			return;
		}
		if (newBrightnessValue > 100) {
			style.innerHTML = this.buildCssContent(newBrightnessValue);
			this.removeOverlay();
			return;
		}
		// default brightness
		style.innerHTML = "";
		this.removeOverlay();
	},

	createOverlay: function (brightness) {
		var overlay = document.getElementById('remote-control-overlay');
		if (!overlay) {
			// if not existing, create overlay
			var overlay = document.createElement("div");
			overlay.id = "remote-control-overlay";
			var parent = document.body;
			parent.insertBefore(overlay, parent.firstChild);
		}
		var bgColor = "rgba(0,0,0," + (100 - brightness) / 100 + ")";
		overlay.style.backgroundColor = bgColor;
	},

	removeOverlay: function () {
		var overlay = document.getElementById('remote-control-overlay');
		if (overlay) {
			var parent = document.body;
			parent.removeChild(overlay);
		}
	},

	getDom: function () {
		var wrapper = document.createElement("div");
		if (this.addresses.length === 0) {
			this.addresses = ["ip-of-your-mirror"];
		}
		wrapper.innerHTML = "http://" + this.addresses[0] + ":8080/remote.html";
		wrapper.className = "normal xsmall";
		return wrapper;
	},

	sendCurrentData: function () {
		var self = this;

		var modules = MM.getModules();
		var currentModuleData = [];
		var index = 0;
		modules.enumerate(function (module) {
			currentModuleData.push({});
			currentModuleData[index]["hidden"] = module.hidden;
			currentModuleData[index]["lockStrings"] = module.lockStrings;
			currentModuleData[index]["name"] = module.name;
			currentModuleData[index]["identifier"] = module.identifier;
			currentModuleData[index]["position"] = module.data.position;
			currentModuleData[index]["config"] = module.config;
			currentModuleData[index]["path"] = module.data.path;
			index++;
		});
		var configData = {
			moduleData: currentModuleData,
			brightness: this.brightness,
			settingsVersion: this.settingsVersion
		};
		this.sendSocketNotification("CURRENT_STATUS", configData);
	}
});
