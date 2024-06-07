import express from 'express';
import DB from './db.js'
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { check, checkExact, validationResult } from 'express-validator';

const PORT = process.env.PORT || 3000;

/** Zentrales Objekt für unsere Express-Applikation */
const app = express();

app.use(express.json());

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Produkt API',
            version: '1.0.0',
            description: 'Produkt API Dokumentation',
        },
        servers: [
            {
                url: 'http://127.0.0.1:3000',
            },
        ],
        components: {
            schemas: {
                Produkt: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '6439519dadb77c080671a573',
                        },
                        name: {
                            type: 'string',
                            example: 'Mr. Krabs',
                        },
                        description: {
                            type: 'string',
                            example: 'Geiziger Restaurantbesitzer',
                        },
                        price: {
                            type: 'float',
                            example: '16.50',
                        },
                        stock: {
                            type: 'integer',
                        },
                        image_url: {
                            type: 'string',
                            example: 'https://www.google.com',
                        }
                    },
                },
            },
        },
    },
    apis: ['./index.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
    check('image_url')
        .isURL({require_valid_protocol: false, require_tld: false, require_host: false}).withMessage('URL must be a valid URL'),
    checkExact([], {locations: ['body'], message: 'No additional fields allowed'}),
];


// implement API routes

/** Return all products. 
 *  Be aware that the db methods return promises, so we need to use either `await` or `then` here! 
 * 
 * @swagger
 * /products:
 *  get:
 *    summary: Gibt alle Produkte zurück
 *    tags: [Produkte]
 *    responses:
 *      '200':
 *        description: Eine Liste aller Produkte
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Produkt'
 */
app.get('/products', async (req, res) => {
    let products = await db.queryAll();
    res.status(200).send(products);
});


/** Return a single customer by id 
 * 
 * @swagger
 * /products/{id}:
 *  get:
 *    summary: Gibt ein bestimmtes Produkt anhand der mitgegebenen ID aus
 *    tags: [Produkte]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *          required: true
 *          description: Die ID des Produkts
 *    responses:
 *      '200':
 *        description: Das gesuchte Produkt
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Produkt'
 *      '404':
 *        description: Produkt wurde nicht gefunden
 *      '500':
 *        description: Ein Fehler ist aufgetreten
 */
app.get('/products/:id', async (req, res) => {
    return db.queryById(req.params.id)
        .then(product => {
            if (product) {
                res.status(200).send(product);
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
 * @swagger
 * /products:
 *  post:
 *    summary: Erstellt ein neues Produkt
 *    tags: [Produkte]
 *    requestBody:
 *     required: true
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/Produkt'
 *    responses:
 *     '201':
 *       description: Das erstellte Produkt
 *       content:
 *        application/json:
 *         schema:
 *          $ref: '#/components/schemas/Produkt'
 *     '400':
 *       description: Ungültige Eingabe
 *     '500':
 *       description: Ein Fehler ist aufgetreten
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
 * @swagger
 * /products/{id}:
 *  put:
 *   summary: Aktualisiert ein bestehendes Produkt
 *   tags: [Produkte]
 *   parameters:
 *    - in: path
 *      name: id
 *      schema:
 *       type: string
 *       required: true
 *       description: Die ID des Produkts
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/Produkt'
 *   responses:
 *    '200':
 *     description: Das aktualisierte Produkt
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/Produkt'
 *    '404':
 *     description: Produkt wurde nicht gefunden
 *    '400':
 *     description: Ungültige Eingabe
 *    '500':
 *     description: Ein Fehler ist aufgetreten
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
 * @swagger
 * /products/{id}:
 *  delete:
 *   summary: Löscht ein Produkt
 *   tags: [Produkte]
 *   parameters:
 *    - in: path
 *      name: id
 *      schema:
 *       type: string
 *       required: true
 *       description: Die ID des zu löschenden Produkts
 *   responses:
 *    '200':
 *     description: Das gelöschte Produkt
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/Produkt'
 *    '404':
 *     description: Produkt wurde nicht gefunden
 *    '500':
 *     description: Ein Fehler ist aufgetreten
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
