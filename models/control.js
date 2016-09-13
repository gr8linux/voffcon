"use strict";

/* create your control collection
 	goto mongo bin folder and type:
	 mongo
	 use ardos
	 db.createCollection('controls');
	 show
*/
//tutorial : https://www.youtube.com/watch?v=Z1ktxiqyiLA
var mongoose = require('mongoose');
var fs = require('fs');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

// Control Schema
// 	Info on Schema types: http://mongoosejs.com/docs/schematypes.html
var ControlSchema = mongoose.Schema({
	name: {
		type: String
	},
	description: {
		type: String
	},
	template: {
		type: String
	},
	code: {
		type: String
	},
	 owners: [{ObjectId}],
	 users: [{ObjectId}]
});
	/*owners are users, allowed to modify or delete this control*/
var Control = module.exports = mongoose.model('Control', ControlSchema);

/*
userId Must be provided, because there needs to be at least one user who can access
and modify this Control.
*/
module.exports.create = function(newControl,  callback){
		newControl.save(callback);
};

module.exports.getByName = function(Controlname, callback){
	var query = {Controlname: Controlname};
	Control.findOne(query, callback);
};
module.exports.getByNames = function(ControlnameArray, callback){
	
	var query = {name: { $in: ControlnameArray }};
	Control.find(query, callback);
};

module.exports.getById = function(id, callback){
	Control.findById(id, callback);
};

module.exports.modify = function (id, newValues, callback){
	//$set
	var val = {$set: newValues};
	Control.update({_id: id}, val, callback);
};

module.exports.delete = function (id, callback){
	
	Control.findByIdAndRemove(id, callback);
};

//get all controls owned by the given user
module.exports.listByOwnerId = function (userId, callback){
	var query = {owners:{$elemMatch: { _id:userId }}};
	Control.find(query, callback);
};

//get only control if the user is the owner of that control
module.exports.getOwnerControlById = function (ControlId, userId, callback){
	var query = {	_id: ControlId,
					owners:{$elemMatch: { _id:userId }}
		};
	Control.find(query, callback);
};

/*if you only want users to get controls that they have access to, use this function*/
/* UNUSED FUNCTION
module.exports.getUserControldById = function (ControlId, userId, callback){
	var query = {	_id: ControlId,
					$or:[
							{users:{$elemMatch: { _id:userId }}},
							{owners:{$elemMatch: { _id:userId }}}
						]
				};
	Control.find(query, callback);
};*/

module.exports.modifyUserAccess = function (ControlId, newValues, callback){
	var query = {	_id: ControlId	};

	if (newValues.owners === undefined && newValues.users === undefined ) {
		return callback(errorToUser("No owners nor users are specified.", 400)); //nothing to change then.
	} else if ((newValues.owners !== undefined && newValues.owners.length < 1) ) {
		return callback(errorToUser("There must always be at least one owner for each control.", 403)); //there must always be at least one owner.
	}

	Control.findOne(query, function(err, control){
		if (err) {
			return callback(err); 
		} //todo: what to do, if error?  maybe throw err;

		if (newValues.owners !== undefined ){

			control.owners.splice(0,control.owners.length);
			newValues.owners.forEach(function(element) {
				control.owners.push(element);
			}, this);
		}

		if (newValues.users !== undefined){
			control.users.splice(0,control.users.length);
			newValues.users.forEach(function(element) {
				control.users.push(element);
			}, this);
		}

		control.save(callback);
	});
};