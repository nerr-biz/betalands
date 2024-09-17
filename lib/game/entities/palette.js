ig.module(
	'game.entities.palette'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntityPalette = ig.Entity.extend({
	size: {x: 8, y: 8},
	gravityFactor:0,
    className:'palette',
    animSheet: new ig.AnimationSheet( 'media/grid8.png', 8, 8 ),

    r:0,
    g:0,
    b:0,
    h:0,
    s:100,
    hsl:true,
    l:0,
    eraser:false,
		
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
			
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
        if(this.eraser)
            this.addAnim( 'idle', 1, [0] );
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
        if(this.eraser){
            return this.parent();
        }
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
    rgbToHsl: function(){
        if(this.hsl)
            return [this.h,this.s,this.l];
    }
    });	
});