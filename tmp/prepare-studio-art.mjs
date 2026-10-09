import sharp from 'file:///C:/Users/WELCOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';
const input='C:/Users/WELCOME/.codex/generated_images/01a11fe8-535a-7c43-9508-71d47d9c2241/exec-073396a5-4eb4-43c5-bcb4-0605659f2feb.png';
await sharp(input).resize({width:1100,withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toFile('public/images/paper-studio-hero.webp');console.log(await sharp('public/images/paper-studio-hero.webp').metadata());


