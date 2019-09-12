// Init Express
const express = require('express');

// Init Router
const router = express.Router();

// Importing Models | User & Course Models
const {
    models
} = require('../db');

const {
    User,
    Course
} = models;

// Auth and Encrypt
const authUser = require("../authUser");
const bcryptjs = require("bcryptjs");

// User Routes
// Send a GET request to /api/users that returns the current auth'd user. Return: 200
router.get('/users', authUser, async (req, res, next) => {
    try {
        //* Check for current user.
        const user = await req.currentUser;
        res.json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress
        });
    } catch (err) {
        console.error('Internal Server Error (500) Occured => ', errors);
        next(err);
    }
});

// Send a POST request to /api/users to create a user, then redirect location to '/'. Return: 201
router.post('/users', async (req, res, next) => {
    try {
        const firstName = await req.body.firstName,
            lastName = await req.body.lastName,
            emailAddress = await req.body.emailAddress;

        let password = await req.body.password;

        //* Email Validation with RegExp (RegExp created by Alexander Besse)
        if (emailAddress 
            && 
            (!((/^([A-Za-z0-9]+\.?([A-Za-z0-9]+)?)@(\w+\.?(\w+)?).(com|gov|edu|net|org)/i).test(emailAddress)))) {
            const err = new Error('Invalid email address (syntax error)');
            err.status = 400;
            throw (err);
        }

        //* Checking if the email provided already exists in the database.
        const emailAlreadyExists = await User.findOne({
            where: {
                emailAddress: `${emailAddress}`
            }
        });
        if (emailAlreadyExists) {
            const err = new Error('Email already exists, try a different one.');
            err.status = 400;
            throw (err);
        }

        //* Hashing the user's provided password
        if (password) password = bcryptjs.hashSync(password);

        //* Passed all checks, create user.
        await User.create({
            firstName,
            lastName,
            emailAddress,
            password
        });

        res.location('/').status(201).end();
    } catch (err) {
        if (err.name === 'SequelizeValidationError') {
            const errors = err.errors.map((error) => error.message);
            err.status = 400;
            console.error('Validation errors: ', errors);
        }
        next(err);
    }
});

// Course Routes

// Send a GET request to /api/courses that returns a list of courses. Returns: 200
router.get("/courses", async (req, res, next) => {
    try {
        const courses = await Course.findAll({
            attributes: {
                include: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded'],
                exclude: ['userId', 'createdAt', 'updatedAt']
            },
            include: [{
                model: User,
                attributes: {
                    include: ['id', 'firstName', 'lastName', 'emailAddress'],
                    exclude: ['password', 'createdAt', 'updatedAt']
                }
            }]
        });
        res.status(200).json(courses);
    } catch (err) {
        console.error('Internal Server Error (500) Occured => ', errors);
        next(err);
    }

});

// Send a GET request to /api/courses/:id that returns information on a singular course. Return: 200
router.get("/courses/:id", async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            attributes: {
                include: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded'],
                exclude: ['userId', 'createdAt', 'updatedAt']
            },
            include: [{
                model: User,
                attributes: {
                    include: ['id', 'firstName', 'lastName', 'emailAddress'],
                    exclude: ['password', 'createdAt', 'updatedAt']
                }
            }]
        });
        if (course) res.status(200).json(course);
        else {
            console.log(`Something went wrong while trying to fetch the course #${req.params.id}!`);
            next();
        }
    } catch (err) {
        console.error('Internal Server Error (500) Occured => ', errors);
        next(err);
    }
});

// Send a POST course to /api/course that will create a new course, then redirect to '/api/courses/${new course id}' via locatiton. Returns: 201
router.post('/courses', authUser, async (req, res, next) => {
    try {
        const userId = await req.body.userId,
            description = await req.body.description,
            title = await req.body.title,
            estimatedTime = await req.body.estimatedTime,
            materialsNeeded = await req.body.materialsNeeded;

        // create the new course
        const course = await Course.create({
            userId,
            title,
            description,
            estimatedTime,
            materialsNeeded
        });

        res.location(`/${course.id}`).status(201).end();
    } catch (err) {
        if (err.name === 'SequelizeValidationError') {
            const errors = err.errors.map((error) => `SequelizeValidationError Occured => ${err}`);
            err.status = 400;
            console.error('Validation Error Occured => ', errors);
        }
        console.error('Internal Server Error (500) Occured => ', errors);
        next(err);
    }

});

// Send a PUT request to /api/courses/:id that will update the specified course. Returns: 204
router.put('/courses/:id', authUser, async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id), //* Course to be edited.
            user = await User.findByPk(req.currentUser.id); //* User that is editing.
        const targetUserExists = await User.findByPk(req.body.userId);

        if (course) {
            const errors = [];

            //? Checking if current user has a course to their user name.
            if (course.userId !== user.id) res.status(403).json({
                message: `Error => Curren user doesn't have a course.`
            });

            else {
                //* Validating Title && Description  
                if (!req.body.title || req.body.title === "")
                    errors.push(`I wasn't able to find a value for 'title', please provide one.`);
                if (!req.body.description || req.body.description === "")
                    errors.push(`I wasn't able to find a value for 'description', please provide one.`);

                //? If errors were found, exit with notify.
                if (errors.length >= 1) res.status(400).json({
                    errors
                });

                //? Checking if User is Req.Body is NULL | Validating the userId traces to a real user.
                if (!targetUserExists) res.status(400).json({
                    message: `The target user does not exist.`
                });

                //* Update the course.
                await course.update({
                    userId: req.body.userId,
                    title: req.body.title,
                    description: req.body.description,
                    estimatedTime: req.body.estimatedTime,
                    materialsNeeded: req.body.materialsNeeded
                });

                //* Exit 204.
                res.status(204).end();
            }
        } else
            next();
    } catch (err) {
        console.error('Internal Server Error (500) Occured => ', errors);
        next(err);
    }
});

// TODO Fix
// Send a DELETE request to remove a specified course by ID. Return: 204
router.delete('/courses/:id', authUser, async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id), //* Get Course to Delete.
            user = await User.findByPk(req.currentUser.id); //* Get current user for cross-check.

        if (course) {
            //* Check to see if the course belongs to the current user.
            if (course.userId !== user.id)
                //* User has auth but course does not belong to user.
                res.status(403).json({
                    message: `Error => This course doesn't belong to the current user.`,
                });
            else {
                //* Course does belong to user AND user has auth. Deleting course...
                await course.destroy();
                res.status(204).end();
            }
        } else
            next();
    } catch (err) {
        console.error('Internal Server Error (500) Occured => ', errors);
        next(err);
    }
});

module.exports = router;