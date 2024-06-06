import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/products';
const MONGO_DB = process.env.MONGO_DB || 'products';

let db = null;
let collection = null;
let client = null;

export default class DB {
    /** Connect to MongoDB and open client */
    connect() {
        return MongoClient.connect(MONGO_URI)
            .then((_client) => {
                client = _client;
                db = client.db(MONGO_DB);
                collection = db.collection('products');
                console.log("Connected to MongoDB");
            })
    }

    /** Close client connection to MongoDB 
     * @returns {Promise} - Promise that resolves when connection is closed
    */
    close() {
        return client.close()
    }

    /** Query all products from database
     * @returns {Promise} - Promise that resolves to an array of products
     */
    queryAll() {
        return collection.find().toArray();
    }

    /** Query a single product by id
     * @param {string} id - id of product to query
     * @returns {Promise} - Promise that resolves to a product object 
     */
    queryById(id) {
        let _id = new ObjectId(id);
        return collection.findOne({ _id });
    }

    /** Update product by id
     * @param {string} id - id of product to update
     * @returns {Promise} - Promise with updated product
     */
    update(id, product) {
        let _id = new ObjectId(id);
        if (typeof product._id === 'string') {
            product._id = _id;
        }
        return collection
            .replaceOne({ _id }, product)
            .then(result => {
                if (result.modifiedCount === 1 || result.matchedCount === 1) {
                    return product;
                }
                else {
                    console.log('Error updating product: %o, %s', result, id);
                    throw new Error('Error updating product');
                }
            })
            .catch(err => {
                console.log('Error updating product: %o, %s', err, id);
                throw err;
            });
    }

    /** Delete product by id
     * @param {string} id - id of product to delete
     * @returns {Promise} - Promise with deleted product
     */
    delete(id) {
        let _id = new ObjectId(id);
        return collection.findOneAndDelete({ _id })
            .then(result => {
                if (result.ok) {
                    return result.value;
                } else {
                    console.log('Error deleting product: %o, %s', result, id);
                    throw new Error('Error deleting product');
                }
            })
    }

    /** Insert product
     * @param {object} product - product to insert
     * @returns {Promise} - Promise with inserted product
     */
    insert(product) {
        return collection
            .insertOne(product)
            .then(result => {
                if (result.acknowledged) {
                    product._id = result.insertedId;
                    return product;
                }
                else {
                    console.log('Error inserting product: %o', result);
                    throw new Error('Error inserting product');
                }
            });
    }
}