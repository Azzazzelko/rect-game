module.exports = Audio = function(audio, volume){ 

	this.a = audio;
	this.a.volume = volume || 1;
	this.state = "stop";

	this.play = function(dontStop){
		if ( this.state == "play" && dontStop ){			//если еще не закончился предыдущий этот звук, то создаем новый звук и воспроизводим его, не мешая воспроизведению предыдущего.
			var a = document.createElement("audio");
			a.src = this.a.src;
			a.volume = this.a.volume;
			a.play();
		} else {
			this.a.play();
			this.state = "play";
			this.a.onended = function(){
				this.state = "stop";
			}.bind(this);
		};
	};

	this.pause = function(){
		this.a.pause();
		this.state = "pause";
	};

	this.stop = function(){
		this.a.pause();
		this.a.currentTime = 0;
		this.state = "stop";
	};

	this.setVolume = function(volume){
		this.a.volume = volume;
	};

};