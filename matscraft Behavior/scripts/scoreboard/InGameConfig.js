import { Player, system, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import DynamicDatabase from "./DynamicDatabase";

// Default In-Game Configuration
const DefaultConfiguration = {
  Title: [">> §4Better §fScoreboard §r<<", "> §4Better §fScoreboard §r<"],
  TitleLogo: true,
  TitleCenter: true,
  UseBorder: true,
  Field: [
    // Field of Scoreboard, you can add more field || Support Lang text
    "§eName: §r{PlayerName}",
    "§eHealth: §4{PlayerHealth}",
    "§eLevel: §r{PlayerLevel}",
    "§eXP: §r{PlayerXP}",
    "§eMoney: §rFormatMoney(Scoreboard(Money))",
    "§ePosition: §r{PosX} | {PosY} | {PosZ}",
    "§eGamemode: §r{Gamemode}",
    "§eDimension: §r{Dimension}",
    "§eOnline: §r{TotalPlayer} / 20",
    "§eTPS: §r{TPS}",
    "§eDate: §r{LocaleTime} | {LocaleDate}",
    "§ePlaytime: §r{TotalPlaytimeDays}d {TotalPlaytimeHours}h {TotalPlaytimeMinutes}m {TotalPlaytimeSeconds}s",
  ],
};

// IN-GAME CONFIGURATION
const Database = new DynamicDatabase("ScoreboardConfiguration");

// Check if database is empty
world.afterEvents.worldInitialize.subscribe(() => {
  if (!Database.has("TitleConfiguration"))
    Database.set("TitleConfiguration", {
      Title: DefaultConfiguration.Title,
      TitleLogo: DefaultConfiguration.TitleLogo,
      TitleCenter: DefaultConfiguration.TitleCenter,
    });

  if (!Database.has("BorderConfiguration"))
    Database.set("BorderConfiguration", {
      UseBorder: DefaultConfiguration.UseBorder,
    });

  if (!Database.has("FieldsConfiguration"))
    Database.set("FieldsConfiguration", {
      Field: DefaultConfiguration.Field,
    });

  if (!Database.has("ConfigMode")) Database.set("ConfigMode", false);
});

/**
 * @returns { {Title: string[], TitleLogo: boolean, TitleCenter: boolean} }
 */
const getTitleConfiguration = () => {
  return Database.get("TitleConfiguration");
};

/**
 * @param{ {Title: string[], TitleLogo: boolean, TitleCenter: boolean} } data
 */
const setTitleConfiguration = (data) => {
  return Database.set("TitleConfiguration", data);
};

/**
 * @returns { {UseBorder: boolean} }
 */
const getBorderConfiguration = () => {
  return Database.get("BorderConfiguration");
};

/**
 * @param { {UseBorder: boolean} } data
 */
const setBorderConfiguration = (data) => {
  return Database.set("BorderConfiguration", data);
};

/**
 * @returns { {Field: string[]} }
 */
const getFieldsConfiguration = () => {
  return Database.get("FieldsConfiguration");
};

/**
 * @param { {Field: string[]} } data
 */
const setFieldsConfiguration = (data) => {
  return Database.set("FieldsConfiguration", data);
};

/**
 * @returns { boolean }
 */
const getConfigMode = () => {
  return Database.get("ConfigMode");
};

/**
 * @param { boolean } data
 */
const setConfigMode = (data) => {
  return Database.set("ConfigMode", data);
};

const getConfiguration = () => {
  const TitleConfig = getTitleConfiguration();
  const BorderConfig = getBorderConfiguration();
  const FieldsConfig = getFieldsConfiguration();

  return {
    ...TitleConfig,
    ...BorderConfig,
    ...FieldsConfig,
  };
};

/**
 * @param {Player} player
 */
const titleTextConfigurationUI = (player) => {
  const titleConfig = getTitleConfiguration();

  const titleUI = new ModalFormData()
    .title("Title Configuration")
    .textField("Title", "Input Title Here", titleConfig.Title[0]);

  for (let i = 1; i < 16; i++) {
    titleUI.textField(
      `Title Animation ${i}`,
      "Leave it blank for no animations",
      titleConfig.Title[i]
    );
  }

  titleUI.show(player).then((res) => {
    if (res.canceled) return;

    const mainTitle = res.formValues[0];
    if (mainTitle == "") mainTitle = titleConfig.Title[0];

    titleConfig.Title[0] = mainTitle;
    for (let i = 1; i < 16; i++) {
      const animateTitle = res.formValues[i];
      titleConfig.Title[i] =
        animateTitle.trim() !== "" ? animateTitle : undefined;
    }

    setTitleConfiguration(titleConfig);
  });
};

/**
 * @param {Player} player
 */
const titleConfigurationUI = (player) => {
  const titleConfig = getTitleConfiguration();

  const titleUI = new ActionFormData()
    .title("Title Configuration")
    .body("Configure the title settings below")

    .button(
      `Title Settings\n§8§o(${
        titleConfig.TitleLogo
          ? "Disabled due Title Logo"
          : "Click here to setting title"
      })`
    )
    .button(
      `Use Title Logo: ${
        titleConfig.TitleLogo ? "Yes" : "No"
      }\n§8§o(Click here to setting title)`
    )
    .button(
      `Center Title: ${
        titleConfig.TitleCenter ? "Yes" : "No"
      }\n§8§o(Click here to setting title)`
    );

  titleUI.show(player).then((res) => {
    if (res.canceled) return;

    switch (res.selection) {
      case 0:
        return titleTextConfigurationUI(player);
      case 1:
        titleConfig.TitleLogo = !titleConfig.TitleLogo;
        setTitleConfiguration(titleConfig);
        return titleConfigurationUI(player);
      case 2:
        titleConfig.TitleCenter = !titleConfig.TitleCenter;
        setTitleConfiguration(titleConfig);
        return titleConfigurationUI(player);
    }
  });
};

/**
 * @param {Player} player
 */
const inputField = async (player, defaultValue) => {
  const fieldsUI = new ModalFormData()
    .title("Fields Configuration")
    .textField("Input field", "Input here", defaultValue);

  fieldsUI?.submitButton("Add Field");

  const res = await fieldsUI.show(player);
  if (res.canceled) return undefined;
  return res.formValues[0];
};

/**
 * @param {Player} player
 */
const fieldsConfigurationUI = (player) => {
  const fieldsConfig = getFieldsConfiguration();

  const fieldsUI = new ActionFormData()
    .title("Fields Configuration")
    .body("Configure the fields settings below");

  for (let field of fieldsConfig.Field) {
    fieldsUI.button(`${field.slice(0, 30)}\n§8§o(Click to view)`);
  }

  fieldsUI.button("Add Field");

  fieldsUI.show(player).then(async (res) => {
    if (res.canceled) return;
    if (res.selection == fieldsConfig.Field.length) {
      const field = await inputField(player);
      if (field != undefined) {
        fieldsConfig.Field.push(field);
        setFieldsConfiguration(fieldsConfig);
        return fieldsConfigurationUI(player);
      }
    } else {
      const index = res.selection;
      const selectedField = fieldsConfig.Field[index];
      const fieldViewUI = new ActionFormData()
        .title("View Field")
        .body(`Field:\n${selectedField}\n\n§rSelect actions`)
        .button("Edit")
        .button("Remove");

      fieldViewUI.show(player).then(async (res) => {
        if (res.canceled) return;
        switch (res.selection) {
          case 0:
            const field = await inputField(player, selectedField);
            if (field != undefined) {
              fieldsConfig.Field[index] = field;
              setFieldsConfiguration(fieldsConfig);
              return fieldsConfigurationUI(player);
            }
            break;
          case 1:
            fieldsConfig.Field.splice(index, 1);
            setFieldsConfiguration(fieldsConfig);
            return fieldsConfigurationUI(player);
        }
      });
    }
  });
};

/**
 * @param {Player} player
 */
const showConfigurationUI = (player) => {
  const borderConfig = getBorderConfiguration();
  const configMode = getConfigMode();

  const ConfigurationUI = new ActionFormData()
    .title("BetterScoreboard Configuration")
    .body("Select actions")

    .button(`Title Settings\n§8§o(Click here to setting title)`)
    .button(
      `Use Border: ${
        borderConfig.UseBorder ? "Yes" : "No"
      }\n§8§o(Click here to change)`
    )
    .button(`Fields Settings\n§8§o(Click here to add or remove field)`)
    .button(
      `Config Mode: ${
        configMode ? "In Game" : "Files"
      }\n§8§o(Click here to change)`
    );

  ConfigurationUI.show(player).then((res) => {
    if (res.canceled) return;

    switch (res.selection) {
      case 0:
        return titleConfigurationUI(player);
      case 1:
        borderConfig.UseBorder = !borderConfig.UseBorder;
        setBorderConfiguration(borderConfig);
        return showConfigurationUI(player);
      case 2:
        return fieldsConfigurationUI(player);
      case 3:
        setConfigMode(!configMode);
        return showConfigurationUI(player);
    }
  });
};

system.afterEvents.scriptEventReceive.subscribe(
  ({ id, sourceEntity: player }) => {
    if (player instanceof Player) {
      if (id == "betterscoreboard:configuration") {
        return showConfigurationUI(player);
      }
    }
  },
  { namespaces: ["betterscoreboard"] }
);

export { getConfiguration, getConfigMode };
