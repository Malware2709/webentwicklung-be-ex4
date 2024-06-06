import express from 'express';
import DB from './db.js'
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { check, checkExact, validationResult } from 'express-validator';

const PORT = process.env.PORT || 3000;

/** Zentrales Objekt für unsere Express-Applikation */
const app = express();

app.use(express.json());

/** global instance of our database */
let db = new DB();

async function initDB() {
    await db.connect();
    console.log("Connected to database");
}

// Validation rules for product
const productValidationRules = [
    check('name')
        .isString().withMessage('Name must be a string'),
    check('description')
        .isString().withMessage('Description must be a string'),
    check('price')
        .isFloat({ min: 0.00 }).withMessage('Price must be a positive float'),
    check('stock')
        .isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    //check('url')
      //  .isURL({require_valid_protocol: false, require_tld: false, require_host: false}).withMessage('URL must be a valid URL'),
    checkExact([], {locations: ['body'], message: 'No additional fields allowed'}),
];


// implement API routes

/** Return all products. 
 *  Be aware that the db methods return promises, so we need to use either `await` or `then` here! 
 * 
 */
app.get('/products', async (req, res) => {
    let products = await db.queryAll();
    res.send(products);
});


/** Return a single customer by id 
 * 
 */
app.get('/products/:id', async (req, res) => {
    return db.queryById(req.params.id)
        .then(product => {
            if (product) {
                res.send(product);
            } else {
                res.status(404).send("Product not found");
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Error querying product");
        });
});

/** Create a new customer
 *
 */
app.post('/products', productValidationRules, async (req, res) => {
    let result = validationResult(req);
    console.log(result);
    if (!result.isEmpty()) {
        return res.status(400).send(result.array());
    }
    let product = req.body;
    return db.insert(product)
        .then(product => {
            res.status(201).send(product);
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Error inserting product");
        });
});

/** Update an existing customer
 * 
 */
app.put('/products/:id', productValidationRules, async (req, res) => {
    let result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).send(result.array());
    }
    let product = req.body;
    return db.update(req.params.id, product)
        .then(product => {
            if (product) {
                res.send(product);
            } else {
                res.status(404).send("Product not found");
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Error updating product");
        });
});

/** Delete a customer by id
 *
 */
app.delete('/products/:id', async (req, res) => {
    return db.delete(req.params.id)
        .then(product => {
            if (product) {
                res.send(product);
            } else {
                res.status(404).send("Product not found");
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Error deleting product");
        });
});

let server;
initDB()
    .then(() => {
        server = app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        })
    })

export { app, server, db }
