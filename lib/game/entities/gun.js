ig.module(
	'game.entities.gun'
)
.requires(
	'impact.entity',
	'impact.timer',
    'game.entities.firework'
)
.defines(function(){
EntityGun = ig.Entity.extend({

	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
    fire:false,
    local:false,
    owner:'',
    sound:null,
    projectile:null,
    reload:1,
    flip:false,
			
	init: function( x, y, settings ) {
        this.reloadTimer = new ig.Timer(0);
		this.parent( x, y, settings );
	},
    shoot: function(r){
        this.fire = false;
        if (this.reloadTimer.delta() > 0) {
            if(this.local)
            {
                var player = ig.game.getEntitiesByType( EntityPlayer )[0];
                ig.game.socketEmit('inputchange', 'shoot', r, player.pos, player.vel);
            }
            if(this.sound && this.local)
                this.sound.play();
            ig.game.spawnEntity( this.projectile, this.pos.x, this.pos.y, {owner:this.owner, flip:this.flip, angle:r} );
            this.reloadTimer.set(this.reload);
        }
    }
    });

EntityBlaster = EntityGun.extend({
    className:'blaster',
    sound:null,
    projectile:EntityBullet,
    sound: new ig.Sound('media/sounds/blaster.ogg'),
    reload:1,
    update: function(){
        if(this.local && this.fire)
            this.shoot((this.flip ? Math.PI : 0));
        this.parent();
    }            
});

EntityCrackerlauncher = EntityGun.extend({
    className:'crackerlauncher',

    animSheet: new ig.AnimationSheet( 'media/gun.png', 16, 8 ),

    size: {x: 16, y: 8},
    sound: new ig.Sound('media/sounds/shoot.ogg'),
    projectile:EntityFirework,
            
    init: function( x, y, settings ) {
        this.addAnim( 'idle', 1, [0] );
        this.parent( x, y, settings );
    },
    update: function(){        
// Find the center of Player and move the bullet foward by 20px,
//var forward = 20;
//var sx = (this.pos.x + this.size.x/2) + (Math.cos(this.angle) * forward);
//var sy = (this.pos.y + this.size.y/2) + (Math.sin(this.angle) * forward);
//ig.game.spawnEntity(EntityBullet, sx, sy, {angle:this.angle});
        if(this.local)
        {
            var mx = (ig.input.mouse.x + ig.game.screen.x); //Figures out the x coord of the mouse in the entire world
            var my = (ig.input.mouse.y + ig.game.screen.y); //Figures out the y coord of the mouse in the entire world
            if(my > this.pos.y)
                my = this.pos.y;
            var r = Math.atan2(my-this.pos.y, mx-this.pos.x); //Gives angle in radians from player's location to the mouse location, assuming directly right is 0
            this.currentAnim.angle = r;
            if(this.fire)
                this.shoot(r);
        }
        this.parent();
    }
    });

});