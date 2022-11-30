const translations = require('../translations');
const jwt = require('jsonwebtoken');
const jwt_decode = require("jwt-decode");
const connection = require('../../db.config');
let pathName = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const registerUserModel = async (first_name, last_name, email, password, phone, instagram_id, bio, wallet_address, callback) => {

  // try {
  //   let ext = pathName.extname(filename);
  //   let fileName = path.split('uploads/')[1];
  //   let uniqueFileName = new Date().getTime().toString() + ext;
  //   await exec(`mv ${ROOT_DIR}/uploads/'${fileName}' ${ROOT_DIR}/uploads/profile_images/${uniqueFileName}`);
  //   filename = uniqueFileName;

  // } catch (e) {
  //   callback(false, e);
  //   console.log(e, "error")
  // };

  const sql = `SELECT id,phone,email FROM users WHERE email = $1 OR phone = $2`;
  const values = [email, phone];
  connection.query(sql, values, (err, result) => {
    if (err) {
      ERROR(err);
      callback(false, translations['en']['SYSTEM_ERROR']);
    } else if (result.rows.length > 0) {
      let possibleErrors = [
        translations['en']['MSG002'],
        translations['en']['MSG004']
      ];
      let errors = [];
      for (let i = 0; i < result.rows.length; i++) {
        if (result.rows[i].phone === phone.toString())
          errors.indexOf(possibleErrors[0]) === -1 ? errors.push(possibleErrors[0]) : true;
        if (result.rows[i].email.toLowerCase() === email.toLowerCase())
          errors.indexOf(possibleErrors[1]) === -1 ? errors.push(possibleErrors[1]) : true;
      }
      callback(false, errors[0]);
    } else {
      const sql = `INSERT INTO users(first_name,last_name,email,password,phone,instagram_id,bio, wallet_address,user_type,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'USER',CURRENT_TIMESTAMP) RETURNING *`;
      const values = [first_name, last_name, email, password, phone, instagram_id, bio, wallet_address];
      connection.query(sql, values, (err, result) => {
        if (err) {
          Error(err);
          callback(false, translations['en']['SYSTEM_ERROR']);
        } else {
          callback(result.rows);
        }
      })
    }
  })
};



const signInModel = (email, password, language, callback) => {
  //Check Valid Email and Password
  const sql = `SELECT id,first_name,email, password, user_type, status FROM users WHERE email = $1`;
  connection.query(sql, [email], (err, result) => {
    console.log(result);
    if (err) {
      callback(false, translations[language]['SYSTEM_ERROR']);
    } else if (result.rows.length == 0)
      callback(false, translations[language].MSG010);
    else if (result.rows.length > 0 && password !== result.rows[0].password)
      callback(false, translations[language].MSG011);
    else if (result.rows.length > 0 && result.rows.length === 0)
      callback(false, translations[language].MSG012);
    else {
      // For Send userData
      const user = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].first_name,
        type: result.rows[0].user_type.toUpperCase(),
        status: result.rows[0].status
      };
      // Create JWT Token
      jwt.sign({ user }, process.env.TOKEN_SECRET_KEY, { expiresIn: '10d' }, (err, token) => {
        if (err) {
          callback(false, translations[language]['SYSTEM_ERROR']);
        }
        else {
          callback({
            id: user.id,
            email: user.email,
            name: user.name,
            type: user.type,
            status: user.status,
            token,
          });
        };
      });
    };
  });
}

const gLoginModel = async (token, language, callback) => {

  try {
    var user_details = jwt_decode(token);
    //RESPONSE OF THE GIVEN TOKEN

    // {
    //   iss: 'https://accounts.google.com',
    //   nbf: 1663326014,
    //   aud: '639340849897-i2uorp976fvboil6c6qccei93v322g2g.apps.googleusercontent.com',
    //   sub: '117136157995278186121',
    //   email: 'kuldeeppatel.mongoosetech@gmail.com',
    //   email_verified: true,
    //   azp: '639340849897-i2uorp976fvboil6c6qccei93v322g2g.apps.googleusercontent.com',
    //   name: 'kuldeep patel',
    //   picture: 'https://lh3.googleusercontent.com/a/AItbvmlqbsWP4_kD3Brr2ppUGkLLLfln27HuV6_p3XiN=s96-c',
    //   given_name: 'kuldeep',
    //   family_name: 'patel',
    //   iat: 1663326314,
    //   exp: 1663329914,
    //   jti: '2d4ae358f4c477f711b97a6f81dd5cfd2b0e09d6'
    // }    

  } catch (error) {
    // callback(false, "Wrong Token");
    console.log(error)
  }
  if (user_details) {
    //check user Already exists on not
    const sql = `select user_id,user_email,user_first_name,user_type,user_status from user_master where user_email = '${user_details.email}'`;
    DBConnection.query(sql, (err, result) => {
      if (err) {
        callback(false, translations[language]["SYSTEM_ERROR"]);
      } else {

        //if user exists
        if (result.rowslength > 0) {
          const user = {
            id: result[0].user_id,
            email: result[0].email,
            name: result[0].user_first_name,
            type: result[0].user_type.toUpperCase(),
            status: result[0].user_status,

          };

          // Create JWT Token
          jwt.sign({ user }, process.env.TOKEN_SECRET_KEY, { expiresIn: "10d" }, (err, token) => {
            if (err) {
              callback(false, translations[language]["SYSTEM_ERROR"]);
            } else {
              callback({
                id: user.id,
                email: user.email,
                name: user.name,
                type: user.type,
                status: user.status,
                balance: user.balance,
                token,
              });
            }
          });
        } else {

          //if user not exists So insert data base
          const userSql = `Insert into user_master (user_first_name, user_last_name, user_email,user_password, user_phone, user_type, user_status,user_profile, created_at ) values ('${user_details.given_name}','${user_details.family_name}', '${user_details.email}',${null},${null},'${"USER"}', 1,'${user_details.picture}', CURRENT_TIMESTAMP)`;
          DBConnection.query(userSql, async (err, userResult) => {
            if (err) {
              callback(false, translations[language]["SYSTEM_ERROR"]);
            } else {
              if (userResult.insertId > 0) {
                let insert_user_id = userResult.insertId;
                const sql = `select user_id,user_email,user_first_name,user_type,user_status from user_master where user_id = '${insert_user_id}'`;
                DBConnection.query(sql, (err, result) => {
                  if (err) {
                    callback(false, translations[language]["SYSTEM_ERROR"]);
                  } else {
                    if (result.length > 0) {
                      const user = {
                        id: result[0].user_id,
                        email: result[0].user_email,
                        name: result[0].user_first_name,
                        type: result[0].user_type.toUpperCase(),
                        status: result[0].user_status,
                      };
                      // Create JWT Token
                      jwt.sign({ user }, process.env.TOKEN_SECRET_KEY, { expiresIn: "10d" }, async (err, token) => {
                        if (err) {
                          callback(
                            false,
                            translations[language]["SYSTEM_ERROR"]
                          );
                        } else {
                          callback({
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            type: user.type,
                            status: user.status,
                            token,
                          });
                        }
                      }
                      );
                    }
                  }
                })
              } else {
                callback(false, translations[language]["SYSTEM_ERROR"]);
              }
            }
          });
        }
      }
    });
  } else {
    callback(false, "Invalid Token");
  }
};


module.exports = {
  registerUserModel, signInModel, gLoginModel
};