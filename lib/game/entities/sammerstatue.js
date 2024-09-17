ig.module(
	'game.entities.sammerstatue'
)
.requires(
	'impact.entity'
)
.defines(function(){
	
EntitySammerstatue = ig.Entity.extend({
	size: {x: 32, y: 32},

	gravityFactor:0,
    zIndex:-10,
	
	type: ig.Entity.TYPE.NONE,
	//checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.NEVER,
			
	origSprite: 'media/custom32x32.png',
	animSheet: new ig.AnimationSheet( 'media/custom32x32.png', 32, 32 ),
	reflectsLight: false,

	body:null,
	head:null,
	headent:null,
	sammernum:0,
	
	init: function( x, y, settings ) {
		if(settings)
		{
			var body = settings['body'];
			this.origSprite = body['image'];
			if(settings['head'])
			{
				this.headent = ig.game.spawnEntity( EntitySammerhead, x, y, settings['head'] );
				this.headent.zIndex = this.zIndex + 1;
			}
		}
		this.parent( x, y, settings );
	},
	allAnim: function()
	{
		this.addAnim( 'idle', 1, [0] );
		this.addAnim( 'run', 0.08, [1,2,3,2] );
		this.addAnim( 'jump', 1, [4] );
		this.addAnim( 'fall', 0.4, [4] );
		this.addAnim( 'punchg', 0.5, [6]);
		this.addAnim( 'punchj', 0.5, [5]);
	},
    update: function(){
    	var player = ig.game.getEntitiesByType( EntityPlayer )[0];
		if(player.currentAnim == player.anims.idle)
			this.currentAnim = this.anims.idle;
		else if(player.currentAnim == player.anims.run)
			this.currentAnim = this.anims.run;
		else if(player.currentAnim == player.anims.jump)
			this.currentAnim = this.anims.jump;
		else if(player.currentAnim == player.anims.fall)
			this.currentAnim = this.anims.fall;
		else if(player.currentAnim == player.anims.punchg)
			this.currentAnim = this.anims.punchg;
		else if(player.currentAnim == player.anims.punchj)
			this.currentAnim = this.anims.punchj;
		else
			this.currentAnim = this.anims.idle;
		this.currentAnim.flip.x = player.currentAnim.flip.x;
		this.currentAnim.frame = player.currentAnim.frame;


        this.parent();
		if(this.headent)
		{
			this.headent.pos.x = this.pos.x+7;
			this.headent.pos.y = this.pos.y+2;
			this.headent.currentAnim.flip.x = this.flip;
			this.headent.accel.x = this.accel.x;
			this.headent.accel.y = this.accel.y;
			this.headent.vel.x = this.vel.x;
			this.headent.vel.y = this.vel.y;
			this.headent.currentAnim.flip.x = this.currentAnim.flip.x
		}
    },
    draw: function()
    {
    	var displayName = this.body.settings['name']
		var disp = displayName.substr(0,(displayName.length > 32 ? 32 : displayName.length));
		disp = displayName.length > 32 ? disp + '...' : disp;

		//ig.game.font.draw(this.name,(this.pos.x - ig.game.screen.x + 8),(this.pos.y - ig.game.screen.y + 32),ig.Font.ALIGN.CENTER);
		var shift = (this.sammernum % 2 == 0) ? 0 : 10;
		ig.game.font.draw(disp,(this.pos.x - ig.game.screen.x + 16),(this.pos.y - ig.game.screen.y + 32 + shift),ig.Font.ALIGN.CENTER);

    	displayName = this.body.settings['owner']
		var disp = displayName.substr(0,(displayName.length > 32 ? 32 : displayName.length));
		disp = displayName.length > 32 ? disp + '...' : disp;
		ig.system.context.globalAlpha = 0.5;
		ig.game.font.draw(disp,(this.pos.x - ig.game.screen.x + 16),(this.pos.y - ig.game.screen.y - 32),ig.Font.ALIGN.CENTER);
		ig.system.context.globalAlpha = 1;

		this.parent();
    }
});

EntitySammerhead = ig.Entity.extend({
	
	size: {x: 16, y:16},
	type: ig.Entity.TYPE.NONE, // Player friendly group
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
	reflectsLight:false,
	gravityFactor:0,
		
	init: function( x, y, settings ) {
		this.origSprite = settings['image'];
		this.parent( x, y, settings );
	},
	allAnim:function(){
		this.addAnim( 'idle', 1, [0] );
	},	
	update: function() {
		this.currentAnim = this.anims.idle;
        this.parent();
	}
});

});