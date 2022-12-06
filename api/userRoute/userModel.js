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
const { isValidFileType, verifySignature } = require('../../utils/validators');
const md5 = require('md5');
const axios = require('axios');
let randomstring = require("randomstring");
const {
  web3, getAuthConsentMessage, generateTokenId, getContractAddress,
  getZeroAddress, getCalldata, getReplacementPattern,
  getHashMessage, getWalletAddress, tokenAddress
} = require('../../web3');

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


  async authUserModel(address, signature, callback) {
    if (!web3.utils.isAddress(address)) {
      callback(false, translations['en']['MSG019']);
    }

    address = web3.utils.toChecksumAddress(address);

    const sql = 'SELECT * FROM users WHERE wallet_address = $1';
    const values = [address];
    connection.query(sql, values, (err, result) => {
      if (err) {
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        const authConsentMessage = getAuthConsentMessage(address, result.rows[0].nounce);

        // console.log(verifySignature(authConsentMessage, address, signature))

        if (verifySignature(authConsentMessage, address, signature)) {

          const user = {
            id: result.rows[0].id,
            address: result.rows[0].address,
            status: result.rows[0].status,
            type: result.rows[0].user_type,
          }

          jwt.sign({ user }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1 days' }, async (err, result) => {
            if (err) {
              callback(false, err);
            } else {
              // console.log(result)
              const nonce = Math.floor((Math.random() + 1) * 100000);

              //Update nonce
              await DBQuery(`UPDATE users SET nounce = '${nonce}' WHERE wallet_address = '${address}'`);

              callback({ token: result });
            }
          })
        } else {
          callback(false, translations['en']['MSG014']);
        }
      }
    })
  };

  async authConsentModel(address, callback) {
    if (!web3.utils.isAddress(address)) {
      callback(false, translations['en']['MSG019']);
    }
    address = web3.utils.toChecksumAddress(address);

    const wallet_details = await DBQuery(`SELECT * FROM users WHERE wallet_address = '${address}'`);

    if (wallet_details.rows.length === 0) {

      const nonce = Math.floor((Math.random() + 1) * 100000);
      const wallet_details = await DBQuery(`INSERT INTO users(wallet_address,nounce) VALUES('${address}','${nonce}')`);
      const authConsentMessage = getAuthConsentMessage(address, nonce);
      callback({ authConsentMessage: authConsentMessage });
    } else {

      const wallet_details = await DBQuery(`SELECT * FROM users WHERE wallet_address = '${address}'`);
      const authConsentMessage = getAuthConsentMessage(address, wallet_details.rows[0]?.nounce);
      callback({ authConsentMessage: authConsentMessage });
    }


  };


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

    ticket_image = setAsset(ticket_image);
    gallery = setMultipleAssets(gallery);

    /*ticket images*/
    if (!ticket_image) return { error: 'ticket image is required' };
    if (ticket_image && !isValidFileType(ticket_image, ['png', 'jpeg', 'jpg'])) return { error: 'not verified image' };
    await exec(`mv ${ROOT_DIR}/uploads/'${ticket_image}' ${ROOT_DIR}/uploads/ticket_images/${ticket_image}`);

    /**gallery images*/
    if (!gallery) return { error: 'gallery images not found' };
    for (let i = 0; i < gallery.length; i++) {
      if (gallery && !isValidFileType(gallery[i], ['png', 'jpeg', 'jpg', 'gif'])) return { error: 'Unsupported file format, Please upload only allowed file format' };
    }
    if (gallery) {
      for (let i = 0; i < gallery.length; i++) {
        await exec(`mv ${ROOT_DIR}/uploads/'${gallery[i]}' ${ROOT_DIR}/uploads/gallery_images/${gallery[i]}`);
      }
    }
    user_id = 56;
    const sql = `INSERT INTO events(user_id,name,type,category,ticket_amount,date,total_tickets,short_description, long_description,ticket_image,gallery,link,host,location,stages,status,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,0,CURRENT_TIMESTAMP) RETURNING *`;

    const values = [user_id, name, type, category, ticket_amount, date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, stages];

    connection.query(sql, values, (err, result) => {
      if (err) {
        console.log(err);
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

    ticket_image = setAsset(ticket_image);
    gallery = setMultipleAssets(gallery);

    /*ticket images*/
    if (!ticket_image) return { error: 'ticket image is required' };
    if (ticket_image && !isValidFileType(ticket_image, ['png', 'jpeg', 'jpg'])) return { error: 'not verified image' };

    await exec(`mv ${ROOT_DIR}/uploads/'${ticket_image}' ${ROOT_DIR}/uploads/ticket_images/${ticket_image}`);

    /**gallery images*/
    if (!gallery) return { error: 'gallery images not found' };

    for (let i = 0; i < gallery.length; i++) {
      if (gallery && !isValidFileType(gallery[i], ['png', 'jpeg', 'jpg', 'gif'])) return { error: 'Unsupported file format, Please upload only allowed file format' };
    }

    if (gallery) {
      for (let i = 0; i < gallery.length; i++) {
        await exec(`mv ${ROOT_DIR}/uploads/'${gallery[i]}' ${ROOT_DIR}/uploads/gallery_images/${gallery[i]}`);
      }
    }


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

  getUserDetailModel(id, language, callback) {
    const sql = `select * from users where id = '${id}'`;
    connection.query(sql, (err, _result) => {
      if (err) {
        callback(false, translations[language]['SYSTEM_ERROR']);
      } else {
        callback(_result.rows);
      }
    })
  }

  async createStreamModel(api_key, language, callback) {
    try {
      const AuthStr = "Bearer ".concat(api_key);

      let digit = randomstring.generate({
        length: 5,
        charset: 'alphabetic'
      });

      let streamData = {
        name: digit,
        profiles: [
          {
            name: "720p",
            bitrate: 2000000,
            fps: 30,
            width: 1280,
            height: 720,
          },
          {
            name: "480p",
            bitrate: 1000000,
            fps: 30,
            width: 854,
            height: 480,
          },
          {
            name: "360p",
            bitrate: 500000,
            fps: 30,
            width: 640,
            height: 360,
          },
        ],
      };

      const value = await axios({
        method: "post",
        url: "https://livepeer.studio/api/stream",
        data: streamData,
        headers: {
          "content-type": "application/json",
          Authorization: AuthStr,
        },
      })
      callback(value.data);
    } catch (err) {
      console.log(err)
      callback(false, err);
    }
  }

  async getStreamModel(authorizationHeader, api_key, stream_id, language, callback) {

    try {
      const streamStatusResponse = await axios.get(
        `https://livepeer.com/api/stream/${stream_id}`,
        {
          headers: {
            "content-type": "application/json",
            authorization: authorizationHeader, // API Key needs to be passed as a header
          },
        }
      );

      callback(streamStatusResponse.data);
    } catch (error) {
      console.log(error)
      callback(error);
    }
  }

}


module.exports = userModel;
