import { spawn } from "child_process";
import * as fs from "fs";
import { join } from "path";
import { Readable } from "stream";

interface MySqlDumpLogin{
    host: string;
    port: number;
    user: string;
    pass: string;
}

interface MySqlDumpLoginOutput{
    login_data: any;
    dbname: string;
    output(path: string, name: string): void;
}

class MysqlPath{
    path_sql: string;
    path_output: string;
    constructor(){
        let path_sql: string;
        let path_output: string; 
        if(process.platform == 'linux'){
            path_sql = '/usr/bin/mysqldump';
            path_output = '/tmp/backup/';
        } else {
            // windows
            path_sql = 'mysqldump.exe';
            path_output = join(__dirname) + '/backup/'
        }
        if (!fs.existsSync(path_output)){
          fs.mkdirSync(path_output);
        }
        this.path_output = path_output;
        this.path_sql = path_sql;
    }
}

export class MysqlDump extends MysqlPath implements MySqlDumpLogin, MySqlDumpLoginOutput{
    host: string;
    port: number;
    user: string;
    pass: string;
    dbname: string;
    login_data: any;

    constructor(host: string = 'localhost', port: number = 3306, user: string, pass: string, dbname: string){
        super()
        this.host = host;
        this.port = port;
        this.user = user;
        this.pass = pass;
        this.dbname = dbname;
    }

    async output(name: string, path?){
        this.login_data = await this.spawnAsPromised(spawn(this.path_sql, [
            '-u' + this.user,
            '-p' + this.pass,
            '-h' + this.host,
            '-P' + this.port,
            this.dbname,
        ]));
        let get_path = this.path_output;
        if(typeof path !== 'undefined'){
          if(!fs.existsSync(path)){
            fs.mkdirSync(path);
          }
          get_path = path;
        } else {
          get_path = this.path_output;
        }
        let get = await this.login_data;
        const data = fs.createWriteStream(get_path + `${name}.sql`);
        return new Promise((resolve, rejects) => {
            const write = Readable.from(get);
            write.pipe(data);
            write.on('finish',resolve);
            write.on('error',rejects);
            resolve(`succes backup database ${this.dbname} in directory ${get_path}${name}.sql`);
            rejects(new Error('Something is not right!'));
        });
    }
    
    private spawnAsPromised(childProcess: any): Promise<any> {
        return new Promise((resolve, reject) => {
          let stdout = "",
            stderr = "";
          childProcess.stdout.on("data", (chunk) => {
            stdout += chunk;
          });
          childProcess.stderr.on("data", (chunk) => {
            stderr += chunk;
          });
          childProcess.on("error", reject).on("close", (code) => {
            if (code === 0) {
              resolve(stdout);
            } else {
              reject(stderr);
            }
          });
        });
      }
}