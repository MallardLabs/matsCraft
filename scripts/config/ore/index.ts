type OreItem = {
  id: string;
  min: number;
  max: number;
};

type OreConfig = {
  common_mats_ore: OreItem[];
  uncommon_mats_ore: OreItem[];
  rare_mats_ore: OreItem[];
  epic_mats_ore: OreItem[];
  legendary_mats_ore: OreItem[];
};

const ore_config: OreConfig = {
  common_mats_ore: [
    {
      id: "matscraft:mats",
      min: 1,
      max: 2,
    },
    {
      id: "matscraft:huh",
      min: 1,
      max: 2,
    },
  ],
  uncommon_mats_ore: [
    {
      id: "matscraft:mats",
      min: 1,
      max: 3,
    },
    {
      id: "matscraft:huh",
      min: 1,
      max: 3,
    },
  ],
  rare_mats_ore: [
    {
      id: "matscraft:mats",
      min: 1,
      max: 6,
    },
    {
      id: "matscraft:huh",
      min: 1,
      max: 6,
    },
  ],
  epic_mats_ore: [
    {
      id: "matscraft:mats",
      min: 1,
      max: 6,
    },
    {
      id: "matscraft:huh",
      min: 1,
      max: 6,
    },
  ],
  legendary_mats_ore: [
    {
      id: "matscraft:mats",
      min: 5,
      max: 25,
    },
    {
      id: "matscraft:huh",
      min: 5,
      max: 25,
    },
  ],
};

export default ore_config;
