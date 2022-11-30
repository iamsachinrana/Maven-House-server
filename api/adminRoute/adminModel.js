
const translations = require('../translations');
let pathName = require('path');
const util = require('util');
const { response } = require('express');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const connection = require('../../db.config');

class adminModel {

    verifyEventModel(id, status, callback) {
        const sql = `SELECT status from events where id= $1 `;
        const values = [id];
        connection.query(sql, values, (err, result) => {
            if (err) {
                ERROR(err);
                callback(false, translations['en']['SYSTEM_ERROR']);
            } else {
                if (result.rows[0].status == 1)
                    callback(false, translations['en']['MSG064']);
                else {
                    const sql = `UPDATE events SET status= $1 WHERE id=$2 `;
                    const values = [status, id];
                    connection.query(sql, values, (err, result) => {
                        if (err) {
                            ERROR(err);
                            callback(false, translations['en']['SYSTEM_ERROR']);
                        } else {
                            callback({ rowCount: result.rowCount });
                        }
                    })
                }
            }
        })
    }


}

module.exports = adminModel;