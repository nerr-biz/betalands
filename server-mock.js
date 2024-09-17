//mocked: socketio (client & server), nodejs server, and mongodb
var socketOns = {}
var serversocketOns = {}
var socket = {
  on: function (name, fn) {
    socketOns[name] = fn;
  },
  emit: function (name, arg1, arg2, arg3, arg4, arg5) {
    if (name.indexOf("game:") > -1) {
      name = name.split("game:")[1];
    }
    if (name != "playerpos" && name != "inputchange")
      console.log("emit " + name, arg1, arg2, arg3, arg4, arg5);
    setTimeout(function () {
      serversocketOns[name](arg1, arg2, arg3, arg4, arg5);
    }, 0);
  }
};
var serversocket = {
  on: function (name, fn) {
    serversocketOns[name] = fn;
  },
  emit: function (name, data) {
    if (name != "playerpos" && name != "inputchange")
      console.log("serveremit " + name, data);
    setTimeout(function () {
      socketOns[name](data);
    }, 0);
  },
  damage: 0
};

function startServer(socket) {
  var players = { 'xxx': { gothit: 0, didhit: 0, damage: 0, deaths: [], kills: [], equipped: [] } };
  var usernames = []; // usernames which are currently connected to the chat
  var playerposuptodate = true;
  var playerhits = [];

  function myFind(dataArr, q) {
    var keys = Object.keys(q);
    var result = $.grep(dataArr, function (data) {
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if ($.type(q[k]) === 'object' && Object.keys(q[k])[0] == "$in") {
          if (q[k]["$in"].indexOf(data[k]) === -1) {
            return false;
          }
        }
        else if (q[k] != data[k]) { // equals
          return false;
        }
      }
      return true;
    });
    return result;
  }

  function myFindOr(dataArr, q) {
    var keys = Object.keys(q);
    var result = $.grep(dataArr, function (data) {
      var foundAny = false;
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if ($.type(q[k]) === 'object' && Object.keys(q[k])[0] == "$in") {
          if (q[k]["$in"].indexOf(data[k]) > -1) {
            foundAny = true;
          }
        }
        else if (q[k] == data[k]) {
          foundAny = true;
        }
      }
      return foundAny;
    });
    return result;
  }

  function myFindOne(dataArr, q) {
    var result = myFind(dataArr, q);
    if (result.length > 0)
      return result[0];
    return undefined;
  }

  // when the client emits 'adduser', this listens and executes
  socket.on('adduser', function (username, avatar, hash) {

    var username = String(username)
      .replace(/&(?!\w+;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    var origname = username;
    for (var i = 0; i < usernames.length; i++) {
      if (usernames[i].username == username) {
        username = username + new Date().getMilliseconds()
      }
    }

    var ud = myFindOne(UserData, { username: username });

    function startgame(ud) {

      var rooms = RoomData;
      var allrooms = [];
      rooms.forEach(function (rd) {
        if (rd.settings && rd.settings.title) {
          allrooms.push({ title: rd.settings.title, target: '', name: rd.room, username: rd.username });
        } else if (rd.room && rd.room.indexOf('|') > -1 && Object.keys(rd.items).length) {
          var delName = rd.room.split('|')[1].split('*')[0]
          var delType = rd.room.split('*')[1];
          var roomName = rd.room.split('|');
          roomName = rd.room.substr(0, rd.room.lastIndexOf("|"));
          roomName = roomName.replaceAll('|' + delName, '→[]');
          if (!delType) {
          } else {
            if (delType == 2) {
              delType = '↔';
            } else if (delType == 3) {
              delType = '↕';
            } else {
              delType = '(unknown)';
            }
          };
          //'(room in '+rd.room.split('|')[0]+')';
          if (!delType) {
            allrooms.push({ title: 'ROOM: ' + delName + ' in ' + roomName, target: '', name: rd.room, username: delName });
          } else if (rd.settings) {
            allrooms.push({ title: 'UNTITLED: ' + delName + ' ' + delType + ' in ' + roomName, target: '', name: rd.room, username: delName });
          } else {
            allrooms.push({ title: 'LOST LEVEL: ' + delName + ' ' + delType + ' was in ' + roomName, target: '', name: rd.room, username: delName });
          }
        } else if (!Object.keys(rd.items).length) {
          //console.log('untouched room?', rd)
        }
      });

      // we store the username in the socket session for this client
      socket.username = username;
      socket.avatar = avatar;
      socket.player = { pos: { x: 0, y: 450 }, vel: { x: 0, y: 0 } };
      //socket.equipped = players[username]['player']['equipped'];
      socket.equipped = [];
      var gun = undefined;
      if (hash) {
        socket.equipped = hash.equipped || [];
        gun = hash.gun;
      }

      var items = myFind(ItemData, { username: username });
      var sets = myFind(TileData, { username: username });

      iitems = {};
      items.forEach(function (i) {
        iitems[i['itemid']] = i;
      });

      isets = {};
      sets.forEach(function (i) {
        isets[i['setid']] = i;
      });

      //socket.emit('startgame', {user:{username:username, avatar:avatar, inventory:inventory, room:socket.room, damage:socket.damage, tiles:userTiles[username]}, allrooms:allrooms, items:items[socket.room], removeditems:removeditems[socket.room],users:usernames});
      socket.emit('startgame', { user: { username: username, avatar: avatar, inventory: ud.inventory, room: '', damage: socket.damage, equipped: socket.equipped, gun: gun, tiles: isets, items: iitems }, allrooms: allrooms, users: usernames });
    }

    if (ud) {
      startgame(ud);
    }
    else {
      var inventory = {
        'bit': { 1: 9, 2: 9, 3: 9, 4: 9, 5: 0, 6: 0, 7: 0, 8: 0, 9: 9 },
        'block': { 1: 1, 2: 1, 3: 1, 4: 1 },
        'sign': { 1: 1 },
        'lantern': { 1: 1 },
        'door': { 1: 1, 2: 1, 3: 1 },
        'bomb': { 1: 0 },
        'youtube': { 1: 1 }
      };
      if (origname != username) {
        inventory = {
          'bit': { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
          'block': { 1: 0, 2: 0, 3: 0, 4: 0 },
          'sign': { 1: 0 },
          'lantern': { 1: 1 },
          'door': { 1: 0 },
          'bomb': { 1: 0 },
          'youtube': { 1: 0 }
        };
      }
      ud = { username: username, inventory: inventory };
      startgame(ud);
    }

  });

  socket.on('additem', function (name, val, row, col, data) {
    var room = socket.room;
    addItem(socket.username, room, name, val, row, col, data, function () {
      //socket.emit('additem', { 'name': name, 'val': val, 'row': row, 'col': col, 'data': data });
    });
  });
  socket.on('removeitem', function (name, val, row, col) {
    var room = socket.room;
    removeItem(socket.username, room, name, val, row, col, function () {
      //socket.emit('removeitem', { 'name': name, 'val': val, 'row': row, 'col': col });
    });
  });
  socket.on('giveitem', function (username, name, val, row, col, data) {
    var user = myFindOne(UserData, { username: username });
    if (user) {
      addInventory(user, name, val, 1);
    }
  });
  socket.on('fetchitem', function (itemid) {
    var item = myFindOne(ItemData, { itemid: itemid });
    socket.emit('itemfetched', item);
  });
  socket.on('updateitem', function (name, val, row, col, data) {
    var room = socket.room;
    updateItem(room, name, row, col, data, function () {
      socket.emit('updateitem', { 'name': name, 'val': val, 'row': row, 'col': col, 'data': data });
    });
  });
  socket.on('playerhit', function (from, to, damage) {
    if (arguments.length == 2)
      damage = 1;

    var foundhit = false;
    if (from == to) {
      //hit from npc
      socket.damage = socket.damage + damage;
      players[from]['damage'] = players[from]['damage'] + damage;
    }
    else {
    }//end else
  });
  socket.on('playerkill', function (from, to) {
    socket.damage = 0;
    for (var i in players) {
      if (players.hasOwnProperty(i)) {
        p = players[i];
        if (i == to) {
          players[i]['deaths'].push(from);
          players[i]['damage'] = 0;
        }
        if (i == from) {
          players[i]['kills'].push(to);
        }
      }
    }
    console.log(from + ' KILL! ' + to);
  });
  socket.on('changelevel', function (level, target) {
    changeLevel(level, socket, target)
  });
  socket.on('editor', function (type, itemid) {

    var level = '';
    var target = '';

    if (type == 'background')
      level = 'EditBackground|' + socket.username;
    else if (type == 'item') {
      level = 'EditItem|' + socket.username;
      target = itemid;
    }

    changeLevel(level, socket, target, socket.room, true)
  });
  socket.on('playerupdate', function (player, room) {
    socket.player = player;
    socket.room = room;
    socket.emit('playerupdate', { username: socket.username, avatar: socket.avatar, player: socket.player, room: socket.room, damage: socket.damage });
  });
  socket.on('playerpos', function (player) {
    playerposuptodate = false;
    socket.player = player;
  });
  socket.on('inputchange', function (key, pressed, pos, vel) {
    if (socket.player) {
      socket.player.pos = pos;
      socket.player.vel = vel;
      socket.player.asleep = false;
      //socket.emit('inputchange', {'username':socket.username, 'k':key, 'p':pressed, 'xy':socket.player });
    }
  });
  socket.on('itemuse', function (name, posx, posy, itemdata) {
    console.log('itemuse ' + name + ' in ' + socket.room);
    if (name == 'makerbot')
      useMakerbot(socket.username, socket.room, posx, posy, socket, itemdata);
  });
  socket.on('smelt', function (val, num) {
    num = parseInt(num);
    console.log('smelt ' + num + ' ' + val);
    var user = myFindOne(UserData, { username: socket.username });
    if (!user)
      return;
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
    if (check.length == 0)
      return;
    var allow = true;
    for (var i = 0; i < check.length; i++) {
      if (!checkInventory(user, 'bit', check[i], num))
        allow = false;
    }
    if (!allow)
      return;
    for (var i = 0; i < check.length; i++) {
      addInventory(user, 'bit', check[i], -(num));
    }
    if (val != 'pixel') {
      if (addInventory(user, 'bit', val, num * (check.length))) {
        socket.emit('gotitem', { 'name': 'bit', 'val': val, 'num': num * (check.length) });
        console.log('SMELT DELT! bit');
      }
    }
    else {
      if (addInventory(user, 'pixel', 1, num)) {
        socket.emit('gotitem', { 'name': 'pixel', 'val': 1, 'num': num });
        console.log('SMELT DELT! pixel');
      }
    }
  });
  socket.on('updatetile', function (set, data) {
    var tile = myFindOne(TileData, { setid: set });
    if (tile) {
      tile.image = data;
    }
  });
  socket.on('addtileset', function (setid) {
    var rd = myFindOne(TileData, { setid: setid });
    if (!rd) {
      rd = { setid: setid, username: socket.username, settings: {} }
      TileData.push(rd);

      level = 'EditBackground|' + socket.username;
      changeLevel(level, socket, setid, socket.room, true)
    }
  });
  socket.on('updatetiles', function (data) {
    var ud = myFindOne(UserData, { username: socket.username });
    if (ud) {
      ud.tiles = data;
    }
  });
  socket.on('customitem', function (itemid, data) {
    var rd = myFindOne(ItemData, { itemid: itemid });
    if (!rd) {
      rd = new { itemid: itemid, username: socket.username, settings: data };
      ItemData.push(rd);
      changeLevel('EditItem|' + socket.username, socket, itemid, socket.room, true);
    }
    else {
      rd.settings = data;
    }
  });
  socket.on('custombody', function (itemid, data) {
    var settings = data;
    settings['width'] = 32;
    settings['height'] = 32;
    settings['equip'] = 'body';
    var rd = myFindOne(ItemData, { itemid: itemid });
    if (!rd) {
      rd = { itemid: itemid, username: socket.username, settings: settings };
      ItemData.push(rd);
      changeLevel('EditItem|' + socket.username, socket, itemid, socket.room, true);
    }
    else {
      rd.settings = settings;
    }
  });
  socket.on('customhead', function (itemid, data) {
    var settings = data;
    settings['width'] = 16;
    settings['height'] = 16;
    settings['equip'] = 'head';
    var rd = myFindOne(ItemData, { itemid: itemid });
    if (!rd) {
      rd = { itemid: itemid, username: socket.username, settings: settings };
      ItemData.push(rd);
      changeLevel('EditItem|' + socket.username, socket, itemid, socket.room, true);
    }
    else {
      rd.settings = settings;
    }
  });
  socket.on('customitemimage', function (itemid, image) {
    var item = myFindOne(ItemData, { itemid: itemid });
    if (item) {
      item.image = image;
    }
  });
  socket.on('customitemdelete', function (itemid) {
    console.log('DELETING ITEM ' + itemid);
    var id = myFindOne(ItemData, { itemid: itemid });

    if (!id || id.username != socket.username) {
      if (itemid)
        console.log('CAN NOT DELETE ITEM' + itemid);
      else
        console.log('CAN NOT DELETE ITEM');
      return;
    }
    var rooms = RoomData;
    for (var i = 0; i < rooms.length; i++) {
      var itemdeleted = false;
      var rd = rooms[i];
      var customitems = rd.items.custom || {};
      Object.keys(customitems).forEach(function (r) {
        Object.keys(customitems[r]).forEach(function (c) {
          if (customitems[r][c] && customitems[r][c]['val'] && customitems[r][c]['val'] == itemid) {
            delete rd.items.custom[r][c];
            itemdeleted = true;
          }
        });
      });
      //rd.markModified('items');
      if (itemdeleted)
        console.log('ITEM DELTED ' + itemid + ' FROM ROOM ' + rd.room);
    }
    //id.remove();
    changeLevel(DefaultRoom || 'LevelTest', socket, (DefaultRoom || 'LevelTest') + '-' + socket.username)
  });

  socket.on('createlevel', function (leveltype, parent, settings) {
    var roomid = '_' + Math.random().toString(36).substr(2, 9);
    var rd = { room: roomid, username: socket.username, parent: parent, leveltype: leveltype, settings: settings, items: {}, removeditems: {} };
    RoomData.push(rd);
    changeLevel(roomid, socket, '');
  });

  function changeLevel(level, socket, target, setLastlevel, inEditor) {
    var lastlevel = socket.room;
    var rd = myFindOne(RoomData, { room: level });
    if (!rd) {
      if (!inEditor) {
        rd = { room: level, items: {}, removeditems: {} };
        RoomData.push(rd);
      }
    }
    var tileUsernames = [];
    var tileSets = [];
    var tileMapsInfo = {};
    var itemIds = [];
    var itemsInfo = {};
    //loop over block items in this level and fetch the corresponding user's tile data
    if (inEditor)
      rd = { items: {}, removeditems: {} }
    if (!rd.items)
      rd.items = {}

    tileUsernames.push(socket.username);
    var blocks = rd.items.block || {};
    Object.keys(blocks).forEach(function (r) {
      Object.keys(blocks[r]).forEach(function (c) {
        if (blocks[r][c]['data'] && blocks[r][c]['data']['user'] && blocks[r][c]['data']['set']) {
          if (blocks[r][c]['data']['set'] == 1 ||
            blocks[r][c]['data']['set'] == 2 ||
            blocks[r][c]['data']['set'] == 3) {
            tileSets.push('_set' + blocks[r][c]['data']['set'] + '-' + blocks[r][c]['data']['user'])
            //tileUsernames.push(blocks[r][c]['data']['user']);
          }
          else {
            tileSets.push(blocks[r][c]['data']['set']);
          }
        }
      });
    });
    var customitems = rd.items.custom || {};
    Object.keys(customitems).forEach(function (r) {
      Object.keys(customitems[r]).forEach(function (c) {
        if (customitems[r][c] && customitems[r][c]['val']) {
          itemIds.push(customitems[r][c]['val']);
        }
      });
    });

    if (level == 'LevelSammerhall') {
      var sammeritems = myFind(ItemData, { username: '_sammer7' })
      for (var i = 0; i < sammeritems.length; i++)
        itemIds.push(sammeritems[i].itemid);
    }

    var sets = myFind(TileData, { setid: { $in: tileSets } });
    if (sets) {
      for (var i = 0; i < sets.length; i++) {
        tileMapsInfo[sets[i].setid] = sets[i]; //set.data
      }
      var items = myFindOr(ItemData, { itemid: { $in: itemIds }, username: socket.username });
      if (items)
        for (var i = 0; i < items.length; i++) {
          if (items[i].settings)
            itemsInfo[items[i].itemid] = items[i]; //set.data
        }
      socket.room = level;
      socket.emit('loadlevel', { 'level': level, 'lastlevel': setLastlevel, 'target': target, 'owner': rd.username, 'leveltype': rd.leveltype, 'settings': rd.settings, 'items': rd.items, 'removeditems': rd.removeditems, 'tileMapsInfo': tileMapsInfo, 'itemsInfo': itemsInfo });
    }
  }

  function inLevel(room, leveltype) {
    if (!room)
      return false;
    if (leveltype > 0)
      return true;
    var split = room.split("|");
    var levelOwner = split[split.length - 1];
    if (room.indexOf('*') !== -1) {
      split = levelOwner.split('*');
      levelOwner = split[0];
      return levelOwner;
    }
    return false;
  }

  //add item to world, removing from inventory
  function addItem(username, room, name, val, row, col, data, callback) {
    var user = myFindOne(UserData, { username: username });

    var rd = myFindOne(RoomData, { room: room });

    if (rd) {
      if (name != 'block' && name != 'block2' && name != 'custom' && name != 'gift2013' && !inLevel(room, rd.leveltype)) {
        if (!user || !addInventory(user, name, val, -1))
          return;
      }

      var key = 'items.' + name + '.' + row + '.' + col;
      var items = {};
      //items[key] = {'val':val, 'data':data};
      if (name == 'block' || name == 'block2') {
        for (i = 0; i < 2; i++) {
          for (j = 0; j < 2; j++) {
            var v = checkBlock(rd.items['bit'], row + 8 * i, col + 8 * j);
            if (v) {
              //updateItem(room, 'bit', row+8*i, col+8*j, {'val':v.val, 'layer':'2'});
              //key = 'items.bit.'+(row+8*i)+'.'+(col+8*j)+'.data';
              var data_val = {};
              if (v.val)
                data_val = { 'val': v.val, 'layer': '2' };
              if (v.data && v.data.val)
                data_val = { 'val': v.data.val, 'layer': '2' };
              createNestedObject(rd.items, ['bit', row + 8 * i, col + 8 * j, 'data'], data_val);
              //key = 'items.bit.'+(row+8*i)+'.'+(col+8*j)+'.val';
              var val_val = "";
              if (!v.val && v.data && v.data.val)
                val_val = v.data.val
              else
                val_val = v.val;
              createNestedObject(rd.items, ['bit', row + 8 * i, col + 8 * j, 'val'], val);
            }
          }
        }
      } else {
        createNestedObject(rd.items, [name, row, col], { 'val': val, 'data': data });
      }
      /*rd.update({ $set: items }, {upsert: true}, function(err){
        if(!err)
          callback();
      });
      */
      callback();
    }
  }

  function updateItem(room, name, row, col, data, callback) {
    update = {}
    update['items.' + name + '.' + row + '.' + col + '.data'] = data;
    var rd = myFindOne(RoomData, { room: room });
    if (rd && checkNested(rd.items, name, row, col, data)) {
      createNestedObject(rd.items, [name, row, col, 'data'], data);
      callback();
    }
  }

  //remove item from world, adding to inventory
  function removeItem(username, room, name, val, row, col, callback) {
    var user = myFindOne(UserData, { username: username });

    var rd = myFindOne(RoomData, { room: room });
    if (rd) {
      if (name != 'block' && name != 'block2' && name != 'custom' && name != 'gift2013' && !inLevel(room, rd.leveltype)) {
        if (!user || !addInventory(user, name, val, 1))
          return;
      }

      var key = name + '.' + row + '.' + col;
      var items = {};
      if (name == 'block2' || name == 'custom') {
        if (rd.items[name][row][col]) {
          delete rd.items[name][row][col];
          callback();
        }
      }
      else {
        createNestedObject(rd.removeditems, [key], val);
        createNestedObject(rd.items, [key], {});
        callback();
      }
    }
  }
  function removeItems(room, items, callback) {
    var rd = myFindOne(RoomData, { room: room });

    items.forEach(function (i) {
      createNestedObject(rd.removeditems, [i.name, i.row, i.col], i.val);
      if (checkNested(rd.items, i.name, i.row, i.col)) {
        delete rd.items[i.name][i.row][i.col];
      }
    });
    callback();
  }

  function addInventory(user, name, val, num) {
    var invcount = checkNested(user.inventory, name, val);
    if (typeof invcount === 'undefined')
      invcount = 0;
    if (name == 'pixel' || ((num > 0 && invcount + num <= 99) || (num < 0 && invcount > 0))) {
      createNestedObject(user.inventory, [name, val], invcount + num);
      return true;
    }
    return false;
  }
  function checkInventory(user, name, val) {
    var invcount = checkNested(user.inventory, name, val);
    if (typeof invcount === 'undefined')
      invcount = 0;
    return invcount;
  }

  function checkBlock(blx, row, col) {
    if (typeof blx === 'undefined')
      return false;
    if (typeof blx[row] === 'undefined')
      return 0;
    if (typeof blx[row][col] === 'undefined')
      return 0;
    return blx[row][col];
  }

  function useMakerbot(username, room, posx, posy, socket, itemdata) {
    var room = myFindOne(RoomData, { room: room });
    if (rd) {
      posx += 8;
      posy += 8;
      match = false;

      var results = [
        /*
        ['block', [
          [1,[
            [1,1,1],
            [1,1,1],
            [1,1,1]
          ],3],
          [2,[
            [3,3,3],
            [3,3,3],
            [3,3,3]
          ],3],
          [3,[
            [3,3,3],
            [1,1,1],
            [1,1,1]
          ],3],
          [4,[
            [4,4,4],
            [4,4,4],
            [4,4,4]
          ],3]
          ]
        ],
        */
        ['bit', [
          [5, [
            [2, 3, 4],
            [2, 3, 4],
            [2, 3, 4]
          ], 9],
          [6, [
            [7, 8, 9],
            [7, 8, 9],
            [7, 8, 9]
          ], 9],
          [7, [
            [1, 3, 4],
            [1, 3, 4],
            [1, 3, 4]
          ], 6],
          [8, [
            [2, 1, 4],
            [2, 1, 4],
            [2, 1, 4]
          ], 6],
          [9, [
            [2, 3, 1],
            [2, 3, 1],
            [2, 3, 1]
          ], 6]
        ]
        ],
        ['sign', [
          [1, [
            [1, 1, 1],
            [1, 1, 1],
            [3, 1, 3]
          ], 1]
        ]
        ],
        ['door', [
          [1, [
            [2, 2, 1],
            [2, 2, 1],
            [2, 2, 1]
          ], 1],
          [2, [
            [3, 3, 1],
            [3, 3, 1],
            [3, 3, 1]
          ], 1],
          [3, [
            [4, 4, 1],
            [4, 4, 1],
            [4, 4, 1]
          ], 1]
        ]
        ],
        ['lantern', [
          [1, [
            [1, 3, 1],
            [3, 9, 3],
            [3, 3, 3]
          ], 1]
        ]
        ],
        ['gun', [
          [1, [
            [1, 1, 1],
            [6, 6, 6],
            [1, 1, 6]
          ], 1]
        ]
        ],
        ['youtube', [
          [1, [
            [6, 6, 6],
            [6, 6, 6],
            [2, 2, 2]
          ], 1]
        ]
        ],
        ['sword', [
          [1, [
            [1, 5, 1],
            [1, 5, 1],
            [7, 2, 7]
          ], 1]
        ]
        ],
        ['flag', [
          [1, [
            [9, 1, 1],
            [9, 9, 1],
            [9, 1, 1]
          ], 2]
        ]
        ],
        ['goomba', [
          [1, [
            [1, 2, 1],
            [5, 2, 5],
            [2, 2, 2]
          ], 1]
        ]
        ],
        ['switchblock', [
          [1, [
            [1, 6, 1],
            [1, 6, 1],
            [1, 5, 1]
          ], 2]
        ]
        ]
      ];

      foundmatch:
      for (r = 0; r < results.length; r++) {
        matchname = results[r][0];
        for (s = 0; s < results[r][1].length; s++) {
          match = false;
          matchval = results[r][1][s][0]
          matchslots = results[r][1][s][1];
          matchnum = results[r][1][s][2];
          breakout:
          for (i = 0; i < 3; i++) {
            for (j = 0; j < 3; j++) {
              var v = checkBlock(rd.items['bit'], posx + 8 * i, posy + 8 * j);
              if (itemdata.itemx == posx + 8 * i && itemdata.itemy == posy + 8 * j)
                v = { val: itemdata.itemval };
              if (v.val != matchslots[j][i]) {
                match = false;
                break breakout;
              }
            }
            match = true;
          }
          if (match)
            break foundmatch;
        }
      }
      if (match) {
        var user = myFindOne(UserData, { username: username });
        if (user) {
          if (!addInventory(user, matchname, matchval, matchnum)) {
            console.log('MATCH FULL!');
            return false;
          }
          //clear blocks
          var items = [];
          for (i = 0; i < 3; i++) {
            for (j = 0; j < 3; j++) {
              var v = checkBlock(rd.items['bit'], posx + 8 * i, posy + 8 * j);
              if (v && typeof v !== 'undefined') {
                var valtouse = v.val;
                if (!v.val && v.data)
                  valtouse = v.data.val;

                var itm = { 'name': 'bit', 'val': valtouse, 'row': posx + 8 * i, 'col': posy + 8 * j };
                items.push(itm);
                socket.emit('removeitem', itm);
              }
            }
          }
          removeItems(room, items, function () {
            console.log('MATCHED! ' + matchname);
            socket.emit('gotitem', { 'name': matchname, 'val': matchval, 'num': matchnum });
          });
          return true;
        }
        return true;
      }
      else
        console.log('NO MATCH!');
      return false;

    }
  }

  function printf() {
    var num = arguments.length;
    var oStr = arguments[0];
    for (var i = 1; i < num; i++) {
      var pattern = "\\{" + (i - 1) + "\\}";
      var re = new RegExp(pattern, "g");
      oStr = oStr.replace(re, arguments[i]);
    }
    return oStr;
  }

  function checkNested(obj /*, level1, level2, ... levelN*/) {
    var args = Array.prototype.slice.call(arguments),
      obj = args.shift();

    for (var i = 0; i < args.length; i++) {
      if (!obj.hasOwnProperty(args[i])) {
        return undefined;
      }
      obj = obj[args[i]];
    }
    return obj;
  }
  // Function: createNestedObject( base, names[, value] )
  //   base: the object on which to create the hierarchy
  //   names: an array of strings contaning the names of the objects
  //   value (optional): if given, will be the last object in the hierarchy
  // Returns: the last object in the hierarchy
  var createNestedObject = function (base, names, value) {
    // If a value is given, remove the last name and keep it for later:
    var lastName = arguments.length === 3 ? names.pop() : false;

    // Walk the hierarchy, creating new objects where needed.
    // If the lastName was removed, then the last object is not set yet:
    for (var i = 0; i < names.length; i++) {
      base = base[names[i]] = base[names[i]] || {};
    }

    // If a value was given, set it to the last name:
    if (lastName !== false) base = base[lastName] = value;

    // Return the last object in the hierarchy:
    return base;
  };

  function dumpObject(obj, maxDepth) {
    var dump = function (obj, name, depth, tab) {
      if (depth > maxDepth) {
        return name + ' - Max depth\n';
      }
      if (typeof (obj) == 'object') {
        var child = null;
        var output = tab + name + '\n';
        tab += '\t';
        for (var item in obj) {
          child = obj[item];
          if (typeof (child) == 'object') {
            output += dump(child, item, depth + 1, tab);
          } else {
            output += tab + item + ': ' + child + '\n';
          }
        }
      }
      return output;
    }
    return dump(obj, '', 0, '');
  }

}
