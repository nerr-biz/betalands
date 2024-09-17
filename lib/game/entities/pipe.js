ig.module(
	'game.entities.pipe'
)
.requires(
	'impact.entity',
	'impact.timer'
)
.defines(function(){
EntityPipe = ig.Entity.extend({
	size: {x: 8, y: 8},
	gravityFactor:0,
	seconds:3,
	water:{x:0,y:0},

    _wmScalable: false,
    _wmDrawBox: true,
    _wmBoxColor: 'rgba(196, 255, 0, 0.7)',
	
	// The fraction of force with which this entity bounces back in collisions
	//bounciness: 0.2, 
	
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
			
	init: function( x, y, settings ) {
		ig.game.stillWater = false;
		this.parent( x, y, settings );
		//this.timer = new ig.Timer(this.seconds);
	},
    update: function(){
    	if (ig.game.waterTimer.delta()){//this.timer.delta() < 0) {
            //ig.game.stillWater = false;
            //ig.game.convertWater = true;
    		//ig.game.spawnEntity( EntityWater, this.pos.x, this.pos.y, {vel:{x:this.water.x,y:this.water.y}});
            var wtype;
            if(this.water.x > 0)
                wtype = 2;
            else if(this.water.x < 0)
                wtype = 1;
            else
                wtype = (Math.random() > .5 ? 1 : 2);
            var done = false;
            if(this.water.y <= 0) //go up
                for(var y=this.pos.y;y>0;y-=8)
                {
                    if(done)
                        continue;
                    if(y<=0)
                        continue;
                    if(ig.game.waterMap.getTile(this.pos.x,y) > 0)
                        continue
                    else{
                        ig.game.waterMap.setTile(this.pos.x,y,wtype);
                        done = true;
                        ig.game.stillWater = false;
                        ig.game.convertWater = true;
                    }
                }
            else if(this.water.y > 0) //waterfall
            {
                if(ig.game.waterMap.getTile(this.pos.x,this.pos.y+8) == 0)
                {
                    ig.game.waterMap.setTile(this.pos.x,this.pos.y+8,wtype);
                    ig.game.stillWater = false;
                    ig.game.convertWater = true;
                }
            }
    		ig.game.waterLoose = true;
    	}
//    	else
//    		ig.game.waterLoose = false;
        this.parent();
    },
    draw: function() {
        this.parent();
        return;
        var ctx = ig.system.context;
        var s = ig.system.scale;
        var x = this.pos.x * s - ig.game.screen.x * s;
        var y = this.pos.y * s - ig.game.screen.y * s;
        var sizeX = this.size.x * s;
        var sizeY = this.size.y * s;
        ctx.save();
        ctx.fillStyle = 'green';
        ctx.fillRect(x,y,sizeX,sizeY);
        this.parent();
        ctx.restore();
    }
    });	
});