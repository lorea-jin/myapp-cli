#! /usr/bin/env node

import { program } from 'commander'
import fn from '../lib/create.js'
import chalk from 'chalk'

program
  // 定义命令和参数
  .command('create <bts>')
  .description('create a new project')
  // -f or --force 为强制创建，如果创建的目录存在则直接覆盖
  .option('-f, --force', 'overwrite target directory if it exist')
  .action((name, option) => {
    fn(name, option)
  })
program.on('--help', () => {
 console.log(`Run ${chalk.green('wow <command> --help')} for detailed usage of given command`);
})





program
  // 配置版本号信息
  .version(`v1.1`)
  .usage('<command> [option]')

// 解析用户执行命令传入参数
program.parse(process.argv)



