#! /usr/bin/env node
'use strict';

const commander = require('commander');
const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const ora = require('ora');
const url = require('url');
const chalk = require('chalk');

const FRAMEWORKS = [
  {
    name: "vue",
    value: "vue",
    variants: [
      {
        name: "vue-js",
        value: "vue-js"
      },
      {
        name: "vue-ts",
        value: "vue-ts"
      }
    ]
  },
  {
    name: "ts-only",
    value: "ts-only"
  }
];
let cwd = process.cwd();
let inputName;
let root;
async function fn(name, option) {
  inputName = name;
  let projectURL = path.join(cwd, name);
  let overwrite;
  if (fs.existsSync(projectURL)) {
    if (option.force) {
      fs.remove(projectURL);
    } else {
      let result = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `"${name}" already exists.Remove existing files and continue?`
        }
      ]);
      overwrite = result.overwrite;
      if (overwrite) {
        fs.remove(projectURL);
      } else {
        ora(`Operation cancelled`).fail();
        return;
      }
    }
  }
  let showName = !(name && overwrite);
  init(showName, projectURL);
}
async function init(showName, projectURL) {
  const result = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: `Project name:`,
      default: inputName,
      when: showName
    },
    {
      type: "list",
      name: "framework",
      message: "Select a template:",
      choices: FRAMEWORKS
    },
    {
      type: "list",
      name: "variant",
      message: "Select a variant:",
      choices: (keyArr) => getSubChoice(keyArr),
      when: (keyArr) => getSubChoice(keyArr)?.length > 0
    }
  ]);
  const { projectName, framework, variant } = result;
  root = !showName && projectURL ? projectURL : path.join(cwd, projectName);
  let FileName = !showName && projectURL ? inputName : projectName;
  let template = variant ? `template-${variant}` : `template-${framework}`;
  let originFile = path.join(url.fileURLToPath((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.cjs', document.baseURI).href))), "../../templates", template);
  fs.mkdirSync(root);
  write(originFile, root, FileName);
  runTip();
}
function getSubChoice(keyArr) {
  const { framework } = keyArr;
  let obj = FRAMEWORKS.find((item) => item.value == framework);
  return obj.variants ? obj.variants : null;
}
function write(originFile, targetFile, FileName) {
  let files = fs.readdirSync(originFile);
  for (const file of files) {
    let src = path.join(originFile, file);
    let dest = path.join(targetFile, file);
    copy(src, dest);
  }
  let targetPkgUrl = path.join(targetFile, "package.json");
  const pkg = JSON.parse(fs.readFileSync(targetPkgUrl), "utf-8");
  pkg.name = FileName;
  fs.writeFileSync(targetPkgUrl, JSON.stringify(pkg, null, 2));
}
function copy(src, dest) {
  let stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}
function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir);
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    copy(srcFile, destFile);
  }
}
function runTip() {
  console.log("\nDone. Now run:\n");
  if (root !== cwd)
    console.log(`  cd ${path.relative(cwd, root)}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
}

commander.program.command("create <bts>").description("create a new project").option("-f, --force", "overwrite target directory if it exist").action((name, option) => {
  fn(name, option);
});
commander.program.on("--help", () => {
  console.log(`Run ${chalk.green("wow <command> --help")} for detailed usage of given command`);
});
commander.program.version(`v1.1`).usage("<command> [option]");
commander.program.parse(process.argv);
