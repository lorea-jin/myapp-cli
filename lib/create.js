import path from 'path'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import ora from 'ora'
import { fileURLToPath } from 'url'

const FRAMEWORKS = [
  {
    name: 'vue',
    value: 'vue',
    variants: [
      {
        name: 'vue-js',
        value: 'vue-js',
      },
      {
        name: 'vue-ts',
        value: 'vue-ts',
      },
    ],
  },

  {
    name: 'ts-only',
    value: 'ts-only',
  },
]
let cwd = process.cwd()
let inputName
let root

// 执行创建任务
export default async function (name, option) {
  inputName = name
  let projectURL = path.join(cwd, name) // 项目文件夹地址
  let overwrite
  if (fs.existsSync(projectURL)) {
    if (option.force) {
      fs.remove(projectURL) // 移除、创建
    } else {
      // 询问用户是否确定要覆盖
      let result = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `"${name}" already exists.Remove existing files and continue?`,
        },
      ])

      overwrite = result.overwrite
      if (overwrite) {
        fs.remove(projectURL) // 移除、创建
      } else {
        ora(`Operation cancelled`).fail()
        return
      }
    }
  }
  let showName = !(name && overwrite)
  init(showName, projectURL)
}

// 创建的步骤
async function init(showName, projectURL) {
  const result = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: `Project name:`,
      default: inputName,
      when: showName,
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Select a template:',
      choices: FRAMEWORKS,
    },
    {
      type: 'list',
      name: 'variant',
      message: 'Select a variant:',
      choices: keyArr => getSubChoice(keyArr),
      when: keyArr => getSubChoice(keyArr)?.length > 0,
    },
  ])

  const { projectName, framework, variant } = result
  // 交互答案，生成模板
  root= !showName && projectURL ? projectURL : path.join(cwd, projectName) // 创建的文件夹路径
  let FileName = !showName && projectURL ? inputName : projectName //文件夹名字 给pkg设置
  let template = variant ? `template-${variant}` : `template-${framework}`
	let originFile=path.join(fileURLToPath(import.meta.url), '../../templates', template)

  fs.mkdirSync(root) // 创建文件夹
  write(originFile, root, FileName) // 写入

  runTip()
}

function getSubChoice(keyArr) {
  const { framework } = keyArr
  let obj = FRAMEWORKS.find(item => item.value == framework)
  return obj.variants ? obj.variants : null
}

function write(originFile, targetFile, FileName) {
  let files = fs.readdirSync(originFile)

  for (const file of files) {
    let src = path.join(originFile, file) // C:\Users\pc\Desktop\project-cli\templates\template-vue-js\.vscode'
    let dest = path.join(targetFile, file) // C:\Users\pc\Desktop\project-cli\app\.vscode
    copy(src, dest)
  }

  // 先全部复制过去再修改pkg
  let targetPkgUrl = path.join(targetFile, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(targetPkgUrl), 'utf-8')
  pkg.name = FileName
  fs.writeFileSync(targetPkgUrl, JSON.stringify(pkg, null, 2))
}

function copy(src, dest) {
  // 判断是否为文件夹，不是则直接复制
  let stat = fs.statSync(src)
  if (stat.isDirectory()) {
    // 是文件夹
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}
function copyDir(srcDir, destDir) {
  // 复制子目录下的文件
  // src ：.vscode文件
  // 1. dest中先创建这个子文件夹
  // 2. 循环src中的文件 复制到dest中的文件夹中
  fs.mkdirSync(destDir)
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.join(srcDir, file)
    const destFile = path.join(destDir, file)
    copy(srcFile, destFile)
  }
}

function runTip() {
  console.log('\nDone. Now run:\n')
  if (root !== cwd) console.log(`  cd ${path.relative(cwd, root)}`)
  console.log(`  npm install`)
  console.log(`  npm run dev`)
}
