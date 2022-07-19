const path = require('path');
const fs = require('fs-extra');
const execa = require("execa");

function exit(message) {
  console.error(message);
  process.exit(1);
}

async function checkGitStatus() {
  const {stdout} = await execa('git', ['status', '-s'], {stdio: 'pipe'})
  if (stdout) {
    exit('发现未提交的文件，流程终止')
  }
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

(async () => {
  await checkGitStatus()
  await checkInstallGlobalYarn()

  console.log('迁移成功')
})()
