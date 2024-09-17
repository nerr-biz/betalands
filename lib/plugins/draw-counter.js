ig.module(
	'plugins.draw-counter'
)
.requires(
	'impact.image'
)
.defines(function() {
	
	ig.DrawCounter = ig.Class.extend({
	
		init: function() {
			this.imageCountLastFrame = 0;
			this.imageCount = 0;
			this.intervals = 0;
			this.totalFramesRendered = 0;
			this.totalIntervals = 0;
		},
		
		/**
		* This is called from Image once you "enable" ig.DrawCounter
		*/
		addDrawCall: function() {
			this.imageCount++;
		},

		/**
		*
		* Call this method inside a overriden "draw" method of a Game, before "this.parent()" is called
		*/
		addInterval: function() {
			this.imageCountLastFrame = this.imageCount;
			this.imageCount = 0;
			this.intervals++;
		},
		
		/**
		* Called if ig.DrawCounter.enable was initialized with no arguments, or trackFrameRate was set to true
		*
		*/
		setFrameCountTimer: function() {
			if (this.intervals > 0) {
				this.totalFramesRendered += this.intervals;
				this.totalIntervals += 1;
				this.fps = Math.floor(this.totalFramesRendered / this.totalIntervals);
				this.intervals = 0;
			}
			window.setTimeout(function() { ig.drawCounter.setFrameCountTimer(); }, 1000);
		}

	});
	
	/**
	* @param trackFrameRate		true = keep track of frame rate (fps), default is true
	*
	*/
	ig.DrawCounter.enable = function(trackFrameRate) {
		
		ig.drawCounter = new ig.DrawCounter();
		
		ig.Image.inject({

			draw: function(x, y) {
				this.parent(x, y);
				ig.drawCounter.addDrawCall();
			},
			
			drawTile: function(x, y, t, w, h, flipX, flipY) {
				this.parent(x, y, t, w, h, flipX, flipY);
				ig.drawCounter.addDrawCall();
			}	
			
		});
		
		if (typeof trackFrameRate == 'undefined' || trackFrameRate) {
			ig.drawCounter.setFrameCountTimer();
		}
		
	};
	

	
});
	