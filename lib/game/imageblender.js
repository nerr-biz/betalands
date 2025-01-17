ig.module(
	'game.imageblender'
).requires(
    'impact.image'
).defines(function () {

ig.Image.inject({
    
    onload: function( event ) {
        this.parent( event );

		var hashIndex = this.path.indexOf("#");
		if (hashIndex !== -1) {

			this.convertToCanvas();

			// Multiply algorithm based on https://github.com/Phrogz/context-blender

			var ctx = this.data.getContext("2d");
			var imgData = ctx.getImageData(0, 0, this.data.width, this.data.height);
			var src = imgData.data;
			var sA, dA = 1, len = src.length;
			var sRA, sGA, sBA, dA2, demultiply;
			var dRA = parseInt(this.path.substr(hashIndex + 1, 2), 16) / 255;
			var dGA = parseInt(this.path.substr(hashIndex + 3, 2), 16) / 255;
			var dBA = parseInt(this.path.substr(hashIndex + 5, 2), 16) / 255;

			for (var px = 0; px < len; px += 4) {
				sA  = src[px+3] / 255;
				dA2 = (sA + dA - sA * dA);
				sRA = src[px  ] / 255 * sA;
				sGA = src[px+1] / 255 * sA;
				sBA = src[px+2] / 255 * sA;

				demultiply = 255 / dA2;

				src[px  ] = (sRA*dRA + dRA*(1-sA)) * demultiply;
				src[px+1] = (sGA*dGA + dGA*(1-sA)) * demultiply;
				src[px+2] = (sBA*dBA + dBA*(1-sA)) * demultiply;
			}

			ctx.putImageData(imgData, 0, 0);
		}
		var lightIndex = this.path.indexOf("?");
		if (lightIndex !== -1) {

			this.convertToCanvas();
			var lightlevel = (10 - parseInt(this.path.substr(lightIndex+1))) * 10;

			// Multiply algorithm based on https://github.com/Phrogz/context-blender

			var ctx = this.data.getContext("2d");
			var imgData = ctx.getImageData(0, 0, this.data.width, this.data.height);
			var data = imgData.data;
			var sA, dA = 1, len = data.length;
			var sRA, sGA, sBA, dA2, demultiply;
			//var dRA = parseInt(this.path.substr(lightIndex + 1, 2), 16) / 255;
			//var dGA = parseInt(this.path.substr(lightIndex + 3, 2), 16) / 255;
			//var dBA = parseInt(this.path.substr(lightIndex + 5, 2), 16) / 255;

			for (var i = 0; i < len; i += 4) {
				var average = Math.round( ( data[i] + data[i+1] + data[i+2] ) / 3 );
				if(average == 0)
					continue;
				data[i] -= ( data[i]/average ) * lightlevel;
				data[i+1] -= ( data[i+1]/average ) * lightlevel;
				data[i+2] -= ( data[i+2]/average ) * lightlevel;
				if(data[i] < 0)
					data[i] = 0;
				if(data[i+1] < 0)
					data[i+1] = 0;
				if(data[i+2] < 0)
					data[i+2] = 0;
			}

			ctx.putImageData(imgData, 0, 0);
		}
    },

	convertToCanvas: function () {
		if (this.data.getContext) { // Check if it's already a canvas
			return;
		}

		var orig = ig.$new('canvas');
		orig.width = this.width;
		orig.height = this.height;
		orig.getContext('2d').drawImage( this.data, 0, 0, this.width, this.height, 0, 0, this.width, this.height );
		this.data = orig;
	}
    
});


});