// Import Auth
const auth = require('basic-auth');

// Import BCrypt
const bcryptjs = require('bcryptjs');

// Models from DB
const {
    models
} = require('./db');
const {
    User
} = models;

const authUser = async (req, res, next) => {
    let message = null;
    const credentials = auth(req);

    if (credentials) {

        // Get user to Auth
        const user = await User.findOne({
            where: {
                emailAddress: credentials.name
            }
        });

        if (user) {

            // Confirm Auth
            const authenticated = bcryptjs.compareSync(credentials.pass, user.password);

            if (authenticated) {
                console.log(`Authentication successful for username: ${credentials.name}`);

                req.currentUser = user;
            } else {
                message = `Authentication Failed for Username => ${credentials.name}`;
            }
        } else {
            message = `Unable to find username: ${credentials.name}`
        }
    } else {
        message = 'Unable to find the auth header.';
    }

    if (message) {
        console.warn(message);
        res.status(401).json({
            message: 'Access Denied',
        });
    } else {
        next();
    }
}

module.exports = authUser;