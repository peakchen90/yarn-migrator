const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');

const ROOT = process.cwd()

function exit(message) {
  console.error(message);
  process.exit(1);
}


async function checkInstallGlobalYarn() {
  try {
    const {stdout} = await execa('yarn', ['-v'], {stdio: 'pipe'})
    console.log(stdout)
    if (!/^1\./.test(stdout)) {
      exit(`全局安装的 yarn 版本为:${stdout}，不符合要求，请重新安装: \`npm i -g yarn@1 --registry=https://registry.npmmirror.com\``)
    }
  } catch (e) {
    await execa('npm', ['i', '-g', 'yarn@1', '--registry=https://registry.npmmirror.com'], {stdio: 'inherit'})
  }
}

async function checkGitStatus() {
  const {stdout} = await execa('git', ['status', '-s'], {stdio: 'pipe'})
  if (stdout) {
    exit('发现未提交的文件，流程终止')
  }
}

async function upgrade() {
  await fs.remove(path.join(ROOT, 'package-lock.json'))
  await fs.remove(path.join(ROOT, 'node_modules'))
  await execa('yarn', ['install'], {stdio: 'inherit'})
  await execa('yarn', ['add', '-D', 'only-allow'], {stdio: 'inherit'})

  const pkgPath = path.join(ROOT, 'package.json')
  const pkg = fs.readJsonSync(pkgPath)
  if (pkg.scripts && pkg.scripts.preinstall) {
    exit('scripts `preinstall` 钩子已被占用，请先处理')
  }
  pkg.scripts = {
    ...pkg.scripts,
    preinstall: 'npx only-allow yarn'
  }
  fs.writeJsonSync(pkgPath, pkg, {
    encoding: 'utf-8',
    spaces: 2
  })
}

async function commitAndPush() {
  await execa('git', ['add', 'package.json', 'yarn.lock'], {stdio: 'inherit'})
  await execa('git', ['commit', '-m', 'chore: 工程迁移至 yarn (v1) 工具 (created by yarn-migrator)'], {stdio: 'inherit'})
  await execa('git', ['pull'], {stdio: 'inherit'})
  await execa('git', ['push'], {stdio: 'inherit'})
}

(async () => {
  await checkInstallGlobalYarn()
  await checkGitStatus()
  await upgrade()
  await commitAndPush()

  console.log('迁移成功')
})()
