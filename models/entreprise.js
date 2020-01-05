const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');
const  _ = require('lodash')



const entrepriseSchema = new mongoose.Schema({

    entreprise_name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    entreprise_email :{
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true

    },
    entreprise_phonenumber : {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 14 ,
        unique : true
    },
     admin_name : {
         type: String,
         required: true,
         minlength: 5,
         maxlength: 10,
     },
    employees : [Object],
    clients : [] ,
});

const Entreprise = mongoose.model('Entreprises', entrepriseSchema);


function validateEntreprise(entreprise) {
    const schema = Joi.object({
        entreprise_name: Joi.string().min(5).max(255).required(),
        entreprise_email: Joi.string().min(5).max(255).required().email(),
        entreprise_phonenumber : Joi.string().min(8).max(14).required(),
        admin_name : Joi.string().min(5).max(10).required(),

    }) .unknown();

    return Joi.validate(entreprise, schema);
}

function ValidateClient (client) {
    const schema = Joi.object({
        client_name: Joi.string().min(5).max(255).required(),
        client_email: Joi.string().min(5).max(255).required().email(),
        client_phonenumber : Joi.string().min(8).max(14).required(),
        fullname : Joi.string().min(3).max(10).required(),

    }).unknown();
    return Joi.validate(client, schema);
}
function Validateemployee (employee) {

    const schema = Joi.object({
        entreprise_name : Joi.string().min(5).max(50).required(),
        client_name : Joi.string().min(5).max(50).required(),
        fullname : Joi.string().min(5).max(50).required(),

        employee_name: Joi.string().min(5).max(255).required(),
        employee_email: Joi.string().min(5).max(255).required().email(),
        employee_phonenumber : Joi.string().min(8).max(14).required(),

    }).unknown();
    return Joi.validate(employee, schema);
}


function covert_to_array ( object) {
    var array =[] ;
    for (let i=0 ; i<object.length  ; i++)  {
        array.push(object[i])
    }
    return array
}
function exist_or_not ( list ,id,value) {
    let newlist =  covert_to_array(list) ;
    let exist  = newlist.find( obj => obj[id] == value)
    if(exist) {return true}
    else {return  false}
}
function delete_obj (array , value) {
    let list = covert_to_array( array)

    let new_array  = _.remove(list, function(obj) {
        return obj.email != value;});


    return new_array
}

exports.Entreprise = Entreprise;
exports.validateEntreprise = validateEntreprise
exports.ValidateClient =ValidateClient
exports.Validateemployee =Validateemployee
exports.exist_or_not =exist_or_not