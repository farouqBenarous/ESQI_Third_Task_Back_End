const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');
const  _ = require('lodash')

const userSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },

    username : {
     type : String,
     required : true ,
     minlength: 5,
     maxlength: 50,
     unique : true

    } ,

    fullname: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50 ,
    unique: true
  },

    phonenumber : {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 14 ,
        unique : true
},

    password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 1024
  },

    user_type :{type : String , enum : ['super_admin' , 'ceo' , 'employee']} ,

    entreprises : [Object] ,
    mywork : [Object]
});


userSchema.methods.generateAuthToken = function() { 
  const token = jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('jwtPrivateKey'));
  return token;
}

const User = mongoose.model('Users', userSchema);

function validateUserSignup(user) {
  const schema = Joi.object ( {

      email: Joi.string().min(5).max(255).required().email(),

      username : Joi.string().min(5).max(50).required(),

      fullname: Joi.string().min(5).max(50).required(),

      phonenumber : Joi.string().min(8).max(14).required(),

      password: Joi.string().min(5).max(255).required() ,

      user_type :Joi.string().min(5).max(255).required()

  }) .unknown() ;

  return Joi.validate(user, schema);
}

function validateUserLogin(user) {
  const schema = {
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required()
  };

  return Joi.validate(user, schema);

}

function covert_to_array ( object) {
    var array =[] ;
    for (let i=0 ; i<object.length  ; i++)  {
        array.push(object[i])
    }
    return array
}

function exist_or_not ( list , value) {
    let newlist =  covert_to_array(list) ;
       let exist  = newlist.find( obj => obj.email == value)
        if(exist) {return true}
        else {return  false}
}

function delete_obj (array , value) {
   let list = covert_to_array( array)

    let new_array  = _.remove(list, function(obj) {
        return obj._id != value;});


    return new_array
}


exports.User = User;
exports.validatesignup = validateUserSignup;
exports.validatelogin = validateUserLogin;

exports.covert_to_array = covert_to_array;
exports.exist_or_not = exist_or_not;

exports.delete_obj = delete_obj