const translations = require('../translations');
let pathName = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
let fs = require('fs');
const { API_URL } = require('../../config');
const jwt = require('jsonwebtoken');
var path = require("path");
const { setAsset, setMultipleAssets } = require('../../utils/formatters');
const crypto = require('crypto');
const uuid = require('uuid').v4;
const stream = require('stream');
const connection = require('../../db.config');
const { profile } = require('console');
const pipeline = util.promisify(stream.pipeline);
const isValidFileType = require('../../utils/validators');
const md5 = require('md5');
class userModel {
  getUserModel(id, callback) {
    const sql = `SELECT * FROM users where id = $1`;
    const values = [id];
    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        callback(result.rows);
      }
    });
  }

  async updateUserModel(id, first_name, last_name, email, phone, instagram_id, bio, wallet_address, filename, path, callback) {
    if (fs.existsSync(path)) {
      try {
        let ext = pathName.extname(filename);
        let fileName = path.split('uploads/')[1];
        let uniqueFileName = new Date().getTime().toString() + ext;
        await exec(`mv ${ROOT_DIR}/uploads/'${fileName}' ${ROOT_DIR}/uploads/profile_images/${uniqueFileName}`);
        filename = uniqueFileName;
      } catch (e) {
        callback(false, e);
        console.log(e, "error")
      };
    }
    const sql = `UPDATE users SET first_name= $1,last_name = $2,email= $3,phone = $4, instagram_id = $5,bio = $6 ,wallet_address=$7 ,profile_image = $8 ,updated_at = CURRENT_TIMESTAMP WHERE id = $9`;
    const values = [first_name, last_name, email, phone, instagram_id, bio, wallet_address, filename, id];
    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        callback({ rowCount: result.rowCount });
      }
    })
  }

  deleteUserModel(id, callback) {
    const sql = `DELETE FROM users WHERE id = $1`;
    const values = [id];
    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        callback({ rowCount: result.rowCount });
      }
    })
  }

  async createEventModel(user_id, name, type, category, ticket_amount, date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, stages, callback) {

    // ticket_image = setAsset(ticket_image);
    // gallery = setMultipleAssets(gallery);

    // /*ticket images*/
    // if (!ticket_image) return { error: 'ticket image is required' };
    // if (ticket_image && !isValidFileType(ticket_image, ['png', 'jpeg', 'jpg'])) return { error: 'not verified image' };
    // await exec(`mv ${ROOT_DIR}/uploads/'${ticket_image}' ${ROOT_DIR}/uploads/ticket_images/${ticket_image}`);

    // /**gallery images*/
    // if (!gallery) return { error: 'gallery images not found' };
    // for (let i = 0; i < gallery.length; i++) {
    //   if (gallery && !isValidFileType(gallery[i], ['png', 'jpeg', 'jpg', 'gif'])) return { error: 'Unsupported file format, Please upload only allowed file format' };
    // }
    // if (gallery) {
    //   for (let i = 0; i < gallery.length; i++) {
    //     await exec(`mv ${ROOT_DIR}/uploads/'${gallery[i]}' ${ROOT_DIR}/uploads/gallery_images/${gallery[i]}`);
    //   }
    // }

    const sql = `INSERT INTO events(user_id,name,type,category,ticket_amount,date,total_tickets,short_description, long_description,ticket_image,gallery,link,host,location,stages,status,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,0,CURRENT_TIMESTAMP) RETURNING *`;

    const values = [user_id, name, type, category, ticket_amount, date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, stages];

    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        callback(result.rows);
      }
    })
  };

  getAllEventsModel(id, search, callback) {
    const sql = `SELECT * FROM events WHERE user_id = $1 AND name LIKE '%${search || ''}%' ORDER BY created_at DESC LIMIT(10)`;
    connection.query(sql, [id], (err, result) => {
      if (err) {
        Error(err);
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        callback(result.rows);
      }
    })
  }


  getEventModel(id, event_id, callback) {
    const sql = `SELECT * FROM events WHERE user_id = $1 and id = $2`;
    const values = [id, event_id];
    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        callback(result.rows);
      }
    })
  }

  async updateEventModel(id, event_id, name, type, category, ticket_amount, date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, stages, callback) {

    // ticket_image = setAsset(ticket_image);
    // gallery = setMultipleAssets(gallery);

    // /*ticket images*/
    // if (!ticket_image) return { error: 'ticket image is required' };
    // if (ticket_image && !isValidFileType(ticket_image, ['png', 'jpeg', 'jpg'])) return { error: 'not verified image' };

    // await exec(`mv ${ROOT_DIR}/uploads/'${ticket_image}' ${ROOT_DIR}/uploads/ticket_images/${ticket_image}`);

    // /**gallery images*/
    // if (!gallery) return { error: 'gallery images not found' };

    // for (let i = 0; i < gallery.length; i++) {
    //   if (gallery && !isValidFileType(gallery[i], ['png', 'jpeg', 'jpg', 'gif'])) return { error: 'Unsupported file format, Please upload only allowed file format' };
    // }

    // if (gallery) {
    //   for (let i = 0; i < gallery.length; i++) {
    //     await exec(`mv ${ROOT_DIR}/uploads/'${gallery[i]}' ${ROOT_DIR}/uploads/gallery_images/${gallery[i]}`);
    //   }
    // }


    const sql = `UPDATE events SET name = $1,type = $2,category= $3,ticket_amount = $4, date = $5,total_tickets = $6 ,short_description=$7 ,long_description = $8,ticket_image = $9 , gallery = $10, link = $11, host = $12,location = $13,stages = $14, updated_at = CURRENT_TIMESTAMP WHERE id = $15 AND user_id=$16`;

    const values = [name, type, category, ticket_amount, date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, stages, event_id, id];

    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        callback({ rowCount: result.rowCount });
      }
    })
  };

  deleteEventModel(id, event_id, callback) {
    const sql = `DELETE FROM events WHERE id = $1 AND user_id = $2`;
    const values = [event_id, id];
    connection.query(sql, values, (err, result) => {
      if (err) {
        ERROR(err);
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        callback({ rowCount: result.rowCount });
      }
    });
  }

  async bookTicketModel(user_id, event_id, tickets, unit_price, service_fee, callback) {

    const total = (tickets * unit_price + service_fee * tickets);

    const sql = `INSERT INTO tickets(user_id,event_id,tickets,total,unit_price,service_fee,created_at) VALUES($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP) RETURNING *`;
    const values = [user_id, event_id, tickets, total, unit_price, service_fee];
    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        const sql = `SELECT total_tickets,remaining_tickets FROM events WHERE events.id = $1`;
        const values = [event_id];
        connection.query(sql, values, (err, _result) => {
          if (err) {
            Error(err);
            callback(false, translations['en']['SYSTEM_ERROR']);
          } else {
            let remaining_tickets;
            if (_result.rows[0].remaining_tickets === 0) {
              remaining_tickets = _result.rows[0].total_tickets - result.rows[0].tickets;
            } else if (_result.rows[0].remaining_tickets > 0) {
              remaining_tickets = _result.rows[0].remaining_tickets - result.rows[0].tickets;
            } else if (_result.rows[0].remaining_tickets < 0) {
              remaining_tickets = -1;
            }
            const sql = `UPDATE events SET remaining_tickets = $1 WHERE id = $2`;
            const values = [remaining_tickets, event_id];
            connection.query(sql, values, (err, tickets) => {
              if (err) {
                Error(err);
                callback(false, translations['en']['SYSTEM_ERROR'])
              } else {
                if (_result.rows[0].remaining_tickets < 0) {
                  callback({ result: "Tickets are not avalible...." });
                } else {
                  callback({ result: result.rows });
                }
              }
            })
          }
        })
      }
    })
  };

  async getTicketModel(user_id, ticket_id, event_id, callback) {
    const sql = `SELECT * FROM tickets WHERE id = $1 and user_id = $2 and event_id = $3`;
    const values = [ticket_id, user_id, event_id];
    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, 'SYSTEM_ERROR');
      } else {
        callback(result.rows);
      }
    })
  }

  async getTicketsModel(user_id, search, callback) {
    let sql;
    if (search === 'UPCOMING') {
      sql = `SELECT tickets,total,unit_price,service_fee,events.name,events.date,users.first_name,users.last_name FROM tickets 
             INNER JOIN events ON events.id = tickets.event_id
             INNER JOIN users ON  users.id = tickets.user_id
             WHERE tickets.user_id = $1 and events.date >= CURRENT_TIMESTAMP
             ORDER BY tickets.created_at DESC`;
    }
    else if (search === 'EXPIRED') {
      sql = `SELECT tickets,total,unit_price,service_fee,events.name,events.date,users.first_name,users.last_name FROM tickets 
             INNER JOIN events ON events.id = tickets.event_id
             INNER JOIN users ON  users.id = tickets.user_id
             WHERE tickets.user_id = $1 and events.date <= CURRENT_TIMESTAMP
             ORDER BY tickets.created_at DESC`;
    }
    const values = [user_id];
    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, 'SYSTEM_ERROR');
      } else {
        callback(result.rows);
      }
    })
  }

  async changePasswordModel(id, oldPassword, newPassword, callback) {
    const sql = `SELECT password FROM users WHERE id = $1`;
    const values = [id];
    connection.query(sql, values, (err, result) => {
      if (err) {
        Error(err);
        callback(false, translations['en']['MSG006']);
      } else if (result.rows[0].password === md5(oldPassword)) {
        const sql = `UPDATE users SET password = $1 WHERE id = $2`;
        const values = [newPassword, id]
        connection.query(sql, values, (err, _result) => {
          if (err) {
            Error(err);
            callback(false, translations['en']['SYSTEM_ERROR']);
          } else {
            callback({ message: 'password changed successfully....' });
          }
        })
      } else {
        callback({ message: 'Current password did not match..' });
      }
    });
  };

}


module.exports = userModel;
