function Observable() {
		this.observers = [];
		this.addObserver = function addObserver(observer) {
			if (!this.observers)
				this.observers = [];
			this.observers.push(observer);
		}

		this.removeObserver = function removeObserver(observer) {
			var newObservers = [];
			var co;
			while (co = this.observers.pop()) {
				if (co != observer) newObservers.push(co)
			}
			this.observers = newObservers;
		}

		this.notify = function notify(event) {
			for (var i=0; i < this.observers.length; i++) {
				var o = this.observers[i];
				if (o[event]) {
					var args = [];
					for (var j=1; j < arguments.length; j++) {
					         	args.push(arguments[j])
					};
					o[event].apply(this, args);
				}
			};
		}
}
