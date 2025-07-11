import { world, system, Player } from "@minecraft/server";
import { showActionBar } from "../utils/player/index";

// Interface untuk konfigurasi koordinat
interface CoordinateConfig {
   minX: number;
   maxX: number;
   minZ: number;
   maxZ: number;
   y: number;
}

interface Coordinate3D {
   x: number;
   y: number;
   z: number;
}
type ZoneType = "safe" | "exploration";

const survivalSpawnConfig: Record<string, CoordinateConfig> = {
   safeZone: {
      minX: -500,
      maxX: 500,
      minZ: -500,
      maxZ: 500,
      y: 70,
   },

   explorationZone: {
      minX: -2000,
      maxX: 2000,
      minZ: -2000,
      maxZ: 2000,
      y: 70,
   },
};

function generateRandomCoordinate(zone: ZoneType = "safe"): Coordinate3D {
   const config =
      zone === "safe" ? survivalSpawnConfig.safeZone : survivalSpawnConfig.explorationZone;

   const randomX = Math.floor(Math.random() * (config.maxX - config.minX + 1)) + config.minX;
   const randomZ = Math.floor(Math.random() * (config.maxZ - config.minZ + 1)) + config.minZ;

   return {
      x: randomX,
      y: config.y,
      z: randomZ,
   };
}

function getSafeRandomCoordinate(): Coordinate3D {
   const safePresets: Coordinate3D[] = [
      { x: 100, y: 70, z: 150 },
      { x: -200, y: 65, z: 300 },
      { x: 450, y: 68, z: -100 },
      { x: -350, y: 72, z: -250 },
      { x: 0, y: 70, z: 400 },
      { x: 250, y: 69, z: 200 },
      { x: -150, y: 71, z: -350 },
      { x: 380, y: 67, z: 50 },
   ];

   if (Math.random() < 0.7) {
      return generateRandomCoordinate("safe");
   } else {
      return safePresets[Math.floor(Math.random() * safePresets.length)];
   }
}

world.afterEvents.pressurePlatePush.subscribe(async (data) => {
   const player = data.source as Player;
   const { y } = data.source.location;

   if (y >= 182) {
      const randomCoord = getSafeRandomCoordinate();
      let counter = 3;

      const safeY = randomCoord.y + Math.floor(Math.random() * 5); // Y + 0-4 blocks

      try {
         const intervalId = system.runInterval(() => {
            if (counter > 0) {
               showActionBar(player, `Teleporting in ${counter}...`);
               counter--;
            } else {
               system.clearRun(intervalId);
               player.runCommand(`tp @s ${randomCoord.x} ${safeY} ${randomCoord.z}`);

               player.runCommand("effect @s regeneration 10 1");
               player.runCommand("effect @s blindness 5 1");
               console.log(
                  `Player ${player.name} teleported to survival at: ${randomCoord.x}, ${randomCoord.y}, ${randomCoord.z}`
               );
            }
         }, 20); // 20 ticks = 1 second
      } catch (error) {
         console.error("Teleport failed:", error);
         player.sendMessage("§cTeleport failed! Please try again.");
      }
   }
});

world.afterEvents.entitySpawn.subscribe((event) => {
   const entity = event.entity;
   if (entity.typeId === "minecraft:player") return;
   system.run(() => {
      try {
         const dimensionId = entity.dimension?.id;
         const y = entity.location?.y;

         if (dimensionId === "minecraft:overworld" && (y >= 172 || y === 182)) {
            entity.kill();
         }
      } catch (error) {
         console.warn("Failed to handle entity spawn safely:", error);
      }
   });
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
   const { player, block, dimension } = event;
   if (player.hasTag("admin") || player.hasTag("builder")) return;
   if (dimension.id.includes("overworld")) {
      if (block.location.y >= 172 || block.location.y == 182) {
         dimension.runCommand(
            `setblock ${block.location.x} ${block.location.y} ${block.location.z} air`
         );
      }
   }
});
