enchant();

// var DEBUG = true;
var DEBUG = false;
if(location.hash == "#debug") DEBUG = true;

var config = {
  // ゲーム画面のサイズ
  "game_width" : 500,
  "game_height" : 450,
  // ゲームのfps上限
  "game_fps" : 30,
  //プレイヤーの画像を変更するインターバル(ms)
  "player_imgs_change_interval" : 140,
  // プレイヤーの位置(x座標)
  "player_x" : 70,
  // プレイヤーの初期位置(y座標)
  "player_y" : 120,
  // プレイヤーに作用する重力加速度(y方向)
  "player_y_gravity" : 850,
  // プレイヤーがジャンプした時に作用する力積(速度)(y方向)
  "player_y_jump_velocity" : -290,
  // プレイヤーの回転(下を向く時)の基準となる速度上限値(この値を超過すると下を向く)
  "player_rotation_limit_velocity" : 500,
  // プレイヤーの衝突判定用の矩形サイズ
  "player_collision_ray_width" : 30,
  "player_collision_ray_height" : 26,
  // プレイヤーの衝突判定用の矩形とプレイヤー画像の相対位置
  "player_collision_ray_x" : 3,
  "player_collision_ray_y" : 5,
  // 地面の高さ(画面下方からの距離)(落下判定用)
  "ground_height" : 100,
  // 背景の流れる速さ
  "background_scroll_speed" : 12,
  // 地面、パイプの流れる速さ
  "ground_scroll_speed" : 120,
  // パイプ同士の距離(左右)
  "pipe_interval" : 185,
  // パイプ同士の距離(上下)
  "pipe_margin" : 90, //90
  // 最初のパイプの位置(ゲーム画面幅 + 指定したx座標)
  "first_pipe_x" : 300
};

if(location.hash.match("#fps")) config.game_fps = parseInt(location.hash.replace(/#fps/, ""), 10);

window.onload = function() {
  var game = new Game(config.game_width, config.game_height);
  game.fps = config.game_fps;
  var assets = ["player-1.png", "player-2.png", "background.png", "ground.png", "pipe-middle.png", "pipe-down.png", "pipe-up.png", "splash.png", "ceiling.png", "scoreboard.png", "replay.png", "font_big_0.png", "font_big_1.png", "font_big_2.png", "font_big_3.png", "font_big_4.png", "font_big_5.png", "font_big_6.png", "font_big_7.png", "font_big_8.png", "font_big_9.png", "font_small_0.png", "font_small_1.png", "font_small_2.png", "font_small_3.png", "font_small_4.png", "font_small_5.png", "font_small_6.png", "font_small_7.png", "font_small_8.png", "font_small_9.png", "medal_bronze.png", "medal_silver.png", "medal_gold.png", "medal_platinum.png"];
  var assets_dir = "./assets/";
  assets.forEach(function(v, i) {
    game.preload(assets_dir + v);
  });
  game.best_score = parseInt(loadData().best_score, 10) || 0;
  console.log(game);
  game.onload = function() {
    assets.forEach(function(v, i) {
      game.assets[v] = game.assets[assets_dir + v];
    });
    gameFlow(game);
  };
  game.start();
};

var debug = null;

function gameFlow (game) {
  var background_image_width = 552;
  var background_image_height = 497;
  var ground_image_width = 552;
  var ground_image_height = 102;
  // main scene
  var stage_scene = new Scene();
  // debug
  debug = new DebugWindow(game);
  debug.add("entity", "entity all: <#all> pipe: <#pipe>");
  debug.line.entity.values.all = 0;
  debug.line.entity.values.pipe = 0;
  debug.add("score", "score: <#score> best: <#best>");
  debug.line.score.values.score = 0;
  debug.line.score.values.best = game.best_score;
  stage_scene.addEventListener("touchstart", function() {
    game_start();
  });
  debug.add("fps", "fps: <#fps>");
  var fps_log = [];
  stage_scene.addEventListener("enterframe", function() {
    fps_log.push(game.actualFps);
    if(game.frame % game.fps === 0) {
      var fps_sum = 0;
      for(var i = 0; i <= fps_log.length - 1; i++) {
        fps_sum += fps_log[i];
      }
      debug.line.fps.values.fps = fps_sum / fps_log.length;
      fps_log = [];
    }
  });
  // stage
  var stage = new Group();
  var background = new FlowEndless(game, config.background_scroll_speed, "background.png", background_image_width, background_image_height, -(background_image_height - game.height + ground_image_height));
  var player = new PlayerSprite(game);
  player.y_gravity = 0;
  var pipe_object = new FlowPipe(game, config.ground_scroll_speed, config.pipe_margin, player);
  var ground = new FlowEndless(game, config.ground_scroll_speed, "ground.png", ground_image_width, ground_image_height, game.height - ground_image_height);
  var ceiling = new FlowEndless(game, config.ground_scroll_speed, "ceiling.png", 640, 16, 0, player.collision_ray);
  var score_number = new NumberDisplay(game, ["font_big_0.png", "font_big_1.png", "font_big_2.png", "font_big_3.png", "font_big_4.png", "font_big_5.png", "font_big_6.png", "font_big_7.png", "font_big_8.png", "font_big_9.png"], 24, 36, 5);
  score_number.x_center = Math.round(game.width / 2);
  score_number.y = 50;
  score_number.opacity = 0;
  // console.log(score_number);
  // start
  var start = new Group();
  start_splash = new Sprite(188, 170);
  start_splash.image = game.assets["splash.png"];
  start_splash.x = Math.round(game.width / 2 - start_splash.width / 2);
  start_splash.y = Math.round((game.height - config.ground_height) / 2 - start_splash.height / 2) + 10;
  start_splash.opacity = 0;
  start_splash.tl.fadeIn(0.6 * game.fps, enchant.Easing.LINEAR);
  // result
  var result = new ResultWindow(game);
  result.x = Math.round(game.width / 2 - result.scoreboard.width / 2);
  result.y = Math.round((game.height - config.ground_height) / 2 - result.scoreboard.height / 2) + 45;
  result.set_hide();
  // add to group
  // stage
  stage.addChild(background);
  stage.addChild(player);
  stage.addChild(pipe_object);
  stage.addChild(ground);
  stage.addChild(ceiling);
  stage.addChild(score_number);
  //start
  start.addChild(start_splash);
  // add to scene
  stage_scene.addChild(stage);
  stage_scene.addChild(start);
  stage_scene.addChild(result);
  if(DEBUG) stage_scene.addChild(debug);
  // add to game
  game.pushScene(stage_scene);
  // action functions
  var game_finished = false;
  var game_stop = function() {
    if(!game_finished) {
      game_finished = true;
      player.y_velocity = 0;
      player.imgs_animation = false;
      stop_scrolling();
      score_number.tl.fadeOut(0.1 * game.fps, enchant.Easing.LINEAR).then(function() {
        stage.removeChild(this);
      });
      if(score_number.value > game.best_score) {
        game.best_score = score_number.value;
      }
      saveData("best_score", game.best_score);
      debug.line.score.values.best = game.best_score;
      result.best_score = game.best_score;
      result.show();
      result.onreplay = function() {
        // console.log("replay");
        result.hide().then(function() {
          game.popScene();
          gameFlow(game);
        });
      };
    }
  };
  var game_started = false;
  var game_start = function() {
    if(!game_started) {
      start_splash.tl.fadeOut(0.2 * game.fps, enchant.Easing.LINEAR).then(function() {
        stage_scene.removeChild(start);
      });
      score_number.tl.fadeIn(0.1 * game.fps, enchant.Easing.LINEAR);
      player.y_gravity = config.player_y_gravity;
      pipe_object.add_object(-(pipe_object.x) + game.width + config.first_pipe_x, 0.3);
      game_started = true;
    }
    if(!game_finished) {
      player.jump();
    }
  };
  var stop_scrolling = function() {
    background.stop();
    ground.stop();
    pipe_object.stop();
    ceiling.stop();
  };
  // events
  player.onfall = function() {
    game_stop();
  };
  pipe_object.onappearedobject = function(s) {
    var pipe_margin_position = Math.random();
    var x = s.x + config.pipe_interval;
    // console.log(x, pipe_margin_position);
    this.add_object(x, pipe_margin_position);
  };
  var score = 0;
  pipe_object.ongetscore = function() {
    // console.log("get score");
    score += 1;
    score_number.value = score;
    result.score = score;
    debug.line.score.values.score = score;
  };
  pipe_object.onintersectobject = function() {
    game_stop();
  };
  ceiling.onintersectobject = function() {
    game_stop();
  };
}

var ResultWindow = Class.create(Group, {
  initialize: function(game) {
    this.game = game;
    Group.call(this);
    // scoreboard
    this.scoreboard = new Sprite(236, 280);
    this.scoreboard.image = this.game.assets["scoreboard.png"];
    // replay_button
    this.replay_button = new Sprite(114, 70);
    this.replay_button.image = this.game.assets["replay.png"];
    this.replay_button.x = Math.round(this.scoreboard.width / 2 - this.replay_button.width / 2);
    this.replay_button.y = 200;
    // score_number
    this.score_number = new NumberDisplay(this.game, ["font_small_0.png", "font_small_1.png", "font_small_2.png", "font_small_3.png", "font_small_4.png", "font_small_5.png", "font_small_6.png", "font_small_7.png", "font_small_8.png", "font_small_9.png"], 12, 14, 2);
    this.score_number.x_right = 210;
    this.score_number.y = 107;
    // best_score_number
    this.best_score_number = new NumberDisplay(this.game, ["font_small_0.png", "font_small_1.png", "font_small_2.png", "font_small_3.png", "font_small_4.png", "font_small_5.png", "font_small_6.png", "font_small_7.png", "font_small_8.png", "font_small_9.png"], 12, 14, 2);
    this.best_score_number.x_right = 210;
    this.best_score_number.y = 148;
    // medal
    this.medal = new Sprite(44, 44);
    this.medal.x = 32;
    this.medal.y = 114;
    // add to group
    this.addChild(this.scoreboard);
    this.addChild(this.replay_button);
    this.addChild(this.score_number);
    this.addChild(this.best_score_number);
    this.addChild(this.medal);
    this.score = 0;
    this.best_score = 0;
  },
  set_hide: function() {
    this.opacity = 0;
    this.replay_button.opacity = 0;
    this.medal.opacity = 0;
    this.onenterframe();
  },
  show: function() {
    var animation_frame = 0.7 * this.game.fps;
    var animation_easing = enchant.Easing.EXPO_EASEOUT;
    this.score_number.value = this.score;
    this.best_score_number.value = this.best_score;
    // console.log(this.score_number.value);
    this.y += 30;
    this.tl.fadeIn(animation_frame, animation_easing);
    this.tl.and();
    this.tl.moveTo(this.x, this.y - 30, animation_frame, animation_easing);
    this.replay_button.y += 30;
    this.replay_button.tl.delay(0.5 * this.game.fps).fadeIn(animation_frame, animation_easing);
    this.replay_button.tl.and();
    this.replay_button.tl.moveTo(this.replay_button.x, this.replay_button.y - 30, animation_frame, animation_easing).then(function() {
      var image = null;
      if(this.parentNode.score >= 100) {
        image = this.parentNode.game.assets["medal_platinum.png"]
      } else if(this.parentNode.score >= 50) {
        image = this.parentNode.game.assets["medal_gold.png"];
      } else if(this.parentNode.score >= 20) {
        image = this.parentNode.game.assets["medal_silver.png"];
      } else if(this.parentNode.score >= 10) {
        image = this.parentNode.game.assets["medal_bronze.png"];
      }
      if(image) {
        // console.log(image);
        var medal_animation_frame = 0.6 * this.parentNode.game.fps;
        var medal_animation_easing = enchant.Easing.CUBIC_EASEIN;
        this.parentNode.medal.image = image;
        this.parentNode.medal.scale(2, 2);
        this.parentNode.medal.tl.fadeIn(medal_animation_frame, medal_animation_easing);
        this.parentNode.medal.tl.and();
        this.parentNode.medal.tl.scaleTo(1, 1, medal_animation_frame, medal_animation_easing);
      }
      this.addEventListener("touchstart", function() {
        this.parentNode.onreplay();
      });
    });
  },
  hide: function() {
    var animation_frame = 1.0 * this.game.fps;
    var animation_easing = enchant.Easing.CUBIC_EASEOUT;
    this.tl.fadeOut(animation_frame, animation_easing);
    this.tl.and();
    this.tl.moveTo(this.x, this.y - 30, animation_frame, animation_easing);
    this.medal.tl.fadeOut(animation_frame, animation_easing);
    return this.replay_button.tl.fadeOut(animation_frame, animation_easing);
  },
  onenterframe: function() {
    this.scoreboard.opacity = this.opacity;
    this.score_number.opacity = this.opacity;
    this.best_score_number.opacity = this.opacity;
  },
  onreplay: function() {}
});

var NumberDisplay = Class.create(Group, {
  initialize: function(game, number_assets, width, height, margin) {
    this.game = game;
    this.number_assets = number_assets;
    this.s_width = width;
    this.s_height = height;
    this.x_center = null;
    this.x_left = null;
    this.x_right = null;
    this.margin = margin;
    Group.call(this);
    this.value = 0;
  },
  onenterframe: function() {
    var diff = this.childNodes.length - this.value.toString(10).length;
    // puts(diff);
    if(diff > 0) {
      // console.log(diff);
      for(var i = 0; i <= diff - 1; i++) {
        this.removeChild(this.childNodes[this.value.toString(10).length + i]);
      }
    } else if(diff < 0) {
      // console.log(diff);
      for(var j = 0; j <= -diff - 1; j++) {
        var s = new NumberSprite(this.game, this.number_assets, this.s_width, this.s_height);
        // console.log(s);
        this.addChild(s);
      }
    }
    if(diff !== 0) {
      this.childNodes.forEach(function(s, i) {
        s.x = (s.width + this.margin) * (this.childNodes.length - i - 1);
      }, this);
      this.width = this.childNodes.length * this.s_width + (this.childNodes.length - 1) * this.margin;
      if(this.x_center) {
        this.x = this.x_center - Math.round(this.width / 2);
      } else if(this.x_right) {
        this.x = this.x_right - this.width;
      } else if(this.x_left) {
        this.x = this.x_left;
      }
    }
    this.value.toString(10).split("").map(function(v) { return parseInt(v, 10); }).reverse().forEach(function(v, i) {
      this.childNodes[i].value = v;
    }, this);
    this.childNodes.forEach(function(s, i) {
      s.opacity = this.opacity;
    }, this);
  }//,
  // fadeIn: function(frame, easing) {
  //   this.childNodes.forEach(function(s, i) {
  //     s.tl.fadeIn(frame, easing);
  //   }, this);
  // },
  // fadeOut: function(frame, easing) {
  //   this.childNodes.forEach(function(s, i) {
  //     s.tl.fadeOut(frame, easing);
  //   }, this);
  // }
});

var NumberSprite = Class.create(Sprite, {
  initialize: function(game, number_assets, width, height) {
    this.game = game;
    Sprite.call(this, width, height);
    if(number_assets.length != 10) throw new Error("not all number assets are received");
    this.number_assets = number_assets;
    this.value = 0;
    this.y = 0;
  },
  onenterframe: function() {
    if(this.value >= 0 && this.value <= 9) {
      this.image = this.game.assets[this.number_assets[this.value]];
    } else {
      throw new Error("value is not in the range(0..9)");
    }
  }
});

var DebugWindow = Class.create(Group, {
  initialize: function(game) {
    this.game = game;
    Group.call(this);
    this.width = this.game.width;
    this.height = this.game.height;
    this.line = {};
    this.line_height = 3;
    this.add("title", "Debug Mode");
  },
  add: function(name, templete) {
    this.line[name] = new DebugLabel(templete);
    this.line[name].y = this.line_height;
    this.line[name].x = 3;
    this.line_height += 13;
    this.addChild(this.line[name]);
  }
});

var DebugLabel = Class.create(Label, {
  initialize: function(templete) {
    Label.call(this);
    this.font = "10px";
    this.templete = templete;
    this.values_simbol = (templete.match(/<#[^>]+>/g) || []).map(function(v) { return v.replace(/<#/, "").replace(/>/, ""); });
    this.values = {};
    this.values_simbol.forEach(function(v, i) {
      this.values[v] = undefined;
    }, this);
    // console.log(this);
  },
  onenterframe: function() {
    var text = this.templete;
    this.values_simbol.forEach(function(v, i) {
      text = text.replace("<#" + v + ">", this.values[v]);
    }, this);
    this.text = text;
  }
});

var PlayerSprite = Class.create(Group, {
  initialize: function(game) {
    this.game = game;
    Group.call(this);
    this.width = 35;
    this.height = 35;
    this.default_x = config.player_x;
    this.default_y = config.player_y;
    this.x = this.default_x;
    this.y = this.default_y;
    this.y_jump_velocity = config.player_y_jump_velocity;
    this.y_velocity = 0;
    this.y_gravity = config.player_y_gravity;
    this.rotation_limit_velocity = config.player_rotation_limit_velocity;
    this.y_ground = this.game.height - config.ground_height;
    this.imgs = ["player-1.png", "player-2.png"];
    this.imgs_n = 0;
    this.imgs_animation = true;
    this.imgs_change_frame = Math.ceil(this.game.fps * (config.player_imgs_change_interval / 1000));
    this.img_ray = new Sprite(this.width, this.height);
    this.img_ray.image = this.game.assets[this.imgs[0]];
    this.collision_ray = new Sprite(config.player_collision_ray_width, config.player_collision_ray_height);
    this.collision_ray.x = config.player_collision_ray_x;
    this.collision_ray.y = config.player_collision_ray_y;
    if(DEBUG) this.collision_ray.backgroundColor = "#f00";
    this.addChild(this.collision_ray);
    this.addChild(this.img_ray);
    this.onfall = function() {};
    this.fallen = false;
    debug.line.entity.values.all += 1;
  },
  onenterframe: function() {
    this.y_velocity += this.y_gravity * (1 / this.game.fps);
    this.y += this.y_velocity * (1 / this.game.fps);
    var rotation_value = 0;
    if(this.y_gravity === 0) {
      rotation_value = this.img_ray.rotation + 45;
    } else if(this.y_velocity > this.rotation_limit_velocity) {
      rotation_value = 135;
    } else {
      rotation_value = 135 * ((this.y_velocity + (-this.y_jump_velocity)) / (this.rotation_limit_velocity + (-this.y_jump_velocity)));
    }
    this.img_ray.rotation = rotation_value - 45;
    if(this.y > this.y_ground - this.height) {
      this.y_velocity = 0;
      this.y_gravity = 0;
      // this.img_ray.rotation = 90;
      this.y = this.y_ground - this.height;
      this.fallen = true;
      this.onfall();
    }
    this.moveTo(this.x, this.y);
    if(this.imgs_animation && this.game.frame % this.imgs_change_frame === 0) {
      this.imgs_n += 1;
      if(this.imgs_n > this.imgs.length - 1) { this.imgs_n = 0; }
      this.img_ray.image = this.game.assets[this.imgs[this.imgs_n]];
    }
  },
  jump: function() {
    this.y_velocity = this.y_jump_velocity;
  },
  test: function() {
    console.log(this);
  }
});

var Flow = Class.create(Group, {
  initialize: function(game, speed) {
    this.game = game;
    Group.call(this);
    this.default_speed = speed;
    this.speed = this.default_speed;
    this.flow_sprites = [];
  },
  onenterframe: function() {
    // this.x = -(this.speed) * (this.game.frame / this.game.fps);
    this.x -= this.speed * (1 / this.game.fps);
    // if(this.game.frame % this.game.fps === 0) {
    //   console.log(this.x);
    // }
  },
  add: function(s) {
    if(!s._onenterframe) s._onenterframe = function() {};
    s.onenterframe = function() {
      if(this.parentNode.x + this.x + this.width < 0) {
        debug.line.entity.values.all -= 1;
        if(this.parentNode instanceof FlowPipe) debug.line.entity.values.pipe -= 1;
        this.appeared = false;
        this.parentNode.ondisappearedobject(this);
        this.parentNode.flow_sprites.splice(this.parentNode.flow_sprites.indexOf(this), 1);
        this.parentNode.removeChild(this);
      } else if(!this.appeared && this.parentNode.x - this.parentNode.game.width + this.x < 0) {
        this.appeared = true;
        this.parentNode.onappearedobject(this);
      } else if(this.appeared && this.parentNode && this.parentNode.collision_to) {
        var child_node = [this];
        if(this.childNodes) {
          child_node = this.childNodes;
        }
        child_node.forEach(function(si, i) {
          if(this.parentNode.collision_to.intersect(si)) {
            // console.log("intersect");
            this.parentNode.onintersectobject(this);
          }
        }, this);
      }
      this._onenterframe();
    };
    // console.log(s);
    this.flow_sprites.push(s);
    this.addChild(s);
    debug.line.entity.values.all += 1;
    if(this instanceof FlowPipe) debug.line.entity.values.pipe += 1;
  },
  // intersect: function(a, b) {
  //   c0 = a._offsetX + a.width > b._offsetX;
  //   c1 = a._offsetY < b._offsetY + b.height;
  //   c2 = a._offsetX < b._offsetX + b.width;
  //   c3 = a._offsetY + a.height > b._offsetY;
  //   // console.log(a._offsetX + a.width, b._offsetX, a._offsetX, b._offsetX + b.width);
  //   // console.log(a._offsetY, b._offsetY + b.height, a._offsetY + a.height, b._offsetY);
  //   // console.log(c0 && c2, c1 && c3);
  //   // console.log(c0 && c1 && c2 && c3, c0, c1, c2, c3);
  //   // puts([c0 && c1 && c2 && c3, c0, c1, c2, c3]);
  //   return c0 && c1 && c2 && c3;
  // },
  stop: function() {
    this.speed = 0;
  },
  resume: function() {
    this.speed = this.default_speed;
  },
  ondisappearedobject: function() {},
  onappearedobject: function() {},
  onintersectobject: function() { console.log("intersect(function not defined)"); }
});

var FlowEndless = Class.create(Flow, {
  initialize: function(game, speed, assets, width, height, y, collision_to) {
    this.game = game;
    Flow.call(this, this.game, speed);
    this.assets = assets;
    this.s_y = y;
    this.s_width = width;
    this.s_height = height;
    this.collision_to = collision_to;
    for(var i = 0; i <= 1; i++) {
      var s = this.create_sprite();
      s.x = i * s.width;
      this.add(s);
    }
  },
  create_sprite: function() {
    var s = new Sprite(this.s_width, this.s_height);
    s.y = this.s_y;
    if(this.assets) s.image = this.game.assets[this.assets];
    return s;
  },
  ondisappearedobject: function(rs) {
    var s = this.create_sprite();
    s.x = rs.x + rs.width * 2;
    this.add(s);
  }
});

var FlowPipe = Class.create(Flow, {
  initialize: function(game, speed, pipe_margin, player) {
    this.game = game;
    Flow.call(this, this.game, speed);
    this.pipe_margin = pipe_margin;
    this.pipe_cap_height = 26;
    this.pipe_middle_height = 1;
    this.pipe_width = 52;
    this.y_ground = this.game.height - config.ground_height;
    this.player = player;
    this.collision_to = player.collision_ray;
  },
  add_object: function(x, pipe_margin_position) { // pipe_margin_position : parcentage from top (0.0 , 1.0)
    var s = this.create_sprite(pipe_margin_position);
    s.x = x;
    s.width = this.pipe_width;
    s.add_score = false;
    s._onenterframe = function() {
      if(!this.add_score && this.parentNode.x + this.x + this.parentNode.pipe_width < this.parentNode.player.x) {
        this.parentNode.ongetscore();
        this.add_score = true;
      }
    };
    this.add(s);
  },
  create_sprite: function(pipe_margin_position) {
    // console.log("create pipe");
    var available_pipe_area = this.y_ground;
    var pipe_extra_length = 5;
    var not_available_pipe_length = this.pipe_cap_height * 2 + pipe_extra_length * 2 + this.pipe_margin;
    var available_pipe_length = available_pipe_area - not_available_pipe_length;
    var top_pipe_length = Math.round(not_available_pipe_length / 2) + Math.round(available_pipe_length * pipe_margin_position) - Math.round(this.pipe_margin / 2);
    var bottom_pipe_length = Math.round(not_available_pipe_length / 2) + Math.round(available_pipe_length * (1 - pipe_margin_position)) - Math.round(this.pipe_margin / 2);
    var top_pipe_middle_sprite = new Sprite(this.pipe_width, top_pipe_length - this.pipe_cap_height);
    var bottom_pipe_middle_sprite = new Sprite(this.pipe_width, bottom_pipe_length - this.pipe_cap_height);
    var top_pipe_down_sprite = new Sprite(this.pipe_width, this.pipe_cap_height);
    var bottom_pipe_up_sprite = new Sprite(this.pipe_width, this.pipe_cap_height);
    top_pipe_middle_sprite.image = this.game.assets["pipe-middle.png"];
    bottom_pipe_middle_sprite.image = this.game.assets["pipe-middle.png"];
    top_pipe_down_sprite.image = this.game.assets["pipe-down.png"];
    bottom_pipe_up_sprite.image = this.game.assets["pipe-up.png"];
    top_pipe_middle_sprite.x = 0;
    top_pipe_middle_sprite.y = 0;
    top_pipe_down_sprite.x = 0;
    top_pipe_down_sprite.y = top_pipe_length - this.pipe_cap_height;
    bottom_pipe_middle_sprite.x = 0;
    bottom_pipe_middle_sprite.y = available_pipe_area - bottom_pipe_length + this.pipe_cap_height;
    bottom_pipe_up_sprite.x = 0;
    bottom_pipe_up_sprite.y = available_pipe_area - bottom_pipe_length;
    var s = new Group();
    s.addChild(top_pipe_middle_sprite);
    s.addChild(top_pipe_down_sprite);
    s.addChild(bottom_pipe_middle_sprite);
    s.addChild(bottom_pipe_up_sprite);
    s.x = 0;
    s.y = 0;
    return s;
  },
  ongetscore: function() {}
});

var puts_log = [];

function puts (obj) {
  if(puts_log.indexOf(obj) == -1) {
    puts_log.push(obj);
    console.log(obj);
  }
}

function saveData (name, value) {
  var expire_date = new Date();
  expire_date.setTime(expire_date.getTime() + 365*24*60*60*1000);
  document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; expires=" + expire_date.toGMTString();
}

function loadData () {
  var data = {};
  document.cookie.split(";").forEach(function(v, i) {
    var match = v.match(/(.+)=(.+)/);
    if(match) data[match[1]] = match[2];
  });
  return data;
}

var getClassOf = Function.prototype.call.bind(Object.prototype.toString);
