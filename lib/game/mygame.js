ig.module(
  'game.mygame'
)
  .requires(
    'impact.game',
    'impact.font',
    //'impact.debug.debug',

    'game.imageblender',

    'game.entities.player',
    'game.entities.playerremote',
    'game.entities.door',
    'game.entities.pipe',
    'game.entities.sign',
    'game.entities.makerbot',
    'game.entities.youtube',
    'game.entities.goomba',
    'game.entities.fish',
    //'game.entities.bat',
    'game.entities.ghost',
    'game.entities.boat',
    'game.entities.cursor',
    'game.entities.orb',
    'game.entities.switchblock',
    'game.entities.spikeblock',
    'game.entities.coin',
    'game.entities.platform',
    'game.entities.target',
    'game.entities.palette',
    'game.entities.paint',
    'game.entities.custom',
    'game.entities.sammerstatue',
    'game.entities.gift2013',

    'plugins.draw-counter',
    'plugins.screen-fader'
  )
  .defines(function () {

    ig.Input.inject({
      trigger: function (action) {
        this.actions[action] = true;
        this.presses[action] = true;
        this.delayedKeyup[action] = true;
      }
    });

    BackgroundMapXScroll = ig.BackgroundMap.extend({
      setScreenPos: function (x, y) {
        this.scroll.x = x / 16;
        this.scroll.y = y / 1.1;
        // ignore y
        //    this.parent(x,y);
      },
      draw: function () {
        ig.system.context.globalAlpha = .6;
        this.parent();
        ig.system.context.globalAlpha = 1;
      }
    });
    ig.BackgroundMap.inject({

      visible: true,

      draw: function () {
        if (!this.visible) {
          return;
        }
        this.parent();
      }

    });
    ig.Entity.inject({

      aFrameX: 0,
      aFrameY: 0,
      reflectsLight: false,
      origSprite: null,
      currSprite: '',
      setLight: function (level) {
        var newsprite = this.origSprite;
        //if(level > 0)
        //  newsprite = this.origSprite + '?'+level;
        if (this.currSprite == newsprite || newsprite.indexOf('base64') > -1)
          return;
        this.animSheet = new ig.AnimationSheet(newsprite, this.aFrameX, this.aFrameY);
        this.allAnim();
        this.currSprite = newsprite;
      },
      init: function (x, y, settings) {
        if (settings && settings.width) {
          settings['size'] = { x: settings.width, y: settings.height };
        }
        if (this.aFrameX == 0) {
          if (settings && settings.width) {
            this.aFrameX = settings.size.x;
            this.aFrameY = settings.size.y;
          }
          else {
            this.aFrameX = this.size.x;
            this.aFrameY = this.size.y;
          }
        }
        var sprite = this.origSprite;
        if (settings && settings.origSprite)
          sprite = settings.origSprite;
        if (sprite)
          this.animSheet = new ig.AnimationSheet(sprite, this.aFrameX, this.aFrameY);
        this.parent(x, y, settings);
        if (this.origSprite)
          this.allAnim();
      },
      update: function () {
        this.parent();
        if (this.reflectsLight)
          this.setLight(ig.game.lightMap.getTile(this.pos.x, this.pos.y));
      }
    });

    MyGame = ig.Game.extend({
      isSpectating: false,
      lastTick: 0.016, realTime: 0,

      gravity: 300, // All entities are affected by this

      // Load a font
      font: new ig.Font('media/04b03.font.png'),
      inventory: {
        bit: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        block: { 1: 0, 2: 0, 3: 0, 4: 0 },
        sign: { 1: 0 },
        lantern: { 1: 0 },
        bomb: { 1: 0 }
      },
      levelLoaded: false,
      selectedItemName: 'bit',
      selectedItemValue: '1',
      selectedFrame: '1',
      selectedFrameSet: '0',
      selectedLayer: '1',
      lastLevel: '',
      lastLevelSettings: {},
      lastLevelPos: { x: 0, y: 0 },
      currentLevel: 'LevelTest',
      levelTitle: '',
      levelSettings: {},
      enterLevelPos: false,
      inArena: false,
      inLevel: false,
      inRoom: false,
      inEditor: false,
      ignoreInventory: false,
      isOutside: true,
      bigArea: false,
      levelOwner: '',
      spawnDoor: '',
      bitsMap: null,
      bitsBGMap: null,
      mainMap: null,
      tileMaps: [],
      tileMaps2: [],
      darkMap: null,
      lightData: null,
      waterMap: null,
      blankWaterMapData: null,
      lastWaterMapString: '',
      lastWaterMap: null,
      waterStillCount: 0,
      inMenu: false,
      inMenuTravel: null,
      billboardMessage: '',
      theplayer: null,
      cursorOn: false,
      deaths: 0,
      lasthit: '',
      goombaSpawns: [],
      moverSpawns: [],
      goombaTimer: new ig.Timer(5),
      waterTimer: new ig.Timer(.05),
      stillWater: false,
      convertWater: true,
      darkLevel: 0,
      sun: null,
      moon: null,
      levelDeaths: 0,
      levelCoins: 0,
      totalCoins: 0,
      startLevel: null,
      lanternOn: false,
      lastCursorPos: '',
      itemId: '',
      itemEditing: null,
      tileFlipped: { x: false, y: false },
      copiedFrame: [],
      shiftedFrame: [],
      shiftedDirections: { x: 0, y: 0 },
      shifting: false,
      /* moved to extend call
      init: function() {
    
        //ig.CollisionMap.defaultTileDef[46] = [1,0, 1,1,ig.CollisionMap.SOLID];
      
        //ig.DrawCounter.enable();
        
        // Bind keys
        ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
        ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
        ig.input.bind( ig.KEY.UP_ARROW, 'jump' );
        ig.input.bind( ig.KEY.DOWN_ARROW, 'down' );
        ig.input.bind( ig.KEY.A, 'left' );
        ig.input.bind( ig.KEY.D, 'right' );
        ig.input.bind( ig.KEY.W, 'jump' );
        ig.input.bind( ig.KEY.S, 'down' );
        ig.input.bind( ig.KEY.SPACE, 'action' );
        ig.input.bind( ig.KEY.ENTER, 'action' );
    
        ig.input.bind( ig.KEY.MOUSE1, 'click' );
        ig.input.bind( ig.KEY.MOUSE2, 'click2' );
    
        this.inventory =getUserInfo().inventory;
    
        this.loadLevel(this.startLevel);
      },*/

      update: function () {

        if (!this.levelLoaded)
          return;

        if (this.inMenu) {
          if (this.inMenuTravel) {
            if (ig.input.pressed("down") || ig.input.pressed("jump") || ig.input.pressed("left") || ig.input.pressed("right") || ig.input.pressed("action")) {
              if (ig.input.pressed("jump") && this.inMenuTravel.target[1]) {
                var split = this.inMenuTravel.target[1].split("-");
                var level = split[0];
                if (level != ig.game.currentLevel)
                  socket.emit('changelevel', level, this.inMenuTravel.target[1]);
              }
              if (ig.input.pressed("right") && this.inMenuTravel.target[2]) {
                var split = this.inMenuTravel.target[2].split("-");
                var level = split[0];
                if (level != ig.game.currentLevel)
                  socket.emit('changelevel', level, this.inMenuTravel.target[2]);
              }
              if (ig.input.pressed("down") && this.inMenuTravel.target[3]) {
                var split = this.inMenuTravel.target[3].split("-");
                var level = split[0];
                if (level != ig.game.currentLevel)
                  socket.emit('changelevel', level, this.inMenuTravel.target[3]);
              }
              if (ig.input.pressed("left") && this.inMenuTravel.target[4]) {
                var split = this.inMenuTravel.target[4].split("-");
                var level = split[0];
                if (level != ig.game.currentLevel)
                  socket.emit('changelevel', level, this.inMenuTravel.target[4]);
              }
              this.inMenu = false;
              this.inMenuTravel = null;
              this.billboardMessage = '';
            }
          }
          else if (ig.input.pressed("action")) {
            this.inMenu = false;
            this.billboardMessage = '';
          }
          return;
        }

        if (this.waterTimer.delta() > 0) {

          if (this.waterMap && !this.stillWater) {
            var thisWaterMapString = JSON.stringify(this.waterMap.data);
            if (this.lastWaterMapString == thisWaterMapString) {
              this.waterStillCount++;
              if (this.waterStillCount > 30) {
                this.stillWater = true;
                this.convertWater = false;
                this.waterStillCount = 0;
                console.log('still water');
                //fix water
                for (var i = 2; i < this.waterMap.height - 2; i++) //left to right
                {
                  for (var j = 2; j < this.waterMap.width - 2; j++) {
                    if (this.waterMap.data[i][j] > 0) //water
                    {
                      //this.setWater(i,j,true);
                      if (this.isNotWater(i, j - 1)) //empty space
                      {
                        if (this.isNotWater(i, j - 2)) //still nothing
                        {
                          //this.setWater(i,j,false); //delete
                        }
                        else {
                          this.setWater(i, j - 1, true); //fill in the gap
                        }
                      }
                      if (this.isNotWater(i, j + 1)) //empty space
                      {
                        if (this.isNotWater(i, j + 2)) //still nothing
                        {
                          //this.setWater(i,j,false);
                        }
                        else
                          this.setWater(i, j + 1, true);
                      }
                    }
                  }
                }
                for (var i = this.waterMap.height - 3; i > 1; i--) //right to left
                {
                  for (var j = this.waterMap.width - 3; j > 1; j--) {
                    if (this.waterMap.data[i][j] > 0) //water
                    {
                      //this.setWater(i,j,true);
                      if (this.isNotWater(i, j - 1)) //empty space
                      {
                        if (this.isNotWater(i, j - 2)) //still nothing
                        {
                          //this.setWater(i,j,false); //delete
                        }
                        else {
                          this.setWater(i, j - 1, true); //fill in the gap
                        }
                      }
                      if (this.isNotWater(i, j + 1)) //empty space
                      {
                        if (this.isNotWater(i, j + 2)) //still nothing
                        {
                          //this.setWater(i,j,false);
                        }
                        else
                          this.setWater(i, j + 1, true);
                      }
                    }
                  }
                }
                thisWaterMapString = JSON.stringify(this.waterMap.data);
              }
            }
            else
              this.waterStillCount = 0;
            this.lastWaterMapString = thisWaterMapString;
            this.lastWaterMap.data = ig.copy(this.waterMap.data);
          }
          if (this.waterMap && this.convertWater) {
            var newwaterdata = ig.copy(this.waterMap.data);
            for (var i = 0; i < this.waterMap.height; i++) {
              for (var j = 0; j < this.waterMap.width - 1; j++) {
                var waterval = this.waterMap.data[i][j];
                if (waterval > 0 && waterval < 3) //3&4 is fixed water
                {
                  if (i + 1 >= this.waterMap.height || j - 1 < 0 || j + 1 >= this.waterMap.width || this.isFixedWater(i + 1, j)) //ocean below, so die
                  {
                    newwaterdata[i][j] = 0;
                    this.stillWater = false;
                  }
                  else if (this.isNotWater(i + 1, j) && newwaterdata[i + 1][j] == 0) //empty space below
                  {
                    newwaterdata[i + 1][j] = waterval;
                    newwaterdata[i][j] = 0;
                    this.stillWater = false;
                  }
                  else if (this.isNotWater(i, j - 1) && newwaterdata[i][j - 1] == 0 && (waterval == 1 || !this.isNotWater(i, j + 1))) //empty space to left
                  {
                    var pushwater = false;
                    if (waterval == 1)
                      pushwater = true;
                    else if (waterval == 2) {
                      var done = false;
                      for (var loop = j; loop < this.waterMap.width; loop++) {
                        if (done)
                          continue;
                        if (newwaterdata[i][loop] == 0)
                          done = true;
                        else if (newwaterdata[i][loop] > 0 && newwaterdata[i - 1][loop] > 0)
                          pushwater = true;
                      }
                    }
                    if (pushwater) {
                      newwaterdata[i][j - 1] = 1;
                      newwaterdata[i][j] = 0;
                      this.stillWater = false;
                    }

                  }
                  else if (this.isNotWater(i, j + 1) && newwaterdata[i][j + 1] == 0 && (waterval == 2 || !this.isNotWater(i, j - 1))) //empty space to right
                  {
                    var pushwater = false;
                    if (waterval == 2)
                      pushwater = true;
                    else if (waterval == 1) {
                      var done = false;
                      for (var loop = j; loop > 0; loop--) {
                        if (done)
                          continue;
                        if (newwaterdata[i][loop] == 0)
                          done = true;
                        else if (newwaterdata[i][loop] > 0 && newwaterdata[i - 1][loop] > 0)
                          pushwater = true;
                      }
                    }
                    if (pushwater) {
                      newwaterdata[i][j + 1] = 2;
                      newwaterdata[i][j] = 0;
                      this.stillWater = false;
                    }
                  }
                }

              }
            }
            this.waterMap.data = newwaterdata;
          }

          this.waterTimer.reset();
        }

        if (this.currentLevel == 'LevelHell' && this.goombaTimer.delta() > 0) {
          var gs = ig.game.getEntitiesByType(EntityGoomba);
          if (gs.length < this.goombaSpawns.length) {
            //spawn
            var spawn = Math.floor(Math.random() * this.goombaSpawns.length);
            spawn = this.goombaSpawns[spawn];
            this.spawnEntity(EntityGoomba, spawn.x, spawn.y);
          }
          this.goombaTimer.reset();
        }

        //var player = this.getEntitiesByType( EntityPlayer )[0];
        if (this.getEntitiesByType(EntityPlayer).length == 0)
          var player = new EntityPlayer;
        else
          var player = this.getEntitiesByType(EntityPlayer)[0];


        var mouseClicked = ig.input.pressed('click');
        var mousePressed = ig.input.state('click') && !mouseClicked && this.inEditor; //holding it down

        if (mouseClicked || mousePressed) {


          var m_x = ig.game._rscreen.x + ig.input.mouse.x;
          var m_y = ig.game._rscreen.y + ig.input.mouse.y;

          if (this.selectedItemName == 'move') {
            player.moveTo = { x: m_x, y: m_y };
          }
          else {

            var allowclick = true;
            var csize = { x: 8, y: 8 };
            var cursorTileSize = 0;
            var cursor = this.getEntitiesByType(EntityCursor)[0];
            if (cursor)// && !cursor.color)
            {
              csize = cursor.size;
              csize.x = csize.x;
              csize.y = csize.y;
              cursorTileSize = cursor.tileSize;
            }

            var tileSize = (cursorTileSize > 0) ? cursorTileSize : 8; // configure here
            if (this.selectedItemName == 'hand' && this.inEditor)
              tileSize = 4;
            var pos = this.reposition(m_x, m_y, tileSize);
            var pos8 = this.reposition(m_x, m_y, 8);
            var x = pos.x;
            var y = pos.y;
            if (mousePressed && ig.game.lastCursorPos == x + '-' + y) {
              allowclick = false;
            }
            ig.game.lastCursorPos = x + '-' + y;
            cblocks = { 'x': Math.ceil(csize.x / 8) - 1, 'y': Math.ceil(csize.y / 8) - 1 };

            //check for player room clicks
            var split = this.currentLevel.split("|");
            if (this.inArena || ((this.inRoom || this.inLevel || this.currentLevel.indexOf('|') > -1) && this.levelOwner != playerinfo.username && playerinfo.username != 'Francis'))
              allowclick = false;
            if (this.inEditor && pos8.x >= 16 * 11 && pos8.x <= 16 * 19 - 4 && pos8.y >= 16 && pos8.y <= 8 + 16 * 8 && this.selectedItemName != 'palette' && this.selectedItemName != 'hand')
              allowclick = false;

            //check if entity clicked
            var onproperty = false;
            if (allowclick && !this.inLevel && !this.inRoom && this.currentLevel.indexOf('|') == -1 && this.selectedItemName != 'bit' && playerinfo.username != 'Francis') {
              var doors = this.getEntitiesByType('EntityDoor');
              for (var d = 0; d < doors.length; d++) {
                e = doors[d];
                var doorname = '';
                if (e.name)
                  doorname = e.name.split('-')[1];
                var fakedoor = { pos: { x: e.pos.x - 16 * 3, y: e.pos.y - 16 * 3 }, size: { x: e.size.x * 7, y: e.size.y * 3 } };
                if (this.isCollisionEntity(fakedoor, x, y, cblocks.x, cblocks.y)) {
                  if (doorname == playerinfo.username) {
                    onproperty = true;
                    break;
                  }
                  else if (doorname.split('*')[0] == playerinfo.username) {
                    onproperty = true;
                    break;
                  }
                  if (this.selectedItemName != 'hand') {
                    allowclick = false; //on someone else's property
                    break;
                  }
                }
              }
            }
            //if block and not on property
            if (allowclick && this.currentLevel.indexOf('|') == -1 && !this.inRoom && !this.inLevel && (this.selectedItemName == 'block' || this.selectedItemName == 'eraser') && playerinfo.username != 'Francis' && !onproperty)
              allowclick = false;

            var ignorecollision = false;
            if (this.selectedItemName == 'block' || this.selectedItemName == 'eraser' || this.selectedItemName == 'hand')
              ignorecollision = true;

            if (this.selectedItemName == 'hand' && !allowclick) {
              for (var i = 0; i < this.entities.length; i++) {
                e = this.entities[i];
                if (e instanceof EntityPlayerbase)
                  e.displayName = e.name;
              }
            }


            if (allowclick) {

              //if no collision or you are placing a background block (46 is pass-through collision)
              //if((this.selectedItemName == 'block' && this.selectedItemValue == 1) || (this.selectedItemName == 'block' && !this.isCollisionPass(x,y,cblocks.x, cblocks.y) || !this.isCollision(x,y,cblocks.x, cblocks.y))){ 
              if (ignorecollision || !this.isCollision(x, y, cblocks.x, cblocks.y)) {
                var onentity = onmakerbot = entityon = onpalette = onpaint = false;

                //check if entity clicked
                for (var i = 0; i < this.entities.length; i++) {
                  e = this.entities[i];
                  if (e instanceof EntityCursor || e instanceof EntityPipe)
                    continue;
                  if (this.isCollisionEntity(e, x, y, cblocks.x, cblocks.y)) {
                    if (e instanceof EntityMakerbot)
                      onmakerbot = true;
                    if (e instanceof EntityPalette) {
                      if (this.isCollisionEntity(e, pos8.x, pos8.y, 0, 0) || this.itemEditing)
                        onpalette = true;
                      else
                        continue;
                    }
                    if (e instanceof EntityPaint) {
                      if (this.isCollisionEntity(e, pos8.x, pos8.y, 0, 0) || this.itemEditing)
                        onpaint = true;
                      else
                        continue;
                    }
                    if (e instanceof EntityGun)
                      continue;
                    if (e instanceof EntityPlayerhead)
                      continue;
                    entityon = e;
                    onentity = true;
                    if (!e instanceof EntityTarget)
                      break;
                  }
                }
                if (onentity && (entityon instanceof EntityTarget || onpalette || onpaint))
                  ignorecollision = true;

                //check inventory to place item
                //if(!onentity || (this.selectedItemName == 'bit' && onmakerbot !== false) || (this.selectedItemName == 'block' && (this.selectedItemValue == 1 || this.selectedItemValue == 4))){
                if (!onentity || ignorecollision || (this.selectedItemName == 'bit' && onmakerbot !== false)) {
                  var inventorycount = 0;
                  if (!ignorecollision) {
                    if (typeof ig.game.inventory[this.selectedItemName] === 'undefined')
                      ig.game.inventory[this.selectedItemName] = [];
                    if (typeof ig.game.inventory[this.selectedItemName][this.selectedItemValue] === 'undefined')
                      ig.game.inventory[this.selectedItemName][this.selectedItemValue] = 0;
                    inventorycount = ig.game.inventory[this.selectedItemName][this.selectedItemValue];
                    if ((this.selectedItemName == 'custom' && this.levelOwner == playerinfo.username) || (this.selectedItemName == 'gift2013' && playerinfo.username == 'Francis'))
                      inventorycount = 1;
                  }
                  if (inventorycount > 0 || ig.game.ignoreInventory || ignorecollision) {
                    //erase block
                    if (this.selectedItemName == 'eraser') {
                      if (this.selectedLayer == '2') {
                        var blockval = this.getTile(x, y, this.selectedLayer);
                        if (blockval > 0)
                          this.pickupitem('block2', blockval, x, y);
                      }
                      else {
                        var blockval = this.getTile(x, y, this.selectedLayer);
                        if (blockval > 0)
                          this.pickupitem('block', blockval, x, y);
                      }
                    }//pickup item
                    else if (this.selectedItemName == 'hand' || onpalette) {
                      if (onentity) {
                        var itemname = '';
                        var itemval = 1;
                        if (entityon instanceof EntityYoutube)
                          itemname = 'youtube';
                        else if (entityon instanceof EntitySign)
                          itemname = 'sign';
                        else if (entityon instanceof EntityGoomba && this.levelOwner == playerinfo.username)
                          itemname = 'goomba';
                        else if (entityon instanceof EntitySwitchblock)
                          itemname = 'switchblock';
                        else if (entityon instanceof EntityCoin)
                          itemname = 'coin';
                        else if (entityon instanceof EntityCustom) {
                          itemname = 'custom';
                          itemval = entityon.itemid;
                        }
                        else if (entityon instanceof EntityDoor) {
                          /* TODO: disable doors */
                          var doorname = entityon.name.split('-')[1];
                          if (doorname == playerinfo.username || (doorname.indexOf('*') == -1 && playerinfo.username == 'Francis'))
                            itemname = 'door';
                          else if (doorname.split('*')[0] == playerinfo.username || playerinfo.username == 'Francis') {
                            itemname = 'door';
                            itemval = entityon.doortype;
                          }
                        }
                        else if (!(entityon instanceof EntityPlayer) && entityon.className) {
                          itemname = entityon.className;
                        }
                        else if (entityon instanceof EntityPlayerbase)
                          entityon.displayName = entityon.name;

                        if (onpalette)
                          this.selectPalette(entityon);
                        else if (onpaint)
                          this.selectPalette(entityon);
                        else if (itemname != '' && (itemname != 'gift2013' || playerinfo.username == 'Francis') && (itemname != 'fish' || this.levelOwner == playerinfo.username))
                          this.pickupitem(itemname, itemval, entityon.pos.x, entityon.pos.y);
                      }
                      else
                        this.attemptToPickupBit(x, y);
                    }
                    else //place inventory, check if we need to run makerbot
                    {
                      this.placeitem(this.selectedItemName, this.selectedItemValue, x, y);
                      if (onmakerbot !== false && this.selectedItemName == 'bit') {
                        //check if complete
                        entityon.checkComplete(this.selectedItemName, this.selectedItemValue, x, y);
                      }
                    }
                  }
                }
              }
              //else pick up a bit if there (so they dont HAVE to use the hand)
              else {
                this.attemptToPickupBit(x, y);
                //this.attemptToPickupPalette(x,y);
              }

            }//end allowclick
          }//end if not move
        }//end if click pressed

        if ((ig.input.pressed('left') || player.autoMove.x < 0) && !player.spectator) {
          if (this.inEditor && this.shifting)
            this.shiftFrame(-1, 0);
          else {
            player.pressed.left = true;
            player.pressed.right = false;
            this.socketEmit('inputchange', { key: 'left', pressed: true, pos: player.pos, vel: player.vel });
          }
        }
        if ((ig.input.pressed('right') || player.autoMove.x > 0) && !player.spectator) {
          if (this.inEditor && this.shifting)
            this.shiftFrame(1, 0);
          else {
            player.pressed.right = true;
            player.pressed.left = false;
            this.socketEmit('inputchange', { key: 'right', pressed: true, pos: player.pos, vel: player.vel });
          }
        }
        if (ig.input.pressed('action') && !player.punching && !player.spectator) {
          player.pressed.action = true;
          this.socketEmit('inputchange', { key: 'action', pressed: true, pos: player.pos, vel: player.vel });
        }
        if ((ig.input.pressed('jump') || player.autoMove.y < 0) && (player.standing || player.swimming || player.onwall != 0 || (player.jumps < 2 && this.inArena))) {
          if (this.inEditor && this.shifting)
            this.shiftFrame(0, -1);
          else {
            var ondoor = false;
            var doors = ig.game.getEntitiesByType(EntityDoor);
            for (var i = 0; i < doors.length; i++) {
              var checkplayer = doors[i];
              if (checkplayer.direction == 'down' || checkplayer.direction == 'action')
                continue;
              if ((checkplayer.pos.x > player.pos.x + player.size.x || (checkplayer.pos.x + checkplayer.size.x) < player.pos.x) || (checkplayer.pos.y + 1 > player.pos.y + player.size.y || checkplayer.pos.y + checkplayer.size.y < player.pos.y))
                continue;
              ondoor = true;
              break;
            }
            if (!ondoor || this.inArena) {
              player.pressed.up = true;
              this.socketEmit('inputchange', { key: 'up', pressed: true, pos: player.pos, vel: player.vel });
            }
          }
        }
        if (ig.input.pressed('down')) {
          if (this.inEditor && this.shifting)
            this.shiftFrame(0, 1);
        }
        var touchStop = (player.autoMove.x == 'stop');
        if ((ig.input.released('left') || (touchStop)) && !player.spectator) {
          player.autoMove.x = 0;
          player.pressed.left = false;
          var data = { key: 'left', pressed: false, pos: player.pos, vel: player.vel }
          this.socketEmit('inputchange', data.key, data.pressed, data.pos, data.vel);
        }
        if ((ig.input.released('right') || (touchStop)) && !player.spectator) {
          player.autoMove.x = 0;
          player.pressed.right = false;
          var data = { key: 'right', pressed: false, pos: player.pos, vel: player.vel }
          this.socketEmit('inputchange', data.key, data.pressed, data.pos, data.vel);
        }
        if ((ig.input.state('jump') || player.autoMove.y < 0) && !player.spectator) {
          player.pressing.up = true;
        }
        if ((ig.input.released('jump') || (player.autoMove.y == 'stop')) && !player.spectator) {
          player.autoMove.y = 0;
          player.pressing.up = false;
          var data = { key: 'up', pressed: false, pos: player.pos, vel: player.vel }
          this.socketEmit('inputchange', data.key, data.pressed, data.pos, data.vel);
        }

        ig.game.clearColor = '#000000';
        //this.goDark(this.lightLevelDefault);
        if (this.currentLevel == 'LevelUnderground')
          this.goDark(1);
        else if (this.currentLevel == 'LevelHell')
          this.goDark(2);
        else if (this.inArena || this.levelSettings.leveltype == 2 || this.currentLevel.indexOf('*2') !== -1 || this.currentLevel == 'LevelHeader' || this.currentLevel == 'LevelSammerhall') {
          ig.game.clearColor = '#46D5F3';
          this.goDark(0);
        }
        else if (this.inEditor)
          this.goDark(0);
        else if (this.currentLevel != 'LevelTest' && this.currentLevel != 'LevelWaterworld' && this.currentLevel != 'LevelArena' && this.currentLevel != 'LevelWaterarena')
          this.goDark(9);
        else if (this.isOutside) {
          var d = new Date();
          var min = d.getUTCMinutes();
          var div = Math.floor(min / 20);
          var gamemin = min - 20 * div;
          var time = Math.floor(gamemin / 2);

          et = time;
          var colorstep;
          if (et > 5)
            colorstep = 5 - (et - 5);
          else if (et == 0)
            colorstep = 1;
          else
            colorstep = et;
          if ($.inArray(et, [4, 5, 6]) > -1)
            ig.game.clearColor = '#46D5F3';
          else
            ig.game.clearColor = this.colorFade('46D5F3', '003568', colorstep);

          var dark = -1;
          if (et == 6)
            dark = 0;
          if (et == 7)
            dark = 0;
          if (et == 8)
            dark = 7;
          if (et == 9)
            dark = 5;
          //if(et == 10)
          //  dark = 6;
          if (et == 0)
            dark = 5;
          if (et == 1)
            dark = 5;
          if (et == 2)
            dark = 7;
          if (et == 3)
            dark = 0;
          if (et == 4)
            dark = 0;
          if (et == 5)
            dark = 0;

          if (dark > -1) {
            if (dark != this.darkLevel) {
              var orbs = ig.game.getEntitiesByType('EntityOrb');
              for (var i = 0; i < orbs.length; i++)
                orbs[i].setRads(et);
            }

            this.goDark(dark);
          }
          /*
          if(et == 8)
            this.goDark(0);
          if(et == 9)
            this.goDark(9);
          if(et == 10)
            this.goDark(8);
          if(et == 11)
            this.goDark(7);
          if(et == 0)
            this.goDark(6);
          if(et == 1)
            this.goDark(7);
          if(et == 2)
            this.goDark(8);
          if(et == 3)
            this.goDark(9);
          if(et == 4)
            this.goDark(0);
          */

          /*
          var nightet = et+5;
          if(nightet > 10)
            nightet = et-5;
    
          var degrees=(180-18*et);
          var rads = degrees * (Math.PI / 180.0);
          var sunx = (this.mainMap.width/2)*this.mainMap.tilesize * Math.cos(rads);
          var suny = (this.mainMap.height/2)*this.mainMap.tilesize * Math.sin(rads);
          this.sun.pos.x = sunx+(this.mainMap.width/2)*this.mainMap.tilesize;
          this.sun.pos.y = (this.mainMap.height*this.mainMap.tilesize) - suny;
          degrees=(180-18*(nightet));
          rads = degrees * (Math.PI / 180.0);
          var moonx = (this.mainMap.width/2)*this.mainMap.tilesize * Math.cos(rads);
          var moony = (this.mainMap.height/2)*this.mainMap.tilesize * Math.sin(rads);
          this.moon.pos.x = moonx+(this.mainMap.width/2)*this.mainMap.tilesize;
          this.moon.pos.y = (this.mainMap.height * this.mainMap.tilesize) - moony;
          console.log(this.sun.pos.x+' - '+this.sun.pos.y);
          //degrees = degrees + 1;
          */

        }

        // Update all entities and BackgroundMaps
        this.parent();
      },
      getTile: function (x, y, layer) {
        if (layer == '2') {
          for (var i = 0; i < this.tileMaps2.length; i++) {
            if (ig.game.tileMaps2[i].getTile(x, y) != 0)
              return ig.game.tileMaps2[i].getTile(x, y);
          }
        }
        else {
          if (ig.game.mainMap.getTile(x, y) != 0)
            return ig.game.mainMap.getTile(x, y);
          //loop over each bgmap
          for (var i = 0; i < this.tileMaps.length; i++) {
            if (ig.game.tileMaps[i].getTile(x, y) != 0)
              return ig.game.tileMaps[i].getTile(x, y);
          }
        }
        return 0;
      },
      setTile: function (x, y, val, name, layer, flip) {
        //loop over each bgmap
        if (layer == 2) {
          for (var i = 0; i < this.tileMaps2.length; i++) {
            if (ig.game.tileMaps2[i].name == 'l2' + name)
              ig.game.tileMaps2[i].setTile(x, y, val, flip);
            else
              ig.game.tileMaps2[i].setTile(x, y, 0);
          }
        }
        else {
          if (name == 'main')
            ig.game.mainMap.setTile(x, y, val, flip);
          else
            ig.game.mainMap.setTile(x, y, 0);

          for (var i = 0; i < this.tileMaps.length; i++) {
            if (ig.game.tileMaps[i].name == name)
              ig.game.tileMaps[i].setTile(x, y, val, flip);
            else
              ig.game.tileMaps[i].setTile(x, y, 0);
          }
        }
      },
      attemptToPickupBit: function (x, y) {
        if (ig.game.bitsMap.getTile(x, y) > 0 || (ig.game.bitsBGMap.getTile(x, y) > 0 && ig.game.getTile(x, y) == 0)) {
          var tileval = ig.game.bitsMap.getTile(x, y) ? ig.game.bitsMap.getTile(x, y) : ig.game.bitsBGMap.getTile(x, y);
          if (typeof ig.game.inventory['bit'][tileval] === 'undefined')
            ig.game.inventory['bit'][tileval] = 0;

          var item = ig.game.inventory['bit'][tileval];
          if (item < 99 || ig.game.ignoreInventory) {
            //pickup
            this.pickupitem('bit', tileval, x, y);
          }
          return true;
        }
        return false;
      },
      attemptToPickupPalette: function (x, y) {
        var items = this.getEntitiesByType('EntityPalette');
        for (var i = 0; i < items.length; i++) {
          item = items[i];
          if (item.pos.x == row && item.pos.y == col) {
            this.selectPalette(item);
            return true;
          }
        }
        return false;
      },
      isNearWater: function (startx, starty) {
        var w = 0; var h = 0;
        if (this.waterMap.getTile(startx + w * 8, starty + h * 8) != 0)
          return false; //on water, so ignore
        w = 1;
        if (this.waterMap.getTile(startx + w * 8, starty + h * 8) != 0)
          return true;
        w = -1;
        if (this.waterMap.getTile(startx + w * 8, starty + h * 8) != 0)
          return true;
        w = 0; h = -1;
        if (this.waterMap.getTile(startx + w * 8, starty + h * 8) != 0)
          return true;
        return false;
      },
      isCollision: function (startx, starty, numblocksx, numblocksy) {
        var w, h;
        for (w = 0; w <= numblocksx; w++)
          for (h = 0; h <= numblocksy; h++) {
            if (this.collisionMap.getTile(startx + w * 8, starty + h * 8) != 0)
              return true;
            if (this.bitsMap.getTile(startx + w * 8, starty + h * 8) == 9 || this.bitsBGMap.getTile(startx + w * 8, starty + h * 8) == 9)
              return true;
            if (this.bitsMap.getTile(startx + w * 8, starty + h * 8) == 5 || this.bitsBGMap.getTile(startx + w * 8, starty + h * 8) == 5)
              return true;
            if (this.inLevel && (this.bitsMap.getTile(startx + w * 8, starty + h * 8) == 4 || this.bitsBGMap.getTile(startx + w * 8, starty + h * 8) == 4))
              return true;
          }

        return false;
      },
      isCollisionPass: function (startx, starty, numblocksx, numblocksy) {
        var w, h;
        for (w = 0; w < numblocksx; w++)
          for (h = 0; h < numblocksy; h++) {
            if (this.collisionMap.getTile(startx + w * 8, starty + h * 8) == 46)
              return true;
          }

        return false;
      },
      isCollisionEntity: function (e, startx, starty, numblocksx, numblocksy) {
        var w, h;
        for (w = 0; w <= numblocksx; w++)
          for (h = 0; h <= numblocksy; h++) {
            if ((e.pos.x <= startx + w * 8) &&
              (startx + w * 8 < e.pos.x + e.size.x * 1) &&
              (e.pos.y <= starty + h * 8) &&
              (starty + h * 8 < e.pos.y + e.size.y * 1))
              return true;
          }

        return false;
      },
      setWater: function (row, col, on) {
        if (on) {
          this.waterMap.data[row][col] = (Math.random() > .5 ? 1 : 2);
          //this.collisionMap.data[row][col]=46;
        }
        else {
          this.waterMap.data[row][col] = 0;
          //this.collisionMap.data[row][col]=0; 
        }
      },
      isNotWater: function (row, col) {
        return (this.waterMap && this.waterMap.data[row][col] == 0) && this.collisionMap.data[row][col] == 0;
      },
      isFixedWater: function (row, col) {
        return this.waterMap.data[row][col] > 2;
      },
      loadLevel: function (data) {

        this.tileMaps = [];
        this.tileMaps2 = [];
        this.lastWaterMapString = '';
        this.lastWaterMap = null;
        this.waterMap = null;
        this.blankWaterMapData = null;
        this.lightData = null;
        this.stillWater = true;
        this.convertWater = false;
        this.darkLevel = 0;
        this.goombaSpawns = [];
        this.moverSpawns = [];
        this.levelDeaths = 0;
        this.levelCoins = 0;
        this.totalCoins = 0;
        this.shifting = false;
        this.shiftedFrame = [];
        this.shiftedDirections = { x: 0, y: 0 };
        $('.frameshift').removeClass('btn-success');

        if (ytplayerready) {
          ytplayer.stopVideo();
          $("#youtube").css({
            width: "1px",
            height: "1px",
            top: "-10000px",
            left: "-10000px"
          });
        }
        if (this.currentLevel == 'LevelArena' || this.currentLevel == 'LevelHell' || this.currentLevel == 'LevelWaterarena')
          this.inArena = true;
        else
          this.inArena = false;
        if (this.currentLevel == 'LevelTest' || this.currentLevel == 'LevelUnderground' || this.currentLevel == 'LevelWaterworld' || this.currentLevel == 'LevelHell')
          this.bigArea = true;
        else
          this.bigArea = false;

        if (typeof data === 'undefined' && (this.currentLevel.indexOf('*') !== -1 || this.levelSettings.leveltype >= 1))
          this.inLevel = true;
        else
          this.inLevel = false;

        if (typeof data === 'undefined' && ((this.currentLevel.indexOf('|') !== -1 && this.currentLevel.indexOf('*') == -1) || this.levelSettings.leveltype <= 1 || !this.levelSettings.leveltype))
          this.inRoom = true;
        else
          this.inRoom = false;

        if (this.currentLevel == 'LevelTest' || this.currentLevel == 'LevelWaterworld' || this.currentLevel == 'LevelArena' || this.currentLevel == 'LevelWaterarena')
          this.isOutside = true;
        else
          this.isOutside = false;

        if (this.currentLevel.substring(0, "EditBackground".length) == "EditBackground" || this.currentLevel.substring(0, "EditItem".length) == "EditItem")
          this.inEditor = true;
        else
          this.inEditor = false;

        if (this.inLevel || this.inEditor)
          this.ignoreInventory = true;
        else
          this.ignoreInventory = false;

        //$('.animframes > div').removeClass('out in set1 set2 set3 setItemDefault');
        //$('.animframes > div').show();
        //$('.animframe').removeAttr( 'style' );
        $('.animframe:not(.eraser)').remove();
        /*
        if(this.inArena)
        {
          //do nothing
        }
        if(!this.bigArea && !(this.currentLevel.indexOf('*2') !== -1))
        {
          $('.animframes > div').addClass('in');
        }
        else
          $('.animframes > div').addClass('out');
        */
        $('.framesave, .framecopy, .framepaste, .frameclear, .frameshift, .frameadd, .hexcolor').toggle(this.inEditor);
        $('.frameedit').toggle(!this.inEditor);
        /*
        $('.frameflip,.frameflop').toggle(!this.inEditor);
        $('.frameflip,.frameflop').parent().toggle(!this.inEditor);
        $('.framelayer').toggle(!this.inEditor);
        $('.framelayer').parent().toggle(!this.inEditor);
        */

        if (this.inEditor && this.itemEditing) {
          $('.animframes').find('.eraser').hide();
          //$('.animframes').find('.eraser').after('<div class="animframe animframe1" data-val="1"></div>');
          //$('.animframes').find('.eraser').after('<div class="animframe animframe2" data-val="2"></div>');
          $('.animframes > label').hide();
          $('#tileoptions').hide();
          $('#frameoptions').show();
        }
        else
          $('#tileoptions, #frameoptions').show();

        //this.selectedFrameSet = '0';


        this.levelOwner = '';
        if (typeof data === 'undefined') {
          //name: LevelTest|Doopliss-Doopliss*2
          //door: LevelTest|Doopliss|Doopliss*2-start
          var split = this.currentLevel.split("|");
          var levelFrom = '';
          for (var di = 0; di < split.length; di++) {
            if (di > 0 && di >= split.length - 1)
              continue;
            if (di > 0)
              levelFrom += '|' + split[di];
            else
              levelFrom = split[di];
          }
          if (this.lastLevel != '')
            levelFrom = this.lastLevel;
          //var levelFrom = split[0];
          var levelOwner = split[split.length - 1];
          if (this.currentLevel.indexOf('*') !== -1) {
            this.inLevel = true;
            split = levelOwner.split('*');
            levelOwner = split[0];
            var doortype = 2;
            if (this.currentLevel.indexOf('*3') !== -1)
              doortype = 3;
            if (levelOwner == 'Francis' && levelFrom == 'LevelTest')
              data = ig.copy(LevelHeader);
            else if (doortype == 2)
              data = ig.copy(LevelDefault); //load default room, set door settings
            else if (doortype == 3)
              data = ig.copy(LevelVertical);
            var door1 = true;
            for (var i = 0; i < data.entities.length; i++) {
              if (data.entities[i].type == 'EntityDoor') {
                if (door1) {
                  data.entities[i].settings.name = this.currentLevel + '-start';
                  data.entities[i].settings.target = { '1': levelFrom + '-' + levelOwner + '*' + doortype };
                  door1 = false;
                }
                else {
                  data.entities[i].settings.name = this.currentLevel + '-exit';
                  data.entities[i].settings.target = { '1': levelFrom + '-' + levelOwner + '*' + doortype };
                  break;
                }
              }
            }
          }
          else {
            if (this.currentLevel == 'LevelSammerhall') {
              /* new level from scratch */
              var sammers = 0;
              Object.keys(itemsInfo).forEach(function (itemid) {
                var item = itemsInfo[itemid];
                if (item['username'] == '_sammer7' && item['settings']['equip'] == 'body' && item['image'] && item['image'] != 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAADgCAYAAABikmRAAAAAmUlEQVR4Xu3QQREAAAABQfqXFsNnFTizzXk99+MAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgMA4+AOFG058bAAAAAElFTkSuQmCC') {
                  sammers++;
                }
              });
              data = 'test';
              data = { entities: [{ type: "EntityDoor", x: 0, y: 120, settings: { direction: "up", name: "LevelSammerhall-door", target: { 1: "LevelTest-sammerhall" } } }, { type: "EntityDoor", x: 16 * 5 * sammers - 16, y: 120, settings: { direction: "up", name: "LevelSammerhall-door2", target: { 1: "LevelTest-sammerhall" } } }, { type: "EntityPlayer", x: 0, y: 128 }], layer: [] };
              var layerdata8 = [];
              var layerdata8col = [];
              var layerdata8colsolid = [];
              var layerdata16 = [];
              var layerdata16col = [];
              var layerdata16colsolid = [];
              var widthsmall = sammers * 10;
              var widthbig = sammers * 5;
              for (var i = 0; i < widthsmall; i++)
                layerdata8col.push(0);
              for (var i = 0; i < widthsmall; i++)
                layerdata8colsolid.push(1);
              for (var i = 0; i < widthbig; i++)
                layerdata16col.push(0);
              for (var i = 0; i < widthbig; i++)
                layerdata16colsolid.push(3);
              for (var i = 0; i < 19; i++)
                layerdata8.push(layerdata8col);
              layerdata8.push(layerdata8colsolid);
              data['layer'].push({ "data": layerdata8, "name": "bits2", "width": widthsmall, "height": 20, "linkWithCollision": false, "visible": 1, "tilesetName": "media/bits.png", "repeat": false, "preRender": false, "distance": "1", "tilesize": 8, "foreground": false })
              for (var i = 0; i < 9; i++)
                layerdata16.push(layerdata16col);
              layerdata16.push(layerdata16colsolid);
              data['layer'].push({ "data": layerdata16, "name": "main", "width": widthbig, "height": 10, "linkWithCollision": false, "visible": 1, "tilesetName": "media/inside.png", "repeat": false, "preRender": false, "distance": "1", "tilesize": 16, "foreground": false });
              data['layer'].push({ "data": layerdata8, "name": "collision", "width": widthsmall, "height": 20, "linkWithCollision": false, "visible": 0, "tilesetName": "", "repeat": false, "preRender": false, "distance": 1, "tilesize": 8, "foreground": false });
              layerdata8 = []
              for (var i = 0; i < 20; i++)
                layerdata8.push(layerdata8col);
              data['layer'].push({ "data": layerdata8, "name": "blocks", "width": widthsmall, "height": 20, "linkWithCollision": true, "visible": 1, "tilesetName": "media/bits.png", "repeat": false, "preRender": false, "distance": "1", "tilesize": 8, "foreground": false });
              //for each body push entity
              //width = bodies * 4, height = 20
              //data zeroes except for maybe the bottom
            }
            else if (this.inEditor)
              data = ig.copy(LevelEditor);
            else
              data = ig.copy(LevelDefaultroom); //load default room, set door settings
            if (this.currentLevel != 'LevelSammerhall')
              for (var i = 0; i < data.entities.length; i++) {
                if (data.entities[i].type == 'EntityDoor') {
                  data.entities[i].settings.name = this.currentLevel + '-1';
                  data.entities[i].settings.target = { '1': levelFrom + '-' + levelOwner };
                  break;
                }
              }
          }
          this.levelOwner = levelOwner;
        }


        /* new door stuff
        if(typeof data === 'undefined')
        {
          //name: LevelTest|Doopliss-Doopliss*2
          //door: LevelTest|Doopliss|Doopliss*2-start
          var split = this.currentLevel.split("|");
          var levelFrom = '';
          for(var di=0;di<split.length;di++)
          {
            if(di > 0 && di >= split.length-1)
              continue;
            if(di > 0)
              levelFrom += '|'+split[di];
            else
              levelFrom = split[di];
          }
          //if(this.lastLevel != '')
          /// levelFrom = this.lastLevel;
    
    
          if(this.inLevel)
          {
            if(this.levelOwner == 'Francis' && this.levelSettings.parentLevel == 'LevelTest')
              data = ig.copy(LevelHeader);
            else if(this.levelSettings.leveltype == 2 || this.currentLevel.indexOf('*2') !== -1)
              data = ig.copy(LevelDefault);
            else if(this.levelSettings.leveltype == 3 || this.currentLevel.indexOf('*3') !== -1)
              data = ig.copy(LevelVertical);
            //TODO use width and height for blank level
            var door1 = true;
    
            for(var i=0;i<data.entities.length;i++)
            {
              if(data.entities[i].type == 'EntityDoor')
              {
                if(this.currentLevel.indexOf('*')>-1)
                {
                  if(door1){
                  data.entities[i].settings.name = this.currentLevel+'-start';
                  data.entities[i].settings.target = {'1':levelFrom+'-'+this.levelOwner+'*'+this.levelSettings.leveltype};
                  door1 = false;
                  }
                  else{
                  data.entities[i].settings.name = this.currentLevel+'-exit';
                  data.entities[i].settings.target = {'1':levelFrom+'-'+this.levelOwner+'*'+this.levelSettings.leveltype};
                  break;
                  }
                }
                else{
                  if(door1){
                  data.entities[i].settings.name = this.currentLevel+'-start';
                  data.entities[i].settings.target = {'1':this.lastLevel};
                  door1 = false;
                  }
                  else{
                  data.entities[i].settings.name = this.currentLevel+'-exit';
                  data.entities[i].settings.target = {'1':this.lastLevel};
                  break;
                  }
                }
              }
            }
          }
          else
          { 
            if(this.inEditor)
              data = ig.copy(LevelEditor);
            else
              data = ig.copy(LevelDefaultroom); //load default room, set door settings
            for(var i=0;i<data.entities.length;i++)
            {
              if(data.entities[i].type == 'EntityDoor')
              {
                data.entities[i].settings.name = this.currentLevel+'-1';
                data.entities[i].settings.target = {'1':levelFrom+'-'+this.levelOwner};
                //data.entities[i].settings.target = {'1':this.lastLevel};
                break;
              }
            }
          }
        }
        */


        if (this.currentLevel == 'LevelTest') {
          var maindata = [];
          var mainidx = 0;
          for (var i = 0; i < data.layer.length; i++) {
            if (data.layer[i].name == 'main') {
              mainidx = i;
              for (var i = 0; i < LevelWaterworld.layer.length; i++) {
                if (LevelWaterworld.layer[i].name == 'main') {
                  maindata = LevelWaterworld.layer[i];
                }
              }
            }
          }
          var bgmap = ig.copy(maindata);
          //1,17,33,49,65,81
          for (var i = 0; i < bgmap.height; i++) {
            for (var j = 0; j < maindata.width; j++)
              bgmap.data[i][j] *= 16;
          }
          for (var i = 0; i < maindata.height * 3 - 19; i++) {
            bgmap.data.unshift([]);
            for (var j = 0; j < maindata.width; j++)
              bgmap.data[0].push(0);
            bgmap.height++;
          }
          bgmap.tilesize = 4;
          bgmap.name = 'bgcopy';
          bgmap.visible = true;
          var first = data.layer.slice(0, mainidx);
          first.push(bgmap);
          var last = data.layer.slice(mainidx);
          data.layer = first.concat(last);
        }


        var mapdata = [];
        var idx = 0;
        var haslight = false;
        var eidx = 0;
        for (var i = 0; i < data.layer.length; i++) {
          if (data.layer[i].name == 'thelight')
            haslight = true;
          if (data.layer[i].name == 'blocks' && !haslight) {
            idx = i;
            mapdata = ig.copy(data.layer[i]);
          }
        }
        if (!haslight) {
          for (var i = 0; i < mapdata.height; i++) {
            for (var j = 0; j < mapdata.width; j++)
              mapdata.data[i][j] = 0;
          }
          mapdata.name = 'thelight';
          mapdata.foreground = false;
          mapdata.tilesetName = 'media/light.png';
          mapdata.visible = true;
          data.layer.splice(data.layer.length - 1, 0, mapdata);
        }

        //add background layers
        var maindata = {};
        var mainidx = 0;
        for (var i = 0; i < data.layer.length; i++) {
          if (data.layer[i].name == 'main') {
            maindata = ig.copy(data.layer[i]);
            mainidx = i;
            for (var i = 0; i < maindata.height; i++) {
              for (var j = 0; j < maindata.width; j++)
                maindata.data[i][j] = 0;
            }
            break;
          }
        }

        var playerHasTiles = false;
        var uniqueTileUsers = [];
        Object.keys(globalTileMapsInfo).forEach(function (setid) {
          var tile = globalTileMapsInfo[setid];
          if (ig.game.levelOwner.length == 0 && $.inArray(tile.username, uniqueTileUsers) > -1)
            return;
          if (tile.username == playerinfo.username)
            playerHasTiles = true;
          //for(var s=1;s<=3;s++)
          //{
          var newdata = ig.copy(maindata);
          if (tile.image)
            var tmi = 'data:image/png;base64,' + tile.image;
          else {
            var s = 0;
            if (setid.indexOf('_set1') == 0)
              s = 1;
            if (setid.indexOf('_set2') == 0)
              s = 2;
            if (setid.indexOf('_set3') == 0)
              s = 3;
            if (s > 0)
              var tmi = 'media/tiletemplate' + s + '.png';
            else
              var tmi = 'media/blanktile.png';
          }
          newdata.name = setid;
          newdata.foreground = false;
          newdata.tilesetName = tmi;//base64 image data;
          newdata.visible = true;
          data.layer.splice(mainidx, 0, newdata);

          uniqueTileUsers.push(tile.username);
          //}
        });
        Object.keys(playerinfo.tiles).forEach(function (setid) {
          if (globalTileMapsInfo[setid])
            return;
          var tile = playerinfo.tiles[setid];
          var newdata = ig.copy(maindata);
          if (tile.image)
            var tmi = 'data:image/png;base64,' + tile.image;
          else
            var tmi = 'media/blanktile.png';
          newdata.name = setid;
          newdata.foreground = false;
          newdata.tilesetName = tmi;//base64 image data;
          newdata.visible = true;
          data.layer.splice(mainidx, 0, newdata);
        });
        for (var s = 1; s <= 3; s++) {
          var newdata = ig.copy(maindata);
          newdata.name = 'main' + s;
          newdata.foreground = false;
          newdata.tilesetName = 'media/tiletemplate' + s + '.png';
          newdata.visible = true;
          data.layer.splice(mainidx, 0, newdata);
        }
        /*
        if(!playerHasTiles && this.inEditor)
        {
          for(var s=1;s<=3;s++)
          {
            var newdata = ig.copy(maindata);
            newdata.name = playerinfo.username+'|'+s;
            newdata.foreground = false;
            newdata.tilesetName = 'media/tiletemplate'+s+'.png';
            newdata.visible = true;
            data.layer.splice(mainidx-1,0,newdata);
            playerinfo.tiles = {};
          }     
        }*/
        //layer 2
        for (var i = 0; i < data.layer.length; i++)
          if (data.layer[i].name == 'main')
            mainidx = i;

        var newdata = ig.copy(maindata);
        newdata.name = 'l2main';
        newdata.foreground = false;
        newdata.visible = true;
        data.layer.splice(mainidx + 1, 0, newdata);

        uniqueTileUsers = [];
        Object.keys(globalTileMapsInfo).forEach(function (setid) {
          var tile = globalTileMapsInfo[setid];
          if (ig.game.levelOwner.length == 0 && $.inArray(tile.username, uniqueTileUsers) > -1)
            return;

          var newdata = ig.copy(maindata);
          if (tile.image)
            var tmi = 'data:image/png;base64,' + tile.image;
          else {
            var s = 0;
            if (setid.indexOf('_set1') == 0)
              s = 1;
            if (setid.indexOf('_set2') == 0)
              s = 2;
            if (setid.indexOf('_set3') == 0)
              s = 3;
            if (s > 0)
              var tmi = 'media/tiletemplate' + s + '.png';
            else
              var tmi = 'media/blanktile.png';
          }
          newdata.name = 'l2' + setid;
          newdata.foreground = false;
          newdata.tilesetName = tmi;//base64 image data;
          newdata.visible = true;
          data.layer.splice(mainidx + 1, 0, newdata);
          uniqueTileUsers.push(tile.username);
        });
        Object.keys(playerinfo.tiles).forEach(function (setid) {
          if (globalTileMapsInfo[setid])
            return;
          var tile = playerinfo.tiles[setid];
          var newdata = ig.copy(maindata);
          if (tile.image)
            var tmi = 'data:image/png;base64,' + tile.image;
          else
            var tmi = 'media/blanktile.png';
          newdata.name = 'l2' + setid;
          newdata.foreground = false;
          newdata.tilesetName = tmi;//base64 image data;
          newdata.visible = true;
          data.layer.splice(mainidx + 1, 0, newdata);
        });
        for (var s = 1; s <= 3; s++) {
          var newdata = ig.copy(maindata);
          newdata.name = 'l2main' + s;
          newdata.foreground = false;
          newdata.tilesetName = 'media/tiletemplate' + s + '.png';
          newdata.visible = true;
          data.layer.splice(mainidx + 1, 0, newdata);
        }
        /*
        if(!playerHasTiles && this.inEditor)
        {
          for(var s=1;s<=3;s++)
          {
            var newdata = ig.copy(maindata);
            newdata.name = 'l2'+playerinfo.username+'|'+s;
            newdata.foreground = false;
            newdata.tilesetName = 'media/tiletemplate'+s+'.png';
            newdata.visible = true;
            data.layer.splice(mainidx+1,0,newdata);
            playerinfo.tiles = {};
          }     
        }*/

        this.parent(data);

        if (!this.inArena && !this.inLevel) {
          this.collisionMap.data.push([]);
          this.collisionMap.data[this.collisionMap.height] = [];
          for (var i = 0; i < this.collisionMap.width; i++)
            this.collisionMap.data[this.collisionMap.height].push(1);
          this.collisionMap.height++;
        }

        // Search all map layers.
        for (var i = 0; i < this.backgroundMaps.length; i++) {
          // Find the layer with the correct name.
          if (this.backgroundMaps[i].name == 'blocks') {
            this.bitsMap = this.backgroundMaps[i];
          }
          else if (this.backgroundMaps[i].name == 'bits2') {
            this.bitsBGMap = this.backgroundMaps[i];
          }
          else if (this.backgroundMaps[i].name == 'main') {
            this.mainMap = this.backgroundMaps[i];
          }
          else if (this.backgroundMaps[i].name == 'thelight') {
            this.darkMap = this.backgroundMaps[i];
            this.lightMap = new ig.Map(this.darkMap.tilesize, ig.copy(this.darkMap.data));
          }
          else if (this.backgroundMaps[i].name == 'fade') {
            //this.backgroundMaps[i].visible = false;
          }
          else if (this.backgroundMaps[i].name == 'background') {
            //this.backgroundMaps[i].visible = false;
          }
          else if (this.backgroundMaps[i].name == 'water') {
            this.stillWater = false;
            this.convertWater = true;
            this.waterMap = this.backgroundMaps[i];
            this.lastWaterMap = new ig.Map(this.waterMap.tilesize, ig.copy(this.waterMap.data));
            this.blankWaterMapData = [];
            for (var row = 0; row < this.waterMap.height; row++) {
              this.blankWaterMapData.push([]);
              for (var col = 0; col < this.waterMap.width; col++) {
                if (this.waterMap.data[row][col] == 1)
                  this.waterMap.data[row][col] = (Math.random() > .5 ? 1 : 2);
                if (this.waterMap.data[row][col] == 3)
                  this.waterMap.data[row][col] = (Math.random() > .5 ? 3 : 4);
                this.blankWaterMapData[row].push(0);
              }
            }
          }
          else if (this.backgroundMaps[i].name == 'bgcopy')
            this.backgroundMaps[i] = new BackgroundMapXScroll(4, this.backgroundMaps[i].data, this.backgroundMaps[i].tilesetName);
          else if (this.backgroundMaps[i].name.indexOf('l2') == 0) {
            this.tileMaps2.push(this.backgroundMaps[i]);
          }
          else if (this.backgroundMaps[i].name.indexOf('_') == 0 || this.backgroundMaps[i].name.indexOf('main') == 0) {
            this.tileMaps.push(this.backgroundMaps[i]);
          }

        }

        for (var key in globalRemovedItems) {
          for (var key2 in globalRemovedItems[key]) {
            for (var key3 in globalRemovedItems[key][key2]) {
              this.removeitem(key, key2, key3, false);
            }
          }
        }
        /*
        //add erasers first
        for(var key in items){
          for(var key2 in items[key]){
            for(var key3 in items[key][key2]){
              if(key == 'block' && key2==4)
              {
                this.additem(key,items[key][key2][key3].val,key2,key3,items[key][key2][key3].data, false);
              }
            }
          }
        }*/
        for (var key in globalItems) {
          for (var key2 in globalItems[key]) {
            for (var key3 in globalItems[key][key2]) {
              /*if(key == 'sign')
              {
                var signdata = items[key][key2][key3].data;
                if(!signdata.name)
                  continue;
              }*/
              //if(!(key == 'block' && key2==4))
              //val & data may be empty (if it was deleted)
              this.additem(key, globalItems[key][key2][key3].val, key2, key3, globalItems[key][key2][key3].data, false);
            }
          }
        }

        var i = 0;
        Object.keys(itemsInfo).forEach(function (itemid) {
          var body = itemsInfo[itemid];
          if (body['username'] == '_sammer7' && body['settings']['equip'] == 'body' && body['image'] && body['image'] && body['image'] != 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAADgCAYAAABikmRAAAAAmUlEQVR4Xu3QQREAAAABQfqXFsNnFTizzXk99+MAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgMA4+AOFG058bAAAAAElFTkSuQmCC') {
            var head = null;
            Object.keys(itemsInfo).forEach(function (itemid) {
              var temphead = itemsInfo[itemid];
              if (temphead['username'] == '_sammer7' && temphead['settings']['equip'] == 'head' && temphead['settings']['name'] == body['settings']['name'] && temphead['image']) {
                head = temphead
              }
            });
            ig.game.spawnEntity(EntitySammerstatue, 64 + (i * 64), 64, { "head": head, "body": body, "sammernum": i });
            i++;
          }
        });

        if (this.isOutside && !this.inArena) {
          this.sun = this.spawnEntity(EntityOrb, 0, 0);
          this.moon = this.spawnEntity(EntityOrb, 0, 0, { color: 'white' });
        }
        if (this.inEditor) {
          //draw palette
          /*
          for(var rgb=0;rgb<4;rgb++){
            for(var i=0;i<16;i++){
              var r = 255;
              var g = 0;
              var b = 0;
              if(rgb == 0)
                r = 255 - Math.round(255/16)*i;
              if(rgb == 1)
                g = 255 - Math.round(255/16)*i;
              if(rgb == 2)
                b = 255 - Math.round(255/16)*i;
              if(rgb == 4)
    
              this.spawnEntity( EntityPalette, 16+rgb*8,16+i*8, {r:r,g:g,b:b});
            }
          }*/
          var numpal = 18
          for (var hsl = 0; hsl < 3; hsl++) {
            for (var i = 0; i < numpal; i++) {
              var h = 360;
              var l = 50;
              var s = 100;
              if (hsl == 0)
                h = 360 - Math.round(360 / numpal) * i;
              if (hsl == 1)
                l = 100 - Math.round(100 / (numpal)) * i;
              if (hsl == 2)
                s = 100 - Math.round(100 / (numpal - 2)) * i;
              if (l < 0)
                l = 0;
              if (s < 0)
                s = 0;
              if (i >= numpal - 2 && hsl == 2)
                continue;
              this.spawnEntity(EntityPalette, 16 + i * 8, 16 + hsl * 8, { hsl: true, h: h, l: l, s: s });
            }
          }
          this.spawnEntity(EntityPalette, 16 + (numpal - 2) * 8, 16 + 8 * 2, { hsl: true, h: 0, l: 0, s: 0 });
          this.spawnEntity(EntityPalette, 16 + (numpal - 1) * 8, 16 + 8 * 2, { eraser: true });

          if (this.itemId) {
            this.selectItemFrame(1);
            this.selectitem($('.hand1'), 'hand', '1');
          }
        }

        if (this.currentLevel == 'LevelWaterworld') {
          for (var i = 0; i < LevelWaterworld.layer.length; i++) {
            if (LevelWaterworld.layer[i].name == 'main') {
              for (var i = 0; i < data.layer.length; i++) {
                if (data.layer[i].name == 'main') {
                  LevelWaterworld.layer[i].data = data.layer[i].data; //copy changes to base level
                }
                break;
              }
              break;
            }
          }
        }

        for (var i = 0; i < this.backgroundMaps.length; i++) {
          if (this.backgroundMaps[i].name == 'bgcopy')
            this.backgroundMaps[i] = new BackgroundMapXScroll(4, this.backgroundMaps[i].data, this.backgroundMaps[i].tilesetName);
        }

        for (var key in usersData) {
          user = usersData[key];
          if (!user.username || user.username == getUserInfo().username || user.room != getUserInfo().room)
            continue;
          console.log('adding ' + user.username);
          //data.entities.push({"type":"EntityPlayerremote","x":user.posx, "y":user.posy, "settings":{"anim":'digibutter/images/avatars/create/'+user.avatar+'.gif', "name":user.username} });
          var asleep = (typeof user.player.asleep !== 'undefined') ? user.player.asleep : false;
          var body = null;
          var head = null;
          if (user.player.equipped) {
            var e = user.player.equipped;
            for (var i = 0; i < e.length; i++) {
              if (itemsInfo[e[i]] && itemsInfo[e[i]]['settings']['equip']) {
                if (itemsInfo[e[i]]['settings']['equip'] == 'body')
                  body = itemsInfo[e[i]]['image'];
                else (itemsInfo[e[i]]['settings']['equip'] == 'head')
                head = itemsInfo[e[i]]['image'];
              }
            }
          }

          //this.spawnEntity(EntityPlayerremote, user.player.pos.x, user.player.pos.y, { "anim": this.avatarUrl(user.avatar), "name": user.username, "damage": user.damage, "asleep": asleep, "image": body, "headimage": head });
          if (user.avatar)
            this.spawnEntity(EntityPlayerremote, user.player.pos.x, user.player.pos.y, { "anim": 'media/avatars/' + user.avatar + '.gif', "name": user.username, "damage": user.damage, "asleep": asleep, "image": body, "headimage": head });
          else
            this.spawnEntity(EntityPlayerremote, user.player.pos.x, user.player.pos.y, { "name": user.username, "damage": user.damage, "asleep": asleep, "image": body, "headimage": head });
        }

        if (!this.isSpectating)
          this.screenFader = new ig.ScreenFader({ fade: 'out', speed: 0.5 });

        if (!this.isSpectating) {
          var username = getUserInfo().username;
          var useravatar = getUserInfo().avatar;

          var player = this.getEntitiesByType(EntityPlayer)[0];
          if (!player)
            player = this.spawnEntity(EntityPlayer, 0, 0);
          player.anim = this.avatarUrl(useravatar);
          player.name = username;
          var door = this.getEntityByName(this.spawnDoor);
          if (!this.spawnDoor) {
            var doors = this.getEntitiesByType(EntityDoor) || [];
            for (var i = 0; i < doors.length; i++) {
              if (doors[i].target == this.levelFrom + '-' + this.levelOwner + '*' + this.lastLevelSettings.leveltype)
                door = door[i];
            }
          }
          if (door) {
            if (this.enterLevelPos !== false) {
              player.pos.x = this.enterLevelPos;
              this.enterLevelPos = false;
            }
            else
              player.pos.x = door.pos.x;
            player.pos.y = door.pos.y;
            if (door.spectator)
              player.spectator = true;
            else
              player.spectator = false;
          }
          player.initplayer(player.anim);
          this.theplayer = player;

          if(playerinfo.gun){
            this.equipitem(null, 'gun', parseInt(playerinfo.gun));
          } else {
            $item = $('.guns > .gun.selected');
            this.equipitem($item, 'gun', $item.data('val') || '');
          }

          //$item = $('.equips > .equip.selected');
          //this.equipitem($item, $item.data('val'), 1);

          var eq = [];
          if (playerinfo.equipped)
            for (var i = 0; i < playerinfo.equipped.length; i++)
              eq.push(playerinfo.equipped[i]);
          for (var i = 0; i < eq.length; i++)
            player.equipItem(eq[i]);

          this.socketEmit('playerupdate', { pos: player.pos, vel: { x: 0, y: 0 }, asleep: false, gun: player.getGunType(), equipped: player.equipped }, this.currentLevel);

          $item = $('.inventory > .' + this.selectedItemName + this.selectedItemValue);
          this.selectitem($item, this.selectedItemName, this.selectedItemValue);
        }
        this.sortEntitiesDeferred();
        //this.spawnEntity( EntityPlayer, , , {"anim":, "name":username} );

        if (this.inArena) {
          if (playerinfo.damage && playerinfo.damage > 0)
            ig.game.socketEmit('playerkill', 'suicide', this.name);
          player.damage = playerinfo.damage;
          this.deaths = 0;
        }

        if (this.inLevel) {
          $('#retrybutton').show();
        }
        else
          $('#retrybutton').hide();

        //full inventory
        if (this.levelOwner == playerinfo.username && this.ignoreInventory) {
          if (this.itemEditing)
            this.hideInventory();
          else
            this.setFullInventory();
        }
        else
          this.addInventory('', '');

        if (this.selectedItemName == 'block' || this.selectedItemName == 'block2') {
          this.selectframe($('.animframe' + this.selectedFrame), this.selectedFrame);
          //$('#frameoptions').show();
        }
        else if (!(this.itemEditing && this.inEditor))
          $('#tileoptions, #frameoptions').hide();

        if (this.itemEditing && this.inEditor) {
          if (playerinfo.items[this.itemId]['settings']['equip'])
            this.equipitem(null, this.itemId, 1);
        }

        this.levelLoaded = true;
      },

      updateWorld: function (skipwater) {
        //copy existing entities
        var waters = this.getEntitiesByType(EntityWater);
        ig.world = this.createWorldFromMap(this.collisionMap.data, this.collisionMap.width, this.collisionMap.height, this.collisionMap.tilesize);
        ig.world.SetContactListener(null);
        if (skipwater)
          return;
        for (var i = 0; i < waters.length; i++) {
          var water = waters[i];
          water.createBody();
        }
      },

      draw: function () {

        if (this.paused) {
          this.drawBillboard(this.billboardMessage);
          return;
        }

        //ig.game.clearColor = '#003568';

        // check if DrawCounter instance is enabled
        if (ig.drawCounter) {
          // Add a new frame interval, set the image count to zero
          ig.drawCounter.addInterval();
        }

        // Draw all entities and BackgroundMaps
        this.parent();

        // check if DrawCounter instance is enabled
        if (ig.drawCounter) {
          // Draw the total number of images used to draw the scene, but not counting the image drawing the letters of that number require
          this.font.draw(ig.drawCounter.imageCount, 210, 2);
        }

        // check for a ScreenFader and call draw
        if (this.screenFader) {
          this.screenFader.draw();
        }

        //dark area
        /*
        if(this.currentLevel == 'LevelUnderground')
        {
          var player = ig.game.theplayer;
          var ctx = ig.system.context;
          ctx.save();
          var x = (player.pos.x + 10 - this.screen.x)*2;
          var y = (player.pos.y + 15 - this.screen.y)*2;
          var lamp=1+(ig.game.inventory['lantern'][1] > 0 ? 1 : 0);
          var grd=ctx.createRadialGradient(x,y,16*ig.system.scale*lamp,x,y,ig.system.height*ig.system.scale/2*lamp);
          grd.addColorStop(0,"rgba(0,0,0,0)");
          grd.addColorStop(1,"rgba(0,0,0,1)");
          ctx.fillStyle=grd;
          ctx.fillRect(0,0,ig.system.width*ig.system.scale,ig.system.height*ig.system.scale);
          ctx.restore();
        }*/

        if (this.inLevel && !this.isSpectating)
          this.font.draw('Deaths: ' + this.levelDeaths + ' Coins: ' + this.levelCoins + '/' + this.totalCoins, 2, 2);
        if (this.inLevel && this.levelTitle.length)
          this.font.draw(this.levelTitle, 2, 10);

        if (this.billboardMessage) {
          this.drawBillboard(this.billboardMessage);
        }

        if (false)
          for (var i = 0; i < this.bitsMap.height; i++) //left to right
          {
            for (var j = 0; j < this.bitsMap.width; j++) {
              var x = j * 8;
              var y = i * 8;
              //for(var i = 0; i<this.entities.length; i++) {
              //e = this.entities[i];
              //if(e instanceof EntityPlayer)

              if (this.bitsMap.data[i][j] == 9 || this.bitsBGMap.data[i][j] == 9) //yellow
              {
                //check 1 pixel around, then 2, etc
                var dist = this.lightDistance;
                //for(var dist = 1;dist<=24;dist++)
                for (var x2 = -dist; x2 <= dist; x2 += 1) {
                  for (var y2 = -dist; y2 <= dist; y2 += 1) {
                    if (x2 == -dist || x2 == dist || y2 == -dist || y2 == dist)
                    //if(x2 == 0 && y2 == dist)
                    {

                      var laserEndX = ig.system.getDrawPos((j - x2) * 8 - ig.game.screen.x);
                      var laserEndY = ig.system.getDrawPos(((i - y2) * 8 - ig.game.screen.y));

                      var laserStartX = ig.system.getDrawPos((j * 8 - ig.game.screen.x));//+ this.laserLength);
                      var laserStartY = ig.system.getDrawPos(i * 8 - ig.game.screen.y); // straight line laser only demo

                      ig.system.context.strokeStyle = "red";
                      ig.system.context.lineWidth = .5;
                      ig.system.context.beginPath();
                      ig.system.context.moveTo(laserStartX, laserStartY);
                      ig.system.context.lineTo(laserEndX, laserEndY);
                      ig.system.context.stroke();
                      ig.system.context.closePath();
                    }
                  }
                }
              }
            }
          }

      },

      drawBeforeMaps: function () {
        if (this.moon)
          this.moon.draw(true);
        if (this.sun)
          this.sun.draw(true);
        this.parent();
      },


      drawBillboard: function (message) {

        var textsettings = {
          rectHeight: 100,
          rectWidth: 150,

          // difference between white and black frames
          billboardFrame: 5,
          text: message,
          textFooter: "press [action] to close",
          fontString: "12px Courier",
          // extra padding between edge of text and border of rect
          textPadding: 5,

          // space between lines of text
          textLeading: 20
        };

        var ctx = ig.system.context;

        var wwidth = textsettings.rectWidth * ig.system.scale;
        var hheight = textsettings.rectHeight * ig.system.scale;

        var offsetX = ig.system.width * ig.system.scale / 2 - wwidth / 2;
        var offsetY = ig.system.height * ig.system.scale / 2 - hheight / 2;

        // first draw the white frame
        ctx.fillStyle = "white";
        ctx.fillRect(
          offsetX,
          offsetY,
          wwidth, hheight);

        // then plop the black drawing area inside of that
        ctx.fillStyle = "black";
        ctx.fillRect(
          offsetX + textsettings.billboardFrame,
          offsetY + textsettings.billboardFrame,
          wwidth - (textsettings.billboardFrame * 2),
          hheight - (textsettings.billboardFrame * 2));

        this._drawText(ctx, textsettings);

        // flip this boolean in game -- this pauses all activity
        ig.game.inMenu = true;

      },
      _drawText: function (ctx, textsettings) {

        // break text string up into words
        var lwords = textsettings.text.split(" ");

        ctx.font = textsettings.fontString;

        var currentLine = "";
        var linecount = 0;
        var lineList = []

        var maxwidth = textsettings.rectWidth - (textsettings.textPadding * 2);
        var maxheight = textsettings.rectHeight - (textsettings.textPadding * 2);

        // tick through list of words
        for (x = 0; x < lwords.length; x++) {
          // if line + newest word < maxw, then append and continue
          if (ctx.measureText(currentLine + " " + lwords[x]).width <= maxwidth) {
            currentLine = currentLine + " " + lwords[x];
          }
          else { // past end of row -- save off and create new row
            linecount += 1;
            lineList.push(currentLine);
            // what if lwords is greater than width????
            currentLine = lwords[x];
          }
          if (x == lwords.length - 1) {
            lineList.push(currentLine);
            break;
          }
        }

        if (textsettings.textFooter) {
          lineList.push("");
          lineList.push(textsettings.textFooter);
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        widthDraw = ig.system.realWidth / 2;
        ctx.fillStyle = "white";

        // need to center text vertically
        totalTextHeight = textsettings.textPadding * 2
          + textsettings.textLeading * (lineList.length - 1);
        startDraw = (ig.system.realHeight - totalTextHeight) / 2;

        for (var x = 0; x < lineList.length; x++) {
          ctx.fillText(lineList[x], widthDraw, startDraw + textsettings.textLeading * x);
        }
      },

      say: function (username, txt) {
        var player = this.getEntityByName(username);
        if (player) {
          player.speech = txt;
          player.talktimer.set(1);
        }
      },
      additem: function (name, val, row, col, data, createWorld) {
        if (!data) //
          return;
        if (val != undefined && data['val'] == undefined)
          data['val'] = val;
        else if (val == undefined)
          val = data['val'];

        row = parseInt(row);
        col = parseInt(col);
        switch (name) {
          case 'bit':
            if (val == undefined)
              return;
            if (data.layer != 2)
              ig.game.bitsMap.setTile(row, col, val);
            else
              ig.game.bitsBGMap.setTile(row, col, val);
            if (val == 3) //green == platform
              ig.game.collisionMap.setTile(row, col, 12);
            else if (val == 2 && this.inLevel)
              ig.game.collisionMap.setTile(row, col, 46);
            else if (val != 5 && val != 9 && (val != 4 || !this.inLevel))
              ig.game.collisionMap.setTile(row, col, 1);
            if ($.inArray(parseInt(val), [1, 4, 6, 7, 8, 9]) > -1)
              this.darkLevel = 0;
            if (val == 4 && this.inLevel)
              this.spawnEntity(EntityPipe, parseInt(row), parseInt(col), { water: { x: 0, y: 1 } });
            break;
          case 'block':
          case 'block2':
            var layer = 1;
            if (name == 'block2')
              layer = 2;
            var flip = data.flip;
            if (!flip)
              flip = { x: false, y: false };
            if (data.flipX)
              flip = { x: true, y: false };
            if (data.user && data.set != 0) {
              if (data.set == 1 || data.set == 2 || data.set == 3) {
                var setname = '_set' + data.set + '-' + data.user;
                if (globalTileMapsInfo[setname])
                  this.setTile(row, col, data.frame, setname, layer, flip)
                else
                  this.setTile(row, col, data.frame, 'main' + data.set, layer, flip)
              }
              else
                this.setTile(row, col, data.frame, data.set, layer, flip)
            }
            else
              this.setTile(row, col, data.frame, 'main', layer, flip);
            break;
          case 'paint':
            this.removeitem('paint', row, col);
            if (!data.eraser)
              this.spawnEntity(EntityPaint, parseInt(row), parseInt(col), data);

            if (this.inEditor && this.selectedFrame != 0 && row >= 16 * 11 && row <= 16 * 19 - 4 && col >= 16 && col <= 16 + 16 * 8 + 8) {
              this.shiftedFrame = [];
              this.shiftedDirections = { x: 0, y: 0 };

              if (this.itemId) {
                this.refreshItem();
              }
              else if (this.selectedFrameSet != '0') {

                this.refreshTile();
              }
            }

            break;
          case 'sign':
            var message = data;
            if (data.name && data.message) {
              message = data.message;
              this.spawnEntity(EntitySign, parseInt(row), parseInt(col), { "message": message, "name": data.name });
            }
            else
              this.spawnEntity(EntitySign, parseInt(row), parseInt(col), { "message": data });
            break;
          case 'youtube':
            this.spawnEntity(EntityYoutube, parseInt(row), parseInt(col), data);
            break;
          case 'coin':
            this.totalCoins++;
            this.spawnEntity(EntityCoin, parseInt(row), parseInt(col), data);
            break;
          case 'goomba':
            this.spawnEntity(EntityGoomba, parseInt(row), parseInt(col), data);
            this.goombaSpawns.push({ x: parseInt(row), y: parseInt(col) });
            break;
          case 'door':
            var title = '';
            if (data.title)
              title = data.title;
            this.spawnEntity(EntityDoor, parseInt(row), parseInt(col), { "name": data.name, "doortype": val, "direction": 'up', 'target': { 1: data.target }, 'title': data.title });
            break;
          case 'custom':
            var item = playerinfo.items[data.val];
            if (!item)
              item = itemsInfo[data.val];
            if (!item) {
              //fetch item
              this.socketEmit('fetchitem', data.val);
              return;
            }
            var settings = item.settings;
            if (item.image)
              settings['origSprite'] = item.image;
            settings['itemid'] = val;
            this.spawnEntity(EntityCustom, parseInt(row), parseInt(col), settings);
            break;
          default:
            if (name == 'fish' && !this.waterMap)
              return;
            this.spawnEntity('Entity' + name.charAt(0).toUpperCase() + name.slice(1), parseInt(row), parseInt(col), data);
            if ((new window['Entity' + name.charAt(0).toUpperCase() + name.slice(1)]) instanceof EntityMover) {
              this.moverSpawns.push({ name: name, x: parseInt(row), y: parseInt(col) });
            }
            break;
        }
        ig.game.sortEntitiesDeferred();
      },
      refreshTile: function () {
        var tiledata = false;
        for (var i = 0; i < this.tileMaps.length; i++) {
          if (ig.game.tileMaps[i].name == this.selectedFrameSet && (ig.game.tileMaps[i].tiles.loaded || ig.game.tileMaps[i].tiles.data))
            tiledata = ig.getImagePixels((ig.game.tileMaps[i].tiles.origData || ig.game.tileMaps[i].tiles.data), 0, 0, ig.game.tileMaps[i].tiles.width, ig.game.tileMaps[i].tiles.height);
        }

        var src = tiledata.data;
        var len = src.length;
        var framenum = tiledata.height / 16

        var start = 16 * 16 * 4 * (this.selectedFrame - 1);
        for (var px = start; px < start + (16 * 16 * 4); px += 4) {
          src[px] = 0;
          src[px + 1] = 0;
          src[px + 2] = 0;
          src[px + 3] = 0;
        }

        var paints = ig.game.getEntitiesByType(EntityPaint);
        for (var i = 0; i < paints.length; i++) {
          paint = paints[i];
          if (paint.pos.x >= 16 * 11 && paint.pos.x <= 16 * 19 - 4 && paint.pos.y >= 16 && paint.pos.y <= 16 + 16 * 8 + 8) {
            var x = (paint.pos.x - (16 * 11)) / 8;
            var y = (paint.pos.y - 16) / 8;
            var rgb = paint.hslToRgb();
            //modify tile image
            var px = ((16 * y) + x) * 4 + start;
            src[px] = rgb[0];
            src[px + 1] = rgb[1];
            src[px + 2] = rgb[2];
            src[px + 3] = 255;

          }
        }
        var tilecanvas = ig.$new('canvas');
        tilecanvas.width = 16;
        tilecanvas.height = 16 * framenum;
        var ctx = tilecanvas.getContext("2d");
        ctx.putImageData(tiledata, 0, 0);

        var dataURL = tilecanvas.toDataURL("image/png");
        //var img = new ig.Image( dataURL );
        //var dataURL = 'media/tiletemplate2.png'
        var base64 = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        //set tile image (css and on map)
        for (var i = 0; i < this.tileMaps.length; i++) {
          if (ig.game.tileMaps[i].name == this.selectedFrameSet)
            ig.game.tileMaps[i].setTileset(dataURL);
        }
        for (var i = 0; i < this.tileMaps2.length; i++) {
          if (ig.game.tileMaps2[i].name == 'l2' + this.selectedFrameSet)
            ig.game.tileMaps2[i].setTileset(dataURL);
        }
        if (!playerinfo.tiles)
          playerinfo.tiles = {};
        if (!playerinfo.tiles[this.selectedFrameSet])
          playerinfo.tiles[this.selectedFrameSet] = { username: playerinfo.username, image: base64, setid: this.selectedFrameSet };
        else
          playerinfo.tiles[this.selectedFrameSet]['image'] = base64;
        //playerinfotiles[this.selectedFrameSet] = dataURL
        $('.animframe:not(.eraser)').css('background-image', 'url(' + dataURL + ')');

      },
      refreshItem: function () {
        if (!this.itemEditing.animSheet.image.loaded)
          return;
        var tiledata = ig.getImagePixels(this.itemEditing.animSheet.image.origData || this.itemEditing.animSheet.image.data, 0, 0, this.itemEditing.animSheet.image.width, this.itemEditing.animSheet.image.height);
        if (!tiledata)
          return;
        var src = tiledata.data;
        var len = src.length;

        var itemwidth = this.itemEditing.size.x;
        var itemheight = this.itemEditing.size.y;
        var tilesize = 8;
        if (itemwidth > 16 || itemheight > 16)
          tilesize = 4;

        var framenum = tiledata.height / itemheight;

        var start = itemwidth * itemheight * 4 * (this.selectedFrame - 1);
        for (var px = start; px < start + (itemwidth * itemheight * 4); px += 4) {
          src[px] = 0;
          src[px + 1] = 0;
          src[px + 2] = 0;
          src[px + 3] = 0;
        }

        var paints = ig.game.getEntitiesByType(EntityPaint);
        for (var i = 0; i < paints.length; i++) {
          paint = paints[i];
          //if(paint.pos.x >= 16*11 && paint.pos.x <= 16*19-4 && paint.pos.y >= 16 && paint.pos.y <= 16+16*8+8)
          if (paint.pos.x >= 16 * 11 && paint.pos.x <= 16 * 11 + (itemwidth * tilesize) - 4 && paint.pos.y >= 16 && paint.pos.y <= 16 + (itemheight * tilesize)) {
            var x = (paint.pos.x - (16 * 11)) / tilesize;
            var y = (paint.pos.y - 16) / tilesize;
            var rgb = paint.hslToRgb();
            //modify tile image
            var px = ((itemwidth * y) + x) * 4 + start;
            src[px] = rgb[0];
            src[px + 1] = rgb[1];
            src[px + 2] = rgb[2];
            src[px + 3] = 255;

          }
        }
        var tilecanvas = ig.$new('canvas');
        tilecanvas.width = itemwidth;
        tilecanvas.height = itemheight * framenum;
        var ctx = tilecanvas.getContext("2d");
        ctx.putImageData(tiledata, 0, 0);

        var dataURL = tilecanvas.toDataURL("image/png");
        var base64 = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");

        this.itemEditing.animSheet = new ig.AnimationSheet(dataURL, this.itemEditing.aFrameX, this.itemEditing.aFrameY);
        this.itemEditing.allAnim();

        playerinfo.items[this.itemId]['image'] = dataURL;
        $('.animframe:not(.eraser)').css('background-image', 'url(' + dataURL + ')');

        if (this.itemEditing.equip == 'body') {
          var player = this.getEntitiesByType(EntityPlayer)[0];
          player.offset = { x: 7, y: 4 };
          player.animSheet = new ig.AnimationSheet(dataURL, 32, 32);
          player.allAnim();
          player.currSprite = dataURL;
        }
        else if (this.itemEditing.equip == 'head') {
          var player = this.getEntitiesByType(EntityPlayer)[0];
          player.initplayer(player.anim, dataURL);
        }

      },
      updateitem: function (name, val, row, col, data) {
        switch (name) {
          case 'youtube':
            var yt = this.getEntitiesByType(EntityYoutube);
            if (yt.length) {
              yt[0].updateItem(data['time'], data['state'], data['playlistIndex']);
            }
            break;
        }
      },
      removeitem: function (name, row, col, createWorld) {
        switch (name) {
          case 'bit':
            if (ig.game.bitsMap.getTile(row, col) == 4 && this.inLevel) {
              var items = this.getEntitiesByType('EntityPipe');
              for (var i = 0; i < items.length; i++) {
                item = items[i];
                if (item.pos.x == row && item.pos.y == col)
                  item.kill();
              }
            }
            if (ig.game.bitsMap.getTile(row, col) == 9 || ig.game.bitsBGMap.getTile(row, col) == 9 || ig.game.collisionMap.getTile(row, col))
              this.darkLevel = 0;
            ig.game.bitsMap.setTile(row, col, 0);
            ig.game.bitsBGMap.setTile(row, col, 0);
            ig.game.collisionMap.setTile(row, col, 0);
            if (createWorld && this.stillWater && this.waterMap && this.isNearWater(row, col))
              this.convertWater = true;
            break;
          case 'block':
          case 'block2':
            var layer = 1;
            if (name == 'block2')
              layer = 2;
            this.setTile(row, col, 0, 'main', layer);
            break;
          case 'goomba':
          case 'platform':
          case 'switchblock':
          case 'fish':
          case 'spikeblock':
            var items = this.getEntitiesByType('Entity' + name.charAt(0).toUpperCase() + name.slice(1));
            for (var i = 0; i < items.length; i++) {
              var item = items[i];
              if (item.spawn.x == row && item.spawn.y == col) {
                if (name == 'goomba') {
                  for (var j = 0; j < this.goombaSpawns.length; j++) {
                    if (this.goombaSpawns[j].x == row && this.goombaSpawns[j].y == col)
                      this.goombaSpawns.splice(j, 1)
                  }
                }
                else {
                  for (var j = 0; j < this.moverSpawns.length; j++) {
                    if (this.moverSpawns[j].name == name && this.moverSpawns[j].x == row && this.moverSpawns[j].y == col)
                      this.moverSpawns.splice(j, 1)
                  }
                }
                item.kill();
              }
            }
            break;
          case 'null':
          case 'ghost':
          case 'bat':
            break;
          /*case 'youtube':
          case 'sign':
          case 'door':
          case 'switchblock':
          case 'coin':
          */
          default:
            var items = this.getEntitiesByType('Entity' + name.charAt(0).toUpperCase() + name.slice(1));
            for (var i = 0; i < items.length; i++) {
              item = items[i];
              if (item.pos.x == row && item.pos.y == col) {
                if (name == 'coin')
                  this.totalCoins--;
                item.kill();
              }
            }
            break;
        }
      },
      pickupitem: function (name, val, x, y) {

        this.deleteitem(name, val, x, y);

        if (name != 'block' && name != 'block2' && name != 'custom' && name != 'gift2013' && !ig.game.ignoreInventory) {
          ig.game.inventory[name][val]++;
          this.addInventory(name, val);
        }
      },
      selectPalette: function (entity) {
        var hsl = entity.rgbToHsl();
        var numpal = 18;
        if (!entity.eraser) {

          for (var i = 0; i < (numpal); i++) {
            var l = 50;
            l = 100 - Math.round(100 / (numpal)) * i;
            if (l < 0)
              l = 0;
            this.removeitem('palette', 16 + i * 8, 16 + 8);
            this.spawnEntity(EntityPalette, 16 + i * 8, 16 + 8, { hsl: true, h: hsl[0], l: l, s: 100 });
          }
          for (var i = 0; i < (numpal - 2); i++) {
            var s = 50;
            s = 100 - Math.round(100 / (numpal - 2)) * i;
            if (s < 0)
              s = 0;
            this.removeitem('palette', 16 + i * 8, 16 + 8 * 2);
            this.spawnEntity(EntityPalette, 16 + i * 8, 16 + 8 * 2, { hsl: true, h: hsl[0], l: hsl[2], s: s });
          }
          this.spawnEntity(EntityPalette, 16 + (numpal - 2) * 8, 16 + 8 * 2, { hsl: true, h: 0, l: 0, s: 0 });
        }
        this.selectitem(false, 'palette', { h: hsl[0], s: hsl[1], l: hsl[2], color: entity.color(), eraser: entity.eraser });
      },
      deleteitem: function (name, val, x, y) {
        if (name == 'goomba' || name == 'platform' || name == 'switchblock' || name == 'fish' || name == 'spikeblock') {
          var gs = this.getEntitiesByType('Entity' + name.charAt(0).toUpperCase() + name.slice(1));
          for (var i = 0; i < gs.length; i++) {
            var g = gs[i];
            if (this.isCollisionEntity(g, x, y, 1, 1)) {
              x = g.spawn.x;
              y = g.spawn.y;
            }
          }
        }
        this.socketEmit('removeitem', name, val, x, y);
        ig.game.removeitem(name, x, y, true);
      },
      gotitem: function (name, val, num) //from server
      {
        //if(ig.game.ignoreInventory)
        //  return;
        if (typeof ig.game.inventory[name] === 'undefined')
          ig.game.inventory[name] = [];
        if (typeof ig.game.inventory[name][val] === 'undefined')
          ig.game.inventory[name][val] = 0;
        for (i = 0; i < num; i++) {
          ig.game.inventory[name][val]++;
        }

        if (this.levelOwner == playerinfo.username && this.ignoreInventory) {
          if (this.itemEditing)
            this.hideInventory();
          else
            this.setFullInventory();
        }
        else
          this.addInventory('', '');

      },
      selectframe: function ($item, val) {
        if (this.inEditor && this.itemId)
          return this.selectItemFrame(val);
        $('#frameoptions, #tileoptions').show();
        $('.animframes div').removeClass('selected');
        if (val == 0) {
          this.selectitem($item, 'eraser', 1);
        }
        else {
          $('.animframes > div').removeClass('out in set1 set2 set3');
          $('.animframe').removeAttr('style');
          $('.frameedit').toggle(this.selectedFrameSet != '0' && !this.inEditor);
          $('.frameadd').hide();
          var addlimit = false;
          if (this.selectedFrameSet == '0') {
            $('.animframe:not(.eraser)').remove();
            for (var i = 5; i >= 0; i--) {
              $('.animframes').find('.eraser').after('<div class="animframe animframe' + (i + 1) + '" style="background-position: -0px -' + (i * 32) + 'px;" data-val="' + (i + 1) + '"></div>');
            }
            $('.animframe:not(.eraser)').css('-moz-background-size', '32px 192px').css('background-size', '32px 192px');
            if (!this.bigArea && !(this.currentLevel.indexOf('*2') !== -1 || this.levelSettings.leveltype == 2)) {
              $('.animframes > div').addClass('in');
            }
            else
              $('.animframes > div').addClass('out');
          }
          else if (playerinfo.tiles && playerinfo.tiles[this.selectedFrameSet] && playerinfo.tiles[this.selectedFrameSet]['image']) {
            var temp = new Image();
            temp.onload = function () {
              $('.animframe:not(.eraser)').remove();
              for (var i = (this.height / 16) - 1; i >= 0; i--) {
                $('.animframes').find('.eraser').after('<div class="animframe animframe' + (i + 1) + '" style="background-position: -0px -' + (i * 32) + 'px;" data-val="' + (i + 1) + '"></div>');
              }
              if (this.height / 16 >= 12)
                addlimit = true;
              $('.animframe:not(.eraser)').css('-moz-background-size', '32px ' + (this.height * 2) + 'px').css('background-size', '32px ' + (this.height * 2) + 'px').css('background-image', 'url(data:image/png;base64,' + playerinfo.tiles[ig.game.selectedFrameSet]['image'] + ')');
              $('.animframe' + val).addClass('selected');
            };
            temp.src = 'data:image/png;base64,' + playerinfo.tiles[this.selectedFrameSet]['image'];
            //$('.animframe:not(.eraser)').css('background-image', 'url(data:image/png;base64,'+playerinfo.tiles[this.selectedFrameSet]+')');
          }
          else if (playerinfo.tiles && playerinfo.tiles[this.selectedFrameSet]) {
            $('.animframe:not(.eraser)').remove();
            $('.animframes').find('.eraser').after('<div class="animframe animframe1" data-val="1"></div>');
            $('.animframe:not(.eraser)').css('-moz-background-size', '32px 32px').css('background-size', '32px 32px');
            //$('.animframes > div').addClass('set'+this.selectedFrameSet);
          }
          if (this.inEditor) {
            this.shiftedFrame = [];
            this.shiftedDirections = { x: 0, y: 0 };

            var paints = ig.game.getEntitiesByType(EntityPaint);
            for (var i = 0; i < paints.length; i++) {
              paint = paints[i];
              if (paint.pos.x >= 16 * 11 && paint.pos.x <= 16 * 19 - 4 && paint.pos.y >= 16 && paint.pos.y <= 16 + 16 * 8 + 8) {
                paint.kill();
              }
            }
            if (this.selectedFrameSet == '0') {
              $('#frameoptions, #tileoptions').hide();
            }
            else// if(playerinfo.tiles && playerinfo.tiles[this.selectedFrameSet])
            {
              $('.framesave, .framecopy, .framepaste, .frameshift, .frameclear, .hexcolor').show();
              if (!addlimit)
                $('.frameadd').show();
              var tiledata = false;
              for (var i = 0; i < this.tileMaps.length; i++) {
                if (ig.game.tileMaps[i].name == this.selectedFrameSet)
                  tiledata = ig.getImagePixels(ig.game.tileMaps[i].tiles.origData, 0, 0, ig.game.tileMaps[i].tiles.width, ig.game.tileMaps[i].tiles.height);

              }

              var src = tiledata.data;
              var len = src.length;
              var sR, sG, sB, sA;
              var start = 16 * 16 * 4 * (val - 1)
              for (var px = start; px < start + (16 * 16 * 4); px += 4) {
                sR = src[px];
                sG = src[px + 1];
                sB = src[px + 2];
                sA = src[px + 3];

                var pxt = (px - start) / 4;
                var pxy = Math.floor(pxt / 16);
                var pxx = pxt - (pxy * 16);
                var x = pxx * 8 + 16 * 11;
                var y = pxy * 8 + 16;
                if (sA > 0)
                  this.spawnEntity(EntityPaint, x, y, { r: sR, g: sG, b: sB, hsl: false });
              }
              /*already done?
              if(playerinfo.tiles && playerinfo.tiles[this.selectedFrameSet]){
                $('.animframe:not(.eraser)').css('background-image', 'url(data:image/png;base64,'+playerinfo.tiles[this.selectedFrameSet]+')');
              }
              else{
                $('.animframes > div').addClass('set'+this.selectedFrameSet);
              }*/
            }
          }

          this.selectedFrame = val;
          this.selectitem($item, 'block', 1);
        }
        $('.animframe' + val).addClass('selected');


        /*
        var cursor2 = this.getEntitiesByType( EntityCursor )[1];
        if(cursor2)
        {
          this.spawnEntity( EntityCursor, 0,0, {size:cursor2.size, animVal:val, animImage:cursor2.animImage, tileSize:cursor2.tileSize} );
          cursor2.kill();
        }
        */
      },
      selectItemFrame: function (val) {
        if (!this.inEditor)
          return;

        this.shiftedFrame = [];
        this.shiftedDirections = { x: 0, y: 0 };

        var itemwidth = 16;
        var itemheight = 16;
        if (playerinfo.items[this.itemId]['settings']['width'] && playerinfo.items[this.itemId]['settings']['height']) {
          itemwidth = playerinfo.items[this.itemId]['settings']['width'];
          itemheight = playerinfo.items[this.itemId]['settings']['height'];
        }
        var ratiow = (32 / itemwidth);
        var ratioh = (32 / itemheight);

        var paints = ig.game.getEntitiesByType(EntityPaint);
        for (var i = 0; i < paints.length; i++) {
          paint = paints[i];
          if (paint.pos.x >= 16 * 11 && paint.pos.x <= 16 * 19 - 4 && paint.pos.y >= 16 && paint.pos.y <= 16 + 16 * 8 + 8) {
            paint.kill();
          }
        }
        $('#tileoptions').hide();
        $('#frameoptions').show();
        $('.frameadd').hide();
        var addlimit = false;

        $('.animframe:not(.eraser)').remove();

        if (playerinfo.items[this.itemId]['image'] || (playerinfo.items[this.itemId]['settings']['equip'] == 'body' && this.itemEditing.origSprite)) {
          var img = playerinfo.items[this.itemId]['image'] || this.itemEditing.origSprite;
          var temp = new Image();
          temp.onload = function () {
            $('.animframe:not(.eraser)').remove();
            for (var i = (this.height / itemheight) - 1; i >= 0; i--) {
              $('.animframes').find('.eraser').after('<div class="animframe animframe' + (i + 1) + '" style="background-position: -0px -' + (i * itemheight * ratioh) + 'px;" data-val="' + (i + 1) + '"></div>');
            }
            if (this.height / itemheight >= 2)
              addlimit = true;
            $('.animframe:not(.eraser)').css('-moz-background-size', (itemwidth * ratiow) + 'px ' + (this.height * ratioh) + 'px').css('background-size', (itemwidth * ratiow) + 'px ' + (this.height * ratioh) + 'px').css('background-image', 'url(' + img + ')');
            $('.animframe' + val).addClass('selected');


            if (!ig.game.itemEditing.animSheet.image.loaded)
              return;

            if (!addlimit)
              $('.frameadd').show();

            var tiledata = ig.getImagePixels(ig.game.itemEditing.animSheet.image.origData, 0, 0, ig.game.itemEditing.animSheet.image.width, ig.game.itemEditing.animSheet.image.height);

            var src = tiledata.data;
            var len = src.length;
            var sR, sG, sB, sA;
            var start = itemwidth * itemheight * 4 * (val - 1)
            var tilesize = 8;
            if (itemwidth > 16 || itemheight > 16)
              tilesize = 4;
            for (var px = start; px < start + (itemwidth * itemheight * 4); px += 4) {
              sR = src[px];
              sG = src[px + 1];
              sB = src[px + 2];
              sA = src[px + 3];

              var pxt = (px - start) / 4;
              var pxy = Math.floor(pxt / itemwidth);
              var pxx = pxt - (pxy * itemwidth);
              var x = pxx * tilesize + 16 * 11;
              var y = pxy * tilesize + 16;
              if (sA > 0)
                ig.game.spawnEntity(EntityPaint, x, y, { r: sR, g: sG, b: sB, hsl: false, size: { x: tilesize, y: tilesize } });
            }

            ig.game.selectedFrame = val;


          };
          temp.src = img;
        }
        else {
          $('.animframes').find('.eraser').after('<div class="animframe animframe1" data-val="1"></div>');
          $('.animframe:not(.eraser)').css('-moz-background-size', (itemwidth * ratiow) + 'px ' + (itemheight * ratioh) + 'px').css('background-size', (itemwidth * ratiow) + 'px ' + (itemheight * ratioh) + 'px');
          $('.animframe:not(.eraser)').css('background-image', 'url(media/custom' + itemwidth + 'x' + itemheight + '.png)');//data:image/png;base64,
          //$('.animframe:not(.eraser)').css('-moz-background-size', '32px 64px');
          //$('.animframe:not(.eraser)').css('background-size', '32px 64px');
        }

        for (var i = 2; i > 0; i--) {
          //$('.animframes').find('.eraser').after('<div class="animframe animframe'+i+'" data-val="'+i+'"></div>');
        }
        /*
            $('.animframes > div').removeClass('out in set1 set2 set3 selected setItemDefault');
            $('.animframe1').removeAttr( 'style' );
            $('.animframe2').removeAttr( 'style' );
            */

        /*
        $('.animframe'+val).addClass('selected');
        if(playerinfo.items && playerinfo.items[this.itemId] && playerinfo.items[this.itemId]['image'])
        {
          $('.animframe:not(.eraser)').css('background-image', 'url('+playerinfo.items[this.itemId]['image']+')');//data:image/png;base64,
          $('.animframe:not(.eraser)').css('-moz-background-size', '32px 64px');
          $('.animframe:not(.eraser)').css('background-size', '32px 64px');
        }
        else{
          //$('.animframe:not(.eraser)').addClass('setItemDefault');
          $('.animframe:not(.eraser)').css('background-image', 'url(media/custom'+playerinfo.items[this.itemId]['image']+')');//data:image/png;base64,
          $('.animframe:not(.eraser)').css('-moz-background-size', '32px 64px');
          $('.animframe:not(.eraser)').css('background-size', '32px 64px');
        }*/

        if (!this.itemEditing.animSheet.image.loaded)
          return;

        if (!addlimit)
          $('.frameadd').show();

        var tiledata = ig.getImagePixels(this.itemEditing.animSheet.image.origData, 0, 0, this.itemEditing.animSheet.image.width, this.itemEditing.animSheet.image.height);

        var src = tiledata.data;
        var len = src.length;
        var sR, sG, sB, sA;
        var start = itemwidth * itemheight * 4 * (val - 1)
        var tilesize = 8;
        if (itemwidth > 16 || itemheight > 16)
          tilesize = 4;
        for (var px = start; px < start + (itemwidth * itemheight * 4); px += 4) {
          sR = src[px];
          sG = src[px + 1];
          sB = src[px + 2];
          sA = src[px + 3];

          var pxt = (px - start) / 4;
          var pxy = Math.floor(pxt / itemwidth);
          var pxx = pxt - (pxy * itemwidth);
          var x = pxx * tilesize + 16 * 11;
          var y = pxy * tilesize + 16;
          if (sA > 0)
            this.spawnEntity(EntityPaint, x, y, { r: sR, g: sG, b: sB, hsl: false, size: { x: tilesize, y: tilesize } });
        }

        this.selectedFrame = val;
      },
      selectitem: function ($item, name, val) {
        if (name == 'lantern') {
          this.lanternOn = !this.lanternOn;
          this.addInventory('', '');
          this.darkLevel = 0;
          return;
        }
        var cursor = this.getEntitiesByType(EntityCursor)[0];
        var cursor2 = this.getEntitiesByType(EntityCursor)[1];
        if (cursor)
          cursor.kill();
        if (cursor2)
          cursor2.kill();
        var size, animVal, animImage, c2animImage, color;
        var size = false;

        $('.inventory div').removeClass('selected');
        $('.inventory-actions div').removeClass('selected');
        if ($item)
          $item.addClass('selected');

        this.selectedItemName = name;
        this.selectedItemValue = val;
        var tileSize = 8;
        var flip = { x: false, y: false };

        if (name == 'hand' || name == 'move')
          return;

        switch (name) {
          case 'bit':
            size = { x: 8, y: 8 };
            animImage = 'media/bits.png';
            break;
          case 'eraser':
            size = { x: 16, y: 16 };
            tileSize = 16;
            animImage = 'media/blocks.png';
            val = 4;
            break;
          case 'block':
            size = { x: 16, y: 16 };
            tileSize = 16;
            if (this.selectedFrameSet == '0') {
              if (!this.bigArea && !(this.currentLevel.indexOf('*2') !== -1 || this.levelSettings.leveltype == 2))
                animImage = 'media/inside.png';
              else
                animImage = 'media/building.png';
            }
            else if (playerinfo.tiles && playerinfo.tiles[this.selectedFrameSet] && playerinfo.tiles[this.selectedFrameSet]['image']) {
              animImage = 'data:image/png;base64,' + playerinfo.tiles[this.selectedFrameSet]['image'];
              //$('.animframe:not(.eraser)').css('background-image', 'url(data:image/png;base64,'+playerinfo.tiles[this.selectedFrameSet]+')');
            }
            else {
              animImage = 'media/blanktile.png';
            }
            /*
              animImage = $('.animframe1').css('background-image').slice(4,-1);
              if(animImage.indexOf('http') == 1 || animImage.indexOf('data') == 1)
                animImage = animImage.slice(1,-1);
              //  animImage = animImage.substring(animImage.indexOf('media'));
            */
            val = this.selectedFrame;
            flip = this.tileFlipped;
            break;


          /*
        case 'sign':
          size = (new EntitySign).size;
          animImage = 'media/sign.png';
          break;
        case 'goomba':
          size = (new EntityGoomba).size;
          animImage = 'media/goomba.png';
          break;
        case 'switchblock':
          size = (new EntitySwitchblock).size;
          animImage = 'media/switch.png';
          break;
        case 'coin':
          size = (new EntityCoin).size;
          animImage = 'media/coin.png';
          break;*/
          case 'youtube':
            size = { x: 56, y: 40 }
            animImage = 'media/youtube.png';
            break;
          case 'door':
            size = (new EntityDoor).size;
            tileSize = 16;
            animImage = 'media/door.png';
            break;
          case 'palette':
            size = { x: 8, y: 8 };
            tileSize = 8;
            if (this.itemEditing && (this.itemEditing.size.x > 16 || this.itemEditing.size.y > 16)) {
              tileSize = 4;
              size = { x: 4, y: 4 };
            }
            animImage = 'media/grid8.png';
            if (!val.eraser) {
              this.spawnEntity(EntityCursor, 0, 0, { size: size, tileSize: tileSize, color: val.color });
              return;
            }
            val = 1;
            break;
          case 'custom':
            var entity = (new window['EntityCustom']);
            size = entity.size;
            if (playerinfo.items[val]['settings']['width'] && playerinfo.items[val]['settings']['height'])
              size = { x: playerinfo.items[val]['settings']['width'], y: playerinfo.items[val]['settings']['height'] }
            if (playerinfo.items[val]['image'])
              animImage = playerinfo.items[val]['image'];
            else
              animImage = 'media/custom' + playerinfo.items[val]['settings']['width'] + 'x' + playerinfo.items[val]['settings']['height'] + '.png';
            val = 1;
            break;
          default:
            var entity = (new window['Entity' + name.charAt(0).toUpperCase() + name.slice(1)]);
            size = entity.size;
            animImage = entity.origSprite;
            break;
        }

        if (size !== false) {
          this.spawnEntity(EntityCursor, 0, 0, { size: size, animVal: val, animImage: animImage, tileSize: tileSize, flip: flip, cursorName: name });
        }
        if (c2animImage) {
          this.spawnEntity(EntityCursor, 0, 0, { size: size, animVal: c2val, animImage: c2animImage, tileSize: tileSize, flip: flip, cursorName: name });
        }
      },
      equipitem: function ($item, name, val) {
        if (name == 'lantern') {
          this.lanternOn = !this.lanternOn;
          this.addInventory('', '');
          this.darkLevel = 0;
          return;
        }
        else if (name == 'gun') {
          $('.guns div').removeClass('selected');
          if($item){
            $item.addClass('selected');
          }

          var player = this.getEntitiesByType(EntityPlayer)[0];
          switch (val) {
            case 0:
              player.setGun(false);
              break;
            case 1:
              player.setGun(EntityBlaster);
              break;
            case 2:
              player.setGun(EntityCrackerlauncher);
              break;
          }
          this.sendplayerpos(0, 0, false);
        }
        else if (name == 'tiptron') {
          var player = this.getEntitiesByType(EntityPlayer)[0];
          player.equipItem(name);
          this.sendplayerpos(0, 0, false);
        }
        else //custom
        {
          var player = this.getEntitiesByType(EntityPlayer)[0];
          player.equipItem(name);
          this.sendplayerpos(0, 0, false);
        }
      },
      smelt: function (val, num) {
        var allow = true;
        var check = [];

        switch (val) {
          case 5:
            check = ['2', '3', '4'];
            break;
          case 6:
            check = ['7', '8', '9'];
            break;
          case 7:
            check = ['3', '4'];
            break;
          case 8:
            check = ['2', '4'];
            break;
          case 9:
            check = ['2', '3'];
            break;
          case "pixel":
            check = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
            break;
        }

        for (var i = 0; i < check.length; i++) {
          if (!ig.game.inventory['bit'] || !ig.game.inventory['bit'][check[i]] || !(ig.game.inventory['bit'][check[i]] >= num)) {
            allow = false;
          }
        }
        if (allow) {
          for (var i = 0; i < check.length; i++) {
            ig.game.inventory['bit'][check[i]] -= num;
          }
          this.socketEmit('smelt', val, num);
        }

      },
      addInventory: function (name, val) {
        $('.inventory').html('');
        //$('.inventory').append('<div class="move move1" data-toggle="tooltip" title="Touch-Move" data-name="move" data-val="1"><span></span></div><div class="hand hand1" data-toggle="tooltip" title="Pick-Up Items" data-name="hand" data-val="1"><span></span></div><a href="#equipModal" role="button" class="btn btn-mini" data-toggle="modal" id="equipBtn">Equip</a>');
        for (var key in ig.game.inventory) {
          for (var key2 in ig.game.inventory[key]) {
            if (key == 'bit' && ig.game.inventory[key][key2] > 0)
              $('.inventory').append('<div class="invbits ' + key + ' ' + key + key2 + '" data-name="' + key + '" data-val="' + key2 + '"><span>' + ig.game.inventory[key][key2] + '</span></div>')
            else if (key == 'pixel')
              $('#pixelBtn').text('Pixels (' + ig.game.inventory[key][key2] + ')');
            //else if(key == 'custom' && ig.game.inventory[key][key2] > 0)
            //  $('.inventory').append('<div class="invcustom '+key+' '+key+key2+'" data-name="'+key+'" data-val="'+key2+'"><span></span></div>')
            else if (key != 'fish' && key != 'tiptron' && key != 'ghost' && key != 'null' && key != 'lantern' && key != 'block' && key != 'block2' && ig.game.inventory[key][key2] > 0)
              $('.inventory').append('<div class="invitems ' + key + ' ' + key + key2 + '" data-name="' + key + '" data-val="' + key2 + '"><span>' + ig.game.inventory[key][key2] + '</span></div>')
            else if (key == 'lantern')
              $('.inventory').append('<div class="invitems ' + key + ' ' + key + key2 + '" data-name="' + key + '" data-val="' + key2 + '"><span>' + (this.lanternOn ? 'ON' : 'OFF') + '</span></div>')
            else if (key == 'tiptron')
              $('.equip.tiptron').show();
          }
        }
        if (playerinfo.username == 'Francis')
          $('.inventory').append('<div class="invitems gift2013 gift20131" data-name="gift2013" data-val="1"><span>GIFT</span></div>')
        $('.invitems').hide();
        /*
        if(this.levelOwner == playerinfo.username)
        for(var key in playerinfo.items){
          var itemimg = playerinfo.items[key]['image'];
          if(!itemimg)
            itemimg = 'media/custom.png';
          if(playerinfo.items[key]['settings'])
            $('.inventory').append('<div class="custom invcustom" data-toggle="tooltip" title="'+playerinfo.items[key]['settings']['name']+'" data-name="custom" data-val="'+playerinfo.items[key].itemid+'" style="background-image: url(\''+itemimg+'\')"></div>')
        }*/
        $('.inventory').append('<div class="frameset invtiles" data-val="0" style="background-image: url(\'media/building.png\');"></div>');
        for (var key in playerinfo.tiles) {
          var img = playerinfo.tiles[key]['image'];
          if (!img)
            $('.inventory').append('<div class="frameset invtiles" data-val="' + key + '"></div>');
          else
            $('.inventory').append('<div class="frameset invtiles" data-val="' + key + '"  style="background-image: url(\'data:image/png;base64,' + img + '\');"></div>');
        }
        $('.inventory').append('<div class="btn btn-mini addframeset invtiles">NEW SET</div>');
        $('.inventory').tooltip();
        $item = $('.inventory > .' + this.selectedItemName + this.selectedItemValue).addClass('selected');
        $('.inventory > .invbits').hide();
        $('.inventory > .invitems').hide();
        $('.inventory > .invcustom').hide();
        $('.inventory > .invtiles').hide();
        if (this.selectedItemName == 'bit')
          $('.inventory > .invbits').show();
        //else if(this.selectedItemName == 'custom')
        //  $('.inventory > .invcustom').show();
        else if (this.selectedItemName == 'block' || this.selectedItemName == 'block2')
          $('.inventory > .invtiles').show();
        else
          $('.inventory > .invitems').show();
        //$item.find('span').text(ig.game.inventory[name][val]);

        $('#bodyequiparea').html('');
        $('#headequiparea').html('<div class="btn defaulthead" data-dismiss="modal" data-val="defaulthead" data-toggle="tooltip" title="Default" data-placement="top">Default</div><div class="btn nohead" data-dismiss="modal" data-val="nohead" data-toggle="tooltip" title="None" data-placement="top">None</div>');

        for (var key in playerinfo.items) {
          var itemimg = playerinfo.items[key]['image'];
          if (playerinfo.items[key]['settings']['equip']) {
            if (playerinfo.items[key]['settings']['equip'] == 'body')
              $('#bodyequiparea').append('<div class="equip" data-placement="top" data-dismiss="modal" data-toggle="tooltip" title="' + playerinfo.items[key]['settings']['name'] + '" data-name="custom" data-val="' + playerinfo.items[key].itemid + '" style="background-image: url(\'' + itemimg + '\');width:32px;height:32px;-moz-background-size:32px 224px;background-size:32px 224px"></div>')
            else if (playerinfo.items[key]['settings']['equip'] == 'head')
              $('#headequiparea').append('<div class="equip" data-placement="top"data-dismiss="modal" data-toggle="tooltip" title="' + playerinfo.items[key]['settings']['name'] + '" data-name="custom" data-val="' + playerinfo.items[key].itemid + '" style="background-image: url(\'' + itemimg + '\');width:32px;height:32px;-moz-background-size:32px 32px;background-size:32px 32px"></div>')
          }
        }

      },
      setFullInventory: function () {
        $('.inventory').html('');
        $('#bodyequiparea').html('');
        $('#headequiparea').html('<div class="btn defaulthead" data-dismiss="modal" data-val="defaulthead" data-toggle="tooltip" title="Default" data-placement="top">Default</div><div class="btn nohead" data-dismiss="modal" data-val="nohead" data-toggle="tooltip" title="None" data-placement="top">None</div>');
        //$('.inventory').append('<div class="move move1" data-toggle="tooltip" title="Touch-Move" data-name="move" data-val="1"><span></span></div><div class="hand hand1" data-toggle="tooltip" title="Pick-Up Items" data-name="hand" data-val="1"><span></span></div><a href="#equipModal" role="button" class="btn btn-mini" data-toggle="modal" id="equipBtn">Equip</a>');
        var fullInventory = {
          'bit': { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 },
          'sign': { 1: 1 },
          'goomba': { 1: 1 },
          'fish': { 1: 1 },
          'youtube': { 1: 1 },
          'switchblock': { 1: 1 },
          'coin': { 1: 1 },
          'platform': { 1: 1 },
          'spikeblock': { 1: 1 },
          'target': { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }
        };
        for (var key in fullInventory) {
          for (var key2 in fullInventory[key]) {
            if (key == '')
              $('.inventory').append('<div class="textitem ' + key + ' ' + key + key2 + '" data-name="' + key + '" data-val="' + key2 + '"><span>' + key + '</span></div>')
            else if (key == 'bit')
              $('.inventory').append('<div class="invbits ' + key + ' ' + key + key2 + '" data-name="' + key + '" data-val="' + key2 + '"><span></span></div>')
            else if (key != 'null' && key != 'lantern' && key != 'block' && key != 'block2' && fullInventory[key][key2] > 0)
              $('.inventory').append('<div class="invitems ' + key + ' ' + key + key2 + '" data-name="' + key + '" data-val="' + key2 + '"></div>')
          }
        }
        for (var key in playerinfo.items) {
          var itemimg = playerinfo.items[key]['image'];
          if (playerinfo.items[key]['settings']['equip']) {
            if (playerinfo.items[key]['settings']['equip'] == 'body')
              $('#bodyequiparea').append('<div class="equip" data-placement="top" data-dismiss="modal" data-toggle="tooltip" title="' + playerinfo.items[key]['settings']['name'] + '" data-name="custom" data-val="' + playerinfo.items[key].itemid + '" style="background-image: url(\'' + itemimg + '\');width:32px;height:32px;-moz-background-size:32px 224px;background-size:32px 224px"></div>')
            else if (playerinfo.items[key]['settings']['equip'] == 'head')
              $('#headequiparea').append('<div class="equip" data-placement="top"data-dismiss="modal" data-toggle="tooltip" title="' + playerinfo.items[key]['settings']['name'] + '" data-name="custom" data-val="' + playerinfo.items[key].itemid + '" style="background-image: url(\'' + itemimg + '\');width:32px;height:32px;-moz-background-size:32px 32px;background-size:32px 32px"></div>')
          }
          else {
            if (!itemimg) {
              if (playerinfo.items[key]['settings']['width'] && playerinfo.items[key]['settings']['height'])
                itemimg = 'media/custom' + playerinfo.items[key]['settings']['width'] + 'x' + playerinfo.items[key]['settings']['height'] + '.png';
              else
                itemimg = 'media/custom16x16.png';
            }
            if (playerinfo.items[key]['settings'] && playerinfo.items[key]['settings']['width'] && playerinfo.items[key]['settings']['height']) {
              var ratiow = (32 / playerinfo.items[key]['settings']['width']);
              var ratioh = (32 / playerinfo.items[key]['settings']['height']);
              var cssw = (playerinfo.items[key]['settings']['width'] * ratiow);
              var cssh = (playerinfo.items[key]['settings']['height'] * ratioh);
              if (playerinfo.items[key]['settings']['frames'] == 2)
                cssh = cssh * 2;
              $('.inventory').append('<div class="custom invcustom" data-toggle="tooltip" title="' + playerinfo.items[key]['settings']['name'] + '" data-name="custom" data-val="' + playerinfo.items[key].itemid + '" style="background-image: url(\'' + itemimg + '\');-moz-background-size:' + cssw + 'px ' + cssh + 'px;background-size:' + cssw + 'px ' + cssh + 'px"></div>')
            }
            else if (playerinfo.items[key]['settings'])
              $('.inventory').append('<div class="custom invcustom" data-toggle="tooltip" title="' + playerinfo.items[key]['settings']['name'] + '" data-name="custom" data-val="' + playerinfo.items[key].itemid + '" style="background-image: url(\'' + itemimg + '\');"></div>')
          }
        }
        if (!this.inEditor)
          $('.inventory').append('<div class="frameset invtiles" data-val="0"  style="background-image: url(\'media/building.png\');"></div>');
        for (var key in playerinfo.tiles) {
          var img = playerinfo.tiles[key]['image'];
          if (!img)
            $('.inventory').append('<div class="frameset invtiles" data-val="' + key + '"></div>');
          else
            $('.inventory').append('<div class="frameset invtiles" data-val="' + key + '"  style="background-image: url(\'data:image/png;base64,' + img + '\');"></div>');
        }
        $('.inventory').append('<div class="btn btn-mini addframeset invtiles">NEW SET</div>');
        $('.inventory').tooltip();
        $item = $('.inventory > .' + this.selectedItemName + this.selectedItemValue).addClass('selected');
        $('.inventory > .invbits').hide();
        $('.inventory > .invitems').hide();
        $('.inventory > .invcustom').hide();
        $('.inventory > .invtiles').hide();
        if (this.selectedItemName == 'block' || this.selectedItemName == 'block2' || this.inEditor)
          $('.inventory > .invtiles').show();
        else if (this.selectedItemName == 'bit')
          $('.inventory > .invbits').show();
        else if (this.selectedItemName == 'custom')
          $('.inventory > .invcustom').show();
        else
          $('.inventory > .invitems').show();

        //$item.find('span').text(ig.game.inventory[name][val]);
        //TODO: buttons 
        //inventory-actions div click //ig.game.selectitem($item, $item.data('name'), $item.data('val')); 
        //inventory frameset
        //ig.game.selectedFrameSet = $btn.data('val');
        //ig.game.selectframe($('.animframe1'), '1');    
        //addframeset ig.game.addTileSet();
        //framesave: ig.game.saveTiles();
        //framecopy: ig.game.copyFrame();
        //frameshift: ig.game.shifting = false;
        //framepaste, frameclear, frameadd
        //ig.game.pasteFrame(), ig.game.clearFrame(), ig.game.addTile();
        //frameflip/flop ig.game.flipTiles($('.frameflip').is(":checked"),$('.frameflop').is(":checked"));
        //framelayer ig.game.selectedLayer = '2' or '1'
        //form submit: ig.game.saveLevel();, ig.game.saveItem();, ig.game.saveBody();, ig.game.saveHead();
        //invtoggle: hide .invbits, .invitems, invcustom, invtiles
        //animframe: ig.game.selectframe($(this), $(this).data('val'));
        //hex color: new EntityPalatte; ig.game.selectPalette(pal); 
        //guns //ig.game.equipitem($item, 'gun', $item.data('val'));     
        //body ig.game.equipitem($item, $item.data('val'), 1);  
        //equips ig.game.equipitem($item, $item.data('val'), 1); 
        //mute:
        //abort: socket.emit('changelevel', 'LevelTest', 'LevelTest-'+playerinfo.username);
        //retry ig.game.resetLevel(true);
        //editorbutton socket.emit('editor', 'background');
        //smelt ig.game.smelt(val, num);
        //
      },
      hideInventory: function () {
        $('.inventory').html('');
        //$('.inventory').append('<div class="move move1" data-toggle="tooltip" title="Touch-Move" data-name="move" data-val="1"><span></span></div><div class="hand hand1" data-toggle="tooltip" title="Pick-Up Items" data-name="hand" data-val="1"><span></span></div><a href="#equipModal" role="button" class="btn btn-mini" data-toggle="modal" id="equipBtn">Equip</a>');
        //$('.inventory').tooltip();
      },
      //check if placement is valid
      placeitem: function (name, val, x, y) {

        if (name == 'sign') {
          var pos = this.reposition(x, y, 8);
          x = pos.x; y = pos.y;
          var numsigns = 0;
          for (var i = 0; i < this.entities.length; i++) {
            e = this.entities[i];
            if (e instanceof EntitySign && e.name) {
              var split = e.name.split('|');
              if (split[1] == playerinfo.username)
                numsigns++;
            }
          }
          if (numsigns >= 2 && !this.ignoreInventory) {
            this.billboardMessage = 'Only two signs per person per area, sorry.';
            return;
          }

          bootbox.prompt("Sign message. (64 char limit)", function (result) {
            if (result === null) {
            } else {
              ig.game.doplaceitem(name, val, x, y, { message: result.substr(0, 64), name: 'sign-' + numsigns + '|' + playerinfo.username });
              ig.game.sortEntitiesDeferred();
            }
          });
        }
        else if (name == 'youtube') {
          var pos = this.reposition(x, y, 8);
          x = pos.x; y = pos.y;
          if (this.currentLevel.indexOf('|') == -1) {
            this.billboardMessage = 'TV can only be placed in your own area.';
            return;
          }
          var yt = this.getEntitiesByType(EntityYoutube);
          if (yt && yt.length > 0) {
            this.billboardMessage = 'Only one TV per area, sorry.';
            return;
          }
          bootbox.prompt("YouTube link to video or playlist", function (result) {
            if (result === null) {
            } else {
              var data = { video: '', playlist: '', time: 0 };
              var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
              var match = result.match(regExp);
              if (match && match[7].length == 11) {
                data['video'] = match[7];
              }
              if (result.search('list=') > -1) {
                var playlistid = result.split('list=')[1];
                var ampersandPosition = playlistid.indexOf('&');
                if (ampersandPosition != -1) {
                  playlistid = playlistid.substring(0, ampersandPosition);
                }
                data['playlist'] = playlistid;
              }
              if (data['video'] == '' && data['playlist'] == '') {
                ig.game.billboardMessage = 'Invalid youtube link.';
                return;
              }
              ig.game.doplaceitem(name, val, x, y, data);
              ig.game.sortEntitiesDeferred();
            }
          });
        }
        else if (name == 'door') {
          //this.billboardMessage = 'Doors are discontinued.';
          //return;
          var pos = this.reposition(x, y, 16);
          x = pos.x; y = pos.y;
          if (this.currentLevel.indexOf('|') > -1 && this.ignoreInventory) {
            this.billboardMessage = 'No more doors allowed in here.';
            return;
          }
          var doorname = this.currentLevel + '-' + playerinfo.username;
          var target = this.currentLevel + '|' + playerinfo.username + '-1';
          if (val == 2) {
            doorname += '*2'
            target = this.currentLevel + '|' + playerinfo.username + '*2-start';
          }
          if (val == 3) {
            doorname += '*3'
            target = this.currentLevel + '|' + playerinfo.username + '*3-start';
          }
          var door = this.getEntityByName(doorname);
          if (door) //only one door per person per level
          {
            this.billboardMessage = 'Only one door per person per area, sorry.';
            return;
          }
          var doors = this.getEntitiesByType('EntityDoor');
          for (var d = 0; d < doors.length; d++) {
            e = doors[d];
            var fakedoor = { pos: { x: e.pos.x - 16 * 3, y: e.pos.y - 16 * 3 }, size: { x: e.size.x * 7, y: e.size.y * 3 } };
            if (this.currentLevel.indexOf('|') == -1 && this.isCollisionEntity(fakedoor, x - 16 * 3, y - 16 * 3, 14 - 1, 12 - 1)) {
              this.billboardMessage = 'Too close to another entrance';
              return false;
            }
          }
          /*
          for(i=-1;i<2;i++)
          {
            for(j=-1;j<2;j++)
            {
              if(ig.game.mainMap.getTile(x+i*16,y+j*16) == 0) //needs to be surrounded by background
              {
                this.billboardMessage = 'Door must be surrounded by background tiles';
                return false;
              }
            }
          }
          */
          if (val == 2 || val == 3) {
            bootbox.prompt("Level Title: (64 char limit)", function (result) {
              if (result === null) {
              } else {
                ig.game.doplaceitem(name, val, x, y, { name: doorname, target: target, title: result.substr(0, 64) });
                ig.game.sortEntitiesDeferred();
              }
            });
          }
          else {
            this.doplaceitem(name, val, x, y, { name: doorname, target: target });
            this.sortEntitiesDeferred();
          }
        }
        else if (name == "block") {
          var pos = this.reposition(x, y, 16);
          x = pos.x; y = pos.y;
          if (this.selectedLayer == '2')
            name = 'block2';
          if (this.selectedFrameSet == '0')
            this.doplaceitem(name, val, x, y, { frame: (val != 2 ? ig.game.selectedFrame : 0), flip: (this.tileFlipped) });
          else
            this.doplaceitem(name, val, x, y, { frame: (val != 2 ? ig.game.selectedFrame : 0), flip: (this.tileFlipped), user: playerinfo.username, set: this.selectedFrameSet });
        }
        else if (name == 'palette') {
          var paintsize = 8;
          if (this.itemEditing && (this.itemEditing.size.x > 16 || this.itemEditing.size.y > 16))
            paintsize = 4;
          var pos = this.reposition(x, y, paintsize);
          x = pos.x; y = pos.y;
          this.doplaceitem('paint', 0, x, y, { h: val.h, l: val.l, s: val.s, eraser: val.eraser, size: { x: paintsize, y: paintsize } });
          ig.game.sortEntitiesDeferred();
        }
        else if (name == 'bit') {
          var pos = this.reposition(x, y, 8);
          x = pos.x; y = pos.y;
          this.doplaceitem(name, val, x, y, { layer: 1 }); //foreground
        }
        else if (name == 'goomba') {
          var pos = this.reposition(x, y, 8);
          x = pos.x; y = pos.y;
          if (this.currentLevel.indexOf('|') == -1) {
            this.billboardMessage = 'Goombas can only be placed in your own area.';
            return;
          }
          var gs = this.getEntitiesByType(EntityGoomba);
          for (var i = 0; i < gs.length; i++) {
            var g = gs[i];
            if (g.spawn.x == x && g.spawn.y == y) {
              this.billboardMessage = 'Already a goomba spawn in that spot.';
              return;
            }
          }
          this.doplaceitem(name, val, x, y, {});
          this.sortEntitiesDeferred();
        }
        else if (name == 'coin') {
          if (!this.ignoreInventory) {
            this.billboardMessage = 'Coins only allowed in Levels.';
            return;
          }
          var items = this.getEntitiesByType(EntityCoin);
          if (items.length > 98) {
            this.billboardMessage = 'Max 100 coins per level.';
            return;
          }
          var pos = this.reposition(x, y, 8);
          x = pos.x; y = pos.y;
          this.doplaceitem(name, val, x, y, {});
        }
        else {
          if (name == 'fish' && this.levelOwner != playerinfo.username)
            return;
          if (name == 'switchblock') {
            var items = this.getEntitiesByType(EntitySwitchblock);
            if (items.length > 8 && !this.levelOwner != '') {
              this.billboardMessage = 'There are too many in this area already.';
              return;
            }
          }
          if (name == 'custom' && this.currentLevel.indexOf('|') == -1) {
            this.billboardMessage = 'Custom items can only be placed in your own rooms and levels.';
            return;
          }
          var pos = this.reposition(x, y, 8);
          x = pos.x; y = pos.y;
          if (name == 'platform' || name == 'switchblock' || name == 'fish' || name == 'spikeblock') {
            var gs = this.getEntitiesByType('Entity' + name.charAt(0).toUpperCase() + name.slice(1));
            for (var i = 0; i < gs.length; i++) {
              var g = gs[i];
              if (g.spawn.x == x && g.spawn.y == y) {
                this.billboardMessage = 'Already a ' + name + ' spawn in that spot.';
                return;
              }
            }
          }
          this.doplaceitem(name, val, x, y, {});
        }
      },
      doplaceitem: function (name, val, x, y, data) {
        console.log('doplaceitem', name, data)
        if (name != 'block' && name != 'block2' && name != 'custom' && name != 'gift2013' && !ig.game.ignoreInventory) {
          ig.game.inventory[name][val]--;
          $item = $('.inventory > .' + name + val);
          $item.find('span').text(ig.game.inventory[name][val]);
        }

        this.socketEmit('additem', name, val, x, y, data);
        ig.game.additem(name, val, x, y, data, true);

        if (name == 'block' || name == 'block2') {
          //convert fg bits to bg bits
          for (var w = 0; w < 2; w++)
            for (var h = 0; h < 2; h++) {
              var bitval = this.bitsMap.getTile(x + w * 8, y + h * 8)
              if (bitval != 0) {
                this.bitsMap.setTile(x + w * 8, y + h * 8, 0);
                this.bitsBGMap.setTile(x + w * 8, y + h * 8, bitval);
              }
            }
        }
        /*
        if(name == 'block' && val == 4)
        {
          //check if entity deleted
          for(var i = 0; i<this.entities.length; i++) {
            e = this.entities[i];
            if (!(e instanceof EntityYoutube || e instanceof EntitySign || (e instanceof EntityDoor && this.currentLevel.indexOf('|') == -1) ))
              continue;
            if(this.isCollisionEntity(e,x,y,2,2))
            {
              var itemname = '';
              if(e instanceof EntityYoutube)
                itemname = 'youtube';
              if(e instanceof EntitySign)
                itemname = 'sign';
              if(e instanceof EntityDoor)
              {
                if(e.name.split('-')[1] == playerinfo.username )
                  itemname = 'door';
              }
              if(itemname != '')
              {
                this.deleteitem(itemname, 1, e.pos.x, e.pos.y);
                ig.game.inventory[itemname][1]++;
                this.addInventory(itemname, 1);
              }
            }
          }
          //check if bit deleted
          for(var w=0;w<2;w++)
            for(var h=0;h<2;h++)
            {
              var bitval = this.bitsMap.getTile(x+w*8,y+h*8)
              if(bitval != 0)
              {
                this.deleteitem('bit', bitval, x+w*8, y+h*8);
                ig.game.inventory['bit'][bitval]++;
                this.addInventory('bit', bitval);
              }
            }
        }*/
      },
      inputchange: function (name, key, pressed, pos, vel) {
        player = ig.game.getEntityByName(name);
        if (player) {
          switch (key) {
            case 'left':
              player.pressed.left = pressed;
              break;
            case 'right':
              player.pressed.right = pressed;
              break;
            case 'up':
              player.pressed.up = pressed;
              player.pressing.up = pressed;
              break;
            case 'action':
              player.pressed.action = pressed;
              break;
            case 'shoot':
              if (player.gun) {
                player.gun.shoot(pressed);
                if (player.gun.currentAnim)
                  player.gun.currentAnim.angle = pressed;
              }
              break;
          }
          player.asleep = false;
          player.sleepTimer.reset();
          player.remotepos = pos;
          player.vel = vel;
        }
      },
      youtubeStateChange: function (state) {
        if (state.data == 5 || state.data == 0) {
          var yt = this.getEntitiesByType(EntityYoutube);
          if (yt && yt[0]) {
            if (state.data == 5)
              yt[0].playlistLoaded();
            if (state.data == 0) {
              yt[0].time = 0;
              if (yt[0].playlist.length == 0)
                yt[0].videoEnded();
            }
          }
        }
      },
      updateplayer: function (user) {

        if (user.username == playerinfo.username) {
          var player = this.getEntitiesByType(EntityPlayer)[0];
          if (this.inArena)
            player.damage = user.damage;
          return;
        }
        else {

          var player = ig.game.getEntityByName(user.username);
          if (player) {
            if (player && !player.asleep) {
              player.remotepos = user.player.pos;
              player.vel = user.player.vel;
            }
            player.damage = user.damage;
            if (typeof user.player.asleep !== 'undefined') {
              if (player.asleep != user.player.asleep) {
                player.asleep = user.player.asleep;
                if (!player.asleep)
                  player.sleepTimer.reset();
              }
            }
            if (typeof user.player.gun !== 'undefined') {
              switch (user.player.gun) {
                case 'crackerlauncher':
                  player.setGun(EntityCrackerlauncher);
                  break;
                case 'blaster':
                  player.setGun(EntityBlaster);
                  break;
                default:
                  player.setGun(false);
                  break;
              }
            }
            if (typeof user.player.equipped !== 'undefined') {
              var len = user.player.equipped.length;
              while (len--) {
                var equip = user.player.equipped[len];
                var needtoadd = true;
                var len2 = player.equipped.length;
                while (len2--) {
                  if (equip == player.equipped[len2])
                    needtoadd = false;
                }
                if (needtoadd)
                  player.equipItem(equip)
              }
              var i = player.equipped.length;
              while (i--) {
                var needtodel = true;
                var j = user.player.equipped.length;
                while (j--) {
                  if (player.equipped[i] == user.player.equipped[j])
                    needtodel = false;
                }
                if (needtodel)
                  player.equipItem(player.equipped[i])
              }
            }
            if (user.username != playerinfo.username && user.room != playerinfo.room) {
              player.head.kill();
              if (player.gun)
                player.gun.kill();
              for (var i = 0; i < player.equipped.length; i++) {
                if (player.equippedItems[player.equipped[i]]) {
                  player.equippedItems[player.equipped[i]].kill();
                  delete (player.equippedItems[player.equipped[i]].kill());
                }
              }
              player.kill();
            }
          }
          else {
            if (user.room == playerinfo.room && user.player && user.avatar) {
              console.log('spawning ' + user.username);

              var body = null;
              var head = null;
              if (user.player.equipped) {
                var e = user.player.equipped;
                for (var i = 0; i < e.length; i++) {
                  if (itemsInfo[e[i]] && itemsInfo[e[i]]['settings']['equip']) {
                    if (itemsInfo[e[i]]['settings']['equip'] == 'body')
                      body = itemsInfo[e[i]]['image'];
                    else if (itemsInfo[e[i]]['settings']['equip'] == 'head')
                      head = itemsInfo[e[i]]['image'];
                  }
                }
              }

              this.spawnEntity(EntityPlayerremote, user.player.pos.x, user.player.pos.y, { "anim": this.avatarUrl(user.avatar), "name": user.username, "damage": user.damage, "image": body, "headimage": head });
            }
            else
              console.log('PLAYER ' + user.username + ' listed but not in the same room');

          }
        }
      },
      changelevel: function (level, owner, settings, target, lastlevel) {
        console.log('mygame.changelevel: ' + level);
        /*changelevel: function(gameinfo){
          playerinfo.room = gameinfo.level;
          globalItems = gameinfo.items;
          globalRemovedItems = gameinfo.removeditems;
          globalTileMapsInfo = gameinfo.tileMapsInfo;
          itemsInfo = gameinfo.itemsInfo;
          var settings = gameinfo.settings;
          if(settings)
            settings['leveltype'] = gameinfo.leveltype;
          else
            settings = {leveltype:gameinfo.leveltype};
      
          var level = gameinfo.level;
          var owner = gameinfo.owner;
          var target = gameinfo.target;
          var lastlevel = null;
          if(gameinfo.lastlevel)
            lastlevel = gameinfo.lastlevel;
          */

        var player = this.getEntitiesByType(EntityPlayer)[0];
        if (player)
          this.lastLevelPos = player.pos;
        //if(player)
        //{
        this.lastLevel = '';
        if (typeof lastlevel !== "undefined")
          this.lastLevel = lastlevel;
        //else new level stuff
        //  this.lastLevel = this.currentLevel;
        this.lastlevelSettings = this.levelSettings;
        if (level.indexOf('EditItem') > -1) {
          if (!playerinfo.items[target]) {
            alert('uh oh, no item to edit. tell francis');
            return;
          }
          //if(!playerinfo.items[target]['origSprite'])
          //  playerinfo.items[target]['origSprite'] = 'media/custom.png'
          var size = { x: 16, y: 16 };
          if (playerinfo.items[target]['settings'] && playerinfo.items[target]['settings']['width'] && playerinfo.items[target]['settings']['height'])
            size = { x: playerinfo.items[target]['settings']['width'], y: playerinfo.items[target]['settings']['height'] };
          var settings = playerinfo.items[target]['settings'] || {};
          settings['size'] = size;
          settings['origSprite'] = 'media/custom' + size.x + 'x' + size.y + '.png';
          //var settings = {size:size, origSprite: 'media/custom'+size.x+'x'+size.y+'.png'};
          if (playerinfo.items[target]['image'])
            settings['origSprite'] = playerinfo.items[target]['image'];
          else if (playerinfo.items[target]['settings']['equip']) {
            if (playerinfo.items[target]['settings']['equip'] == 'body')
              settings['origSprite'] = 'media/player/default.png';
            else if (playerinfo.items[target]['settings']['equip'] == 'head') {
              if (playerinfo.avatar && playerinfo.avatar.length)
                settings['origSprite'] = 'media/avatars/' + playerinfo.avatar + '.gif';
              else
                settings['origSprite'] = 'media/custom16x16.png';
            }
          }
          this.itemEditing = new EntityCustom(0, 0, settings);
          this.itemId = target;
          this.spawnDoor = '';
        }
        else if (level.indexOf('EditBackground') > -1 && target != '') {
          this.selectedFrameSet = target;
          this.spawnDoor = '';
        }
        else {
          this.itemId = '';
          this.itemEditing = null;
          this.spawnDoor = target;
        }
        this.currentLevel = level;
        this.levelOwner = owner || '';
        if (settings && settings.title){
          this.levelTitle = settings.title;
          document.title = 'betalands | ' + settings.title;
        } else {
          document.title = 'betalands';
        }
        this.levelSettings = settings || {};
        var yt = this.getEntitiesByType(EntityYoutube);
        if (yt.length) {
          yt[0].kill();
        }
        this.loadLevel(ig.copy(ig.global[level]));
        //}
      },
      removeplayer: function (username) {
        console.log('removing ' + username);
        var player = ig.game.getEntityByName(username);
        if (player) {
          player.head.type = ig.Entity.TYPE.A;
          player.head.maxVel = { x: 100, y: 200 };
          player.head.friction = { x: 100, y: 0 };
          player.kill();
        }
        else {
        }
      },
      sendplayerpos: function (lastx, lasty, lastasleep) {
        var player = this.getEntitiesByType(EntityPlayer)[0];
        //if(player && player.vel.x == 0 && player.vel.y == 0 && (Math.round(player.pos.x*100)/100 != Math.round(lastx*100)/100 || Math.round(player.pos.y*100)/100 != Math.round(lasty*100)/100)){
        if (player && (noposUpdateCount > 50 || lastasleep != player.asleep || (Math.round(player.pos.x * 100) / 100 != Math.round(lastx * 100) / 100 || Math.round(player.pos.y * 100) / 100 != Math.round(lasty * 100) / 100))) {
          this.socketEmit('playerpos', { pos: player.pos, vel: player.vel, asleep: player.asleep, gun: player.getGunType(), equipped: player.equipped });
          noposUpdateCount = 0;
          return { pos: player.pos, asleep: player.asleep };
        }
        return false;
      },
      reposition: function (x, y, tileSize) {
        var row = Math.floor(x / tileSize);
        var col = Math.floor(y / tileSize);
        x = row * tileSize;
        y = col * tileSize;
        return { x: x, y: y };
      },
      lightStrength: 22,
      lightDistance: 13,
      lightLevelDefault: 0,
      goDark: function (dark) {
        var dlchanged = true;
        if (this.darkLevel == dark) {
          dlchanged = false;
          if ((this.currentLevel != 'LevelUnderground' && this.currentLevel != 'LevelHell') || !this.lanternOn)
            return;
        }
        this.darkLevel = dark;
        if (dlchanged) {
          for (var i = 0; i < this.darkMap.height; i++) //left to right
          {
            for (var j = 0; j < this.darkMap.width; j++) {
              this.darkMap.data[i][j] = dark;
              this.lightMap.data[i][j] = dark;
            }
          }
          if (dark > 0 && dark <= 5) {
            ig.game.spawnGhosts(true);
          }
          else
            ig.game.spawnGhosts(false);
        }
        if (dark == 0)// || dark == 9)
          return;
        var lightcount = 0;
        var lightstartx = lightstarty = lightendx = lightstartx = 0;
        lightendx = this.bitsMap.width;
        lightendy = this.bitsMap.height;

        if (!dlchanged) //only calculate lantern area
        {
          var scx = scy = syw = syh = 0;
          scx = Math.round(ig.game.screen.x / 8);
          scy = Math.round(ig.game.screen.y / 8);
          syw = Math.round(ig.system.width / 8);
          syh = Math.round(ig.system.height / 8);
          lightstartx = Math.max(0, scx - syw / 2);
          lightstarty = Math.max(0, scy - syh / 2);
          lightendx = Math.min(this.bitsMap.width, scx + syw * 1.5);
          lightendy = Math.min(this.bitsMap.height, scy + syh * 1.5);
          for (var i = lightstarty; i < lightendy; i++) //left to right
          {
            for (var j = lightstartx; j < lightendx; j++) {
              this.darkMap.data[i][j] = dark;
              this.lightMap.data[i][j] = dark;
            }
          }
        }
        for (var i = lightstarty; i < lightendy; i++) //left to right
        {
          for (var j = lightstartx; j < lightendx; j++) {
            //if(lightcount >= 8) //max lights for performance limits
            //  continue;
            var x = j * 8;
            var y = i * 8;

            if (this.bitsMap.data[i][j] == 9 || this.bitsBGMap.data[i][j] == 9) //yellow
            {
              if (!(
                (i == 0 || this.bitsMap.data[i - 1][j] != 9) &&
                (j == 0 || this.bitsMap.data[i][j - 1] != 9)
              ))
                continue;

              lightcount++;
              //spot on entity
              //this.darkMap.setTile(e.pos.x+x*8, e.pos.y+y*8, 0);
              this.darkMap.data[i][j] = 0;//setTile(x*8, y*8, 0);

              //check 1 pixel around, then 2, etc
              var alreadyLitUp = [];
              var DsfromCs = {};
              var dist = this.lightDistance;
              //for(var dist = 1;dist<=24;dist++)
              for (var x2 = -dist; x2 <= dist; x2 += 1) {
                for (var y2 = -dist; y2 <= dist; y2 += 1) {
                  if (x2 == -dist || x2 == dist || y2 == -dist || y2 == dist)
                  //if(x2 == 0 && y2 == dist)
                  {

                    var x0 = j;
                    var y0 = i;
                    var x1 = j - x2;
                    var y1 = i - y2;
                    var dx = Math.abs(x1 - x0);
                    var dy = Math.abs(y1 - y0);
                    var sx = sy = -1;
                    if (x0 < x1)
                      sx = 1;
                    if (y0 < y1)
                      sy = 1;
                    var err = dx - dy;
                    while (x0 != x1 || y0 != y1) {
                      //setPixel(x0,y0)
                      //if x0 = x1 and y0 = y1 exit loop
                      var distx = j - x0;//(j-(j-x0))-1;
                      var disty = i - y0;//(i-(i-y0))-1;
                      var distanceFromCenter = this.distance24[distx + ':' + disty];//Math.sqrt(distx*distx+disty*disty);/////Math.sqrt(x2*x2+y2*y2);
                      //DsfromCs[x2+':'+y2] = Math.round(distanceFromCenter);
                      //if(distanceFromCenter == 0)
                      //  continue;
                      //var pow = this.lightStrength - distanceFromCenter;
                      var pow = this.lightStrength - (9 - dark) - distanceFromCenter;
                      if (pow < 1) pow = 1;
                      if (pow > 9)
                        pow = 0;
                      //if(this.collisionMap.getTile(e.pos.x+(x+x2)*8, e.pos.y+(y+y2)*8) == 1)
                      //{
                      //  skips[(x+x2)+'-'+(y+y2)] = true;
                      //}
                      //else
                      //this.addLight(x+(x2)*8, y+(y2)*8, Math.round(pow));
                      //var row = i+y2;
                      //var col = j+x2;
                      var row = y0;
                      var col = x0;
                      var shine = stopshine = false;
                      if (!(row < 0 || row >= this.darkMap.data.length || col < 0 || col >= this.darkMap.data[0].length)) {
                        shine = true;

                        //  continue;
                        if (!this.isLight2(row, col, dark))
                          stopshine = true;
                      }

                      if (shine) {
                        if ($.inArray(row + ':' + col, alreadyLitUp) == -1) {
                          //check if over empty background
                          if (!this.isEmptySpace(col * 8, row * 8))
                            this.addLight2(row, col, pow);//pow);
                          alreadyLitUp.push(row + ':' + col);

                          var val = this.lightMap.data[row][col]
                          if (val == 0 || pow == 0)
                            val = 0;
                          else if (val < pow)
                            val = pow;
                          this.lightMap.data[row][col] = val;
                        }
                      }

                      var e2 = 2 * err;
                      if (e2 > -dy) {
                        err = err - dy;
                        x0 = x0 + sx;
                      }
                      if (e2 < dx) {
                        err = err + dx;
                        y0 = y0 + sy;
                      }

                      if (stopshine) {
                        break;
                      }
                    }

                  }
                }
              }
              //console.log(DsfromCs);
            }

          }
        }
        this.shineLantern(dark);
      },
      shineLantern: function (dark) {
        if (this.currentLevel == 'LevelUnderground' || this.currentLevel == 'LevelHell') {
          if (this.lanternOn) {
            var player = ig.game.theplayer;
            var j = Math.round(player.pos.x / 8);
            var i = Math.round(player.pos.y / 8);
            //this.darkMap.setTile(x, y, 0);
            //check 1 pixel around, then 2, etc
            var dist = 12;
            //for(var dist = 1;dist<=12;dist++)
            var alreadyLitUp = [];
            for (var x2 = -dist; x2 <= dist; x2++) {
              for (var y2 = -dist; y2 <= dist; y2++) {
                if (x2 == -dist || x2 == dist || y2 == -dist || y2 == dist) {
                  //var ypos = y + y2*8;

                  var x0 = j;
                  var y0 = i;
                  var x1 = j - x2;
                  var y1 = i - y2;
                  var dx = Math.abs(x1 - x0);
                  var dy = Math.abs(y1 - y0);
                  var sx = sy = -1;
                  if (x0 < x1)
                    sx = 1;
                  if (y0 < y1)
                    sy = 1;
                  var err = dx - dy;
                  while (x0 != x1 || y0 != y1) {
                    var distx = j - x0;//(j-(j-x0))-1;
                    var disty = i - y0;//(i-(i-y0))-1;
                    var distanceFromCenter = Math.sqrt(distx * distx + disty * disty);
                    var pow = 12 - distanceFromCenter;
                    if (pow < 1) pow = 1;
                    if (pow > 9)
                      pow = 0;

                    var row = y0;
                    var col = x0;
                    var shine = stopshine = false;
                    if (!(row < 0 || row >= this.darkMap.data.length || col < 0 || col >= this.darkMap.data[0].length)) {
                      shine = true;

                      if (!this.isLight2(row, col, dark))
                        stopshine = true;
                    }

                    if (shine) {
                      if ($.inArray(row + ':' + col, alreadyLitUp) == -1) {
                        this.addLight2(row, col, pow);
                        alreadyLitUp.push(row + ':' + col);

                        var val = this.lightMap.data[row][col]
                        if (val == 0 || pow == 0)
                          val = 0;
                        else if (val < pow)
                          val = pow;
                        this.lightMap.data[row][col] = val;
                      }
                    }

                    var e2 = 2 * err;
                    if (e2 > -dy) {
                      err = err - dy;
                      x0 = x0 + sx;
                    }
                    if (e2 < dx) {
                      err = err + dx;
                      y0 = y0 + sy;
                    }

                    if (stopshine) {
                      break;
                    }
                  }

                }
              }
            }

          }
        }
      },
      addLight: function (x, y, power) //1-9, 0 == 10 (on)
      {
        var val = this.darkMap.getTile(x, y);
        if (val == 0 || power == 0)// || power + val > 9)
          val = 0;
        else if (val < power)
          val = power;
        //else
        //  val = power+val;
        this.darkMap.setTile(x, y, val);
      },
      addLight2: function (row, col, power) //1-9, 0 == 10 (on)
      {
        var val = this.darkMap.data[row][col]
        if (val == 0 || power == 0)// || power + val > 9)
          val = 0;
        else if (val < power)
          val = power;
        //else
        //  val = power+val;
        this.darkMap.data[row][col] = val;
      },
      isLight: function (x, y, basedark) {
        var d = this.darkMap.getTile(x, y);
        var b1 = this.bitsMap.getTile(x, y);
        var b2 = this.bitsBGMap.getTile(x, y);
        return d != basedark && b1 != 1 && b1 != 6 && b2 != 1 && b2 != 6;
      },
      isLight2: function (row, col, basedark) {
        //var d = this.darkMap.data[row][col];
        var b1 = this.bitsMap.data[row][col];
        var b2 = this.bitsBGMap.data[row][col];
        //return d != basedark && b1 != 1 && b1 != 6 && b2 != 1 && b2 != 6;
        return b1 != 1 && b1 != 6 && b2 != 1 && b2 != 6;
      },
      isEmptySpace: function (x, y) {
        if (this.getTile(x, y, '1'))
          return false;
        if (this.getTile(x, y, '2'))
          return false;
        if (this.bitsMap.getTile(x, y))
          return false;
        if (this.bitsBGMap.getTile(x, y))
          return false;
        /*
          for(var i = 0; i<this.entities.length; i++) {
            e = this.entities[i];
            if(this.isCollisionEntity(e,x,y,1,1))
            {
              return false;
            }
          }
        */
        return true;
      },
      saveTiles: function () {
        if (this.inEditor) {
          if (this.itemEditing) {
            if (playerinfo.items[this.itemId]['image'])
              socket.emit('customitemimage', this.itemId, playerinfo.items[this.itemId]['image']);
          }
          else
            socket.emit('updatetile', this.selectedFrameSet, playerinfo.tiles[this.selectedFrameSet]['image']);
          //socket.emit('updatetiles', playerinfo.tiles);
        }
      },
      addTile: function () {
        if (this.selectedFrameSet != '0' || this.itemId) {
          var tiledata = false;
          var tilemapi = 0;
          var itemwidth = 16;
          var itemheight = 16;
          var tilesize = 8;

          if (this.itemId) {
            var tiledata = ig.getImagePixels(this.itemEditing.animSheet.image.origData, 0, 0, this.itemEditing.animSheet.image.width, this.itemEditing.animSheet.image.height);
            var itemwidth = this.itemEditing.size.x;
            var itemheight = this.itemEditing.size.y;
            if (itemwidth > 16 || itemheight > 16)
              tilesize = 4;
          }
          else
            for (var i = 0; i < this.tileMaps.length; i++) {
              if (ig.game.tileMaps[i].name == this.selectedFrameSet && (ig.game.tileMaps[i].tiles.loaded || ig.game.tileMaps[i].tiles.data)) {
                tiledata = ig.getImagePixels((ig.game.tileMaps[i].tiles.origData || ig.game.tileMaps[i].tiles.data), 0, 0, ig.game.tileMaps[i].tiles.width, ig.game.tileMaps[i].tiles.height);
                tilemapi = i;
              }
            }
          if (!tiledata) {
            return;
          }

          var framenum = tiledata.height / itemheight;
          var ratiow = (32 / itemwidth);
          var ratioh = (32 / itemheight);

          if (framenum >= 36) {
            alert('Sorry, only 36 frames are allowed per set.');
            return;

          }
          if (this.itemId && framenum >= 2) {
            alert('Sorry, only 2 frames are allowed per item.');
            return;
          }
          if (this.itemEditing && this.itemEditing.equip && this.itemEditing.equip == 'head') {
            alert('Sorry, only 1 frame is allowed per head.');
            return;
          }

          var src = tiledata.data;

          var tilecanvas = ig.$new('canvas');
          tilecanvas.width = itemwidth;
          tilecanvas.height = itemheight * (framenum + 1);
          var ctx = tilecanvas.getContext("2d");
          ctx.putImageData(tiledata, 0, 0);
          //ctx.putImageData(ctx.createImageData(0,16*16), 0, 16*framenum);

          var dataURL = tilecanvas.toDataURL("image/png");
          var base64 = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
          //set tile image (css and on map)

          if (this.itemId) {
            $('.animframe:not(.eraser)').css('-moz-background-size', (itemwidth * ratiow) + 'px ' + (itemheight * ratioh * (framenum + 1)) + 'px').css('background-size', (itemwidth * ratiow) + 'px ' + (itemheight * ratioh * (framenum + 1)) + 'px').css('background-image', 'url(' + dataURL + ')');
            $('.animframes').find('.animframe' + framenum).after('<div class="animframe animframe' + (framenum + 1) + '" style="background-position: -0px -' + (itemheight * ratioh * (framenum + 1)) + 'px;" data-val="' + (framenum + 1) + '"></div>');
            this.itemEditing.animSheet = new ig.AnimationSheet(dataURL, this.itemEditing.aFrameX, this.itemEditing.aFrameY);
            this.itemEditing.allAnim();
            playerinfo.items[this.itemId]['image'] = dataURL;
          }
          else {
            ig.game.tileMaps[tilemapi].setTileset(dataURL);
            ig.game.tileMaps[tilemapi].tiles.height = 16 * (framenum + 1);
            for (var i = 0; i < this.tileMaps2.length; i++) {
              if (ig.game.tileMaps2[i].name == 'l2' + this.selectedFrameSet) {
                ig.game.tileMaps2[i].setTileset(dataURL);
                ig.game.tileMaps2[i].tiles.height = 16 * (framenum + 1);
              }
            }
            playerinfo.tiles[this.selectedFrameSet]['image'] = base64;
            $('.animframe:not(.eraser)').css('-moz-background-size', '32px ' + (32 * (framenum + 1)) + 'px').css('background-size', '32px ' + (32 * (framenum + 1)) + 'px').css('background-image', 'url(' + dataURL + ')');
            $('.animframes').find('.animframe' + framenum).after('<div class="animframe animframe' + (framenum + 1) + '" style="background-position: -0px -' + ((framenum + 1) * 32) + 'px;" data-val="' + (framenum + 1) + '"></div>');
            //this.selectframe($('.animframe'+(framenum+1)), framenum+1);
          }
        }
      },
      copyFrame: function () {
        if (this.selectedFrame == '0')
          return;

        var tiledata = false;
        var itemwidth = 16;
        var itemheight = 16;
        var tilesize = 8;

        if (this.itemId) {
          var tiledata = ig.getImagePixels(this.itemEditing.animSheet.image.origData, 0, 0, this.itemEditing.animSheet.image.width, this.itemEditing.animSheet.image.height);
          itemwidth = this.itemEditing.size.x;
          itemheight = this.itemEditing.size.y;
          if (itemwidth > 16 || itemheight > 16)
            tilesize = 4;
        }
        else
          for (var i = 0; i < this.tileMaps.length; i++) {
            if (ig.game.tileMaps[i].name == this.selectedFrameSet)
              tiledata = ig.getImagePixels(ig.game.tileMaps[i].tiles.origData, 0, 0, ig.game.tileMaps[i].tiles.width, ig.game.tileMaps[i].tiles.height);
          }
        this.copiedFrame = [];
        var src = tiledata.data;
        var len = src.length;
        var sR, sG, sB, sA;
        var start = itemwidth * itemheight * 4 * (this.selectedFrame - 1)
        for (var px = start; px < start + (itemwidth * itemheight * 4); px += 4) {
          sR = src[px];
          sG = src[px + 1];
          sB = src[px + 2];
          sA = src[px + 3];

          var pxt = (px - start) / 4;
          var pxy = Math.floor(pxt / itemwidth);
          var pxx = pxt - (pxy * itemwidth);
          var x = pxx * tilesize + 16 * 11;
          var y = pxy * tilesize + 16;
          if (sA > 0)
            this.copiedFrame.push({ x: x, y: y, settings: { r: sR, g: sG, b: sB, hsl: false, size: { x: tilesize, y: tilesize } } });
        }
      },
      pasteFrame: function () {
        if (this.copiedFrame == [] || this.selectedFrame == '0' || !this.inEditor)
          return;

        this.shiftedFrame = [];
        this.shiftedDirections = { x: 0, y: 0 };

        var paints = ig.game.getEntitiesByType(EntityPaint);
        for (var i = 0; i < paints.length; i++) {
          paint = paints[i];
          if (paint.pos.x >= 16 * 11 && paint.pos.x <= 16 * 19 - 4 && paint.pos.y >= 16 && paint.pos.y <= 16 + 16 * 8 + 8) {
            paint.kill();
          }
        }
        for (var i = 0; i < this.copiedFrame.length; i++) {
          var frame = this.copiedFrame[i];
          this.spawnEntity(EntityPaint, frame.x, frame.y, frame.settings);
        }
        if (this.itemEditing)
          this.refreshItem();
        else
          this.refreshTile();
      },
      shiftFrame: function (x, y) {
        if (!this.inEditor)
          return;

        var tilesize = 8;
        if (this.itemEditing) {
          var itemwidth = this.itemEditing.size.x;
          var itemheight = this.itemEditing.size.y;
          if (itemwidth > 16 || itemheight > 16)
            tilesize = 4;
        }

        this.shiftedDirections.y += y;
        this.shiftedDirections.x += x;

        var paints = ig.game.getEntitiesByType(EntityPaint);
        if (this.shiftedFrame.length == 0)
          for (var i = 0; i < paints.length; i++) {
            paint = paints[i];
            if (paint.pos.x >= 16 * 11 && paint.pos.x <= 16 * 19 - 4 && paint.pos.y >= 16 && paint.pos.y <= 16 + 16 * 8 + 8) {
              this.shiftedFrame.push({ x: paint.pos.x, y: paint.pos.y, settings: { r: paint.r, g: paint.g, b: paint.b, hsl: false, size: paint.size } });
            }
          }
        for (var i = 0; i < paints.length; i++) {
          paint = paints[i];
          if (paint.pos.x >= 16 * 11 && paint.pos.x <= 16 * 19 - 4 && paint.pos.y >= 16 && paint.pos.y <= 16 + 16 * 8 + 8) {
            paint.kill();
          }
        }
        for (var i = 0; i < this.shiftedFrame.length; i++) {
          var frame = this.shiftedFrame[i];
          var newx = frame.x + this.shiftedDirections.x * tilesize;
          var newy = frame.y + this.shiftedDirections.y * tilesize;
          if (newx >= 16 * 11 && newx <= 16 * 19 - 4 && newy >= 16 && newy < 16 + 16 * 8) {
            this.spawnEntity(EntityPaint, newx, newy, frame.settings);
          }
        }
        if (this.itemEditing)
          this.refreshItem();
        else
          this.refreshTile();
      },
      clearFrame: function () {
        if (this.selectedFrame == '0' || !this.inEditor)
          return;

        this.shiftedFrame = [];
        this.shiftedDirections = { x: 0, y: 0 };

        var paintsize = 8;
        var itemwidth = 16;
        var itemheight = 16;
        if (this.itemEditing && (this.itemEditing.size.x > 16 || this.itemEditing.size.y > 16))
          paintsize = 4;
        if (this.itemEditing) {
          itemwidth = this.itemEditing.size.x;
          itemheight = this.itemEditing.size.y;
        }

        var paints = ig.game.getEntitiesByType(EntityPaint);
        for (var i = 0; i < paints.length; i++) {
          paint = paints[i];
          if (paint.pos.x >= 16 * 11 && paint.pos.x <= 16 * 19 - 4 && paint.pos.y >= 16 && paint.pos.y <= 16 + 16 * 8 + 8) {
            paint.kill();
          }
        }
        if ((this.selectedItemName == 'palette' || this.selectedItemName == 'paint') && !this.selectedItemValue.eraser) {
          var start = 0;
          var val = this.selectedItemValue;
          var w = itemwidth;//*(8/paintsize);
          var h = itemheight;//*(8/paintsize);
          for (var px = start; px < (w * h); px++) {
            var pxt = px;
            var pxy = Math.floor(pxt / w);
            var pxx = pxt - (pxy * w);
            var x = pxx * paintsize + 16 * 11;
            var y = pxy * paintsize + 16;
            this.spawnEntity(EntityPaint, x, y, { h: val.h, l: val.l, s: val.s, hsl: true, size: { x: paintsize, y: paintsize } });
          }
        }
        if (this.itemEditing)
          this.refreshItem();
        else
          this.refreshTile();
      },
      flipTiles: function (flipX, flipY) {
        this.tileFlipped = { x: flipX, y: flipY };
        var cursor = this.getEntitiesByType(EntityCursor)[0];
        if (cursor) {
          cursor.flipImage(this.tileFlipped);
        }
      },
      saveItem: function () {
        //if(this.inEditor)
        //{
        var itemid = $("#newItemForm").find('.itemid').val();
        if (itemid == '')
          itemid = '_' + Math.random().toString(36).substr(2, 9);
        if (!playerinfo.items[itemid]) {
          var itemimg = 'media/custom16x16.png';
          playerinfo.items[itemid] = { image: itemimg, itemid: itemid, username: playerinfo.username, settings: {} };
          playerinfo.items[itemid]['settings'] = $("#newItemForm").serializeObject();
          if (playerinfo.items[itemid]['settings']['width'] && playerinfo.items[itemid]['settings']['height'])
            playerinfo.items[itemid]['image'] = 'media/custom' + playerinfo.items[itemid]['settings']['width'] + 'x' + playerinfo.items[itemid]['settings']['height'] + '.png';
        }
        else
          playerinfo.items[itemid]['settings'] = $("#newItemForm").serializeObject();

        socket.emit('customitem', itemid, playerinfo.items[itemid]['settings']);
        updateItems(playerinfo.items);
        //socket.emit('editor', 'item', itemid);
        //}
      },
      saveBody: function () {
        var itemid = $("#newBodyForm").find('.itemid').val();
        if (itemid == '')
          itemid = '_' + Math.random().toString(36).substr(2, 9);
        if (!playerinfo.items[itemid]) {
          playerinfo.items[itemid] = { itemid: itemid, username: playerinfo.username, settings: {} };
          playerinfo.items[itemid]['settings'] = { name: $("#newBodyForm").find('#name').val(), equip: 'body', width: 32, height: 32 }
        }
        else
          playerinfo.items[itemid]['settings'] = { name: $("#newBodyForm").find('#name').val() }

        socket.emit('custombody', itemid, playerinfo.items[itemid]['settings']);
        if (!playerinfo.items[itemid]['image'])
          playerinfo.items[itemid]['image'] = 'media/player/default.png';

        updateItems(playerinfo.items);
      },
      saveHead: function () {
        var itemid = $("#newHeadForm").find('.itemid').val();
        if (itemid == '')
          itemid = '_' + Math.random().toString(36).substr(2, 9);
        if (!playerinfo.items[itemid]) {
          playerinfo.items[itemid] = { itemid: itemid, username: playerinfo.username, settings: {} };
          playerinfo.items[itemid]['settings'] = { name: $("#newHeadForm").find('#name').val(), equip: 'head', width: 16, height: 16 }
        }
        else
          playerinfo.items[itemid]['settings'] = { name: $("#newHeadForm").find('#name').val() }

        socket.emit('customhead', itemid, playerinfo.items[itemid]['settings']);
        if (!playerinfo.items[itemid]['image']) {
          if (playerinfo.avatar && playerinfo.avatar.length)
            playerinfo.items[itemid]['image'] = 'media/avatars/' + playerinfo.avatar + '.gif';
          else
            playerinfo.items[itemid]['image'] = 'media/custom16x16.png';
        }

        updateItems(playerinfo.items);
      },
      saveLevel: function () {
        //var itemid = $("#newItemForm").find('.itemid').val();
        var settings = $("#newLevelForm").serializeObject();
        var parent = settings['parent'];
        var leveltype = settings['leveltype'];
        delete settings['parent'];
        delete settings['leveltype'];
        //var roomid = '_' + Math.random().toString(36).substr(2, 9);
        //$('#levelsList').append('<tr><td><a href="#" class="warplink" data-title="'+settings['title']+'" data-room="'+roomid+'" data-target="">' + title + '</a></td></tr>');
        socket.emit('createlevel', leveltype, parent, settings);
      },
      addTileSet: function () {
        if (Object.keys(playerinfo.tiles).length >= 10) {
          alert('Sorry, 10 sets is the max.');
          return;
        }

        var setid = '_' + Math.random().toString(36).substr(2, 9);
        if (!playerinfo.tiles)
          playerinfo.tiles = {};

        playerinfo.tiles[setid] = { setid: setid, username: playerinfo.username, settings: {} };

        socket.emit('addtileset', setid);
      },
      resetLevel: function (retry) {
        var player = ig.game.getEntitiesByType('EntityPlayer')[0];
        var positioned = false;
        var signs = ig.game.getEntitiesByType(EntitySign);
        var closest = { signpos: null, distance: 999999 };
        for (var i = 0; i < signs.length; i++) {
          var sign = signs[i];
          if (sign.hasTouched && retry)
            sign.hasTouched = false;
          if (!sign.hasTouched)
            continue;
          if (this.currentLevel.indexOf('*3') !== -1 || this.levelSettings.leveltype == 3) {
            if (sign.pos.y < closest.distance) {
              closest.signpos = sign.pos;
              closest.distance = sign.pos.y;
              positioned = true;
            }
          }
          else if (ig.game.mainMap.width * ig.game.mainMap.tilesize - sign.pos.x < closest.distance)
          //else if(sign.pos.x <= player.pos.x && player.pos.x - sign.pos.x < closest.distance)
          {
            closest.signpos = sign.pos;
            closest.distance = ig.game.mainMap.width * ig.game.mainMap.tilesize - sign.pos.x;
            positioned = true;
          }
        }
        if (positioned && !retry) {
          player.pos = { x: closest.signpos.x, y: closest.signpos.y - 4 };
          player.vel = { x: 0, y: 0 };
        }
        else {
          var doors = ig.game.getEntitiesByType(EntityDoor);
          for (var i = 0; i < doors.length; i++) {
            var door = doors[i];
            if (door.name.indexOf('-start') !== -1) {
              player.pos = door.pos;
              player.vel = { x: 0, y: 0 };
              positioned = true;
            }
          }
        }
        var items = ig.game.getEntitiesByType(EntitySwitchblock);
        if (items.length) {
          if (items[0].switchState)
            items[0].hitSwitch();
        }
        var goombas = ig.game.getEntitiesByType(EntityGoomba);
        for (var i = 0; i < goombas.length; i++) {
          var goomba = goombas[i];
          goomba.kill();
        }
        var goombas = ig.game.getEntitiesByType(EntityMover);
        for (var i = 0; i < goombas.length; i++) {
          var goomba = goombas[i];
          goomba.kill();
        }
        for (var i = 0; i < this.goombaSpawns.length; i++) {
          var spawn = this.goombaSpawns[i];
          this.spawnEntity(EntityGoomba, spawn.x, spawn.y);
        }
        for (var i = 0; i < this.moverSpawns.length; i++) {
          var spawn = this.moverSpawns[i];
          this.spawnEntity('Entity' + spawn.name.charAt(0).toUpperCase() + spawn.name.slice(1), spawn.x, spawn.y);
        }
      },
      spawnGhosts: function (spawn) {
        var goombas = ig.game.getEntitiesByType(EntityGhost);
        for (var i = 0; i < goombas.length; i++) {
          var goomba = goombas[i];
          goomba.kill();
        }
        if (spawn)
          for (var i = 0; i <= 5; i++) {
            var x = ig.game.mainMap.width * 16;
            var y = ig.game.mainMap.height * 16;
            x = Math.floor(Math.random() * (x - 0 + 1)) + 0;
            y = Math.floor(Math.random() * (y - 0 + 1)) + 0;
            this.spawnEntity(EntityGhost, x, y);
          }
      },
      mouseleave: function () {
        this.cursorOn = false;
      },
      mouseenter: function () {
        this.cursorOn = true;
      },
      // main function to process the fade request //
      colorFade: function (start, end, steps) {
        var startrgb, endrgb, er, eg, eb, step, rint, gint, bint, step;
        steps = steps || 20;
        //speed = speed || 20;
        endrgb = this.colorConv(end);
        er = endrgb[0];
        eg = endrgb[1];
        eb = endrgb[2];
        startrgb = this.colorConv(start);
        r = startrgb[0];
        g = startrgb[1];
        b = startrgb[2];
        rint = Math.round(Math.abs(r - er) / steps);
        gint = Math.round(Math.abs(g - eg) / steps);
        bint = Math.round(Math.abs(b - eb) / steps);
        if (rint == 0) { rint = 1 }
        if (gint == 0) { gint = 1 }
        if (bint == 0) { bint = 1 }

        if (r >= er) {
          r = r - rint;
        } else {
          r = parseInt(r) + parseInt(rint);
        }
        if (g >= eg) {
          g = g - gint;
        } else {
          g = parseInt(g) + parseInt(gint);
        }
        if (b >= eb) {
          b = b - bint;
        } else {
          b = parseInt(b) + parseInt(bint);
        }
        return 'rgb(' + r + ',' + g + ',' + b + ')';
      },

      // incrementally close the gap between the two colors //
      animateColor: function (id, element, steps, er, eg, eb, rint, gint, bint) {
        var r = target.r;
        var g = target.g;
        var b = target.b;

      },

      // convert the color to rgb from hex //
      colorConv: function (color) {
        var rgb = [parseInt(color.substring(0, 2), 16),
        parseInt(color.substring(2, 4), 16),
        parseInt(color.substring(4, 6), 16)];
        return rgb;
      },
      resizeGame: function () {
        var originalWidth = 320;
        var screenWidth = $('#gamedivarea').width() - $('#blockarea').width();
        //delete ig.Image.cache;
        //ig.Image.cache = {};
        var scale = Math.max(1, Math.floor((screenWidth / originalWidth)))//*4)/4);
        if (scale == ig.system.scale)
          return;
        //  $('#youtubeplayer').width(40*scale);
        //  $('#youtubeplayer').height(24*scale);

        ig.system.resize(320, 160, scale);

        ig.Image.reloadCache();

        console.log('resize: ' + scale);
        /*    
          var CONFIGGAMEWIDTH = 320;
          var CONFIGGAMEHEIGHT = 160;
          var CONFIGGAMETILE_SIZE = 8;
          //ig.system.resize( width, height, [scale] )
      
          // Size of the viewport (in px)
          var windowWidth = window.innerWidth,
              windowHeight = window.innerHeight;
          // Viewport's ratio and Game ratio
          var windowRatio = windowWidth / windowHeight,
              gameRatio = CONFIGGAMEWIDTH / CONFIGGAMEHEIGHT;
      
          // Check ratios, and get pixelScale
          var ps;
          if (windowRatio > gameRatio) {
              ps = Math.floor( windowHeight / (CONFIGGAMEHEIGHT * CONFIGGAMETILE_SIZE) ); // too wide
          } else {
              ps = Math.floor( windowWidth / (CONFIGGAMEWIDTH * CONFIGGAMETILE_SIZE) );     // too high
          }
      
          // Check if pixelScale has changed
          if (this.scale != ps ) {
              console.log('pixelScale changed from ' + this.scale + ' to ' + ps);
              this.scale = ps;
      
              // resize  all bitmap assets
              var res = ig.resources;
              console.log('Resources = ' + res.length + ' elements');
              res.forEach(function(img) {
              //    img.resize();                    // BUG : img is not an image !!!
                  console.log(img);
              });
          }
      
          // Final resizing
          windowWidth = CONFIGGAMEWIDTH * CONFIGGAMETILE_SIZE;
          windowHeight = CONFIGGAMEHEIGHT * CONFIGGAMETILE_SIZE;
      
          ig.system.resize( windowWidth, windowHeight, this.scale);
      
          console.log('Pixel ratio [X' + this.scale + '] Game size [' + windowWidth + 'x' + windowHeight + ']' + ' Screen size [' + windowWidth*this.scale + 'x' + windowHeight*this.scale + ']');
          */
      },
      avatarUrl: function(avatar) {
        if (!avatar || avatar == 'default')
          return 'media/defaulthead.gif';
        else if (avatar && (avatar.indexOf('http') == 0 || avatar.indexOf('digibutter') == 0 ))
          return avatar;
        else
          return 'media/avatars/' + avatar + '.gif';
        //else
          //return "data:image/gif;base64," + avatar;
      },
      socketEmit: function () {
        if (!this.inEditor)
          socket.emit.apply(socket, arguments);
      },
      //distance24: {"-1:-1":1.4142135623730951,"-1:0":1,"-1:1":1.4142135623730951,"0:-1":1,"0:0":0,"0:1":1,"1:-1":1.4142135623730951,"1:0":1,"1:1":1.4142135623730951,"-2:-2":2.8284271247461903,"-2:-1":2.23606797749979,"-2:0":2,"-2:1":2.23606797749979,"-2:2":2.8284271247461903,"-1:-2":2.23606797749979,"-1:2":2.23606797749979,"0:-2":2,"0:2":2,"1:-2":2.23606797749979,"1:2":2.23606797749979,"2:-2":2.8284271247461903,"2:-1":2.23606797749979,"2:0":2,"2:1":2.23606797749979,"2:2":2.8284271247461903,"-3:-3":4.242640687119285,"-3:-2":3.605551275463989,"-3:-1":3.1622776601683795,"-3:0":3,"-3:1":3.1622776601683795,"-3:2":3.605551275463989,"-3:3":4.242640687119285,"-2:-3":3.605551275463989,"-2:3":3.605551275463989,"-1:-3":3.1622776601683795,"-1:3":3.1622776601683795,"0:-3":3,"0:3":3,"1:-3":3.1622776601683795,"1:3":3.1622776601683795,"2:-3":3.605551275463989,"2:3":3.605551275463989,"3:-3":4.242640687119285,"3:-2":3.605551275463989,"3:-1":3.1622776601683795,"3:0":3,"3:1":3.1622776601683795,"3:2":3.605551275463989,"3:3":4.242640687119285,"-4:-4":5.656854249492381,"-4:-3":5,"-4:-2":4.47213595499958,"-4:-1":4.123105625617661,"-4:0":4,"-4:1":4.123105625617661,"-4:2":4.47213595499958,"-4:3":5,"-4:4":5.656854249492381,"-3:-4":5,"-3:4":5,"-2:-4":4.47213595499958,"-2:4":4.47213595499958,"-1:-4":4.123105625617661,"-1:4":4.123105625617661,"0:-4":4,"0:4":4,"1:-4":4.123105625617661,"1:4":4.123105625617661,"2:-4":4.47213595499958,"2:4":4.47213595499958,"3:-4":5,"3:4":5,"4:-4":5.656854249492381,"4:-3":5,"4:-2":4.47213595499958,"4:-1":4.123105625617661,"4:0":4,"4:1":4.123105625617661,"4:2":4.47213595499958,"4:3":5,"4:4":5.656854249492381,"-5:-5":7.0710678118654755,"-5:-4":6.4031242374328485,"-5:-3":5.830951894845301,"-5:-2":5.385164807134504,"-5:-1":5.0990195135927845,"-5:0":5,"-5:1":5.0990195135927845,"-5:2":5.385164807134504,"-5:3":5.830951894845301,"-5:4":6.4031242374328485,"-5:5":7.0710678118654755,"-4:-5":6.4031242374328485,"-4:5":6.4031242374328485,"-3:-5":5.830951894845301,"-3:5":5.830951894845301,"-2:-5":5.385164807134504,"-2:5":5.385164807134504,"-1:-5":5.0990195135927845,"-1:5":5.0990195135927845,"0:-5":5,"0:5":5,"1:-5":5.0990195135927845,"1:5":5.0990195135927845,"2:-5":5.385164807134504,"2:5":5.385164807134504,"3:-5":5.830951894845301,"3:5":5.830951894845301,"4:-5":6.4031242374328485,"4:5":6.4031242374328485,"5:-5":7.0710678118654755,"5:-4":6.4031242374328485,"5:-3":5.830951894845301,"5:-2":5.385164807134504,"5:-1":5.0990195135927845,"5:0":5,"5:1":5.0990195135927845,"5:2":5.385164807134504,"5:3":5.830951894845301,"5:4":6.4031242374328485,"5:5":7.0710678118654755,"-6:-6":8.48528137423857,"-6:-5":7.810249675906654,"-6:-4":7.211102550927978,"-6:-3":6.708203932499369,"-6:-2":6.324555320336759,"-6:-1":6.082762530298219,"-6:0":6,"-6:1":6.082762530298219,"-6:2":6.324555320336759,"-6:3":6.708203932499369,"-6:4":7.211102550927978,"-6:5":7.810249675906654,"-6:6":8.48528137423857,"-5:-6":7.810249675906654,"-5:6":7.810249675906654,"-4:-6":7.211102550927978,"-4:6":7.211102550927978,"-3:-6":6.708203932499369,"-3:6":6.708203932499369,"-2:-6":6.324555320336759,"-2:6":6.324555320336759,"-1:-6":6.082762530298219,"-1:6":6.082762530298219,"0:-6":6,"0:6":6,"1:-6":6.082762530298219,"1:6":6.082762530298219,"2:-6":6.324555320336759,"2:6":6.324555320336759,"3:-6":6.708203932499369,"3:6":6.708203932499369,"4:-6":7.211102550927978,"4:6":7.211102550927978,"5:-6":7.810249675906654,"5:6":7.810249675906654,"6:-6":8.48528137423857,"6:-5":7.810249675906654,"6:-4":7.211102550927978,"6:-3":6.708203932499369,"6:-2":6.324555320336759,"6:-1":6.082762530298219,"6:0":6,"6:1":6.082762530298219,"6:2":6.324555320336759,"6:3":6.708203932499369,"6:4":7.211102550927978,"6:5":7.810249675906654,"6:6":8.48528137423857,"-7:-7":9.899494936611665,"-7:-6":9.219544457292887,"-7:-5":8.602325267042627,"-7:-4":8.06225774829855,"-7:-3":7.615773105863909,"-7:-2":7.280109889280518,"-7:-1":7.0710678118654755,"-7:0":7,"-7:1":7.0710678118654755,"-7:2":7.280109889280518,"-7:3":7.615773105863909,"-7:4":8.06225774829855,"-7:5":8.602325267042627,"-7:6":9.219544457292887,"-7:7":9.899494936611665,"-6:-7":9.219544457292887,"-6:7":9.219544457292887,"-5:-7":8.602325267042627,"-5:7":8.602325267042627,"-4:-7":8.06225774829855,"-4:7":8.06225774829855,"-3:-7":7.615773105863909,"-3:7":7.615773105863909,"-2:-7":7.280109889280518,"-2:7":7.280109889280518,"-1:-7":7.0710678118654755,"-1:7":7.0710678118654755,"0:-7":7,"0:7":7,"1:-7":7.0710678118654755,"1:7":7.0710678118654755,"2:-7":7.280109889280518,"2:7":7.280109889280518,"3:-7":7.615773105863909,"3:7":7.615773105863909,"4:-7":8.06225774829855,"4:7":8.06225774829855,"5:-7":8.602325267042627,"5:7":8.602325267042627,"6:-7":9.219544457292887,"6:7":9.219544457292887,"7:-7":9.899494936611665,"7:-6":9.219544457292887,"7:-5":8.602325267042627,"7:-4":8.06225774829855,"7:-3":7.615773105863909,"7:-2":7.280109889280518,"7:-1":7.0710678118654755,"7:0":7,"7:1":7.0710678118654755,"7:2":7.280109889280518,"7:3":7.615773105863909,"7:4":8.06225774829855,"7:5":8.602325267042627,"7:6":9.219544457292887,"7:7":9.899494936611665,"-8:-8":11.313708498984761,"-8:-7":10.63014581273465,"-8:-6":10,"-8:-5":9.433981132056603,"-8:-4":8.94427190999916,"-8:-3":8.54400374531753,"-8:-2":8.246211251235321,"-8:-1":8.06225774829855,"-8:0":8,"-8:1":8.06225774829855,"-8:2":8.246211251235321,"-8:3":8.54400374531753,"-8:4":8.94427190999916,"-8:5":9.433981132056603,"-8:6":10,"-8:7":10.63014581273465,"-8:8":11.313708498984761,"-7:-8":10.63014581273465,"-7:8":10.63014581273465,"-6:-8":10,"-6:8":10,"-5:-8":9.433981132056603,"-5:8":9.433981132056603,"-4:-8":8.94427190999916,"-4:8":8.94427190999916,"-3:-8":8.54400374531753,"-3:8":8.54400374531753,"-2:-8":8.246211251235321,"-2:8":8.246211251235321,"-1:-8":8.06225774829855,"-1:8":8.06225774829855,"0:-8":8,"0:8":8,"1:-8":8.06225774829855,"1:8":8.06225774829855,"2:-8":8.246211251235321,"2:8":8.246211251235321,"3:-8":8.54400374531753,"3:8":8.54400374531753,"4:-8":8.94427190999916,"4:8":8.94427190999916,"5:-8":9.433981132056603,"5:8":9.433981132056603,"6:-8":10,"6:8":10,"7:-8":10.63014581273465,"7:8":10.63014581273465,"8:-8":11.313708498984761,"8:-7":10.63014581273465,"8:-6":10,"8:-5":9.433981132056603,"8:-4":8.94427190999916,"8:-3":8.54400374531753,"8:-2":8.246211251235321,"8:-1":8.06225774829855,"8:0":8,"8:1":8.06225774829855,"8:2":8.246211251235321,"8:3":8.54400374531753,"8:4":8.94427190999916,"8:5":9.433981132056603,"8:6":10,"8:7":10.63014581273465,"8:8":11.313708498984761,"-9:-9":12.727922061357855,"-9:-8":12.041594578792296,"-9:-7":11.40175425099138,"-9:-6":10.816653826391969,"-9:-5":10.295630140987,"-9:-4":9.848857801796104,"-9:-3":9.486832980505138,"-9:-2":9.219544457292887,"-9:-1":9.055385138137417,"-9:0":9,"-9:1":9.055385138137417,"-9:2":9.219544457292887,"-9:3":9.486832980505138,"-9:4":9.848857801796104,"-9:5":10.295630140987,"-9:6":10.816653826391969,"-9:7":11.40175425099138,"-9:8":12.041594578792296,"-9:9":12.727922061357855,"-8:-9":12.041594578792296,"-8:9":12.041594578792296,"-7:-9":11.40175425099138,"-7:9":11.40175425099138,"-6:-9":10.816653826391969,"-6:9":10.816653826391969,"-5:-9":10.295630140987,"-5:9":10.295630140987,"-4:-9":9.848857801796104,"-4:9":9.848857801796104,"-3:-9":9.486832980505138,"-3:9":9.486832980505138,"-2:-9":9.219544457292887,"-2:9":9.219544457292887,"-1:-9":9.055385138137417,"-1:9":9.055385138137417,"0:-9":9,"0:9":9,"1:-9":9.055385138137417,"1:9":9.055385138137417,"2:-9":9.219544457292887,"2:9":9.219544457292887,"3:-9":9.486832980505138,"3:9":9.486832980505138,"4:-9":9.848857801796104,"4:9":9.848857801796104,"5:-9":10.295630140987,"5:9":10.295630140987,"6:-9":10.816653826391969,"6:9":10.816653826391969,"7:-9":11.40175425099138,"7:9":11.40175425099138,"8:-9":12.041594578792296,"8:9":12.041594578792296,"9:-9":12.727922061357855,"9:-8":12.041594578792296,"9:-7":11.40175425099138,"9:-6":10.816653826391969,"9:-5":10.295630140987,"9:-4":9.848857801796104,"9:-3":9.486832980505138,"9:-2":9.219544457292887,"9:-1":9.055385138137417,"9:0":9,"9:1":9.055385138137417,"9:2":9.219544457292887,"9:3":9.486832980505138,"9:4":9.848857801796104,"9:5":10.295630140987,"9:6":10.816653826391969,"9:7":11.40175425099138,"9:8":12.041594578792296,"9:9":12.727922061357855,"-10:-10":14.142135623730951,"-10:-9":13.45362404707371,"-10:-8":12.806248474865697,"-10:-7":12.206555615733702,"-10:-6":11.661903789690601,"-10:-5":11.180339887498949,"-10:-4":10.770329614269007,"-10:-3":10.44030650891055,"-10:-2":10.198039027185569,"-10:-1":10.04987562112089,"-10:0":10,"-10:1":10.04987562112089,"-10:2":10.198039027185569,"-10:3":10.44030650891055,"-10:4":10.770329614269007,"-10:5":11.180339887498949,"-10:6":11.661903789690601,"-10:7":12.206555615733702,"-10:8":12.806248474865697,"-10:9":13.45362404707371,"-10:10":14.142135623730951,"-9:-10":13.45362404707371,"-9:10":13.45362404707371,"-8:-10":12.806248474865697,"-8:10":12.806248474865697,"-7:-10":12.206555615733702,"-7:10":12.206555615733702,"-6:-10":11.661903789690601,"-6:10":11.661903789690601,"-5:-10":11.180339887498949,"-5:10":11.180339887498949,"-4:-10":10.770329614269007,"-4:10":10.770329614269007,"-3:-10":10.44030650891055,"-3:10":10.44030650891055,"-2:-10":10.198039027185569,"-2:10":10.198039027185569,"-1:-10":10.04987562112089,"-1:10":10.04987562112089,"0:-10":10,"0:10":10,"1:-10":10.04987562112089,"1:10":10.04987562112089,"2:-10":10.198039027185569,"2:10":10.198039027185569,"3:-10":10.44030650891055,"3:10":10.44030650891055,"4:-10":10.770329614269007,"4:10":10.770329614269007,"5:-10":11.180339887498949,"5:10":11.180339887498949,"6:-10":11.661903789690601,"6:10":11.661903789690601,"7:-10":12.206555615733702,"7:10":12.206555615733702,"8:-10":12.806248474865697,"8:10":12.806248474865697,"9:-10":13.45362404707371,"9:10":13.45362404707371,"10:-10":14.142135623730951,"10:-9":13.45362404707371,"10:-8":12.806248474865697,"10:-7":12.206555615733702,"10:-6":11.661903789690601,"10:-5":11.180339887498949,"10:-4":10.770329614269007,"10:-3":10.44030650891055,"10:-2":10.198039027185569,"10:-1":10.04987562112089,"10:0":10,"10:1":10.04987562112089,"10:2":10.198039027185569,"10:3":10.44030650891055,"10:4":10.770329614269007,"10:5":11.180339887498949,"10:6":11.661903789690601,"10:7":12.206555615733702,"10:8":12.806248474865697,"10:9":13.45362404707371,"10:10":14.142135623730951,"-11:-11":15.556349186104045,"-11:-10":14.866068747318506,"-11:-9":14.212670403551895,"-11:-8":13.601470508735444,"-11:-7":13.038404810405298,"-11:-6":12.529964086141668,"-11:-5":12.083045973594572,"-11:-4":11.704699910719626,"-11:-3":11.40175425099138,"-11:-2":11.180339887498949,"-11:-1":11.045361017187261,"-11:0":11,"-11:1":11.045361017187261,"-11:2":11.180339887498949,"-11:3":11.40175425099138,"-11:4":11.704699910719626,"-11:5":12.083045973594572,"-11:6":12.529964086141668,"-11:7":13.038404810405298,"-11:8":13.601470508735444,"-11:9":14.212670403551895,"-11:10":14.866068747318506,"-11:11":15.556349186104045,"-10:-11":14.866068747318506,"-10:11":14.866068747318506,"-9:-11":14.212670403551895,"-9:11":14.212670403551895,"-8:-11":13.601470508735444,"-8:11":13.601470508735444,"-7:-11":13.038404810405298,"-7:11":13.038404810405298,"-6:-11":12.529964086141668,"-6:11":12.529964086141668,"-5:-11":12.083045973594572,"-5:11":12.083045973594572,"-4:-11":11.704699910719626,"-4:11":11.704699910719626,"-3:-11":11.40175425099138,"-3:11":11.40175425099138,"-2:-11":11.180339887498949,"-2:11":11.180339887498949,"-1:-11":11.045361017187261,"-1:11":11.045361017187261,"0:-11":11,"0:11":11,"1:-11":11.045361017187261,"1:11":11.045361017187261,"2:-11":11.180339887498949,"2:11":11.180339887498949,"3:-11":11.40175425099138,"3:11":11.40175425099138,"4:-11":11.704699910719626,"4:11":11.704699910719626,"5:-11":12.083045973594572,"5:11":12.083045973594572,"6:-11":12.529964086141668,"6:11":12.529964086141668,"7:-11":13.038404810405298,"7:11":13.038404810405298,"8:-11":13.601470508735444,"8:11":13.601470508735444,"9:-11":14.212670403551895,"9:11":14.212670403551895,"10:-11":14.866068747318506,"10:11":14.866068747318506,"11:-11":15.556349186104045,"11:-10":14.866068747318506,"11:-9":14.212670403551895,"11:-8":13.601470508735444,"11:-7":13.038404810405298,"11:-6":12.529964086141668,"11:-5":12.083045973594572,"11:-4":11.704699910719626,"11:-3":11.40175425099138,"11:-2":11.180339887498949,"11:-1":11.045361017187261,"11:0":11,"11:1":11.045361017187261,"11:2":11.180339887498949,"11:3":11.40175425099138,"11:4":11.704699910719626,"11:5":12.083045973594572,"11:6":12.529964086141668,"11:7":13.038404810405298,"11:8":13.601470508735444,"11:9":14.212670403551895,"11:10":14.866068747318506,"11:11":15.556349186104045,"-12:-12":16.97056274847714,"-12:-11":16.278820596099706,"-12:-10":15.620499351813308,"-12:-9":15,"-12:-8":14.422205101855956,"-12:-7":13.892443989449804,"-12:-6":13.416407864998739,"-12:-5":13,"-12:-4":12.649110640673518,"-12:-3":12.36931687685298,"-12:-2":12.165525060596439,"-12:-1":12.041594578792296,"-12:0":12,"-12:1":12.041594578792296,"-12:2":12.165525060596439,"-12:3":12.36931687685298,"-12:4":12.649110640673518,"-12:5":13,"-12:6":13.416407864998739,"-12:7":13.892443989449804,"-12:8":14.422205101855956,"-12:9":15,"-12:10":15.620499351813308,"-12:11":16.278820596099706,"-12:12":16.97056274847714,"-11:-12":16.278820596099706,"-11:12":16.278820596099706,"-10:-12":15.620499351813308,"-10:12":15.620499351813308,"-9:-12":15,"-9:12":15,"-8:-12":14.422205101855956,"-8:12":14.422205101855956,"-7:-12":13.892443989449804,"-7:12":13.892443989449804,"-6:-12":13.416407864998739,"-6:12":13.416407864998739,"-5:-12":13,"-5:12":13,"-4:-12":12.649110640673518,"-4:12":12.649110640673518,"-3:-12":12.36931687685298,"-3:12":12.36931687685298,"-2:-12":12.165525060596439,"-2:12":12.165525060596439,"-1:-12":12.041594578792296,"-1:12":12.041594578792296,"0:-12":12,"0:12":12,"1:-12":12.041594578792296,"1:12":12.041594578792296,"2:-12":12.165525060596439,"2:12":12.165525060596439,"3:-12":12.36931687685298,"3:12":12.36931687685298,"4:-12":12.649110640673518,"4:12":12.649110640673518,"5:-12":13,"5:12":13,"6:-12":13.416407864998739,"6:12":13.416407864998739,"7:-12":13.892443989449804,"7:12":13.892443989449804,"8:-12":14.422205101855956,"8:12":14.422205101855956,"9:-12":15,"9:12":15,"10:-12":15.620499351813308,"10:12":15.620499351813308,"11:-12":16.278820596099706,"11:12":16.278820596099706,"12:-12":16.97056274847714,"12:-11":16.278820596099706,"12:-10":15.620499351813308,"12:-9":15,"12:-8":14.422205101855956,"12:-7":13.892443989449804,"12:-6":13.416407864998739,"12:-5":13,"12:-4":12.649110640673518,"12:-3":12.36931687685298,"12:-2":12.165525060596439,"12:-1":12.041594578792296,"12:0":12,"12:1":12.041594578792296,"12:2":12.165525060596439,"12:3":12.36931687685298,"12:4":12.649110640673518,"12:5":13,"12:6":13.416407864998739,"12:7":13.892443989449804,"12:8":14.422205101855956,"12:9":15,"12:10":15.620499351813308,"12:11":16.278820596099706,"12:12":16.97056274847714,"-13:-13":18.384776310850235,"-13:-12":17.69180601295413,"-13:-11":17.029386365926403,"-13:-10":16.401219466856727,"-13:-9":15.811388300841896,"-13:-8":15.264337522473747,"-13:-7":14.7648230602334,"-13:-6":14.317821063276353,"-13:-5":13.92838827718412,"-13:-4":13.601470508735444,"-13:-3":13.341664064126334,"-13:-2":13.152946437965905,"-13:-1":13.038404810405298,"-13:0":13,"-13:1":13.038404810405298,"-13:2":13.152946437965905,"-13:3":13.341664064126334,"-13:4":13.601470508735444,"-13:5":13.92838827718412,"-13:6":14.317821063276353,"-13:7":14.7648230602334,"-13:8":15.264337522473747,"-13:9":15.811388300841896,"-13:10":16.401219466856727,"-13:11":17.029386365926403,"-13:12":17.69180601295413,"-13:13":18.384776310850235,"-12:-13":17.69180601295413,"-12:13":17.69180601295413,"-11:-13":17.029386365926403,"-11:13":17.029386365926403,"-10:-13":16.401219466856727,"-10:13":16.401219466856727,"-9:-13":15.811388300841896,"-9:13":15.811388300841896,"-8:-13":15.264337522473747,"-8:13":15.264337522473747,"-7:-13":14.7648230602334,"-7:13":14.7648230602334,"-6:-13":14.317821063276353,"-6:13":14.317821063276353,"-5:-13":13.92838827718412,"-5:13":13.92838827718412,"-4:-13":13.601470508735444,"-4:13":13.601470508735444,"-3:-13":13.341664064126334,"-3:13":13.341664064126334,"-2:-13":13.152946437965905,"-2:13":13.152946437965905,"-1:-13":13.038404810405298,"-1:13":13.038404810405298,"0:-13":13,"0:13":13,"1:-13":13.038404810405298,"1:13":13.038404810405298,"2:-13":13.152946437965905,"2:13":13.152946437965905,"3:-13":13.341664064126334,"3:13":13.341664064126334,"4:-13":13.601470508735444,"4:13":13.601470508735444,"5:-13":13.92838827718412,"5:13":13.92838827718412,"6:-13":14.317821063276353,"6:13":14.317821063276353,"7:-13":14.7648230602334,"7:13":14.7648230602334,"8:-13":15.264337522473747,"8:13":15.264337522473747,"9:-13":15.811388300841896,"9:13":15.811388300841896,"10:-13":16.401219466856727,"10:13":16.401219466856727,"11:-13":17.029386365926403,"11:13":17.029386365926403,"12:-13":17.69180601295413,"12:13":17.69180601295413,"13:-13":18.384776310850235,"13:-12":17.69180601295413,"13:-11":17.029386365926403,"13:-10":16.401219466856727,"13:-9":15.811388300841896,"13:-8":15.264337522473747,"13:-7":14.7648230602334,"13:-6":14.317821063276353,"13:-5":13.92838827718412,"13:-4":13.601470508735444,"13:-3":13.341664064126334,"13:-2":13.152946437965905,"13:-1":13.038404810405298,"13:0":13,"13:1":13.038404810405298,"13:2":13.152946437965905,"13:3":13.341664064126334,"13:4":13.601470508735444,"13:5":13.92838827718412,"13:6":14.317821063276353,"13:7":14.7648230602334,"13:8":15.264337522473747,"13:9":15.811388300841896,"13:10":16.401219466856727,"13:11":17.029386365926403,"13:12":17.69180601295413,"13:13":18.384776310850235,"-14:-14":19.79898987322333,"-14:-13":19.1049731745428,"-14:-12":18.439088914585774,"-14:-11":17.804493814764857,"-14:-10":17.204650534085253,"-14:-9":16.64331697709324,"-14:-8":16.1245154965971,"-14:-7":15.652475842498529,"-14:-6":15.231546211727817,"-14:-5":14.866068747318506,"-14:-4":14.560219778561036,"-14:-3":14.317821063276353,"-14:-2":14.142135623730951,"-14:-1":14.035668847618199,"-14:0":14,"-14:1":14.035668847618199,"-14:2":14.142135623730951,"-14:3":14.317821063276353,"-14:4":14.560219778561036,"-14:5":14.866068747318506,"-14:6":15.231546211727817,"-14:7":15.652475842498529,"-14:8":16.1245154965971,"-14:9":16.64331697709324,"-14:10":17.204650534085253,"-14:11":17.804493814764857,"-14:12":18.439088914585774,"-14:13":19.1049731745428,"-14:14":19.79898987322333,"-13:-14":19.1049731745428,"-13:14":19.1049731745428,"-12:-14":18.439088914585774,"-12:14":18.439088914585774,"-11:-14":17.804493814764857,"-11:14":17.804493814764857,"-10:-14":17.204650534085253,"-10:14":17.204650534085253,"-9:-14":16.64331697709324,"-9:14":16.64331697709324,"-8:-14":16.1245154965971,"-8:14":16.1245154965971,"-7:-14":15.652475842498529,"-7:14":15.652475842498529,"-6:-14":15.231546211727817,"-6:14":15.231546211727817,"-5:-14":14.866068747318506,"-5:14":14.866068747318506,"-4:-14":14.560219778561036,"-4:14":14.560219778561036,"-3:-14":14.317821063276353,"-3:14":14.317821063276353,"-2:-14":14.142135623730951,"-2:14":14.142135623730951,"-1:-14":14.035668847618199,"-1:14":14.035668847618199,"0:-14":14,"0:14":14,"1:-14":14.035668847618199,"1:14":14.035668847618199,"2:-14":14.142135623730951,"2:14":14.142135623730951,"3:-14":14.317821063276353,"3:14":14.317821063276353,"4:-14":14.560219778561036,"4:14":14.560219778561036,"5:-14":14.866068747318506,"5:14":14.866068747318506,"6:-14":15.231546211727817,"6:14":15.231546211727817,"7:-14":15.652475842498529,"7:14":15.652475842498529,"8:-14":16.1245154965971,"8:14":16.1245154965971,"9:-14":16.64331697709324,"9:14":16.64331697709324,"10:-14":17.204650534085253,"10:14":17.204650534085253,"11:-14":17.804493814764857,"11:14":17.804493814764857,"12:-14":18.439088914585774,"12:14":18.439088914585774,"13:-14":19.1049731745428,"13:14":19.1049731745428,"14:-14":19.79898987322333,"14:-13":19.1049731745428,"14:-12":18.439088914585774,"14:-11":17.804493814764857,"14:-10":17.204650534085253,"14:-9":16.64331697709324,"14:-8":16.1245154965971,"14:-7":15.652475842498529,"14:-6":15.231546211727817,"14:-5":14.866068747318506,"14:-4":14.560219778561036,"14:-3":14.317821063276353,"14:-2":14.142135623730951,"14:-1":14.035668847618199,"14:0":14,"14:1":14.035668847618199,"14:2":14.142135623730951,"14:3":14.317821063276353,"14:4":14.560219778561036,"14:5":14.866068747318506,"14:6":15.231546211727817,"14:7":15.652475842498529,"14:8":16.1245154965971,"14:9":16.64331697709324,"14:10":17.204650534085253,"14:11":17.804493814764857,"14:12":18.439088914585774,"14:13":19.1049731745428,"14:14":19.79898987322333,"-15:-15":21.213203435596427,"-15:-14":20.518284528683193,"-15:-13":19.849433241279208,"-15:-12":19.209372712298546,"-15:-11":18.601075237738275,"-15:-10":18.027756377319946,"-15:-9":17.4928556845359,"-15:-8":17,"-15:-7":16.55294535724685,"-15:-6":16.15549442140351,"-15:-5":15.811388300841896,"-15:-4":15.524174696260024,"-15:-3":15.297058540778355,"-15:-2":15.132745950421556,"-15:-1":15.033296378372908,"-15:0":15,"-15:1":15.033296378372908,"-15:2":15.132745950421556,"-15:3":15.297058540778355,"-15:4":15.524174696260024,"-15:5":15.811388300841896,"-15:6":16.15549442140351,"-15:7":16.55294535724685,"-15:8":17,"-15:9":17.4928556845359,"-15:10":18.027756377319946,"-15:11":18.601075237738275,"-15:12":19.209372712298546,"-15:13":19.849433241279208,"-15:14":20.518284528683193,"-15:15":21.213203435596427,"-14:-15":20.518284528683193,"-14:15":20.518284528683193,"-13:-15":19.849433241279208,"-13:15":19.849433241279208,"-12:-15":19.209372712298546,"-12:15":19.209372712298546,"-11:-15":18.601075237738275,"-11:15":18.601075237738275,"-10:-15":18.027756377319946,"-10:15":18.027756377319946,"-9:-15":17.4928556845359,"-9:15":17.4928556845359,"-8:-15":17,"-8:15":17,"-7:-15":16.55294535724685,"-7:15":16.55294535724685,"-6:-15":16.15549442140351,"-6:15":16.15549442140351,"-5:-15":15.811388300841896,"-5:15":15.811388300841896,"-4:-15":15.524174696260024,"-4:15":15.524174696260024,"-3:-15":15.297058540778355,"-3:15":15.297058540778355,"-2:-15":15.132745950421556,"-2:15":15.132745950421556,"-1:-15":15.033296378372908,"-1:15":15.033296378372908,"0:-15":15,"0:15":15,"1:-15":15.033296378372908,"1:15":15.033296378372908,"2:-15":15.132745950421556,"2:15":15.132745950421556,"3:-15":15.297058540778355,"3:15":15.297058540778355,"4:-15":15.524174696260024,"4:15":15.524174696260024,"5:-15":15.811388300841896,"5:15":15.811388300841896,"6:-15":16.15549442140351,"6:15":16.15549442140351,"7:-15":16.55294535724685,"7:15":16.55294535724685,"8:-15":17,"8:15":17,"9:-15":17.4928556845359,"9:15":17.4928556845359,"10:-15":18.027756377319946,"10:15":18.027756377319946,"11:-15":18.601075237738275,"11:15":18.601075237738275,"12:-15":19.209372712298546,"12:15":19.209372712298546,"13:-15":19.849433241279208,"13:15":19.849433241279208,"14:-15":20.518284528683193,"14:15":20.518284528683193,"15:-15":21.213203435596427,"15:-14":20.518284528683193,"15:-13":19.849433241279208,"15:-12":19.209372712298546,"15:-11":18.601075237738275,"15:-10":18.027756377319946,"15:-9":17.4928556845359,"15:-8":17,"15:-7":16.55294535724685,"15:-6":16.15549442140351,"15:-5":15.811388300841896,"15:-4":15.524174696260024,"15:-3":15.297058540778355,"15:-2":15.132745950421556,"15:-1":15.033296378372908,"15:0":15,"15:1":15.033296378372908,"15:2":15.132745950421556,"15:3":15.297058540778355,"15:4":15.524174696260024,"15:5":15.811388300841896,"15:6":16.15549442140351,"15:7":16.55294535724685,"15:8":17,"15:9":17.4928556845359,"15:10":18.027756377319946,"15:11":18.601075237738275,"15:12":19.209372712298546,"15:13":19.849433241279208,"15:14":20.518284528683193,"15:15":21.213203435596427,"-16:-16":22.627416997969522,"-16:-15":21.93171219946131,"-16:-14":21.2602916254693,"-16:-13":20.615528128088304,"-16:-12":20,"-16:-11":19.4164878389476,"-16:-10":18.867962264113206,"-16:-9":18.35755975068582,"-16:-8":17.88854381999832,"-16:-7":17.46424919657298,"-16:-6":17.08800749063506,"-16:-5":16.76305461424021,"-16:-4":16.492422502470642,"-16:-3":16.278820596099706,"-16:-2":16.1245154965971,"-16:-1":16.0312195418814,"-16:0":16,"-16:1":16.0312195418814,"-16:2":16.1245154965971,"-16:3":16.278820596099706,"-16:4":16.492422502470642,"-16:5":16.76305461424021,"-16:6":17.08800749063506,"-16:7":17.46424919657298,"-16:8":17.88854381999832,"-16:9":18.35755975068582,"-16:10":18.867962264113206,"-16:11":19.4164878389476,"-16:12":20,"-16:13":20.615528128088304,"-16:14":21.2602916254693,"-16:15":21.93171219946131,"-16:16":22.627416997969522,"-15:-16":21.93171219946131,"-15:16":21.93171219946131,"-14:-16":21.2602916254693,"-14:16":21.2602916254693,"-13:-16":20.615528128088304,"-13:16":20.615528128088304,"-12:-16":20,"-12:16":20,"-11:-16":19.4164878389476,"-11:16":19.4164878389476,"-10:-16":18.867962264113206,"-10:16":18.867962264113206,"-9:-16":18.35755975068582,"-9:16":18.35755975068582,"-8:-16":17.88854381999832,"-8:16":17.88854381999832,"-7:-16":17.46424919657298,"-7:16":17.46424919657298,"-6:-16":17.08800749063506,"-6:16":17.08800749063506,"-5:-16":16.76305461424021,"-5:16":16.76305461424021,"-4:-16":16.492422502470642,"-4:16":16.492422502470642,"-3:-16":16.278820596099706,"-3:16":16.278820596099706,"-2:-16":16.1245154965971,"-2:16":16.1245154965971,"-1:-16":16.0312195418814,"-1:16":16.0312195418814,"0:-16":16,"0:16":16,"1:-16":16.0312195418814,"1:16":16.0312195418814,"2:-16":16.1245154965971,"2:16":16.1245154965971,"3:-16":16.278820596099706,"3:16":16.278820596099706,"4:-16":16.492422502470642,"4:16":16.492422502470642,"5:-16":16.76305461424021,"5:16":16.76305461424021,"6:-16":17.08800749063506,"6:16":17.08800749063506,"7:-16":17.46424919657298,"7:16":17.46424919657298,"8:-16":17.88854381999832,"8:16":17.88854381999832,"9:-16":18.35755975068582,"9:16":18.35755975068582,"10:-16":18.867962264113206,"10:16":18.867962264113206,"11:-16":19.4164878389476,"11:16":19.4164878389476,"12:-16":20,"12:16":20,"13:-16":20.615528128088304,"13:16":20.615528128088304,"14:-16":21.2602916254693,"14:16":21.2602916254693,"15:-16":21.93171219946131,"15:16":21.93171219946131,"16:-16":22.627416997969522,"16:-15":21.93171219946131,"16:-14":21.2602916254693,"16:-13":20.615528128088304,"16:-12":20,"16:-11":19.4164878389476,"16:-10":18.867962264113206,"16:-9":18.35755975068582,"16:-8":17.88854381999832,"16:-7":17.46424919657298,"16:-6":17.08800749063506,"16:-5":16.76305461424021,"16:-4":16.492422502470642,"16:-3":16.278820596099706,"16:-2":16.1245154965971,"16:-1":16.0312195418814,"16:0":16,"16:1":16.0312195418814,"16:2":16.1245154965971,"16:3":16.278820596099706,"16:4":16.492422502470642,"16:5":16.76305461424021,"16:6":17.08800749063506,"16:7":17.46424919657298,"16:8":17.88854381999832,"16:9":18.35755975068582,"16:10":18.867962264113206,"16:11":19.4164878389476,"16:12":20,"16:13":20.615528128088304,"16:14":21.2602916254693,"16:15":21.93171219946131,"16:16":22.627416997969522,"-17:-17":24.041630560342615,"-17:-16":23.345235059857504,"-17:-15":22.67156809750927,"-17:-14":22.02271554554524,"-17:-13":21.400934559032695,"-17:-12":20.808652046684813,"-17:-11":20.248456731316587,"-17:-10":19.72308292331602,"-17:-9":19.235384061671343,"-17:-8":18.788294228055936,"-17:-7":18.384776310850235,"-17:-6":18.027756377319946,"-17:-5":17.72004514666935,"-17:-4":17.46424919657298,"-17:-3":17.26267650163207,"-17:-2":17.11724276862369,"-17:-1":17.029386365926403,"-17:0":17,"-17:1":17.029386365926403,"-17:2":17.11724276862369,"-17:3":17.26267650163207,"-17:4":17.46424919657298,"-17:5":17.72004514666935,"-17:6":18.027756377319946,"-17:7":18.384776310850235,"-17:8":18.788294228055936,"-17:9":19.235384061671343,"-17:10":19.72308292331602,"-17:11":20.248456731316587,"-17:12":20.808652046684813,"-17:13":21.400934559032695,"-17:14":22.02271554554524,"-17:15":22.67156809750927,"-17:16":23.345235059857504,"-17:17":24.041630560342615,"-16:-17":23.345235059857504,"-16:17":23.345235059857504,"-15:-17":22.67156809750927,"-15:17":22.67156809750927,"-14:-17":22.02271554554524,"-14:17":22.02271554554524,"-13:-17":21.400934559032695,"-13:17":21.400934559032695,"-12:-17":20.808652046684813,"-12:17":20.808652046684813,"-11:-17":20.248456731316587,"-11:17":20.248456731316587,"-10:-17":19.72308292331602,"-10:17":19.72308292331602,"-9:-17":19.235384061671343,"-9:17":19.235384061671343,"-8:-17":18.788294228055936,"-8:17":18.788294228055936,"-7:-17":18.384776310850235,"-7:17":18.384776310850235,"-6:-17":18.027756377319946,"-6:17":18.027756377319946,"-5:-17":17.72004514666935,"-5:17":17.72004514666935,"-4:-17":17.46424919657298,"-4:17":17.46424919657298,"-3:-17":17.26267650163207,"-3:17":17.26267650163207,"-2:-17":17.11724276862369,"-2:17":17.11724276862369,"-1:-17":17.029386365926403,"-1:17":17.029386365926403,"0:-17":17,"0:17":17,"1:-17":17.029386365926403,"1:17":17.029386365926403,"2:-17":17.11724276862369,"2:17":17.11724276862369,"3:-17":17.26267650163207,"3:17":17.26267650163207,"4:-17":17.46424919657298,"4:17":17.46424919657298,"5:-17":17.72004514666935,"5:17":17.72004514666935,"6:-17":18.027756377319946,"6:17":18.027756377319946,"7:-17":18.384776310850235,"7:17":18.384776310850235,"8:-17":18.788294228055936,"8:17":18.788294228055936,"9:-17":19.235384061671343,"9:17":19.235384061671343,"10:-17":19.72308292331602,"10:17":19.72308292331602,"11:-17":20.248456731316587,"11:17":20.248456731316587,"12:-17":20.808652046684813,"12:17":20.808652046684813,"13:-17":21.400934559032695,"13:17":21.400934559032695,"14:-17":22.02271554554524,"14:17":22.02271554554524,"15:-17":22.67156809750927,"15:17":22.67156809750927,"16:-17":23.345235059857504,"16:17":23.345235059857504,"17:-17":24.041630560342615,"17:-16":23.345235059857504,"17:-15":22.67156809750927,"17:-14":22.02271554554524,"17:-13":21.400934559032695,"17:-12":20.808652046684813,"17:-11":20.248456731316587,"17:-10":19.72308292331602,"17:-9":19.235384061671343,"17:-8":18.788294228055936,"17:-7":18.384776310850235,"17:-6":18.027756377319946,"17:-5":17.72004514666935,"17:-4":17.46424919657298,"17:-3":17.26267650163207,"17:-2":17.11724276862369,"17:-1":17.029386365926403,"17:0":17,"17:1":17.029386365926403,"17:2":17.11724276862369,"17:3":17.26267650163207,"17:4":17.46424919657298,"17:5":17.72004514666935,"17:6":18.027756377319946,"17:7":18.384776310850235,"17:8":18.788294228055936,"17:9":19.235384061671343,"17:10":19.72308292331602,"17:11":20.248456731316587,"17:12":20.808652046684813,"17:13":21.400934559032695,"17:14":22.02271554554524,"17:15":22.67156809750927,"17:16":23.345235059857504,"17:17":24.041630560342615,"-18:-18":25.45584412271571,"-18:-17":24.758836806279895,"-18:-16":24.08318915758459,"-18:-15":23.430749027719962,"-18:-14":22.80350850198276,"-18:-13":22.20360331117452,"-18:-12":21.633307652783937,"-18:-11":21.095023109728988,"-18:-10":20.591260281974,"-18:-9":20.12461179749811,"-18:-8":19.697715603592208,"-18:-7":19.313207915827967,"-18:-6":18.973665961010276,"-18:-5":18.681541692269406,"-18:-4":18.439088914585774,"-18:-3":18.24828759089466,"-18:-2":18.110770276274835,"-18:-1":18.027756377319946,"-18:0":18,"-18:1":18.027756377319946,"-18:2":18.110770276274835,"-18:3":18.24828759089466,"-18:4":18.439088914585774,"-18:5":18.681541692269406,"-18:6":18.973665961010276,"-18:7":19.313207915827967,"-18:8":19.697715603592208,"-18:9":20.12461179749811,"-18:10":20.591260281974,"-18:11":21.095023109728988,"-18:12":21.633307652783937,"-18:13":22.20360331117452,"-18:14":22.80350850198276,"-18:15":23.430749027719962,"-18:16":24.08318915758459,"-18:17":24.758836806279895,"-18:18":25.45584412271571,"-17:-18":24.758836806279895,"-17:18":24.758836806279895,"-16:-18":24.08318915758459,"-16:18":24.08318915758459,"-15:-18":23.430749027719962,"-15:18":23.430749027719962,"-14:-18":22.80350850198276,"-14:18":22.80350850198276,"-13:-18":22.20360331117452,"-13:18":22.20360331117452,"-12:-18":21.633307652783937,"-12:18":21.633307652783937,"-11:-18":21.095023109728988,"-11:18":21.095023109728988,"-10:-18":20.591260281974,"-10:18":20.591260281974,"-9:-18":20.12461179749811,"-9:18":20.12461179749811,"-8:-18":19.697715603592208,"-8:18":19.697715603592208,"-7:-18":19.313207915827967,"-7:18":19.313207915827967,"-6:-18":18.973665961010276,"-6:18":18.973665961010276,"-5:-18":18.681541692269406,"-5:18":18.681541692269406,"-4:-18":18.439088914585774,"-4:18":18.439088914585774,"-3:-18":18.24828759089466,"-3:18":18.24828759089466,"-2:-18":18.110770276274835,"-2:18":18.110770276274835,"-1:-18":18.027756377319946,"-1:18":18.027756377319946,"0:-18":18,"0:18":18,"1:-18":18.027756377319946,"1:18":18.027756377319946,"2:-18":18.110770276274835,"2:18":18.110770276274835,"3:-18":18.24828759089466,"3:18":18.24828759089466,"4:-18":18.439088914585774,"4:18":18.439088914585774,"5:-18":18.681541692269406,"5:18":18.681541692269406,"6:-18":18.973665961010276,"6:18":18.973665961010276,"7:-18":19.313207915827967,"7:18":19.313207915827967,"8:-18":19.697715603592208,"8:18":19.697715603592208,"9:-18":20.12461179749811,"9:18":20.12461179749811,"10:-18":20.591260281974,"10:18":20.591260281974,"11:-18":21.095023109728988,"11:18":21.095023109728988,"12:-18":21.633307652783937,"12:18":21.633307652783937,"13:-18":22.20360331117452,"13:18":22.20360331117452,"14:-18":22.80350850198276,"14:18":22.80350850198276,"15:-18":23.430749027719962,"15:18":23.430749027719962,"16:-18":24.08318915758459,"16:18":24.08318915758459,"17:-18":24.758836806279895,"17:18":24.758836806279895,"18:-18":25.45584412271571,"18:-17":24.758836806279895,"18:-16":24.08318915758459,"18:-15":23.430749027719962,"18:-14":22.80350850198276,"18:-13":22.20360331117452,"18:-12":21.633307652783937,"18:-11":21.095023109728988,"18:-10":20.591260281974,"18:-9":20.12461179749811,"18:-8":19.697715603592208,"18:-7":19.313207915827967,"18:-6":18.973665961010276,"18:-5":18.681541692269406,"18:-4":18.439088914585774,"18:-3":18.24828759089466,"18:-2":18.110770276274835,"18:-1":18.027756377319946,"18:0":18,"18:1":18.027756377319946,"18:2":18.110770276274835,"18:3":18.24828759089466,"18:4":18.439088914585774,"18:5":18.681541692269406,"18:6":18.973665961010276,"18:7":19.313207915827967,"18:8":19.697715603592208,"18:9":20.12461179749811,"18:10":20.591260281974,"18:11":21.095023109728988,"18:12":21.633307652783937,"18:13":22.20360331117452,"18:14":22.80350850198276,"18:15":23.430749027719962,"18:16":24.08318915758459,"18:17":24.758836806279895,"18:18":25.45584412271571,"-19:-19":26.870057685088806,"-19:-18":26.1725046566048,"-19:-17":25.495097567963924,"-19:-16":24.839484696748443,"-19:-15":24.20743687382041,"-19:-14":23.600847442411894,"-19:-13":23.021728866442675,"-19:-12":22.47220505424423,"-19:-11":21.95449840010015,"-19:-10":21.470910553583888,"-19:-9":21.02379604162864,"-19:-8":20.615528128088304,"-19:-7":20.248456731316587,"-19:-6":19.924858845171276,"-19:-5":19.6468827043885,"-19:-4":19.4164878389476,"-19:-3":19.235384061671343,"-19:-2":19.1049731745428,"-19:-1":19.026297590440446,"-19:0":19,"-19:1":19.026297590440446,"-19:2":19.1049731745428,"-19:3":19.235384061671343,"-19:4":19.4164878389476,"-19:5":19.6468827043885,"-19:6":19.924858845171276,"-19:7":20.248456731316587,"-19:8":20.615528128088304,"-19:9":21.02379604162864,"-19:10":21.470910553583888,"-19:11":21.95449840010015,"-19:12":22.47220505424423,"-19:13":23.021728866442675,"-19:14":23.600847442411894,"-19:15":24.20743687382041,"-19:16":24.839484696748443,"-19:17":25.495097567963924,"-19:18":26.1725046566048,"-19:19":26.870057685088806,"-18:-19":26.1725046566048,"-18:19":26.1725046566048,"-17:-19":25.495097567963924,"-17:19":25.495097567963924,"-16:-19":24.839484696748443,"-16:19":24.839484696748443,"-15:-19":24.20743687382041,"-15:19":24.20743687382041,"-14:-19":23.600847442411894,"-14:19":23.600847442411894,"-13:-19":23.021728866442675,"-13:19":23.021728866442675,"-12:-19":22.47220505424423,"-12:19":22.47220505424423,"-11:-19":21.95449840010015,"-11:19":21.95449840010015,"-10:-19":21.470910553583888,"-10:19":21.470910553583888,"-9:-19":21.02379604162864,"-9:19":21.02379604162864,"-8:-19":20.615528128088304,"-8:19":20.615528128088304,"-7:-19":20.248456731316587,"-7:19":20.248456731316587,"-6:-19":19.924858845171276,"-6:19":19.924858845171276,"-5:-19":19.6468827043885,"-5:19":19.6468827043885,"-4:-19":19.4164878389476,"-4:19":19.4164878389476,"-3:-19":19.235384061671343,"-3:19":19.235384061671343,"-2:-19":19.1049731745428,"-2:19":19.1049731745428,"-1:-19":19.026297590440446,"-1:19":19.026297590440446,"0:-19":19,"0:19":19,"1:-19":19.026297590440446,"1:19":19.026297590440446,"2:-19":19.1049731745428,"2:19":19.1049731745428,"3:-19":19.235384061671343,"3:19":19.235384061671343,"4:-19":19.4164878389476,"4:19":19.4164878389476,"5:-19":19.6468827043885,"5:19":19.6468827043885,"6:-19":19.924858845171276,"6:19":19.924858845171276,"7:-19":20.248456731316587,"7:19":20.248456731316587,"8:-19":20.615528128088304,"8:19":20.615528128088304,"9:-19":21.02379604162864,"9:19":21.02379604162864,"10:-19":21.470910553583888,"10:19":21.470910553583888,"11:-19":21.95449840010015,"11:19":21.95449840010015,"12:-19":22.47220505424423,"12:19":22.47220505424423,"13:-19":23.021728866442675,"13:19":23.021728866442675,"14:-19":23.600847442411894,"14:19":23.600847442411894,"15:-19":24.20743687382041,"15:19":24.20743687382041,"16:-19":24.839484696748443,"16:19":24.839484696748443,"17:-19":25.495097567963924,"17:19":25.495097567963924,"18:-19":26.1725046566048,"18:19":26.1725046566048,"19:-19":26.870057685088806,"19:-18":26.1725046566048,"19:-17":25.495097567963924,"19:-16":24.839484696748443,"19:-15":24.20743687382041,"19:-14":23.600847442411894,"19:-13":23.021728866442675,"19:-12":22.47220505424423,"19:-11":21.95449840010015,"19:-10":21.470910553583888,"19:-9":21.02379604162864,"19:-8":20.615528128088304,"19:-7":20.248456731316587,"19:-6":19.924858845171276,"19:-5":19.6468827043885,"19:-4":19.4164878389476,"19:-3":19.235384061671343,"19:-2":19.1049731745428,"19:-1":19.026297590440446,"19:0":19,"19:1":19.026297590440446,"19:2":19.1049731745428,"19:3":19.235384061671343,"19:4":19.4164878389476,"19:5":19.6468827043885,"19:6":19.924858845171276,"19:7":20.248456731316587,"19:8":20.615528128088304,"19:9":21.02379604162864,"19:10":21.470910553583888,"19:11":21.95449840010015,"19:12":22.47220505424423,"19:13":23.021728866442675,"19:14":23.600847442411894,"19:15":24.20743687382041,"19:16":24.839484696748443,"19:17":25.495097567963924,"19:18":26.1725046566048,"19:19":26.870057685088806,"-20:-20":28.284271247461902,"-20:-19":27.586228448267445,"-20:-18":26.90724809414742,"-20:-17":26.248809496813376,"-20:-16":25.612496949731394,"-20:-15":25,"-20:-14":24.413111231467404,"-20:-13":23.853720883753127,"-20:-12":23.323807579381203,"-20:-11":22.825424421026653,"-20:-10":22.360679774997898,"-20:-9":21.93171219946131,"-20:-8":21.540659228538015,"-20:-7":21.18962010041709,"-20:-6":20.8806130178211,"-20:-5":20.615528128088304,"-20:-4":20.396078054371138,"-20:-3":20.223748416156685,"-20:-2":20.09975124224178,"-20:-1":20.024984394500787,"-20:0":20,"-20:1":20.024984394500787,"-20:2":20.09975124224178,"-20:3":20.223748416156685,"-20:4":20.396078054371138,"-20:5":20.615528128088304,"-20:6":20.8806130178211,"-20:7":21.18962010041709,"-20:8":21.540659228538015,"-20:9":21.93171219946131,"-20:10":22.360679774997898,"-20:11":22.825424421026653,"-20:12":23.323807579381203,"-20:13":23.853720883753127,"-20:14":24.413111231467404,"-20:15":25,"-20:16":25.612496949731394,"-20:17":26.248809496813376,"-20:18":26.90724809414742,"-20:19":27.586228448267445,"-20:20":28.284271247461902,"-19:-20":27.586228448267445,"-19:20":27.586228448267445,"-18:-20":26.90724809414742,"-18:20":26.90724809414742,"-17:-20":26.248809496813376,"-17:20":26.248809496813376,"-16:-20":25.612496949731394,"-16:20":25.612496949731394,"-15:-20":25,"-15:20":25,"-14:-20":24.413111231467404,"-14:20":24.413111231467404,"-13:-20":23.853720883753127,"-13:20":23.853720883753127,"-12:-20":23.323807579381203,"-12:20":23.323807579381203,"-11:-20":22.825424421026653,"-11:20":22.825424421026653,"-10:-20":22.360679774997898,"-10:20":22.360679774997898,"-9:-20":21.93171219946131,"-9:20":21.93171219946131,"-8:-20":21.540659228538015,"-8:20":21.540659228538015,"-7:-20":21.18962010041709,"-7:20":21.18962010041709,"-6:-20":20.8806130178211,"-6:20":20.8806130178211,"-5:-20":20.615528128088304,"-5:20":20.615528128088304,"-4:-20":20.396078054371138,"-4:20":20.396078054371138,"-3:-20":20.223748416156685,"-3:20":20.223748416156685,"-2:-20":20.09975124224178,"-2:20":20.09975124224178,"-1:-20":20.024984394500787,"-1:20":20.024984394500787,"0:-20":20,"0:20":20,"1:-20":20.024984394500787,"1:20":20.024984394500787,"2:-20":20.09975124224178,"2:20":20.09975124224178,"3:-20":20.223748416156685,"3:20":20.223748416156685,"4:-20":20.396078054371138,"4:20":20.396078054371138,"5:-20":20.615528128088304,"5:20":20.615528128088304,"6:-20":20.8806130178211,"6:20":20.8806130178211,"7:-20":21.18962010041709,"7:20":21.18962010041709,"8:-20":21.540659228538015,"8:20":21.540659228538015,"9:-20":21.93171219946131,"9:20":21.93171219946131,"10:-20":22.360679774997898,"10:20":22.360679774997898,"11:-20":22.825424421026653,"11:20":22.825424421026653,"12:-20":23.323807579381203,"12:20":23.323807579381203,"13:-20":23.853720883753127,"13:20":23.853720883753127,"14:-20":24.413111231467404,"14:20":24.413111231467404,"15:-20":25,"15:20":25,"16:-20":25.612496949731394,"16:20":25.612496949731394,"17:-20":26.248809496813376,"17:20":26.248809496813376,"18:-20":26.90724809414742,"18:20":26.90724809414742,"19:-20":27.586228448267445,"19:20":27.586228448267445,"20:-20":28.284271247461902,"20:-19":27.586228448267445,"20:-18":26.90724809414742,"20:-17":26.248809496813376,"20:-16":25.612496949731394,"20:-15":25,"20:-14":24.413111231467404,"20:-13":23.853720883753127,"20:-12":23.323807579381203,"20:-11":22.825424421026653,"20:-10":22.360679774997898,"20:-9":21.93171219946131,"20:-8":21.540659228538015,"20:-7":21.18962010041709,"20:-6":20.8806130178211,"20:-5":20.615528128088304,"20:-4":20.396078054371138,"20:-3":20.223748416156685,"20:-2":20.09975124224178,"20:-1":20.024984394500787,"20:0":20,"20:1":20.024984394500787,"20:2":20.09975124224178,"20:3":20.223748416156685,"20:4":20.396078054371138,"20:5":20.615528128088304,"20:6":20.8806130178211,"20:7":21.18962010041709,"20:8":21.540659228538015,"20:9":21.93171219946131,"20:10":22.360679774997898,"20:11":22.825424421026653,"20:12":23.323807579381203,"20:13":23.853720883753127,"20:14":24.413111231467404,"20:15":25,"20:16":25.612496949731394,"20:17":26.248809496813376,"20:18":26.90724809414742,"20:19":27.586228448267445,"20:20":28.284271247461902,"-21:-21":29.698484809834994,"-21:-20":29,"-21:-19":28.319604517012593,"-21:-18":27.65863337187866,"-21:-17":27.018512172212592,"-21:-16":26.40075756488817,"-21:-15":25.80697580112788,"-21:-14":25.238858928247925,"-21:-13":24.698178070456937,"-21:-12":24.186773244895647,"-21:-11":23.706539182259394,"-21:-10":23.259406699226016,"-21:-9":22.847319317591726,"-21:-8":22.47220505424423,"-21:-7":22.135943621178654,"-21:-6":21.840329667841555,"-21:-5":21.587033144922902,"-21:-4":21.37755832643195,"-21:-3":21.213203435596427,"-21:-2":21.095023109728988,"-21:-1":21.02379604162864,"-21:0":21,"-21:1":21.02379604162864,"-21:2":21.095023109728988,"-21:3":21.213203435596427,"-21:4":21.37755832643195,"-21:5":21.587033144922902,"-21:6":21.840329667841555,"-21:7":22.135943621178654,"-21:8":22.47220505424423,"-21:9":22.847319317591726,"-21:10":23.259406699226016,"-21:11":23.706539182259394,"-21:12":24.186773244895647,"-21:13":24.698178070456937,"-21:14":25.238858928247925,"-21:15":25.80697580112788,"-21:16":26.40075756488817,"-21:17":27.018512172212592,"-21:18":27.65863337187866,"-21:19":28.319604517012593,"-21:20":29,"-21:21":29.698484809834994,"-20:-21":29,"-20:21":29,"-19:-21":28.319604517012593,"-19:21":28.319604517012593,"-18:-21":27.65863337187866,"-18:21":27.65863337187866,"-17:-21":27.018512172212592,"-17:21":27.018512172212592,"-16:-21":26.40075756488817,"-16:21":26.40075756488817,"-15:-21":25.80697580112788,"-15:21":25.80697580112788,"-14:-21":25.238858928247925,"-14:21":25.238858928247925,"-13:-21":24.698178070456937,"-13:21":24.698178070456937,"-12:-21":24.186773244895647,"-12:21":24.186773244895647,"-11:-21":23.706539182259394,"-11:21":23.706539182259394,"-10:-21":23.259406699226016,"-10:21":23.259406699226016,"-9:-21":22.847319317591726,"-9:21":22.847319317591726,"-8:-21":22.47220505424423,"-8:21":22.47220505424423,"-7:-21":22.135943621178654,"-7:21":22.135943621178654,"-6:-21":21.840329667841555,"-6:21":21.840329667841555,"-5:-21":21.587033144922902,"-5:21":21.587033144922902,"-4:-21":21.37755832643195,"-4:21":21.37755832643195,"-3:-21":21.213203435596427,"-3:21":21.213203435596427,"-2:-21":21.095023109728988,"-2:21":21.095023109728988,"-1:-21":21.02379604162864,"-1:21":21.02379604162864,"0:-21":21,"0:21":21,"1:-21":21.02379604162864,"1:21":21.02379604162864,"2:-21":21.095023109728988,"2:21":21.095023109728988,"3:-21":21.213203435596427,"3:21":21.213203435596427,"4:-21":21.37755832643195,"4:21":21.37755832643195,"5:-21":21.587033144922902,"5:21":21.587033144922902,"6:-21":21.840329667841555,"6:21":21.840329667841555,"7:-21":22.135943621178654,"7:21":22.135943621178654,"8:-21":22.47220505424423,"8:21":22.47220505424423,"9:-21":22.847319317591726,"9:21":22.847319317591726,"10:-21":23.259406699226016,"10:21":23.259406699226016,"11:-21":23.706539182259394,"11:21":23.706539182259394,"12:-21":24.186773244895647,"12:21":24.186773244895647,"13:-21":24.698178070456937,"13:21":24.698178070456937,"14:-21":25.238858928247925,"14:21":25.238858928247925,"15:-21":25.80697580112788,"15:21":25.80697580112788,"16:-21":26.40075756488817,"16:21":26.40075756488817,"17:-21":27.018512172212592,"17:21":27.018512172212592,"18:-21":27.65863337187866,"18:21":27.65863337187866,"19:-21":28.319604517012593,"19:21":28.319604517012593,"20:-21":29,"20:21":29,"21:-21":29.698484809834994,"21:-20":29,"21:-19":28.319604517012593,"21:-18":27.65863337187866,"21:-17":27.018512172212592,"21:-16":26.40075756488817,"21:-15":25.80697580112788,"21:-14":25.238858928247925,"21:-13":24.698178070456937,"21:-12":24.186773244895647,"21:-11":23.706539182259394,"21:-10":23.259406699226016,"21:-9":22.847319317591726,"21:-8":22.47220505424423,"21:-7":22.135943621178654,"21:-6":21.840329667841555,"21:-5":21.587033144922902,"21:-4":21.37755832643195,"21:-3":21.213203435596427,"21:-2":21.095023109728988,"21:-1":21.02379604162864,"21:0":21,"21:1":21.02379604162864,"21:2":21.095023109728988,"21:3":21.213203435596427,"21:4":21.37755832643195,"21:5":21.587033144922902,"21:6":21.840329667841555,"21:7":22.135943621178654,"21:8":22.47220505424423,"21:9":22.847319317591726,"21:10":23.259406699226016,"21:11":23.706539182259394,"21:12":24.186773244895647,"21:13":24.698178070456937,"21:14":25.238858928247925,"21:15":25.80697580112788,"21:16":26.40075756488817,"21:17":27.018512172212592,"21:18":27.65863337187866,"21:19":28.319604517012593,"21:20":29,"21:21":29.698484809834994,"-22:-22":31.11269837220809,"-22:-21":30.4138126514911,"-22:-20":29.732137494637012,"-22:-19":29.068883707497267,"-22:-18":28.42534080710379,"-22:-17":27.80287754891569,"-22:-16":27.202941017470888,"-22:-15":26.627053911388696,"-22:-14":26.076809620810597,"-22:-13":25.553864678361276,"-22:-12":25.059928172283335,"-22:-11":24.596747752497688,"-22:-10":24.166091947189145,"-22:-9":23.769728648009426,"-22:-8":23.40939982143925,"-22:-7":23.08679276123039,"-22:-6":22.80350850198276,"-22:-5":22.561028345356956,"-22:-4":22.360679774997898,"-22:-3":22.20360331117452,"-22:-2":22.090722034374522,"-22:-1":22.02271554554524,"-22:0":22,"-22:1":22.02271554554524,"-22:2":22.090722034374522,"-22:3":22.20360331117452,"-22:4":22.360679774997898,"-22:5":22.561028345356956,"-22:6":22.80350850198276,"-22:7":23.08679276123039,"-22:8":23.40939982143925,"-22:9":23.769728648009426,"-22:10":24.166091947189145,"-22:11":24.596747752497688,"-22:12":25.059928172283335,"-22:13":25.553864678361276,"-22:14":26.076809620810597,"-22:15":26.627053911388696,"-22:16":27.202941017470888,"-22:17":27.80287754891569,"-22:18":28.42534080710379,"-22:19":29.068883707497267,"-22:20":29.732137494637012,"-22:21":30.4138126514911,"-22:22":31.11269837220809,"-21:-22":30.4138126514911,"-21:22":30.4138126514911,"-20:-22":29.732137494637012,"-20:22":29.732137494637012,"-19:-22":29.068883707497267,"-19:22":29.068883707497267,"-18:-22":28.42534080710379,"-18:22":28.42534080710379,"-17:-22":27.80287754891569,"-17:22":27.80287754891569,"-16:-22":27.202941017470888,"-16:22":27.202941017470888,"-15:-22":26.627053911388696,"-15:22":26.627053911388696,"-14:-22":26.076809620810597,"-14:22":26.076809620810597,"-13:-22":25.553864678361276,"-13:22":25.553864678361276,"-12:-22":25.059928172283335,"-12:22":25.059928172283335,"-11:-22":24.596747752497688,"-11:22":24.596747752497688,"-10:-22":24.166091947189145,"-10:22":24.166091947189145,"-9:-22":23.769728648009426,"-9:22":23.769728648009426,"-8:-22":23.40939982143925,"-8:22":23.40939982143925,"-7:-22":23.08679276123039,"-7:22":23.08679276123039,"-6:-22":22.80350850198276,"-6:22":22.80350850198276,"-5:-22":22.561028345356956,"-5:22":22.561028345356956,"-4:-22":22.360679774997898,"-4:22":22.360679774997898,"-3:-22":22.20360331117452,"-3:22":22.20360331117452,"-2:-22":22.090722034374522,"-2:22":22.090722034374522,"-1:-22":22.02271554554524,"-1:22":22.02271554554524,"0:-22":22,"0:22":22,"1:-22":22.02271554554524,"1:22":22.02271554554524,"2:-22":22.090722034374522,"2:22":22.090722034374522,"3:-22":22.20360331117452,"3:22":22.20360331117452,"4:-22":22.360679774997898,"4:22":22.360679774997898,"5:-22":22.561028345356956,"5:22":22.561028345356956,"6:-22":22.80350850198276,"6:22":22.80350850198276,"7:-22":23.08679276123039,"7:22":23.08679276123039,"8:-22":23.40939982143925,"8:22":23.40939982143925,"9:-22":23.769728648009426,"9:22":23.769728648009426,"10:-22":24.166091947189145,"10:22":24.166091947189145,"11:-22":24.596747752497688,"11:22":24.596747752497688,"12:-22":25.059928172283335,"12:22":25.059928172283335,"13:-22":25.553864678361276,"13:22":25.553864678361276,"14:-22":26.076809620810597,"14:22":26.076809620810597,"15:-22":26.627053911388696,"15:22":26.627053911388696,"16:-22":27.202941017470888,"16:22":27.202941017470888,"17:-22":27.80287754891569,"17:22":27.80287754891569,"18:-22":28.42534080710379,"18:22":28.42534080710379,"19:-22":29.068883707497267,"19:22":29.068883707497267,"20:-22":29.732137494637012,"20:22":29.732137494637012,"21:-22":30.4138126514911,"21:22":30.4138126514911,"22:-22":31.11269837220809,"22:-21":30.4138126514911,"22:-20":29.732137494637012,"22:-19":29.068883707497267,"22:-18":28.42534080710379,"22:-17":27.80287754891569,"22:-16":27.202941017470888,"22:-15":26.627053911388696,"22:-14":26.076809620810597,"22:-13":25.553864678361276,"22:-12":25.059928172283335,"22:-11":24.596747752497688,"22:-10":24.166091947189145,"22:-9":23.769728648009426,"22:-8":23.40939982143925,"22:-7":23.08679276123039,"22:-6":22.80350850198276,"22:-5":22.561028345356956,"22:-4":22.360679774997898,"22:-3":22.20360331117452,"22:-2":22.090722034374522,"22:-1":22.02271554554524,"22:0":22,"22:1":22.02271554554524,"22:2":22.090722034374522,"22:3":22.20360331117452,"22:4":22.360679774997898,"22:5":22.561028345356956,"22:6":22.80350850198276,"22:7":23.08679276123039,"22:8":23.40939982143925,"22:9":23.769728648009426,"22:10":24.166091947189145,"22:11":24.596747752497688,"22:12":25.059928172283335,"22:13":25.553864678361276,"22:14":26.076809620810597,"22:15":26.627053911388696,"22:16":27.202941017470888,"22:17":27.80287754891569,"22:18":28.42534080710379,"22:19":29.068883707497267,"22:20":29.732137494637012,"22:21":30.4138126514911,"22:22":31.11269837220809,"-23:-23":32.526911934581186,"-23:-22":31.827660925679098,"-23:-21":31.144823004794873,"-23:-20":30.479501308256342,"-23:-19":29.832867780352597,"-23:-18":29.206163733020468,"-23:-17":28.600699292150182,"-23:-16":28.0178514522438,"-23:-15":27.459060435491963,"-23:-14":26.92582403567252,"-23:-13":26.419689627245813,"-23:-12":25.942243542145693,"-23:-11":25.495097567963924,"-23:-10":25.079872407968907,"-23:-9":24.698178070456937,"-23:-8":24.351591323771842,"-23:-7":24.041630560342615,"-23:-6":23.769728648009426,"-23:-5":23.53720459187964,"-23:-4":23.345235059857504,"-23:-3":23.194827009486403,"-23:-2":23.08679276123039,"-23:-1":23.021728866442675,"-23:0":23,"-23:1":23.021728866442675,"-23:2":23.08679276123039,"-23:3":23.194827009486403,"-23:4":23.345235059857504,"-23:5":23.53720459187964,"-23:6":23.769728648009426,"-23:7":24.041630560342615,"-23:8":24.351591323771842,"-23:9":24.698178070456937,"-23:10":25.079872407968907,"-23:11":25.495097567963924,"-23:12":25.942243542145693,"-23:13":26.419689627245813,"-23:14":26.92582403567252,"-23:15":27.459060435491963,"-23:16":28.0178514522438,"-23:17":28.600699292150182,"-23:18":29.206163733020468,"-23:19":29.832867780352597,"-23:20":30.479501308256342,"-23:21":31.144823004794873,"-23:22":31.827660925679098,"-23:23":32.526911934581186,"-22:-23":31.827660925679098,"-22:23":31.827660925679098,"-21:-23":31.144823004794873,"-21:23":31.144823004794873,"-20:-23":30.479501308256342,"-20:23":30.479501308256342,"-19:-23":29.832867780352597,"-19:23":29.832867780352597,"-18:-23":29.206163733020468,"-18:23":29.206163733020468,"-17:-23":28.600699292150182,"-17:23":28.600699292150182,"-16:-23":28.0178514522438,"-16:23":28.0178514522438,"-15:-23":27.459060435491963,"-15:23":27.459060435491963,"-14:-23":26.92582403567252,"-14:23":26.92582403567252,"-13:-23":26.419689627245813,"-13:23":26.419689627245813,"-12:-23":25.942243542145693,"-12:23":25.942243542145693,"-11:-23":25.495097567963924,"-11:23":25.495097567963924,"-10:-23":25.079872407968907,"-10:23":25.079872407968907,"-9:-23":24.698178070456937,"-9:23":24.698178070456937,"-8:-23":24.351591323771842,"-8:23":24.351591323771842,"-7:-23":24.041630560342615,"-7:23":24.041630560342615,"-6:-23":23.769728648009426,"-6:23":23.769728648009426,"-5:-23":23.53720459187964,"-5:23":23.53720459187964,"-4:-23":23.345235059857504,"-4:23":23.345235059857504,"-3:-23":23.194827009486403,"-3:23":23.194827009486403,"-2:-23":23.08679276123039,"-2:23":23.08679276123039,"-1:-23":23.021728866442675,"-1:23":23.021728866442675,"0:-23":23,"0:23":23,"1:-23":23.021728866442675,"1:23":23.021728866442675,"2:-23":23.08679276123039,"2:23":23.08679276123039,"3:-23":23.194827009486403,"3:23":23.194827009486403,"4:-23":23.345235059857504,"4:23":23.345235059857504,"5:-23":23.53720459187964,"5:23":23.53720459187964,"6:-23":23.769728648009426,"6:23":23.769728648009426,"7:-23":24.041630560342615,"7:23":24.041630560342615,"8:-23":24.351591323771842,"8:23":24.351591323771842,"9:-23":24.698178070456937,"9:23":24.698178070456937,"10:-23":25.079872407968907,"10:23":25.079872407968907,"11:-23":25.495097567963924,"11:23":25.495097567963924,"12:-23":25.942243542145693,"12:23":25.942243542145693,"13:-23":26.419689627245813,"13:23":26.419689627245813,"14:-23":26.92582403567252,"14:23":26.92582403567252,"15:-23":27.459060435491963,"15:23":27.459060435491963,"16:-23":28.0178514522438,"16:23":28.0178514522438,"17:-23":28.600699292150182,"17:23":28.600699292150182,"18:-23":29.206163733020468,"18:23":29.206163733020468,"19:-23":29.832867780352597,"19:23":29.832867780352597,"20:-23":30.479501308256342,"20:23":30.479501308256342,"21:-23":31.144823004794873,"21:23":31.144823004794873,"22:-23":31.827660925679098,"22:23":31.827660925679098,"23:-23":32.526911934581186,"23:-22":31.827660925679098,"23:-21":31.144823004794873,"23:-20":30.479501308256342,"23:-19":29.832867780352597,"23:-18":29.206163733020468,"23:-17":28.600699292150182,"23:-16":28.0178514522438,"23:-15":27.459060435491963,"23:-14":26.92582403567252,"23:-13":26.419689627245813,"23:-12":25.942243542145693,"23:-11":25.495097567963924,"23:-10":25.079872407968907,"23:-9":24.698178070456937,"23:-8":24.351591323771842,"23:-7":24.041630560342615,"23:-6":23.769728648009426,"23:-5":23.53720459187964,"23:-4":23.345235059857504,"23:-3":23.194827009486403,"23:-2":23.08679276123039,"23:-1":23.021728866442675,"23:0":23,"23:1":23.021728866442675,"23:2":23.08679276123039,"23:3":23.194827009486403,"23:4":23.345235059857504,"23:5":23.53720459187964,"23:6":23.769728648009426,"23:7":24.041630560342615,"23:8":24.351591323771842,"23:9":24.698178070456937,"23:10":25.079872407968907,"23:11":25.495097567963924,"23:12":25.942243542145693,"23:13":26.419689627245813,"23:14":26.92582403567252,"23:15":27.459060435491963,"23:16":28.0178514522438,"23:17":28.600699292150182,"23:18":29.206163733020468,"23:19":29.832867780352597,"23:20":30.479501308256342,"23:21":31.144823004794873,"23:22":31.827660925679098,"23:23":32.526911934581186,"-24:-24":33.94112549695428,"-24:-23":33.24154027718932,"-24:-22":32.55764119219941,"-24:-21":31.89043743820395,"-24:-20":31.240998703626616,"-24:-19":30.610455730027933,"-24:-18":30,"-24:-17":29.410882339705484,"-24:-16":28.844410203711913,"-24:-15":28.30194339616981,"-24:-14":27.784887978899608,"-24:-13":27.294688127912362,"-24:-12":26.832815729997478,"-24:-11":26.40075756488817,"-24:-10":26,"-24:-9":25.632011235952593,"-24:-8":25.298221281347036,"-24:-7":25,"-24:-6":24.73863375370596,"-24:-5":24.515301344262525,"-24:-4":24.331050121192877,"-24:-3":24.186773244895647,"-24:-2":24.08318915758459,"-24:-1":24.020824298928627,"-24:0":24,"-24:1":24.020824298928627,"-24:2":24.08318915758459,"-24:3":24.186773244895647,"-24:4":24.331050121192877,"-24:5":24.515301344262525,"-24:6":24.73863375370596,"-24:7":25,"-24:8":25.298221281347036,"-24:9":25.632011235952593,"-24:10":26,"-24:11":26.40075756488817,"-24:12":26.832815729997478,"-24:13":27.294688127912362,"-24:14":27.784887978899608,"-24:15":28.30194339616981,"-24:16":28.844410203711913,"-24:17":29.410882339705484,"-24:18":30,"-24:19":30.610455730027933,"-24:20":31.240998703626616,"-24:21":31.89043743820395,"-24:22":32.55764119219941,"-24:23":33.24154027718932,"-24:24":33.94112549695428,"-23:-24":33.24154027718932,"-23:24":33.24154027718932,"-22:-24":32.55764119219941,"-22:24":32.55764119219941,"-21:-24":31.89043743820395,"-21:24":31.89043743820395,"-20:-24":31.240998703626616,"-20:24":31.240998703626616,"-19:-24":30.610455730027933,"-19:24":30.610455730027933,"-18:-24":30,"-18:24":30,"-17:-24":29.410882339705484,"-17:24":29.410882339705484,"-16:-24":28.844410203711913,"-16:24":28.844410203711913,"-15:-24":28.30194339616981,"-15:24":28.30194339616981,"-14:-24":27.784887978899608,"-14:24":27.784887978899608,"-13:-24":27.294688127912362,"-13:24":27.294688127912362,"-12:-24":26.832815729997478,"-12:24":26.832815729997478,"-11:-24":26.40075756488817,"-11:24":26.40075756488817,"-10:-24":26,"-10:24":26,"-9:-24":25.632011235952593,"-9:24":25.632011235952593,"-8:-24":25.298221281347036,"-8:24":25.298221281347036,"-7:-24":25,"-7:24":25,"-6:-24":24.73863375370596,"-6:24":24.73863375370596,"-5:-24":24.515301344262525,"-5:24":24.515301344262525,"-4:-24":24.331050121192877,"-4:24":24.331050121192877,"-3:-24":24.186773244895647,"-3:24":24.186773244895647,"-2:-24":24.08318915758459,"-2:24":24.08318915758459,"-1:-24":24.020824298928627,"-1:24":24.020824298928627,"0:-24":24,"0:24":24,"1:-24":24.020824298928627,"1:24":24.020824298928627,"2:-24":24.08318915758459,"2:24":24.08318915758459,"3:-24":24.186773244895647,"3:24":24.186773244895647,"4:-24":24.331050121192877,"4:24":24.331050121192877,"5:-24":24.515301344262525,"5:24":24.515301344262525,"6:-24":24.73863375370596,"6:24":24.73863375370596,"7:-24":25,"7:24":25,"8:-24":25.298221281347036,"8:24":25.298221281347036,"9:-24":25.632011235952593,"9:24":25.632011235952593,"10:-24":26,"10:24":26,"11:-24":26.40075756488817,"11:24":26.40075756488817,"12:-24":26.832815729997478,"12:24":26.832815729997478,"13:-24":27.294688127912362,"13:24":27.294688127912362,"14:-24":27.784887978899608,"14:24":27.784887978899608,"15:-24":28.30194339616981,"15:24":28.30194339616981,"16:-24":28.844410203711913,"16:24":28.844410203711913,"17:-24":29.410882339705484,"17:24":29.410882339705484,"18:-24":30,"18:24":30,"19:-24":30.610455730027933,"19:24":30.610455730027933,"20:-24":31.240998703626616,"20:24":31.240998703626616,"21:-24":31.89043743820395,"21:24":31.89043743820395,"22:-24":32.55764119219941,"22:24":32.55764119219941,"23:-24":33.24154027718932,"23:24":33.24154027718932,"24:-24":33.94112549695428,"24:-23":33.24154027718932,"24:-22":32.55764119219941,"24:-21":31.89043743820395,"24:-20":31.240998703626616,"24:-19":30.610455730027933,"24:-18":30,"24:-17":29.410882339705484,"24:-16":28.844410203711913,"24:-15":28.30194339616981,"24:-14":27.784887978899608,"24:-13":27.294688127912362,"24:-12":26.832815729997478,"24:-11":26.40075756488817,"24:-10":26,"24:-9":25.632011235952593,"24:-8":25.298221281347036,"24:-7":25,"24:-6":24.73863375370596,"24:-5":24.515301344262525,"24:-4":24.331050121192877,"24:-3":24.186773244895647,"24:-2":24.08318915758459,"24:-1":24.020824298928627,"24:0":24,"24:1":24.020824298928627,"24:2":24.08318915758459,"24:3":24.186773244895647,"24:4":24.331050121192877,"24:5":24.515301344262525,"24:6":24.73863375370596,"24:7":25,"24:8":25.298221281347036,"24:9":25.632011235952593,"24:10":26,"24:11":26.40075756488817,"24:12":26.832815729997478,"24:13":27.294688127912362,"24:14":27.784887978899608,"24:15":28.30194339616981,"24:16":28.844410203711913,"24:17":29.410882339705484,"24:18":30,"24:19":30.610455730027933,"24:20":31.240998703626616,"24:21":31.89043743820395,"24:22":32.55764119219941,"24:23":33.24154027718932,"24:24":33.94112549695428}
      distance24: { "-24:-24": 34, "-24:-23": 33, "-24:-22": 33, "-24:-21": 32, "-24:-20": 31, "-24:-19": 31, "-24:-18": 30, "-24:-17": 29, "-24:-16": 29, "-24:-15": 28, "-24:-14": 28, "-24:-13": 27, "-24:-12": 27, "-24:-11": 26, "-24:-10": 26, "-24:-9": 26, "-24:-8": 25, "-24:-7": 25, "-24:-6": 25, "-24:-5": 25, "-24:-4": 24, "-24:-3": 24, "-24:-2": 24, "-24:-1": 24, "-24:0": 24, "-24:1": 24, "-24:2": 24, "-24:3": 24, "-24:4": 24, "-24:5": 25, "-24:6": 25, "-24:7": 25, "-24:8": 25, "-24:9": 26, "-24:10": 26, "-24:11": 26, "-24:12": 27, "-24:13": 27, "-24:14": 28, "-24:15": 28, "-24:16": 29, "-24:17": 29, "-24:18": 30, "-24:19": 31, "-24:20": 31, "-24:21": 32, "-24:22": 33, "-24:23": 33, "-24:24": 34, "-23:-24": 33, "-23:-23": 33, "-23:-22": 32, "-23:-21": 31, "-23:-20": 30, "-23:-19": 30, "-23:-18": 29, "-23:-17": 29, "-23:-16": 28, "-23:-15": 27, "-23:-14": 27, "-23:-13": 26, "-23:-12": 26, "-23:-11": 25, "-23:-10": 25, "-23:-9": 25, "-23:-8": 24, "-23:-7": 24, "-23:-6": 24, "-23:-5": 24, "-23:-4": 23, "-23:-3": 23, "-23:-2": 23, "-23:-1": 23, "-23:0": 23, "-23:1": 23, "-23:2": 23, "-23:3": 23, "-23:4": 23, "-23:5": 24, "-23:6": 24, "-23:7": 24, "-23:8": 24, "-23:9": 25, "-23:10": 25, "-23:11": 25, "-23:12": 26, "-23:13": 26, "-23:14": 27, "-23:15": 27, "-23:16": 28, "-23:17": 29, "-23:18": 29, "-23:19": 30, "-23:20": 30, "-23:21": 31, "-23:22": 32, "-23:23": 33, "-23:24": 33, "-22:-24": 33, "-22:-23": 32, "-22:-22": 31, "-22:-21": 30, "-22:-20": 30, "-22:-19": 29, "-22:-18": 28, "-22:-17": 28, "-22:-16": 27, "-22:-15": 27, "-22:-14": 26, "-22:-13": 26, "-22:-12": 25, "-22:-11": 25, "-22:-10": 24, "-22:-9": 24, "-22:-8": 23, "-22:-7": 23, "-22:-6": 23, "-22:-5": 23, "-22:-4": 22, "-22:-3": 22, "-22:-2": 22, "-22:-1": 22, "-22:0": 22, "-22:1": 22, "-22:2": 22, "-22:3": 22, "-22:4": 22, "-22:5": 23, "-22:6": 23, "-22:7": 23, "-22:8": 23, "-22:9": 24, "-22:10": 24, "-22:11": 25, "-22:12": 25, "-22:13": 26, "-22:14": 26, "-22:15": 27, "-22:16": 27, "-22:17": 28, "-22:18": 28, "-22:19": 29, "-22:20": 30, "-22:21": 30, "-22:22": 31, "-22:23": 32, "-22:24": 33, "-21:-24": 32, "-21:-23": 31, "-21:-22": 30, "-21:-21": 30, "-21:-20": 29, "-21:-19": 28, "-21:-18": 28, "-21:-17": 27, "-21:-16": 26, "-21:-15": 26, "-21:-14": 25, "-21:-13": 25, "-21:-12": 24, "-21:-11": 24, "-21:-10": 23, "-21:-9": 23, "-21:-8": 22, "-21:-7": 22, "-21:-6": 22, "-21:-5": 22, "-21:-4": 21, "-21:-3": 21, "-21:-2": 21, "-21:-1": 21, "-21:0": 21, "-21:1": 21, "-21:2": 21, "-21:3": 21, "-21:4": 21, "-21:5": 22, "-21:6": 22, "-21:7": 22, "-21:8": 22, "-21:9": 23, "-21:10": 23, "-21:11": 24, "-21:12": 24, "-21:13": 25, "-21:14": 25, "-21:15": 26, "-21:16": 26, "-21:17": 27, "-21:18": 28, "-21:19": 28, "-21:20": 29, "-21:21": 30, "-21:22": 30, "-21:23": 31, "-21:24": 32, "-20:-24": 31, "-20:-23": 30, "-20:-22": 30, "-20:-21": 29, "-20:-20": 28, "-20:-19": 28, "-20:-18": 27, "-20:-17": 26, "-20:-16": 26, "-20:-15": 25, "-20:-14": 24, "-20:-13": 24, "-20:-12": 23, "-20:-11": 23, "-20:-10": 22, "-20:-9": 22, "-20:-8": 22, "-20:-7": 21, "-20:-6": 21, "-20:-5": 21, "-20:-4": 20, "-20:-3": 20, "-20:-2": 20, "-20:-1": 20, "-20:0": 20, "-20:1": 20, "-20:2": 20, "-20:3": 20, "-20:4": 20, "-20:5": 21, "-20:6": 21, "-20:7": 21, "-20:8": 22, "-20:9": 22, "-20:10": 22, "-20:11": 23, "-20:12": 23, "-20:13": 24, "-20:14": 24, "-20:15": 25, "-20:16": 26, "-20:17": 26, "-20:18": 27, "-20:19": 28, "-20:20": 28, "-20:21": 29, "-20:22": 30, "-20:23": 30, "-20:24": 31, "-19:-24": 31, "-19:-23": 30, "-19:-22": 29, "-19:-21": 28, "-19:-20": 28, "-19:-19": 27, "-19:-18": 26, "-19:-17": 25, "-19:-16": 25, "-19:-15": 24, "-19:-14": 24, "-19:-13": 23, "-19:-12": 22, "-19:-11": 22, "-19:-10": 21, "-19:-9": 21, "-19:-8": 21, "-19:-7": 20, "-19:-6": 20, "-19:-5": 20, "-19:-4": 19, "-19:-3": 19, "-19:-2": 19, "-19:-1": 19, "-19:0": 19, "-19:1": 19, "-19:2": 19, "-19:3": 19, "-19:4": 19, "-19:5": 20, "-19:6": 20, "-19:7": 20, "-19:8": 21, "-19:9": 21, "-19:10": 21, "-19:11": 22, "-19:12": 22, "-19:13": 23, "-19:14": 24, "-19:15": 24, "-19:16": 25, "-19:17": 25, "-19:18": 26, "-19:19": 27, "-19:20": 28, "-19:21": 28, "-19:22": 29, "-19:23": 30, "-19:24": 31, "-18:-24": 30, "-18:-23": 29, "-18:-22": 28, "-18:-21": 28, "-18:-20": 27, "-18:-19": 26, "-18:-18": 25, "-18:-17": 25, "-18:-16": 24, "-18:-15": 23, "-18:-14": 23, "-18:-13": 22, "-18:-12": 22, "-18:-11": 21, "-18:-10": 21, "-18:-9": 20, "-18:-8": 20, "-18:-7": 19, "-18:-6": 19, "-18:-5": 19, "-18:-4": 18, "-18:-3": 18, "-18:-2": 18, "-18:-1": 18, "-18:0": 18, "-18:1": 18, "-18:2": 18, "-18:3": 18, "-18:4": 18, "-18:5": 19, "-18:6": 19, "-18:7": 19, "-18:8": 20, "-18:9": 20, "-18:10": 21, "-18:11": 21, "-18:12": 22, "-18:13": 22, "-18:14": 23, "-18:15": 23, "-18:16": 24, "-18:17": 25, "-18:18": 25, "-18:19": 26, "-18:20": 27, "-18:21": 28, "-18:22": 28, "-18:23": 29, "-18:24": 30, "-17:-24": 29, "-17:-23": 29, "-17:-22": 28, "-17:-21": 27, "-17:-20": 26, "-17:-19": 25, "-17:-18": 25, "-17:-17": 24, "-17:-16": 23, "-17:-15": 23, "-17:-14": 22, "-17:-13": 21, "-17:-12": 21, "-17:-11": 20, "-17:-10": 20, "-17:-9": 19, "-17:-8": 19, "-17:-7": 18, "-17:-6": 18, "-17:-5": 18, "-17:-4": 17, "-17:-3": 17, "-17:-2": 17, "-17:-1": 17, "-17:0": 17, "-17:1": 17, "-17:2": 17, "-17:3": 17, "-17:4": 17, "-17:5": 18, "-17:6": 18, "-17:7": 18, "-17:8": 19, "-17:9": 19, "-17:10": 20, "-17:11": 20, "-17:12": 21, "-17:13": 21, "-17:14": 22, "-17:15": 23, "-17:16": 23, "-17:17": 24, "-17:18": 25, "-17:19": 25, "-17:20": 26, "-17:21": 27, "-17:22": 28, "-17:23": 29, "-17:24": 29, "-16:-24": 29, "-16:-23": 28, "-16:-22": 27, "-16:-21": 26, "-16:-20": 26, "-16:-19": 25, "-16:-18": 24, "-16:-17": 23, "-16:-16": 23, "-16:-15": 22, "-16:-14": 21, "-16:-13": 21, "-16:-12": 20, "-16:-11": 19, "-16:-10": 19, "-16:-9": 18, "-16:-8": 18, "-16:-7": 17, "-16:-6": 17, "-16:-5": 17, "-16:-4": 16, "-16:-3": 16, "-16:-2": 16, "-16:-1": 16, "-16:0": 16, "-16:1": 16, "-16:2": 16, "-16:3": 16, "-16:4": 16, "-16:5": 17, "-16:6": 17, "-16:7": 17, "-16:8": 18, "-16:9": 18, "-16:10": 19, "-16:11": 19, "-16:12": 20, "-16:13": 21, "-16:14": 21, "-16:15": 22, "-16:16": 23, "-16:17": 23, "-16:18": 24, "-16:19": 25, "-16:20": 26, "-16:21": 26, "-16:22": 27, "-16:23": 28, "-16:24": 29, "-15:-24": 28, "-15:-23": 27, "-15:-22": 27, "-15:-21": 26, "-15:-20": 25, "-15:-19": 24, "-15:-18": 23, "-15:-17": 23, "-15:-16": 22, "-15:-15": 21, "-15:-14": 21, "-15:-13": 20, "-15:-12": 19, "-15:-11": 19, "-15:-10": 18, "-15:-9": 17, "-15:-8": 17, "-15:-7": 17, "-15:-6": 16, "-15:-5": 16, "-15:-4": 16, "-15:-3": 15, "-15:-2": 15, "-15:-1": 15, "-15:0": 15, "-15:1": 15, "-15:2": 15, "-15:3": 15, "-15:4": 16, "-15:5": 16, "-15:6": 16, "-15:7": 17, "-15:8": 17, "-15:9": 17, "-15:10": 18, "-15:11": 19, "-15:12": 19, "-15:13": 20, "-15:14": 21, "-15:15": 21, "-15:16": 22, "-15:17": 23, "-15:18": 23, "-15:19": 24, "-15:20": 25, "-15:21": 26, "-15:22": 27, "-15:23": 27, "-15:24": 28, "-14:-24": 28, "-14:-23": 27, "-14:-22": 26, "-14:-21": 25, "-14:-20": 24, "-14:-19": 24, "-14:-18": 23, "-14:-17": 22, "-14:-16": 21, "-14:-15": 21, "-14:-14": 20, "-14:-13": 19, "-14:-12": 18, "-14:-11": 18, "-14:-10": 17, "-14:-9": 17, "-14:-8": 16, "-14:-7": 16, "-14:-6": 15, "-14:-5": 15, "-14:-4": 15, "-14:-3": 14, "-14:-2": 14, "-14:-1": 14, "-14:0": 14, "-14:1": 14, "-14:2": 14, "-14:3": 14, "-14:4": 15, "-14:5": 15, "-14:6": 15, "-14:7": 16, "-14:8": 16, "-14:9": 17, "-14:10": 17, "-14:11": 18, "-14:12": 18, "-14:13": 19, "-14:14": 20, "-14:15": 21, "-14:16": 21, "-14:17": 22, "-14:18": 23, "-14:19": 24, "-14:20": 24, "-14:21": 25, "-14:22": 26, "-14:23": 27, "-14:24": 28, "-13:-24": 27, "-13:-23": 26, "-13:-22": 26, "-13:-21": 25, "-13:-20": 24, "-13:-19": 23, "-13:-18": 22, "-13:-17": 21, "-13:-16": 21, "-13:-15": 20, "-13:-14": 19, "-13:-13": 18, "-13:-12": 18, "-13:-11": 17, "-13:-10": 16, "-13:-9": 16, "-13:-8": 15, "-13:-7": 15, "-13:-6": 14, "-13:-5": 14, "-13:-4": 14, "-13:-3": 13, "-13:-2": 13, "-13:-1": 13, "-13:0": 13, "-13:1": 13, "-13:2": 13, "-13:3": 13, "-13:4": 14, "-13:5": 14, "-13:6": 14, "-13:7": 15, "-13:8": 15, "-13:9": 16, "-13:10": 16, "-13:11": 17, "-13:12": 18, "-13:13": 18, "-13:14": 19, "-13:15": 20, "-13:16": 21, "-13:17": 21, "-13:18": 22, "-13:19": 23, "-13:20": 24, "-13:21": 25, "-13:22": 26, "-13:23": 26, "-13:24": 27, "-12:-24": 27, "-12:-23": 26, "-12:-22": 25, "-12:-21": 24, "-12:-20": 23, "-12:-19": 22, "-12:-18": 22, "-12:-17": 21, "-12:-16": 20, "-12:-15": 19, "-12:-14": 18, "-12:-13": 18, "-12:-12": 17, "-12:-11": 16, "-12:-10": 16, "-12:-9": 15, "-12:-8": 14, "-12:-7": 14, "-12:-6": 13, "-12:-5": 13, "-12:-4": 13, "-12:-3": 12, "-12:-2": 12, "-12:-1": 12, "-12:0": 12, "-12:1": 12, "-12:2": 12, "-12:3": 12, "-12:4": 13, "-12:5": 13, "-12:6": 13, "-12:7": 14, "-12:8": 14, "-12:9": 15, "-12:10": 16, "-12:11": 16, "-12:12": 17, "-12:13": 18, "-12:14": 18, "-12:15": 19, "-12:16": 20, "-12:17": 21, "-12:18": 22, "-12:19": 22, "-12:20": 23, "-12:21": 24, "-12:22": 25, "-12:23": 26, "-12:24": 27, "-11:-24": 26, "-11:-23": 25, "-11:-22": 25, "-11:-21": 24, "-11:-20": 23, "-11:-19": 22, "-11:-18": 21, "-11:-17": 20, "-11:-16": 19, "-11:-15": 19, "-11:-14": 18, "-11:-13": 17, "-11:-12": 16, "-11:-11": 16, "-11:-10": 15, "-11:-9": 14, "-11:-8": 14, "-11:-7": 13, "-11:-6": 13, "-11:-5": 12, "-11:-4": 12, "-11:-3": 11, "-11:-2": 11, "-11:-1": 11, "-11:0": 11, "-11:1": 11, "-11:2": 11, "-11:3": 11, "-11:4": 12, "-11:5": 12, "-11:6": 13, "-11:7": 13, "-11:8": 14, "-11:9": 14, "-11:10": 15, "-11:11": 16, "-11:12": 16, "-11:13": 17, "-11:14": 18, "-11:15": 19, "-11:16": 19, "-11:17": 20, "-11:18": 21, "-11:19": 22, "-11:20": 23, "-11:21": 24, "-11:22": 25, "-11:23": 25, "-11:24": 26, "-10:-24": 26, "-10:-23": 25, "-10:-22": 24, "-10:-21": 23, "-10:-20": 22, "-10:-19": 21, "-10:-18": 21, "-10:-17": 20, "-10:-16": 19, "-10:-15": 18, "-10:-14": 17, "-10:-13": 16, "-10:-12": 16, "-10:-11": 15, "-10:-10": 14, "-10:-9": 13, "-10:-8": 13, "-10:-7": 12, "-10:-6": 12, "-10:-5": 11, "-10:-4": 11, "-10:-3": 10, "-10:-2": 10, "-10:-1": 10, "-10:0": 10, "-10:1": 10, "-10:2": 10, "-10:3": 10, "-10:4": 11, "-10:5": 11, "-10:6": 12, "-10:7": 12, "-10:8": 13, "-10:9": 13, "-10:10": 14, "-10:11": 15, "-10:12": 16, "-10:13": 16, "-10:14": 17, "-10:15": 18, "-10:16": 19, "-10:17": 20, "-10:18": 21, "-10:19": 21, "-10:20": 22, "-10:21": 23, "-10:22": 24, "-10:23": 25, "-10:24": 26, "-9:-24": 26, "-9:-23": 25, "-9:-22": 24, "-9:-21": 23, "-9:-20": 22, "-9:-19": 21, "-9:-18": 20, "-9:-17": 19, "-9:-16": 18, "-9:-15": 17, "-9:-14": 17, "-9:-13": 16, "-9:-12": 15, "-9:-11": 14, "-9:-10": 13, "-9:-9": 13, "-9:-8": 12, "-9:-7": 11, "-9:-6": 11, "-9:-5": 10, "-9:-4": 10, "-9:-3": 9, "-9:-2": 9, "-9:-1": 9, "-9:0": 9, "-9:1": 9, "-9:2": 9, "-9:3": 9, "-9:4": 10, "-9:5": 10, "-9:6": 11, "-9:7": 11, "-9:8": 12, "-9:9": 13, "-9:10": 13, "-9:11": 14, "-9:12": 15, "-9:13": 16, "-9:14": 17, "-9:15": 17, "-9:16": 18, "-9:17": 19, "-9:18": 20, "-9:19": 21, "-9:20": 22, "-9:21": 23, "-9:22": 24, "-9:23": 25, "-9:24": 26, "-8:-24": 25, "-8:-23": 24, "-8:-22": 23, "-8:-21": 22, "-8:-20": 22, "-8:-19": 21, "-8:-18": 20, "-8:-17": 19, "-8:-16": 18, "-8:-15": 17, "-8:-14": 16, "-8:-13": 15, "-8:-12": 14, "-8:-11": 14, "-8:-10": 13, "-8:-9": 12, "-8:-8": 11, "-8:-7": 11, "-8:-6": 10, "-8:-5": 9, "-8:-4": 9, "-8:-3": 9, "-8:-2": 8, "-8:-1": 8, "-8:0": 8, "-8:1": 8, "-8:2": 8, "-8:3": 9, "-8:4": 9, "-8:5": 9, "-8:6": 10, "-8:7": 11, "-8:8": 11, "-8:9": 12, "-8:10": 13, "-8:11": 14, "-8:12": 14, "-8:13": 15, "-8:14": 16, "-8:15": 17, "-8:16": 18, "-8:17": 19, "-8:18": 20, "-8:19": 21, "-8:20": 22, "-8:21": 22, "-8:22": 23, "-8:23": 24, "-8:24": 25, "-7:-24": 25, "-7:-23": 24, "-7:-22": 23, "-7:-21": 22, "-7:-20": 21, "-7:-19": 20, "-7:-18": 19, "-7:-17": 18, "-7:-16": 17, "-7:-15": 17, "-7:-14": 16, "-7:-13": 15, "-7:-12": 14, "-7:-11": 13, "-7:-10": 12, "-7:-9": 11, "-7:-8": 11, "-7:-7": 10, "-7:-6": 9, "-7:-5": 9, "-7:-4": 8, "-7:-3": 8, "-7:-2": 7, "-7:-1": 7, "-7:0": 7, "-7:1": 7, "-7:2": 7, "-7:3": 8, "-7:4": 8, "-7:5": 9, "-7:6": 9, "-7:7": 10, "-7:8": 11, "-7:9": 11, "-7:10": 12, "-7:11": 13, "-7:12": 14, "-7:13": 15, "-7:14": 16, "-7:15": 17, "-7:16": 17, "-7:17": 18, "-7:18": 19, "-7:19": 20, "-7:20": 21, "-7:21": 22, "-7:22": 23, "-7:23": 24, "-7:24": 25, "-6:-24": 25, "-6:-23": 24, "-6:-22": 23, "-6:-21": 22, "-6:-20": 21, "-6:-19": 20, "-6:-18": 19, "-6:-17": 18, "-6:-16": 17, "-6:-15": 16, "-6:-14": 15, "-6:-13": 14, "-6:-12": 13, "-6:-11": 13, "-6:-10": 12, "-6:-9": 11, "-6:-8": 10, "-6:-7": 9, "-6:-6": 8, "-6:-5": 8, "-6:-4": 7, "-6:-3": 7, "-6:-2": 6, "-6:-1": 6, "-6:0": 6, "-6:1": 6, "-6:2": 6, "-6:3": 7, "-6:4": 7, "-6:5": 8, "-6:6": 8, "-6:7": 9, "-6:8": 10, "-6:9": 11, "-6:10": 12, "-6:11": 13, "-6:12": 13, "-6:13": 14, "-6:14": 15, "-6:15": 16, "-6:16": 17, "-6:17": 18, "-6:18": 19, "-6:19": 20, "-6:20": 21, "-6:21": 22, "-6:22": 23, "-6:23": 24, "-6:24": 25, "-5:-24": 25, "-5:-23": 24, "-5:-22": 23, "-5:-21": 22, "-5:-20": 21, "-5:-19": 20, "-5:-18": 19, "-5:-17": 18, "-5:-16": 17, "-5:-15": 16, "-5:-14": 15, "-5:-13": 14, "-5:-12": 13, "-5:-11": 12, "-5:-10": 11, "-5:-9": 10, "-5:-8": 9, "-5:-7": 9, "-5:-6": 8, "-5:-5": 7, "-5:-4": 6, "-5:-3": 6, "-5:-2": 5, "-5:-1": 5, "-5:0": 5, "-5:1": 5, "-5:2": 5, "-5:3": 6, "-5:4": 6, "-5:5": 7, "-5:6": 8, "-5:7": 9, "-5:8": 9, "-5:9": 10, "-5:10": 11, "-5:11": 12, "-5:12": 13, "-5:13": 14, "-5:14": 15, "-5:15": 16, "-5:16": 17, "-5:17": 18, "-5:18": 19, "-5:19": 20, "-5:20": 21, "-5:21": 22, "-5:22": 23, "-5:23": 24, "-5:24": 25, "-4:-24": 24, "-4:-23": 23, "-4:-22": 22, "-4:-21": 21, "-4:-20": 20, "-4:-19": 19, "-4:-18": 18, "-4:-17": 17, "-4:-16": 16, "-4:-15": 16, "-4:-14": 15, "-4:-13": 14, "-4:-12": 13, "-4:-11": 12, "-4:-10": 11, "-4:-9": 10, "-4:-8": 9, "-4:-7": 8, "-4:-6": 7, "-4:-5": 6, "-4:-4": 6, "-4:-3": 5, "-4:-2": 4, "-4:-1": 4, "-4:0": 4, "-4:1": 4, "-4:2": 4, "-4:3": 5, "-4:4": 6, "-4:5": 6, "-4:6": 7, "-4:7": 8, "-4:8": 9, "-4:9": 10, "-4:10": 11, "-4:11": 12, "-4:12": 13, "-4:13": 14, "-4:14": 15, "-4:15": 16, "-4:16": 16, "-4:17": 17, "-4:18": 18, "-4:19": 19, "-4:20": 20, "-4:21": 21, "-4:22": 22, "-4:23": 23, "-4:24": 24, "-3:-24": 24, "-3:-23": 23, "-3:-22": 22, "-3:-21": 21, "-3:-20": 20, "-3:-19": 19, "-3:-18": 18, "-3:-17": 17, "-3:-16": 16, "-3:-15": 15, "-3:-14": 14, "-3:-13": 13, "-3:-12": 12, "-3:-11": 11, "-3:-10": 10, "-3:-9": 9, "-3:-8": 9, "-3:-7": 8, "-3:-6": 7, "-3:-5": 6, "-3:-4": 5, "-3:-3": 4, "-3:-2": 4, "-3:-1": 3, "-3:0": 3, "-3:1": 3, "-3:2": 4, "-3:3": 4, "-3:4": 5, "-3:5": 6, "-3:6": 7, "-3:7": 8, "-3:8": 9, "-3:9": 9, "-3:10": 10, "-3:11": 11, "-3:12": 12, "-3:13": 13, "-3:14": 14, "-3:15": 15, "-3:16": 16, "-3:17": 17, "-3:18": 18, "-3:19": 19, "-3:20": 20, "-3:21": 21, "-3:22": 22, "-3:23": 23, "-3:24": 24, "-2:-24": 24, "-2:-23": 23, "-2:-22": 22, "-2:-21": 21, "-2:-20": 20, "-2:-19": 19, "-2:-18": 18, "-2:-17": 17, "-2:-16": 16, "-2:-15": 15, "-2:-14": 14, "-2:-13": 13, "-2:-12": 12, "-2:-11": 11, "-2:-10": 10, "-2:-9": 9, "-2:-8": 8, "-2:-7": 7, "-2:-6": 6, "-2:-5": 5, "-2:-4": 4, "-2:-3": 4, "-2:-2": 3, "-2:-1": 2, "-2:0": 2, "-2:1": 2, "-2:2": 3, "-2:3": 4, "-2:4": 4, "-2:5": 5, "-2:6": 6, "-2:7": 7, "-2:8": 8, "-2:9": 9, "-2:10": 10, "-2:11": 11, "-2:12": 12, "-2:13": 13, "-2:14": 14, "-2:15": 15, "-2:16": 16, "-2:17": 17, "-2:18": 18, "-2:19": 19, "-2:20": 20, "-2:21": 21, "-2:22": 22, "-2:23": 23, "-2:24": 24, "-1:-24": 24, "-1:-23": 23, "-1:-22": 22, "-1:-21": 21, "-1:-20": 20, "-1:-19": 19, "-1:-18": 18, "-1:-17": 17, "-1:-16": 16, "-1:-15": 15, "-1:-14": 14, "-1:-13": 13, "-1:-12": 12, "-1:-11": 11, "-1:-10": 10, "-1:-9": 9, "-1:-8": 8, "-1:-7": 7, "-1:-6": 6, "-1:-5": 5, "-1:-4": 4, "-1:-3": 3, "-1:-2": 2, "-1:-1": 1, "-1:0": 1, "-1:1": 1, "-1:2": 2, "-1:3": 3, "-1:4": 4, "-1:5": 5, "-1:6": 6, "-1:7": 7, "-1:8": 8, "-1:9": 9, "-1:10": 10, "-1:11": 11, "-1:12": 12, "-1:13": 13, "-1:14": 14, "-1:15": 15, "-1:16": 16, "-1:17": 17, "-1:18": 18, "-1:19": 19, "-1:20": 20, "-1:21": 21, "-1:22": 22, "-1:23": 23, "-1:24": 24, "0:-24": 24, "0:-23": 23, "0:-22": 22, "0:-21": 21, "0:-20": 20, "0:-19": 19, "0:-18": 18, "0:-17": 17, "0:-16": 16, "0:-15": 15, "0:-14": 14, "0:-13": 13, "0:-12": 12, "0:-11": 11, "0:-10": 10, "0:-9": 9, "0:-8": 8, "0:-7": 7, "0:-6": 6, "0:-5": 5, "0:-4": 4, "0:-3": 3, "0:-2": 2, "0:-1": 1, "0:0": 0, "0:1": 1, "0:2": 2, "0:3": 3, "0:4": 4, "0:5": 5, "0:6": 6, "0:7": 7, "0:8": 8, "0:9": 9, "0:10": 10, "0:11": 11, "0:12": 12, "0:13": 13, "0:14": 14, "0:15": 15, "0:16": 16, "0:17": 17, "0:18": 18, "0:19": 19, "0:20": 20, "0:21": 21, "0:22": 22, "0:23": 23, "0:24": 24, "1:-24": 24, "1:-23": 23, "1:-22": 22, "1:-21": 21, "1:-20": 20, "1:-19": 19, "1:-18": 18, "1:-17": 17, "1:-16": 16, "1:-15": 15, "1:-14": 14, "1:-13": 13, "1:-12": 12, "1:-11": 11, "1:-10": 10, "1:-9": 9, "1:-8": 8, "1:-7": 7, "1:-6": 6, "1:-5": 5, "1:-4": 4, "1:-3": 3, "1:-2": 2, "1:-1": 1, "1:0": 1, "1:1": 1, "1:2": 2, "1:3": 3, "1:4": 4, "1:5": 5, "1:6": 6, "1:7": 7, "1:8": 8, "1:9": 9, "1:10": 10, "1:11": 11, "1:12": 12, "1:13": 13, "1:14": 14, "1:15": 15, "1:16": 16, "1:17": 17, "1:18": 18, "1:19": 19, "1:20": 20, "1:21": 21, "1:22": 22, "1:23": 23, "1:24": 24, "2:-24": 24, "2:-23": 23, "2:-22": 22, "2:-21": 21, "2:-20": 20, "2:-19": 19, "2:-18": 18, "2:-17": 17, "2:-16": 16, "2:-15": 15, "2:-14": 14, "2:-13": 13, "2:-12": 12, "2:-11": 11, "2:-10": 10, "2:-9": 9, "2:-8": 8, "2:-7": 7, "2:-6": 6, "2:-5": 5, "2:-4": 4, "2:-3": 4, "2:-2": 3, "2:-1": 2, "2:0": 2, "2:1": 2, "2:2": 3, "2:3": 4, "2:4": 4, "2:5": 5, "2:6": 6, "2:7": 7, "2:8": 8, "2:9": 9, "2:10": 10, "2:11": 11, "2:12": 12, "2:13": 13, "2:14": 14, "2:15": 15, "2:16": 16, "2:17": 17, "2:18": 18, "2:19": 19, "2:20": 20, "2:21": 21, "2:22": 22, "2:23": 23, "2:24": 24, "3:-24": 24, "3:-23": 23, "3:-22": 22, "3:-21": 21, "3:-20": 20, "3:-19": 19, "3:-18": 18, "3:-17": 17, "3:-16": 16, "3:-15": 15, "3:-14": 14, "3:-13": 13, "3:-12": 12, "3:-11": 11, "3:-10": 10, "3:-9": 9, "3:-8": 9, "3:-7": 8, "3:-6": 7, "3:-5": 6, "3:-4": 5, "3:-3": 4, "3:-2": 4, "3:-1": 3, "3:0": 3, "3:1": 3, "3:2": 4, "3:3": 4, "3:4": 5, "3:5": 6, "3:6": 7, "3:7": 8, "3:8": 9, "3:9": 9, "3:10": 10, "3:11": 11, "3:12": 12, "3:13": 13, "3:14": 14, "3:15": 15, "3:16": 16, "3:17": 17, "3:18": 18, "3:19": 19, "3:20": 20, "3:21": 21, "3:22": 22, "3:23": 23, "3:24": 24, "4:-24": 24, "4:-23": 23, "4:-22": 22, "4:-21": 21, "4:-20": 20, "4:-19": 19, "4:-18": 18, "4:-17": 17, "4:-16": 16, "4:-15": 16, "4:-14": 15, "4:-13": 14, "4:-12": 13, "4:-11": 12, "4:-10": 11, "4:-9": 10, "4:-8": 9, "4:-7": 8, "4:-6": 7, "4:-5": 6, "4:-4": 6, "4:-3": 5, "4:-2": 4, "4:-1": 4, "4:0": 4, "4:1": 4, "4:2": 4, "4:3": 5, "4:4": 6, "4:5": 6, "4:6": 7, "4:7": 8, "4:8": 9, "4:9": 10, "4:10": 11, "4:11": 12, "4:12": 13, "4:13": 14, "4:14": 15, "4:15": 16, "4:16": 16, "4:17": 17, "4:18": 18, "4:19": 19, "4:20": 20, "4:21": 21, "4:22": 22, "4:23": 23, "4:24": 24, "5:-24": 25, "5:-23": 24, "5:-22": 23, "5:-21": 22, "5:-20": 21, "5:-19": 20, "5:-18": 19, "5:-17": 18, "5:-16": 17, "5:-15": 16, "5:-14": 15, "5:-13": 14, "5:-12": 13, "5:-11": 12, "5:-10": 11, "5:-9": 10, "5:-8": 9, "5:-7": 9, "5:-6": 8, "5:-5": 7, "5:-4": 6, "5:-3": 6, "5:-2": 5, "5:-1": 5, "5:0": 5, "5:1": 5, "5:2": 5, "5:3": 6, "5:4": 6, "5:5": 7, "5:6": 8, "5:7": 9, "5:8": 9, "5:9": 10, "5:10": 11, "5:11": 12, "5:12": 13, "5:13": 14, "5:14": 15, "5:15": 16, "5:16": 17, "5:17": 18, "5:18": 19, "5:19": 20, "5:20": 21, "5:21": 22, "5:22": 23, "5:23": 24, "5:24": 25, "6:-24": 25, "6:-23": 24, "6:-22": 23, "6:-21": 22, "6:-20": 21, "6:-19": 20, "6:-18": 19, "6:-17": 18, "6:-16": 17, "6:-15": 16, "6:-14": 15, "6:-13": 14, "6:-12": 13, "6:-11": 13, "6:-10": 12, "6:-9": 11, "6:-8": 10, "6:-7": 9, "6:-6": 8, "6:-5": 8, "6:-4": 7, "6:-3": 7, "6:-2": 6, "6:-1": 6, "6:0": 6, "6:1": 6, "6:2": 6, "6:3": 7, "6:4": 7, "6:5": 8, "6:6": 8, "6:7": 9, "6:8": 10, "6:9": 11, "6:10": 12, "6:11": 13, "6:12": 13, "6:13": 14, "6:14": 15, "6:15": 16, "6:16": 17, "6:17": 18, "6:18": 19, "6:19": 20, "6:20": 21, "6:21": 22, "6:22": 23, "6:23": 24, "6:24": 25, "7:-24": 25, "7:-23": 24, "7:-22": 23, "7:-21": 22, "7:-20": 21, "7:-19": 20, "7:-18": 19, "7:-17": 18, "7:-16": 17, "7:-15": 17, "7:-14": 16, "7:-13": 15, "7:-12": 14, "7:-11": 13, "7:-10": 12, "7:-9": 11, "7:-8": 11, "7:-7": 10, "7:-6": 9, "7:-5": 9, "7:-4": 8, "7:-3": 8, "7:-2": 7, "7:-1": 7, "7:0": 7, "7:1": 7, "7:2": 7, "7:3": 8, "7:4": 8, "7:5": 9, "7:6": 9, "7:7": 10, "7:8": 11, "7:9": 11, "7:10": 12, "7:11": 13, "7:12": 14, "7:13": 15, "7:14": 16, "7:15": 17, "7:16": 17, "7:17": 18, "7:18": 19, "7:19": 20, "7:20": 21, "7:21": 22, "7:22": 23, "7:23": 24, "7:24": 25, "8:-24": 25, "8:-23": 24, "8:-22": 23, "8:-21": 22, "8:-20": 22, "8:-19": 21, "8:-18": 20, "8:-17": 19, "8:-16": 18, "8:-15": 17, "8:-14": 16, "8:-13": 15, "8:-12": 14, "8:-11": 14, "8:-10": 13, "8:-9": 12, "8:-8": 11, "8:-7": 11, "8:-6": 10, "8:-5": 9, "8:-4": 9, "8:-3": 9, "8:-2": 8, "8:-1": 8, "8:0": 8, "8:1": 8, "8:2": 8, "8:3": 9, "8:4": 9, "8:5": 9, "8:6": 10, "8:7": 11, "8:8": 11, "8:9": 12, "8:10": 13, "8:11": 14, "8:12": 14, "8:13": 15, "8:14": 16, "8:15": 17, "8:16": 18, "8:17": 19, "8:18": 20, "8:19": 21, "8:20": 22, "8:21": 22, "8:22": 23, "8:23": 24, "8:24": 25, "9:-24": 26, "9:-23": 25, "9:-22": 24, "9:-21": 23, "9:-20": 22, "9:-19": 21, "9:-18": 20, "9:-17": 19, "9:-16": 18, "9:-15": 17, "9:-14": 17, "9:-13": 16, "9:-12": 15, "9:-11": 14, "9:-10": 13, "9:-9": 13, "9:-8": 12, "9:-7": 11, "9:-6": 11, "9:-5": 10, "9:-4": 10, "9:-3": 9, "9:-2": 9, "9:-1": 9, "9:0": 9, "9:1": 9, "9:2": 9, "9:3": 9, "9:4": 10, "9:5": 10, "9:6": 11, "9:7": 11, "9:8": 12, "9:9": 13, "9:10": 13, "9:11": 14, "9:12": 15, "9:13": 16, "9:14": 17, "9:15": 17, "9:16": 18, "9:17": 19, "9:18": 20, "9:19": 21, "9:20": 22, "9:21": 23, "9:22": 24, "9:23": 25, "9:24": 26, "10:-24": 26, "10:-23": 25, "10:-22": 24, "10:-21": 23, "10:-20": 22, "10:-19": 21, "10:-18": 21, "10:-17": 20, "10:-16": 19, "10:-15": 18, "10:-14": 17, "10:-13": 16, "10:-12": 16, "10:-11": 15, "10:-10": 14, "10:-9": 13, "10:-8": 13, "10:-7": 12, "10:-6": 12, "10:-5": 11, "10:-4": 11, "10:-3": 10, "10:-2": 10, "10:-1": 10, "10:0": 10, "10:1": 10, "10:2": 10, "10:3": 10, "10:4": 11, "10:5": 11, "10:6": 12, "10:7": 12, "10:8": 13, "10:9": 13, "10:10": 14, "10:11": 15, "10:12": 16, "10:13": 16, "10:14": 17, "10:15": 18, "10:16": 19, "10:17": 20, "10:18": 21, "10:19": 21, "10:20": 22, "10:21": 23, "10:22": 24, "10:23": 25, "10:24": 26, "11:-24": 26, "11:-23": 25, "11:-22": 25, "11:-21": 24, "11:-20": 23, "11:-19": 22, "11:-18": 21, "11:-17": 20, "11:-16": 19, "11:-15": 19, "11:-14": 18, "11:-13": 17, "11:-12": 16, "11:-11": 16, "11:-10": 15, "11:-9": 14, "11:-8": 14, "11:-7": 13, "11:-6": 13, "11:-5": 12, "11:-4": 12, "11:-3": 11, "11:-2": 11, "11:-1": 11, "11:0": 11, "11:1": 11, "11:2": 11, "11:3": 11, "11:4": 12, "11:5": 12, "11:6": 13, "11:7": 13, "11:8": 14, "11:9": 14, "11:10": 15, "11:11": 16, "11:12": 16, "11:13": 17, "11:14": 18, "11:15": 19, "11:16": 19, "11:17": 20, "11:18": 21, "11:19": 22, "11:20": 23, "11:21": 24, "11:22": 25, "11:23": 25, "11:24": 26, "12:-24": 27, "12:-23": 26, "12:-22": 25, "12:-21": 24, "12:-20": 23, "12:-19": 22, "12:-18": 22, "12:-17": 21, "12:-16": 20, "12:-15": 19, "12:-14": 18, "12:-13": 18, "12:-12": 17, "12:-11": 16, "12:-10": 16, "12:-9": 15, "12:-8": 14, "12:-7": 14, "12:-6": 13, "12:-5": 13, "12:-4": 13, "12:-3": 12, "12:-2": 12, "12:-1": 12, "12:0": 12, "12:1": 12, "12:2": 12, "12:3": 12, "12:4": 13, "12:5": 13, "12:6": 13, "12:7": 14, "12:8": 14, "12:9": 15, "12:10": 16, "12:11": 16, "12:12": 17, "12:13": 18, "12:14": 18, "12:15": 19, "12:16": 20, "12:17": 21, "12:18": 22, "12:19": 22, "12:20": 23, "12:21": 24, "12:22": 25, "12:23": 26, "12:24": 27, "13:-24": 27, "13:-23": 26, "13:-22": 26, "13:-21": 25, "13:-20": 24, "13:-19": 23, "13:-18": 22, "13:-17": 21, "13:-16": 21, "13:-15": 20, "13:-14": 19, "13:-13": 18, "13:-12": 18, "13:-11": 17, "13:-10": 16, "13:-9": 16, "13:-8": 15, "13:-7": 15, "13:-6": 14, "13:-5": 14, "13:-4": 14, "13:-3": 13, "13:-2": 13, "13:-1": 13, "13:0": 13, "13:1": 13, "13:2": 13, "13:3": 13, "13:4": 14, "13:5": 14, "13:6": 14, "13:7": 15, "13:8": 15, "13:9": 16, "13:10": 16, "13:11": 17, "13:12": 18, "13:13": 18, "13:14": 19, "13:15": 20, "13:16": 21, "13:17": 21, "13:18": 22, "13:19": 23, "13:20": 24, "13:21": 25, "13:22": 26, "13:23": 26, "13:24": 27, "14:-24": 28, "14:-23": 27, "14:-22": 26, "14:-21": 25, "14:-20": 24, "14:-19": 24, "14:-18": 23, "14:-17": 22, "14:-16": 21, "14:-15": 21, "14:-14": 20, "14:-13": 19, "14:-12": 18, "14:-11": 18, "14:-10": 17, "14:-9": 17, "14:-8": 16, "14:-7": 16, "14:-6": 15, "14:-5": 15, "14:-4": 15, "14:-3": 14, "14:-2": 14, "14:-1": 14, "14:0": 14, "14:1": 14, "14:2": 14, "14:3": 14, "14:4": 15, "14:5": 15, "14:6": 15, "14:7": 16, "14:8": 16, "14:9": 17, "14:10": 17, "14:11": 18, "14:12": 18, "14:13": 19, "14:14": 20, "14:15": 21, "14:16": 21, "14:17": 22, "14:18": 23, "14:19": 24, "14:20": 24, "14:21": 25, "14:22": 26, "14:23": 27, "14:24": 28, "15:-24": 28, "15:-23": 27, "15:-22": 27, "15:-21": 26, "15:-20": 25, "15:-19": 24, "15:-18": 23, "15:-17": 23, "15:-16": 22, "15:-15": 21, "15:-14": 21, "15:-13": 20, "15:-12": 19, "15:-11": 19, "15:-10": 18, "15:-9": 17, "15:-8": 17, "15:-7": 17, "15:-6": 16, "15:-5": 16, "15:-4": 16, "15:-3": 15, "15:-2": 15, "15:-1": 15, "15:0": 15, "15:1": 15, "15:2": 15, "15:3": 15, "15:4": 16, "15:5": 16, "15:6": 16, "15:7": 17, "15:8": 17, "15:9": 17, "15:10": 18, "15:11": 19, "15:12": 19, "15:13": 20, "15:14": 21, "15:15": 21, "15:16": 22, "15:17": 23, "15:18": 23, "15:19": 24, "15:20": 25, "15:21": 26, "15:22": 27, "15:23": 27, "15:24": 28, "16:-24": 29, "16:-23": 28, "16:-22": 27, "16:-21": 26, "16:-20": 26, "16:-19": 25, "16:-18": 24, "16:-17": 23, "16:-16": 23, "16:-15": 22, "16:-14": 21, "16:-13": 21, "16:-12": 20, "16:-11": 19, "16:-10": 19, "16:-9": 18, "16:-8": 18, "16:-7": 17, "16:-6": 17, "16:-5": 17, "16:-4": 16, "16:-3": 16, "16:-2": 16, "16:-1": 16, "16:0": 16, "16:1": 16, "16:2": 16, "16:3": 16, "16:4": 16, "16:5": 17, "16:6": 17, "16:7": 17, "16:8": 18, "16:9": 18, "16:10": 19, "16:11": 19, "16:12": 20, "16:13": 21, "16:14": 21, "16:15": 22, "16:16": 23, "16:17": 23, "16:18": 24, "16:19": 25, "16:20": 26, "16:21": 26, "16:22": 27, "16:23": 28, "16:24": 29, "17:-24": 29, "17:-23": 29, "17:-22": 28, "17:-21": 27, "17:-20": 26, "17:-19": 25, "17:-18": 25, "17:-17": 24, "17:-16": 23, "17:-15": 23, "17:-14": 22, "17:-13": 21, "17:-12": 21, "17:-11": 20, "17:-10": 20, "17:-9": 19, "17:-8": 19, "17:-7": 18, "17:-6": 18, "17:-5": 18, "17:-4": 17, "17:-3": 17, "17:-2": 17, "17:-1": 17, "17:0": 17, "17:1": 17, "17:2": 17, "17:3": 17, "17:4": 17, "17:5": 18, "17:6": 18, "17:7": 18, "17:8": 19, "17:9": 19, "17:10": 20, "17:11": 20, "17:12": 21, "17:13": 21, "17:14": 22, "17:15": 23, "17:16": 23, "17:17": 24, "17:18": 25, "17:19": 25, "17:20": 26, "17:21": 27, "17:22": 28, "17:23": 29, "17:24": 29, "18:-24": 30, "18:-23": 29, "18:-22": 28, "18:-21": 28, "18:-20": 27, "18:-19": 26, "18:-18": 25, "18:-17": 25, "18:-16": 24, "18:-15": 23, "18:-14": 23, "18:-13": 22, "18:-12": 22, "18:-11": 21, "18:-10": 21, "18:-9": 20, "18:-8": 20, "18:-7": 19, "18:-6": 19, "18:-5": 19, "18:-4": 18, "18:-3": 18, "18:-2": 18, "18:-1": 18, "18:0": 18, "18:1": 18, "18:2": 18, "18:3": 18, "18:4": 18, "18:5": 19, "18:6": 19, "18:7": 19, "18:8": 20, "18:9": 20, "18:10": 21, "18:11": 21, "18:12": 22, "18:13": 22, "18:14": 23, "18:15": 23, "18:16": 24, "18:17": 25, "18:18": 25, "18:19": 26, "18:20": 27, "18:21": 28, "18:22": 28, "18:23": 29, "18:24": 30, "19:-24": 31, "19:-23": 30, "19:-22": 29, "19:-21": 28, "19:-20": 28, "19:-19": 27, "19:-18": 26, "19:-17": 25, "19:-16": 25, "19:-15": 24, "19:-14": 24, "19:-13": 23, "19:-12": 22, "19:-11": 22, "19:-10": 21, "19:-9": 21, "19:-8": 21, "19:-7": 20, "19:-6": 20, "19:-5": 20, "19:-4": 19, "19:-3": 19, "19:-2": 19, "19:-1": 19, "19:0": 19, "19:1": 19, "19:2": 19, "19:3": 19, "19:4": 19, "19:5": 20, "19:6": 20, "19:7": 20, "19:8": 21, "19:9": 21, "19:10": 21, "19:11": 22, "19:12": 22, "19:13": 23, "19:14": 24, "19:15": 24, "19:16": 25, "19:17": 25, "19:18": 26, "19:19": 27, "19:20": 28, "19:21": 28, "19:22": 29, "19:23": 30, "19:24": 31, "20:-24": 31, "20:-23": 30, "20:-22": 30, "20:-21": 29, "20:-20": 28, "20:-19": 28, "20:-18": 27, "20:-17": 26, "20:-16": 26, "20:-15": 25, "20:-14": 24, "20:-13": 24, "20:-12": 23, "20:-11": 23, "20:-10": 22, "20:-9": 22, "20:-8": 22, "20:-7": 21, "20:-6": 21, "20:-5": 21, "20:-4": 20, "20:-3": 20, "20:-2": 20, "20:-1": 20, "20:0": 20, "20:1": 20, "20:2": 20, "20:3": 20, "20:4": 20, "20:5": 21, "20:6": 21, "20:7": 21, "20:8": 22, "20:9": 22, "20:10": 22, "20:11": 23, "20:12": 23, "20:13": 24, "20:14": 24, "20:15": 25, "20:16": 26, "20:17": 26, "20:18": 27, "20:19": 28, "20:20": 28, "20:21": 29, "20:22": 30, "20:23": 30, "20:24": 31, "21:-24": 32, "21:-23": 31, "21:-22": 30, "21:-21": 30, "21:-20": 29, "21:-19": 28, "21:-18": 28, "21:-17": 27, "21:-16": 26, "21:-15": 26, "21:-14": 25, "21:-13": 25, "21:-12": 24, "21:-11": 24, "21:-10": 23, "21:-9": 23, "21:-8": 22, "21:-7": 22, "21:-6": 22, "21:-5": 22, "21:-4": 21, "21:-3": 21, "21:-2": 21, "21:-1": 21, "21:0": 21, "21:1": 21, "21:2": 21, "21:3": 21, "21:4": 21, "21:5": 22, "21:6": 22, "21:7": 22, "21:8": 22, "21:9": 23, "21:10": 23, "21:11": 24, "21:12": 24, "21:13": 25, "21:14": 25, "21:15": 26, "21:16": 26, "21:17": 27, "21:18": 28, "21:19": 28, "21:20": 29, "21:21": 30, "21:22": 30, "21:23": 31, "21:24": 32, "22:-24": 33, "22:-23": 32, "22:-22": 31, "22:-21": 30, "22:-20": 30, "22:-19": 29, "22:-18": 28, "22:-17": 28, "22:-16": 27, "22:-15": 27, "22:-14": 26, "22:-13": 26, "22:-12": 25, "22:-11": 25, "22:-10": 24, "22:-9": 24, "22:-8": 23, "22:-7": 23, "22:-6": 23, "22:-5": 23, "22:-4": 22, "22:-3": 22, "22:-2": 22, "22:-1": 22, "22:0": 22, "22:1": 22, "22:2": 22, "22:3": 22, "22:4": 22, "22:5": 23, "22:6": 23, "22:7": 23, "22:8": 23, "22:9": 24, "22:10": 24, "22:11": 25, "22:12": 25, "22:13": 26, "22:14": 26, "22:15": 27, "22:16": 27, "22:17": 28, "22:18": 28, "22:19": 29, "22:20": 30, "22:21": 30, "22:22": 31, "22:23": 32, "22:24": 33, "23:-24": 33, "23:-23": 33, "23:-22": 32, "23:-21": 31, "23:-20": 30, "23:-19": 30, "23:-18": 29, "23:-17": 29, "23:-16": 28, "23:-15": 27, "23:-14": 27, "23:-13": 26, "23:-12": 26, "23:-11": 25, "23:-10": 25, "23:-9": 25, "23:-8": 24, "23:-7": 24, "23:-6": 24, "23:-5": 24, "23:-4": 23, "23:-3": 23, "23:-2": 23, "23:-1": 23, "23:0": 23, "23:1": 23, "23:2": 23, "23:3": 23, "23:4": 23, "23:5": 24, "23:6": 24, "23:7": 24, "23:8": 24, "23:9": 25, "23:10": 25, "23:11": 25, "23:12": 26, "23:13": 26, "23:14": 27, "23:15": 27, "23:16": 28, "23:17": 29, "23:18": 29, "23:19": 30, "23:20": 30, "23:21": 31, "23:22": 32, "23:23": 33, "23:24": 33, "24:-24": 34, "24:-23": 33, "24:-22": 33, "24:-21": 32, "24:-20": 31, "24:-19": 31, "24:-18": 30, "24:-17": 29, "24:-16": 29, "24:-15": 28, "24:-14": 28, "24:-13": 27, "24:-12": 27, "24:-11": 26, "24:-10": 26, "24:-9": 26, "24:-8": 25, "24:-7": 25, "24:-6": 25, "24:-5": 25, "24:-4": 24, "24:-3": 24, "24:-2": 24, "24:-1": 24, "24:0": 24, "24:1": 24, "24:2": 24, "24:3": 24, "24:4": 24, "24:5": 25, "24:6": 25, "24:7": 25, "24:8": 25, "24:9": 26, "24:10": 26, "24:11": 26, "24:12": 27, "24:13": 27, "24:14": 28, "24:15": 28, "24:16": 29, "24:17": 29, "24:18": 30, "24:19": 31, "24:20": 31, "24:21": 32, "24:22": 33, "24:23": 33, "24:24": 34 }
    });


  });