import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('./public/favicon.svg')

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

Promise.all(
  sizes.map(({ name, size }) =>
    sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`./public/${name}`)
      .then(() => console.log(`✓ public/${name}`))
  )
).catch(console.error)
