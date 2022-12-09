const translations = require('../translations');
let pathName = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
let fs = require('fs');
const { API_URL } = require('../../config');
const jwt = require('jsonwebtoken');
var path = require("path");
const { setAsset, setMultipleAssets } = require('../../utils/formatters');
const { datediff, parseDate } = require('../../utils/duration_time');
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
const ethers = require("ethers");
const { WalletService } = require("@unlock-protocol/unlock-js");
const { networks } = require('@unlock-protocol/networks');
const ethUtil = require('ethereumjs-util');
const {
  web3, getAuthConsentMessage, generateTokenId, getContractAddress,
  getZeroAddress, getCalldata, getReplacementPattern,
  getHashMessage, getWalletAddress, tokenAddress, getEventAuthConsentMessage
} = require('../../web3');
const { response } = require('express');
const { parse } = require('path');
const abis = require("@unlock-protocol/contracts");

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

    const sql = 'SELECT * FROM users WHERE wallet_address = $1';
    const values = [address];
    connection.query(sql, values, async (err, result) => {
      if (err) {
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        if (address, result.rows.length > 0) {
          const authConsentMessage = getAuthConsentMessage(address, result.rows[0].nounce);

          const msgHex = ethUtil.bufferToHex(Buffer.from(authConsentMessage));

          // Check if signature is valid
          const msgBuffer = ethUtil.toBuffer(msgHex);
          const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
          const signatureBuffer = ethUtil.toBuffer(signature);
          const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
          const publicKey = ethUtil.ecrecover(
            msgHash,
            signatureParams.v,
            signatureParams.r,
            signatureParams.s
          );

          const addresBuffer = ethUtil.publicToAddress(publicKey);
          const address_user = ethUtil.bufferToHex(addresBuffer);

          // Check if address matches
          if (address_user.toLowerCase() === address.toLowerCase()) {

            //Update nonce
            const nonce = Math.floor((Math.random() + 1) * 100000);
            await DBQuery(`UPDATE users SET nounce = '${nonce}' WHERE wallet_address = '${address}'`);

            // Set jwt token
            const user = {
              id: result.rows[0].id,
              address: result.rows[0].wallet_address,
              status: result.rows[0].status,
              type: result.rows[0].user_type,
            }

            jwt.sign({ user }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1 days' }, async (err, result) => {
              if (err) {
                callback(false, err);
              } else {
                callback({ token: result });
              }
            })
          } else {
            // User is not authenticated
            callback(false, "You are not a valid user")
          }
        } else {
          callback(false, "Please register first")
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
      callback({ consent: authConsentMessage });
    } else {

      const wallet_details = await DBQuery(`SELECT * FROM users WHERE wallet_address = '${address}'`);
      const authConsentMessage = getAuthConsentMessage(address, wallet_details.rows[0]?.nounce);
      callback({ consent: authConsentMessage });
    }


  };
  async authConsentEventModel(event_id, wallet_id, callback) {
    if (!web3.utils.isAddress(wallet_id)) {
      callback(false, translations['en']['MSG019']);
    }
    wallet_id = web3.utils.toChecksumAddress(wallet_id);

    const wallet_details = await DBQuery(`SELECT * FROM users WHERE wallet_address = '${wallet_id}'`);

    if (wallet_details.rows.length === 0) {

      const nonce = Math.floor((Math.random() + 1) * 100000);
      const wallet_details = await DBQuery(`INSERT INTO users(wallet_address,nounce) VALUES('${wallet_id}','${nonce}')`);
      const authConsentMessage = getEventAuthConsentMessage(event_id, wallet_id, nonce);
      callback({ authenticationMessage: authConsentMessage });
    } else {

      const wallet_details = await DBQuery(`SELECT * FROM users WHERE wallet_address = '${wallet_id}'`);
      const authConsentMessage = getEventAuthConsentMessage(event_id, wallet_id, wallet_details.rows[0]?.nounce);
      callback({ authenticationMessage: authConsentMessage });
    }
  }

  async authenticateEventModel(event_id, address, signature, callback) {

    if (!web3.utils.isAddress(address)) {
      callback(false, translations['en']['MSG019']);
    }

    const sql = 'SELECT * FROM users WHERE wallet_address = $1';
    const values = [address];
    connection.query(sql, values, async (err, result) => {
      if (err) {
        callback(false, translations['en']['SYSTEM_ERROR']);
      } else {
        if (address, result.rows.length > 0) {
          const authConsentMessage = getEventAuthConsentMessage(event_id, address, result.rows[0].nounce);

          const msgHex = ethUtil.bufferToHex(Buffer.from(authConsentMessage));

          // Check if signature is valid
          const msgBuffer = ethUtil.toBuffer(msgHex);
          const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
          const signatureBuffer = ethUtil.toBuffer(signature);
          const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
          const publicKey = ethUtil.ecrecover(
            msgHash,
            signatureParams.v,
            signatureParams.r,
            signatureParams.s
          );

          const addresBuffer = ethUtil.publicToAddress(publicKey);
          const address_user = ethUtil.bufferToHex(addresBuffer);

          // Check if address matches
          if (address_user.toLowerCase() === address.toLowerCase()) {

            //Update nonce
            const nonce = Math.floor((Math.random() + 1) * 100000);
            await DBQuery(`UPDATE users SET nounce = '${nonce}' WHERE wallet_address = '${address}'`);

            //Check Token Gating
            const sql = `SELECT contract_address FROM events WHERE id = $1`;
            const values = [event_id];
            connection.query(sql, values, async (err, result) => {
              if (err) {
                Error(err);
                callback(false, translations['en']['SYSTEM_ERROR']);
              } else {
                if (result) {
                  const { contract_address } = result?.rows[0];
                  let url = 'https://rpc-mumbai.maticvigil.com/';
                  let provider = new ethers.providers.JsonRpcProvider(url);
                  const contract = new ethers.Contract(contract_address, abis.PublicLockV11.abi, provider);
                  console.log(JSON.stringify(contract_address));
                  console.log(address);
                  let tokenBalance = (await contract.balanceOf(`${address}`)).toString();
                  if (parseInt(tokenBalance) > 0) {
                    const user = {
                      id: result.rows[0].id,
                      address: result.rows[0].wallet_address,
                      status: result.rows[0].status,
                      type: result.rows[0].user_type,
                      event_id: event_id
                    }

                    jwt.sign({ user }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1 days' }, async (err, result) => {
                      if (err) {
                        callback(false, err);
                      } else {
                        callback({ token: result });
                      }
                    })
                  }
                  else {
                    callback(false, "You are not a valid user")
                  }
                }
              }
            })
            // Set jwt token

          } else {
            // User is not authenticated
            callback(false, "You are not a valid user")
          }
        } else {
          callback(false, "Please register first")
        }
      }
    })
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



  //Create event api
  async createEvent(name, expiration_duration, total_tickets, ticket_amount, callback) {

    const provider = new ethers.providers.JsonRpcProvider(networks[80001].provider);
    let walletAddress = '0x0C571d39829C399C22aEf637Ebb5f5f773b823b1';
    let privateKey = '198009b6c5b4f570e2fd2e42a8ee8ebff1a81006e9fcb9245ea089184ee1824b';
    const wallet = new ethers.Wallet(privateKey, provider);

    const walletService = new WalletService(networks);
    await walletService.connect(provider, wallet);
    const address = await walletService.createLock(
      {
        maxNumberOfKeys: 100,
        name: name,
        expirationDuration: expiration_duration,
        keyPrice: ticket_amount,
        publicLockVersion: 0 // Key price needs to be a string
      },
      {},
      (error, hash) => {
        // This is the hash of the transaction!
        console.log({ hash });
      }
    );
    if (address) {
      return address;
    }
    else {
      return translations['en']['SYSTEM_ERROR'];
    }
    // try {
    //   let data = JSON.stringify({
    //     "name": name,
    //     "expirationDuration": expiration_duration,
    //     "maxNumberOfKeys": total_tickets,
    //     "keyPrice": ticket_amount,
    //     "creator": user_name,
    //     "currencyContractAddress": currency_contract_address,
    //     "publicLockVersion": 0
    //   });

    // console.log(data, "data")
    // let config = {
    //   method: 'post',
    //   url: 'https://locksmith.unlock-protocol.com/v2/api/contracts/80001/lock',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json',
    //     'captcha': 'Q1FgMeArBZchqfYhx'
    //   },
    //   data: data
    // }
    // axios(config).then((response) => {
    //   console.log(JSON.stringify(response.data))
    //   response.send('hello');

    // }).catch((error) => console.log(error))

    // } catch (e) {
    //   console.log(e, "error")
    //   response.send('hello');
    // }

  }



  async createEventModel(user_id, name, type, category, ticket_amount, start_date, end_date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, callback) {

    // console.log(user_id, name, type, category, ticket_amount, start_date, end_date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location)

    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(start_date);
    const secondDate = new Date(end_date);
    const expiration_duration = Math.round(Math.abs((firstDate - secondDate) / oneDay));

    console.log(expiration_duration, "expiration_duration")

    const get_user_name = await DBQuery(`SELECT * FROM users WHERE id = '${user_id}'`);
    let user_name = get_user_name.rows[0].wallet_address

    // a promise
    let promise = new Promise(async function (resolve, reject) {
      const provider = new ethers.providers.JsonRpcProvider(networks[80001].provider);

      let walletAddress = process.env.WALLET_ADDRESS;
      let privateKey = process.env.PRIVATE_KEY;

      const wallet = new ethers.Wallet(privateKey, provider);

      const walletService = new WalletService(networks);
      await walletService.connect(provider, wallet);
      const address = await walletService.createLock(
        {
          maxNumberOfKeys: total_tickets,
          name: name,
          expirationDuration: parseInt(expiration_duration)*86400,
          keyPrice: ticket_amount.toString(),
          publicLockVersion: 0 // Key price needs to be a string
        },
        {},
        (error, hash) => {
          console.log({ hash });
        }
      );
      if (address) {
        resolve(address);
      }
      else {
        reject("error");
      }
      ticket_image = setAsset(ticket_image);
      gallery = setMultipleAssets(gallery);
    });

    promise.then(async (val) => {

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

      const sql = `INSERT INTO events(user_id,name,type,category,ticket_amount,date,total_tickets,short_description, long_description,ticket_image,gallery,link,host,location,status,created_at,contract_address,event_day_count) 
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,0,CURRENT_TIMESTAMP,$15,$16) RETURNING *`;

      const values = [user_id, name, type, category, ticket_amount, start_date, total_tickets, short_description, long_description, ticket_image, gallery, link, host, location, val,expiration_duration];

      connection.query(sql, values, (err, result) => {
        if (err) {
          callback(false, translations['en']['SYSTEM_ERROR']);
        } else {
          callback(result.rows);
        }
      })
    });

  };

  getAllEventsModel(id, search, callback) {
    const sql = `SELECT * FROM events `;
    connection.query(sql, (err, result) => {
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

  async createStreamModel(user_id, api_key, language, callback) {
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
      }).then(async (response) => {
        // callback(value.data);
        if (Object.keys(response.data).length > 0) {
          const { name, id, createdAt, streamKey, playbackId } = response.data;

          const dta = await DBQuery(`delete FROM streams WHERE user_id = '${user_id}'`);

          const sql = `INSERT INTO streams(api_key, stream_id,playback_id,stream_name,created_at,user_id,stream_key) VALUES('${api_key}', '${id}', '${playbackId}', '${name}',CURRENT_TIMESTAMP,'${user_id}','${streamKey}')`
          connection.query(sql, (err, _result) => {
            if (err) {
              callback(false, translations['en']['SYSTEM_ERROR']);
            } else {
              // callback(response.data);

              const sql = `select s.*,e.name from streams as s 
                left join events as e on s.user_id = e.id
                where s.user_id = '${user_id}'`;
              connection.query(sql, (err, result) => {
                console.log(err, "err")
                if (err) {
                  callback(false, translations[language]['SYSTEM_ERROR']);
                } else {
                  callback(result.rows);
                }
              })

            }
          })

        } else {
          callback(false, "Stream is not created!!!!");
        }
      })
    } catch (err) {
      console.log(err)
      callback(false, err);
    }
  }

  async getStreamModel(authorizationHeader, api_key, stream_id, language, callback) {

    try {
      const streamStatusResponse = await axios({
        method: "get",
        url: `https://livepeer.studio/api/stream/${stream_id}`,
        headers: {
          "content-type": "application/json",
          "Authorization": authorizationHeader,
          "Accept-Encoding": "gzip,deflate,compress"
        },
      }).then((streamStatusResponse) => {
        callback(streamStatusResponse.data);
      })


    } catch (error) {
      console.log(error)
      callback(error);
    }
  }

  getLivePlayBackModel(language, user_id, callback) {
    const sql = `select s.*,e.name from streams as s 
                left join events as e on s.user_id = e.id
                where s.user_id = '${user_id}'`;
    connection.query(sql, (err, result) => {
      console.log(err, "err")
      if (err) {
        callback(false, translations[language]['SYSTEM_ERROR']);
      } else {
        callback(result.rows);
      }
    })
  }

}


module.exports = userModel;
