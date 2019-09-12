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
// Send a GET request to /api/users that returns thte current auth'd user. Return: 200
router.get('/users', authUser, (req, res, next) => {
    try {
        const user = req.currentUser;
        res.status(200).json({
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress
        });
    } catch (err) {
        next(err);
    }
});

// Send a POST request to /api/users to create a user, then redirect location to '/'. Return: 201
router.post('/users', async (req, res, next) => {
    try {

        // Encrpyt Password
        const user = req.body;
        user.password = bcryptjs.hashSync(user.password);

        const email = user.emailAddress;

        const emailRegex = new RegExp(/^([A-Za-z0-9]+\.?([A-Za-z0-9]+)?)@(\w+\.?(\w+)?).(com|gov|edu|net|org)$/);
        const emailPass = emailRegex.test(email);

        if (!emailPass) {
            // Email does not match regex requirments.
            const err = new Error("Your e-mail does not follow the patttern.");
            err.status = 400;
            next(err);
        } else {
            const sameEmail = await User.findAll({
                where: {
                    emailAddress: email,
                }
            });

            if (sameEmail) {
                const err = new Error("Your e-mail is already registered.");
                err.status = 400;
                next(err);
            } else {
                // Create User
                await User.create(user);

                // Redirection w/ 201 Location
                res.status(201).json({
                    "Message": "User successfully created!",
                    "Same Email": sameEmail
                }).end();
            }


        }

    } catch (err) {
        if (err.name === 'SequelizeValidationError') {
            // Only if errors due to Sequelize Validation
            err.status = 400;
            const errors = err.errors.map(e => e.message);
            err.errors = errors;
            console.error("Opps, validation error => ", errors);
            next(err);
        } else {
            next(err);
        }
    }
});

// Course Routes

// Send a GET request to /api/courses that returns a list of courses. Returns: 200
router.get("/courses", async (req, res, next) => {
    try {
        const courses = await Course.findAll({
            include: [{
                model: User
            }],
        });

        res.status(200).json(courses);
    } catch (err) {
        next(err);
    }
});

// Send a GET request to /api/courses/:id that returns information on a singular course. Return: 200
router.get("/courses/:id", async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [{
                model: User,
            }]
        });

        if (!course) {
            const err = new Error('Could not find the specified course by ID.');
            err.status = 404;
            next(err);
        }

        res.status(200).json(course);
    } catch (err) {
        next(err);
    }
});

// Send a POST course to /api/course that will create a new course, then redirect to '/api/courses/${new course id}' via locatiton. Returns: 201
router.post('/courses', authUser, async (req, res, next) => {
    try {
        const user = req.currentUser;

        const course = req.body;
        course.userId = user.id;

        await Course.create(course);

        res.status(201).location(`/api/courses/${course.id}`).end();
    } catch (err) {
        if (err.name === 'SequelizeValidationError') {
            err.status = 400;
            const errors = err.errors.map(err => err.message);
            err.errors = errors;
            console.error('Validation errors: ', errors)
            next(err);
        } else {
            next(err);
        }
    }
});

// Send a PUT request to /api/courses/:id that will update the specified course. Returns: 204
router.put('/courses/:id', authUser, async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [{
                model: User
            }, ]
        });

        await course.update(req.body);

        res.status(204).end();
    } catch (err) {
        if (err.name === 'SequelizeValidationError') {
            err.status = 400;
            const errors = err.errors.map(err => err.message);
            err.errors = errors;
            console.error('Validation errors: ', errors)
            next(err);
        } else {
            next(err);
        }
    }
});

// TODO Fix
// Send a DELETE request to remove a specified course by ID. Return: 204
router.delete('/courses/:id', authUser, async (req, res, next) => {
    try {
        const del = await Course.findByPk(req.params.id);
        await del.destroy({}).then(() => {
            console.log(`Successfully deleted 'ID' = ${req.params.id}`);
            res.status(204).json({
                "Message": "Successful deletion!",
            }).end();
        }).catch((err) => console.error("Error was made => ", err));
    } catch (err) {
        next(err);
    }
});

module.exports = router;