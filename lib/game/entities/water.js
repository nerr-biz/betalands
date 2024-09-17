ig.module(
	'game.entities.water'
)
.requires(
	'impact.entity',
    'plugins.box2d.entity',
    'plugins.box2d.game'
)
.defines(function(){
EntityWater = ig.Box2DEntity.extend({
	size: {x: 4, y: 4},
	offset: {x: 0, y: 0},
	//maxVel: {x: 0, y: 0},

	//gravityFactor: 1,
	
	// The fraction of force with which this entity bounces back in collisions
	bounciness: 0.0, 
    friction: {x: 1, y: 0},
    pressure: 0,
	
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
    bounced: false,
    bounceCount:0,
    collided: false,
    lastx:0,
    lasty:0,
		
//	animSheet: new ig.AnimationSheet( 'media/bits.png', 3, 3 ),	
	
	init: function( x, y, settings ) {
//		this.addAnim( 'idle', 1, [4] );
        b2.Settings.timeToSleep=0.05;
        this.size.x = Math.random() < 0.5 ? 3 : 4;
        this.size.y = this.size.x;

		this.parent( x, y, settings );
        if(settings.vel)
            this.body.ApplyForce(new b2.Vec2(settings.vel.x, settings.vel.y), this.body.GetPosition());
	},
    update: function(){
        //if(ig.game.stillWater)
        //    this.kill();
        //else
        //    ig.game.waterMap.setTile(this.pos.x,this.pos.y,2);
        if(this.body.IsSleeping())
        {
            //ig.game.additem('bit', 4, this.pos.x,this.pos.y, {}, true);
            //this.kill();
        }
        //bottom limit
        if (this.pos.y > ig.game.mainMap.height * ig.game.mainMap.tilesize - (this.size.y))
        {
            this.kill();
        }
        //side limit
        if (this.pos.x > ig.game.collisionMap.width * ig.game.collisionMap.tilesize - (this.size.x))
        {
            this.kill();
        }
        if (this.pos.x < 0){
            this.kill();
        }
        this.parent();
    },
    createBody: function() {        
        //this.parent();
        //return;
        var bodyDef = new b2.BodyDef();
        bodyDef.position.Set(
            (this.pos.x + this.size.x / 2) * b2.SCALE,
            (this.pos.y + this.size.y / 2) * b2.SCALE
        );
        bodyDef.fixedRotation = true;
            
        this.body = ig.world.CreateBody(bodyDef);

        // These two lines define the shape
        // e.g. b2.PolygonDef, b2.CircleDef
        var shapeDef = new b2.CircleDef();
        shapeDef.radius = this.size.x * b2.SCALE;
            
        shapeDef.density = .1;
        shapeDef.friction = 0;
        this.body.CreateShape(shapeDef);
        this.body.SetMassFromShapes();    
    },
    draw: function() {
        /*
        ig.system.context.fillCircle = function (x, y, radius) {
            this.beginPath();
            //this.moveTo(x, y);
            this.arc(x, y, radius, 0, Math.PI * 2, false);
            this.fill();
        };
        var ctx = ig.system.context;
        var s = ig.system.scale;
        var x = this.pos.x * s - ig.game.screen.x * s;
        var y = this.pos.y * s - ig.game.screen.y * s;
        var sizeX = (this.size.x) * s;
        var sizeY = (this.size.y) * s;
        ctx.save();
        if(this.pressure > 10)
            ctx.fillStyle = 'red';
        else if(this.pressure >  5)
            ctx.fillStyle = 'yellow';
        else if(this.pressure > 0)
            ctx.fillStyle = 'green'
        else
            ctx.fillStyle = 'blue';
        if(this.bounced)
            ctx.fillStyle = 'purple';

        //x = ig.game._rscreen.x + ig.input.mouse.x;
        //y = ig.game._rscreen.y + ig.input.mouse.y;
        for(var i=-1;i<2;i++)
            for(var j=-1;j<2;j++){
                var cornerx=x+(i*8*s);
                var cornery=y+(j*8*s);
                cornerx = Math.floor(cornerx/(8*s));
                cornery = Math.floor(cornery/(8*s));
                cornerx = cornerx*8*s;
                cornery = cornery*8*s;
                //ctx.fillCircle(x+(this.size.x/2),y+(this.size.y/2),sizeX);
                //ctx.globalAlpha=.2;
                ctx.fillRect(cornerx,cornery,8*s,8*s);
                //ctx.globalAlpha=1;
            }

        this.parent();
        ctx.restore();*/
    }
    });	
});