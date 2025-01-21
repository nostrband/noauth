import { execSync } from 'child_process'
import { existsSync } from 'fs'

const appName = 'App'
const filePath = `ios/App/Pods/Target Support Files/Pods-${appName}/Pods-${appName}-frameworks.sh`

if (existsSync(filePath)) {
  execSync(`sed -i '' 's|source="$(readlink "\${source}")"|source="$(readlink -f "\${source}")"|' ${filePath}`)
  console.log(`Updated ${filePath}`)
} else {
  console.log(`File not found: ${filePath}`)
}
