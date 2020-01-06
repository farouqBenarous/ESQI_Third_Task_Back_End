const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Fawn = require('fawn')
mongoose.connect(config.get('DbString'))
var tmp_collect = 'tmp_collect_for_entreprises_app'
Fawn.init(mongoose ,tmp_collect );
var {validateEntreprise , Entreprise , ValidateClient , exist_or_not , Validateemployee , ValidateWorkTime} = require("../models/entreprise")
const {User } = require('../models/user');
// game (game = ['casual','exhibition','competitive'] , time , location , duration , number_players , description , teams )


//  Entreprise Routes
// Create an entreprise
router.post('/',auth , async (req, res) => {
    console.log("body post")
    console.log(req.body)


    const { error } = validateEntreprise(req.body);
    console.log(error)
    if (error) return res.status(400).send(error.details[0].message);

    let exist = await Entreprise.findOne({ entreprise_name: req.body.entreprise_name });
    if (exist) return res.status(400).send('entreprise_name already registered.');
    exist = await Entreprise.findOne({ entreprise_email: req.body.entreprise_email });
    if (exist) return res.status(400).send('entreprise_email already registered.');
    exist = await Entreprise.findOne({ entreprise_phonenumber: req.body.entreprise_phonenumber });
    if (exist) return res.status(400).send('entreprise_phonenumber already registered.');


    let entreprise  = new Entreprise ({entreprise_name: req.body.entreprise_name.trim()   , entreprise_email: req.body.entreprise_email.trim()  ,
        entreprise_phonenumber: req.body.entreprise_phonenumber.trim() ,admin_name : req.body.admin_name.trim(),  employees : [], clients : [] })



    var task = Fawn.Task();
    task .save("entreprises", entreprise)
        .update('users', {fullname : req.body.admin_name} , {$push :{entreprises : entreprise  }  })
        .run()
        .then(  (results) =>   {return res.status(200).send({message :"Entreprise Created"}) })
        .catch( function (err)  {
            console.log(err)
            return res.status(500).send(err)
        });
});

// get details by id if not get them all if hes super admin
router.get('/',auth, async (req, res) => {

    // check if its a super admin return all the entreprises if not return null
    // if the filters are empty so return all the games

    if (_.isEmpty(req.header("entreprise_name")) && _.isEmpty(req.header("admin_name")) && req.header("user_type") === "super_admin" ){
        let  entreprise =  await Entreprise.find({})
        return res.status(200).send(entreprise)
    }

    let  response = [];
    if (!_.isEmpty(req.header("entreprise_name")) ) {
        let entreprise = await Entreprise.find({entreprise_name : req.header("entreprise_name")})

        if (_.isEmpty(entreprise)) {
            console.log("no Entreprises found with this Filters")
            return res.status(404).send('no Entreprises found with this Filters')}
        if ((entreprise[0].admin_name   !=  req.header("admin_name")) ){return res.status(401).send("You dont have the right to do this operation ")}

        response.push(entreprise)
    }
    if (!_.isEmpty(req.header("admin_name")) ) {
        let entreprise = await Entreprise.find({admin_name : req.header("admin_name")})
        response.push(entreprise)
    }

    if (_.isEmpty(response) || _.isEmpty(response[0]) ) {
        console.log("no Entreprises found with this Filters")
        return res.status(404).send('no Entreprises found with this Filters')}



    response = _.uniqBy (response ,'_id')
    return  res.status(200).send( {list_entreprsies : response[0]} )

});


//  Clients Routes
//create a client by providing the entreprise_name as querry
router.post('/clients/', auth,  async (req, res) => {
   if (_.isEmpty(req.body.entreprise_name) ){
        console.log("you have to send entreprise Name ")
        return res.status(400).send("you have to send entreprise Name ")
    }
    let exist = await Entreprise.findOne({ entreprise_name: req.body.entreprise_name });
    if (!exist){
        console.log("Entreprise does not exist   .")
        return res.status(404).send('Entreprise does not exist   .');}


    if ((exist.admin_name  !=  req.body.fullname  || req.body.user_type != "super_admin") ){
        console.log("You dont have the right to do this operation ")
        return res.status(401).send("You dont have the right to do this operation ")
    }

    const { error } = ValidateClient(req.body);
    if (error) {
        console.log(error.message)
        return res.status(400).send(error.details[0].message);}

    if (exist_or_not(exist.clients , "client_name" ,req.body.client_name)) {
        console.log("Client Already Exist")
        return res.status(400).send('Client Already Exist');}

    let client = {client_name: req.body.client_name,client_email: req.body.client_email ,client_phonenumber: req.body.client_phonenumber ,tasks : [] }

    var task = Fawn.Task();
    task.update('entreprises', {entreprise_name : req.body.entreprise_name} , {$push: {clients : client  }  }  )
        .run()
        .then(  (results) =>   {return res.status(200).send(  { message : "Client Created"} ) })
        .catch( function (err)  {return res.status(500).send(err)});

})




//  Employee Creation  Routes
router.post('/employees/',auth ,  async (req, res) => {
    console.log(req.body)
    if (_.isEmpty(req.body.employee_name) ){
        console.log("you have to send employee Name ")
        return res.status(400).send("you have to send employee Name ")
    }
    let user_exist = await User.findOne({ fullname: req.body.employee_name });
    if (!user_exist){
        console.log("Employee name  does not exist he should create an account first   .")
        return res.status(404).send('Employee name  does not exist he should create an account first    .');}

    let exist = await Entreprise.findOne({ entreprise_name: req.body.entreprise_name });
    if (!exist){
        console.log("Entreprise does not exist   .")
        return res.status(404).send('Entreprise does not exist   .');}


    if ((exist.admin_name  !=  req.body.fullname  || req.body.user_type != "super_admin") ){
        console.log("You dont have the right to do this operation ")
        return res.status(401).send("You dont have the right to do this operation ")
    }

    const { error } = Validateemployee(req.body);
    if (error) {
        console.log(error.message)
        return res.status(400).send(error.details[0].message);}




    if (!exist_or_not(exist.clients , "client_name" ,req.body.client_name)) {
        console.log("Client Does not  Exist")
        return res.status(400).send('Client Does not Exist');}



    if (exist_or_not(exist.employees , "id_work" ,req.body.entreprise_name+req.body.client_name+req.body.employee_name)) {
        console.log("id_work Already Exis id_work is comibinision of entreprise_name , client_name , employee_namet")
        return res.status(400).send('id_work Already Exist  id_work is comibinision of entreprise_name , client_name , employee_name');}

    let employee = { id_work : req.body.entreprise_name+req.body.client_name+req.body.employee_name  , employee_name: req.body.employee_name , employee_email: req.body.employee_name ,employee_phonenumber: req.body.employee_phonenumber ,client_name :req.body.client_name  , work_times : [] }


    var task = Fawn.Task();
    task.update('entreprises', {entreprise_name : req.body.entreprise_name} , {$push: {employees : employee  }  }  )
        .update('users', {fullname : req.body.employee_name} , {$push: {mywork : { id_work : req.body.entreprise_name+req.body.client_name+req.body.employee_name   ,entreprise_name : req.body.entreprise_name , client_name : req.body.client_name  , work_times : []  } } } )
        .run()
        .then(  (results) =>   {return res.status(200).send(  { message : "employee Created"} ) })
        .catch( function (err)  {return res.status(500).send(err)});
});


router.post ('/work/' , auth ,  async  (req , res) => {
    const { error } = ValidateWorkTime(req.body);
    if (error) {
        console.log(error.message)
        return res.status(400).send(error.details[0].message);}


    // Set in my profile my work is working
    let user = await User.findOne({ fullname : req.body.fullname})
    if (!user){
        console.log("User   does not exist he should create an account first   .")
        return res.status(404).send('User  does not exist he should create an account first    .');
    }

    if (!exist_or_not(user.mywork , "id_work" ,req.body.id_work)) {
        console.log("id_work Does not  Exist")
        return res.status(400).send('id_work Does not Exist');}

    let  mywork =user.mywork.filter((work)=> work.id_work == req.body.id_work)
    mywork[0].work_times.push({ time :req.body.work_time})

    // set in the entreprise
    let entreprise = await  Entreprise.findOne({entreprise_name : req.body.entreprise_name})
    if (!entreprise){
        console.log("entreprise   does not exist he should create an account first   .")
        return res.status(404).send('entreprise  does not exist he should create an account first    .'); }

    if (!exist_or_not(entreprise.employees , "id_work" ,req.body.id_work)) {
        console.log("id_work Does not  Exist")
        return res.status(400).send('id_work Does not Exist');}
    let employee = entreprise.employees.filter((emp) => {return emp.id_work == req.body.id_work})
    employee[0].work_times.push({time :req.body.work_time})


    var task = Fawn.Task();
    task.update('users', {fullname : req.body.fullname} ,  {mywork : user.mywork   }  )
        .update('entreprises', {entreprise_name : req.body.entreprise_name} , {employees : entreprise.employees} )
        .run()
        .then(  (results) =>   {console.log(results);return res.status(200).send(  { message : "Work Time Saved"} )})
        .catch( function (err)  {return res.status(500).send(err)});




})






module.exports = router
