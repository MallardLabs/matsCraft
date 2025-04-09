# Matscraft Behavior Docs ( WIP )

## Block Placement & Loot Tables

```
├── biomes
│   └── overworld_biome.json
├── blocks
│   ├── common_mats_ore.block.json
│   ├── epic_mats_ore.json
│   ├── legendary_mats_ore.json
│   ├── rare_mats_ore.json
│   └── uncommon_mats_ore.json
├── docs.md
├── feature_rules
│   ├── overworld_underground_common_mats_ore_feature.json
│   ├── overworld_underground_epic_mats_ore_feature.json
│   ├── overworld_underground_legendary_mats_ore_feature.json
│   ├── overworld_underground_rare_mats_ore_feature.json
│   └── overworld_underground_uncommon_mats_ore_feature.json
├── features
│   ├── common_mats_ore_feature.json
│   ├── epic_mats_ore_feature.json
│   ├── legendary_mats_ore_feature.json
│   ├── rare_mats_ore_feature.json
│   └── uncommon_mats_ore_feature.json
├── functions
│   ├── events
│   │   ├── player
│   │   │   └── on_first_join.mcfunction
│   │   └── worlds
│   │       └── on_initialise.mcfunction
│   └── tick.json
├── items
│   └── mats.item.json
├── loot_tables
│   └── blocks
│       ├── common_mats_ore.json
│       ├── epic_mats_ore.json
│       ├── legendary_mats_ore.json
│       ├── rare_mats_ore.json
│       └── uncommon_mats_ore.json
```

### Block Placement Probability

- Source file: `biomes/overworld_biome.json`

This file defines the probability of placing custom blocks within the player's reach. It connects to the `feature_rules/*` and `features/*` files.

Example:

```json
{
  "format_version": "1.19.0",
  "minecraft:biome": {
    "description": {
      "identifier": "minecraft:plains"
    },
    "components": {
      "minecraft:features": {
        "features": [
          {
            "feature": "matscraft:common_mats_ore_feature",
            "chance": 1.0
          },
          {
            "feature": "matscraft:uncommon_mats_ore_feature",
            "chance": 0.8
          },
          {
            "feature": "matscraft:rare_mats_ore_feature",
            "chance": 0.6
          },
          {
            "feature": "matscraft:epic_mats_ore_feature",
            "chance": 0.2
          },
          {
            "feature": "matscraft:legendary_mats_ore_feature",
            "chance": 0.05
          }
        ]
      }
    }
  }
}
```

- `common_mats` has a 100% chance of spawning within player reach.
- `uncommon_mats` has an 80% chance.
- `rare_mats` has a 60% chance.
- `epic_mats` has a 20% chance.
- `legendary_mats` has a 5% chance.

### Setting Minimum Block Depth Placement

- Source file: `feature_rules/overworld_underground_common_mats_ore_feature.json`

This file determines the minimum depth at which a block can be placed and the number of blocks generated.

Example:

```json
"distribution": {
    "iterations": 10,
    "coordinate_eval_order": "zyx",
    "x": {
        "distribution": "uniform",
        "extent": [0, 16]
    },
    "y": {
        "distribution": "uniform",
        "extent": [0, 62]
    },
    "z": {
        "distribution": "uniform",
        "extent": [0, 16]
      }
    }
```

This means blocks will be placed at a minimum depth defined by the XYZ coordinates: `X 16, Y 62, Z 16`.

### Block Replacement Configuration

- Source file: `features/epic_mats_ore_feature.json`

This file configures how certain blocks in the game (e.g., `minecraft:stone`, `minecraft:deepslate`) will be replaced by `epic_mats_ore` blocks.

Example:

```json
 "minecraft:ore_feature": {
    "description": {
      "identifier": "matscraft:epic_mats_ore_feature"
    },
    "count": 5,
    "replace_rules": [
      {
        "places_block": "matscraft:epic_mats_ore",
        "may_replace": ["minecraft:stone", "minecraft:deepslate"]
      }
    ]
  }
```

The `iterations` key in the depth placement settings determines how many times the block replacement process repeats.

For example:

- If `iterations = 5` and `count = 5`, then the total replacements will be:

  `count * iterations = 25`

## Loot Tables

- Source files: `loot_tables/blocks`

This defines the items that blocks drop when broken.

Example loot table for `loot_tables/blocks/common_mats_ore.json`:

The `common_mats` block drops a random amount of `mats` items, ranging from 1 to 2.

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "matscraft:mats",
          "weight": 1,
          "functions": [
            {
              "function": "set_count",
              "count": {
                "min": 1,
                "max": 2
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Scripting

```
└── scripts
    ├── config
    │   └── config.js
    ├── events
    │   ├── blockBreak.js
    │   ├── itemPickup.js
    │   └── world.js
    ├── gui
    │   └── menu.js
    ├── main.js
    ├── scoreboard
    │   ├── Configuration.js
    │   ├── Database.js
    │   ├── DynamicDatabase.js
    │   ├── InGameConfig.js
    │   ├── main.js
    │   ├── Restful.js
    │   ├── Scoreboard.js
    │   └── Tutorial.txt
    ├── services
    │   └── apiService.js
    └── utils
        ├── get_xuid.js
        └── http.js

```
