const auth = require('../middleware/auth');
const config = require('config');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const {User, validatelogin , validatesignup ,validateChangeUser ,delete_obj } = require('../models/user');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Fawn = require('fawn')
mongoose.connect(config.get('DbString'))

var tmp_collect = 'tmp_collect_for_users_app'
Fawn.init(mongoose ,tmp_collect );


// NORMAL USERS

// get my information (
router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    return res.send(user);
});

// signup
router.post('/signup', async (req, res) => {
console.log(req.body)
  const { error } = validatesignup(req.body);
  if (error)  {
      console.log(error)
      return res.status(400).send(error.details[0].message);}

  let exist = await User.findOne({ email: req.body.email });
  if (exist)  {
      return res.status(400).send('email already registered.');
  }
  exist = await User.findOne({ fullname: req.body.fullname });
  if (exist) return res.status(400).send('fullname already registered.');
  exist = await User.findOne({ username: req.body.username });
  if (exist) return res.status(400).send('username already registered.');
  exist = await User.findOne({ phonenumber: req.body.phonenumber });
  if (exist) return res.status(400).send('phonenumber already registered.');


let user  = new User ({email: req.body.email   , username: req.body.username  ,  fullname: req.body.fullname  ,
    phonenumber:req.body.phonenumber , password : req.body.password , user_type : req.body.user_type })

  const salt = await bcrypt.genSalt(10);

  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const token = user.generateAuthToken();
    return  res.send({"_id" : user._id , "fullname" : user.fullname  ,"email" :user.email ,'x-auth-token' :token  ,"user_type" :user.user_type });

});

// Login
router.post('/login', async (req, res) => {
    console.log(req)
    if ( !("email" in req.body) || Object.keys(req.body.email).length == 0) {
        return res.status(400).send({message : " You Should provide email to do this operation "})
    }
    if ( !("password" in req.body) || Object.keys(req.body.password).length == 0) {
        return res.status(400).send({message : " You Should provide password to do this operation "})
    }
  const { error } = validatelogin(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send({ message :'Invalid email .'});

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send({ message :'Invalid Password .'});

  const token = user.generateAuthToken();
    return res.send({"_id" : user._id , "fullname" : user.fullname  ,"email" :user.email ,'x-auth-token' :token  ,"user_type" :user.user_type  });
});



module.exports = router
