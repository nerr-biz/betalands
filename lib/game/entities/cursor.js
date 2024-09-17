ig.module(
	'game.entities.cursor'
)
.requires(
	'impact.entity'
)
.defines(function(){
EntityCursor = ig.Entity.extend({
    size: {x: 8, y: 8},
    animVal:1,
    animImage:'media/bits.png',
    tileSize:8,
    color:null,
    flip:{x:false,y:false},
    cursorName:'',
    zIndex:20,

    init: function( x, y, settings ) {
        this.parent( x, y, settings );
        if(settings.animVal > 0)
        {
            this.animSheet = new ig.AnimationSheet( this.animImage, settings.size.x, settings.size.y ),
            this.addAnim( 'idle', 1, [this.animVal-1] );
            this.anims['idle'].flip = this.flip;
        }
    },
    draw: function()
    {
        if(ig.game.cursorOn)
        {
            if(this.color)
            {
                var ctx = ig.system.context;
                var s = ig.system.scale;
                var x = this.pos.x * s - ig.game.screen.x * s+1;
                var y = this.pos.y * s - ig.game.screen.y * s+1;
                var sizeX = this.size.x * s-2;
                var sizeY = this.size.y * s-2;
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.fillRect(x,y,sizeX,sizeY);
                this.parent();
                ctx.restore();
            }
            else
            {
                if(this.animImage == 'media/door.png')
                {
                    var ctx = ig.system.context;
                    var s = ig.system.scale;
                    var x = (this.pos.x - 16*3) * s - ig.game.screen.x * s;
                    var y = (this.pos.y -16*3)  * s - ig.game.screen.y * s;
                    var sizeX = this.size.x * 7 * s;
                    var sizeY = this.size.y * 3 * s;
                    ctx.save();
                    ctx.strokeStyle = "rgb(0,255,0)";
                    ctx.strokeRect(x,y,sizeX,sizeY);
                }
                ig.system.context.globalAlpha = 0.5;
                this.parent();
                ig.system.context.globalAlpha = 1;

                if(this.animImage == 'media/door.png')
                    ctx.restore();
            }
        }
    },
    flipImage: function(flip){
        if(this.cursorName == 'block')
            this.anims['idle'].flip = this.flip = flip;
    },

    update: function(){
        this.parent();
        x = ig.game._rscreen.x + ig.input.mouse.x;
        y = ig.game._rscreen.y + ig.input.mouse.y;
        x = Math.floor(x/this.tileSize);
        y = Math.floor(y/this.tileSize);
        x = x*this.tileSize;
        y = y*this.tileSize;

        this.pos.x = x;
        this.pos.y = y;
    }
});	
});