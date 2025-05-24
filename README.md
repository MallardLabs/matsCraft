![Logo](https://github.com/MallardLabs/matsCraft/blob/master/assets/logo.png?raw=true)


## Prerequisites

- **Node.js**: Version 16 or higher — [Download here](https://nodejs.org/)
- **pnpm**: Package manager ([Install](https://pnpm.io/id/installation) pnpm)

## Getting Started

### Clone or Download the Repository

```bash
git clone https://github.com/mallardlabs/matscraft.git
cd matscraft
pnpm install
````

### Set Environment Variable

Edit the `.env` file (or create one if it doesn't exist), and set the path to your Bedrock server:

```env
OUTPUT_BASE=/home/mallardlabs/bedrock_server
```

---

## Commands

### Development Mode

Watches for file changes in the `scripts/`,`behavior_pack`,`resource_pack` directory and automatically copies them to the output folder:

```bash
pnpm watch
```

### Build the Project

Build the Minecraft `.mcpack` file:

```bash
pnpm build:mcpack
```
