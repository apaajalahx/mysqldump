import { MysqlDump } from '../src'

// example 1
// 
new MysqlDump(undefined,undefined,'root','','test_database')
    .output('data')
    .catch((error) => {
        console.log(error);
    }).then((data) => {
        console.log(data);
    })
    ;
