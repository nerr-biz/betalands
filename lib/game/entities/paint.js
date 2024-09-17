ig.module(
	'game.entities.paint'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntityPaint = ig.Entity.extend({
	size: {x: 8, y: 8},
	gravityFactor:0,

    r:0,
    g:0,
    b:0,
    h:0,
    s:100,
    hsl:true,
    l:0,
		
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
			
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
	},
    update: function(){
        this.parent();
    },
    color: function(){
        if(this.hsl)
            return 'hsl('+this.h+','+this.s+'%,'+this.l+'%)';
        return 'rgb('+this.r+','+this.g+','+this.b+')';
    },
    draw: function() {
        var ctx = ig.system.context;
        var s = ig.system.scale;
        var x = this.pos.x * s - ig.game.screen.x * s;
        var y = this.pos.y * s - ig.game.screen.y * s;
        var sizeX = this.size.x * s;
        var sizeY = this.size.y * s;
        ctx.save();
        ctx.fillStyle = this.color();
        ctx.fillRect(x,y,sizeX,sizeY);
        this.parent();
        ctx.restore();
    },
    /**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
    hslToRgb: function(){
        if(!this.hsl)
            return [this.r,this.g,this.b];
        var h = this.h/360;
        var s = this.s/100;
        var l = this.l/100;
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r * 255, g * 255, b * 255];
    },
    rgbToHsl: function(){
        if(this.hsl)
            return [this.h,this.s,this.l];
        var r = this.r;
        var g = this.g;
        var b = this.b;
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min){
            h = s = 0; // achromatic
        }else{
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)];
    }
    });	
});