enchant();

window.onload = function() {
  var game = new Game(400, 500);
  game.fps = 60;
  game.preload("player.png", "background.png", "ground.png");
  console.log(game);
  game.onload = function() {
    game.pushScene(createStage(game));
  };
  game.start();
};

function createStage (game) {
  var stage = new Group();
  var background = new Flow(game, "background.png", 552, 497, -100, 10);
  // var object_map = new Group();
  var player = new PlayerSprite(game);
  var ground = new Flow(game, "ground.png", 552, 103, 397, 100);
  player.onfall = function() {
    background.stop();
    ground.stop();
  };
  stage.addChild(background);
  // stage.addChild(object_map);
  stage.addChild(player);
  stage.addChild(ground);
  var stage_scene = new Scene();
  stage_scene.addChild(stage);
  stage_scene.addEventListener("touchstart", function() {
    if(!player.fallen) {
      player.jump();
    }
  });
  return stage_scene;
}

var PlayerSprite = Class.create(Sprite, {
  initialize: function(game) {
    this.width = 35;
    this.height = 35;
    this.game = game;
    Sprite.call(this, this.width, this.height);
    this.default_x = Math.round(this.game.width / 2 - this.width / 2) - 8;
    this.default_y = 50;
    this.x = this.default_x;
    this.y = this.default_y;
    this.y_jump_velocity = -380;
    this.y_velocity = 0;
    this.y_gravity = 800;
    this.rotation_base_velocity = 700;
    this.y_ground = this.game.height - 102;
    this.image = this.game.assets["player.png"];
    this.onfall = function() {};
    this.fallen = false;
  },
  onenterframe: function() {
    this.y_velocity += this.y_gravity * (1 / this.game.fps);
    this.y += this.y_velocity * (1 / this.game.fps);
    var rotation_value = 0;
    if(this.y_velocity <= 0) {
      if(this.y_gravity === 0) {
        rotation_value = 135;
      } else {
        rotation_value = 0;
      }
    } else if(this.y_velocity > this.rotation_base_velocity) {
      rotation_value = 135;
    } else if(this.y_velocity > 0) {
      rotation_value = 135 * (this.y_velocity / this.rotation_base_velocity);
    }
    this.rotation = rotation_value - 45;
    if(this.y > this.y_ground - this.height) {
      this.y_velocity = 0;
      this.y_gravity = 0;
      this.rotation = 90;
      this.y = this.y_ground - this.height;
      this.fallen = true;
      this.onfall();
    }
    this.moveTo(this.x, this.y);
  },
  jump: function() {
    this.y_velocity = this.y_jump_velocity;
  },
  test: function() {
    console.log(this);
  }
});

var FlowSprite = Class.create(Sprite, {
  initialize: function(game, assets, width, height) {
    this.assets = assets;
    this.game = game;
    this.width = width;
    this.height = height;
    Sprite.call(this, this.width, this.height);
    this.x = 0;
    this.y = 0;
    this.image = this.game.assets[assets];
  }
});

var Flow = Class.create(Group, {
  initialize: function(game, assets, width, height, y, speed) {
    this.game = game;
    Group.call(this);
    this.default_speed = speed;
    this.speed = speed;
    this.assets = assets;
    this.s_height = height;
    this.s_width = width;
    this.flow_sprites = [];
    for(var i = 0; i <= 1; i++) {
      this.flow_sprites[i] = new FlowSprite(this.game, this.assets, this.s_width, this.s_height);
      this.flow_sprites[i].x = i * this.flow_sprites[i].width;
      this.addChild(this.flow_sprites[i]);
    }
    this.x = 0;
    this.y = y;
    this.cnt = 0;
  },
  onenterframe: function() {
    this.x -= this.speed * (1 / this.game.fps);
    if(this.x + this.flow_sprites[this.cnt].width * (this.cnt + 1) < 0) {
      // console.log(this.x, this.flow_sprites[this.cnt].width * (this.cnt + 1), this.cnt);
      this.removeChild(this.flow_sprites[this.cnt]);
      this.flow_sprites[this.cnt] = null;
      this.cnt += 1;
      this.flow_sprites[this.cnt + 1] = new FlowSprite(this.game, this.assets, this.s_width, this.s_height);
      this.flow_sprites[this.cnt + 1].x = (this.cnt + 1) * this.flow_sprites[this.cnt + 1].width;
      this.addChild(this.flow_sprites[this.cnt + 1]);
    }
  },
  stop: function() {
    this.speed = 0;
  },
  resume: function() {
    this.speed = this.default_speed;
  }
});
