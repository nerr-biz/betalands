ig.module(
	'game.entities.orb'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntityOrb = ig.Entity.extend({
	size: {x: 16, y: 16},
	gravityFactor:0,
    color:'yellow',
    zIndex:-10,

    _wmScalable: false,
    _wmDrawBox: true,
    _wmBoxColor: 'rgba(196, 255, 0, 0.7)',
	
	// The fraction of force with which this entity bounces back in collisions
	//bounciness: 0.2, 
	
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
    rads:0,
			
	init: function( x, y, settings ) {
		this.parent( x, y, settings );

        var d = new Date();
        var min = d.getUTCMinutes();
        min = 1;
        var div = Math.floor(min/20);
        var gamemin = min - 20*div;
        var time = Math.floor(gamemin/2);

        this.setRads(time);
	},
    setRads: function(et)
    {
        var nightet = et+5;
        if(nightet > 10)
            nightet = et-5;

        if(this.color == 'white')
            et = nightet;

        this.rads = (180-(18*et)) * (Math.PI / 180.0);        
    },
    update: function(){

            //var currads = Math.atan2(-1*(this.pos.y - (ig.game.mainMap.height*ig.game.mainMap.tilesize)), this.pos.x - (ig.game.mainMap.width/2)*ig.game.mainMap.tilesize );///(Math.PI/180.0);
            this.rads = this.rads - ((Math.PI/(60*20))*ig.system.tick);
            if(this.rads < 0)
                this.rads = Math.PI;

            //curdegrees = curdegrees- (18*(et+1)*ig.system.tick);
            //var degrees = curdegrees;
            //var degrees=(180-(18*et));//-((18*(et+1)*ig.system.tick) );
            //var rads = degrees * (Math.PI / 180.0);
            var sunx = (ig.game.mainMap.width/2)*ig.game.mainMap.tilesize * Math.cos(this.rads);
            var suny = (ig.game.mainMap.height/2)*ig.game.mainMap.tilesize * Math.sin(this.rads);
            this.pos.x = sunx+(ig.game.mainMap.width/2)*ig.game.mainMap.tilesize;
            this.pos.y = (ig.game.mainMap.height*ig.game.mainMap.tilesize) - suny;
            //this.rads = rads;

        this.parent();
    },
    draw: function(reallyDraw) {
        if(reallyDraw){
        var ctx = ig.system.context;
        var s = ig.system.scale;
        var x = this.pos.x * s - ig.game.screen.x * s;
        var y = this.pos.y * s - ig.game.screen.y * s;
        var sizeX = this.size.x * s;
        var sizeY = this.size.y * s;
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(x,y,sizeX,sizeY);
        this.parent();
        ctx.restore();
        }
    }
    });	
});